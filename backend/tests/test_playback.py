from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user
from app.main import app
from app.models.resource import ResourceItem
from app.models.schemas import ClerkUser
from app.routers import playback


@pytest.mark.asyncio
async def test_mux_playback_token_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/playback/mux-token", params={"resource_id": "res-001"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mux_playback_token_rejects_public_mux_video(client: AsyncClient) -> None:
    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", email="parent@example.com")

    app.dependency_overrides[get_current_user] = _user
    try:
        response = await client.get(
            "/api/v1/playback/mux-token",
            params={"resource_id": "res-001"},
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 400
    assert "public" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_mux_playback_token_unknown_resource(client: AsyncClient) -> None:
    async def _user() -> ClerkUser:
        return ClerkUser(clerk_id="user_test", email="parent@example.com")

    app.dependency_overrides[get_current_user] = _user
    try:
        response = await client.get(
            "/api/v1/playback/mux-token",
            params={"resource_id": "res-999"},
            headers={"Authorization": "Bearer test-token"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_paid_mux_playback_requires_course_entitlement(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    now = datetime.now(UTC)
    resource = ResourceItem(
        id="paid-video",
        title="Paid video",
        course_id="course-2",
        type="video",
        topic="interview-preparation",
        description="",
        duration="",
        access="paid",
        mux_playback_id="signed-playback",
        mux_playback_signed=True,
        created_at=now,
        updated_at=now,
    )

    async def user() -> ClerkUser:
        return ClerkUser(clerk_id="user_free", internal_user_id=uuid4())

    async def denied(_user_id, _course_id):
        return False

    app.dependency_overrides[get_current_user] = user
    monkeypatch.setattr(playback, "find_resource", lambda _resource_id: resource)
    monkeypatch.setattr(playback, "has_course_access", denied)
    try:
        response = await client.get(
            "/api/v1/playback/mux-token",
            params={"resource_id": "paid-video"},
        )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403
