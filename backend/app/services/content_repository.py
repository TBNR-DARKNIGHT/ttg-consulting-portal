from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from threading import RLock
from time import monotonic
from typing import Any

import structlog

from app.catalog.seeds import PROGRESS_SEEDS, RESOURCE_SEEDS
from app.config import settings
from app.models.resource import ResourceItem, ResourceProgressItem
from app.services.supabase import get_client

logger = structlog.get_logger()

_SEED_RESOURCES = [ResourceItem.model_validate(row) for row in RESOURCE_SEEDS]
_RESOURCE_CACHE_TTL_SECONDS = 30.0
_resource_cache: list[ResourceItem] | None = None
_resource_cache_expires_at = 0.0
_resource_cache_lock = RLock()


def is_supabase_configured() -> bool:
    return bool(settings.supabase_url.strip() and settings.supabase_service_key.strip())


def _normalize_topic(row: dict[str, Any]) -> str:
    topic = str(row.get("topic") or "").strip()
    if topic:
        legacy_topics = {
            "dsa-pathways": "DSA Pathways",
            "interview-preparation": "Interview Preparation",
            "timelines-deadlines": "Timelines & Deadlines",
        }
        return legacy_topics.get(topic, topic)
    course_id = str(row.get("course_id") or "").strip()
    if course_id == "course-1":
        return "DSA Pathways"
    if course_id == "course-2":
        return "Interview Preparation"
    return "DSA Pathways"


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
            "module_id": row.get("module_id"),
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
    response = client.table("resources").select("*").order("created_at").execute()
    rows = response.data or []
    return [_row_to_resource(row) for row in rows]


def invalidate_resource_cache() -> None:
    global _resource_cache, _resource_cache_expires_at
    with _resource_cache_lock:
        _resource_cache = None
        _resource_cache_expires_at = 0.0


def list_resources() -> list[ResourceItem]:
    """Return catalog from Supabase when configured and populated; else in-memory seeds."""
    global _resource_cache, _resource_cache_expires_at
    if is_supabase_configured():
        now = monotonic()
        with _resource_cache_lock:
            if _resource_cache is not None and now < _resource_cache_expires_at:
                return list(_resource_cache)
            try:
                rows = _fetch_from_supabase()
                if rows:
                    _resource_cache = rows
                    _resource_cache_expires_at = now + _RESOURCE_CACHE_TTL_SECONDS
                    return list(rows)
                logger.info("resources table empty; using in-memory seed catalog")
            except Exception:
                logger.exception("Failed to load resources from Supabase; using seed catalog")
    return list(_SEED_RESOURCES)


async def list_resources_async() -> list[ResourceItem]:
    return await asyncio.to_thread(list_resources)


def find_resource(resource_id: str) -> ResourceItem | None:
    for item in list_resources():
        if item.id == resource_id:
            return item
    return None


async def find_resource_async(resource_id: str) -> ResourceItem | None:
    return await asyncio.to_thread(find_resource, resource_id)


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
    response = client.table("resources").update(payload).eq("id", resource_id).execute()
    if not response.data:
        raise ValueError(f"Resource not found in Supabase: {resource_id}")
    invalidate_resource_cache()


def demo_progress_for_user(clerk_id: str) -> list[ResourceProgressItem]:
    out: list[ResourceProgressItem] = []
    for row in PROGRESS_SEEDS:
        payload = {**row, "user_id": clerk_id}
        out.append(ResourceProgressItem.model_validate(payload))
    return out
