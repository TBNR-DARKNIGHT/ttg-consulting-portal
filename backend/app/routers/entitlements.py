from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.entitlement import EntitlementsOut, RedeemCodeIn, RedemptionOut
from app.models.enums import UserRole
from app.models.schemas import ApiResponse, ClerkUser
from app.services.entitlements import (
    AlreadyEntitledError,
    CodeAlreadyRedeemedError,
    CodeExpiredError,
    EntitlementServiceError,
    InvalidCodeError,
    LocalUserNotFoundError,
    list_entitlements,
    redeem_code,
)
from app.services.google_sheets import GoogleSheetsError, UserSheetRow, upsert_user_row

router = APIRouter()
logger = structlog.get_logger()


def _internal_user_id(user: ClerkUser):
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    return user.internal_user_id


@router.get("/me/entitlements", response_model=ApiResponse[EntitlementsOut])
async def get_my_entitlements(
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[EntitlementsOut]:
    if user.role is UserRole.ADMIN:
        return ApiResponse(data=EntitlementsOut(courses=["course-1", "course-2"]))
    try:
        courses = await list_entitlements(_internal_user_id(user))
    except EntitlementServiceError as exc:
        raise HTTPException(status_code=503, detail="Course access unavailable") from exc
    return ApiResponse(data=EntitlementsOut(courses=courses))


@router.post("/entitlements/redeem", response_model=ApiResponse[RedemptionOut])
async def redeem_entitlement(
    body: RedeemCodeIn,
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[RedemptionOut]:
    try:
        course_id = await redeem_code(_internal_user_id(user), body.code)
    except InvalidCodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid redemption code") from exc
    except CodeAlreadyRedeemedError as exc:
        raise HTTPException(status_code=409, detail="Code has already been redeemed") from exc
    except CodeExpiredError as exc:
        raise HTTPException(status_code=410, detail="Code has expired") from exc
    except AlreadyEntitledError as exc:
        raise HTTPException(status_code=409, detail="Course access is already active") from exc
    except LocalUserNotFoundError as exc:
        raise HTTPException(status_code=503, detail="User profile unavailable") from exc
    except EntitlementServiceError as exc:
        raise HTTPException(status_code=503, detail="Redemption service unavailable") from exc

    try:
        courses = await list_entitlements(_internal_user_id(user))
        await upsert_user_row(
            UserSheetRow(
                clerk_user_id=user.clerk_id,
                email=user.email or "",
                first_name=user.first_name,
                last_name=user.last_name,
                has_course_2_access="course-2" in courses,
            )
        )
    except (EntitlementServiceError, GoogleSheetsError):
        # The entitlement is already committed. Reporting failure must not make
        # a successfully consumed one-time code appear to have failed.
        logger.exception(
            "Course access granted but Google Sheets user sync failed",
            clerk_user_id=user.clerk_id,
            course_id=course_id,
        )

    return ApiResponse(data=RedemptionOut(course_id=course_id))
