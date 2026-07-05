from __future__ import annotations

from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient

from app.dependencies import require_admin
from app.main import app
from app.models.admin import ResourceUploadMetadata
from app.models.enums import UserRole
from app.models.schemas import ClerkUser
from app.routers import admin
from app.services.admin_resource_uploads import (
    _resource_row,
    pdf_thumbnail_path,
)


async def _admin_user() -> ClerkUser:
    return ClerkUser(
        clerk_id="admin_test",
        internal_user_id=uuid4(),
        email="admin@example.com",
        role=UserRole.ADMIN,
    )


@pytest.mark.asyncio
async def test_upload_options_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/admin/resources/options")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_options_returns_catalog_values(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        admin,
        "list_upload_options",
        lambda: (
            ["course-1", "new-course"],
            {"course-1": ["dsa-pathways"], "new-course": ["new-topic"]},
            {"course-1": []},
        ),
    )
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.get("/api/v1/admin/resources/options")
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 200
    assert response.json()["data"]["courses"] == ["course-1", "new-course"]
    assert response.json()["data"]["topicsByCourse"]["new-course"] == ["new-topic"]
    assert response.json()["data"]["modulesByCourse"]["course-1"] == []


@pytest.mark.asyncio
async def test_document_upload_returns_direct_upload_target(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, object] = {}

    def fake_begin_pdf_upload(**kwargs: object) -> tuple[str, str]:
        captured.update(kwargs)
        return "course-1/pdf/guide.pdf", "https://storage.example/signed"

    monkeypatch.setattr(admin, "begin_pdf_upload", fake_begin_pdf_upload)
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.post(
            "/api/v1/admin/resources/documents",
            json={
                "title": "Guide",
                "description": "A useful guide",
                "courseId": "course-1",
                "topic": "dsa-pathways",
                "filename": "guide.pdf",
                "contentType": "application/pdf",
                "fileSize": 1234,
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 201
    assert response.json()["data"] == {
        "type": "pdf",
        "status": "waiting",
        "uploadUrl": "https://storage.example/signed",
        "uploadId": "course-1/pdf/guide.pdf",
    }
    assert captured["filename"] == "guide.pdf"
    assert captured["file_size"] == 1234
    metadata = captured["metadata"]
    assert getattr(metadata, "course_id") == "course-1"
    assert getattr(metadata, "topic") == "dsa-pathways"


@pytest.mark.asyncio
async def test_document_upload_finalize_creates_resource(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    resource_id = uuid4()
    captured: dict[str, object] = {}

    def fake_complete_pdf_upload(**kwargs: object) -> UUID:
        captured.update(kwargs)
        return resource_id

    monkeypatch.setattr(admin, "complete_pdf_upload", fake_complete_pdf_upload)
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.post(
            "/api/v1/admin/resources/documents/complete",
            json={
                "title": "Guide",
                "description": "A useful guide",
                "courseId": "course-1",
                "topic": "dsa-pathways",
                "uploadId": "course-1/pdf/guide.pdf",
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 201
    assert response.json()["data"]["resourceId"] == str(resource_id)
    assert response.json()["data"]["status"] == "ready"
    assert captured["upload_id"] == "course-1/pdf/guide.pdf"


@pytest.mark.asyncio
async def test_admin_can_update_resource_metadata(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, object] = {}

    def fake_update(resource_id: str, **kwargs: object) -> None:
        captured["resource_id"] = resource_id
        captured.update(kwargs)

    monkeypatch.setattr(admin, "update_resource_metadata", fake_update)
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.patch(
            "/api/v1/admin/resources/resource-123",
            json={
                "title": "Updated Guide",
                "topic": "Interview Preparation",
                "description": "Updated description.",
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 200
    assert response.json()["data"] is None
    assert captured == {
        "resource_id": "resource-123",
        "title": "Updated Guide",
        "topic": "Interview Preparation",
        "description": "Updated description.",
    }


@pytest.mark.asyncio
async def test_admin_can_delete_resource(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    deleted: list[str] = []
    monkeypatch.setattr(admin, "delete_resource", deleted.append)
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.delete("/api/v1/admin/resources/resource-123")
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 200
    assert response.json()["data"] is None
    assert deleted == ["resource-123"]


@pytest.mark.asyncio
async def test_video_upload_rejects_non_video_content_type(client: AsyncClient) -> None:
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.post(
            "/api/v1/admin/resources/videos",
            json={
                "title": "Not a video",
                "courseId": "course-1",
                "topic": "dsa-pathways",
                "contentType": "application/pdf",
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 400
    assert response.json()["detail"] == "A video file is required"


@pytest.mark.asyncio
async def test_link_upload_calls_ingestion_service(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    resource_id = uuid4()
    captured: dict[str, object] = {}

    def fake_ingest_link(**kwargs: object) -> tuple[UUID, str]:
        captured.update(kwargs)
        return resource_id, "processing"

    monkeypatch.setattr(admin, "ingest_link", fake_ingest_link)
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.post(
            "/api/v1/admin/resources/links",
            json={
                "title": "Drive video",
                "description": "",
                "courseId": "course-2",
                "moduleId": "module-1",
                "topic": "interview-preparation",
                "url": "https://drive.google.com/file/d/abc123/view",
                "resourceType": "video",
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 201
    assert response.json()["data"]["status"] == "processing"
    assert captured["resource_type"] == "video"
    assert captured["url"] == "https://drive.google.com/file/d/abc123/view"


@pytest.mark.asyncio
async def test_link_upload_rejects_invalid_resource_type(client: AsyncClient) -> None:
    app.dependency_overrides[require_admin] = _admin_user
    try:
        response = await client.post(
            "/api/v1/admin/resources/links",
            json={
                "title": "Bad type",
                "courseId": "course-1",
                "topic": "dsa-pathways",
                "url": "https://example.com/file.zip",
                "resourceType": "archive",
            },
        )
    finally:
        app.dependency_overrides.pop(require_admin, None)

    assert response.status_code == 422


def test_upload_metadata_allows_freeform_text() -> None:
    metadata = ResourceUploadMetadata(
        title="interview guide",
        description="freeform description without punctuation",
        course_id="course-2",
        topic="interview preparation",
    )

    row = _resource_row(metadata, "pdf")

    assert row["title"] == "interview guide"
    assert row["topic"] == "interview preparation"
    assert row["description"] == "freeform description without punctuation"


def test_pdf_thumbnail_path_is_a_sibling_of_the_pdf() -> None:
    assert (
        pdf_thumbnail_path("course-1/pdf/my-guide.pdf")
        == "course-1/pdf/my-guide_thumbnail.jpg"
    )
