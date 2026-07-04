from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator
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


class CreateTtaCodeBatchIn(AdminModel):
    quantity: int = Field(ge=1, le=500)


class TtaCodeBatchOut(AdminModel):
    quantity: int
    sheet_tab: str


class BulkRevokeAccessCodesOut(AdminModel):
    revoked_count: int


class DeleteRevokedAccessCodesOut(AdminModel):
    deleted_count: int


class ResourceUploadMetadata(AdminModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=2000)
    course_id: str = Field(
        min_length=1, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    )
    module_id: str | None = None
    module_title: str | None = Field(default=None, min_length=1, max_length=300)
    topic: str = Field(min_length=1, max_length=100)

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title cannot be blank")
        return value


class ResourceMetadataUpdateIn(AdminModel):
    title: str = Field(min_length=1, max_length=300)
    topic: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)

    @field_validator("title")
    @classmethod
    def title_cannot_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title cannot be blank")
        return value


class CreateVideoUploadIn(ResourceUploadMetadata):
    content_type: str = Field(default="video/mp4", max_length=100)


class CreateLinkUploadIn(ResourceUploadMetadata):
    url: HttpUrl
    resource_type: str = Field(pattern=r"^(pdf|video)$")


class ResourceUploadOut(AdminModel):
    resource_id: UUID
    type: str
    status: str
    upload_url: str | None = None
    upload_id: str | None = None


class ResourceUploadOptionsOut(AdminModel):
    courses: list[str]
    topics_by_course: dict[str, list[str]]
    modules_by_course: dict[str, list[dict[str, str]]]
