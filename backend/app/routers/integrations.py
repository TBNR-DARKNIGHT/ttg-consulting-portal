from __future__ import annotations

import hmac

from fastapi import APIRouter, Header, HTTPException, status

from app.config import settings
from app.models.integrations import (
    WooCommerceAccessCodeIn,
    WooCommerceAccessCodeOut,
)
from app.models.schemas import ApiResponse
from app.services.woocommerce_access_codes import (
    OrderCodeConflictError,
    UnsupportedCourseError,
    WooCommerceAccessCodeError,
    issue_woocommerce_access_code,
)

router = APIRouter()


def _verify_zapier_secret(provided_secret: str | None) -> str:
    configured_secret = settings.zapier_webhook_secret.strip()
    if not configured_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Zapier integration is not configured",
        )
    if provided_secret is None or not hmac.compare_digest(provided_secret, configured_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook credentials",
        )
    return configured_secret


@router.post(
    "/integrations/woocommerce/access-code",
    response_model=ApiResponse[WooCommerceAccessCodeOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_woocommerce_access_code(
    body: WooCommerceAccessCodeIn,
    x_webhook_secret: str | None = Header(default=None),
) -> ApiResponse[WooCommerceAccessCodeOut]:
    secret = _verify_zapier_secret(x_webhook_secret)
    try:
        code_id, plaintext = await issue_woocommerce_access_code(
            secret=secret,
            order_id=body.order_id,
            course_id=body.course_id,
        )
    except UnsupportedCourseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except OrderCodeConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except WooCommerceAccessCodeError as exc:
        raise HTTPException(status_code=503, detail="Unable to issue access code") from exc

    return ApiResponse(
        data=WooCommerceAccessCodeOut(
            id=code_id,
            code=plaintext,
            order_id=body.order_id.strip(),
        )
    )
