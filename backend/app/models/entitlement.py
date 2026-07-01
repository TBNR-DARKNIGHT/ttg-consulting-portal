from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class EntitlementsOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    courses: list[str]


class RedeemCodeIn(BaseModel):
    code: str = Field(min_length=8, max_length=128)


class RedemptionOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    course_id: str
    status: str = "granted"
