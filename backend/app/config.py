from __future__ import annotations

from pathlib import Path

import structlog
from pydantic_settings import BaseSettings, SettingsConfigDict

log = structlog.get_logger(__name__)
BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # Prefer `.env.local` for dev while keeping `.env` as a fallback.
    # This matches the frontend convention and prevents "credentials not configured"
    # when developers only populate `.env.local`.
    model_config = SettingsConfigDict(
        env_file=(BACKEND_DIR / ".env.local", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase — validated at usage time so the server starts without credentials
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Clerk — validated at usage time so the server starts without credentials
    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""
    clerk_secret_key: str = ""
    clerk_api_url: str = "https://api.clerk.com/v1"

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

    # Mux Video — API token for asset sync; signing key mints JWTs for signed playback IDs.
    # Create API access tokens and signing keys in the Mux dashboard.
    mux_token_id: str = ""
    mux_token_secret: str = ""
    mux_signing_key_id: str = ""
    mux_signing_private_key: str = ""

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()
log.info("settings loaded", environment=settings.environment, version=settings.app_version)
