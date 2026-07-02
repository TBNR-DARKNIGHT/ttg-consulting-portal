# Admin resource upload testing

This checklist covers local uploads and public-link imports for PDFs and videos.

## Prerequisites

1. Apply all Supabase migrations, including
   `20260702000200_simplify_resource_catalog.sql`.
2. Ensure the `resources-public` and `resources-paid` Storage buckets exist.
3. Configure the backend `.env` with working `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
   `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, and `FRONTEND_URL`.
4. Configure the frontend `.env.local` with Clerk and `VITE_API_BASE_URL`.
5. Ensure the test user's `public.users.role` is `ADMIN`.
6. Start both applications with `npm run dev` from the repository root.
7. Prepare a small PDF, short MP4, public Google Drive links for each, and one private Drive link.
   Public Drive files must be shared as **Anyone with the link**.

Use disposable titles beginning with `UPLOAD TEST -` so cleanup is easy.

## 1. Admin navigation and account

1. Sign in as the admin and open `/admin`.
2. Confirm **Access codes** and **Upload resources** appear in the sidebar.
3. Confirm the bottom-left control is Clerk's account module.
4. Confirm its profile-management and sign-out actions work.
5. Sign in as a non-admin and try `/admin/resources`.

Expected: the admin can use the page; the non-admin is redirected. Direct API requests from a
non-admin return `403`, and unauthenticated requests return `401`.

## 2. Local PDF upload

After a successful upload, verify that Supabase Storage contains both the PDF and its
first-page JPEG thumbnail in the same folder. For example, `guide.pdf` should have a
matching `guide_thumbnail.jpg`. Confirm that the student dashboard card displays this
thumbnail for both public and entitled paid resources.

1. Open **Upload resources** and leave **Upload file** selected.
2. Click **Browse files** and choose the PDF.
3. Confirm its filename and size appear. Repeat once using drag and drop.
4. Enter Title, Topic, Course, optional Module, and Description.
5. Submit.
6. In Supabase Storage, confirm Course 1 uses `resources-public/course-1/pdf/` and Course 2 uses
   `resources-paid/course-2/pdf/`.
7. In `public.resources`, confirm a `type = 'pdf'` row has the expected `bucket`, `file_path`,
   `course_id`, `module_id`, and `topic`.
8. Open the resource through the learner dashboard.

Expected: progress reaches 100%, a success toast appears, and the PDF obeys existing public/paid
access rules.

## 3. Local video upload

1. Select **Upload file**, choose the MP4, enter metadata, and submit.
2. Watch the progress indicator.
3. In Mux, confirm a new asset exists with passthrough equal to the resource UUID.
4. Confirm Course 1 receives a public playback ID.
5. Repeat for Course 2 and confirm it receives a signed playback ID.
6. In `public.resources`, verify `mux_asset_id`, `mux_playback_id`, and
   `mux_playback_signed`.
7. Wait for Mux processing, then play the video in the dashboard.

Expected: bytes travel directly from the browser to Mux. The resource may initially be processing,
then becomes playable.

## 4. Public PDF link

1. Select **File link**.
2. Paste the public Google Drive PDF sharing URL.
3. Select **PDF document**, enter metadata, and submit.
4. Verify the Storage object and `resources` row as in the local PDF test.

Expected: the backend converts the sharing URL, downloads at most 50 MB, verifies the PDF
signature, then uploads it to Supabase.

## 5. Public video link

1. Select **File link**.
2. Paste the public Google Drive video sharing URL.
3. Select **Video**, enter metadata, and submit.
4. Confirm Mux creates an asset from the external URL.
5. Confirm its passthrough and playback policy, then verify the `resources` row.

Expected: Mux imports the public video; large video bytes do not pass through FastAPI.

## 6. Existing and new catalog values

1. Upload with an existing Course and Topic.
2. Choose **Create new topic**, enter a name containing spaces, and upload.
3. Reload and confirm its normalized slug appears in the topic options.
4. Choose **Create new course**, enter a name, create a topic, and upload.
5. Reload and confirm both values appear.
6. Verify the new course uses `resources-paid` and signed Mux playback.

Expected: custom values persist through resource rows. New courses default to paid/private.
Learner navigation and entitlement assignment for new courses remain a separate product workflow.

## 7. Validation and security cases

Perform each test and confirm no usable resource is created:

1. Submit without selecting a file or entering a link.
2. Select a ZIP, image, or unsupported local file.
3. Mark an HTML page or Drive sign-in page as a PDF.
4. Use a PDF larger than 50 MB.
5. Use a private Google Drive link.
6. Use `http://` instead of `https://`.
7. Use `https://localhost/...`, a loopback IP, or a private-network IP.
8. Send an invalid resource type through the API.
9. Send a Course 1 upload with a Course 2 module through the API.

Expected: validation errors appear, private link targets are rejected, and failed video setup does
not leave a resource row behind.

## 8. Database verification and cleanup

Find test rows:

```sql
select
  id, title, type, course_id, module_id, topic, is_paid,
  bucket, file_path, mux_asset_id, mux_playback_id, mux_playback_signed
from public.resources
where title like 'UPLOAD TEST%'
order by created_at desc;
```

Delete test Mux assets and Supabase Storage objects before deleting their resource rows.

## Automated regression commands

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check app tests
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m compileall -q app tests
```

Frontend:

```powershell
cd frontend
npm run type-check
npm run lint
npm run build
```

The production build currently emits known CSS import-order and bundle-size warnings. They do not
fail the build. The repository-wide Python Pyright check has existing Supabase SDK
JSON/nullability errors and is not currently a clean quality gate.
