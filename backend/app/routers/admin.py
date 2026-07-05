from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.dependencies import get_current_user, require_admin
from app.models.admin import (
    AccessCodeActionIn,
    AccessCodeOut,
    BulkRevokeAccessCodesOut,
    CompleteDocumentUploadIn,
    CreateAccessCodeIn,
    CreateDocumentUploadIn,
    CreateLinkUploadIn,
    CreateTtaCodeBatchIn,
    CreateVideoUploadIn,
    CurrentUserOut,
    DeleteRevokedAccessCodesOut,
    DocumentUploadTargetOut,
    IssuedAccessCodeOut,
    ResetTtaOrderNumberingOut,
    ResourceMetadataUpdateIn,
    ResourceUploadOptionsOut,
    ResourceUploadOut,
    TtaCodeBatchOut,
)
from app.models.schemas import ApiResponse, ClerkUser
from app.services.admin_access_codes import (
    ActiveTtaCodesExistError,
    AdminAccessCodeError,
    CodeNotReissuableError,
    CodeNotRevocableError,
    create_access_code,
    create_tta_code_batch,
    delete_revoked_access_codes,
    list_access_codes,
    reissue_access_code,
    reset_tta_order_numbering,
    revoke_access_code,
    revoke_all_active_access_codes,
)
from app.services.admin_resource_uploads import (
    ResourceUploadError,
    begin_pdf_upload,
    begin_video_upload,
    complete_pdf_upload,
    complete_video_upload,
    delete_resource,
    ingest_link,
    list_upload_options,
    update_resource_metadata,
)
from app.services.external_files import ExternalFileError
from app.services.google_sheets import GoogleSheetsError
from app.services.mux_client import MuxClientError

logger = logging.getLogger(__name__)
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


@router.post(
    "/admin/access-codes/tta-batch",
    response_model=ApiResponse[TtaCodeBatchOut],
    status_code=status.HTTP_201_CREATED,
)
async def issue_tta_code_batch(
    body: CreateTtaCodeBatchIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[TtaCodeBatchOut]:
    try:
        quantity = await create_tta_code_batch(
            actor_user_id=_user_id(user),
            quantity=body.quantity,
        )
        return ApiResponse(
            data=TtaCodeBatchOut(
                quantity=quantity,
                sheet_tab=settings.google_sheets_tta_codes_tab,
            )
        )
    except GoogleSheetsError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Codes were created in Supabase, but Google Sheets export failed. "
                "Do not generate another batch until an administrator checks the code records."
            ),
        ) from exc
    except AdminAccessCodeError as exc:
        raise HTTPException(status_code=503, detail="Unable to create TTA codes") from exc


@router.post(
    "/admin/access-codes/revoke-all-active",
    response_model=ApiResponse[BulkRevokeAccessCodesOut],
)
async def revoke_all_active_codes(
    body: AccessCodeActionIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[BulkRevokeAccessCodesOut]:
    try:
        count = await revoke_all_active_access_codes(
            actor_user_id=_user_id(user),
            reason=body.reason,
        )
        return ApiResponse(
            data=BulkRevokeAccessCodesOut(revoked_count=count)
        )
    except AdminAccessCodeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to revoke active access codes",
        ) from exc


@router.post(
    "/admin/access-codes/delete-revoked",
    response_model=ApiResponse[DeleteRevokedAccessCodesOut],
)
async def delete_revoked_codes(
    body: AccessCodeActionIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[DeleteRevokedAccessCodesOut]:
    try:
        count = await delete_revoked_access_codes(
            actor_user_id=_user_id(user),
            reason=body.reason,
        )
        return ApiResponse(
            data=DeleteRevokedAccessCodesOut(deleted_count=count)
        )
    except AdminAccessCodeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to delete revoked access codes",
        ) from exc


@router.post(
    "/admin/access-codes/reset-tta-numbering",
    response_model=ApiResponse[ResetTtaOrderNumberingOut],
)
async def reset_tta_numbering(
    body: AccessCodeActionIn,
    user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResetTtaOrderNumberingOut]:
    try:
        next_order_id = await reset_tta_order_numbering(
            actor_user_id=_user_id(user),
            reason=body.reason,
        )
        return ApiResponse(
            data=ResetTtaOrderNumberingOut(next_order_id=next_order_id)
        )
    except ActiveTtaCodesExistError as exc:
        raise HTTPException(
            status_code=409,
            detail=(
                "Revoke all active TTA codes before resetting the numbering"
            ),
        ) from exc
    except AdminAccessCodeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to reset TTA order numbering",
        ) from exc


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


@router.get(
    "/admin/resources/options",
    response_model=ApiResponse[ResourceUploadOptionsOut],
)
async def get_resource_upload_options(
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResourceUploadOptionsOut]:
    try:
        courses, topics_by_course, modules_by_course = list_upload_options()
        return ApiResponse(
            data=ResourceUploadOptionsOut(
                courses=courses,
                topics_by_course=topics_by_course,
                modules_by_course=modules_by_course,
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load resource options") from exc


@router.patch("/admin/resources/{resource_id}", response_model=ApiResponse[None])
async def update_resource(
    resource_id: str,
    body: ResourceMetadataUpdateIn,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[None]:
    try:
        update_resource_metadata(
            resource_id,
            title=body.title,
            topic=body.topic,
            description=body.description,
        )
        return ApiResponse(data=None)
    except ResourceUploadError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to update resource metadata")
        raise HTTPException(status_code=503, detail="Unable to update resource") from exc


@router.delete("/admin/resources/{resource_id}", response_model=ApiResponse[None])
async def remove_resource(
    resource_id: str,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[None]:
    try:
        delete_resource(resource_id)
        return ApiResponse(data=None)
    except ResourceUploadError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MuxClientError as exc:
        logger.exception("Unable to delete resource from Mux")
        raise HTTPException(status_code=503, detail="Unable to delete video from Mux") from exc
    except Exception as exc:
        logger.exception("Unable to delete resource")
        raise HTTPException(status_code=503, detail="Unable to delete resource") from exc


@router.post(
    "/admin/resources/documents",
    response_model=ApiResponse[DocumentUploadTargetOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_document_upload(
    body: CreateDocumentUploadIn,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[DocumentUploadTargetOut]:
    try:
        upload_id, upload_url = begin_pdf_upload(
            filename=body.filename,
            content_type=body.content_type,
            file_size=body.file_size,
            metadata=body,
        )
        return ApiResponse(
            data=DocumentUploadTargetOut(
                upload_url=upload_url,
                upload_id=upload_id,
            )
        )
    except ResourceUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to prepare PDF document upload")
        raise HTTPException(status_code=503, detail="Unable to prepare document upload") from exc


@router.post(
    "/admin/resources/documents/complete",
    response_model=ApiResponse[ResourceUploadOut],
    status_code=status.HTTP_201_CREATED,
)
async def finalize_document_upload(
    body: CompleteDocumentUploadIn,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResourceUploadOut]:
    try:
        resource_id = complete_pdf_upload(upload_id=body.upload_id, metadata=body)
        return ApiResponse(
            data=ResourceUploadOut(resource_id=resource_id, type="pdf", status="ready")
        )
    except ResourceUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unable to finalize PDF document upload")
        raise HTTPException(status_code=503, detail="Unable to finalize document upload") from exc


@router.post(
    "/admin/resources/videos",
    response_model=ApiResponse[ResourceUploadOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_video_upload(
    body: CreateVideoUploadIn,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResourceUploadOut]:
    if not body.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="A video file is required")
    try:
        resource_id, upload_id, upload_url = begin_video_upload(body)
        return ApiResponse(
            data=ResourceUploadOut(
                resource_id=resource_id,
                type="video",
                status="waiting",
                upload_id=upload_id,
                upload_url=upload_url,
            )
        )
    except ResourceUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MuxClientError as exc:
        logger.exception("Unable to create Mux direct upload")
        message = str(exc)
        if "must be set" in message:
            detail = (
                "Mux is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET "
                "in backend/.env, then restart the backend."
            )
        elif "Free plan is limited to 10 assets" in message:
            detail = (
                "Your Mux Free plan has reached its 10-asset limit. "
                "Delete unused Mux assets or upgrade the plan before uploading."
            )
        else:
            detail = "Mux upload is unavailable"
        raise HTTPException(status_code=503, detail=detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to create video upload") from exc


@router.post(
    "/admin/resources/links",
    response_model=ApiResponse[ResourceUploadOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_link_upload(
    body: CreateLinkUploadIn,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResourceUploadOut]:
    try:
        resource_id, upload_status = ingest_link(
            url=str(body.url),
            resource_type=body.resource_type,
            metadata=body,
        )
        return ApiResponse(
            data=ResourceUploadOut(
                resource_id=resource_id,
                type=body.resource_type,
                status=upload_status,
            )
        )
    except (ExternalFileError, ResourceUploadError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MuxClientError as exc:
        raise HTTPException(status_code=503, detail="Mux link import is unavailable") from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to import linked resource") from exc


@router.post(
    "/admin/resources/videos/{resource_id}/complete",
    response_model=ApiResponse[ResourceUploadOut],
)
async def finish_video_upload(
    resource_id: UUID,
    upload_id: str,
    _user: ClerkUser = Depends(require_admin),
) -> ApiResponse[ResourceUploadOut]:
    try:
        upload_status = complete_video_upload(resource_id, upload_id)
        return ApiResponse(
            data=ResourceUploadOut(
                resource_id=resource_id, type="video", status=upload_status
            )
        )
    except ResourceUploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MuxClientError as exc:
        raise HTTPException(status_code=503, detail="Mux processing is unavailable") from exc
