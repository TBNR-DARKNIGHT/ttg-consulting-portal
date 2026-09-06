from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ConsultationModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class ConsultationEnquiryIn(ConsultationModel):
    parent_name: str = Field(min_length=1, max_length=100)
    contact_number: str = Field(min_length=6, max_length=30, pattern=r"^[0-9+()\-\s]+$")
    child_school: str = Field(min_length=1, max_length=150)
    child_level: Literal[
        "P4",
        "P5",
        "P6",
        "Sec1",
        "Sec2",
        "Sec3",
        "Sec4",
        "JC1",
        "JC2",
        "Poly",
        "NS",
    ]
    programme: Literal["dsa", "basecamp", "both"]
    notes: str = Field(default="", max_length=2000)
    website: str = Field(default="", max_length=200)


class ConsultationEnquiryOut(ConsultationModel):
    status: Literal["sent"] = "sent"
