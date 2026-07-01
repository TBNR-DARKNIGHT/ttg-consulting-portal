from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.entitlement import EntitlementsOut, RedeemCodeIn, RedemptionOut
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

router = APIRouter()


def _internal_user_id(user: ClerkUser):
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    return user.internal_user_id


@router.get("/me/entitlements", response_model=ApiResponse[EntitlementsOut])
async def get_my_entitlements(
    user: ClerkUser = Depends(get_current_user),
) -> ApiResponse[EntitlementsOut]:
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

    return ApiResponse(data=RedemptionOut(course_id=course_id))
