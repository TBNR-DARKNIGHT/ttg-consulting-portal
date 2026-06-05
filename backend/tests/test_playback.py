from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user
from app.main import app
from app.models.schemas import ClerkUser


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
