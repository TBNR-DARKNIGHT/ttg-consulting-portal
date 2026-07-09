create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  session_id uuid not null,
  anonymous_id uuid not null,
  user_id uuid references public.users(id) on delete set null,
  clerk_user_id text,
  occurred_at timestamptz not null default now(),
  page_path text not null,
  page_title text,
  resource_id uuid references public.resources(id) on delete set null,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_type_check
    check (event_type in ('page_view', 'click', 'session_start', 'session_end', 'heartbeat', 'resource_view'))
);

alter table public.analytics_events enable row level security;

create index if not exists idx_analytics_events_occurred_at
  on public.analytics_events(occurred_at desc);

create index if not exists idx_analytics_events_user_time
  on public.analytics_events(user_id, occurred_at desc)
  where user_id is not null;

create index if not exists idx_analytics_events_session_time
  on public.analytics_events(session_id, occurred_at desc);

create index if not exists idx_analytics_events_resource_time
  on public.analytics_events(resource_id, occurred_at desc)
  where resource_id is not null;

create index if not exists idx_analytics_events_event_type_time
  on public.analytics_events(event_type, occurred_at desc);

comment on table public.analytics_events is
  'Append-only raw website activity events for later analytics/dashboard queries.';
