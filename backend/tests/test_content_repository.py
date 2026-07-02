from __future__ import annotations

from app.services.content_repository import _row_to_resource


def test_row_to_resource_maps_pdf_from_supabase_shape() -> None:
    item = _row_to_resource(
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Portfolio workbook",
            "description": "Build your portfolio.",
            "course_id": "course-1",
            "topic": "dsa-pathways",
            "type": "pdf",
            "duration": "24 pages",
            "bucket": "resources-public",
            "file_path": "course-1/pdf/workbook.pdf",
            "is_paid": False,
            "created_at": "2026-02-01T09:00:00Z",
        }
    )
    assert item.id == "550e8400-e29b-41d4-a716-446655440000"
    assert item.course_id == "course-1"
    assert item.type == "pdf"
    assert item.topic == "DSA Pathways"
    assert item.access == "public"
    assert item.bucket == "resources-public"
    assert item.file_path == "course-1/pdf/workbook.pdf"


def test_row_to_resource_maps_paid_video() -> None:
    item = _row_to_resource(
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "title": "Interview workshop",
            "description": None,
            "course_id": "course-2",
            "module_id": "module-1",
            "topic": "interview-preparation",
            "type": "video",
            "duration": "42 min",
            "bucket": None,
            "file_path": None,
            "is_paid": True,
            "mux_playback_id": "abc123",
            "mux_playback_signed": True,
            "created_at": "2026-03-12T09:00:00Z",
        }
    )
    assert item.access == "paid"
    assert item.course_id == "course-2"
    assert item.module_id == "module-1"
    assert item.type == "video"
    assert item.mux_playback_id == "abc123"
    assert item.mux_playback_signed is True
