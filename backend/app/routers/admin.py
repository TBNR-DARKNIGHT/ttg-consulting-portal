from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, require_admin
from app.models.admin import (
    AccessCodeActionIn,
    AccessCodeOut,
    CreateAccessCodeIn,
    CurrentUserOut,
    IssuedAccessCodeOut,
)
from app.models.schemas import ApiResponse, ClerkUser
from app.services.admin_access_codes import (
    AdminAccessCodeError,
    CodeNotReissuableError,
    CodeNotRevocableError,
    create_access_code,
    list_access_codes,
    reissue_access_code,
    revoke_access_code,
)

router = APIRouter()


def _user_id(user: ClerkUser) -> UUID:
    if user.internal_user_id is None:
        raise HTTPException(status_code=503, detail="User profile unavailable")
    return user.internal_user_id


@router.get("/me", response_model=ApiResponse[CurrentUserOut])
async def get_me(user: ClerkUser = Depends(get_current_user)) -> ApiResponse[CurrentUserOut]:
    return ApiResponse(
        data=CurrentUserOut(
            id=_user_id(user),
            clerk_user_id=user.clerk_id,
            email=user.email,
            role=user.role.value,
        )
    )


@router.get(
    "/admin/access-codes",
    response_model=ApiResponse[list[AccessCodeOut]],
    dependencies=[Depends(require_admin)],
)
async def get_access_codes() -> ApiResponse[list[AccessCodeOut]]:
    try:
        rows = await list_access_codes()
        return ApiResponse(data=[AccessCodeOut.model_validate(row) for row in rows])
    except AdminAccessCodeError as exc:
        raise HTTPException(status_code=503, detail="Access codes unavailable") from exc


@router.post(
    "/admin/access-codes",
    response_model=ApiResponse[IssuedAccessCodeOut],
    status_code=status.HTTP_201_CREATED,
)
async def issue_access_code(
    body: CreateAccessCodeIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[IssuedAccessCodeOut]:
    try:
        code_id, plaintext = await create_access_code(
            actor_user_id=_user_id(user),
            course_id=body.course_id,
            order_id=body.order_id,
            expires_at=body.expires_at,
        )
        return ApiResponse(data=IssuedAccessCodeOut(id=code_id, code=plaintext))
    except AdminAccessCodeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/admin/access-codes/{code_id}/revoke", response_model=ApiResponse[None])
async def revoke_code(
    code_id: UUID,
    body: AccessCodeActionIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[None]:
    try:
        await revoke_access_code(
            code_id, actor_user_id=_user_id(user), reason=body.reason
        )
        return ApiResponse(data=None)
    except CodeNotRevocableError as exc:
        raise HTTPException(status_code=409, detail="Code cannot be revoked") from exc
    except AdminAccessCodeError as exc:
        raise HTTPException(status_code=503, detail="Unable to revoke code") from exc


@router.post(
    "/admin/access-codes/{code_id}/reissue",
    response_model=ApiResponse[IssuedAccessCodeOut],
)
async def reissue_code(
    code_id: UUID,
    body: AccessCodeActionIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[IssuedAccessCodeOut]:
    try:
        new_id, plaintext = await reissue_access_code(
            code_id, actor_user_id=_user_id(user), reason=body.reason
        )
        return ApiResponse(data=IssuedAccessCodeOut(id=new_id, code=plaintext))
    except CodeNotReissuableError as exc:
        raise HTTPException(status_code=409, detail="Code cannot be reissued") from exc
    except AdminAccessCodeError as exc:
        raise HTTPException(status_code=503, detail="Unable to reissue code") from exc

