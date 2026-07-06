from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user
from app.main import app
from app.models.enums import UserRole
from app.models.resource import ResourceItem
from app.models.schemas import ClerkUser
from app.routers import resources


@pytest.mark.asyncio
async def test_list_resources_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/resources")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_resources_returns_seed_catalog(client: AsyncClient) -> None:
    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", email="parent@example.com")

    app.dependency_overrides[get_current_user] = _user
    try:
        response = await client.get(
            "/api/v1/resources",
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

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
        course_id="course-2",
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
async def test_list_resources_redacts_paid_delivery_metadata_for_free_user(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def free_user() -> ClerkUser:
        return ClerkUser(clerk_id="user_free", internal_user_id=uuid4())

    async def free_entitlements(_user_id):
        return ["course-1"]

    app.dependency_overrides[get_current_user] = free_user
    monkeypatch.setattr(resources, "list_resources", lambda: [_paid_resource()])
    monkeypatch.setattr(resources, "list_entitlements", free_entitlements)
    try:
        response = await client.get("/api/v1/resources")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

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
        (UserRole.CLIENT, ["course-1", "course-2"]),
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

    app.dependency_overrides[get_current_user] = authorized_user
    monkeypatch.setattr(resources, "list_resources", lambda: [_paid_resource()])
    monkeypatch.setattr(resources, "list_entitlements", entitlements)
    try:
        response = await client.get("/api/v1/resources")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    item = response.json()["data"][0]
    assert item["bucket"] == "resources-paid"
    assert item["filePath"] == "course-2/video/source.mp4"
    assert item["muxAssetId"] == "mux-asset-secret"
    assert item["muxPlaybackId"] == "mux-playback-secret"


@pytest.mark.asyncio
async def test_list_progress_scopes_user_id(client: AsyncClient) -> None:
    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="clerk_abc", email="parent@example.com")

    app.dependency_overrides[get_current_user] = _user
    try:
        response = await client.get(
            "/api/v1/resources/progress",
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    rows = body["data"]
    assert len(rows) == 8
    assert all(r["userId"] == "clerk_abc" for r in rows)
    assert rows[0]["resourceId"] == "res-001"
