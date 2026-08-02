from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_optional_current_user
from app.models.enums import UserRole
from app.models.resource import (
    ResourceCompletionUpdate,
    ResourceItem,
    ResourceProgressItem,
    ResourceProgressUpdate,
)
from app.models.schemas import ApiResponse, ClerkUser
from app.services import resource_progress as progress_service
from app.services.content_repository import (
    find_resource,
    list_resources,
)
from app.services.course_access_policy import can_user_access_resource, is_public_resource
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
    resources = await asyncio.to_thread(list_resources)
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
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    try:
        progress = await progress_service.list_progress(user.internal_user_id)
    except progress_service.ResourceProgressError as exc:
        raise HTTPException(status_code=503, detail="Resource progress unavailable") from exc
    return ApiResponse(data=progress)


async def _get_accessible_resource_for_progress(
    resource_id: str,
    user: ClerkUser,
) -> ResourceItem:
    resource = await asyncio.to_thread(find_resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    try:
        allowed = await can_user_access_resource(resource, user)
    except EntitlementServiceError as exc:
        raise HTTPException(status_code=503, detail="Course access unavailable") from exc
    if not allowed:
        raise HTTPException(status_code=403, detail="Course access required")
    return resource


async def _get_course_resources_for_progress(course_id: str) -> list[ResourceItem]:
    course_resources = [
        resource
        for resource in await asyncio.to_thread(list_resources)
        if resource.course_id == course_id
    ]
    if not course_resources:
        raise HTTPException(status_code=404, detail="Course not found")
    return course_resources


@router.patch(
    "/resources/{resource_id}/progress",
    response_model=ApiResponse[ResourceProgressItem],
)
async def update_resource_progress(
    resource_id: str,
    body: ResourceProgressUpdate,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[ResourceProgressItem]:
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    resource = await _get_accessible_resource_for_progress(resource_id, user)
    try:
        progress = await progress_service.update_progress(user.internal_user_id, resource, body)
    except progress_service.ResourceProgressError as exc:
        raise HTTPException(status_code=503, detail="Resource progress unavailable") from exc
    return ApiResponse(data=progress)


@router.post(
    "/resources/{resource_id}/complete",
    response_model=ApiResponse[ResourceProgressItem],
)
async def mark_resource_complete(
    resource_id: str,
    body: ResourceCompletionUpdate | None = None,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[ResourceProgressItem]:
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    resource = await _get_accessible_resource_for_progress(resource_id, user)
    try:
        progress = await progress_service.mark_complete(
            user.internal_user_id,
            resource,
            body or ResourceCompletionUpdate(),
        )
    except progress_service.ResourceProgressError as exc:
        raise HTTPException(status_code=503, detail="Resource progress unavailable") from exc
    return ApiResponse(data=progress)


@router.delete(
    "/resources/{resource_id}/complete",
    response_model=ApiResponse[ResourceProgressItem],
)
async def mark_resource_incomplete(
    resource_id: str,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[ResourceProgressItem]:
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    resource = await _get_accessible_resource_for_progress(resource_id, user)
    try:
        progress = await progress_service.mark_incomplete(user.internal_user_id, resource)
    except progress_service.ResourceProgressError as exc:
        raise HTTPException(status_code=503, detail="Resource progress unavailable") from exc
    return ApiResponse(data=progress)


@router.delete("/courses/{course_id}/progress", response_model=ApiResponse[None])
async def reset_course_progress(
    course_id: str,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[None]:
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    resources = await _get_course_resources_for_progress(course_id)
    try:
        await progress_service.reset_course_progress(user.internal_user_id, resources)
    except progress_service.ResourceProgressError as exc:
        raise HTTPException(status_code=503, detail="Resource progress unavailable") from exc
    return ApiResponse(data=None)
