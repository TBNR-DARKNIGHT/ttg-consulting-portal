# Google Sheets user reporting

## TTA Codes worksheet

The admin access-code page can generate batches of Course 2 codes for existing
Think Teach Academy students. The backend creates a `TTA Codes` worksheet in the
same configured spreadsheet when the first batch is generated.

The worksheet headers are:

| Header | Purpose |
| --- | --- |
| Issue Status | Starts as `AVAILABLE`; CS changes it to `ISSUED` |
| Issue Date | Date the code was supplied by CS |
| Access Code | Plaintext single-use code sent to the parent |
| Redemption Status | Starts as `UNREDEEMED` |
| Redemption Date | Reserved for the redemption timestamp |
| Access Code ID | Supabase identifier used to reconcile the row |
| Notes | Optional CS notes |

The Google Sheet contains the only retained plaintext copy. Supabase stores the
secure hash and remains the source of truth for whether a code can be redeemed.
Restrict access to this worksheet to staff who are authorized to issue codes.

The FastAPI backend writes the `Users` worksheet directly. Zapier is not involved
in this worksheet; it continues to handle WooCommerce orders and access-code
creation separately.

```text
Clerk user.created / user.updated / user.deleted
              |
              v
POST /api/v1/webhooks/clerk
              |
              +--> verify Clerk signature
              +--> upsert user in Supabase
              +--> read Course 2 entitlement from Supabase
              +--> insert or update the Google Sheets row

Successful Course 2 redemption
              |
              +--> commit access code + entitlement in Supabase
              +--> update Course 2 Access in Google Sheets
```

Supabase remains the source of truth for identity and course access. Google Sheets
is an administrative report.

## Worksheet format

The backend creates this header row when the worksheet is empty:

| Clerk User ID | Email | First Name | Last Name | Signup Date | Account Status | Course 2 Access |
| --- | --- | --- | --- | --- | --- | --- |

`Clerk User ID` is the stable key. If a row with that ID exists, the backend
updates it. Otherwise, it appends a new row. Do not remove or reorder these
columns without updating `backend/app/services/google_sheets.py`.

## 1. Create the spreadsheet

1. Sign in to the Google account that should own the report.
2. Open [Google Sheets](https://sheets.google.com) and create a blank spreadsheet.
3. Give it a recognizable name, such as `Beyond Grades Reporting`.
4. The backend creates the `Users` and `TTA Codes` tabs when first needed.
5. If you create either tab yourself, leave it empty so the backend can add its headers.
6. Copy the spreadsheet ID from its URL.

For example:

```text
https://docs.google.com/spreadsheets/d/1AbCDefGhijkLmNopQRstuVWxyz/edit
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^
                                      spreadsheet ID
```

Only the ID is used in the backend environment variable.

## 2. Create or select a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Use the project selector in the top navigation.
3. Select an existing Beyond Grades project or choose **New Project**.
4. A suitable project name is `Beyond Grades Portal`.
5. Ensure this project remains selected for the following steps.

This Google Cloud project controls API access. It does not need to own the
spreadsheet.

## 3. Enable Google Sheets API

1. In Google Cloud Console, open **APIs & Services → Library**.
2. Search for `Google Sheets API`.
3. Select **Google Sheets API**.
4. Click **Enable**.
5. Wait until the API's overview page appears.

Only Google Sheets API is required. Google Drive API is not required because the
backend already knows the spreadsheet ID and does not search Drive.

## 4. Create the service account

A service account is a non-human Google identity for the backend. Do not create an
API key or an OAuth desktop/web client for this integration.

1. Open **IAM & Admin → Service Accounts**.
2. Click **Create service account**.
3. Enter:

   - Service account name: `Beyond Grades Sheets Writer`
   - Service account ID: `beyond-grades-sheets-writer`
   - Description: `Writes portal user status to the Beyond Grades reporting sheet`

4. Click **Create and continue**.
5. Leave **Grant this service account access to project** empty.
6. Click **Continue**, then **Done**.
7. Copy the generated email address. It looks like:

```text
beyond-grades-sheets-writer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

No Google Cloud IAM role or domain-wide delegation is required. Access to this
specific spreadsheet is granted in the spreadsheet itself.

## 5. Share the spreadsheet with the service account

1. Return to the Beyond Grades spreadsheet.
2. Click **Share**.
3. Paste the service-account email address.
4. Select **Editor**.
5. Disable **Notify people** if Google shows that option.
6. Click **Share**.

Sharing the sheet is essential. Enabling the API does not automatically give the
service account permission to open the spreadsheet.

## 6. Create the JSON service-account key

1. Return to **Google Cloud Console → IAM & Admin → Service Accounts**.
2. Click the service-account email.
3. Open the **Keys** tab.
4. Choose **Add key → Create new key**.
5. Select **JSON**.
6. Click **Create**.

Google downloads a JSON file. It contains a private key and usually resembles:

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "beyond-grades-sheets-writer@your-project.iam.gserviceaccount.com",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

Never commit this file, upload it to the frontend, send it through chat, or add it
to a `VITE_*` variable. Anyone holding the key can act as this service account.

## 7. Convert the JSON to one line

The backend expects the entire JSON object in one environment variable. In
PowerShell, copy a compact version directly to the clipboard:

```powershell
$credentials = Get-Content -Raw "C:\path\to\downloaded-key.json" |
  ConvertFrom-Json |
  ConvertTo-Json -Compress
Set-Clipboard $credentials
```

This preserves the private key's `\n` characters correctly and avoids printing
the secret in the terminal.

## 8. Configure local development

Open `backend/.env` and add:

```dotenv
GOOGLE_SHEETS_SPREADSHEET_ID=1AbCDefGhijkLmNopQRstuVWxyz
GOOGLE_SHEETS_USERS_TAB=Users
GOOGLE_SHEETS_TTA_CODES_TAB=TTA Codes
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}
```

Paste the full compact JSON after `GOOGLE_SERVICE_ACCOUNT_JSON=`. Do not use the
abbreviated example literally.

The settings are declared in `backend/app/config.py`. The `.env.local` file takes
precedence over `backend/.env`.

## Moving to a different spreadsheet

1. Share the new document with the service-account `client_email` as an Editor.
2. Replace `GOOGLE_SHEETS_SPREADSHEET_ID` in the backend environment with the ID
   between `/d/` and `/edit` in the new document URL.
3. Set `GOOGLE_SHEETS_USERS_TAB` and `GOOGLE_SHEETS_TTA_CODES_TAB` if you want
   names other than `Users` and `TTA Codes`.
4. Update the same variables in the deployed backend and redeploy it.

The backend will create the two portal-owned tabs and their headers. It does not
write WooCommerce order rows. Zapier owns that workflow, so change the target
worksheet in Zapier to `Beyond Grades Portal Courses`.

That worksheet should use this order:

| Date | Name of Parent | Mobile | Email | Class Details | Course ID | Child's Name | Sch & Level | Address | Shop Coupon Code | Amount | Follow up? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Add `Course ID` immediately after `Class Details`, then update the Zapier action
field mapping. The portal purchase webhook expects the stable course value
`course-2`; the backend does not infer it from the class-details text.

Install the backend dependencies if this has not already been done:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

The integration uses:

- `google-auth` to turn the service-account JSON into Google credentials.
- `google-api-python-client` to call Google Sheets API v4.
- The scope `https://www.googleapis.com/auth/spreadsheets`.

OAuth consent-screen configuration is not required because the backend uses a
service account rather than asking a human user to authorize it.

## 9. Configure Vercel

These variables belong in the **backend Vercel project**, not the frontend:

1. Open the backend project in Vercel.
2. Open **Settings → Environment Variables**.
3. Add:

   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SHEETS_USERS_TAB`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`

4. Paste the same complete compact JSON into
   `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Select the environments that need the integration, normally Preview and
   Production.
6. Save the variables.
7. Redeploy the backend. Existing deployments do not automatically receive newly
   added variables.

Use separate spreadsheets or service accounts for staging and production if test
users should not appear in the production report.

## 10. Configure the Clerk webhook

The Google API does not detect Clerk registrations itself. Clerk sends a signed
event to FastAPI, which then writes to Google Sheets.

1. Open the correct Clerk instance.
2. Open **Webhooks**.
3. Click **Add Endpoint**.
4. Enter the deployed backend URL:

```text
https://YOUR-BACKEND-DOMAIN/api/v1/webhooks/clerk
```

Do not use the frontend domain.

5. Subscribe to:

   - `user.created`
   - `user.updated`
   - `user.deleted`

6. Create the endpoint.
7. Reveal and copy its signing secret, which begins with `whsec_`.
8. Add this to `backend/.env.local` and the backend Vercel environment:

```dotenv
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

9. Redeploy the backend after adding the Vercel variable.

The backend verifies the raw request against this signing secret before trusting
the user ID or email.

## 11. How signup synchronization works

For `user.created` and `user.updated`, the backend performs these operations:

1. Clerk sends a signed `POST /api/v1/webhooks/clerk`.
2. `backend/app/routers/webhooks.py` verifies the Svix signature.
3. It extracts Clerk ID, primary email, name, and creation time.
4. `sync_authenticated_user()` inserts or updates the Supabase `users` row.
5. `list_entitlements()` checks whether the user has Course 2 access.
6. `upsert_user_row()` reads columns `A:G` from the `Users` tab.
7. It searches column A for the Clerk User ID.
8. It updates the matching row or appends a new one.
9. FastAPI returns HTTP `204`, telling Clerk the event succeeded.

If Supabase or Google Sheets fails, FastAPI returns HTTP `503`. Clerk can then
retry the webhook. Because the row is keyed by Clerk User ID, a retry should
update the same row rather than create another one.

For `user.deleted`, Clerk may no longer include the user's email or profile
fields. The backend finds the existing row using only the Clerk User ID and
changes column F (`Account Status`) to `DELETED`. It preserves the historical
email, name, signup date, and Course 2 access value. If the row is unexpectedly
missing, it appends a minimal row containing the Clerk User ID and deleted
status.

## 12. How course-redemption synchronization works

When an authenticated user redeems a code:

1. The frontend calls `POST /api/v1/entitlements/redeem`.
2. Supabase atomically consumes the code and grants the entitlement.
3. The backend reloads the user's entitlements.
4. It updates the same spreadsheet row.
5. `Course 2 Access` changes from `NOT ACTIVE` to `ACTIVE`.

Supabase is committed before Google Sheets is called. If Google is unavailable,
the redemption still returns success because the one-time code has already been
consumed. The Sheets error is logged instead of asking the user to redeem again.

## 13. Test the complete flow

### Test a Clerk event

1. In Clerk's webhook endpoint, open the testing or message-attempts section.
2. Send a `user.created` example.
3. Confirm the response status is `204`.
4. Open the `Users` tab.
5. Confirm the header and one user row exist.
6. Send the same event again and confirm it updates rather than adding a duplicate.

### Test a real user update

1. Change a test user's name in Clerk.
2. Open the corresponding `user.updated` message attempt.
3. Confirm a `204` response.
4. Confirm the existing spreadsheet row changed.

### Test user deletion

1. Delete a disposable test user in Clerk.
2. Confirm Clerk delivers a successful `user.deleted` webhook with status `204`.
3. Find the row using its Clerk User ID.
4. Confirm `Account Status` says `DELETED`.
5. Confirm the existing email, name, signup date, and Course 2 value were not
   erased.

### Test Course 2 activation

1. Sign in as a test portal user.
2. Confirm their sheet value is `NOT ACTIVE`.
3. Redeem a valid Course 2 access code.
4. Confirm dashboard access is granted.
5. Confirm the same sheet row now says `ACTIVE`.

## Troubleshooting

### `503 Google Sheets user sync is not configured`

One or both of these values are missing from the running backend:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

Check the backend Vercel project and redeploy.

### Google API `403 PERMISSION_DENIED`

Common causes:

- The spreadsheet was not shared with the exact service-account email.
- The service account has Viewer rather than Editor access.
- Google Sheets API was enabled in a different Cloud project.

### Google API `404 not found`

Check the spreadsheet ID. Supply only the text between `/d/` and `/edit`, not the
full URL.

### `Unable to parse range: 'Users'!A:G`

The worksheet tab is not named exactly `Users`, or
`GOOGLE_SHEETS_USERS_TAB` does not match its name.

### `Google Sheets credentials are invalid`

`GOOGLE_SERVICE_ACCOUNT_JSON` is truncated, contains the filename instead of the
JSON contents, or lost the escaped newlines inside `private_key`. Recreate the
one-line value using the PowerShell command above.

### Clerk reports `400 Invalid Clerk webhook signature`

The `CLERK_WEBHOOK_SIGNING_SECRET` belongs to another endpoint or Clerk
environment. Copy the signing secret from the exact endpoint sending the event.

### Clerk event succeeds but no user appears

Confirm the event was sent to the backend domain and inspect backend logs. A
successful handler returns `204`; a `2xx` from a different URL does not prove this
route ran.

## Existing users

Webhooks cover events delivered after the endpoint is enabled. Existing Clerk
users need a one-time backfill before the worksheet is complete. A backfill
command is not currently included.
