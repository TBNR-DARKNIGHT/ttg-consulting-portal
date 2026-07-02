from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.resource import ResourceItem
from app.services import portal_previews as portal_previews_module
from app.services.portal_previews import list_portal_course_previews


@pytest.mark.asyncio
async def test_portal_course_previews_no_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/portal/course-previews")
    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_portal_course_previews_returns_three_ordered(client: AsyncClient) -> None:
    response = await client.get("/api/v1/portal/course-previews")
    assert response.status_code == 200
    previews = response.json()["data"]
    assert len(previews) == 3
    assert previews[0]["id"] == "res-prev-01"
    assert previews[0]["title"].startswith("[PREV] TTA H DSA 1")
    assert previews[0]["muxPlaybackId"] == "seed-preview-playback-01"
    assert previews[2]["id"] == "res-prev-03"
    assert previews[2]["title"].startswith("[PREV] TTA H DSA 3")


def test_list_portal_course_previews_omits_signed_playback(monkeypatch: pytest.MonkeyPatch) -> None:
    def _fake_resources() -> list[ResourceItem]:
        return [
            ResourceItem.model_validate(
                {
                    "id": "signed-prev",
                    "title": "[PREV] TTA H DSA 1 Signed",
                    "type": "video",
                    "topic": "dsa-pathways",
                    "description": "",
                    "duration": "1 min",
                    "access": "public",
                    "mux_playback_id": "signed-playback",
                    "mux_playback_signed": True,
                    "created_at": "2026-06-01T08:00:00Z",
                    "updated_at": "2026-06-01T08:00:00Z",
                }
            ),
            ResourceItem.model_validate(
                {
                    "id": "public-prev",
                    "title": "[PREV] TTA H DSA 2 Public",
                    "type": "video",
                    "topic": "dsa-pathways",
                    "description": "",
                    "duration": "2 min",
                    "access": "public",
                    "mux_playback_id": "public-playback",
                    "mux_playback_signed": False,
                    "created_at": "2026-06-01T08:00:00Z",
                    "updated_at": "2026-06-01T08:00:00Z",
                }
            ),
        ]

    monkeypatch.setattr(portal_previews_module, "list_resources", _fake_resources)
    previews = list_portal_course_previews()
    assert len(previews) == 1
    assert previews[0].id == "public-prev"
    assert previews[0].mux_playback_id == "public-playback"


def test_list_portal_course_previews_omits_missing_playback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _fake_resources() -> list[ResourceItem]:
        return [
            ResourceItem.model_validate(
                {
                    "id": "unprovisioned",
                    "title": "[PREV] TTA H DSA 1 Unprovisioned",
                    "type": "video",
                    "topic": "dsa-pathways",
                    "description": "",
                    "duration": "",
                    "access": "public",
                    "created_at": "2026-06-01T08:00:00Z",
                    "updated_at": "2026-06-01T08:00:00Z",
                }
            ),
        ]

    monkeypatch.setattr(portal_previews_module, "list_resources", _fake_resources)
    assert list_portal_course_previews() == []
