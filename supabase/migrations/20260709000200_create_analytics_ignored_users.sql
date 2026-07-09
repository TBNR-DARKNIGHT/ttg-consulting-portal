create table if not exists public.analytics_ignored_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  clerk_user_id text,
  email text,
  reason text not null default '',
  created_at timestamptz not null default now(),
  created_by_user_id uuid references public.users(id) on delete set null,
  constraint analytics_ignored_users_target_check
    check (user_id is not null or clerk_user_id is not null or email is not null)
);

alter table public.analytics_ignored_users enable row level security;

create unique index if not exists idx_analytics_ignored_users_user_id
  on public.analytics_ignored_users(user_id)
  where user_id is not null;

create unique index if not exists idx_analytics_ignored_users_clerk_user_id
  on public.analytics_ignored_users(lower(clerk_user_id))
  where clerk_user_id is not null;

create unique index if not exists idx_analytics_ignored_users_email
  on public.analytics_ignored_users(lower(email))
  where email is not null;

comment on table public.analytics_ignored_users is
  'Admin-managed exclusion list for internal/test users omitted from analytics summaries.';
