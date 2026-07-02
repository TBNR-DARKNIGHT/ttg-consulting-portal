from __future__ import annotations

from typing import Any

# Demo catalog — used when Supabase is unconfigured or the resources table is empty.
# PDF object keys: resources-public/course-1/* (free), resources-paid/course-2/* (paid).
# Demo seeds use placeholder filenames; production rows come from the Supabase `resources` table.
# Video mux_playback_id values are populated by Mux sync (passthrough = resource id).
RESOURCE_SEEDS: list[dict[str, Any]] = [
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
        "course_id": "course-2",
        "module_id": "module-1",
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
        "course_id": "course-2",
        "module_id": "module-2",
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
    {
        "id": "res-009",
        "title": "Advanced DSA interview workshop",
        "course_id": "course-2",
        "module_id": "module-4",
        "type": "video",
        "topic": "interview-preparation",
        "access": "paid",
        "description": (
            "A deeper workshop on interview structure, follow-up questions, and how "
            "to reflect your child's authentic strengths under pressure."
        ),
        "duration": "42 min",
        "created_at": "2026-03-12T09:00:00Z",
        "updated_at": "2026-03-12T09:00:00Z",
    },
    {
        "id": "res-prev-01",
        "title": "[PREV] TTA H DSA 1 Introduction to DSA",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Portal preview clip 1 for the Ace Your DSA Interview course.",
        "duration": "3 min",
        "mux_playback_id": "seed-preview-playback-01",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
    {
        "id": "res-prev-02",
        "title": "[PREV] TTA H DSA 2 Interview mindset",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Portal preview clip 2 for the Ace Your DSA Interview course.",
        "duration": "4 min",
        "mux_playback_id": "seed-preview-playback-02",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
    {
        "id": "res-prev-03",
        "title": "[PREV] TTA H DSA 3 Common mistakes",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Portal preview clip 3 for the Ace Your DSA Interview course.",
        "duration": "5 min",
        "mux_playback_id": "seed-preview-playback-03",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
    {
        "id": "res-prev-04",
        "title": "[PREV] TTA H DSA 4 Sample question walkthrough",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Portal preview clip 4 for the Ace Your DSA Interview course.",
        "duration": "6 min",
        "mux_playback_id": "seed-preview-playback-04",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
    {
        "id": "res-prev-05",
        "title": "[PREV] TTA H DSA 5 Bonus clip",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Extra preview clip (not shown on portal grid).",
        "duration": "7 min",
        "mux_playback_id": "seed-preview-playback-05",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
    {
        "id": "res-prev-06",
        "title": "[PREV] TTA H DSA 6 Bonus clip",
        "type": "video",
        "topic": "dsa-pathways",
        "access": "public",
        "description": "Extra preview clip (not shown on portal grid).",
        "duration": "8 min",
        "mux_playback_id": "seed-preview-playback-06",
        "mux_playback_signed": False,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
    },
]

PROGRESS_SEEDS: list[dict[str, Any]] = [
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
    {"resource_id": "res-009", "completed": False},
]
