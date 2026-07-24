# API Documentation

## TTG Consulting Portal API

**Version**: 1.0
**Last Updated**: 2026-05-01
**Status**: Draft

---

## Overview

RESTful API built with FastAPI (Python >=3.10). All protected endpoints require a valid Clerk JWT.

**Base URL**:

- Development: `http://localhost:8000/api/v1`
- Staging: TBD
- Production: TBD

**Auto-generated docs**: FastAPI provides OpenAPI docs at `/docs` (Swagger) and `/redoc`.

---

## Authentication

**Method**: Clerk JWT (Bearer token)

**Header**:

```
Authorization: Bearer <clerk-jwt>
```

**Flow**: Client authenticates via Clerk SDK -> receives JWT -> passes to FastAPI -> FastAPI validates JWT via Clerk's JWKS endpoint (RS256 only, 10s timeout, 1h key cache) -> extracts `sub` claim as user identity -> grants access.

**Error handling**: Missing/invalid tokens return `401`. JWKS fetch failures return `401` (logged server-side). Unexpected auth errors are caught and returned as clean `401` responses — no stack traces leak to clients.

**Audience verification**: When `CLERK_AUDIENCE` is configured, the `aud` claim is verified. In development (unset), audience verification is skipped.

**Session**: 7-day persistence unless user logs out.

---

## Common Response Format

Successful typed application endpoints use an `ApiResponse[T]` envelope with `data` and `error`
fields. Streaming downloads return file bytes directly. FastAPI validation and `HTTPException`
failures use the standard `{ "detail": ... }` body.

### Success Response

```json
{
  "data": { ... },
  "error": null
}
```

### Application Error Envelope

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Status Codes

- `200 OK` — Successful GET, PUT, PATCH
- `201 Created` — Successful resource-creation POST where configured (redemption returns `200`)
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Invalid request data
- `401 Unauthorized` — Missing or invalid JWT
- `403 Forbidden` — Insufficient role/permissions
- `404 Not Found` — Resource not found
- `409 Conflict` — Code already redeemed or course already active
- `410 Gone` — Redemption code expired
- `422 Unprocessable Entity` — Pydantic validation error
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

---

## Core Endpoints

### Authentication

Authentication is a FastAPI dependency on protected `/api/v1` routes; there is no dedicated
validation endpoint. The dependency validates the Clerk JWT, resolves or creates `public.users`,
and makes both the Clerk subject and internal Supabase UUID available to downstream authorization.

```
GET    /api/v1/me                    # Current synchronized identity and portal role
```

`GET /api/v1/me` returns `id`, `clerkUserId`, `email`, and the application-managed uppercase
`role`. The SPA uses it after sign-in to route `ADMIN` users to `/admin` and other users to
`/dashboard`. Clients must not use this redirect as authorization; protected endpoints perform
their own server-side role check.

### Administration

All endpoints below require a verified Clerk JWT whose synchronized `public.users.role` is
`ADMIN`:

```
GET    /api/v1/admin/access-codes
POST   /api/v1/admin/access-codes
POST   /api/v1/admin/access-codes/{code_id}/revoke
POST   /api/v1/admin/access-codes/{code_id}/reissue
POST   /api/v1/integrations/woocommerce/access-code
```

### WooCommerce purchase fulfilment

`POST /api/v1/integrations/woocommerce/access-code` is a server-to-server endpoint for
Zapier. It requires the `X-Webhook-Secret` header to exactly match the backend-only
`ZAPIER_WEBHOOK_SECRET` environment variable.

Request:

```json
{
  "orderId": "12345",
  "courseId": "course-2"
}
```

The endpoint derives a stable high-entropy code from the secret, course, and normalized
WooCommerce order ID, stores only its SHA-256 hash, and returns the plaintext code to the
caller. Repeating the request for the same order returns the same code and Supabase row,
making Zapier retries idempotent. Changing `ZAPIER_WEBHOOK_SECRET` means codes for previously
processed orders can no longer be reproduced, so rotate it only with an operational plan.

Response:

```json
{
  "data": {
    "id": "7d28e44b-fcec-4c38-a08c-d450fbc798d1",
    "code": "TTA-2345-6789-ABCD-EFGH-JKLM-NPQR",
    "orderId": "12345"
  },
  "error": null
}
```

Never configure Zapier with `SUPABASE_SERVICE_KEY`; only give it the dedicated webhook
secret. Customer email delivery and line-item filtering remain the responsibility of
WooCommerce and Zapier; the backend only needs the order ID and target course.

Creation accepts `courseId`, optional `orderId`, and optional ISO-8601 `expiresAt`. Revoke and
reissue accept a required audit `reason`. Create and reissue return the plaintext code exactly
once; only its SHA-256 hash is persisted.

Revoke and reissue apply only to active, unredeemed codes. Reissue atomically revokes the old code,
creates its replacement with the same course, order, and expiry, links the records, and writes an
`admin_audit_log` entry. Revoking a redeemed user's entitlement is deliberately a separate
operation and is not provided by these endpoints.

### Course Entitlements

```
GET    /api/v1/me/entitlements       # List the current user's course access
POST   /api/v1/entitlements/redeem   # Consume a transferable, single-use code
```

**Redemption request:**

```json
{
  "code": "TTA-7MXP-R4QK-93VN"
}
```

The backend normalizes and hashes the submitted code, then atomically consumes the matching
`access_codes` row and grants the corresponding `course_entitlements` row to the authenticated
user. The purchaser's email is not checked. Plaintext codes are never stored or logged.

Successful entitlement response:

```json
{
  "data": {
    "courses": ["course-1", "course-2"]
  },
  "error": null
}
```

Successful redemption response:

```json
{
  "data": {
    "courseId": "course-2",
    "status": "granted"
  },
  "error": null
}
```

Redemption returns `400` for an invalid code, `409` for a consumed code or already-active
entitlement, `410` for an expired code, and `503` when user synchronization or the entitlement
service is unavailable.

### Content (legacy/planned; not implemented)

```
GET    /api/content                # List content (scoped to user's access)
GET    /api/content/public         # List free/public content (no auth)
GET    /api/content/:id            # Get specific content item
```

**Query Parameters** (GET /api/content):

- `topic` — Earlier proposal; the implemented catalog uses `/api/v1/resources`
- `type` — Filter: `video`, `article`, `download`

**Response** (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "DSA Interview Preparation Guide",
      "type": "video",
      "topic": "interview-prep",
      "completion_status": "not_started",
      "thumbnail_url": "https://...",
      "duration_seconds": 720
    }
  ]
}
```

### Students (MapleBear; planned, not implemented)

```
GET    /api/students               # List students (parent: own children, consultant: assigned)
GET    /api/students/:id           # Get student details
```

### Videos (MapleBear Recordings; planned, not implemented)

```
GET    /api/students/:id/videos    # List videos for a student
POST   /api/students/:id/videos    # Upload video (consultant only)
PUT    /api/videos/:id/feedback    # Add/edit feedback (consultant only)
```

**POST /api/students/:id/videos** — multipart form:

- `file` — Video file
- `title` — Session title (required)
- `session_date` — Date of session (required, ISO format)

**PUT /api/videos/:id/feedback**:

```json
{
  "feedback": "Great progress on eye contact today. Work on slowing down pace."
}
```

- Max 500 characters

### Users

There is no general user-administration router. Authenticated users are synchronized internally by
the Clerk dependency. Administrators are assigned by updating the application-managed
`public.users.role`; Clerk Organizations are not the source of global portal administrator access.

### Storage (Supabase; implemented)

These routes live under the same **`/api/v1`** prefix as health. All four accept only a catalog
`resource_id`; callers cannot supply a storage bucket or object path.

```
GET    /api/v1/storage/public-url       # Public bucket: returns public URL JSON (no auth)
GET    /api/v1/storage/public-download  # Public bucket: stream bytes (no auth)
GET    /api/v1/storage/paid-url         # Paid PDF by resource_id; entitlement required
GET    /api/v1/storage/paid-download    # Paid PDF by resource_id; entitlement required
```

**Query parameters**: `resource_id`. `paid-url` also accepts optional `expires_in`.

The backend resolves `bucket` and `file_path` from the catalog. Public routes accept only public
PDFs assigned to `resources-public`. Paid routes accept only paid PDFs assigned to
`resources-paid` and require the resource's course entitlement.

In **development** only, equivalent **`/api/v1/dev/storage/...`** helpers may be registered for smoke tests.

### Resources (implemented)

Course catalog rows (videos, PDFs, articles) are stored in Supabase `resources` when configured; the API falls back to in-memory seeds when the table is empty.

```
GET    /api/v1/resources                # List catalog (Clerk JWT)
GET    /api/v1/resources/progress       # Demo progress (Clerk JWT)
```

Video rows include `muxPlaybackId` and `muxPlaybackSigned` after Mux sync. PDF rows include `bucket` and `filePath` for Supabase Storage.

### Admin resource uploads (implemented)

All upload endpoints require an authenticated `ADMIN`.

```text
POST /api/v1/admin/resources/documents
POST /api/v1/admin/resources/videos
POST /api/v1/admin/resources/links
POST /api/v1/admin/resources/videos/{resource_id}/complete?upload_id=...
```

Document uploads accept multipart form data, store PDFs in the course's existing Supabase bucket,
and insert or update the matching `resources` row. Video creation inserts the resource row and
returns a short-lived Mux direct-upload URL, so video bytes travel from the browser to Mux rather
than through FastAPI. The completion endpoint attaches the Mux asset and playback IDs to the row.

Course 1 uses `resources-public` and public Mux playback. Course 2 and newly created courses use
`resources-paid` and signed Mux playback. The server derives these destinations from course
metadata; callers cannot choose an arbitrary bucket or playback policy.

The link endpoint accepts public HTTPS PDF or video URLs. Google Drive sharing URLs are converted
to download URLs and must be shared with anyone who has the link. Linked PDFs are downloaded,
size-limited, content-verified, and stored in Supabase; linked videos are imported by Mux directly.
Private-network and local URLs are rejected.

The uploader uses the same backend `SUPABASE_*`, `MUX_*`, and `FRONTEND_URL` settings as the rest of
the application. It has no separate environment file, Google Drive credentials, or local sync log.

### Playback (Mux Video; implemented)

Course videos are delivered via **Mux** (transcoded + CDN). **PDFs** remain in Supabase Storage (`resources-public` / `resources-paid`) using the routes above.

- **Public** Mux playback IDs: the SPA uses **Mux Player** with `playbackId` only (no JWT).
- **Signed** Mux playback IDs: the SPA requests a short-lived RS256 JWT from the API after Clerk auth, then passes `tokens.playback` to Mux Player.

```
GET    /api/v1/playback/mux-token       # Mint Mux Video playback JWT (Clerk JWT)
```

Paid storage routes accept `resource_id`, not a browser-supplied bucket or object path. The backend
loads the catalog row, checks its course entitlement, and uses the server-owned storage location.
Signed paid Mux playback tokens enforce the same course entitlement.

**Query parameters**: `resource_id` (catalog id, e.g. `res-009`), optional `expires_in` (seconds, default 3600, min 60, max 86400).

**Responses**: `200` with `{ "data": { "token": "...", "expiresAt": 1735689600 }, "error": null }` (camelCase JSON). Returns `400` if the resource is not a signed Mux video, `403` when a paid course entitlement is absent, `404` if unknown or not provisioned, and `503` if signing keys or authorization dependencies are unavailable.

Configure **`MUX_TOKEN_ID`** and **`MUX_TOKEN_SECRET`** (Mux dashboard → Settings → API Access Tokens) to sync playback IDs from Mux assets into the Supabase `resources` table:

```bash
cd backend && python -m app.scripts.sync_mux
```

When uploading videos in Mux, set **Passthrough** to the portal resource id (e.g. `res-001`). Public catalog videos need a **public** playback policy; paid videos need **signed**.

Configure **`MUX_SIGNING_KEY_ID`** and **`MUX_SIGNING_PRIVATE_KEY`** (Mux dashboard → Signing Keys; private key as PEM or base64 PEM) for signed playback JWTs.

A paid asset is secure only when its referenced playback ID has policy `signed` **and the asset has
no remaining public playback ID**. Mux permits multiple playback IDs on one asset. An
unauthenticated request to a signed ID must not return a playable `200` manifest:

```powershell
curl.exe -o NUL -s -w "%{http_code}`n" "https://stream.mux.com/PLAYBACK_ID.m3u8"
```

See the paid-asset conversion procedure in the
[Setup Guide](../getting-started/setup.md#convert-an-existing-paid-mux-asset-to-signed-playback).

### Health

```
GET    /api/v1/health              # Health check (no auth)
```

**Response** (200):

```json
{
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "environment": "development"
  },
  "error": null
}
```

---

## Pagination

Pagination is planned but is not implemented by the current resource/entitlement endpoints.
Proposed query parameters for future list endpoints:

- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)

**Response meta**:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

## Rate Limiting

Application-level rate limiting is not yet implemented. Redemption attempt limits by user/IP are a
production requirement; platform/edge limits should be configured as an additional layer.

---

## Security

- HTTPS only in production
- CORS: single frontend origin with credentials
- Clerk JWT validated on every protected request (RS256 only, JWKS cached with 1h TTL)
- JWKS fetch uses 10s HTTP timeout to prevent worker starvation
- All auth errors (malformed JWKS, missing claims, unexpected exceptions) return clean 401 — no stack traces
- Supabase service-role access bypasses RLS; protected queries resolve Clerk `sub` to internal
  `users.id` and enforce user/course scope in FastAPI
- Storage APIs accept catalog `resource_id` only and resolve allowlisted buckets/paths server-side
- Paid PDFs and signed Mux playback require an active course entitlement
- Input validation via Pydantic schemas

---

## API Contract First

When adding new endpoints:

1. Design Pydantic schemas (request/response)
2. Add endpoint to FastAPI router
3. FastAPI auto-generates OpenAPI spec at `/docs`
4. Write tests based on contract
5. Document in `endpoints/` directory

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Data Models](../data/models.md)
- [Testing Strategy](../testing/strategy.md)
- [PRD Overview](../prd/overview.md)
