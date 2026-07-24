# Development Workflow

This guide describes the development workflow for the TTG Consulting Portal.

## Daily Development

### Starting Development

```bash
# Pull latest changes
git pull origin main

# Install / update dependencies (from repo root)
npm install                    # root: concurrently + run-script-os
cd frontend && npm install     # SPA dependencies
cd ../backend && pip install -e ".[dev]"   # with .venv activated

# Start full stack (repo root): Vite + Uvicorn
cd ..
npm run dev
```

Use **`npm run dev`** only in **`frontend/`** and **`uvicorn app.main:app --reload`** in **`backend/`** instead if you prefer two terminals (see [Setup Guide](./setup.md)).

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/STORY-123-description
   ```

2. **Write tests first** (TDD)
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests only when explicitly required

3. **Implement the feature**
   - Follow code conventions in CLAUDE.md
   - Keep changes focused and atomic

4. **Run tests and quality checks**

   ```bash
   cd frontend && npm run lint && npm run type-check
   cd ../backend && ruff check . && pyright && pytest -v
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

## Testing

### Unit Tests

```bash
# Backend (pytest)
cd backend && pytest -v

# Frontend (when Vitest is configured)
# cd frontend && npm test
```

### Integration Tests

```bash
cd backend && pytest -v
```

### E2E Tests

```bash
# Run E2E tests only when the project adds a runner (e.g. Playwright)
# TBD
```

## Code Quality

### Linting

```bash
cd frontend && npm run lint
cd ../backend && ruff check .
```

### Formatting

```bash
# Ruff can format Python when configured; frontend relies on ESLint + Prettier (if added)
```

### Type Checking

```bash
cd frontend && npm run type-check
cd ../backend && pyright
```

## Git Workflow

### Branch Naming

Follow the convention: `<type>/<story-id>-<description>`

**Types:**

- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

**Examples:**

- `feature/STORY-123-user-authentication`
- `fix/STORY-456-login-error`

### Commit Messages

Follow conventional commits format:

```
<type>(scope): subject line

Body explaining what and why.

Related to STORY-123
```

**The commit-messages skill automatically enforces this format.**

### Pull Requests

1. Push your branch
2. Open PR via GitHub or use `/commit` command
3. Link to Linear story
4. Wait for CI checks and code review
5. Merge when approved

## Linear Integration

### Starting Work

```bash
# Use /get-issue command to gather context
/get-issue STORY-123
```

### Branch → Story Mapping

- Branches are for STORIES, not tasks
- Commits can complete TASKS (with "Fixes TASK-X")
- Commits can do general story work (with "Related to STORY-X")

## Common Commands

### Development

```bash
npm run dev              # repo root: frontend + API
cd frontend && npm run dev
cd backend && uvicorn app.main:app --reload
```

### Database

```bash
supabase db push
# supabase migration new <name>  # when adding migrations
```

### Building

```bash
cd frontend && npm run build && npm run preview
```

---

**Last Updated**: 2026-04-05
