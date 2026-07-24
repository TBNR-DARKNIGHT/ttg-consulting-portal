from __future__ import annotations

from functools import lru_cache

from app.config import settings
from app.models.enums import UserRole
from app.models.resource import ResourceItem
from app.models.schemas import ClerkUser
from app.services.entitlements import EntitlementServiceError, has_course_access


@lru_cache(maxsize=1)
def public_course_ids() -> set[str]:
    return {
        course_id.strip()
        for course_id in settings.public_course_ids.split(",")
        if course_id.strip()
    }


def is_public_course(course_id: str | None) -> bool:
    return course_id in public_course_ids() if course_id else False


def is_public_resource(resource: ResourceItem) -> bool:
    return resource.access != "paid" or is_public_course(resource.course_id)


async def can_user_access_resource(
    resource: ResourceItem,
    user: ClerkUser | None,
) -> bool:
    if is_public_resource(resource):
        return True
    if user is not None and user.role is UserRole.ADMIN:
        return True
    if not resource.course_id or user is None or user.internal_user_id is None:
        return False
    try:
        return await has_course_access(user.internal_user_id, resource.course_id)
    except EntitlementServiceError:
        raise
