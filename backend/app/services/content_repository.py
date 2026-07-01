from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import structlog

from app.catalog.seeds import PROGRESS_SEEDS, RESOURCE_SEEDS
from app.config import settings
from app.models.resource import ResourceItem, ResourceProgressItem
from app.services.supabase import get_client

logger = structlog.get_logger()

_SEED_RESOURCES = [ResourceItem.model_validate(row) for row in RESOURCE_SEEDS]


def is_supabase_configured() -> bool:
    return bool(settings.supabase_url.strip() and settings.supabase_service_key.strip())


def _normalize_topic(row: dict[str, Any]) -> str:
    topic = str(row.get("topic") or "").strip()
    if topic:
        return topic
    category = str(row.get("category") or "").strip()
    if category in {"dsa-pathways", "interview-preparation", "timelines-deadlines"}:
        return category
    if category == "course-1":
        return "dsa-pathways"
    if category == "course-2":
        return "interview-preparation"
    return "dsa-pathways"


def _normalize_access(row: dict[str, Any]) -> str:
    if row.get("access") in {"public", "paid"}:
        return str(row["access"])
    if row.get("is_paid") is True:
        return "paid"
    return "public"


def _normalize_type(row: dict[str, Any]) -> str:
    raw = str(row.get("type") or "").strip().lower()
    if raw in {"video", "pdf", "article", "module"}:
        return raw
    if row.get("mux_playback_id") or row.get("mux_asset_id"):
        return "video"
    if row.get("bucket") and row.get("file_path"):
        return "pdf"
    return "article"


def _row_to_resource(row: dict[str, Any]) -> ResourceItem:
    """Map Supabase `resources` rows (uuid id, is_paid, etc.) to API ResourceItem."""
    created = row.get("created_at") or row.get("updated_at")
    if created is None:
        created = datetime.now(UTC)
    updated = row.get("updated_at") or created

    return ResourceItem.model_validate(
        {
            "id": str(row["id"]),
            "title": row["title"],
            "course_id": row.get("course_id"),
            "type": _normalize_type(row),
            "topic": _normalize_topic(row),
            "description": row.get("description") or "",
            "duration": row.get("duration") or "",
            "access": _normalize_access(row),
            "bucket": row.get("bucket"),
            "file_path": row.get("file_path"),
            "thumbnail_url": row.get("thumbnail_url"),
            "content_url": row.get("content_url"),
            "mux_asset_id": row.get("mux_asset_id"),
            "mux_playback_id": row.get("mux_playback_id"),
            "mux_playback_signed": bool(row.get("mux_playback_signed")),
            "created_at": created,
            "updated_at": updated,
        }
    )


def _fetch_from_supabase() -> list[ResourceItem]:
    client = get_client()
    response = (
        client.table("resources")
        .select("*")
        .order("sort_order")
        .order("created_at")
        .execute()
    )
    rows = response.data or []
    return [_row_to_resource(row) for row in rows]


def list_resources() -> list[ResourceItem]:
    """Return catalog from Supabase when configured and populated; else in-memory seeds."""
    if is_supabase_configured():
        try:
            rows = _fetch_from_supabase()
            if rows:
                return rows
            logger.info("resources table empty; using in-memory seed catalog")
        except Exception:
            logger.exception("Failed to load resources from Supabase; using seed catalog")
    return list(_SEED_RESOURCES)


def find_resource(resource_id: str) -> ResourceItem | None:
    for item in list_resources():
        if item.id == resource_id:
            return item
    return None


def list_video_resources() -> list[ResourceItem]:
    return [item for item in list_resources() if item.type == "video"]


def update_mux_playback(
    resource_id: str,
    *,
    mux_asset_id: str,
    mux_playback_id: str,
    mux_playback_signed: bool,
    duration: str | None = None,
) -> None:
    if not is_supabase_configured():
        raise RuntimeError("Supabase is not configured; cannot update Mux playback metadata")

    payload: dict[str, Any] = {
        "mux_asset_id": mux_asset_id,
        "mux_playback_id": mux_playback_id,
        "mux_playback_signed": mux_playback_signed,
    }
    if duration:
        payload["duration"] = duration

    client = get_client()
    response = (
        client.table("resources")
        .update(payload)
        .eq("id", resource_id)
        .execute()
    )
    if not response.data:
        raise ValueError(f"Resource not found in Supabase: {resource_id}")


def demo_progress_for_user(clerk_id: str) -> list[ResourceProgressItem]:
    out: list[ResourceProgressItem] = []
    for row in PROGRESS_SEEDS:
        payload = {**row, "user_id": clerk_id}
        out.append(ResourceProgressItem.model_validate(payload))
    return out
