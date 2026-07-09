alter table public.analytics_events
  add column if not exists event_id uuid;

update public.analytics_events
set event_id = id
where event_id is null;

alter table public.analytics_events
  alter column event_id set not null;

create unique index if not exists idx_analytics_events_event_id
  on public.analytics_events(event_id);

comment on column public.analytics_events.event_id is
  'Client-generated immutable event identifier used to deduplicate retried analytics deliveries.';
