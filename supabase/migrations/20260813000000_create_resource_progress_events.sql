create table if not exists public.resource_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  event_type text not null
    check (event_type in ('started', 'progressed', 'completed', 'reopened', 'reset')),
  occurred_at timestamptz not null default now(),
  status text not null
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null
    check (progress_percent between 0 and 100),
  pages_viewed_count integer not null default 0
    check (pages_viewed_count >= 0),
  page_count integer check (page_count is null or page_count >= 0),
  last_position_seconds integer
    check (last_position_seconds is null or last_position_seconds >= 0),
  duration_seconds integer
    check (duration_seconds is null or duration_seconds >= 0),
  completion_source text
    check (
      completion_source is null
      or completion_source in ('manual', 'video_threshold', 'video_ended')
    ),
  created_at timestamptz not null default now()
);

alter table public.resource_progress_events enable row level security;

grant select, insert on table public.resource_progress_events to service_role;

create index if not exists idx_resource_progress_events_occurred_at
  on public.resource_progress_events (occurred_at desc);

create index if not exists idx_resource_progress_events_user_time
  on public.resource_progress_events (user_id, occurred_at desc);

create index if not exists idx_resource_progress_events_resource_time
  on public.resource_progress_events (resource_id, occurred_at desc);

create index if not exists idx_resource_progress_events_completed_time
  on public.resource_progress_events (occurred_at desc)
  where event_type = 'completed';

comment on table public.resource_progress_events is
  'Append-only learner progress history used for period-based course analytics.';

create or replace function public.record_resource_progress_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_event_type text;
  should_record boolean := true;
  event_time timestamptz;
begin
  if tg_op = 'DELETE' then
    -- Cascading user/resource deletion must not recreate a row that references
    -- the parent currently being removed. Direct progress resets still do.
    if not exists (
      select 1 from public.users where id = old.user_id
    ) or not exists (
      select 1 from public.resources where id = old.resource_id
    ) then
      return old;
    end if;

    insert into public.resource_progress_events (
      user_id,
      resource_id,
      event_type,
      occurred_at,
      status,
      progress_percent,
      pages_viewed_count,
      page_count,
      last_position_seconds,
      duration_seconds,
      completion_source
    ) values (
      old.user_id,
      old.resource_id,
      'reset',
      now(),
      'not_started',
      0,
      0,
      old.page_count,
      null,
      old.duration_seconds,
      null
    );
    return old;
  end if;

  event_time := coalesce(new.last_accessed_at, new.updated_at, now());

  if tg_op = 'INSERT' then
    if new.status = 'completed' then
      next_event_type := 'completed';
      event_time := coalesce(new.completed_at, event_time);
    elsif new.progress_percent > 0
      or cardinality(new.pages_viewed) > 0
      or coalesce(new.last_position_seconds, 0) > 0 then
      next_event_type := 'started';
    else
      next_event_type := 'progressed';
    end if;
  else
    if old.status <> 'completed' and new.status = 'completed' then
      next_event_type := 'completed';
      event_time := coalesce(new.completed_at, event_time);
    elsif old.status = 'completed' and new.status <> 'completed' then
      next_event_type := 'reopened';
    elsif old.status = 'not_started' and new.status = 'in_progress' then
      next_event_type := 'started';
    else
      next_event_type := 'progressed';
      should_record :=
        abs(new.progress_percent - old.progress_percent) >= 5
        or (old.progress_percent < 25 and new.progress_percent >= 25)
        or cardinality(new.pages_viewed) <> cardinality(old.pages_viewed)
        or abs(
          coalesce(new.last_position_seconds, 0)
          - coalesce(old.last_position_seconds, 0)
        ) >= 60;
    end if;
  end if;

  if should_record then
    insert into public.resource_progress_events (
      user_id,
      resource_id,
      event_type,
      occurred_at,
      status,
      progress_percent,
      pages_viewed_count,
      page_count,
      last_position_seconds,
      duration_seconds,
      completion_source
    ) values (
      new.user_id,
      new.resource_id,
      next_event_type,
      event_time,
      new.status,
      new.progress_percent,
      cardinality(new.pages_viewed),
      new.page_count,
      new.last_position_seconds,
      new.duration_seconds,
      new.completion_source
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.record_resource_progress_event() from public;

insert into public.resource_progress_events (
  user_id,
  resource_id,
  event_type,
  occurred_at,
  status,
  progress_percent,
  pages_viewed_count,
  page_count,
  last_position_seconds,
  duration_seconds,
  completion_source
)
select
  progress.user_id,
  progress.resource_id,
  case
    when progress.status = 'completed' then 'completed'
    when progress.progress_percent > 0
      or cardinality(progress.pages_viewed) > 0
      or coalesce(progress.last_position_seconds, 0) > 0 then 'started'
    else 'progressed'
  end,
  case
    when progress.status = 'completed'
      then coalesce(progress.completed_at, progress.updated_at, progress.created_at)
    else coalesce(progress.last_accessed_at, progress.updated_at, progress.created_at)
  end,
  progress.status,
  progress.progress_percent,
  cardinality(progress.pages_viewed),
  progress.page_count,
  progress.last_position_seconds,
  progress.duration_seconds,
  progress.completion_source
from public.resource_progress as progress
where not exists (
  select 1
  from public.resource_progress_events as history
  where history.user_id = progress.user_id
    and history.resource_id = progress.resource_id
);

drop trigger if exists resource_progress_history_trigger on public.resource_progress;

create trigger resource_progress_history_trigger
after insert or update or delete on public.resource_progress
for each row execute function public.record_resource_progress_event();
