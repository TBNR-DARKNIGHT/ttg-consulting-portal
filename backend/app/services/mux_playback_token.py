from __future__ import annotations

import base64
import binascii
import time
from typing import Any

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization


def _load_rsa_private_key(raw: str) -> Any:
    """Mux returns a base64-encoded PKCS#1 PEM; developers may also paste a raw PEM."""
    text = raw.strip()
    if "BEGIN" in text and "PRIVATE KEY" in text:
        return serialization.load_pem_private_key(
            text.encode(),
            password=None,
            backend=default_backend(),
        )
    try:
        decoded = base64.b64decode(text)
    except binascii.Error as exc:
        raise ValueError("MUX_SIGNING_PRIVATE_KEY is not valid PEM or base64 PEM") from exc
    return serialization.load_pem_private_key(decoded, password=None, backend=default_backend())


def mint_mux_video_playback_token(
    *,
    playback_id: str,
    signing_key_id: str,
    private_key_material: str,
    expires_in_seconds: int,
) -> tuple[str, int]:
    """
    RS256 JWT for Mux Video signed playback (`aud` = v).

    See: https://www.mux.com/docs/guides/secure-video-playback
    """
    now = int(time.time())
    exp = now + max(60, min(expires_in_seconds, 86400))
    key = _load_rsa_private_key(private_key_material)
    payload: dict[str, Any] = {"sub": playback_id, "aud": "v", "exp": exp}
    headers = {"kid": signing_key_id, "typ": "JWT"}
    token = jwt.encode(payload, key, algorithm="RS256", headers=headers)
    if isinstance(token, bytes):
        token_s = token.decode("utf-8")
    else:
        token_s = str(token)
    return token_s, exp


def mint_mux_thumbnail_token(
    *,
    playback_id: str,
    signing_key_id: str,
    private_key_material: str,
    expires_in_seconds: int,
) -> tuple[str, int]:
    """RS256 JWT for a Mux signed thumbnail (`aud` = `t`)."""
    now = int(time.time())
    exp = now + max(60, min(expires_in_seconds, 86400))
    key = _load_rsa_private_key(private_key_material)
    payload: dict[str, Any] = {"sub": playback_id, "aud": "t", "exp": exp}
    headers = {"kid": signing_key_id, "typ": "JWT"}
    token = jwt.encode(payload, key, algorithm="RS256", headers=headers)
    token_s = token.decode("utf-8") if isinstance(token, bytes) else str(token)
    return token_s, exp
