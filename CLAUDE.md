# CLAUDE.md

## Project Overview

Think Teach Group Consulting Portal — a unified platform for consulting services across TTA, MapleBear, and Macro Academy. Parents access programme content, track student progress, and purchase digital consulting resources.

**Key characteristics:**
- Decoupled SPA frontend (React) + REST API backend (FastAPI)
- Clerk authentication with admin-provisioned accounts (TTA) and self-registration (MapleBear)
- Video library for student recordings with consultant feedback
- Paid DSA resource marketplace with manual provisioning via TTA Shop

## Technology Stack

**Frontend:**
- **Language**: TypeScript 5.9
- **Framework**: React 19.1 with Vite 7.3 (SWC)
- **Routing**: TanStack Router 1.157+ (file-based)
- **Server State**: TanStack Query 5.90+ (stale-while-revalidate)
- **UI**: shadcn/ui (new-york) + Tailwind CSS 4.2
- **Auth**: Clerk React SDK

**Backend:**
- **Language**: Python >=3.10
- **Framework**: FastAPI >=0.114.2
- **Database**: Supabase (PostgreSQL, accessed via supabase-py)
- **Storage**: Supabase Storage (video files, documents)
- **Auth**: Clerk JWT verification via JWKS (PyJWT + httpx)
- **Logging**: structlog (JSON output)
- **Validation**: Pydantic v2 + pydantic-settings
- **Linting**: Ruff + Pyright

**Infrastructure:**
- **CI/CD**: GitHub Actions (lint, Pyright/tsc, tests, Docker build)
- **Registry**: GitHub Container Registry (GHCR)
- **Containerization**: Docker

## Architecture Overview

**Pattern**: Decoupled SPA + REST API

```
frontend/              # React SPA (Vite)
  src/
    routes/            # TanStack Router file-based routes
    components/        # shadcn/ui + custom components
    lib/               # Utilities, API client, query keys
    hooks/             # Custom React hooks
    stores/            # Client-side state (if needed)
    types/             # TypeScript type definitions
backend/               # FastAPI application
  app/
    routers/           # Route handlers (health, future endpoints)
    middleware/         # structlog request logging
    models/            # Pydantic schemas + shared enums
    services/          # Business logic + Supabase client
    config.py          # Pydantic Settings (env vars)
    dependencies.py    # Clerk JWT auth + Supabase DI
    main.py            # App factory, lifespan, CORS, router mounting
  tests/               # pytest + httpx async tests
```

**Key Patterns:**
- Frontend routes map to file-based TanStack Router convention
- All API calls go through TanStack Query hooks in `hooks/`
- Clerk JWT validated as FastAPI dependency injection
- Supabase RLS policies enforce data access boundaries

## Development Commands

**Full stack (repo root):**
```bash
npm install                          # Root dev tooling: concurrently + run-script-os
npm run dev                          # Vite (frontend) + Uvicorn (backend) together
```

Requires `frontend` dependencies installed and `backend/.venv` with `pip install -e ".[dev]"` (see [docs/getting-started/setup.md](docs/getting-started/setup.md)).

**Frontend:**
```bash
cd frontend && npm install         # Install dependencies
npm run dev                        # Dev server (localhost:5173)
npm run build                      # Production build
npm run lint                       # ESLint
npm run type-check                 # TypeScript compiler check
```

**Backend:**
```bash
cd backend
python -m venv .venv                   # Create virtual environment
.venv/bin/activate                     # Activate (Linux/Mac)
# .venv\Scripts\Activate.ps1           # Activate (Windows)
pip install -e ".[dev]"                # Install deps (editable + dev tools)
uvicorn app.main:app --reload          # Dev server (localhost:8000)
pytest -v                              # Run all tests
ruff check .                           # Lint
pyright                                # Type check
```

**Docker:**
```bash
docker compose up                  # Run full stack
docker compose build               # Build images
```

## Code Conventions

**Frontend (TypeScript/React):**
- ES modules, absolute imports with `@/` alias
- Components: PascalCase files, named exports, Props interfaces
- Hooks: `use` prefix (e.g., `useVideos.ts`)
- Routes: file-based per TanStack Router convention

**Backend (Python/FastAPI):**
- snake_case for files, functions, variables
- Pydantic schemas for all request/response validation
- All responses use `ApiResponse[T]` envelope (`data` + `error` fields)
- Dependency injection for auth (`get_current_user`), Supabase (`get_supabase`)
- Type hints on all function signatures
- `from __future__ import annotations` in every module

**Import Order (Frontend):**
```typescript
import { useState } from 'react'           // 1. React/external
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'  // 2. Internal absolute
import { formatDate } from './utils'        // 3. Relative
import type { Video } from '@/types'        // 4. Types
```

## Testing Strategy

**Frontend**: Vitest + React Testing Library
**Backend**: pytest + pytest-asyncio + httpx (AsyncClient via ASGITransport)

- 70% unit tests: validation, permissions, business logic, components
- 20% integration: API endpoints, auth flow, database queries
- 10% E2E: critical flows only when explicitly requested

**Coverage targets**: 80% business logic, 100% auth/permission checks

## API Integration

**Base URL**: `http://localhost:8000/api/v1` (dev)
**Auth**: Clerk JWT in `Authorization: Bearer <token>` header, verified via JWKS
**Validation**: FastAPI validates Clerk JWT as dependency (`Depends(get_current_user)`)

**Key endpoints:**
- `GET /api/v1/health` — public health check (no auth)
- `GET /api/v1/resources` / `GET /api/v1/resources/progress` — demo catalog (Clerk)
- `GET /api/v1/playback/mux-token` — Mux Video playback JWT for signed playback IDs (Clerk)
- Storage routes under `GET /api/v1/storage/*` — Supabase PDFs (see docs)
- Future: user, progress, and additional content endpoints under `/api/v1/`

## Environment Variables

**Frontend** (`.env.local`):
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- `VITE_API_BASE_URL` — Backend API base URL (include `/api/v1`; default local port is **8000** unless uvicorn uses another `--port`)
- `VITE_SUPABASE_URL` — Supabase project URL (same as backend `SUPABASE_URL`); the SPA builds public object URLs `{url}/storage/v1/object/public/{bucket}/{path}` for public buckets (About page `public-assets`, public dashboard PDFs). Falls back to `GET /api/v1/storage/public-url` only if this is unset.
- `VITE_MUX_PUBLIC_PLAYBACK_ID` — Optional; when using `VITE_AUTH_MODE=mock/public`, set to the same **public** Mux playback ID as backend `MUX_PUBLIC_PLAYBACK_ID` (Course 1 free videos).
- `VITE_MUX_SEED_SIGNED_PLAYBACK_ID` — Optional; same **signed** playback ID as backend `MUX_SEED_SIGNED_PLAYBACK_ID` for mock paid Course 2 video `res-009`.
- `VITE_MUX_ENV_KEY` — Optional Mux Data environment key when your Mux project requires it.

**Backend** (`.env`):
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key (server-side only)
- `CLERK_JWKS_URL` — Clerk JWKS endpoint for JWT verification
- `CLERK_ISSUER` — Clerk JWT issuer URL
- `CLERK_AUDIENCE` — Clerk JWT audience (optional)
- `FRONTEND_URL` — Frontend origin for CORS (default: `http://localhost:5173`)
- `LOG_LEVEL` — structlog level (default: `INFO`)
- `ENVIRONMENT` — `development` | `staging` | `production`
- `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_PRIVATE_KEY` — Mux signing key (server-only) for `GET /api/v1/playback/mux-token` on **signed** playback IDs (Course 2 paid video)
- `MUX_PUBLIC_PLAYBACK_ID` — Optional; your **public** Mux playback ID for **Course 1** free videos (topics `dsa-pathways`, `timelines-deadlines`). If unset, a Mux sample ID is used in dev.
- `MUX_SEED_SIGNED_PLAYBACK_ID` — Optional; your **signed** Mux playback ID for paid **Course 2** demo video `res-009` when set

## External Documentation

- [@docs/prd/overview.md](docs/prd/overview.md) — Full product requirements (TTG Consulting Portal MVP)
- `@docs/prd/features/` — Individual feature specifications
- [@docs/architecture/overview.md](docs/architecture/overview.md) — System architecture
- [@docs/api/overview.md](docs/api/overview.md) — API documentation
- [@docs/data/models.md](docs/data/models.md) — Data models and schemas
- [@docs/testing/strategy.md](docs/testing/strategy.md) — Testing approach
- [@docs/deployment/environments.md](docs/deployment/environments.md) — Deployment guides

---

**Created**: 2026-03-22
**Status**: MVP Development
