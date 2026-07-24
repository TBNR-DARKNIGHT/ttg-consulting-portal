from __future__ import annotations

import asyncio
import hashlib
import re
from uuid import UUID

import structlog
from postgrest.exceptions import APIError
from supabase import Client

from app.services.supabase import get_client

logger = structlog.get_logger()

FREE_COURSE_ID = "course-1"
KNOWN_COURSE_ORDER = ("course-1", "course-2")


class EntitlementError(RuntimeError):
    pass


class InvalidCodeError(EntitlementError):
    pass


class CodeAlreadyRedeemedError(EntitlementError):
    pass


class CodeExpiredError(EntitlementError):
    pass


class AlreadyEntitledError(EntitlementError):
    pass


class LocalUserNotFoundError(EntitlementError):
    pass


class EntitlementServiceError(EntitlementError):
    pass


def normalize_redemption_code(code: str) -> str:
    """Normalize human-friendly separators without changing code semantics."""

    return re.sub(r"[\s-]+", "", code).upper()


def hash_redemption_code(code: str) -> str:
    normalized = normalize_redemption_code(code)
    if len(normalized) < 8 or not normalized.isalnum():
        raise InvalidCodeError("Invalid redemption code")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _ordered_courses(course_ids: set[str]) -> list[str]:
    ordered = [course_id for course_id in KNOWN_COURSE_ORDER if course_id in course_ids]
    ordered.extend(sorted(course_ids.difference(ordered)))
    return ordered


async def list_entitlements(user_id: UUID, *, client: Client | None = None) -> list[str]:
    db = client or get_client()
    try:
        response = await asyncio.to_thread(
            lambda: (
                db.table("course_entitlements")
                .select("course_id")
                .eq("user_id", str(user_id))
                .is_("revoked_at", "null")
                .execute()
            )
        )
    except Exception as exc:
        logger.exception("Failed to list course entitlements", user_id=str(user_id))
        raise EntitlementServiceError("Unable to load course access") from exc

    course_ids = {
        str(row["course_id"])
        for row in (response.data or [])
        if isinstance(row, dict) and row.get("course_id")
    }
    course_ids.add(FREE_COURSE_ID)
    return _ordered_courses(course_ids)


async def has_course_access(
    user_id: UUID,
    course_id: str,
    *,
    client: Client | None = None,
) -> bool:
    if course_id == FREE_COURSE_ID:
        return True
    return course_id in await list_entitlements(user_id, client=client)


_RPC_ERRORS: dict[str, type[EntitlementError]] = {
    "INVALID_CODE": InvalidCodeError,
    "CODE_ALREADY_REDEEMED": CodeAlreadyRedeemedError,
    "CODE_EXPIRED": CodeExpiredError,
    "ALREADY_ENTITLED": AlreadyEntitledError,
    "USER_NOT_FOUND": LocalUserNotFoundError,
}


async def redeem_code(
    user_id: UUID,
    code: str,
    *,
    client: Client | None = None,
) -> str:
    code_hash = hash_redemption_code(code)
    db = client or get_client()

    try:
        response = await asyncio.to_thread(
            lambda: db.rpc(
                "redeem_course_code",
                {
                    "p_code_hash": code_hash,
                    "p_user_id": str(user_id),
                },
            ).execute()
        )
    except APIError as exc:
        error_type = _RPC_ERRORS.get(exc.message)
        if error_type is not None:
            raise error_type(exc.message) from exc
        logger.exception("Unexpected redemption RPC error", user_id=str(user_id), code=exc.code)
        raise EntitlementServiceError("Unable to redeem code") from exc
    except Exception as exc:
        logger.exception("Failed to redeem course code", user_id=str(user_id))
        raise EntitlementServiceError("Unable to redeem code") from exc

    course_id = response.data
    if not isinstance(course_id, str) or not course_id:
        logger.error("Redemption RPC returned malformed data", user_id=str(user_id))
        raise EntitlementServiceError("Unable to redeem code")
    return course_id
