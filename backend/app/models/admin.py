from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class AdminModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CurrentUserOut(AdminModel):
    id: UUID
    clerk_user_id: str
    email: str | None
    role: str


class CreateAccessCodeIn(AdminModel):
    course_id: str = "course-2"
    order_id: str | None = Field(default=None, max_length=200)
    expires_at: datetime | None = None


class AccessCodeActionIn(AdminModel):
    reason: str = Field(min_length=3, max_length=500)


class AccessCodeOut(AdminModel):
    id: UUID
    course_id: str
    order_id: str | None = None
    redeemed_by_user_id: UUID | None = None
    redeemed_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime
    created_by_user_id: UUID | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: UUID | None = None
    revocation_reason: str | None = None
    replacement_for_code_id: UUID | None = None


class IssuedAccessCodeOut(AdminModel):
    id: UUID
    code: str
