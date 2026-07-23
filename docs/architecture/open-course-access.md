# Open Course Access

**Last Updated**: 2026-07-24
**Status**: Implemented

## Context

Beyond Grades currently wants both existing courses to be free and directly accessible without
requiring users to create an account. The account system, access codes, entitlements, private
storage, and signed Mux playback should remain available for future paid courses.

This follows a common open-learning pattern: let learners reach course material first, then use
accounts for progress, administration, or future premium features.

## Current Policy

The backend setting `PUBLIC_COURSE_IDS` controls which courses are open without login or payment.

```env
PUBLIC_COURSE_IDS=course-1,course-2
```

The default is also set in `backend/app/config.py` as `course-1,course-2`.

## How Anonymous Access Works

Course 2 resources may still be stored as private/signed assets:

- PDFs can remain in the private Supabase `resources-paid` bucket.
- Mux videos can keep signed playback IDs.
- Catalog rows can still be marked with `access="paid"` for future paywall reuse.

Anonymous access is allowed by backend policy, not by making every underlying asset public.

The shared policy lives in `backend/app/services/course_access_policy.py`:

- `public_course_ids()` reads `PUBLIC_COURSE_IDS`.
- `is_public_course(course_id)` checks whether a course is open now.
- `is_public_resource(resource)` treats non-paid resources and resources in public courses as open.
- `can_user_access_resource(resource, user)` allows public resources, admins, or entitled users.

## Backend Changes

- `GET /api/v1/resources` accepts anonymous requests.
- Paid delivery metadata is still redacted for non-public courses when the requester lacks access.
- Signed Mux token endpoints accept anonymous requests but only mint tokens when policy allows.
- Private PDF URL/download endpoints accept anonymous requests but only serve resources when policy
  allows.
- Account-specific endpoints such as progress, settings data, admin, and entitlement redemption
  still require auth.

## Frontend Changes

- `/dashboard` no longer redirects anonymous visitors to `/auth/login`.
- Public navbar and marketing CTAs now point to `/dashboard`.
- Anonymous dashboard users see course navigation and a bottom-left `Sign in` button where account
  details normally appear.
- Account-only settings are hidden until sign-in.
- Public marketing copy no longer describes Course 2 as locked or premium.
- The login route remains available for the dashboard `Sign in` button and protected account flows.

## Restoring The Paywall Later

To make Course 2 paid again:

1. Set `PUBLIC_COURSE_IDS=course-1` in the backend environment.
2. Ensure Course 2 resources remain `access="paid"` and point to signed/private delivery assets.
3. Keep Mux Course 2 playback IDs signed, or remove any public playback IDs from the Mux assets.
4. Update public copy and CTAs to explain purchase or account redemption again.
5. Run the focused access tests:

```powershell
backend\.venv\Scripts\python -m pytest backend\tests\test_resources.py backend\tests\test_playback.py backend\tests\test_paid_storage.py
```

## Why Not Make All Mux Assets Public?

Mux supports both public and signed playback IDs. A public playback ID can be streamed by anyone
with the playback URL. A signed playback ID requires a JWT minted by the application server.

Keeping Course 2 videos signed while allowing them through `PUBLIC_COURSE_IDS` gives the portal a
reversible switch:

- Low learner friction today.
- No asset migration needed if Course 2 or a future course becomes paid again.
- Private/signed assets remain compatible with entitlement checks.

Making Mux assets public is simpler operationally, but it weakens reversibility because any shared
public playback URL remains directly usable until that playback ID is deleted.
