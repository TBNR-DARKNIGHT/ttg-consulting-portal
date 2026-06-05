from __future__ import annotations

import structlog
from pydantic_settings import BaseSettings, SettingsConfigDict

log = structlog.get_logger(__name__)


class Settings(BaseSettings):
    # Prefer `.env.local` for dev while keeping `.env` as a fallback.
    # This matches the frontend convention and prevents "credentials not configured"
    # when developers only populate `.env.local`.
    model_config = SettingsConfigDict(env_file=(".env.local", ".env"), env_file_encoding="utf-8")

    # Supabase — validated at usage time so the server starts without credentials
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Clerk — validated at usage time so the server starts without credentials
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""

    # EdXP-Users (authorization)
    edxp_authz_url: str = ""
    edxp_org_id: str = ""
    edxp_internal_jwt_secret: str = ""
    edxp_service_name: str = "ttg-portal"

    # App
    frontend_url: str = "http://localhost:5173"
    frontend_url_regex: str = ""
    log_level: str = "INFO"
    environment: str = "development"
    app_version: str = "0.1.0"

    # Development-only auth bypass (for local testing without Clerk)
    allow_dev_bearer_auth: bool = False
    dev_bearer_token: str = ""

    # Mux Video — signing key mints short-lived JWTs for **signed** playback IDs only.
    # Create keys in the Mux dashboard (Settings → Signing Keys). Private key may be PEM
    # or base64-encoded PEM as returned by the API.
    mux_signing_key_id: str = ""
    mux_signing_private_key: str = ""
    # Public playback ID for **Course 1** (free) catalog videos — topics dsa-pathways &
    # timelines-deadlines. If unset, a Mux sample asset is used for local dev only.
    mux_public_playback_id: str = ""
    # Signed playback ID for **Course 2** paid catalog video (res-009) when set.
    mux_seed_signed_playback_id: str = ""

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()
log.info("settings loaded", environment=settings.environment, version=settings.app_version)
