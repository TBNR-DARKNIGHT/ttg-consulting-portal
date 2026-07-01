from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator
from pydantic.alias_generators import to_camel


class ResourceItem(BaseModel):
    """Matches the frontend `Resource` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    title: str
    course_id: str | None = None
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
            self.course_id = (
                "course-2" if self.topic == "interview-preparation" else "course-1"
            )
        return self


class ResourceProgressItem(BaseModel):
    """Matches the frontend `ResourceProgress` type (camelCase in JSON)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    resource_id: str
    user_id: str
    completed: bool
    completed_at: datetime | None = None
    last_accessed_at: datetime | None = None
