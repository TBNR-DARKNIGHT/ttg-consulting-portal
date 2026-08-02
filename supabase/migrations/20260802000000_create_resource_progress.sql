create table if not exists public.resource_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  completed_at timestamptz,
  last_accessed_at timestamptz,
  last_position_seconds integer check (last_position_seconds is null or last_position_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  pages_viewed integer[] not null default '{}',
  page_count integer check (page_count is null or page_count >= 0),
  completion_source text
    check (
      completion_source is null
      or completion_source in ('manual', 'video_threshold', 'video_ended')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id),
  check (
    (status = 'completed' and completed_at is not null)
    or
    (status <> 'completed' and completed_at is null)
  )
);

alter table public.resource_progress enable row level security;

create index if not exists idx_resource_progress_user_updated
  on public.resource_progress(user_id, updated_at desc);

create index if not exists idx_resource_progress_resource_completed
  on public.resource_progress(resource_id, completed_at desc)
  where completed_at is not null;

comment on table public.resource_progress is
  'Current per-user resource progress for signed-in dashboard learners.';

comment on column public.resource_progress.progress_percent is
  'Lightweight resource engagement percent. Course completion is based on completed_at/status.';

comment on column public.resource_progress.completion_source is
  'manual for PDFs/articles, video_threshold for 90% watched, or video_ended when playback ends.';
