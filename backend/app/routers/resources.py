from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_optional_current_user
from app.models.enums import UserRole
from app.models.resource import ResourceItem, ResourceProgressItem
from app.models.schemas import ApiResponse, ClerkUser
from app.services.course_access_policy import is_public_resource
from app.services.content_repository import demo_progress_for_user, find_resource, list_resources
from app.services.entitlements import EntitlementServiceError, list_entitlements

router = APIRouter()

# Re-export for playback router and tests.
__all__ = ["ResourceItem", "ResourceProgressItem", "find_resource", "router"]


def _redact_paid_delivery_metadata(resource: ResourceItem) -> ResourceItem:
    return resource.model_copy(
        update={
            "bucket": None,
            "file_path": None,
            "thumbnail_url": None,
            "content_url": None,
            "mux_asset_id": None,
            "mux_playback_id": None,
        }
    )


@router.get("/resources", response_model=ApiResponse[list[ResourceItem]])
async def list_resources_endpoint(
    user: ClerkUser | None = Depends(get_optional_current_user),
) -> ApiResponse[list[ResourceItem]]:
    resources = list_resources()
    if user is not None and user.role is UserRole.ADMIN:
        return ApiResponse(data=resources)

    entitled_courses = {"course-1"}
    if user is not None and user.internal_user_id is not None:
        try:
            entitled_courses.update(await list_entitlements(user.internal_user_id))
        except EntitlementServiceError as exc:
            raise HTTPException(status_code=503, detail="Course access unavailable") from exc

    visible_resources = [
        _redact_paid_delivery_metadata(resource)
        if (
            resource.access == "paid"
            and not is_public_resource(resource)
            and resource.course_id not in entitled_courses
        )
        else resource
        for resource in resources
    ]
    return ApiResponse(data=visible_resources)


@router.get("/resources/progress", response_model=ApiResponse[list[ResourceProgressItem]])
async def list_resource_progress(
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[list[ResourceProgressItem]]:
    return ApiResponse(data=demo_progress_for_user(user.clerk_id))
