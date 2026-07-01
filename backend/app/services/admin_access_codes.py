from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any
from uuid import UUID

import structlog
from postgrest.exceptions import APIError
from supabase import Client

from app.scripts.create_access_code import SUPPORTED_COURSES, generate_code
from app.services.entitlements import hash_redemption_code
from app.services.supabase import get_client

logger = structlog.get_logger()


class AdminAccessCodeError(RuntimeError):
    pass


class CodeNotRevocableError(AdminAccessCodeError):
    pass


class CodeNotReissuableError(AdminAccessCodeError):
    pass


def _rpc_error(exc: APIError) -> AdminAccessCodeError:
    if exc.message == "CODE_NOT_REVOCABLE":
        return CodeNotRevocableError(exc.message)
    if exc.message == "CODE_NOT_REISSUABLE":
        return CodeNotReissuableError(exc.message)
    return AdminAccessCodeError(exc.message)


async def list_access_codes(*, client: Client | None = None) -> list[dict[str, Any]]:
    db = client or get_client()
    try:
        response = await asyncio.to_thread(
            lambda: db.table("access_codes")
            .select(
                "id,course_id,order_id,redeemed_by_user_id,redeemed_at,expires_at,"
                "created_at,created_by_user_id,revoked_at,revoked_by_user_id,"
                "revocation_reason,replacement_for_code_id"
            )
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        return list(response.data or [])
    except Exception as exc:
        logger.exception("Failed to list access codes")
        raise AdminAccessCodeError("Unable to list access codes") from exc


async def create_access_code(
    *,
    actor_user_id: UUID,
    course_id: str,
    order_id: str | None,
    expires_at: datetime | None,
    client: Client | None = None,
) -> tuple[UUID, str]:
    if course_id not in SUPPORTED_COURSES:
        raise AdminAccessCodeError("Unsupported course")
    plaintext = generate_code()
    db = client or get_client()
    try:
        response = await asyncio.to_thread(
            lambda: db.rpc(
                "admin_create_access_code",
                {
                    "p_code_hash": hash_redemption_code(plaintext),
                    "p_course_id": course_id,
                    "p_order_id": order_id,
                    "p_expires_at": expires_at.isoformat() if expires_at else None,
                    "p_actor_user_id": str(actor_user_id),
                },
            ).execute()
        )
        return UUID(str(response.data)), plaintext
    except Exception as exc:
        logger.exception("Failed to create access code", actor_user_id=str(actor_user_id))
        raise AdminAccessCodeError("Unable to create access code") from exc


async def revoke_access_code(
    code_id: UUID,
    *,
    actor_user_id: UUID,
    reason: str,
    client: Client | None = None,
) -> None:
    db = client or get_client()
    try:
        await asyncio.to_thread(
            lambda: db.rpc(
                "admin_revoke_access_code",
                {
                    "p_code_id": str(code_id),
                    "p_reason": reason,
                    "p_actor_user_id": str(actor_user_id),
                },
            ).execute()
        )
    except APIError as exc:
        raise _rpc_error(exc) from exc
    except Exception as exc:
        logger.exception("Failed to revoke access code", code_id=str(code_id))
        raise AdminAccessCodeError("Unable to revoke access code") from exc


async def reissue_access_code(
    code_id: UUID,
    *,
    actor_user_id: UUID,
    reason: str,
    client: Client | None = None,
) -> tuple[UUID, str]:
    plaintext = generate_code()
    db = client or get_client()
    try:
        response = await asyncio.to_thread(
            lambda: db.rpc(
                "admin_reissue_access_code",
                {
                    "p_code_id": str(code_id),
                    "p_new_code_hash": hash_redemption_code(plaintext),
                    "p_reason": reason,
                    "p_actor_user_id": str(actor_user_id),
                },
            ).execute()
        )
        return UUID(str(response.data)), plaintext
    except APIError as exc:
        raise _rpc_error(exc) from exc
    except Exception as exc:
        logger.exception("Failed to reissue access code", code_id=str(code_id))
        raise AdminAccessCodeError("Unable to reissue access code") from exc

