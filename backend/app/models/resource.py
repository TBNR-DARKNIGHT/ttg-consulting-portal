from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class ResourceItem(BaseModel):
    """Matches the frontend `Resource` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    title: str
    course_id: str | None = None
    module_id: str | None = None
    type: str
    topic: str
    description: str
    duration: str
    access: str | None = None
    bucket: str | None = None
    file_path: str | None = None
    thumbnail_url: str | None = None
    content_url: str | None = None
    mux_asset_id: str | None = None
    mux_playback_id: str | None = None
    mux_playback_signed: bool = False
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def infer_course_id(self) -> "ResourceItem":
        if self.course_id is None:
            self.course_id = "course-2" if self.topic == "interview-preparation" else "course-1"
        return self


class ResourceProgressItem(BaseModel):
    """Matches the frontend `ResourceProgress` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    resource_id: str
    user_id: str
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    completed: bool
    progress_percent: int = Field(default=0, ge=0, le=100)
    completed_at: datetime | None = None
    last_accessed_at: datetime | None = None
    last_position_seconds: int | None = None
    duration_seconds: int | None = None
    pages_viewed: list[int] = Field(default_factory=list)
    page_count: int | None = None
    completion_source: Literal["manual", "video_threshold", "video_ended"] | None = None


class ResourceProgressUpdate(BaseModel):
    """Incremental progress payload accepted from viewers and players."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    progress_percent: int | None = Field(default=None, ge=0, le=100)
    last_position_seconds: int | None = Field(default=None, ge=0)
    duration_seconds: int | None = Field(default=None, ge=0)
    pages_viewed: list[int] | None = None
    page_count: int | None = Field(default=None, ge=0)
    completed: bool | None = None
    completion_source: Literal["manual", "video_threshold", "video_ended"] | None = None


class ResourceCompletionUpdate(BaseModel):
    """Manual completion payload for resources that cannot be verified automatically."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    completion_source: Literal["manual", "video_threshold", "video_ended"] = "manual"
