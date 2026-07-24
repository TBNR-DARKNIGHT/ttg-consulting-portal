from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from supabase import Client

from app.config import settings
from app.dependencies import get_current_user, get_supabase, get_supabase_public
from app.models.schemas import ApiResponse, ClerkUser

logger = structlog.get_logger()

router = APIRouter()


class StorageUrlResponse(BaseModel):
    bucket: str
    path: str
    is_paid: bool
    url: str
    expires_in: int | None = None


@router.get("/dev/storage/public-url", response_model=ApiResponse[StorageUrlResponse])
async def dev_storage_public_url(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    supabase: Client = Depends(get_supabase_public),
) -> ApiResponse[StorageUrlResponse]:
    """
    Dev helper to test storage pulls:
    - Public bucket/resource: returns a public URL (no auth required).
    """
    if not settings.is_development:
        raise HTTPException(status_code=404, detail="Not found")

    public = supabase.storage.from_(bucket).get_public_url(path)
    if isinstance(public, dict):
        url = public.get("publicUrl") or public.get("publicURL") or public.get("public_url")
    else:
        url = str(public)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to create public URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=bucket,
            path=path,
            is_paid=False,
            url=url,
        )
    )


@router.get("/dev/storage/public-download")
async def dev_storage_public_download(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    supabase: Client = Depends(get_supabase_public),
) -> Response:
    """
    Dev helper to prove the backend can download bytes from a public bucket/path.
    """
    if not settings.is_development:
        raise HTTPException(status_code=404, detail="Not found")

    data = supabase.storage.from_(bucket).download(path)
    if not isinstance(data, (bytes, bytearray)):
        raise HTTPException(status_code=500, detail="Unexpected download response")

    # Assume PDF for your current use-case; harmless for dev smoke tests.
    return Response(content=bytes(data), media_type="application/pdf")


@router.get("/dev/storage/paid-url", response_model=ApiResponse[StorageUrlResponse])
async def dev_storage_paid_url(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    expires_in: int = 300,
    _user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> ApiResponse[StorageUrlResponse]:
    """
    Dev helper for paid resources:
    - Requires auth (Clerk JWT or DEV_BEARER_TOKEN when enabled).
    - Returns a signed URL so the backend controls access.
    """
    if not settings.is_development:
        raise HTTPException(status_code=404, detail="Not found")

    signed = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
    url = None
    if isinstance(signed, dict):
        url = signed.get("signedURL") or signed.get("signedUrl") or signed.get("signed_url")
    else:
        url = str(signed)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to create signed URL")

    return ApiResponse(
        data=StorageUrlResponse(
            bucket=bucket,
            path=path,
            is_paid=True,
            url=url,
            expires_in=expires_in,
        )
    )


@router.get("/dev/storage/paid-download")
async def dev_storage_paid_download(
    bucket: str,
    path: str = Query(..., description="Path inside the bucket, e.g. 'docs/sample.pdf'"),
    _user: ClerkUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> Response:
    """
    Dev helper to prove the backend can download bytes for a paid resource
    (after passing backend auth).
    """
    if not settings.is_development:
        raise HTTPException(status_code=404, detail="Not found")

    data = supabase.storage.from_(bucket).download(path)
    if not isinstance(data, (bytes, bytearray)):
        raise HTTPException(status_code=500, detail="Unexpected download response")

    return Response(content=bytes(data), media_type="application/pdf")
