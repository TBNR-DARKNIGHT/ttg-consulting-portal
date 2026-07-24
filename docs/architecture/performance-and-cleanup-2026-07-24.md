# Performance and Cleanup Changes - 2026-07-24

## Summary

This note documents the July 2026 performance and maintainability pass across the frontend,
backend, and Supabase schema. The changes were implemented to reduce avoidable page-load work,
avoid blocking FastAPI's event loop, reduce repeated database reads, and make large shared modules
clearer to maintain.

## Frontend Changes

### Lazy Mux Player Loading

The resource detail route no longer imports `@mux/mux-player-react` directly. Video playback is now
loaded through lazy wrapper components:

- `frontend/src/components/mux/mux-public-player.tsx`
- `frontend/src/components/mux/mux-signed-player.tsx`
- `frontend/src/routes/dashboard/resources.$resourceId.tsx`

This keeps the large Mux dependency out of non-video resource views. The production build still
contains a large Mux chunk because the library itself is large, but it is now demand-loaded instead
of being pulled into the resource detail route immediately.

### Analytics Flush Batching

`frontend/src/lib/analytics.ts` now queues ordinary analytics events and flushes them after a short
delay. Page/session exit events still prefer `navigator.sendBeacon` so session-end data is not lost
when the page is hidden or unloaded.

This reduces request chatter from click and page-view tracking while preserving lifecycle event
reliability.

### API Client Split

Shared fetch/error handling moved into `frontend/src/lib/api-client.ts`. The existing
`frontend/src/lib/api.ts` file continues to export the same public API functions, but now delegates
transport concerns to the smaller shared client module.

This is a first low-risk split. Future cleanups can continue by moving admin, storage, analytics,
and playback endpoint groups into separate files while preserving compatibility exports from
`api.ts`.

### Font and Theme Cleanup

`frontend/src/styles/globals.css` no longer imports Google Fonts itself. Fonts are loaded once from
`frontend/index.html`, and duplicate root theme variables were consolidated.

Current font pairing:

- Sans: `DM Sans`
- Serif: `Playfair Display`

## Backend Changes

### Resource Catalog Cache

`backend/app/services/content_repository.py` now keeps a short in-process cache of Supabase
resource catalog rows. This avoids repeatedly fetching the full `resources` table for nearby
requests such as dashboard loads, storage URL checks, and playback token checks.

Cache behavior:

- TTL: 30 seconds
- Falls back to seed resources if Supabase is unavailable or empty
- Invalidated after resource metadata, upload, deletion, replacement, video ingestion, and Mux
  playback metadata updates

### Blocking Supabase Work Moved Off the Event Loop

The Supabase Python client used here is synchronous. Hot async route paths now run blocking
catalog/storage work through `asyncio.to_thread`:

- `backend/app/routers/resources.py`
- `backend/app/routers/playback.py`
- `backend/app/routers/storage.py`

This avoids tying up the FastAPI event loop while synchronous Supabase table or storage calls are
in progress.

### Authenticated User Sync Cache

`backend/app/services/user_sync.py` now includes a short claims-aware cache used by
`backend/app/dependencies.py`. This reduces repeated `users` table reads/updates for bursts of
authenticated API requests from the same Clerk identity.

Cache behavior:

- TTL: 60 seconds
- Keyed by Clerk user id plus profile claims that can affect synchronization
- Does not replace backend authorization checks permanently; role/profile changes refresh after
  the TTL

### Public Course ID Parsing Cache

`backend/app/services/course_access_policy.py` now caches the parsed `PUBLIC_COURSE_IDS` setting
with a one-entry `lru_cache`. This removes repeated setting string parsing during resource access
checks.

## Database Changes

### Admin Analytics Indexes

The migration `supabase/migrations/20260724000100_add_analytics_performance_indexes.sql` adds
indexes for the admin analytics dashboard query patterns:

- Recent event filtering by `occurred_at`
- Event type trends
- User activity lookups
- Resource view lookups
- Page-path view lookups
- Active entitlement lookup
- Ignored-user matching

This keeps the existing Python aggregation behavior intact while making the underlying reads faster
as analytics volume grows.

## Known Caveats

- The frontend production build still reports large lazy chunks for Mux and `react-pdf`. This is
  expected because those libraries are large. The improvement is that they are isolated behind
  route/component-level lazy loading.
- Materialized analytics summaries were not introduced in this pass. They may be worthwhile later,
  but require a product/ops decision on refresh cadence and dashboard freshness expectations.
- The in-process caches are per backend process. In a multi-instance deployment, each instance has
  its own short-lived cache.
- In the local sandbox, `npm run build` can fail with an access-denied error while resolving
  `vite.config.ts`; running the same command outside the sandbox succeeds.

## Validation

Validation performed after implementation:

```bash
cd backend
.venv\Scripts\python.exe -m ruff check app tests
.venv\Scripts\python.exe -m pytest

cd frontend
npm run type-check
npm run lint
npm run build
```

Results:

- Backend tests: 103 passed
- Backend lint: passed
- Frontend type-check: passed
- Frontend lint: passed
- Frontend production build: passed outside the sandbox
