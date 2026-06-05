from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user
from app.main import app
from app.models.schemas import ClerkUser


@pytest.mark.asyncio
async def test_list_resources_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/resources")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_resources_returns_demo_catalog(client: AsyncClient) -> None:
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
    assert len(body["data"]) == 7
    first = body["data"][0]
    assert first["id"] == "res-001"
    assert first["title"] == "DSA pathways overview"
    assert first.get("muxPlaybackId")
    assert first.get("muxPlaybackSigned") is False
    assert "createdAt" in first
    assert "filePath" not in first or first.get("filePath") is None


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
    assert len(rows) == 7
    assert all(r["userId"] == "clerk_abc" for r in rows)
    assert rows[0]["resourceId"] == "res-001"
