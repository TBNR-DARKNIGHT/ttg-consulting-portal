# Testing Strategy

## TTG Consulting Portal - Testing Approach

**Last Updated**: 2026-07-01
**Status**: Draft

---

## Overview

**Philosophy**: Test-Driven Development (TDD) — write tests before implementation.

**Frontend Testing**: TypeScript type-check, ESLint, production build, and manual acceptance tests.
Vitest/React Testing Library are planned but not currently configured.
**Backend Testing**: pytest + pytest-asyncio + httpx (AsyncClient via ASGITransport)

---

## Testing Pyramid

```
         /\
        /  \  10% E2E (Playwright, critical flows only)
       /    \
      /------\  20% Integration (API endpoints, DB queries)
     /        \
    /----------\  70% Unit (business logic, components, utils)
```

---

## Unit Tests (70%)

### Frontend (Vitest + React Testing Library)

**What to test:**
- Component rendering and interactions
- Custom hooks (useVideos, useContent, etc.)
- Utility functions and data transformations
- Form validation logic
- Permission/role checks

**File Location**: Co-located — `Button.tsx` -> `Button.test.tsx`

**Naming**:
```typescript
describe('VideoLibrary', () => {
  it('should display videos sorted by date', () => { })
  it('should show "Feedback pending" when no feedback exists', () => { })
})
```

### Backend (pytest)

**What to test:**
- Pydantic schema validation
- Service layer business logic
- Permission/role checking functions
- JWT validation logic
- Data transformation utilities
- Negative paths (404 for unknown routes, 405 for wrong HTTP methods)

**File Location**: `backend/tests/` (flat structure for now; split into `unit/` and `integration/` as the suite grows)

**Naming**:
```python
class TestCourseEntitlements:
    def test_free_user_cannot_access_paid_pdf(self): ...
    def test_redeemed_user_can_access_paid_pdf(self): ...
    def test_access_code_can_only_be_redeemed_once(self): ...
```

**Negative path pattern** — every router should include tests for:
- Unknown route under the prefix returns 404
- Wrong HTTP method on a known route returns 405

---

## Integration Tests (20%)

### Frontend

- TanStack Query hooks with mocked API responses (MSW)
- Route navigation and guards
- Clerk auth integration with mock provider

### Backend (pytest + httpx)

**What to test:**
- API endpoint request/response flows
- Auth dependency (valid JWT, invalid JWT, missing JWT, missing `sub` claim)
- JWKS fetch failures (timeout, malformed response)
- Database operations via Supabase client
- Clerk identity synchronization to `public.users`
- Entitlement listing and atomic access-code redemption
- Admin role enforcement plus access-code create/revoke/reissue and audit logging
- Public storage resource allowlisting and paid storage/Mux authorization
- Content access scoping (parent sees only own child's data)
- Video upload flow

**File Location**: `backend/tests/` (integration tests will move to `backend/tests/integration/` as suite grows)

**Example**:
```python
async def test_parent_can_only_see_own_childs_videos(client, parent_token, other_parent_token):
    # Parent A's child's videos visible to Parent A
    response = await client.get("/api/students/child-a/videos", headers=auth(parent_token))
    assert response.status_code == 200

    # Parent B cannot see Parent A's child's videos
    response = await client.get("/api/students/child-a/videos", headers=auth(other_parent_token))
    assert response.status_code == 403
```

---

## E2E Tests (10%)

**Framework**: Playwright (when explicitly requested)

**Critical flows to test:**
- Clerk sign-up/sign-in -> local user synchronization -> Course 1 dashboard
- Purchase code -> Account Settings redemption -> Course 2 unlock -> paid PDF/video
- Clerk admin sign-in -> `/auth/complete` -> `/admin` -> create/revoke/reissue code
- Free user and public storage routes cannot retrieve paid files
- Unauthenticated Mux manifest requests cannot play any paid asset; deleted public IDs remain unusable
- Login -> video library -> view feedback (MapleBear parent)
- Consultant upload -> parent sees new video + feedback
- Public DSA content browsing (no login)

**File Location**: `tests/e2e/`

**Run only when explicitly requested** — E2E tests are slow and expensive.

---

## Coverage Targets

| Area | Target |
|------|--------|
| Overall | 80% minimum |
| Auth/permissions | 100% |
| Business logic (services/) | 90% |
| API endpoints | 85% |
| UI components | 70% |

---

## Mocking Strategy

**Frontend:**
- MSW (Mock Service Worker) for API mocking
- Clerk test provider for auth state
- TanStack Query test wrapper

**Backend:**
- Supabase client mocked for unit tests
- Real Supabase instance for integration tests (test project)
- Clerk JWT mocked via test fixtures
- Environment variables set via `conftest.py` (`os.environ.setdefault`) before app import
- `ENVIRONMENT` set to `"testing"` in test configuration; health tests assert this value

---

## Test Commands

### Frontend
```bash
cd frontend
npm run type-check
npm run lint
npm run build
```

### Backend
```bash
cd backend
pytest                            # Run all tests
pytest tests/test_entitlements.py # Entitlement service/routes
pytest tests/test_user_sync.py    # Clerk user synchronization
pytest tests/test_paid_storage.py # Paid storage authorization
pytest tests/test_admin_auth.py   # ADMIN dependency enforcement
pytest tests/test_playback.py     # Paid signed-Mux authorization
pytest -k "test_name_pattern"     # Pattern match
```

### Manual paid-Mux security smoke test

For every paid `resources` video:

1. Confirm `mux_playback_id` is populated and `mux_playback_signed = true`.
2. Confirm the Mux asset has a signed playback ID and no public playback ID.
3. Request `https://stream.mux.com/<signed-id>.m3u8` without a token; it must not return `200`.
4. Confirm a user without the course entitlement receives `403` from
   `/api/v1/playback/mux-token`.
5. Confirm an entitled user receives a token and can play the video.
6. Probe every removed legacy public playback ID and confirm none returns `200`.

### E2E (when requested)
```bash
npx playwright test               # Run all E2E tests
npx playwright test --headed      # With browser visible
npx playwright test auth.spec.ts  # Specific test
```

---

## TDD Workflow

1. **Clarify requirements** — read acceptance criteria from PRD
2. **Write failing test(s)** — define expected behavior
3. **Write minimal code** — just enough to pass
4. **Run tests** — verify green
5. **Refactor** — improve while keeping tests green
6. **Repeat** — add edge cases

---

## CI/CD Integration

GitHub Actions pipeline runs on every PR:
1. Frontend: `npm run lint` -> `npm run type-check` -> `npm run build`
2. Backend: `ruff check` -> `pyright` -> `pytest`
3. Docker image build (verify it builds)
4. Block merge if any step fails

**Performance targets:**
- Unit tests: <30 seconds
- Integration tests: <2 minutes
- E2E tests: <10 minutes

---

## Related Documentation

- [Contributing Guidelines](../getting-started/contributing.md)
- [Development Workflow](../getting-started/development.md)
- [PRD Overview](../prd/overview.md)
