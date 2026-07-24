from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import jwt
import structlog

from app.config import settings

logger = structlog.get_logger()


class EdxpAuthzError(Exception):
    pass


def _service_token(service_name: str, secret: str) -> str:
    now = datetime.now(tz=UTC)
    payload = {
        "sub": service_name,
        "iss": "edxp-users",
        "aud": "edxp-users",
        "iat": now,
        "exp": now + timedelta(minutes=5),
        "type": "service",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


async def authorize(
    *,
    subject: str,
    provider: str,
    action: str,
    org_id: str,
) -> dict[str, Any]:
    """
    Call EdXP-Users `POST /api/v1/authorize`.

    Returns the full JSON response (e.g. allowed, roles, reason, cache_ttl_seconds).
    Raises EdxpAuthzError for configuration issues or HTTP/auth failures.
    """
    if not settings.edxp_authz_url or not settings.edxp_org_id:
        raise EdxpAuthzError("EdXP authorization is not configured (EDXP_AUTHZ_URL/EDXP_ORG_ID)")
    if not settings.edxp_internal_jwt_secret:
        raise EdxpAuthzError("EdXP authorization secret missing (EDXP_INTERNAL_JWT_SECRET)")

    token = _service_token(settings.edxp_service_name, settings.edxp_internal_jwt_secret)
    url = f"{settings.edxp_authz_url.rstrip('/')}/authorize"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "subject": subject,
                    "provider": provider,
                    "action": action,
                    "org_id": org_id,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        logger.warning(
            "EdXP authorize request failed",
            status_code=e.response.status_code,
            url=url,
        )
        raise EdxpAuthzError("EdXP authorization request failed") from e
    except httpx.HTTPError as e:
        logger.exception("EdXP authorize request error", url=url)
        raise EdxpAuthzError("EdXP authorization request error") from e

    if not isinstance(data, dict):
        raise EdxpAuthzError("EdXP authorization response malformed")
    return data
