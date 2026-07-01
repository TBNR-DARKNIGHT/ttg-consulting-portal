from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.config import settings
from app.dependencies import get_current_user
from app.models.schemas import ApiResponse, ClerkUser
from app.routers.resources import find_resource
from app.services.entitlements import EntitlementServiceError, has_course_access
from app.services.mux_playback_token import mint_mux_video_playback_token

logger = structlog.get_logger()

router = APIRouter()


class MuxPlaybackTokenOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    token: str
    expires_at: int


@router.get("/playback/mux-token", response_model=ApiResponse[MuxPlaybackTokenOut])
async def mux_playback_token(
    resource_id: str = Query(..., description="Dashboard resource id, e.g. res-009"),
    expires_in: int = Query(3600, ge=60, le=86400, description="JWT lifetime in seconds"),
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[MuxPlaybackTokenOut]:
    """
    Mint a Mux Video playback JWT for catalog entries that use **signed** playback IDs.

    Public playback IDs do not need a token; use Mux Player with `playbackId` only.
    """
    resource = find_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.type != "video":
        raise HTTPException(status_code=400, detail="Resource is not a video")

    if not resource.mux_playback_signed:
        raise HTTPException(
            status_code=400,
            detail="This video uses a public Mux playback policy; no token is required",
        )

    if not resource.mux_playback_id:
        raise HTTPException(
            status_code=404,
            detail="Video playback is not provisioned for this resource",
        )

    if resource.access == "paid":
        if not resource.course_id:
            raise HTTPException(status_code=500, detail="Resource course is not configured")
        if user.internal_user_id is None:
            raise HTTPException(status_code=503, detail="User profile unavailable")
        try:
            allowed = await has_course_access(user.internal_user_id, resource.course_id)
        except EntitlementServiceError as exc:
            raise HTTPException(status_code=503, detail="Course access unavailable") from exc
        if not allowed:
            raise HTTPException(status_code=403, detail="Course access required")

    kid = settings.mux_signing_key_id.strip()
    secret = settings.mux_signing_private_key.strip()
    if not kid or not secret:
        logger.warning("Mux signing keys not configured; cannot mint playback token")
        raise HTTPException(
            status_code=503,
            detail="Mux playback signing is not configured on the server",
        )

    try:
        token, exp = mint_mux_video_playback_token(
            playback_id=resource.mux_playback_id,
            signing_key_id=kid,
            private_key_material=secret,
            expires_in_seconds=expires_in,
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception:
        logger.exception("Failed to mint Mux playback token")
        raise HTTPException(status_code=500, detail="Failed to mint playback token") from None

    return ApiResponse(data=MuxPlaybackTokenOut(token=token, expires_at=exp))
