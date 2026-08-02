from __future__ import annotations

import asyncio
from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

import structlog
from supabase import Client

from app.models.resource import (
    ResourceCompletionUpdate,
    ResourceItem,
    ResourceProgressItem,
    ResourceProgressUpdate,
)
from app.services.supabase import get_client

logger = structlog.get_logger()


class ResourceProgressError(RuntimeError):
    pass


def _clamp_percent(value: int | None) -> int:
    if value is None:
        return 0
    return max(0, min(100, int(value)))


def _clean_pages(pages: list[int] | None, page_count: int | None) -> list[int]:
    if not pages:
        return []
    upper_bound = page_count if page_count and page_count > 0 else None
    cleaned = {
        page
        for page in pages
        if isinstance(page, int) and page > 0 and (upper_bound is None or page <= upper_bound)
    }
    return sorted(cleaned)


def _row_to_progress(row: dict[str, object]) -> ResourceProgressItem:
    completed_at = row.get("completed_at")
    status = str(row.get("status") or "not_started")
    completed = status == "completed" or completed_at is not None
    return ResourceProgressItem.model_validate(
        {
            "resource_id": str(row["resource_id"]),
            "user_id": str(row["user_id"]),
            "status": "completed" if completed else status,
            "completed": completed,
            "progress_percent": _clamp_percent(row.get("progress_percent")),  # type: ignore[arg-type]
            "completed_at": completed_at,
            "last_accessed_at": row.get("last_accessed_at"),
            "last_position_seconds": row.get("last_position_seconds"),
            "duration_seconds": row.get("duration_seconds"),
            "pages_viewed": row.get("pages_viewed") or [],
            "page_count": row.get("page_count"),
            "completion_source": row.get("completion_source"),
        }
    )


async def list_progress(
    user_id: UUID,
    *,
    client: Client | None = None,
) -> list[ResourceProgressItem]:
    db = client or get_client()
    try:
        response = await asyncio.to_thread(
            lambda: (
                db.table("resource_progress")
                .select("*")
                .eq("user_id", str(user_id))
                .order("updated_at", desc=True)
                .execute()
            )
        )
    except Exception as exc:
        logger.exception("Failed to list resource progress", user_id=str(user_id))
        raise ResourceProgressError("Unable to load resource progress") from exc

    return [_row_to_progress(row) for row in response.data or []]


async def _get_existing_row(
    db: Client,
    user_id: UUID,
    resource_id: str,
) -> dict[str, object] | None:
    response = await asyncio.to_thread(
        lambda: (
            db.table("resource_progress")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("resource_id", resource_id)
            .limit(1)
            .execute()
        )
    )
    rows = response.data or []
    return rows[0] if rows else None


def _merge_payload(
    *,
    user_id: UUID,
    resource: ResourceItem,
    existing: dict[str, object] | None,
    update: ResourceProgressUpdate,
) -> dict[str, object]:
    now = datetime.now(UTC).isoformat()
    existing_percent = _clamp_percent(
        existing.get("progress_percent") if existing is not None else None  # type: ignore[arg-type]
    )
    existing_completed_at = existing.get("completed_at") if existing else None
    existing_completed = existing_completed_at is not None or (
        existing is not None and existing.get("status") == "completed"
    )

    page_count = update.page_count
    if page_count is None and existing is not None:
        existing_page_count = existing.get("page_count")
        page_count = int(existing_page_count) if isinstance(existing_page_count, int) else None

    existing_pages = existing.get("pages_viewed") if existing else []
    if not isinstance(existing_pages, list):
        existing_pages = []
    pages_viewed = sorted(
        set(_clean_pages(existing_pages, page_count)).union(
            _clean_pages(update.pages_viewed, page_count)
        )
    )

    derived_percent = 0
    if page_count and page_count > 0 and pages_viewed:
        derived_percent = round((len(pages_viewed) / page_count) * 100)

    progress_percent = max(
        existing_percent,
        _clamp_percent(update.progress_percent),
        derived_percent,
    )
    completed = bool(update.completed) or existing_completed
    completed_at = existing_completed_at
    completion_source = existing.get("completion_source") if existing else None
    if update.completed:
        completed = True
        completed_at = completed_at or now
        completion_source = update.completion_source or "manual"
        progress_percent = 100

    status = "completed" if completed else "in_progress"
    if progress_percent <= 0 and not pages_viewed and update.last_position_seconds is None:
        status = "not_started"

    payload: dict[str, object] = {
        "user_id": str(user_id),
        "resource_id": resource.id,
        "status": status,
        "progress_percent": progress_percent,
        "completed_at": completed_at,
        "last_accessed_at": now,
        "pages_viewed": pages_viewed,
        "updated_at": now,
    }

    if update.last_position_seconds is not None:
        payload["last_position_seconds"] = update.last_position_seconds
    elif existing and existing.get("last_position_seconds") is not None:
        payload["last_position_seconds"] = existing["last_position_seconds"]  # type: ignore[index]

    if update.duration_seconds is not None:
        payload["duration_seconds"] = update.duration_seconds
    elif existing and existing.get("duration_seconds") is not None:
        payload["duration_seconds"] = existing["duration_seconds"]  # type: ignore[index]

    if page_count is not None:
        payload["page_count"] = page_count
    elif existing and existing.get("page_count") is not None:
        payload["page_count"] = existing["page_count"]  # type: ignore[index]

    if completion_source:
        payload["completion_source"] = completion_source

    return payload


async def update_progress(
    user_id: UUID,
    resource: ResourceItem,
    update: ResourceProgressUpdate,
    *,
    client: Client | None = None,
) -> ResourceProgressItem:
    db = client or get_client()
    try:
        existing = await _get_existing_row(db, user_id, resource.id)
        payload = _merge_payload(
            user_id=user_id,
            resource=resource,
            existing=existing,
            update=update,
        )
        response = await asyncio.to_thread(
            lambda: (
                db.table("resource_progress")
                .upsert(payload, on_conflict="user_id,resource_id")
                .execute()
            )
        )
    except Exception as exc:
        logger.exception(
            "Failed to update resource progress",
            user_id=str(user_id),
            resource_id=resource.id,
        )
        raise ResourceProgressError("Unable to update resource progress") from exc

    rows = response.data or []
    if rows:
        return _row_to_progress(rows[0])
    return _row_to_progress(payload)


async def mark_complete(
    user_id: UUID,
    resource: ResourceItem,
    update: ResourceCompletionUpdate,
    *,
    client: Client | None = None,
) -> ResourceProgressItem:
    return await update_progress(
        user_id,
        resource,
        ResourceProgressUpdate(
            completed=True,
            progress_percent=100,
            completion_source=update.completion_source,
        ),
        client=client,
    )


async def mark_incomplete(
    user_id: UUID,
    resource: ResourceItem,
    *,
    client: Client | None = None,
) -> ResourceProgressItem:
    db = client or get_client()
    now = datetime.now(UTC).isoformat()
    try:
        existing = await _get_existing_row(db, user_id, resource.id)
        previous_percent = _clamp_percent(
            existing.get("progress_percent") if existing is not None else None  # type: ignore[arg-type]
        )
        payload: dict[str, object] = {
            "user_id": str(user_id),
            "resource_id": resource.id,
            "status": "in_progress" if previous_percent > 0 else "not_started",
            "progress_percent": min(previous_percent, 99),
            "completed_at": None,
            "completion_source": None,
            "last_accessed_at": now,
            "updated_at": now,
        }
        if existing:
            for key in ("last_position_seconds", "duration_seconds", "pages_viewed", "page_count"):
                if existing.get(key) is not None:
                    payload[key] = existing[key]  # type: ignore[index]
        response = await asyncio.to_thread(
            lambda: (
                db.table("resource_progress")
                .upsert(payload, on_conflict="user_id,resource_id")
                .execute()
            )
        )
    except Exception as exc:
        logger.exception(
            "Failed to mark resource incomplete",
            user_id=str(user_id),
            resource_id=resource.id,
        )
        raise ResourceProgressError("Unable to update resource progress") from exc

    rows = response.data or []
    if rows:
        return _row_to_progress(rows[0])
    return _row_to_progress(payload)


async def reset_course_progress(
    user_id: UUID,
    resources: Sequence[ResourceItem],
    *,
    client: Client | None = None,
) -> None:
    resource_ids = sorted({resource.id for resource in resources})
    if not resource_ids:
        return

    db = client or get_client()
    try:
        for resource_id in resource_ids:
            await asyncio.to_thread(
                lambda resource_id=resource_id: (
                    db.table("resource_progress")
                    .delete()
                    .eq("user_id", str(user_id))
                    .eq("resource_id", resource_id)
                    .execute()
                )
            )
    except Exception as exc:
        logger.exception(
            "Failed to reset course progress",
            user_id=str(user_id),
            resource_ids=resource_ids,
        )
        raise ResourceProgressError("Unable to reset course progress") from exc
