from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import structlog
from fastapi import APIRouter, HTTPException, Request, status
from svix.webhooks import Webhook, WebhookVerificationError

from app.config import settings
from app.models.schemas import ClerkUser
from app.services.entitlements import EntitlementServiceError, list_entitlements
from app.services.google_sheets import (
    GoogleSheetsError,
    UserSheetRow,
    is_user_sheet_configured,
    mark_user_deleted,
    upsert_user_row,
)
from app.services.user_sync import UserSyncError, sync_authenticated_user

router = APIRouter()
logger = structlog.get_logger()


def _primary_email(data: dict[str, Any]) -> str | None:
    addresses = data.get("email_addresses")
    if not isinstance(addresses, list):
        return None
    primary_id = data.get("primary_email_address_id")
    primary = next(
        (
            address
            for address in addresses
            if isinstance(address, dict) and address.get("id") == primary_id
        ),
        None,
    )
    if primary is None:
        primary = next((address for address in addresses if isinstance(address, dict)), None)
    email = primary.get("email_address") if primary else None
    return email.strip().lower() if isinstance(email, str) and email.strip() else None


def _created_at(data: dict[str, Any]) -> datetime | None:
    value = data.get("created_at")
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    return None


@router.post("/webhooks/clerk", status_code=status.HTTP_204_NO_CONTENT)
async def clerk_user_webhook(request: Request) -> None:
    signing_secret = settings.clerk_webhook_signing_secret.strip()
    if not signing_secret:
        raise HTTPException(status_code=503, detail="Clerk webhook is not configured")
    if not is_user_sheet_configured():
        raise HTTPException(status_code=503, detail="Google Sheets user sync is not configured")

    payload = await request.body()
    try:
        event = Webhook(signing_secret).verify(payload, dict(request.headers))
    except WebhookVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid Clerk webhook signature") from exc

    event_type = event.get("type")
    if event_type not in {"user.created", "user.updated", "user.deleted"}:
        return

    data = event.get("data")
    if not isinstance(data, dict):
        raise HTTPException(status_code=422, detail="Malformed Clerk webhook payload")

    clerk_user_id = data.get("id")
    if not isinstance(clerk_user_id, str) or not clerk_user_id:
        raise HTTPException(status_code=422, detail="Clerk user ID is missing")

    if event_type == "user.deleted":
        try:
            await mark_user_deleted(clerk_user_id)
        except GoogleSheetsError as exc:
            logger.exception(
                "Clerk user deletion webhook processing failed",
                clerk_user_id=clerk_user_id,
            )
            raise HTTPException(
                status_code=503,
                detail="Unable to synchronize deleted Clerk user",
            ) from exc
        return

    email = _primary_email(data)
    if email is None:
        raise HTTPException(status_code=422, detail="Clerk primary email is missing")

    try:
        user = await sync_authenticated_user(
            ClerkUser(
                clerk_id=clerk_user_id,
                email=email,
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
            )
        )
        courses = (
            await list_entitlements(user.internal_user_id)
            if user.internal_user_id is not None
            else []
        )
        await upsert_user_row(
            UserSheetRow(
                clerk_user_id=clerk_user_id,
                email=email,
                first_name=user.first_name,
                last_name=user.last_name,
                signup_date=_created_at(data),
                has_course_2_access="course-2" in courses,
            )
        )
    except (UserSyncError, EntitlementServiceError, GoogleSheetsError) as exc:
        logger.exception("Clerk user webhook processing failed", clerk_user_id=clerk_user_id)
        raise HTTPException(status_code=503, detail="Unable to synchronize Clerk user") from exc
