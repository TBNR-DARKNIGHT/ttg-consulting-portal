from __future__ import annotations

from datetime import UTC, date, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.analytics import AnalyticsEventIn
from app.models.schemas import ClerkUser
from app.routers import analytics as analytics_router
from app.services.admin_analytics import _period_bounds, get_admin_analytics_summary
from app.services.analytics import capture_events


class FakeAnalyticsInsert:
    def __init__(self) -> None:
        self.rows: list[dict[str, object]] | None = None
        self.on_conflict: str | None = None
        self.ignore_duplicates = False

    def upsert(
        self,
        rows: list[dict[str, object]],
        *,
        on_conflict: str,
        ignore_duplicates: bool,
    ) -> "FakeAnalyticsInsert":
        self.rows = rows
        self.on_conflict = on_conflict
        self.ignore_duplicates = ignore_duplicates
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
        self.lt_filter: tuple[str, object] | None = None
        self.order_field: str | None = None
        self.order_desc = False
        self.range_start = 0
        self.range_end = 999

    def select(self, _columns: str) -> "FakeSelectQuery":
        return self

    def gte(self, field: str, value: object) -> "FakeSelectQuery":
        self.gte_filter = (field, value)
        return self

    def lt(self, field: str, value: object) -> "FakeSelectQuery":
        self.lt_filter = (field, value)
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
        if self.lt_filter is not None:
            field, value = self.lt_filter
            threshold = value.isoformat() if hasattr(value, "isoformat") else value
            rows = [
                row
                for row in rows
                if row.get(field) is not None and str(row[field]) < str(threshold)
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
            "resource_progress_events": [],
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
    assert client.query.on_conflict == "event_id"
    assert client.query.ignore_duplicates is True


@pytest.mark.asyncio
async def test_admin_analytics_summary_rolls_up_core_metrics() -> None:
    summary = await get_admin_analytics_summary(
        period_type="month",
        period_start=date(2026, 7, 1),
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
    assert summary.course_engagement.course_active_users == 1
    assert summary.course_engagement.meaningfully_engaged_users == 0
    assert summary.funnel[1].label == "Course active"
    assert summary.funnel[1].users == 1
    assert summary.period_label == "Jul 2026"
    assert summary.data_available_from == "2026-07-09"


def test_reporting_period_labels_and_singapore_boundaries() -> None:
    now = datetime(2026, 8, 16, 12, tzinfo=UTC)
    week = _period_bounds(
        period_type="week",
        period_start=date(2026, 1, 12),
        now=now,
    )
    month = _period_bounds(
        period_type="month",
        period_start=date(2026, 8, 1),
        now=now,
    )
    quarter = _period_bounds(
        period_type="quarter",
        period_start=date(2026, 1, 1),
        now=now,
    )

    assert week.label == "W3 Jan 2026"
    assert week.start == datetime(2026, 1, 11, 16, tzinfo=UTC)
    assert week.end == datetime(2026, 1, 18, 16, tzinfo=UTC)
    assert week.trend_day_count == 7
    assert month.label == "Aug 2026"
    assert month.start == datetime(2026, 7, 31, 16, tzinfo=UTC)
    assert month.trend_day_count == 16
    assert quarter.label == "Q1 2026"
    assert quarter.end == datetime(2026, 3, 31, 16, tzinfo=UTC)


@pytest.mark.asyncio
async def test_admin_analytics_summary_counts_progress_as_meaningful_engagement() -> None:
    client = FakeAdminAnalyticsClient()
    client.rows["resource_progress_events"] = [
        {
            "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
            "resource_id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            "event_type": "progressed",
            "occurred_at": "2026-07-09T00:06:00+00:00",
            "status": "in_progress",
            "progress_percent": 30,
            "pages_viewed_count": 0,
        }
    ]

    summary = await get_admin_analytics_summary(
        period_type="month",
        period_start=date(2026, 7, 1),
        course_id="course-2",
        client=client,  # type: ignore[arg-type]
    )

    assert summary.course_engagement.course_active_users == 1
    assert summary.course_engagement.meaningfully_engaged_users == 1
    assert summary.course_engagement.resource_starters == 1
    assert summary.course_engagement.average_progress == 30
    assert summary.top_resources[0].starter_users == 1
    assert summary.kpis[0].label == "Meaningfully engaged"
    assert summary.kpis[0].value == "1"


@pytest.mark.asyncio
async def test_admin_analytics_summary_counts_distinct_resources_once_per_user() -> None:
    client = FakeAdminAnalyticsClient()
    second_resource_id = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"
    client.rows["resources"].append(
        {
            "id": second_resource_id,
            "title": "Planning Checklist",
            "course_id": "course-2",
            "type": "pdf",
            "topic": "Interview Preparation",
        }
    )
    client.rows["analytics_events"].extend(
        [
            {
                "event_id": str(uuid4()),
                "event_type": "resource_view",
                "session_id": "11111111-1111-4111-8111-111111111111",
                "anonymous_id": str(uuid4()),
                "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                "occurred_at": "2026-07-09T00:04:00+00:00",
                "page_path": f"/dashboard/resources/{second_resource_id}",
                "resource_id": second_resource_id,
            },
            {
                "event_id": str(uuid4()),
                "event_type": "resource_view",
                "session_id": "11111111-1111-4111-8111-111111111111",
                "anonymous_id": str(uuid4()),
                "user_id": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
                "occurred_at": "2026-07-09T00:05:00+00:00",
                "page_path": f"/dashboard/resources/{second_resource_id}",
                "resource_id": second_resource_id,
            },
        ]
    )

    summary = await get_admin_analytics_summary(
        period_type="month",
        period_start=date(2026, 7, 1),
        course_id="course-2",
        client=client,  # type: ignore[arg-type]
    )

    assert summary.course_engagement.meaningfully_engaged_users == 1
    assert summary.top_users[0].distinct_resources == 2
    checklist = next(row for row in summary.top_resources if row.resource_id == second_resource_id)
    assert checklist.views == 2
    assert checklist.unique_users == 1
    assert checklist.repeat_viewers == 1


@pytest.mark.asyncio
async def test_paid_adoption_requires_activity_in_an_eligible_paid_course() -> None:
    client = FakeAdminAnalyticsClient()
    free_resource_id = "ffffffff-ffff-4fff-8fff-ffffffffffff"
    client.rows["resources"].append(
        {
            "id": free_resource_id,
            "title": "Free Planning Guide",
            "course_id": "course-1",
            "type": "pdf",
            "topic": "Planning",
        }
    )
    client.rows["course_entitlements"].append(
        {
            "user_id": "cccccccc-cccc-4ccc-cccc-cccccccccccc",
            "course_id": "course-2",
            "granted_at": "2026-07-08T00:00:00+00:00",
            "revoked_at": None,
        }
    )
    client.rows["analytics_events"].append(
        {
            "event_id": str(uuid4()),
            "event_type": "resource_view",
            "session_id": "55555555-5555-4555-8555-555555555555",
            "anonymous_id": str(uuid4()),
            "user_id": "cccccccc-cccc-4ccc-cccc-cccccccccccc",
            "occurred_at": "2026-07-09T00:05:00+00:00",
            "page_path": f"/dashboard/resources/{free_resource_id}",
            "resource_id": free_resource_id,
        }
    )

    summary = await get_admin_analytics_summary(
        period_type="month",
        period_start=date(2026, 7, 1),
        client=client,  # type: ignore[arg-type]
    )

    assert summary.course_engagement.paid_eligible_users == 2
    assert summary.course_engagement.paid_activated_users == 1
    assert summary.course_engagement.paid_adoption_rate == 50
    assert {user.email for user in summary.paid_inactive_users} == {"inactive@example.com"}


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
        period_type="month",
        period_start=date(2026, 7, 1),
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
        period_type="month",
        period_start=date(2026, 7, 1),
        client=client,  # type: ignore[arg-type]
    )

    assert summary.user_count == 1
    assert all(user.email != "inactive@example.com" for user in summary.low_engagement_users)


@pytest.mark.asyncio
async def test_admin_analytics_summary_excludes_ignored_user_activity_from_rollups() -> None:
    client = FakeAdminAnalyticsClient()
    client.rows["users"].append(
        {
            "id": "dddddddd-dddd-4ddd-dddd-dddddddddddd",
            "clerk_user_id": "user_internal",
            "email": "internal@example.com",
            "first_name": "Internal",
            "last_name": "Tester",
            "role": "CLIENT",
            "status": "ACTIVE",
        }
    )
    client.rows["analytics_ignored_users"] = [
        {
            "id": str(uuid4()),
            "email": "internal@example.com",
            "reason": "Internal test user",
            "created_at": "2026-07-09T00:00:00+00:00",
        }
    ]
    client.rows["analytics_events"].extend(
        [
            {
                "event_id": str(uuid4()),
                "event_type": "page_view",
                "session_id": "44444444-4444-4444-8444-444444444444",
                "anonymous_id": str(uuid4()),
                "user_id": "dddddddd-dddd-4ddd-dddd-dddddddddddd",
                "occurred_at": "2026-07-09T00:20:00+00:00",
                "page_path": "/ignored-page",
                "referrer": "https://example.com/internal",
            },
            {
                "event_id": str(uuid4()),
                "event_type": "resource_view",
                "session_id": "44444444-4444-4444-8444-444444444444",
                "anonymous_id": str(uuid4()),
                "user_id": "dddddddd-dddd-4ddd-dddd-dddddddddddd",
                "occurred_at": "2026-07-09T00:21:00+00:00",
                "page_path": "/dashboard/resources/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
                "resource_id": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            },
            {
                "event_id": str(uuid4()),
                "event_type": "click",
                "session_id": "44444444-4444-4444-8444-444444444444",
                "anonymous_id": str(uuid4()),
                "user_id": "dddddddd-dddd-4ddd-dddd-dddddddddddd",
                "occurred_at": "2026-07-09T00:22:00+00:00",
                "page_path": "/ignored-page",
                "metadata": {"analyticsId": "ignored-cta"},
            },
        ]
    )

    summary = await get_admin_analytics_summary(
        period_type="month",
        period_start=date(2026, 7, 1),
        client=client,  # type: ignore[arg-type]
    )

    assert summary.event_count == 4
    assert all(page.path != "/ignored-page" for page in summary.top_pages)
    assert summary.top_referrers == []
    assert all(click.label != "ignored-cta" for click in summary.top_clicks)
    assert summary.top_resources[0].views == 1
    assert all(user.email != "internal@example.com" for user in summary.top_users)


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
        period_type="month",
        period_start=date(2026, 7, 1),
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
