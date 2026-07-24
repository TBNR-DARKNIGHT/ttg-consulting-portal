from __future__ import annotations

import asyncio
from dataclasses import dataclass
from threading import RLock
from time import monotonic
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx
import structlog
from supabase import Client

from app.config import settings
from app.models.enums import UserRole
from app.models.schemas import ClerkUser
from app.services.supabase import get_client

logger = structlog.get_logger()

DEFAULT_PORTAL_ROLE = UserRole.CLIENT.value
DEFAULT_PORTAL_STATUS = "ACTIVE"
AUTHENTICATED_USER_CACHE_TTL_SECONDS = 60.0


class UserSyncError(RuntimeError):
    """The authenticated Clerk identity could not be synchronized locally."""


@dataclass(frozen=True)
class ClerkProfile:
    email: str
    first_name: str | None
    last_name: str | None


@dataclass(frozen=True)
class _CachedUser:
    user: ClerkUser
    expires_at: float


_authenticated_user_cache: dict[tuple[str, str | None, str | None, str | None], _CachedUser] = {}
_authenticated_user_cache_lock = RLock()


def _first_row(response: Any) -> dict[str, Any] | None:
    rows = response.data or []
    return rows[0] if rows else None


def _get_local_user(client: Client, clerk_user_id: str) -> dict[str, Any] | None:
    response = (
        client.table("users")
        .select("id,clerk_user_id,email,first_name,last_name,role,status")
        .eq("clerk_user_id", clerk_user_id)
        .limit(1)
        .execute()
    )
    return _first_row(response)


def _primary_email(payload: dict[str, Any]) -> str | None:
    primary_id = payload.get("primary_email_address_id")
    addresses = payload.get("email_addresses")
    if not isinstance(addresses, list):
        return None

    primary = next(
        (
            item
            for item in addresses
            if isinstance(item, dict) and item.get("id") == primary_id
        ),
        None,
    )
    if primary is None:
        primary = next((item for item in addresses if isinstance(item, dict)), None)

    email = primary.get("email_address") if primary else None
    return email.strip().lower() if isinstance(email, str) and email.strip() else None


async def fetch_clerk_profile(clerk_user_id: str) -> ClerkProfile:
    if not settings.clerk_secret_key:
        raise UserSyncError(
            "CLERK_SECRET_KEY is required when the Clerk session token has no email claim"
        )

    url = f"{settings.clerk_api_url.rstrip('/')}/users/{quote(clerk_user_id, safe='')}"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.exception("Failed to fetch Clerk user profile", clerk_user_id=clerk_user_id)
        raise UserSyncError("Unable to load the authenticated Clerk profile") from exc

    payload = response.json()
    if not isinstance(payload, dict):
        raise UserSyncError("Clerk returned a malformed user profile")

    email = _primary_email(payload)
    if not email:
        raise UserSyncError("The authenticated Clerk user has no primary email address")

    return ClerkProfile(
        email=email,
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
    )


def _sync_existing_user(
    client: Client,
    row: dict[str, Any],
    user: ClerkUser,
) -> ClerkUser:
    updates: dict[str, Any] = {}
    candidate_values = {
        "email": user.email.strip().lower() if user.email else None,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }
    for field, value in candidate_values.items():
        if value is not None and row.get(field) != value:
            updates[field] = value

    if updates:
        response = client.table("users").update(updates).eq("id", row["id"]).execute()
        updated = _first_row(response)
        if updated:
            row = {**row, **updated}

    return user.model_copy(
        update={
            "internal_user_id": UUID(str(row["id"])),
            "email": row.get("email") or user.email,
            "first_name": row.get("first_name"),
            "last_name": row.get("last_name"),
            "role": UserRole(str(row["role"])),
        }
    )


async def sync_authenticated_user(user: ClerkUser, *, client: Client | None = None) -> ClerkUser:
    """Resolve or create the local `public.users` row for a verified Clerk identity."""

    db = client or get_client()
    try:
        existing = await asyncio.to_thread(_get_local_user, db, user.clerk_id)
        if existing:
            return await asyncio.to_thread(_sync_existing_user, db, existing, user)

        profile = None
        if not user.email:
            profile = await fetch_clerk_profile(user.clerk_id)

        email = (
            user.email.strip().lower()
            if user.email
            else profile.email if profile is not None else None
        )
        if not email:
            raise UserSyncError("The authenticated Clerk user has no email address")

        profile_first_name = profile.first_name if profile is not None else None
        profile_last_name = profile.last_name if profile is not None else None
        payload = {
            "clerk_user_id": user.clerk_id,
            "email": email,
            "first_name": (
                user.first_name if user.first_name is not None else profile_first_name
            ),
            "last_name": user.last_name if user.last_name is not None else profile_last_name,
            "role": DEFAULT_PORTAL_ROLE,
            "status": DEFAULT_PORTAL_STATUS,
        }

        # Ignore a duplicate created by another simultaneous first request, then
        # resolve the authoritative row. This never overwrites role or status.
        await asyncio.to_thread(
            lambda: db.table("users")
            .upsert(payload, on_conflict="clerk_user_id", ignore_duplicates=True)
            .execute()
        )
        created = await asyncio.to_thread(_get_local_user, db, user.clerk_id)
        if not created:
            raise UserSyncError("The local user row could not be created")

        return user.model_copy(
            update={
                "internal_user_id": UUID(str(created["id"])),
                "email": created.get("email") or email,
                "first_name": created.get("first_name"),
                "last_name": created.get("last_name"),
                "role": UserRole(str(created["role"])),
            }
        )
    except UserSyncError:
        raise
    except Exception as exc:
        logger.exception("Failed to synchronize Clerk user", clerk_user_id=user.clerk_id)
        raise UserSyncError("Unable to synchronize the authenticated user") from exc


def _cache_key(user: ClerkUser) -> tuple[str, str | None, str | None, str | None]:
    return (user.clerk_id, user.email, user.first_name, user.last_name)


async def cached_sync_authenticated_user(user: ClerkUser) -> ClerkUser:
    key = _cache_key(user)
    now = monotonic()
    with _authenticated_user_cache_lock:
        cached = _authenticated_user_cache.get(key)
        if cached is not None and now < cached.expires_at:
            return cached.user

    resolved = await sync_authenticated_user(user)
    with _authenticated_user_cache_lock:
        _authenticated_user_cache[key] = _CachedUser(
            user=resolved,
            expires_at=now + AUTHENTICATED_USER_CACHE_TTL_SECONDS,
        )
    return resolved


def clear_authenticated_user_cache() -> None:
    with _authenticated_user_cache_lock:
        _authenticated_user_cache.clear()
