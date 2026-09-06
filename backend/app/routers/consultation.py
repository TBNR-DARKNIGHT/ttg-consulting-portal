from __future__ import annotations

from uuid import uuid4

import structlog
from fastapi import APIRouter, HTTPException, Request, status

from app.models.consultation import ConsultationEnquiryIn, ConsultationEnquiryOut
from app.models.schemas import ApiResponse
from app.services.resend import (
    ResendConfigurationError,
    ResendDeliveryError,
    send_consultation_enquiry,
)

router = APIRouter()
logger = structlog.get_logger()


@router.post(
    "/consultation/enquiries",
    response_model=ApiResponse[ConsultationEnquiryOut],
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_consultation_enquiry(
    body: ConsultationEnquiryIn,
    request: Request,
) -> ApiResponse[ConsultationEnquiryOut]:
    # Bots that fill the hidden website field receive a normal-looking response,
    # but no email is sent.
    if body.website:
        logger.info("Consultation enquiry honeypot triggered")
        return ApiResponse(data=ConsultationEnquiryOut())

    submission_id = uuid4()
    source_url = request.headers.get("referer") or request.headers.get("origin")

    try:
        await send_consultation_enquiry(
            body,
            source_url=source_url,
            idempotency_key=f"consultation-enquiry/{submission_id}",
        )
    except ResendConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery is not configured",
        ) from exc
    except ResendDeliveryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to deliver enquiry email",
        ) from exc

    return ApiResponse(data=ConsultationEnquiryOut())
