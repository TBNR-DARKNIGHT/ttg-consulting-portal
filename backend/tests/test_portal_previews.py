from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.config import settings
from app.services.portal_previews import list_portal_course_previews


@pytest.mark.asyncio
async def test_portal_course_previews_no_auth(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "portal_preview_1_mux_playback_id", "")
    monkeypatch.setattr(settings, "portal_preview_2_mux_playback_id", "")
    monkeypatch.setattr(settings, "portal_preview_3_mux_playback_id", "")
    response = await client.get("/api/v1/portal/course-previews")
    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"] == []


@pytest.mark.asyncio
async def test_portal_course_previews_returns_three_ordered(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "portal_preview_1_mux_playback_id", "playback-1")
    monkeypatch.setattr(settings, "portal_preview_2_mux_playback_id", "playback-2")
    monkeypatch.setattr(settings, "portal_preview_3_mux_playback_id", "playback-3")
    response = await client.get("/api/v1/portal/course-previews")
    assert response.status_code == 200
    previews = response.json()["data"]
    assert len(previews) == 3
    assert previews[0]["id"] == "portal-preview-1"
    assert previews[0]["title"] == "DSA Preview 1"
    assert previews[0]["muxPlaybackId"] == "playback-1"
    assert previews[2]["id"] == "portal-preview-3"
    assert previews[2]["muxPlaybackId"] == "playback-3"


def test_list_portal_course_previews_omits_unconfigured_slots(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "portal_preview_1_mux_playback_id", "")
    monkeypatch.setattr(settings, "portal_preview_2_mux_playback_id", "public-playback")
    monkeypatch.setattr(settings, "portal_preview_3_mux_playback_id", "")
    previews = list_portal_course_previews()
    assert len(previews) == 1
    assert previews[0].id == "portal-preview-2"
    assert previews[0].mux_playback_id == "public-playback"
