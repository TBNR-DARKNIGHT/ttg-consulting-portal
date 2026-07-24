from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.dependencies import get_current_user
from app.models.schemas import ApiResponse, ClerkUser
from app.services.edxp_authz import EdxpAuthzError
from app.services.edxp_authz import authorize as edxp_authorize

logger = structlog.get_logger()

router = APIRouter()


class DevAuthorizeRequest(BaseModel):
    action: str


class DevAuthorizeResponse(BaseModel):
    allowed: bool | None = None
    roles: list[str] | None = None
    reason: str | None = None
    cache_ttl_seconds: int | None = None


@router.post("/dev/authz/authorize", response_model=ApiResponse[DevAuthorizeResponse])
async def dev_authz_authorize(
    body: DevAuthorizeRequest,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[DevAuthorizeResponse]:
    if not settings.is_development:
        raise HTTPException(status_code=404, detail="Not found")

    try:
        decision = await edxp_authorize(
            subject=user.clerk_id,
            provider="clerk",
            action=body.action,
            org_id=settings.edxp_org_id,
        )
    except EdxpAuthzError as e:
        logger.warning("Dev authz call failed", error=str(e))
        raise HTTPException(status_code=503, detail="Authorization service unavailable")

    return ApiResponse(
        data=DevAuthorizeResponse(
            allowed=decision.get("allowed"),
            roles=decision.get("roles"),
            reason=decision.get("reason"),
            cache_ttl_seconds=decision.get("cache_ttl_seconds"),
        )
    )
