-- Speed up the admin analytics dashboard queries, which filter recent events by
-- occurred_at and then aggregate by event, user, resource, page, and referrer.
create index if not exists analytics_events_occurred_at_desc_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_event_type_occurred_at_idx
  on public.analytics_events (event_type, occurred_at desc);

create index if not exists analytics_events_user_occurred_at_idx
  on public.analytics_events (user_id, occurred_at desc)
  where user_id is not null;

create index if not exists analytics_events_resource_occurred_at_idx
  on public.analytics_events (resource_id, occurred_at desc)
  where resource_id is not null;

create index if not exists analytics_events_page_path_occurred_at_idx
  on public.analytics_events (page_path, occurred_at desc);

create index if not exists course_entitlements_user_active_idx
  on public.course_entitlements (user_id, course_id)
  where revoked_at is null;

create index if not exists analytics_ignored_users_user_id_idx
  on public.analytics_ignored_users (user_id)
  where user_id is not null;

create index if not exists analytics_ignored_users_clerk_user_id_idx
  on public.analytics_ignored_users (clerk_user_id)
  where clerk_user_id is not null;

create index if not exists analytics_ignored_users_email_lower_idx
  on public.analytics_ignored_users (lower(email))
  where email is not null;
