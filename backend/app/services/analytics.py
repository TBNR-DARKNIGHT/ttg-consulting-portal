from __future__ import annotations

import asyncio

import structlog
from supabase import Client

from app.models.analytics import AnalyticsEventIn
from app.models.schemas import ClerkUser
from app.services.supabase import get_client

logger = structlog.get_logger()


class AnalyticsCaptureError(RuntimeError):
    pass


def _clean_metadata(value: object, *, depth: int = 0) -> object:
    if depth > 4:
        return None
    if value is None or isinstance(value, bool | int | float | str):
        if isinstance(value, str) and len(value) > 500:
            return value[:500]
        return value
    if isinstance(value, list):
        return [_clean_metadata(item, depth=depth + 1) for item in value[:25]]
    if isinstance(value, dict):
        cleaned: dict[str, object] = {}
        for key, item in list(value.items())[:50]:
            if isinstance(key, str) and key:
                cleaned[key[:100]] = _clean_metadata(item, depth=depth + 1)
        return cleaned
    return str(value)[:500]


def _event_row(
    event: AnalyticsEventIn,
    *,
    user: ClerkUser | None,
    user_agent: str | None,
) -> dict[str, object]:
    row = {
        "event_type": event.event_type,
        "session_id": str(event.session_id),
        "anonymous_id": str(event.anonymous_id),
        "user_id": str(user.internal_user_id) if user and user.internal_user_id else None,
        "clerk_user_id": user.clerk_id if user else None,
        "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
        "page_path": event.page_path,
        "page_title": event.page_title,
        "resource_id": str(event.resource_id) if event.resource_id else None,
        "duration_ms": event.duration_ms,
        "metadata": _clean_metadata(event.metadata),
        "user_agent": user_agent,
        "referrer": event.referrer,
    }
    return {key: value for key, value in row.items() if value is not None}


async def capture_events(
    events: list[AnalyticsEventIn],
    *,
    user: ClerkUser | None = None,
    user_agent: str | None = None,
    client: Client | None = None,
) -> int:
    if not events:
        return 0

    db = client or get_client()
    rows = [_event_row(event, user=user, user_agent=user_agent) for event in events]

    try:
        await asyncio.to_thread(lambda: db.table("analytics_events").insert(rows).execute())
    except Exception as exc:
        logger.exception("Failed to capture analytics events", event_count=len(rows))
        raise AnalyticsCaptureError("Unable to capture analytics events") from exc

    return len(rows)
