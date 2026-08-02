from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user, get_optional_current_user
from app.main import app
from app.models.enums import UserRole
from app.models.resource import ResourceItem, ResourceProgressItem
from app.models.schemas import ClerkUser
from app.routers import resources
from app.services import resource_progress as progress_service


@pytest.mark.asyncio
async def test_list_resources_allows_anonymous_catalog_access(client: AsyncClient) -> None:
    response = await client.get("/api/v1/resources")
    assert response.status_code == 200
    assert isinstance(response.json()["data"], list)


@pytest.mark.asyncio
async def test_list_resources_returns_seed_catalog(client: AsyncClient) -> None:
    response = await client.get("/api/v1/resources")

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert isinstance(body["data"], list)
    assert len(body["data"]) == 14
    first = body["data"][0]
    assert first["id"] == "res-001"
    assert first["title"] == "DSA pathways overview"
    assert not first.get("muxPlaybackId")
    assert first.get("muxPlaybackSigned") is False
    assert "createdAt" in first
    assert "filePath" not in first or first.get("filePath") is None


def _paid_resource() -> ResourceItem:
    now = datetime.now(UTC)
    return ResourceItem(
        id="paid-resource",
        title="Paid resource",
        course_id="course-3",
        type="video",
        topic="Interview Preparation",
        description="Visible preview copy",
        duration="10 min",
        access="paid",
        bucket="resources-paid",
        file_path="course-2/video/source.mp4",
        thumbnail_url="https://private.example/thumbnail.jpg",
        content_url="https://private.example/content",
        mux_asset_id="mux-asset-secret",
        mux_playback_id="mux-playback-secret",
        mux_playback_signed=True,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_list_resources_redacts_paid_delivery_metadata_for_non_public_course(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def free_entitlements(_user_id):
        pytest.fail("Anonymous catalog access should not query entitlements")

    monkeypatch.setattr(resources, "list_resources", lambda: [_paid_resource()])
    monkeypatch.setattr(resources, "list_entitlements", free_entitlements)
    response = await client.get("/api/v1/resources")

    assert response.status_code == 200
    item = response.json()["data"][0]
    assert item["title"] == "Paid resource"
    assert item["description"] == "Visible preview copy"
    for field in (
        "bucket",
        "filePath",
        "thumbnailUrl",
        "contentUrl",
        "muxAssetId",
        "muxPlaybackId",
    ):
        assert item[field] is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("role", "courses"),
    [
        (UserRole.CLIENT, ["course-1", "course-3"]),
        (UserRole.ADMIN, None),
    ],
)
async def test_list_resources_keeps_paid_delivery_metadata_for_authorized_users(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
    role: UserRole,
    courses: list[str] | None,
) -> None:
    async def authorized_user() -> ClerkUser:
        return ClerkUser(clerk_id="user_authorized", internal_user_id=uuid4(), role=role)

    async def entitlements(_user_id):
        if courses is None:
            pytest.fail("Admin catalog access must not query entitlements")
        return courses

    app.dependency_overrides[get_optional_current_user] = authorized_user
    monkeypatch.setattr(resources, "list_resources", lambda: [_paid_resource()])
    monkeypatch.setattr(resources, "list_entitlements", entitlements)
    try:
        response = await client.get("/api/v1/resources")
    finally:
        app.dependency_overrides.pop(get_optional_current_user, None)

    assert response.status_code == 200
    item = response.json()["data"][0]
    assert item["bucket"] == "resources-paid"
    assert item["filePath"] == "course-2/video/source.mp4"
    assert item["muxAssetId"] == "mux-asset-secret"
    assert item["muxPlaybackId"] == "mux-playback-secret"


@pytest.mark.asyncio
async def test_list_progress_scopes_user_id(client: AsyncClient) -> None:
    internal_user_id = uuid4()

    async def _user() -> ClerkUser:
        return ClerkUser(
            clerk_id="clerk_abc",
            internal_user_id=internal_user_id,
            email="parent@example.com",
        )

    async def _progress(user_id):
        assert user_id == internal_user_id
        return [
            ResourceProgressItem(
                resource_id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                user_id=str(user_id),
                status="completed",
                completed=True,
                progress_percent=100,
            )
        ]

    app.dependency_overrides[get_current_user] = _user
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(progress_service, "list_progress", _progress)
    try:
        response = await client.get(
            "/api/v1/resources/progress",
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        monkeypatch.undo()

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    rows = body["data"]
    assert len(rows) == 1
    assert rows[0]["userId"] == str(internal_user_id)
    assert rows[0]["resourceId"] == "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
    assert rows[0]["completed"] is True


@pytest.mark.asyncio
async def test_progress_endpoints_require_authenticated_user(client: AsyncClient) -> None:
    response = await client.get("/api/v1/resources/progress")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_progress_requires_local_user_profile(client: AsyncClient) -> None:
    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="clerk_no_profile", email="parent@example.com")

    app.dependency_overrides[get_current_user] = _user
    try:
        response = await client.patch(
            "/api/v1/resources/res-001/progress",
            json={"progressPercent": 25},
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 503
    assert response.json()["detail"] == "User profile unavailable"


@pytest.mark.asyncio
async def test_update_progress_saves_for_accessible_resource(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    internal_user_id = uuid4()

    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="clerk_abc", internal_user_id=internal_user_id)

    async def _update_progress(user_id, resource, update):
        assert user_id == internal_user_id
        assert resource.id == "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
        assert update.progress_percent == 42
        return ResourceProgressItem(
            resource_id=resource.id,
            user_id=str(user_id),
            status="in_progress",
            completed=False,
            progress_percent=42,
        )

    now = datetime.now(UTC)
    resource = ResourceItem(
        id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        title="Public PDF",
        course_id="course-1",
        type="pdf",
        topic="dsa-pathways",
        description="",
        duration="",
        access="public",
        created_at=now,
        updated_at=now,
    )

    app.dependency_overrides[get_current_user] = _user
    monkeypatch.setattr(resources, "find_resource", lambda _resource_id: resource)
    monkeypatch.setattr(progress_service, "update_progress", _update_progress)
    try:
        response = await client.patch(
            "/api/v1/resources/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/progress",
            json={"progressPercent": 42},
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["resourceId"] == "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
    assert body["progressPercent"] == 42


@pytest.mark.asyncio
async def test_reset_progress_deletes_for_course_resources(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    internal_user_id = uuid4()
    called = False

    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="clerk_abc", internal_user_id=internal_user_id)

    async def _reset_course_progress(user_id, course_resources):
        nonlocal called
        called = True
        assert user_id == internal_user_id
        assert [resource.id for resource in course_resources] == [
            "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
            "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        ]

    now = datetime.now(UTC)
    course_resources = [
        ResourceItem(
            id="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
            title="Public PDF",
            course_id="course-1",
            type="pdf",
            topic="dsa-pathways",
            description="",
            duration="",
            access="public",
            created_at=now,
            updated_at=now,
        ),
        ResourceItem(
            id="bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            title="Public Video",
            course_id="course-1",
            type="video",
            topic="dsa-pathways",
            description="",
            duration="",
            access="public",
            created_at=now,
            updated_at=now,
        ),
        ResourceItem(
            id="cccccccc-cccc-4ccc-cccc-cccccccccccc",
            title="Other Course PDF",
            course_id="course-2",
            type="pdf",
            topic="interview-preparation",
            description="",
            duration="",
            access="public",
            created_at=now,
            updated_at=now,
        ),
    ]

    app.dependency_overrides[get_current_user] = _user
    monkeypatch.setattr(resources, "list_resources", lambda: course_resources)
    monkeypatch.setattr(progress_service, "reset_course_progress", _reset_course_progress)
    try:
        response = await client.delete(
            "/api/v1/courses/course-1/progress",
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert called is True
    assert response.status_code == 200
    assert response.json()["data"] is None
