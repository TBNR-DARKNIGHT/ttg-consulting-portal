from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.middleware.logging import LoggingMiddleware, configure_logging
from app.routers import dev_authz, dev_storage, health, resources, storage
from app.services.supabase import get_client


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging(settings.log_level)
    logger = structlog.get_logger()

    if settings.is_development:
        logger.info(
            "Backend code location",
            main_py=str(Path(__file__).resolve()),
            route_count=len(app.routes),
            has_dev_storage=any(
                getattr(r, "path", "").startswith("/api/v1/dev/storage") for r in app.routes
            ),
        )

    if settings.supabase_url and settings.supabase_service_key:
        get_client()
        logger.info("Supabase client initialised")
    else:
        logger.warning("Supabase credentials not configured — skipping client init")

    if not settings.is_development:
        missing: list[str] = []
        if not settings.supabase_url.strip():
            missing.append("SUPABASE_URL")
        if not settings.supabase_service_key.strip():
            missing.append("SUPABASE_SERVICE_KEY")
        if not settings.clerk_jwks_url.strip():
            missing.append("CLERK_JWKS_URL")
        if not settings.clerk_issuer.strip():
            missing.append("CLERK_ISSUER")
        if missing:
            logger.warning(
                "Production storage/auth may be incomplete (paid downloads need Supabase + Clerk)",
                missing_keys=missing,
            )

    logger.info("Application started", version=settings.app_version, env=settings.environment)
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title="TTG Consulting Portal API",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url.rstrip("/")],
    allow_origin_regex=settings.frontend_url_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(resources.router, prefix="/api/v1", tags=["resources"])
app.include_router(storage.router, prefix="/api/v1", tags=["storage"])
if settings.is_development:
    app.include_router(dev_storage.router, prefix="/api/v1", tags=["dev"])
    app.include_router(dev_authz.router, prefix="/api/v1", tags=["dev"])


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/api/v1/health")
