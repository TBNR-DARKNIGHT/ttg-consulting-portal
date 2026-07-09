from __future__ import annotations

import structlog
from fastapi import APIRouter, HTTPException, Request

from app.dependencies import get_current_user
from app.models.analytics import AnalyticsCaptureOut, AnalyticsEventsIn
from app.models.schemas import ApiResponse, ClerkUser
from app.services.analytics import AnalyticsCaptureError, capture_events

router = APIRouter()
logger = structlog.get_logger()


async def _optional_current_user(request: Request) -> ClerkUser | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    try:
        return await get_current_user(request)
    except HTTPException:
        logger.info("Analytics request included invalid auth; storing anonymously")
        return None


@router.post("/analytics/events", response_model=ApiResponse[AnalyticsCaptureOut])
async def capture_analytics_events(
    body: AnalyticsEventsIn,
    request: Request,
) -> ApiResponse[AnalyticsCaptureOut]:
    user = await _optional_current_user(request)
    try:
        accepted = await capture_events(
            body.events,
            user=user,
            user_agent=request.headers.get("User-Agent"),
        )
    except AnalyticsCaptureError as exc:
        raise HTTPException(status_code=503, detail="Analytics capture unavailable") from exc
    return ApiResponse(data=AnalyticsCaptureOut(accepted=accepted))
