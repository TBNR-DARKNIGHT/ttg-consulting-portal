# Open Course Access Change Log

**Date**: 2026-07-24
**Reason**: Reduce friction by making both existing Beyond Grades courses free and accessible
without account creation, while preserving account, entitlement, access-code, and paywall
infrastructure for future courses.

## Product Decision

- Course 1 and Course 2 are currently free.
- Users can access the dashboard and course content without logging in.
- Login is still available from the dashboard account area.
- Account-specific functions remain protected.
- Future paid courses can reuse the existing entitlement and access-code flow.

## Backend Changes

- Added `PUBLIC_COURSE_IDS`, defaulting to `course-1,course-2`.
- Added `backend/app/services/course_access_policy.py` as the single policy layer for public
  course access and future entitlement checks.
- Added optional auth dependency `get_optional_current_user`.
- Updated resource listing so anonymous users can fetch catalog metadata.
- Updated signed Mux playback token routes so anonymous users can access signed videos when the
  resource belongs to a public course.
- Updated private PDF URL/download routes so anonymous users can access private-bucket PDFs when
  the resource belongs to a public course.
- Kept admin, progress, current-user, settings data, and access-code redemption auth-protected.

## Frontend Changes

- Removed the dashboard-level login redirect.
- Added a dashboard bottom-left `Sign in` button for anonymous users.
- Hid account-only settings until sign-in.
- Updated entitlement defaults so Course 1 and Course 2 are considered available.
- Updated dashboard course cards to show both courses as open courses.
- Updated public navbar and marketing CTAs to point to `/dashboard` instead of auth routes.
- Updated portal and landing page copy to remove current-course paywall/signup language.
- Kept reusable locked-course UI and purchase/access-code settings for future paid courses.

## Documentation Changes

- Added `PUBLIC_COURSE_IDS` to backend env examples.
- Added `docs/architecture/open-course-access.md`.
- Linked the new access policy doc from `docs/README.md`.
- Updated architecture and data model docs to explain current public-course access and future
  entitlement gating.

## Verification

Run these after changes to the public-course policy:

```powershell
backend\.venv\Scripts\python -m pytest backend\tests\test_resources.py backend\tests\test_playback.py backend\tests\test_paid_storage.py
cd frontend
npm run type-check
npm run lint
```

The focused access tests confirm:

- Anonymous users can list resources.
- Currently public courses can use signed/private delivery through backend policy.
- Future non-public paid courses still deny access without entitlement.
- Admin and entitled users still get access to non-public paid resources.
