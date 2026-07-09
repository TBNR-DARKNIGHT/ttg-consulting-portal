from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

AnalyticsEventType = Literal[
    "page_view",
    "click",
    "session_start",
    "session_end",
    "heartbeat",
    "resource_view",
]


class AnalyticsEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID = Field(alias="eventId")
    event_type: AnalyticsEventType = Field(alias="eventType")
    session_id: UUID = Field(alias="sessionId")
    anonymous_id: UUID = Field(alias="anonymousId")
    occurred_at: datetime | None = Field(default=None, alias="occurredAt")
    page_path: str = Field(alias="pagePath", min_length=1, max_length=2048)
    page_title: str | None = Field(default=None, alias="pageTitle", max_length=300)
    resource_id: UUID | None = Field(default=None, alias="resourceId")
    duration_ms: int | None = Field(default=None, alias="durationMs", ge=0, le=86_400_000)
    metadata: dict[str, object] = Field(default_factory=dict)
    referrer: str | None = Field(default=None, max_length=2048)


class AnalyticsEventsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    events: list[AnalyticsEventIn] = Field(min_length=1, max_length=25)


class AnalyticsCaptureOut(BaseModel):
    accepted: int


class AnalyticsModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AnalyticsKpiOut(AnalyticsModel):
    label: str
    value: str
    detail: str | None = None
    tone: str = "neutral"


class AnalyticsTrendPointOut(AnalyticsModel):
    date: str
    active_users: int
    sessions: int
    page_views: int
    resource_views: int
    clicks: int


class AnalyticsResourceMetricOut(AnalyticsModel):
    resource_id: str | None
    title: str
    course_id: str | None = None
    type: str | None = None
    views: int
    unique_users: int
    views_per_user: float


class AnalyticsUserMetricOut(AnalyticsModel):
    user_id: str
    label: str
    email: str | None = None
    sessions: int
    events: int
    resource_views: int
    clicks: int
    avg_session_time_ms: int
    last_seen_at: str | None = None
    paid_courses: list[str] = Field(default_factory=list)


class AnalyticsPageMetricOut(AnalyticsModel):
    label: str
    path: str
    views: int
    unique_users: int


class AnalyticsClickMetricOut(AnalyticsModel):
    label: str
    clicks: int
    path: str | None = None


class AnalyticsReferrerMetricOut(AnalyticsModel):
    source: str
    visits: int


class AnalyticsIgnoredUserOut(AnalyticsModel):
    id: str
    user_id: str | None = None
    clerk_user_id: str | None = None
    email: str | None = None
    reason: str
    created_at: str


class AnalyticsIgnoredUserCreateIn(AnalyticsModel):
    user_id: str | None = Field(default=None, max_length=100)
    clerk_user_id: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    reason: str = Field(default="", max_length=500)


class AnalyticsEventMetricOut(AnalyticsModel):
    event_type: str
    occurred_at: str
    user_label: str
    page_path: str
    resource_title: str | None = None


class AnalyticsSummaryOut(AnalyticsModel):
    range_days: int
    generated_at: str
    event_count: int
    user_count: int
    paid_user_count: int
    active_user_count: int
    kpis: list[AnalyticsKpiOut]
    trend: list[AnalyticsTrendPointOut]
    top_resources: list[AnalyticsResourceMetricOut]
    top_users: list[AnalyticsUserMetricOut]
    low_engagement_users: list[AnalyticsUserMetricOut]
    top_pages: list[AnalyticsPageMetricOut]
    top_clicks: list[AnalyticsClickMetricOut]
    top_referrers: list[AnalyticsReferrerMetricOut]
    recent_events: list[AnalyticsEventMetricOut]
