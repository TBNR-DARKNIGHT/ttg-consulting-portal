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

All endpoints return an `ApiResponse[T]` envelope with `data` and `error` fields.

### Success Response
```json
{
  "data": { ... },
  "error": null
}
```

### Error Response
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
- `201 Created` — Successful POST
- `204 No Content` — Successful DELETE
- `400 Bad Request` — Invalid request data
- `401 Unauthorized` — Missing or invalid JWT
- `403 Forbidden` — Insufficient role/permissions
- `404 Not Found` — Resource not found
- `422 Unprocessable Entity` — Pydantic validation error
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

---

## Core Endpoints

### Authentication

```
POST   /api/auth/validate          # Validate JWT, return user profile
```

**Response** (200):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "CLIENT",
  "first_name": "David",
  "provisioned_content": ["content-id-1"]
}
```

### Content (DSA Resources)

```
GET    /api/content                # List content (scoped to user's access)
GET    /api/content/public         # List free/public content (no auth)
GET    /api/content/:id            # Get specific content item
```

**Query Parameters** (GET /api/content):
- `topic` — Filter: `dsa-pathways`, `interview-prep`, `timelines`
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

### Students (MapleBear)

```
GET    /api/students               # List students (parent: own children, consultant: assigned)
GET    /api/students/:id           # Get student details
```

### Videos (MapleBear Recordings)

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

### Users (Admin)

```
GET    /api/users                  # List users (admin only)
GET    /api/users/me               # Get current user profile
POST   /api/users/provision        # Provision content access (admin only)
```

**POST /api/users/provision**:
```json
{
  "user_id": "uuid",
  "content_ids": ["content-id-1", "content-id-2"]
}
```

### Storage (Supabase; implemented)

These routes live under the same **`/api/v1`** prefix as health. The SPA typically resolves **public** bucket file URLs in the browser when **`VITE_SUPABASE_URL`** is set (same path Supabase uses for public objects); **`GET /storage/public-url`** remains available as a fallback.

```
GET    /api/v1/storage/public-url       # Public bucket: returns public URL JSON (no auth)
GET    /api/v1/storage/public-download  # Public bucket: stream bytes (no auth)
GET    /api/v1/storage/paid-url         # Paid bucket: signed URL JSON (Clerk JWT)
GET    /api/v1/storage/paid-download    # Paid bucket: stream bytes (Clerk JWT)
```

**Query parameters** (all of the above): `bucket`, `path` (object key inside the bucket, e.g. `docs/file.pdf`).

In **development** only, equivalent **`/api/v1/dev/storage/...`** helpers may be registered for smoke tests.

### Playback (Mux Video; implemented)

Course videos are delivered via **Mux** (transcoded + CDN). **PDFs** remain in Supabase Storage (`resources-public` / `resources-paid`) using the routes above.

- **Public** Mux playback IDs: the SPA uses **Mux Player** with `playbackId` only (no JWT).
- **Signed** Mux playback IDs: the SPA requests a short-lived RS256 JWT from the API after Clerk auth, then passes `tokens.playback` to Mux Player.

```
GET    /api/v1/playback/mux-token       # Mint Mux Video playback JWT (Clerk JWT)
```

**Query parameters**: `resource_id` (catalog id, e.g. `res-009`), optional `expires_in` (seconds, default 3600, min 60, max 86400).

**Responses**: `200` with `{ "data": { "token": "...", "expiresAt": 1735689600 }, "error": null }` (camelCase JSON). Returns `400` if the resource is not a signed Mux video, `404` if unknown or not provisioned, `503` if signing keys are not configured on the server.

Configure **`MUX_SIGNING_KEY_ID`** and **`MUX_SIGNING_PRIVATE_KEY`** (Mux dashboard → Signing Keys; private key as PEM or base64 PEM). **`MUX_PUBLIC_PLAYBACK_ID`**: your **public** playback ID for **Course 1** free videos (`dsa-pathways`, `timelines-deadlines`); if unset, a Mux sample ID is used in development. Optional **`MUX_SEED_SIGNED_PLAYBACK_ID`**: your **signed** playback ID — when set, the demo `/resources` catalog includes paid **Course 2** sample `res-009` for local testing.

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

**Query Parameters** (list endpoints):
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

- Authenticated: 100 requests/minute
- Anonymous: 20 requests/minute

---

## Security

- HTTPS only in production
- CORS: single frontend origin with credentials
- Clerk JWT validated on every protected request (RS256 only, JWKS cached with 1h TTL)
- JWKS fetch uses 10s HTTP timeout to prevent worker starvation
- All auth errors (malformed JWKS, missing claims, unexpected exceptions) return clean 401 — no stack traces
- Supabase service role key used (bypasses RLS) — endpoints must scope queries by `clerk_id`
- Input validation via Pydantic schemas
- Signed/expiring URLs for file access

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
