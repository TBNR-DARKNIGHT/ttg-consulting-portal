# Data Models

## TTG Consulting Portal - Data Schema

**Last Updated**: 2026-07-01
**Status**: Draft

---

## Overview

**Database**: PostgreSQL (via Supabase)
**ORM/Client**: Supabase Python client (backend), Supabase JS client (frontend, optional)
**Auth**: Clerk (user identity managed externally, synced to local DB)

**Currently deployed public tables**: `users`, `resources`, `course_entitlements`,
`access_codes`, `admin_audit_log`

`students`, `videos`, and `content` below are planned/legacy models and are not currently deployed
in the linked Supabase project.

---

## Entity Relationship Diagram

```
User 1:N Students (planned, as parent)
User 1:N Students (planned, as consultant)
Student 1:N Videos (planned)
User 1:N Videos (planned, as uploader/consultant)
Content (legacy, standalone access model)
User N:M Courses (via CourseEntitlement)
AccessCode 0..1:1 User (first successful redemption)
User 1:N AdminAuditLog (privileged actor)
```

---

## Core Models

### User

Represents parents, clients, consultants, and administrators. Identity managed by Clerk, profile synced to Supabase.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    -- Internal Supabase user ID
  clerk_user_id TEXT UNIQUE NOT NULL,               -- Clerk `sub`, e.g. user_2abc123
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('CLIENT', 'CONSULTANT', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

The internal UUID remains the foreign-key target for application tables. Clerk JWT validation
produces a string `sub`; the backend resolves that identity through `users.clerk_user_id`.
On the first verified Clerk request, FastAPI creates the local row with role `CLIENT` and status
`ACTIVE`. Later requests refresh Clerk-owned profile fields while preserving server-managed
`role` and `status`. If the session token lacks an email claim, the backend loads the profile with
the server-only Clerk secret key.

**Roles:**

The deployed portal authorization enum currently accepts `CLIENT`, `CONSULTANT`, and `ADMIN`.
`PARENT` below belongs to the planned MapleBear schema and is not a current `UserRole` value.
- `PARENT` — MapleBear parent (self-registered)
- `CLIENT` — Default role for a portal user synchronized from Clerk
- `CONSULTANT` — Teacher/consultant uploading content
- `ADMIN` — System administrator

---

### Student

**Deployment status: planned.** Represents a child enrolled in a MapleBear programme.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  programme TEXT NOT NULL CHECK (programme IN ('MAPLEBEAR_SC', 'MAPLEBEAR_YE')),
  parent_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_consultant ON students(consultant_id);
CREATE INDEX idx_students_programme ON students(programme);
```

**Programmes:**
- `MAPLEBEAR_SC` — MapleBear Student Care
- `MAPLEBEAR_YE` — MapleBear Young Explorers

---

### Video

**Deployment status: planned.** Represents a student recording uploaded by a consultant.

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  title TEXT NOT NULL,
  session_date DATE NOT NULL,
  file_url TEXT NOT NULL,                           -- Supabase Storage signed URL
  duration_seconds INTEGER,
  feedback TEXT CHECK (char_length(feedback) <= 500),
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_student ON videos(student_id);
CREATE INDEX idx_videos_session_date ON videos(session_date);
CREATE INDEX idx_videos_uploaded_by ON videos(uploaded_by_id);
```

---

### Resources (catalog)

Portal course catalog — videos (Mux), PDFs (Supabase Storage paths), and articles.

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course_id TEXT NOT NULL,
  module_id TEXT,
  type TEXT,
  topic TEXT,
  description TEXT,
  duration TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  bucket TEXT,
  file_path TEXT,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  mux_playback_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**PDF files** live in Supabase Storage, not in this table’s rows as blobs — each PDF resource stores `bucket` + `file_path` pointing at the object:

- Course 1: `resources-public` / `course-1/...`
- Course 2: `resources-paid` / `course-2/...`

Course membership is stored explicitly in `course_id` so backend access checks do not depend on
topic mappings or storage-path naming conventions. Current open access is controlled by the
backend `PUBLIC_COURSE_IDS` setting, not by changing every resource row from `paid` to `public`.

Course 2 module metadata is stored in `course_modules`. The composite foreign key from
`resources(course_id, module_id)` ensures that an optional module belongs to the resource's course.

### Content (legacy doc schema)

**Deployment status: legacy/not deployed.** New dashboard content uses `resources`.

Represents DSA resources (videos, articles, downloads) — both free and paid.

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'article', 'download')),
  topic TEXT NOT NULL CHECK (topic IN ('dsa-pathways', 'interview-prep', 'timelines')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,         -- Free (true) vs paid (false)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_topic ON content(topic);
CREATE INDEX idx_content_is_public ON content(is_public);
```

---

### CourseEntitlement

Grants lifetime access to a paid course. Courses listed in `PUBLIC_COURSE_IDS` are available even
without an authenticated account and do not require an entitlement row. Entitlements remain the
mechanism for future non-public paid courses.

```sql
CREATE TABLE course_entitlements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('access_code', 'shop_webhook', 'admin')),
  source_reference TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_course_entitlements_user_id ON course_entitlements(user_id);
CREATE INDEX idx_course_entitlements_course_id ON course_entitlements(course_id);
```

An entitlement is active when `revoked_at IS NULL`. Redemption is idempotent at the entitlement
level because each user can have at most one row per course.

---

### AccessCode

Represents a transferable, single-use code issued after a qualifying TTA Shop purchase. The code
is not tied to the purchaser's email: the first authenticated user to redeem it receives the
entitlement.

```sql
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL CHECK (char_length(code_hash) = 64),
  course_id TEXT NOT NULL,
  order_id TEXT,
  redeemed_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  revocation_reason TEXT,
  replacement_for_code_id UUID REFERENCES access_codes(id) ON DELETE RESTRICT,
  CHECK (
    (redeemed_by_user_id IS NULL AND redeemed_at IS NULL)
    OR
    (redeemed_by_user_id IS NOT NULL AND redeemed_at IS NOT NULL)
  )
);

CREATE INDEX idx_access_codes_course_id ON access_codes(course_id);
CREATE INDEX idx_access_codes_redeemed_by_user_id ON access_codes(redeemed_by_user_id);
CREATE UNIQUE INDEX idx_access_codes_active_order_id
  ON access_codes(order_id)
  WHERE order_id IS NOT NULL AND revoked_at IS NULL;
CREATE UNIQUE INDEX idx_access_codes_replacement
  ON access_codes(replacement_for_code_id)
  WHERE replacement_for_code_id IS NOT NULL;
```

Only a keyed hash or secure hash of a high-entropy code is stored. The plaintext code is shown
once to the issuing workflow and delivered by TTA Shop; it must not be persisted or logged by the
portal. Code consumption and insertion of the matching `course_entitlements` row must occur in one
PostgreSQL transaction so concurrent requests cannot redeem the same code twice.

The backend performs that transaction through
`redeem_course_code(p_code_hash text, p_user_id uuid)`. The function locks both the code and user,
rejects invalid, expired, consumed, and redundant redemptions, restores a previously revoked
entitlement when a new valid code is used, and consumes the code only after granting access.
Execution is revoked from `public`, `anon`, and `authenticated` and granted only to `service_role`.
Revoked codes are treated as invalid by the redemption function.

Admin mutations use the service-role-only functions `admin_create_access_code`,
`admin_revoke_access_code`, and `admin_reissue_access_code`. Reissue locks the original code,
revokes it, creates the replacement, and records the audit event in one database transaction.

### AdminAuditLog

Operational history for privileged access-code actions. Application code only appends records:

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Current actions are `access_code.created`, `access_code.revoked`, and
`access_code.reissued`. RLS is enabled with no browser policies. Read it through the privileged
Supabase dashboard/SQL editor or a future server-side admin endpoint—never by exposing the service
role key to the SPA.

```sql
SELECT l.created_at, l.action, u.email AS admin_email,
       l.target_type, l.target_id, l.details
FROM public.admin_audit_log AS l
JOIN public.users AS u ON u.id = l.actor_user_id
ORDER BY l.created_at DESC;
```

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `resources-public` | Dashboard **public PDFs** | Backend catalog allowlist by `resource_id`; bucket remains public |
| `resources-paid` | Dashboard PDFs that should remain privately stored | Backend resource policy + signed/download API |
| `student-videos` | MapleBear student recordings | Signed URLs, consultant upload, parent read |
| `public-assets` | Marketing / About page images | Public read |

**Course videos (DSA / interview modules)** use **Mux Video**, not Supabase object storage: each `resources` row stores a **Mux playback ID** and whether playback is **public** or **signed** (JWT minted by `GET /api/v1/playback/mux-token`). Signed playback can still be used for currently open courses; the backend mints tokens for resources allowed by `PUBLIC_COURSE_IDS`. Playback IDs are synced from Mux via `python -m app.scripts.sync_mux` (set asset **Passthrough** to the resource id). **PDFs** use `bucket` + `file_path` pointing at Supabase Storage. See [API overview](../api/overview.md), [Open Course Access](../architecture/open-course-access.md), and [Mux secure playback](https://www.mux.com/docs/guides/secure-video-playback).

---

## Row Level Security (RLS) Policies

- **users**: Backend endpoints resolve the verified Clerk `sub` through `clerk_user_id`; they never trust a user ID supplied by the browser.
- **resources**: Public catalog metadata may be listed. Files and playback tokens are served when
  the resource belongs to a course in `PUBLIC_COURSE_IDS`, the user is an admin, or the user has an
  active entitlement for a non-public paid course.
- **course_entitlements**: Users may read their own access through a backend endpoint. Only trusted backend/admin workflows may grant or revoke.
- **access_codes**: No direct client access. Only the service-role backend may create, inspect, or atomically redeem codes.
- **admin_audit_log**: No direct client access. Service-role/admin operations append records;
  privileged operators may inspect them in Supabase.
- **students/videos/content**: Policies are planned and do not apply until those tables are deployed.

The backend currently uses the Supabase service-role key, which bypasses RLS. FastAPI authorization
checks are therefore mandatory even when RLS is enabled.

---

## Seed Data

**Development seeds should include:**
- 1 admin user
- 2 consultant users
- 3 parent users (2 MapleBear, 1 TTA client)
- 3 students across programmes
- 5 sample videos with feedback
- 10 content items (mix of free and paid)
- 1 future paid-course entitlement for the TTA client
- 1 unused and 1 redeemed Course 2 access code (non-production fixtures only)

---

## Related Documentation

- [PRD Overview](../prd/overview.md)
- [API Documentation](../api/overview.md)
- [Architecture Overview](../architecture/overview.md)
