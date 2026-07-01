# Supabase schema migrations

Database schema changes are tracked in `supabase/migrations` and deployed with the Supabase CLI.
Do not use the hosted Table Editor or SQL Editor for new schema changes unless recovering from an
incident; untracked remote edits cause migration history to drift.

## One-time setup for this existing project

The `users`, `resources`, `course_entitlements`, and `access_codes` tables were initially created
in the hosted project. Link the local repository and capture any remote-only schema before making
further changes:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db pull
npx supabase migration list
```

Review and commit the migration produced by `db pull`. The existing
`20260701000000_create_access_codes.sql` migration is intentionally idempotent so it can be recorded
against a hosted project where the same table already exists.

Preview and apply pending migrations:

```powershell
npx supabase db push --dry-run
npx supabase db push
```

Never run `db push` until the dry run lists only the expected migrations.

`db push` runs each pending migration against the linked hosted project in timestamp order. Once a
migration has been applied, create a new migration for subsequent changes instead of editing the
applied file.

## Normal workflow

Create a migration:

```powershell
npx supabase migration new short_description
```

Add SQL to the generated file, test it against the local Supabase stack when available, then deploy:

```powershell
npx supabase db reset
npx supabase db push --dry-run
npx supabase db push
```

Only one developer should push migrations at a time. Commit every applied migration so Git and the
remote `supabase_migrations.schema_migrations` history remain aligned.

## Course 2 access-code administration

Production administrators sign in with Clerk and use `/admin`. FastAPI verifies that the
synchronized `public.users.role` is `ADMIN` before listing, creating, revoking, or reissuing codes.
The plaintext produced by create/reissue is displayed once and is never stored.

The backend-only CLI remains available for break-glass/local issuance:

Run the backend-only command from the repository root:

```powershell
cd backend
.venv\Scripts\python.exe -m app.scripts.create_access_code --order-id TTA-ORDER-123
```

The command stores only the code hash and prints the plaintext code once for delivery to the
purchaser.

`20260701000300_add_admin_access_code_workflow.sql` adds revocation/replacement metadata,
service-role-only transactional functions, and `admin_audit_log`. Never edit that migration after
it has been applied; create a new migration for later changes.

Inspect the audit history from the Supabase SQL Editor:

```sql
select l.created_at, l.action, u.email as admin_email,
       l.target_type, l.target_id, l.details
from public.admin_audit_log l
join public.users u on u.id = l.actor_user_id
order by l.created_at desc;
```

RLS intentionally exposes no browser policy for this table.
