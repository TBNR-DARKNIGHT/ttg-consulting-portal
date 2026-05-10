# PRD: Think Teach Group Consulting Portal MVP

**Version**: 1.7.0
**Component**: Full-stack
**Status**: In Development
**Last Updated**: 2026-05-10
**Related**: [@docs/architecture/overview.md](../architecture/overview.md), [@docs/data/models.md](../data/models.md)

---

## 1. Overview

### What & Why

The Think Teach Group Consulting Portal is a unified, membership-style platform housing all consulting services across Think Teach Academy (TTA), MapleBear Collaboration Programmes, and Macro Academy. It serves as both a service delivery and resource marketplace, enabling parents to access programme content, track student progress, and purchase low-cost digital consulting materials.

The education consulting market lacks centralized platforms combining service delivery, resource access, and parent engagement. Parents and students currently interact through fragmented touchpoints across multiple Think Teach Group entities.

### Scope

- **In scope (MVP)**:
  - Phase 1: TTA Consulting Portal (auth, content dashboard, landing page, admin provisioning)
  - Phase 2: MapleBear Parent Experience (video library, consultant feedback, upload interface)
  - Phase 3: DSA Resource Portal (free content hub, paid resource purchase flow)
- **Out of scope**:
  - Macro Base Camp / University Consulting portals
  - Automated payment integration (manual grants in MVP)
  - Multi-tier resource packages
  - Individual student consulting portals with personalized dashboards
  - Progress tracking with milestones/metrics
  - Subscription tiers / full membership platform

### Living Document

This PRD is a living document that will evolve during development:
- Update as requirements are refined
- Document learnings from implementation
- Track scope changes with justification
- Version with dates when major changes occur

### Non-Functional Requirements

- **Performance**: Screen transitions <2s, API responses <500ms
- **Security**: PII encrypted in transit (HTTPS) and at rest. Clerk JWT validation on all protected routes. Authorization may be delegated to EdXP-Users (service-to-service `/authorize`) once configured.
- **Development demos**: The SPA may run a **frontend-only mock auth** path in local development (`VITE_AUTH_MODE=mock`) with static fixture data and **no** Clerk session; production builds **reject** `mock` (enforced at app init). **Hosted UI previews** without Clerk may use **`VITE_AUTH_MODE=public`** (e.g. temporary Vercel deploys): same demo auth and fixture data as mock, explicitly labelled in the UI; **not** a substitute for Clerk for real users, staging acceptance, or security review parity
- **Backend dev diagnostics (development only)**: The API may expose dev-only endpoints to validate Supabase Storage connectivity (public vs paid buckets) and may enable a dev-only bearer token auth bypass for local testing. These must not be enabled in staging/production.
- **Backend dev authorization diagnostics (development only)**: The API may expose a dev-only endpoint to exercise EdXP-Users authorization wiring (Clerk subject -> EdXP service token -> `/authorize`). This endpoint must not be enabled in staging/production.
- **Accessibility**: WCAG 2.1 AA minimum
- **Scalability**: Support 1,000+ concurrent users, horizontal scaling capability
- **Platform**: Responsive web application optimized for mobile and desktop browsers

---

## 2. User Stories

### Phase 1: TTA Consulting Portal

**US-1.1: First-Time Visitor & Paywall**
**As a** parent visiting the portal
**I want** to see the portal's value proposition and available resources
**So that** I understand what's offered before purchasing access

**US-1.2: Post-Purchase Account Provisioning**
**As a** TTA admin
**I want** to provision portal access after a purchase is confirmed in TTA Shop
**So that** only paying customers can access premium content

**US-1.3: First Login After Purchase**
**As a** newly provisioned client
**I want** to log in using the credentials I received by email
**So that** I can access the DSA content I purchased

**US-1.4: Returning User Login**
**As a** returning client
**I want** to sign in quickly and be taken directly to my content
**So that** I can pick up where I left off without friction

### Phase 2: MapleBear Parent Experience

**US-2.1: Parent Account Creation**
**As a** MapleBear parent
**I want** to create a secure account with my email and password
**So that** I can access my child's programme portal securely

**US-2.2: Parent Login**
**As a** returning MapleBear parent
**I want** to log in quickly using my credentials
**So that** I can access my child's recordings and progress without hassle

**US-2.3: View Child's Video Library**
**As a** MapleBear parent
**I want** to see all my child's public speaking recordings organized by date
**So that** I can track their improvement over time

**US-2.4: View Consultant Feedback**
**As a** MapleBear parent
**I want** to read qualitative feedback from my child's teacher for each session
**So that** I understand what they're working on and how they're progressing

**US-2.5: Upload Student Recording**
**As a** consultant/teacher
**I want** to upload video recordings for individual students quickly
**So that** parents can access their child's class recordings without delay

**US-2.6: Add and Edit Feedback**
**As a** consultant/teacher
**I want** to add qualitative feedback to each student recording
**So that** parents understand their child's progress and areas for improvement

### Phase 3: DSA Resource Portal

**US-3.1: Browse Free DSA Content**
**As a** parent researching DSA
**I want** to access informational videos and articles without creating an account
**So that** I can learn about the process before investing in paid resources

**US-3.2: Purchase Resource Access**
**As a** parent interested in DSA resources
**I want** to purchase access to the paid resource library through TTA Shop
**So that** I can access premium interview preparation materials

**US-3.3: Access Paid Resources**
**As a** parent who purchased resource access
**I want** to log in and access my purchased materials
**So that** I can begin preparing my child for DSA interviews

---

## 3. Acceptance Criteria (Gherkin)

### Scenario: Returning User Login (US-1.4)
```gherkin
Given a provisioned user with valid credentials
When they enter their email and password on the Auth Page
Then Clerk authenticates the user
And FastAPI validates the session token
And the user is redirected to the Content Dashboard
```

### Scenario: Failed Login
```gherkin
Given a user with incorrect credentials
When they attempt to log in
Then a clear error message is displayed ("Incorrect email or password")
And the user remains on the Auth Page
And a "Forgot Password" link is available triggering Clerk's reset flow
```

### Scenario: First Login Password Change (US-1.3)
```gherkin
Given a newly provisioned client logging in for the first time
When they authenticate successfully
Then they are prompted to change their password
And after changing, they are redirected to the Content Dashboard
And their session persists for 7 days unless they log out
```

### Scenario: Admin Provisions Access (US-1.2)
```gherkin
Given a purchase is confirmed in TTA Shop
When the admin receives the purchase notification
Then the admin creates the user account via Clerk admin panel
And the new user receives an email with login credentials and portal link
And the user cannot access content until provisioning is complete
```

### Scenario: Parent Views Video Library (US-2.3)
```gherkin
Given a logged-in MapleBear parent
When they navigate to their child's video library
Then they see recordings organized by date
And each entry shows: date recorded, session title/topic, video duration
And videos play directly in-browser without download
And they can only see videos for their own child
```

### Scenario: Consultant Uploads Recording (US-2.5)
```gherkin
Given a logged-in consultant on the student management dashboard
When they select a student and upload a video file
And they fill in required fields (session date, session title/topic)
Then a success confirmation is shown
And the video is immediately available in the parent's library
```

### Scenario: Browse Free DSA Content (US-3.1)
```gherkin
Given a visitor on the public DSA homepage
When they browse the free content library
Then they see DSA overview videos, webinar clips, and general DSA information
And content is organized by topic (pathways, interview prep, timelines)
And a clear CTA "Access Premium DSA Resources" is visible
And no login is required
```

### Scenario: Phase 1 dashboard — course resources and in-app PDF (US-1.4)
```gherkin
Given a logged-in TTA client on the Content Dashboard
When they expand Course 2 in the sidebar and open Resources
Then they see PDFs and materials for that course
When they choose View on a PDF that has a storage path
Then they navigate to the resource detail route
And the PDF is shown in the in-app viewer without requiring a separate-tab open action
And Back returns them to the correct course Resources list
```

---

## 4. Functional Requirements

### Core Behavior

**Authentication**: Clerk handles all auth (sign-up, sign-in, password reset, session management). No self-serve sign-up for TTA consulting portal — accounts are admin-provisioned only. MapleBear parents can self-register.

**Local demo / UX prototyping**: For stakeholder walkthroughs without Clerk or a running API, the React app supports **`VITE_AUTH_MODE=mock`** (development builds only): in-memory “sign in”, shared `usePortalAuth()` abstraction, and static resource/progress fixtures (no FastAPI calls). **`VITE_AUTH_MODE=public`** enables the **same** demo behaviour in **production builds** (e.g. static hosting on Vercel when Clerk is not configured yet); copy must state preview-only, no real accounts. Neither `mock` nor `public` replaces Clerk for staging acceptance, production users, or security review parity with Clerk.

**Content Access**: Strictly scoped — users only see content their account is provisioned for. Videos play in-browser. PDFs and downloadable materials open in an **in-app resource detail view** (embedded viewer), not a separate browser tab by default. Resources remain accessible indefinitely (one-time purchase, lifetime access).

**Paid file storage (Supabase)**: The `resources-paid` bucket remains **private** (not a public bucket). Authenticated users access objects only via backend endpoints (`/api/v1/storage/paid-download`, `/api/v1/storage/paid-url`) that validate **Clerk JWT** and use the **Supabase service role** server-side. Production deployments should configure `SUPABASE_SERVICE_KEY` and Clerk; the API may log a warning at startup if required keys are missing outside development.

**Payment**: All payments processed through existing TTA Shop infrastructure. Portal does not handle payment directly.

### States & Transitions

| State | Description | Transitions To |
|-------|-------------|----------------|
| Visitor | Unauthenticated user browsing public pages | Registered (MapleBear self-serve) or Provisioned (admin) |
| Registered | MapleBear parent with unverified email | Active (after email verification) |
| Provisioned | TTA client account created by admin | Active (after first login + password change) |
| Active | Authenticated user with valid session | Logged Out, Suspended |
| Logged Out | Session expired or user logged out | Active (re-login) |

### Business Rules

1. TTA consulting accounts are admin-provisioned only — no self-serve registration
2. MapleBear parent accounts support self-registration with email verification
3. Sessions persist for 7 days unless user explicitly logs out
4. Password requirements: minimum 8 characters, at least one number and one letter
5. Email verification required before account activation
6. Parents can only access videos for their own child (strict access control)
7. Consultant feedback is read-only for parents, editable by consultants
8. Feedback text field supports up to 500 characters
9. Admin grants access within 24 hours of purchase during business days
10. Paid resources have lifetime access (one-time purchase)

### Permissions

| Role | Capabilities |
|------|-------------|
| **Visitor** | Browse public pages, view free DSA content |
| **MapleBear Parent** | View own child's video library and feedback |
| **TTA Client** | Access purchased DSA content and resources |
| **Consultant/Teacher** | Upload videos, add/edit feedback for assigned students |
| **Admin** | Provision accounts, manage users, manage all content |

---

## 5. Technical Specification

### Architecture Pattern

Decoupled frontend (React SPA) + backend API (FastAPI) with Supabase for database/storage and Clerk for authentication.

**Rationale**: Separation of frontend/backend allows independent scaling and deployment. FastAPI provides fast Python API development with automatic OpenAPI docs. Clerk offloads auth complexity. Supabase provides managed PostgreSQL + storage.

### Technology Stack

**Frontend:**
- React 19.1 + TypeScript 5.7
- Vite 6.x (SWC bundler via @vitejs/plugin-react-swc)
- TanStack Router 1.114+ (file-based routing via @tanstack/router-plugin)
- TanStack Query 5.75+ (server state, stale-while-revalidate)
- shadcn/ui (new-york) + Tailwind CSS 4.1
- ESLint 9 (flat config) with typescript-eslint, react-hooks, react-refresh plugins

**Backend:**
- FastAPI (Python >=3.10)
- Supabase (PostgreSQL database + file storage)
- Clerk JWT validation on all protected endpoints

**Auth:** Clerk (sign-up, sign-in, user management, JWT)

**Frontend authentication modes (implemented shell):**

| Mode | Configuration | Runtime behaviour |
|------|---------------|-------------------|
| **Clerk (default)** | `VITE_AUTH_MODE` unset, or any value other than `mock` / `public` (after normalisation); `VITE_CLERK_PUBLISHABLE_KEY` required | `ClerkProvider` plus a thin bridge into a shared portal auth context; `getToken()` supplies JWT for `apiFetch` |
| **Mock (local demo)** | `VITE_AUTH_MODE=mock` (case-insensitive); **rejected** in production builds (`import.meta.env.PROD`) | `MockAuthProvider` only; demo action on `/auth/login`; `/dashboard` shows static lists; fixture data when API base URL is unset or mode is mock |
| **Public (hosted preview)** | `VITE_AUTH_MODE=public` (case-insensitive); **allowed** in production builds | Same as mock for auth and fixture data; login UI labelled as preview; use for temporary static hosts (e.g. Vercel) **without** Clerk |

**SPA routes (Phase 1 shell):** `/` (landing), `/auth/login` (Clerk embedded sign-in or demo flow for mock/public), `/auth/sign-up` (Clerk only; in mock/public redirect to login), `/dashboard` (post-login shell; redirects to login if unauthenticated). **Authenticated dashboard routes** include: `/dashboard` (progress overview), `/dashboard/course/{courseId}/resources` and `/dashboard/course/{courseId}/videos` (course-scoped lists), `/dashboard/resources/{resourceId}` (in-app PDF/detail view), `/dashboard/settings`; legacy `/dashboard/resources` (no id) redirects to a default course resources list. Parent `/dashboard/resources` renders an **outlet** so `/dashboard/resources/{resourceId}` is reachable (child detail route must not be shadowed by a blanket redirect).

**Client data loading:** TanStack Query keys for resources and progress include a **`mock` vs `live`** segment so switching fixture vs API source during development does not reuse stale cached rows.

**Deployment:**
- **Frontend (optional / temporary)**: Static SPA on **Vercel** — set project **Root Directory** to `frontend`, output `dist`, `npm run build`; `frontend/vercel.json` rewrites all paths to `index.html` for TanStack Router; `package.json` **`engines.node`** should satisfy toolchain requirements; set env vars in Vercel (see [Deployment & Environments](../deployment/environments.md)). **`VITE_*` variables are inlined at build time** — redeploy after changing them.
- **Backend (Vercel Functions)**: Deploy FastAPI as a **separate Vercel project** with **Root Directory** set to `backend/`. The backend project exposes an ASGI entrypoint at `backend/api/index.py` and uses `backend/vercel.json` to route requests into the function. Configure backend env vars in Vercel (Preview + Production): `ENVIRONMENT=production`, `FRONTEND_URL=<SPA origin>`, optional `FRONTEND_URL_REGEX=<preview origin regex>`, plus Supabase/Clerk secrets. When using `FRONTEND_URL_REGEX`, keep it **anchored and project-scoped** (do not allow arbitrary `*.vercel.app`), especially if credentialed requests are enabled.
- Docker images pushed to GitHub Container Registry (GHCR)
- GitHub Actions CI/CD (lint, type-check via Pyright/tsc, tests, image build)

### Local development (full-stack bootstrap)

- The **repository root** includes a private **`package.json`** for orchestration only (not a publishable package).
- **`npm install`** at the root installs dev tooling (**`concurrently`**, **`run-script-os`**). The SPA still has its own dependencies under **`frontend/`** (`npm install` there, or rely on an existing `frontend/node_modules`).
- **`npm run dev`** from the root starts **both** processes: **Vite** in `frontend/` and **Uvicorn** for **`app.main:app`** with **`--reload`**, with working directory **`backend/`** so the `app` package resolves.
- The API process uses Python from **`backend/.venv`**: **`run-script-os`** selects **`Scripts\python.exe`** on Windows and **`bin/python`** on macOS/Linux.
- **Prerequisites** before `npm run dev`: create **`backend/.venv`**, run **`pip install -e ".[dev]"`** from `backend/`, configure **`frontend/.env.local`** and **`backend/.env`** per each folder’s **`.env.example`**. Developers may still run **`npm run dev`** only in `frontend/` and **`uvicorn app.main:app --reload`** only in `backend/` if they prefer two terminals.
- For local development, the backend may load configuration from **`backend/.env.local`** (preferred) with **`backend/.env`** as a fallback.

### API Endpoints (Phase 1 — TTA Consulting)

#### `POST /api/auth/validate`
**Purpose**: Validate Clerk JWT and return user profile

**Request**: Clerk JWT in Authorization header

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "email": "string",
  "role": "CLIENT | CONSULTANT | ADMIN",
  "first_name": "string",
  "provisioned_content": ["content-id-1", "content-id-2"]
}
```

**Errors**:
- `401`: Invalid or expired token
- `403`: Account not provisioned

#### `GET /api/content`
**Purpose**: List content available to authenticated user

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "type": "video | article | download",
      "topic": "dsa-pathways | interview-prep | timelines",
      "completion_status": "not_started | in_progress | completed",
      "thumbnail_url": "string",
      "duration_seconds": 120
    }
  ]
}
```

#### `GET /api/students/{student_id}/videos`
**Purpose**: Get video library for a specific student (MapleBear)

#### `POST /api/students/{student_id}/videos`
**Purpose**: Upload a video recording for a student (consultant only)

#### `PUT /api/videos/{video_id}/feedback`
**Purpose**: Add or update feedback on a video (consultant only)

### Data Models

```typescript
interface User {
  id: string;                    // UUID (Clerk user ID)
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARENT' | 'CLIENT' | 'CONSULTANT' | 'ADMIN';
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;             // ISO8601
  updatedAt: string;
}

interface Student {
  id: string;                    // UUID
  firstName: string;
  lastName: string;
  programme: 'MAPLEBEAR_SC' | 'MAPLEBEAR_YE';
  parentId: string;              // FK to User
  consultantId: string;          // FK to User
  createdAt: string;
}

interface Video {
  id: string;                    // UUID
  studentId: string;             // FK to Student
  title: string;
  sessionDate: string;           // ISO8601
  fileUrl: string;               // Supabase Storage URL
  durationSeconds: number;
  feedback: string | null;       // Max 500 chars, editable by consultant
  uploadedById: string;          // FK to User (consultant)
  createdAt: string;
}

interface Content {
  id: string;                    // UUID
  title: string;
  type: 'video' | 'article' | 'download';
  topic: 'dsa-pathways' | 'interview-prep' | 'timelines';
  fileUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  isPublic: boolean;             // Free vs paid
  createdAt: string;
}

interface UserContentAccess {
  userId: string;                // FK to User
  contentId: string;             // FK to Content
  grantedAt: string;
  grantedById: string;           // FK to User (admin)
}
```

---

## 6. Integration Points

### Dependencies

- **Internal**: TTA Shop (payment processing, purchase confirmation)
- **External**: Clerk (authentication, user management), Supabase (database, file storage), EdXP-Users (authorization/permissions)
- **Libraries**:
  - Frontend: React 19.1, TanStack Router 1.114+, TanStack Query 5.75+, shadcn/ui, Tailwind CSS 4.1, ESLint 9
  - Backend: FastAPI, Supabase Python client, PyJWT (Clerk validation)

### Events/Webhooks

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| Purchase confirmed | TTA Shop payment success | Order details, customer email | Admin notification |
| Account provisioned | Admin creates Clerk user | User ID, email, role | Welcome email with credentials |
| Video uploaded | Consultant uploads recording | Video ID, student ID | Parent notification (future) |

---

## 7. UX Specifications

### Key Pages

**1. Landing & Promotional Home Page** (public)
- Publicly accessible, no login required
- Primary CTA with clear links to services
- Displays all visible products clearly
- Fully responsive on desktop and mobile
- Emphatic social proof + conversion layout sections:
  - Community Q&A: horizontally scrolling Q&A cards with answer previews and “Join Free” CTA
  - Students/Parents social proof: dark navy full-width “Join Over 555,000…” centered CTA
  - Final features + CTA: split layout with feature rows and “Start Your Free Trial” button
  - Multi-column footer: resources/platform/company/contact + social links; privacy/terms in bottom row

**2. Auth Page** (single entry point)
- Email + password fields
- "Sign In" primary CTA
- "Forgot Password" secondary link
- No self-serve sign-up option (admin-only account creation for TTA)
- TTA/consulting portal branding
- Responsive across desktop and mobile
- **Mock / public demo only**: a labelled prototype control (e.g. “Continue as test parent”) replaces real credentials; copy must state no real session (local **Demo mode** vs hosted **Preview** per `VITE_AUTH_MODE`)

**3. Content Dashboard** (authenticated)
- Personalized greeting ("Welcome back, [First Name]")
- **Dashboard home**: Progress summary per course (e.g. completion counts / bars), not a duplicate course library
- **Sidebar (desktop) / sheet (mobile)**: Primary navigation with **Dashboard**, expandable **Course 1** and **Course 2** sections (accordion), each offering **Resources** (PDFs and other file-backed materials for that course) and **Video**; **Account Settings**; **Logout** pinned to the bottom of the column
- Course **Resources** and **Video** lists are filtered by course topic mapping (e.g. Course 1: pathways + timelines; Course 2: interview preparation)
- Each list item shows: title, type, topic label, description preview, completion status where applicable
- **PDFs**: Open via `/dashboard/resources/{resourceId}` with an in-app embedded viewer (public bucket URLs or paid streaming via API); no primary CTA to open PDFs in a new tab
- Videos: listed under the course Video tab; playback UX as implemented (in-browser when a playable URL exists)
- Access scoped to provisioned content only (Phase 1 demo catalog may treat signed-in users as having access to paid materials for UX testing)

**4. MapleBear Parent Dashboard** (authenticated)
- Child's name and programme displayed
- Video library with all recordings
- Each entry: date, session title/topic, duration
- In-browser video playback
- Consultant feedback below each video (or "Feedback pending")

**5. Consultant Dashboard** (authenticated)
- Student management view showing all assigned students
- Upload interface with student dropdown
- Required fields: session date, session title/topic
- Feedback text field (500 char limit) — add during upload or edit later

### Key UI States

1. **Loading**: Skeleton loaders matching content layout
2. **Empty**: "No content available yet" with helpful context
3. **Error**: User-friendly message + retry action
4. **Success**: Confirmation toast for uploads and actions

### Responsive Behavior
- **Desktop**: Full sidebar navigation, multi-column content grid
- **Mobile**: Top bar with **hamburger** opening a **sheet** that mirrors sidebar links (including course accordions and logout at bottom), single-column content stack, touch-optimized video player when applicable

---

## 8. Implementation Guidance

### Recommended Approach

1. ~~**Scaffold frontend + backend**: Vite React app + FastAPI project with Docker setup~~ **Done** — Frontend scaffold complete (Vite, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, typed API client, static mock data layer, ESLint). **Done** — Portal auth abstraction (`usePortalAuth`), `VITE_AUTH_MODE=mock` demo path (dev-only), routes `/auth/login`, `/auth/sign-up`, `/dashboard`, navbar/landing SPA links, TanStack Query keys scoped by mock vs live data source. **Done** — Root **`npm run dev`** using **`concurrently`** + **`run-script-os`** to start Vite and Uvicorn together for local full-stack development.
2. **Integrate Clerk**: JWT validation middleware for FastAPI; production auth hardening. SPA shells: Clerk components on `/auth/login` and `/auth/sign-up`
3. **Set up Supabase**: Database schema, storage buckets for videos/files
4. **Build Phase 1** (TTA Consulting): ~~Landing page~~, ~~auth shell (Clerk + mock demo)~~, ~~dashboard shell (mock/API hooks)~~, admin provisioning — Landing page complete with navbar, hero, video samples carousel, community Q&A, social proof CTA, final features + CTA, stats, CTA, and redesigned multi-column footer; authenticated **content dashboard** includes course-scoped sidebar navigation, progress home, Resources/Video routes per course, in-app PDF detail view, paid storage gated via FastAPI + Clerk; demo catalog and API seeds aligned (e.g. single paid Course 2 PDF in `resources-paid`)
5. **Build Phase 2** (MapleBear): Parent dashboard, video library, consultant upload
6. **Build Phase 3** (DSA Resources): Public content hub, purchase flow integration

### Security Considerations

- All protected FastAPI routes validate Clerk JWT before processing
- In staging/production, configure `CLERK_AUDIENCE` so JWT audience verification is enabled (avoid accepting cross-client tokens)
- For centralized authorization (roles/permissions), the backend may call **EdXP-Users** `POST /api/v1/authorize` using an HS256 **service token** (not a user token). Configuration is via backend settings/env vars:
  - `EDXP_AUTHZ_URL` (base URL, e.g. `http://localhost:<port>/api/v1`)
  - `EDXP_ORG_ID` (sent on every authorize request)
  - `EDXP_INTERNAL_JWT_SECRET` (HS256 shared secret used to mint service tokens)
  - `EDXP_SERVICE_NAME` (JWT `sub`, defaults to `ttg-portal`)
- In development, the backend may expose `POST /api/v1/dev/authz/authorize` to validate the EdXP integration wiring. This endpoint must remain development-only.
- Supabase Row Level Security (RLS) policies enforce data access boundaries
- Video URLs use signed/expiring links from Supabase Storage where applicable
- **Paid resource files**: Served only through authenticated API routes; **`resources-paid`** must stay non-public; backend restricts paid download/signed-url calls to the configured paid bucket name to reduce arbitrary bucket access via query parameters
- PII encrypted at rest in Supabase (database-level encryption)
- CORS configured to allow only portal domain origins; preview origins must be explicitly constrained (e.g. anchored regex), particularly when browser credentials are permitted
- Rate limiting on auth endpoints

### Performance Optimization

- TanStack Query stale-while-revalidate minimizes unnecessary network calls
- Video streaming via Supabase Storage (not full download before playback)
- Lazy-load content items below the fold
- Image/thumbnail optimization via CDN

### Observability

- **Logs**: Auth events, content access, video uploads, admin actions
- **Metrics**: API response times, error rates, active sessions, content views
- **Alerts**: Auth failures >5% rate, API p95 >500ms, upload failures

---

## 9. Testing Strategy

### Unit Tests
- [ ] Clerk JWT validation middleware
- [ ] Content access permission logic
- [ ] User role/permission checks
- [ ] Video metadata validation
- [ ] Feedback character limit enforcement
- [ ] (Optional, when Vitest is added) Frontend `VITE_AUTH_MODE` / mock-vs-live data source helpers — case normalisation and alignment with `getAuthMode()` (`mock`, `public`, `clerk`)

### Integration Tests
- [ ] Auth flow: Clerk JWT -> FastAPI validation -> user profile response
- [ ] Content API: List content scoped to user's provisioned access
- [ ] Video upload: Consultant uploads -> parent can view
- [ ] Feedback CRUD: Consultant adds/edits, parent sees read-only

### E2E Tests (when requested)
- [ ] Full login flow -> content dashboard -> video playback
- [ ] Consultant upload -> parent views recording + feedback
- [ ] Public DSA content browsing -> purchase CTA flow

### Manual Verification
- [ ] **Dev demo (mock mode)**: With `VITE_AUTH_MODE=mock` and no Clerk key, open `/`, navigate to `/auth/login`, complete demo sign-in, confirm `/dashboard` shows static resource cards without calling the backend
- [ ] **Hosted preview (public mode)**: With a production build using `VITE_AUTH_MODE=public` (e.g. on Vercel), confirm landing loads, `/auth/login` shows Preview copy and demo sign-in, `/dashboard` works without Clerk
- [ ] **Dev demo (case normalisation)**: With `VITE_AUTH_MODE=Mock` (mixed case) and `VITE_API_BASE_URL` set, confirm dashboard still uses fixture data (no failing API calls)
- [ ] **Clerk mode**: With valid Clerk publishable key, `/auth/login` shows Clerk sign-in; after sign-in, user reaches `/dashboard`; sign-out clears session and navbar returns to “Sign in”
- [ ] **Backend storage smoke test (dev-only)**: With `ENVIRONMENT=development` and Supabase configured, confirm the API can produce a public URL for a public bucket path and a signed URL for a paid bucket path via dev-only endpoints under `/api/v1/dev/storage/*`. If dev bearer auth is enabled, confirm paid endpoints require `Authorization: Bearer <DEV_BEARER_TOKEN>`.
- [ ] **AC: Auth Page**: Login, failed login, forgot password all work
- [ ] **AC: Content Dashboard**: Shows only provisioned content; sidebar course accordions, Resources/Video lists, progress home, in-app PDF detail, and legacy `/dashboard/resources` redirect do not break `/dashboard/resources/{id}`
- [ ] **AC: Video Library**: Parent sees only own child's videos
- [ ] **AC: Upload**: Consultant uploads and feedback appears for parent
- [ ] **AC: Public Page**: Free DSA content accessible without login

---

## 10. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Manual provisioning doesn't scale | M | H | Design admin panel for efficiency; automate in Phase 2 |
| Video storage costs grow quickly | H | M | Monitor Supabase storage usage; set file size limits; compress on upload |
| Clerk pricing at scale | M | L | Evaluate usage tiers; Clerk free tier supports 10K MAU |
| TTA Shop integration fragile (manual) | M | M | Document clear admin workflow; build webhook receiver for future automation |
| Parent confusion between MapleBear and TTA portals | M | M | Clear branding and navigation separation; distinct URLs or routes |

---

## 11. References

### Technology Documentation
- React 19.1: Component patterns, hooks
- TanStack Router: File-based routing configuration
- TanStack Query: Stale-while-revalidate, query invalidation
- FastAPI: Dependency injection, middleware, OpenAPI generation
- Clerk: JWT validation, user management, webhooks
- Supabase: PostgreSQL, Storage, Row Level Security
- shadcn/ui: Component library (new-york theme)
- Tailwind CSS 4.2: Utility-first styling

### Business Context
- Think Teach Academy (TTA): DSA consulting services
- MapleBear Collaboration Programmes: Student Care, Young Explorers
- Macro Academy: Base Camp, University Consulting (future phases)

---

## Quality Checklist

- [x] Self-contained with full context
- [x] INVEST user stories
- [x] Complete Gherkin ACs (happy + edge + errors)
- [x] API contracts with schemas
- [x] Error handling defined
- [x] Data models documented
- [x] Security addressed
- [x] Performance specified
- [x] Testing strategy outlined
- [x] Out-of-scope listed
- [x] References populated
- [x] Quantifiable requirements (no vague terms)

---

## Appendix: Target Audience Personas

### MapleBear Parent ("Maria")
- **Demographics**: 35-45, Singapore, children aged 4-8 in MapleBear Student Care / Young Explorers
- **Needs**: Transparency in enrichment classes, evidence of progress, convenient digital access to recordings
- **Goals**: Track child's public speaking development, feel confident about programme value

### DSA-Curious Parent ("David")
- **Demographics**: 38-48, child in Primary 4-5, researching secondary school options
- **Needs**: Structured expert information at accessible price, clarity on DSA process
- **Goals**: Understand DSA pathways without expensive commitment, assess child's competitiveness

### Consultant ("Catherine")
- **Demographics**: Experienced education consultant/teacher, manages multiple students
- **Needs**: Centralized upload system, reduce admin burden, enhance perceived service value
- **Goals**: Streamline administrative work, provide transparent progress tracking

---

## Change Log

### 2026-05-10 v1.7.0
- Status: In Development
- Changes:
  - **UX (Content Dashboard)**: Documented course-based sidebar (accordion per course, Resources + Video, Settings, bottom Logout), progress-focused dashboard home, mobile sheet parity, in-app PDF viewing (removed primary “open in new tab” CTA from PRD scope)
  - **Routing**: Documented `/dashboard/course/{courseId}/resources|videos`, resource detail `/dashboard/resources/{resourceId}`, legacy list redirect, and outlet requirement so detail route is not shadowed
  - **Storage / security**: Documented private `resources-paid`, Clerk + service-role access via API, paid-bucket allowlist on backend, non-dev startup warning for missing Supabase/Clerk config
  - **Functional / implementation**: PDFs open in-app; Phase 1 demo alignment (single paid Course 2 PDF catalog note)
  - **Acceptance Criteria**: Added Gherkin scenario for course Resources and in-app PDF; expanded manual verification for dashboard navigation

### 2026-05-06 v1.6.0
- Status: In Development
- Changes:
  - Documented EdXP-Users authorization integration (service-to-service `/authorize`) and required backend configuration variables
  - Added dev-only EdXP authorization diagnostic endpoint (`/api/v1/dev/authz/authorize`) guidance for local wiring verification

### 2026-04-28 v1.5.0
- Status: In Development
- Changes:
  - Documented Vercel-hosted FastAPI backend as a separate project rooted at `backend/` (Vercel Functions entrypoint + routing)
  - Added backend deployment configuration requirements: `FRONTEND_URL` and optional `FRONTEND_URL_REGEX` for Preview Deployments
  - Clarified production auth hardening: set `CLERK_AUDIENCE` to ensure audience verification

### 2026-04-24 v1.4.1
- Status: In Development
- Changes:
  - Documented backend **dev-only** Supabase Storage connectivity checks (public vs paid buckets) and optional dev bearer auth bypass for local testing
  - Noted backend configuration may load from `backend/.env.local` (preferred) with `.env` fallback in local development

### 2026-04-21 v1.4.0
- Status: In Development
- Changes:
  - Documented **`VITE_AUTH_MODE=public`** for production/static-hosted UI previews without Clerk (vs dev-only `mock`)
  - Updated **Non-Functional**, **Functional**, **Technical Specification** (auth modes table, SPA route wording), **UX** auth notes, and **Testing Strategy** (manual public-mode check)
  - Documented optional **Vercel** frontend deployment (root `frontend/`, SPA rewrites, build-time `VITE_*`, separate API hosting + `FRONTEND_URL` for CORS)
  - Aligned **[Deployment & Environments](../deployment/environments.md)** with Vercel preview workflow and env vars

### 2026-04-17 v1.3.0
- Status: In Development
- Changes:
  - Updated landing page UX specs to reflect new conversion-focused sections (Community Q&A carousel, “Join Over 555,000…” social proof CTA, final features + CTA)
  - Updated footer UX spec to a multi-column layout with social links and bottom-row legal links
  - Updated Phase 1 implementation guidance to match current landing page composition (removed “programmes” section)

### 2026-04-05 v1.2.1
- Status: In Development
- Changes:
  - Documented **local full-stack initialisation**: root **`package.json`**, **`npm install`** at repo root, **`npm run dev`** (Vite + Uvicorn via **`concurrently`** and OS-specific **`backend/.venv`** paths via **`run-script-os`**)
  - Extended **Technical Specification** with **Local development (full-stack bootstrap)** and noted two-terminal alternative
  - Updated **Implementation Guidance** (scaffold item) to mark root dev orchestration **Done**
  - Aligned **[Setup Guide](../getting-started/setup.md)** and **[Development Workflow](../getting-started/development.md)** with root **`npm run dev`**, **`backend/.venv`**, **`pip install -e ".[dev]"`**, and health URL **`/api/v1/health`**

### 2026-04-05 v1.2
- Status: In Development
- Changes:
  - Documented frontend **mock auth / demo mode** (`VITE_AUTH_MODE=mock`), dev-only constraint, and shared portal auth abstraction aligned with implementation
  - Added **Technical Specification** table for Clerk vs mock modes, Phase 1 **SPA routes** (`/auth/login`, `/auth/sign-up`, `/dashboard`), and TanStack Query **mock vs live** cache key segment
  - Extended **Non-Functional** and **Functional** auth notes to separate production Clerk from local prototyping
  - Updated **UX** auth page notes for mock-mode labelling
  - Refreshed **Implementation Guidance** (Phase 1 progress) and **Testing Strategy** (manual mock/Clerk checks; optional Vitest note for env helpers)

### 2026-03-27 v1.1
- Status: In Development
- Changes:
  - Updated Technology Stack to reflect actual installed package versions (Vite 6.x, TypeScript 5.7, TanStack Router 1.114+, TanStack Query 5.75+, Tailwind CSS 4.1)
  - Added ESLint 9 (flat config with typescript-eslint, react-hooks, react-refresh) to tech stack
  - Updated Implementation Guidance to track Phase 1 frontend progress: scaffold complete, landing page complete
  - Updated Integration Points library versions to match installed dependencies
