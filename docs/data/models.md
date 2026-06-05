# Data Models

## TTG Consulting Portal - Data Schema

**Last Updated**: 2026-03-22
**Status**: Draft

---

## Overview

**Database**: PostgreSQL (via Supabase)
**ORM/Client**: Supabase Python client (backend), Supabase JS client (frontend, optional)
**Auth**: Clerk (user identity managed externally, synced to local DB)

---

## Entity Relationship Diagram

```
User 1:N Students (as parent)
User 1:N Students (as consultant)
Student 1:N Videos
User 1:N Videos (as uploader/consultant)
Content (standalone, access controlled)
User N:M Content (via UserContentAccess)
```

---

## Core Models

### User

Represents parents, clients, consultants, and administrators. Identity managed by Clerk, profile synced to Supabase.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,                              -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PARENT', 'CLIENT', 'CONSULTANT', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
    CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

**Roles:**
- `PARENT` — MapleBear parent (self-registered)
- `CLIENT` — TTA consulting client (admin-provisioned)
- `CONSULTANT` — Teacher/consultant uploading content
- `ADMIN` — System administrator

---

### Student

Represents a child enrolled in a MapleBear programme.

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

Represents a student recording uploaded by a consultant.

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

### Content

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

### UserContentAccess

Junction table granting users access to paid content (admin-provisioned).

```sql
CREATE TABLE user_content_access (
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL REFERENCES content(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by_id UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (user_id, content_id)
);

CREATE INDEX idx_uca_user ON user_content_access(user_id);
CREATE INDEX idx_uca_content ON user_content_access(content_id);
```

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `resources-public` | Dashboard **PDFs** and other public course files | Public read URL in browser when bucket is public |
| `resources-paid` | Dashboard **paid PDFs** (private bucket) | Clerk JWT + API (`paid-url` / `paid-download`) |
| `student-videos` | MapleBear student recordings | Signed URLs, consultant upload, parent read |
| `public-assets` | Marketing / About page images | Public read |

**Course videos (DSA / interview modules)** use **Mux Video**, not Supabase object storage: the catalog stores a **Mux playback ID** and whether playback is **public** or **signed** (JWT minted by `GET /api/v1/playback/mux-token`). In the demo catalog, **public** IDs apply to **Course 1** topics only; the optional paid **Course 2** video uses a **signed** ID. See [API overview](../api/overview.md) and [Mux secure playback](https://www.mux.com/docs/guides/secure-video-playback).

---

## Row Level Security (RLS) Policies

- **users**: Users can read own profile. Admins can read/write all.
- **students**: Parents see own children. Consultants see assigned students. Admins see all.
- **videos**: Parents see own child's videos. Consultants see videos for assigned students. Admins see all.
- **content**: Public content readable by all. Paid content readable only by users with `user_content_access` record.
- **user_content_access**: Admins can grant/revoke. Users can read own access records.

---

## Seed Data

**Development seeds should include:**
- 1 admin user
- 2 consultant users
- 3 parent users (2 MapleBear, 1 TTA client)
- 3 students across programmes
- 5 sample videos with feedback
- 10 content items (mix of free and paid)
- Access grants for the TTA client

---

## Related Documentation

- [PRD Overview](../prd/overview.md)
- [API Documentation](../api/overview.md)
- [Architecture Overview](../architecture/overview.md)
