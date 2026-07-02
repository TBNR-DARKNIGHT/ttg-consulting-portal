# TTG Consulting Portal — Backend

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

3. Copy and fill in environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run the dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Verify:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

## Testing

```bash
pytest -v
```

## Linting & Type Checking

```bash
ruff check .
pyright
```

## Project structure

- `app/routers/` owns authenticated HTTP endpoints.
- `app/services/` owns Supabase, Mux, and resource-upload workflows.
- `app/models/` owns request and response schemas.
- `app/scripts/` is reserved for small operational entry points that call services, such as
  `python -m app.scripts.sync_mux`; it must not contain a second application or its own credentials.

The admin resource uploader is part of the web application:

- `app/routers/admin.py` exposes the admin-only endpoints.
- `app/services/admin_resource_uploads.py` validates metadata and coordinates Supabase/Mux.
- All credentials come from the backend `.env` through `app.config.settings`.

The upload form can introduce new course and topic slugs. New courses default to paid Supabase
storage and signed Mux playback; this prevents newly introduced content from becoming public by
accident.

`pyproject.toml` is the dependency source of truth. `requirements.txt` installs that project for
deployment environments that expect a requirements file.
