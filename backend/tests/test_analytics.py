from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.analytics import AnalyticsEventIn
from app.models.schemas import ClerkUser
from app.routers import analytics as analytics_router
from app.services.admin_analytics import get_admin_analytics_summary
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


class FakeSelectQuery:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.gte_filter: tuple[str, object] | None = None
        self.order_field: str | None = None
        self.order_desc = False
        self.range_start = 0
        self.range_end = 999

    def select(self, _columns: str) -> "FakeSelectQuery":
        return self

    def gte(self, field: str, value: object) -> "FakeSelectQuery":
        self.gte_filter = (field, value)
        return self

    def order(self, field: str, desc: bool = False) -> "FakeSelectQuery":
        self.order_field = field
        self.order_desc = desc
        return self

    def limit(self, limit: int) -> "FakeSelectQuery":
        self.range_start = 0
        self.range_end = limit - 1
        return self

    def range(self, start: int, end: int) -> "FakeSelectQuery":
        self.range_start = start
        self.range_end = end
        return self

    def execute(self):
        rows = list(self.rows)
        if self.gte_filter is not None:
            field, value = self.gte_filter
            threshold = value.isoformat() if hasattr(value, "isoformat") else value
            rows = [
                row
                for row in rows
                if row.get(field) is not None and str(row[field]) >= str(threshold)
            ]
        if self.order_field is not None:
            rows = sorted(
                rows,
                key=lambda row: row.get(self.order_field) or "",
                reverse=self.order_desc,
            )
        return SimpleNamespace(data=rows[self.range_start : self.range_end + 1])


class FakeAdminAnalyticsClient:
    def __init__(self) -> None:
        self.rows = {
            "analytics_events": [
                {
                    "event_id": str(uuid4()),
                    "event_type": "session_start",
                    "session_id": "11111111-1111-4111-8111-111111111111",
                    "anonymous_id": str(uuid4()),
                    "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "occurred_at": "2026-07-09T00:00:00+00:00",
                    "page_path": "/dashboard",
                },
                {
                    "event_id": str(uuid4()),
                    "event_type": "resource_view",
                    "session_id": "11111111-1111-4111-8111-111111111111",
                    "anonymous_id": str(uuid4()),
                    "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "occurred_at": "2026-07-09T00:01:00+00:00",
                    "page_path": "/dashboard/resources/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
                    "resource_id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
                },
                {
                    "event_id": str(uuid4()),
                    "event_type": "session_end",
                    "session_id": "11111111-1111-4111-8111-111111111111",
                    "anonymous_id": str(uuid4()),
                    "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "occurred_at": "2026-07-09T00:12:00+00:00",
                    "page_path": "/dashboard",
                    "duration_ms": 720000,
                },
                {
                    "event_id": str(uuid4()),
                    "event_type": "page_view",
                    "session_id": "11111111-1111-4111-8111-111111111111",
                    "anonymous_id": str(uuid4()),
                    "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "occurred_at": "2026-07-09T00:13:00+00:00",
                    "page_path": "/portal?utm_medium=paid&utm_source=ig&tab=overview",
                    "referrer": "https://www.beyondgrades.sg/auth/sign-up",
                },
            ],
            "users": [
                {
                    "id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "clerk_user_id": "user_paid",
                    "email": "paid@example.com",
                    "first_name": "Paid",
                    "last_name": "Parent",
                    "role": "CLIENT",
                    "status": "ACTIVE",
                },
                {
                    "id": "cccccccc-cccc-4ccc-cccc-cccccccccccc",
                    "clerk_user_id": "user_inactive",
                    "email": "inactive@example.com",
                    "first_name": "Quiet",
                    "last_name": "Parent",
                    "role": "CLIENT",
                    "status": "ACTIVE",
                },
            ],
            "course_entitlements": [
                {
                    "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                    "course_id": "course-2",
                    "granted_at": "2026-07-08T00:00:00+00:00",
                    "revoked_at": None,
                }
            ],
            "resources": [
                {
                    "id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
                    "title": "Interview Practice",
                    "course_id": "course-2",
                    "type": "video",
                    "topic": "Interview Preparation",
                }
            ],
            "analytics_ignored_users": [],
        }

    def table(self, name: str) -> FakeSelectQuery:
        return FakeSelectQuery(self.rows[name])


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
async def test_admin_analytics_summary_rolls_up_core_metrics() -> None:
    summary = await get_admin_analytics_summary(
        range_days=30,
        client=FakeAdminAnalyticsClient(),  # type: ignore[arg-type]
    )

    assert summary.event_count == 4
    assert summary.user_count == 2
    assert summary.paid_user_count == 1
    assert summary.active_user_count == 1
    assert summary.top_resources[0].title == "Interview Practice"
    assert summary.top_resources[0].views == 1
    assert summary.top_users[0].label == "Paid Parent"
    assert summary.top_users[0].avg_session_time_ms == 720000
    assert summary.low_engagement_users[0].email == "inactive@example.com"
    assert summary.top_pages[0].path == "/portal?tab=overview"
    assert summary.top_pages[0].label == "Portal"
    assert summary.top_referrers == []


@pytest.mark.asyncio
async def test_admin_analytics_summary_merges_referrer_protocols() -> None:
    client = FakeAdminAnalyticsClient()
    client.rows["analytics_events"].extend(
        [
            {
                "event_id": str(uuid4()),
                "event_type": "page_view",
                "session_id": "22222222-2222-4222-8222-222222222222",
                "anonymous_id": str(uuid4()),
                "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                "occurred_at": "2026-07-09T00:14:00+00:00",
                "page_path": "/portal",
                "referrer": "http://www.example.com/course?campaign=dsa",
            },
            {
                "event_id": str(uuid4()),
                "event_type": "page_view",
                "session_id": "22222222-2222-4222-8222-222222222222",
                "anonymous_id": str(uuid4()),
                "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                "occurred_at": "2026-07-09T00:15:00+00:00",
                "page_path": "/portal",
                "referrer": "https://example.com/course?campaign=dsa",
            },
        ]
    )

    summary = await get_admin_analytics_summary(
        range_days=30,
        client=client,  # type: ignore[arg-type]
    )

    assert summary.top_referrers[0].source == "https://example.com/course?campaign=dsa"
    assert summary.top_referrers[0].visits == 2


@pytest.mark.asyncio
async def test_admin_analytics_summary_excludes_ignored_users_from_follow_up_queue() -> None:
    client = FakeAdminAnalyticsClient()
    client.rows["analytics_ignored_users"] = [
        {
            "id": str(uuid4()),
            "email": "inactive@example.com",
            "reason": "Internal test user",
            "created_at": "2026-07-09T00:00:00+00:00",
        }
    ]

    summary = await get_admin_analytics_summary(
        range_days=30,
        client=client,  # type: ignore[arg-type]
    )

    assert summary.user_count == 1
    assert all(user.email != "inactive@example.com" for user in summary.low_engagement_users)


@pytest.mark.asyncio
async def test_admin_analytics_summary_pages_beyond_supabase_default_row_cap() -> None:
    client = FakeAdminAnalyticsClient()
    client.rows["analytics_events"] = [
        {
            "event_id": str(uuid4()),
            "event_type": "page_view",
            "session_id": "33333333-3333-4333-8333-333333333333",
            "anonymous_id": str(uuid4()),
            "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
            "occurred_at": f"2026-07-09T00:{index % 60:02d}:00+00:00",
            "page_path": "/portal",
        }
        for index in range(1205)
    ]

    summary = await get_admin_analytics_summary(
        range_days=30,
        client=client,  # type: ignore[arg-type]
    )

    assert summary.event_count == 1205
    assert summary.top_pages[0].views == 1205


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
