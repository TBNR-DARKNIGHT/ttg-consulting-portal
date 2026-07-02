from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_current_user, get_supabase, get_supabase_public
from app.models.enums import UserRole
from app.models.resource import ResourceItem
from app.models.schemas import ApiResponse, ClerkUser
from app.routers.resources import find_resource
from app.services.entitlements import EntitlementServiceError, has_course_access
from app.services.admin_resource_uploads import pdf_thumbnail_path

logger = structlog.get_logger()

router = APIRouter()

# Private Supabase bucket: keep it non-public; access only via these endpoints + service role.
PAID_STORAGE_BUCKET = "resources-paid"
PUBLIC_STORAGE_BUCKET = "resources-public"


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
    if resource.type != "pdf" or resource.access == "paid":
        raise HTTPException(status_code=400, detail="Resource is not a public PDF")
    if resource.bucket != PUBLIC_STORAGE_BUCKET or not resource.file_path:
        raise HTTPException(status_code=404, detail="Public PDF is not provisioned")
    return resource


async def _get_authorized_paid_pdf(resource_id: str, user: ClerkUser) -> ResourceItem:
    resource = find_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.type != "pdf" or resource.access != "paid":
        raise HTTPException(status_code=400, detail="Resource is not a paid PDF")
    if not resource.bucket or not resource.file_path or not resource.course_id:
        raise HTTPException(status_code=404, detail="Paid PDF is not provisioned")
    _require_paid_bucket(resource.bucket)
    if user.role is UserRole.ADMIN:
        return resource
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    try:
        allowed = await has_course_access(user.internal_user_id, resource.course_id)
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
    resource = _get_public_pdf(resource_id)
    public = supabase.storage.from_(resource.bucket).get_public_url(resource.file_path)
    if isinstance(public, dict):
        url = public.get("publicUrl") or public.get("publicURL") or public.get("public_url")
    else:
        url = str(public)
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
    resource = _get_public_pdf(resource_id)
    data = supabase.storage.from_(resource.bucket).download(resource.file_path)
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    return Response(content=bytes(data), media_type="application/pdf")


@router.get("/storage/paid-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_paid_url(
    resource_id: str = Query(..., description="Paid PDF resource id"),
    expires_in: int = 300,
    user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> ApiResponse[StorageUrlResponse]:
    resource = await _get_authorized_paid_pdf(resource_id, user)
    signed = supabase.storage.from_(resource.bucket).create_signed_url(
        resource.file_path, expires_in
    )
    if isinstance(signed, dict):
        url = signed.get("signedURL") or signed.get("signedUrl") or signed.get("signed_url")
    else:
        url = str(signed)
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
    user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> ApiResponse[StorageUrlResponse]:
    resource = find_resource(resource_id)
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
        result = supabase.storage.from_(resource.bucket).create_signed_url(path, expires_in)
        if isinstance(result, dict):
            url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
        else:
            url = str(result)
    else:
        result = supabase.storage.from_(resource.bucket).get_public_url(path)
        if isinstance(result, dict):
            url = result.get("publicUrl") or result.get("publicURL") or result.get("public_url")
        else:
            url = str(result)
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
    user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> Response:
    resource = await _get_authorized_paid_pdf(resource_id, user)
    data = supabase.storage.from_(resource.bucket).download(resource.file_path)
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    return Response(content=bytes(data), media_type="application/pdf")

