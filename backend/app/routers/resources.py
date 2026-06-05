from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.config import settings
from app.dependencies import get_current_user
from app.models.schemas import ApiResponse, ClerkUser

router = APIRouter()

# Public sample from Mux Player docs (Big Buck Bunny) — fallback when MUX_PUBLIC_PLAYBACK_ID unset.
_MUX_PUBLIC_DEMO_PLAYBACK_ID = "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"

# Course 1 topics (see frontend `COURSES` / `getCourseIdForTopic`) — free-tier Mux public asset.
_COURSE_1_TOPICS = frozenset({"dsa-pathways", "timelines-deadlines"})


class ResourceItem(BaseModel):
    """Matches the frontend `Resource` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    title: str
    type: str
    topic: str
    description: str
    duration: str
    access: str | None = None
    bucket: str | None = None
    file_path: str | None = None
    thumbnail_url: str | None = None
    content_url: str | None = None
    mux_playback_id: str | None = None
    mux_playback_signed: bool = False
    created_at: datetime
    updated_at: datetime


class ResourceProgressItem(BaseModel):
    """Matches the frontend `ResourceProgress` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    resource_id: str
    user_id: str
    completed: bool
    completed_at: datetime | None = None
    last_accessed_at: datetime | None = None


# Demo catalog — mirrors `frontend/src/lib/mock-data.ts` until Supabase-backed content exists.
# PDF object keys: course-1/* under resources-public (free), course-2/* under resources-paid (paid).
# Mux: public playback ID → Course 1 free videos only; signed ID + res-009 → paid Course 2 (interview-prep).
_RESOURCE_SEEDS_BASE: list[dict[str, Any]] = [
    {
        "id": "res-001",
        "title": "DSA pathways overview",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": (
            "A comprehensive overview of Direct School Admission pathways, covering "
            "eligibility criteria, school options, and strategic planning for your "
            "child's application."
        ),
        "duration": "12 min",
        "created_at": "2026-01-15T08:00:00Z",
        "updated_at": "2026-01-15T08:00:00Z",
    },
    {
        "id": "res-002",
        "title": "Interview body language tips",
        "type": "video",
        "topic": "interview-preparation",
        "access": "public",
        "description": (
            "Learn how to present confidently in DSA interviews with practical body "
            "language techniques that help students make a strong first impression."
        ),
        "duration": "8 min",
        "created_at": "2026-01-20T10:00:00Z",
        "updated_at": "2026-01-20T10:00:00Z",
    },
    {
        "id": "res-003",
        "title": "Portfolio building workbook",
        "type": "pdf",
        "topic": "dsa-pathways",
        "access": "public",
        "bucket": "resources-public",
        "file_path": "course-1/pdf/testpublic.pdf",
        "description": (
            "A step-by-step workbook to help parents and students compile a compelling "
            "portfolio showcasing achievements, talents, and extracurricular involvement."
        ),
        "duration": "24 pages",
        "created_at": "2026-02-01T09:00:00Z",
        "updated_at": "2026-02-01T09:00:00Z",
    },
    {
        "id": "res-004",
        "title": "Timeline & key deadlines 2026",
        "type": "article",
        "topic": "timelines-deadlines",
        "access": "public",
        "description": (
            "A complete calendar of DSA application windows, school-specific deadlines, "
            "and important dates for the 2026 admissions cycle."
        ),
        "duration": "5 min read",
        "created_at": "2026-02-10T11:00:00Z",
        "updated_at": "2026-03-01T14:00:00Z",
    },
    {
        "id": "res-006",
        "title": "School selection strategy",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": (
            "How to shortlist schools based on your child's strengths, the school's "
            "talent areas, and realistic acceptance rates."
        ),
        "duration": "15 min",
        "created_at": "2026-02-20T10:00:00Z",
        "updated_at": "2026-02-20T10:00:00Z",
    },
    {
        "id": "res-007",
        "title": "Parent guide to DSA interviews",
        "type": "pdf",
        "topic": "interview-preparation",
        "access": "paid",
        "bucket": "resources-paid",
        "file_path": "course-2/pdf/testpaid.pdf",
        "description": (
            "Everything parents need to know about supporting their child through the "
            "DSA interview process, from preparation to day-of logistics."
        ),
        "duration": "32 pages",
        "created_at": "2026-03-01T09:00:00Z",
        "updated_at": "2026-03-01T09:00:00Z",
    },
    {
        "id": "res-008",
        "title": "Understanding talent areas",
        "type": "article",
        "topic": "dsa-pathways",
        "access": "public",
        "description": (
            "An in-depth look at the various talent areas recognised under DSA, how "
            "schools evaluate applicants, and how to position your child effectively."
        ),
        "duration": "7 min read",
        "created_at": "2026-03-10T08:00:00Z",
        "updated_at": "2026-03-10T08:00:00Z",
    },
]


def _apply_mux_public_course1(rows: list[dict[str, Any]]) -> None:
    """Attach public Mux playback to free Course 1 videos only (not interview-prep / Course 2)."""
    public_pid = (settings.mux_public_playback_id or "").strip() or _MUX_PUBLIC_DEMO_PLAYBACK_ID
    for row in rows:
        if row.get("type") != "video":
            continue
        if row.get("access") != "public":
            continue
        if row.get("topic") not in _COURSE_1_TOPICS:
            continue
        row["mux_playback_id"] = public_pid
        row["mux_playback_signed"] = False


_RESOURCE_SEEDS: list[dict[str, Any]] = list(_RESOURCE_SEEDS_BASE)
_apply_mux_public_course1(_RESOURCE_SEEDS)
_signed = (settings.mux_seed_signed_playback_id or "").strip()
if _signed:
    _RESOURCE_SEEDS.append(
        {
            "id": "res-009",
            "title": "Advanced DSA interview workshop",
            "type": "video",
            "topic": "interview-preparation",
            "access": "paid",
            "mux_playback_id": _signed,
            "mux_playback_signed": True,
            "description": (
                "A deeper workshop on interview structure, follow-up questions, and how "
                "to reflect your child's authentic strengths under pressure."
            ),
            "duration": "42 min",
            "created_at": "2026-03-12T09:00:00Z",
            "updated_at": "2026-03-12T09:00:00Z",
        },
    )

_PROGRESS_SEEDS_BASE: list[dict[str, Any]] = [
    {
        "resource_id": "res-001",
        "completed": True,
        "completed_at": "2026-02-01T14:30:00Z",
        "last_accessed_at": "2026-02-01T14:30:00Z",
    },
    {
        "resource_id": "res-002",
        "completed": True,
        "completed_at": "2026-02-05T09:15:00Z",
        "last_accessed_at": "2026-02-05T09:15:00Z",
    },
    {
        "resource_id": "res-003",
        "completed": False,
        "last_accessed_at": "2026-02-12T16:00:00Z",
    },
    {
        "resource_id": "res-004",
        "completed": False,
        "last_accessed_at": "2026-03-05T10:00:00Z",
    },
    {"resource_id": "res-006", "completed": False},
    {"resource_id": "res-007", "completed": False},
    {"resource_id": "res-008", "completed": False},
]

_PROGRESS_SEEDS: list[dict[str, Any]] = list(_PROGRESS_SEEDS_BASE)
if _signed:
    _PROGRESS_SEEDS.append({"resource_id": "res-009", "completed": False})

_DEMO_RESOURCES = [ResourceItem.model_validate(row) for row in _RESOURCE_SEEDS]


def find_demo_resource(resource_id: str) -> ResourceItem | None:
    for item in _DEMO_RESOURCES:
        if item.id == resource_id:
            return item
    return None


def _demo_progress_for_user(clerk_id: str) -> list[ResourceProgressItem]:
    out: list[ResourceProgressItem] = []
    for row in _PROGRESS_SEEDS:
        payload = {**row, "user_id": clerk_id}
        out.append(ResourceProgressItem.model_validate(payload))
    return out


@router.get("/resources", response_model=ApiResponse[list[ResourceItem]])
async def list_resources(
    _user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[list[ResourceItem]]:
    return ApiResponse(data=list(_DEMO_RESOURCES))


@router.get("/resources/progress", response_model=ApiResponse[list[ResourceProgressItem]])
async def list_resource_progress(
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[list[ResourceProgressItem]]:
    return ApiResponse(data=_demo_progress_for_user(user.clerk_id))
