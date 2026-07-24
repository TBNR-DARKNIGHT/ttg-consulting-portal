# Setup Guide

## Prerequisites

**Required:**

- Node.js 20+ and npm
- Python 3.10+
- Docker and Docker Compose (optional; for containerised workflows when available)
- Git 2.40+
- Supabase CLI (`npm install -g supabase`)

**Accounts needed:**

- [Clerk](https://clerk.com) account (authentication)
- [Supabase](https://supabase.com) project (database + storage for PDFs and other files)
- [Mux](https://www.mux.com) account (course video hosting: transcoding, adaptive streaming, signed playback)

**Recommended:**

- VS Code with Python + TypeScript extensions
- Claude Code CLI

---

## Installation

### 1. Clone the Repository

```bash
git clone [repository-url]
cd ttg-consulting-portal
```

### 2. Root orchestration (one-command dev)

From the **repository root**, install the small dev-only toolchain used to run frontend and API together:

```bash
npm install
```

This installs **`concurrently`** and **`run-script-os`** only. It does not replace installing dependencies inside **`frontend/`**.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` (see [`frontend/.env.example`](../../frontend/.env.example)):

```bash
VITE_AUTH_MODE=
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
# Must include the /api/v1 suffix and match the port where uvicorn listens (8000 when using root `npm run dev` or default `uvicorn`).
VITE_API_BASE_URL=http://localhost:8000/api/v1
# Optional for unrelated direct public assets. Dashboard PDFs use VITE_API_BASE_URL and resource IDs.
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Optional: Mux Data environment key when required by your Mux project (often unset for defaults).
# VITE_MUX_ENV_KEY=
```

### 4. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Linux/Mac
# or: .venv\Scripts\Activate.ps1     # Windows PowerShell
pip install -e ".[dev]"
cp .env.example .env
```

Edit `.env` using [`backend/.env.example`](../../backend/.env.example) (Supabase, Clerk
JWKS/issuer/secret key, `FRONTEND_URL`, **Mux API token** for playback sync, **Mux signing keys**
for paid video tokens, etc.).

### 5. Database Setup

If your Supabase project **already has** a `resources` table, skip the migration step. The API reads catalog rows from that table when `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set.

**PDF storage layout** (objects in Supabase Storage, referenced by `bucket` + `file_path` on each PDF row):

| Course          | Bucket             | Object key prefix |
| --------------- | ------------------ | ----------------- |
| Course 1 (free) | `resources-public` | `course-1/...`    |
| Course 2 (paid) | `resources-paid`   | `course-2/...`    |

Example PDF row: `bucket = resources-public`, `file_path = course-1/pdf/your-file.pdf`.

**Videos** use Mux (not Storage buckets). After uploading to Mux with **Passthrough** = resource id, sync playback IDs:

```bash
cd backend && python -m app.scripts.sync_mux
```

#### Convert an existing paid Mux asset to signed playback

Use this order to minimize interruption:

1. Deploy the backend/frontend signed-playback implementation and configure
   `MUX_SIGNING_KEY_ID` plus `MUX_SIGNING_PRIVATE_KEY` on the backend host.
2. In Mux **Video → Assets**, open the paid asset and add a playback ID with policy **Signed**.
   Do not delete the public ID yet.
3. Either run `python -m app.scripts.sync_mux` with Mux API credentials configured, or update the
   matching Supabase `resources` row manually:
   `mux_asset_id = <asset id>`, `mux_playback_id = <new signed id>`, and
   `mux_playback_signed = true`.
4. Sign in as a user with the matching course entitlement and confirm the application can play the
   video through `GET /api/v1/playback/mux-token`.
5. Request `https://stream.mux.com/<signed-id>.m3u8` without a token and confirm it does not return a
   playable `200` response.
6. Delete every **Public** playback ID from the paid Mux asset. Adding a signed ID alone is not
   sufficient because one asset may have several playback IDs.
7. Probe each deleted public ID and confirm it no longer returns `200`.

For new paid assets, create only a signed playback ID. Public preview assets intentionally retain a
public policy and must use separate Mux assets/playback IDs from full paid videos.

Portal course previews on `/portal` are Supabase video rows whose titles start with `[PREV] TTA H DSA`; `GET /api/v1/portal/course-previews` (no auth) returns the first three with public Mux playback IDs.

**Fresh projects only** — apply the reference migration if the `resources` table does not exist yet:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Optional: only when the table is missing
supabase db push
```

### 6. Start Development

**Option A: Single command (recommended)**

From the **repository root** (with `frontend` deps installed and `backend/.venv` + editable install done):

```bash
npm run dev
```

This runs **Vite** (`frontend`) and **Uvicorn** (`backend`, `app.main:app --reload`) in parallel. **`run-script-os`** picks the correct Python under **`backend/.venv`** on Windows vs macOS/Linux.

**Option B: Two terminals**

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend (from backend/, venv activated)
cd backend && uvicorn app.main:app --reload
```

**Option C: Docker Compose**

When a Compose file is available in the repo:

```bash
docker compose up
```

### 7. Verify Installation

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs (Swagger UI)
- Health check: http://localhost:8000/api/v1/health

---

## Troubleshooting

### Clerk JWT validation failing

- Verify Clerk settings in **`backend/.env`** (`CLERK_JWKS_URL`, `CLERK_ISSUER`, `CLERK_SECRET_KEY`, etc.)
- Ensure the frontend publishable key matches the same Clerk application
- Check Clerk dashboard for correct allowed origins
- A `503 User profile unavailable` means JWT validation succeeded but Clerk profile lookup or
  synchronization to `public.users` failed

### Supabase connection errors

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Ensure your IP is allowed in Supabase project settings
- Run `supabase db push` to ensure migrations are applied

### CORS errors in browser

- Verify `FRONTEND_URL` in **`backend/.env`** (e.g. `http://localhost:5173`)
- Ensure frontend `VITE_API_BASE_URL` points at the API (e.g. `http://localhost:8000/api/v1`)

### `net::ERR_CONNECTION_REFUSED`, `404`, or `422` on storage routes (local)

- **`ERR_CONNECTION_REFUSED`**: `VITE_API_BASE_URL` host/port does not match a running API (root `npm run dev` starts uvicorn on **8000** by default; if you use `--port 8011`, set the env var to that port).
- **`404` on storage routes**: Another process may be bound to the port you think is FastAPI, or an old server is running. Confirm **`http://localhost:8000/docs`** lists **Storage** routes and **`GET /api/v1/health`** returns this app’s JSON.
- **Storage parameters**: Dashboard storage routes accept `resource_id`, not `bucket` or `path`.
  A legacy bucket/path request returns `422`. The backend resolves and allowlists the catalog
  location; paid PDFs additionally require a Clerk JWT and matching course entitlement.

### Create and test a Course 2 access code

```powershell
cd backend
.venv\Scripts\python.exe -m app.scripts.create_access_code --order-id TEST-ORDER-001
```

The script stores only the SHA-256 hash and prints the transferable plaintext code once. Sign in
with Clerk, open **Dashboard → Account Settings → Course access**, and redeem the code. Confirm
`access_codes.redeemed_at` and `redeemed_by_user_id` are populated and an active
`course_entitlements` row exists for Course 2.

For production, set the synchronized user's `public.users.role` to uppercase `ADMIN`, sign in, and
use `/admin` to create, revoke, or reissue codes. Revoke/reissue requires a reason and applies only
to active, unredeemed codes. The plaintext replacement is shown once. Audit entries can be viewed
in Supabase `admin_audit_log`; see [`supabase/README.md`](../../supabase/README.md).

### Root `npm run dev` fails on the API process

- Confirm **`backend/.venv`** exists and **`pip install -e ".[dev]"`** was run inside that venv
- On Windows, default npm script shell is **cmd**; if you override **`script-shell`** to older PowerShell, `cd backend && …` may fail — use the default or Option B

---

## Next Steps

- Read the [Development Guide](./development.md)
- Review [Contributing Guidelines](./contributing.md)
- Check the [Architecture Overview](../architecture/overview.md)
- Review the [PRD](../prd/overview.md) for feature requirements

---

**Last Updated**: 2026-07-01
