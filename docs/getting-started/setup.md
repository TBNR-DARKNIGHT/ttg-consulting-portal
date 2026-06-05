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
# Same as backend SUPABASE_URL. The SPA builds public object URLs as
# {VITE_SUPABASE_URL}/storage/v1/object/public/{bucket}/{path} for public buckets (dashboard PDFs, About page photos in public-assets, etc.).
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Optional: match backend MUX_PUBLIC_PLAYBACK_ID for Course 1 mock videos.
# VITE_MUX_PUBLIC_PLAYBACK_ID=
# Optional: match backend MUX_SEED_SIGNED_PLAYBACK_ID for paid Course 2 mock video res-009.
# VITE_MUX_SEED_SIGNED_PLAYBACK_ID=

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

Edit `.env` using [`backend/.env.example`](../../backend/.env.example) (Supabase, Clerk JWKS/issuer, `FRONTEND_URL`, **Mux signing keys** for paid video tokens, optional `MUX_SEED_SIGNED_PLAYBACK_ID`, etc.).

### 5. Database Setup

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# (Optional) Seed development data — when a seed script exists
# python scripts/seed.py
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
- Verify Clerk settings in **`backend/.env`** (`CLERK_JWKS_URL`, `CLERK_ISSUER`, etc.)
- Ensure the frontend publishable key matches the same Clerk application
- Check Clerk dashboard for correct allowed origins

### Supabase connection errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Ensure your IP is allowed in Supabase project settings
- Run `supabase db push` to ensure migrations are applied

### CORS errors in browser
- Verify `FRONTEND_URL` in **`backend/.env`** (e.g. `http://localhost:5173`)
- Ensure frontend `VITE_API_BASE_URL` points at the API (e.g. `http://localhost:8000/api/v1`)

### `net::ERR_CONNECTION_REFUSED` or `404` on `/api/v1/storage/public-url` (local)
- **`ERR_CONNECTION_REFUSED`**: `VITE_API_BASE_URL` host/port does not match a running API (root `npm run dev` starts uvicorn on **8000** by default; if you use `--port 8011`, set the env var to that port).
- **`404` on storage routes**: Another process may be bound to the port you think is FastAPI, or an old server is running. Confirm **`http://localhost:8000/docs`** lists **Storage** routes and **`GET /api/v1/health`** returns this app’s JSON.
- **Public bucket PDFs**: With **`VITE_SUPABASE_URL`** set, the dashboard resolves public file URLs in the browser (same URL shape as Supabase `getPublicUrl`), so opening a public PDF does not require a working `public-url` call. Paid PDFs still need the API (`paid-download`) and a valid JWT or dev bearer token.

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

**Last Updated**: 2026-05-01
