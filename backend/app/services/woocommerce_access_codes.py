from __future__ import annotations

import asyncio
import hashlib
import hmac
from typing import Any
from uuid import UUID

import structlog
from supabase import Client

from app.scripts.create_access_code import (
    CODE_ALPHABET,
    CODE_GROUP_COUNT,
    CODE_GROUP_LENGTH,
    SUPPORTED_COURSES,
)
from app.services.entitlements import hash_redemption_code
from app.services.supabase import get_client

logger = structlog.get_logger()


class WooCommerceAccessCodeError(RuntimeError):
    pass


class UnsupportedCourseError(WooCommerceAccessCodeError):
    pass


class OrderCodeConflictError(WooCommerceAccessCodeError):
    pass


def generate_order_code(*, secret: str, order_id: str, course_id: str) -> str:
    """Derive a stable, high-entropy code so Zapier retries are idempotent."""

    message = f"woocommerce-access-code:v1:{course_id}:{order_id}".encode()
    digest = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    character_count = CODE_GROUP_COUNT * CODE_GROUP_LENGTH
    characters = "".join(
        CODE_ALPHABET[byte % len(CODE_ALPHABET)] for byte in digest[:character_count]
    )
    groups = [
        characters[index : index + CODE_GROUP_LENGTH]
        for index in range(0, character_count, CODE_GROUP_LENGTH)
    ]
    return "TTA-" + "-".join(groups)


def _matching_existing_code(rows: list[dict[str, Any]], *, expected_hash: str) -> UUID | None:
    if not rows:
        return None
    row = rows[0]
    if not hmac.compare_digest(str(row.get("code_hash", "")), expected_hash):
        raise OrderCodeConflictError(
            "This order already has an access code generated with different credentials"
        )
    return UUID(str(row["id"]))


async def _find_order_code(db: Client, order_id: str) -> list[dict[str, Any]]:
    response = await asyncio.to_thread(
        lambda: (
            db.table("access_codes")
            .select("id,code_hash")
            .eq("order_id", order_id)
            .is_("revoked_at", "null")
            .limit(1)
            .execute()
        )
    )
    return [row for row in (response.data or []) if isinstance(row, dict)]


async def issue_woocommerce_access_code(
    *,
    secret: str,
    order_id: str,
    course_id: str,
    client: Client | None = None,
) -> tuple[UUID, str]:
    if course_id not in SUPPORTED_COURSES:
        raise UnsupportedCourseError("Unsupported course")

    normalized_order_id = order_id.strip()
    plaintext = generate_order_code(
        secret=secret,
        order_id=normalized_order_id,
        course_id=course_id,
    )
    code_hash = hash_redemption_code(plaintext)
    db = client or get_client()

    try:
        existing_id = _matching_existing_code(
            await _find_order_code(db, normalized_order_id),
            expected_hash=code_hash,
        )
        if existing_id is not None:
            return existing_id, plaintext

        response = await asyncio.to_thread(
            lambda: (
                db.table("access_codes")
                .insert(
                    {
                        "code_hash": code_hash,
                        "course_id": course_id,
                        "order_id": normalized_order_id,
                    }
                )
                .execute()
            )
        )
        row = (response.data or [None])[0]
        if not isinstance(row, dict) or not row.get("id"):
            raise WooCommerceAccessCodeError("Access-code insert returned no identifier")
        return UUID(str(row["id"])), plaintext
    except OrderCodeConflictError:
        raise
    except Exception as exc:
        # A concurrent Zapier retry may have won the insert race. Re-read the
        # active order row and return the same deterministic plaintext code.
        try:
            existing_id = _matching_existing_code(
                await _find_order_code(db, normalized_order_id),
                expected_hash=code_hash,
            )
            if existing_id is not None:
                return existing_id, plaintext
        except OrderCodeConflictError:
            raise
        except Exception:
            pass

        logger.exception(
            "Failed to issue WooCommerce access code",
            order_id=normalized_order_id,
            course_id=course_id,
        )
        raise WooCommerceAccessCodeError("Unable to issue access code") from exc
