from __future__ import annotations

import asyncio

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_optional_current_user, get_supabase_public
from app.models.resource import ResourceItem
from app.models.schemas import ApiResponse, ClerkUser
from app.routers.resources import find_resource
from app.services.admin_resource_uploads import pdf_thumbnail_path
from app.services.course_access_policy import can_user_access_resource, is_public_resource
from app.services.entitlements import EntitlementServiceError

logger = structlog.get_logger()

router = APIRouter()

# Private Supabase bucket: keep it non-public; access only via these endpoints + service role.
PAID_STORAGE_BUCKET = "resources-paid"
PUBLIC_STORAGE_BUCKET = "resources-public"


def _storage_url(result: object, keys: tuple[str, ...]) -> str:
    if isinstance(result, dict):
        return next((str(result[key]) for key in keys if result.get(key)), "")
    return str(result)


async def _create_public_url(supabase: Client, bucket: str, path: str) -> str:
    result = await asyncio.to_thread(lambda: supabase.storage.from_(bucket).get_public_url(path))
    return _storage_url(result, ("publicUrl", "publicURL", "public_url"))


async def _create_signed_url(
    supabase: Client,
    bucket: str,
    path: str,
    expires_in: int,
) -> str:
    result = await asyncio.to_thread(
        lambda: supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    )
    return _storage_url(result, ("signedURL", "signedUrl", "signed_url"))


def _require_paid_bucket(bucket: str) -> None:
    if bucket != PAID_STORAGE_BUCKET:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid bucket for paid storage (expected {PAID_STORAGE_BUCKET})",
        )


def _get_public_pdf(resource_id: str) -> ResourceItem:
    resource = find_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.type != "pdf" or not is_public_resource(resource):
        raise HTTPException(status_code=400, detail="Resource is not a public PDF")
    if resource.bucket != PUBLIC_STORAGE_BUCKET or not resource.file_path:
        raise HTTPException(status_code=404, detail="Public PDF is not provisioned")
    return resource


async def _get_public_pdf_async(resource_id: str) -> ResourceItem:
    return await asyncio.to_thread(_get_public_pdf, resource_id)


async def _get_authorized_paid_pdf(resource_id: str, user: ClerkUser | None) -> ResourceItem:
    resource = await asyncio.to_thread(find_resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.type != "pdf" or resource.access != "paid":
        raise HTTPException(status_code=400, detail="Resource is not a paid PDF")
    if not resource.bucket or not resource.file_path or not resource.course_id:
        raise HTTPException(status_code=404, detail="Paid PDF is not provisioned")
    _require_paid_bucket(resource.bucket)
    try:
        allowed = await can_user_access_resource(resource, user)
    except EntitlementServiceError as exc:
        raise HTTPException(status_code=503, detail="Course access unavailable") from exc
    if not allowed:
        raise HTTPException(status_code=403, detail="Course access required")
    return resource


class StorageUrlResponse(BaseModel):
    bucket: str
    path: str
    is_paid: bool
    url: str
    expires_in: int | None = None


@router.get("/storage/public-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_public_url(
    resource_id: str = Query(..., description="Public PDF resource id"),
    supabase: Client = Depends(get_supabase_public),
) -> ApiResponse[StorageUrlResponse]:
    resource = await _get_public_pdf_async(resource_id)
    url = await _create_public_url(supabase, resource.bucket, resource.file_path)
    if not url:
        raise ValueError("Failed to create public URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=resource.bucket,
            path=resource.file_path,
            is_paid=False,
            url=url,
        )
    )


@router.get("/storage/public-download")
async def storage_public_download(
    resource_id: str = Query(..., description="Public PDF resource id"),
    supabase: Client = Depends(get_supabase_public),
) -> Response:
    resource = await _get_public_pdf_async(resource_id)
    data = await asyncio.to_thread(
        lambda: supabase.storage.from_(resource.bucket).download(resource.file_path)
    )
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    filename = resource.file_path.rsplit("/", 1)[-1]
    return Response(
        content=bytes(data),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/storage/paid-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_paid_url(
    resource_id: str = Query(..., description="Paid PDF resource id"),
    expires_in: int = 300,
    user: ClerkUser | None = Depends(get_optional_current_user),
    supabase: Client = Depends(get_supabase_public),
) -> ApiResponse[StorageUrlResponse]:
    resource = await _get_authorized_paid_pdf(resource_id, user)
    url = await _create_signed_url(supabase, resource.bucket, resource.file_path, expires_in)
    if not url:
        raise ValueError("Failed to create signed URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=resource.bucket,
            path=resource.file_path,
            is_paid=True,
            url=url,
            expires_in=expires_in,
        )
    )


@router.get("/storage/thumbnail-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_thumbnail_url(
    resource_id: str = Query(..., description="PDF resource id"),
    expires_in: int = 900,
    user: ClerkUser | None = Depends(get_optional_current_user),
    supabase: Client = Depends(get_supabase_public),
) -> ApiResponse[StorageUrlResponse]:
    resource = await asyncio.to_thread(find_resource, resource_id)
    if not resource or resource.type != "pdf":
        raise HTTPException(status_code=404, detail="PDF resource not found")
    if not resource.file_path or not resource.bucket:
        raise HTTPException(status_code=404, detail="PDF thumbnail is not provisioned")

    if resource.access == "paid":
        resource = await _get_authorized_paid_pdf(resource_id, user)
    elif resource.bucket != PUBLIC_STORAGE_BUCKET:
        raise HTTPException(status_code=400, detail="Invalid public storage bucket")

    path = pdf_thumbnail_path(resource.file_path)
    if resource.access == "paid":
        url = await _create_signed_url(supabase, resource.bucket, path, expires_in)
    else:
        url = await _create_public_url(supabase, resource.bucket, path)
    if not url:
        raise ValueError("Failed to create thumbnail URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=resource.bucket,
            path=path,
            is_paid=resource.access == "paid",
            url=url,
            expires_in=expires_in if resource.access == "paid" else None,
        )
    )


@router.get("/storage/paid-download")
async def storage_paid_download(
    resource_id: str = Query(..., description="Paid PDF resource id"),
    user: ClerkUser | None = Depends(get_optional_current_user),
    supabase: Client = Depends(get_supabase_public),
) -> Response:
    resource = await _get_authorized_paid_pdf(resource_id, user)
    data = await asyncio.to_thread(
        lambda: supabase.storage.from_(resource.bucket).download(resource.file_path)
    )
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    filename = resource.file_path.rsplit("/", 1)[-1]
    return Response(
        content=bytes(data),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
