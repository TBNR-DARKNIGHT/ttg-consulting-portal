from __future__ import annotations

import time
from dataclasses import dataclass, field

import httpx
import jwt
import structlog
from fastapi import Depends, HTTPException, Request
from jwt.algorithms import RSAAlgorithm
from pydantic import ValidationError
from supabase import Client

from app.config import settings
from app.models.enums import UserRole
from app.models.schemas import ClerkUser
from app.services.edxp_authz import EdxpAuthzError
from app.services.edxp_authz import authorize as edxp_authorize
from app.services.supabase import get_client as get_supabase_client
from app.services.user_sync import UserSyncError, cached_sync_authenticated_user

logger = structlog.get_logger()


@dataclass
class JWKSCache:
    keys: list[dict[str, object]] = field(default_factory=list)
    fetched_at: float = 0.0
    ttl: float = 3600.0

    @property
    def is_expired(self) -> bool:
        return not self.keys or (time.time() - self.fetched_at) > self.ttl


_jwks_cache = JWKSCache()


async def _fetch_jwks() -> list[dict[str, object]]:
    if not _jwks_cache.is_expired:
        return _jwks_cache.keys

    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        response = await client.get(settings.clerk_jwks_url)
        response.raise_for_status()
        data = response.json()

    if not isinstance(data, dict) or "keys" not in data or not isinstance(data["keys"], list):
        raise ValueError("JWKS response missing or malformed 'keys' field")

    _jwks_cache.keys = data["keys"]
    _jwks_cache.fetched_at = time.time()
    return _jwks_cache.keys


def _find_matching_key(keys: list[dict[str, object]], token: str) -> object:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for key in keys:
        if key.get("kid") == kid:
            return RSAAlgorithm.from_jwk(key)

    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(request: Request) -> ClerkUser:
    # Dev-only bypass: allow a fixed bearer token to stand in for Clerk JWTs locally.
    # This is intentionally gated by both ENVIRONMENT and an explicit flag.
    auth_header = request.headers.get("Authorization")
    if (
        settings.is_development
        and settings.allow_dev_bearer_auth
        and settings.dev_bearer_token
        and auth_header == f"Bearer {settings.dev_bearer_token}"
    ):
        return ClerkUser(
            clerk_id="dev-user",
            email="dev-user@example.local",
            first_name="Dev",
            last_name="User",
        )

    if not settings.clerk_jwks_url or not settings.clerk_issuer:
        logger.error("Clerk authentication is not configured")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable",
        )

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = auth_header.removeprefix("Bearer ")

    try:
        keys = await _fetch_jwks()
        public_key = _find_matching_key(keys, token)

        decode_options: dict[str, object] = {
            "algorithms": ["RS256"],
            "issuer": settings.clerk_issuer,
        }
        # SEC-002: When CLERK_AUDIENCE is unset, audience verification is skipped.
        # This is acceptable in development but CLERK_AUDIENCE should be configured
        # in staging/production to prevent cross-client token acceptance.
        if settings.clerk_audience:
            decode_options["audience"] = settings.clerk_audience
        else:
            decode_options["options"] = {"verify_aud": False}

        payload = jwt.decode(token, public_key, **decode_options)  # type: ignore[arg-type]

        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Token missing required 'sub' claim")

        clerk_user = ClerkUser(
            clerk_id=sub,
            email=payload.get("email"),
            first_name=payload.get("first_name"),
            last_name=payload.get("last_name"),
        )
        return await cached_sync_authenticated_user(clerk_user)
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except httpx.HTTPError:
        logger.exception("Failed to fetch JWKS")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except UserSyncError:
        logger.exception("Authenticated Clerk user could not be synchronized")
        raise HTTPException(status_code=503, detail="User profile unavailable")
    except ValidationError:
        logger.exception("JWT claims failed schema validation")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except ValueError:
        logger.exception("JWKS response validation failed")
        raise HTTPException(status_code=401, detail="Authentication service error")
    except Exception:
        logger.exception("Unexpected error during authentication")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_optional_current_user(request: Request) -> ClerkUser | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    return await get_current_user(request)


def get_supabase(
    _user: ClerkUser = Depends(get_current_user),  # noqa: ARG001
) -> Client:
    return get_supabase_client()


def get_supabase_public() -> Client:
    """
    Supabase client without auth requirements.

    Use only for endpoints that are truly public (e.g. health checks, public resources,
    or dev-only diagnostics). Paid/protected endpoints should depend on `get_supabase`.
    """
    return get_supabase_client()


async def require_admin(user: ClerkUser = Depends(get_current_user)) -> ClerkUser:
    if user.role is not UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user


def require_edxp_permission(action: str):
    async def _dependency(user: ClerkUser = Depends(get_current_user)) -> None:
        missing = [
            key
            for key, val in (
                ("EDXP_AUTHZ_URL", settings.edxp_authz_url),
                ("EDXP_ORG_ID", settings.edxp_org_id),
                ("EDXP_INTERNAL_JWT_SECRET", settings.edxp_internal_jwt_secret),
            )
            if not val
        ]
        if missing:
            logger.warning("EdXP authorization not fully configured", missing_keys=missing)
            raise HTTPException(status_code=503, detail="Authorization service unavailable")

        try:
            decision = await edxp_authorize(
                subject=user.clerk_id,
                provider="clerk",
                action=action,
                org_id=settings.edxp_org_id,
            )
        except EdxpAuthzError:
            logger.exception("EdXP authorization failed")
            raise HTTPException(status_code=503, detail="Authorization service unavailable")

        allowed = decision.get("allowed")
        if allowed is not True:
            raise HTTPException(status_code=403, detail="Forbidden")

    return _dependency
