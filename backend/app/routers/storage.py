from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_current_user, get_supabase, get_supabase_public
from app.models.schemas import ApiResponse, ClerkUser

logger = structlog.get_logger()

router = APIRouter()

# Private Supabase bucket: keep it non-public; access only via these endpoints + service role.
PAID_STORAGE_BUCKET = "resources-paid"


def _require_paid_bucket(bucket: str) -> None:
    if bucket != PAID_STORAGE_BUCKET:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid bucket for paid storage (expected {PAID_STORAGE_BUCKET})",
        )


class StorageUrlResponse(BaseModel):
    bucket: str
    path: str
    is_paid: bool
    url: str
    expires_in: int | None = None


@router.get("/storage/public-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_public_url(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    supabase: Client = Depends(get_supabase_public),
) -> ApiResponse[StorageUrlResponse]:
    public = supabase.storage.from_(bucket).get_public_url(path)
    if isinstance(public, dict):
        url = public.get("publicUrl") or public.get("publicURL") or public.get("public_url")
    else:
        url = str(public)
    if not url:
        raise ValueError("Failed to create public URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=bucket,
            path=path,
            is_paid=False,
            url=url,
        )
    )


@router.get("/storage/public-download")
async def storage_public_download(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    supabase: Client = Depends(get_supabase_public),
) -> Response:
    data = supabase.storage.from_(bucket).download(path)
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    return Response(content=bytes(data), media_type="application/pdf")


@router.get("/storage/paid-url", response_model=ApiResponse[StorageUrlResponse])
async def storage_paid_url(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    expires_in: int = 300,
    _user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> ApiResponse[StorageUrlResponse]:
    _require_paid_bucket(bucket)
    signed = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    if isinstance(signed, dict):
        url = signed.get("signedURL") or signed.get("signedUrl") or signed.get("signed_url")
    else:
        url = str(signed)
    if not url:
        raise ValueError("Failed to create signed URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=bucket,
            path=path,
            is_paid=True,
            url=url,
            expires_in=expires_in,
        )
    )


@router.get("/storage/paid-download")
async def storage_paid_download(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    _user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> Response:
    _require_paid_bucket(bucket)
    data = supabase.storage.from_(bucket).download(path)
    if not isinstance(data, (bytes, bytearray)):
        raise ValueError("Unexpected download response")
    return Response(content=bytes(data), media_type="application/pdf")

