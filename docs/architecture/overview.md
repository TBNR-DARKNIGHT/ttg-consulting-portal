# Architecture Overview

## TTG Consulting Portal - System Architecture

**Last Updated**: 2026-03-28
**Status**: Draft

---

## System Architecture

### High-Level Architecture

```
+----------------------------------+
|        Browser (Client)          |
|   React 19.1 + TypeScript 5.9   |
|   Vite 7.3 / TanStack Router    |
+----------------+-----------------+
                 | HTTPS
                 v
+----------------------------------+
|          Clerk (Auth)            |
|   JWT tokens, user management   |
+----------------+-----------------+
                 | JWT
                 v
+----------------------------------+
|      FastAPI (Backend API)       |
|   Python >=3.10                  |
|   JWT validation, business logic |
+-----------+----------+-----------+
            |          |
            v          v
+---------------+  +----------------+
|  Supabase DB  |  | Supabase       |
|  PostgreSQL   |  | Storage        |
|  + RLS        |  | (videos/files) |
+---------------+  +----------------+
```

**Pattern**: Decoupled SPA + REST API

---

## Frontend Architecture

**Framework**: React 19.1 + TypeScript 5.9, bundled with Vite 7.3 (SWC)

**Key Technologies:**

- TanStack Router 1.157+ — file-based routing
- TanStack Query 5.90+ — server state (stale-while-revalidate)
- shadcn/ui (new-york) — component library
- Tailwind CSS 4.2 — utility-first styling
- Clerk React SDK — authentication UI components

**Directory Structure:**

```
frontend/src/
  routes/              # File-based TanStack Router pages
  components/
    ui/                # shadcn/ui components
    layout/            # Layout components (sidebar, nav)
    features/          # Feature-specific components
  hooks/               # Custom hooks (useVideos, useContent, etc.)
  lib/                 # API client, query keys, utilities
  types/               # TypeScript type definitions
```

**Key Patterns:**

- All API data fetching through TanStack Query hooks
- Clerk's `<SignIn/>`, `<UserButton/>` components for auth UI
- Route guards via TanStack Router's `beforeLoad` for protected routes
- shadcn/ui components customized via Tailwind, not CSS overrides

---

## Backend Architecture

**Framework**: FastAPI (Python >=3.10)

**Directory Structure:**

```
backend/app/
  routers/             # Route handlers (health, future endpoints)
  middleware/           # structlog request logging
  models/              # Pydantic schemas + shared enums
  services/            # Business logic + Supabase client
  config.py            # Pydantic Settings (env vars)
  dependencies.py      # Clerk JWT auth + Supabase DI
  main.py              # App factory, lifespan, CORS, router mounting
backend/tests/         # pytest + httpx async tests
```

**Key Patterns:**

- Clerk JWT validated as FastAPI dependency injection (`Depends(get_current_user)`)
- JWKS keys fetched from Clerk with 1-hour TTL cache and 10s HTTP timeout
- Malformed JWKS responses and missing JWT claims handled gracefully (clean 401)
- Catch-all exception handler in auth path prevents stack trace leaks
- Pydantic schemas for all request/response validation
- All responses use `ApiResponse[T]` envelope (`data` + `error` fields)
- Supabase client injected via dependency injection (service role key — see Security note below)

---

## Database Architecture

**Database**: PostgreSQL via Supabase

**Deployed Core Tables:** `users`, `resources`, `course_entitlements`, `access_codes`,
`admin_audit_log`

**Planned/Legacy Tables:** `students`, `videos`, `content`

**See**: [@docs/data/models.md](../data/models.md) for full schema with SQL

**Row Level Security (RLS):** Defense in depth where policies are configured. The current FastAPI
service-role client bypasses RLS, so every user/resource boundary is also enforced in backend code.

---

## Security Architecture

**Authentication**: Clerk (managed service)

- JWT-based sign-up/sign-in; authenticated identities are synchronized to `public.users` on their first protected API request
- 7-day session persistence
- RS256 algorithm enforced (no algorithm confusion)
- JWKS keys cached (1-hour TTL) with 10-second HTTP timeout to prevent worker starvation
- Malformed JWKS responses, missing `sub` claims, and unexpected errors all produce clean 401 responses
- A verified Clerk identity is resolved or created in `public.users` on authenticated API requests; Clerk profile fields are synchronized without overwriting application-managed role/status
- After Clerk sign-in, `/auth/complete` loads `GET /api/v1/me` and routes `ADMIN` users to
  `/admin`; all other roles go to `/dashboard`. This redirect is convenience only—the API remains
  the authorization boundary.

**Audience Verification**: Optional in development (`CLERK_AUDIENCE` unset skips `aud` check). Must be configured in staging/production to prevent cross-client token acceptance.

**Supabase Service Role Key**: The current scaffold uses the Supabase service role key (bypasses RLS) for all authenticated requests. Each endpoint **must** resolve the verified Clerk JWT `sub` through `users.clerk_user_id` and scope queries to the resulting internal user UUID. Access-code creation and redemption are backend-only operations; clients never receive direct table access. Per-user Supabase JWTs for full RLS enforcement are planned for a later phase.

**Authorization**: Application-managed uppercase roles (`CLIENT`, `CONSULTANT`, `ADMIN`), a
configurable public-course allowlist, and course entitlements for future paid content. Clerk
authenticates the identity; Supabase `users.role` authorizes portal operations.

- Enforced at API layer (FastAPI deps) + database layer (Supabase RLS)
- `require_admin` reloads the synchronized Supabase role and protects every `/api/v1/admin/*`
  operation. Hiding `/admin` in the SPA is not a security control.
- `PUBLIC_COURSE_IDS` currently makes Course 1 and Course 2 accessible without login/payment.
- Paid PDFs and signed Mux tokens resolve the resource and course server-side before authorization;
  public-course resources are allowed even for anonymous users.
- Non-public paid courses still require an active `course_entitlements` row or admin role.
- Access-code create, revoke, and reissue operations use service-role-only PostgreSQL functions;
  reissue revokes the old unused code and inserts its replacement in one transaction.
- Admin mutations append operational records to `admin_audit_log`.

See [Open Course Access](./open-course-access.md) for the current no-login course policy and how to
restore entitlement gating later.

**Data Protection:**

- HTTPS in transit, Supabase encryption at rest
- Signed/expiring URLs for video/file access
- Paid Mux assets must contain a signed playback ID and no public playback ID. Because a Mux asset
  may have several playback IDs, adding a signed ID without deleting its public ID leaves the asset
  publicly playable.
- CORS restricted to single frontend origin (with credentials)
- Auth header values excluded from request logs

---

## Integration Architecture

| Service  | Purpose                | Integration Method             |
| -------- | ---------------------- | ------------------------------ |
| Clerk    | Auth, user management  | JWT, React SDK, webhooks       |
| Supabase | Database, file storage | Python client, JS client       |
| TTA Shop | Payment processing     | Manual (MVP), webhook (future) |
| GHCR     | Docker image registry  | GitHub Actions push            |

---

## Infrastructure

**CI/CD**: GitHub Actions — lint, type-check (tsc + Pyright), tests, Docker build + push to GHCR

**Hosting**: TBD (Docker-based — Railway, Fly.io, AWS ECS, or GCP Cloud Run)

**Monitoring**: TBD (Sentry recommended for error tracking)

---

## Pending ADRs

- ADR-001: Choose Clerk over self-hosted auth
- ADR-002: Choose Supabase over raw PostgreSQL + S3
- ADR-003: Choose FastAPI over Node.js/Express backend
- ADR-004: Choose TanStack Router over React Router

---

## Related Documentation

- [Data Models](../data/models.md)
- [API Overview](../api/overview.md)
- [Deployment Guide](../deployment/environments.md)
- [Performance and Cleanup Changes](./performance-and-cleanup-2026-07-24.md)
- [PRD Overview](../prd/overview.md)
