from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import UserRole

T = TypeVar("T")


class ClerkUser(BaseModel):
    """Extracted from verified Clerk JWT claims."""

    clerk_id: str
    internal_user_id: UUID | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole = UserRole.CLIENT


class ApiError(BaseModel):
    message: str
    code: str


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response envelope. Every endpoint returns this shape."""

    data: T | None = None
    error: ApiError | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str


class ResourceOut(BaseModel):
    id: str
    title: str
    type: str
    topic: str
    topic_label: str
    description: str
    duration: str
    thumbnail_url: str | None = None
    content_url: str | None = None
    created_at: datetime
    updated_at: datetime


class ResourceProgressOut(BaseModel):
    resource_id: str
    user_id: str
    completed: bool
    completed_at: datetime | None = None
    last_accessed_at: datetime | None = None
