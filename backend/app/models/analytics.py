from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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
