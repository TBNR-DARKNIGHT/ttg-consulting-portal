from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class IntegrationModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class WooCommerceAccessCodeIn(IntegrationModel):
    order_id: str = Field(min_length=1, max_length=200)
    course_id: str = Field(default="course-2", pattern=r"^course-2$")

    @field_validator("order_id")
    @classmethod
    def order_id_cannot_be_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Order ID cannot be blank")
        return normalized


class WooCommerceAccessCodeOut(IntegrationModel):
    id: UUID
    code: str
    order_id: str
