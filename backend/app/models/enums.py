from __future__ import annotations

import sys

if sys.version_info >= (3, 11):
    from enum import StrEnum
else:
    from enum import Enum

    class StrEnum(str, Enum):
        pass


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    CONSULTANT = "CONSULTANT"
    CLIENT = "CLIENT"


class ResourceType(StrEnum):
    VIDEO = "video"
    PDF = "pdf"
    ARTICLE = "article"
    MODULE = "module"


class ContentTopic(StrEnum):
    DSA_PATHWAYS = "dsa-pathways"
    INTERVIEW_PREPARATION = "interview-preparation"
    TIMELINES_DEADLINES = "timelines-deadlines"


class Programme(StrEnum):
    DSA = "dsa"
    MAPLEBEAR_STUDENT_CARE = "maplebear-student-care"
    MAPLEBEAR_YOUNG_EXPLORERS = "maplebear-young-explorers"
    BASE_CAMP = "base-camp"
    UNIVERSITY_CONSULTING = "university-consulting"
