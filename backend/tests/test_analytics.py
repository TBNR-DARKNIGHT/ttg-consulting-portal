from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.analytics import AnalyticsEventIn
from app.models.schemas import ClerkUser
from app.routers import analytics as analytics_router
from app.services.analytics import capture_events


class FakeAnalyticsInsert:
    def __init__(self) -> None:
        self.rows: list[dict[str, object]] | None = None

    def insert(self, rows: list[dict[str, object]]) -> "FakeAnalyticsInsert":
        self.rows = rows
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class FakeAnalyticsClient:
    def __init__(self) -> None:
        self.query = FakeAnalyticsInsert()

    def table(self, name: str) -> FakeAnalyticsInsert:
        assert name == "analytics_events"
        return self.query


@pytest.mark.asyncio
async def test_capture_events_stores_authenticated_user_context() -> None:
    user_id = uuid4()
    session_id = uuid4()
    anonymous_id = uuid4()
    event_id = uuid4()
    client = FakeAnalyticsClient()

    accepted = await capture_events(
        [
            AnalyticsEventIn.model_validate(
                {
                    "eventType": "resource_view",
                    "eventId": str(event_id),
                    "sessionId": str(session_id),
                    "anonymousId": str(anonymous_id),
                    "pagePath": "/dashboard/resources/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "resourceId": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "metadata": {"nested": {"value": "ok"}},
                }
            )
        ],
        user=ClerkUser(clerk_id="user_clerk", internal_user_id=user_id),
        user_agent="pytest",
        client=client,  # type: ignore[arg-type]
    )

    assert accepted == 1
    assert client.query.rows is not None
    assert client.query.rows[0]["event_id"] == str(event_id)
    assert client.query.rows[0]["user_id"] == str(user_id)
    assert client.query.rows[0]["clerk_user_id"] == "user_clerk"
    assert client.query.rows[0]["resource_id"] == "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"


@pytest.mark.asyncio
async def test_analytics_endpoint_accepts_anonymous_events(
    client,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured = {}

    async def fake_capture_events(events, *, user=None, user_agent=None):
        captured["events"] = events
        captured["user"] = user
        captured["user_agent"] = user_agent
        return len(events)

    monkeypatch.setattr(analytics_router, "capture_events", fake_capture_events)

    response = await client.post(
        "/api/v1/analytics/events",
        json={
            "events": [
                {
                    "eventType": "page_view",
                    "eventId": str(uuid4()),
                    "sessionId": str(uuid4()),
                    "anonymousId": str(uuid4()),
                    "pagePath": "/",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["data"] == {"accepted": 1}
    assert captured["user"] is None


@pytest.mark.asyncio
async def test_analytics_endpoint_limits_batch_size(client) -> None:
    event = {
        "eventType": "click",
        "eventId": str(uuid4()),
        "sessionId": str(uuid4()),
        "anonymousId": str(uuid4()),
        "pagePath": "/",
    }

    response = await client.post(
        "/api/v1/analytics/events",
        json={"events": [event for _ in range(26)]},
    )

    assert response.status_code == 422
