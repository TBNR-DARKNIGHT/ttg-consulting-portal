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
AnalyticsPeriodType = Literal["week", "month", "quarter"]


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
    signed_in_active_users: int = 0
    course_active_users: int = 0
    meaningfully_engaged_users: int = 0
    sessions: int
    page_views: int
    resource_views: int
    clicks: int
    completions: int = 0


class AnalyticsResourceMetricOut(AnalyticsModel):
    resource_id: str | None
    title: str
    course_id: str | None = None
    type: str | None = None
    views: int
    unique_users: int
    views_per_user: float
    starter_users: int = 0
    completed_users: int = 0
    completion_rate: float = 0
    average_progress: float = 0
    median_progress: float = 0
    repeat_viewers: int = 0


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
    distinct_resources: int = 0
    max_progress: int = 0
    completed_resources: int = 0
    content_engagement_ms: int = 0


class AnalyticsCourseOptionOut(AnalyticsModel):
    course_id: str
    label: str


class AnalyticsCourseEngagementOut(AnalyticsModel):
    course_id: str | None = None
    label: str
    course_active_users: int
    meaningfully_engaged_users: int
    meaningful_engagement_rate: float
    resource_starters: int
    resource_completions: int
    unique_completers: int
    average_progress: float
    median_progress: float
    repeat_users: int
    repeat_engagement_rate: float
    content_engagement_time_ms: int
    paid_eligible_users: int
    paid_activated_users: int
    paid_adoption_rate: float


class AnalyticsFunnelStepOut(AnalyticsModel):
    label: str
    users: int
    conversion_rate: float


class AnalyticsCampaignMetricOut(AnalyticsModel):
    source: str
    medium: str | None = None
    campaign: str | None = None
    sessions: int
    visitors: int
    signed_in_users: int
    course_active_users: int


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
    period_type: AnalyticsPeriodType
    selected_period_start: str
    period_label: str
    data_available_from: str | None = None
    selected_course_id: str | None = None
    period_start: str
    period_end: str
    generated_at: str
    event_count: int
    user_count: int
    paid_user_count: int
    active_user_count: int
    signed_in_active_user_count: int
    course_options: list[AnalyticsCourseOptionOut]
    course_engagement: AnalyticsCourseEngagementOut
    funnel: list[AnalyticsFunnelStepOut]
    kpis: list[AnalyticsKpiOut]
    trend: list[AnalyticsTrendPointOut]
    top_resources: list[AnalyticsResourceMetricOut]
    top_users: list[AnalyticsUserMetricOut]
    low_engagement_users: list[AnalyticsUserMetricOut]
    paid_inactive_users: list[AnalyticsUserMetricOut]
    top_pages: list[AnalyticsPageMetricOut]
    top_clicks: list[AnalyticsClickMetricOut]
    top_referrers: list[AnalyticsReferrerMetricOut]
    top_campaigns: list[AnalyticsCampaignMetricOut]
    recent_events: list[AnalyticsEventMetricOut]
