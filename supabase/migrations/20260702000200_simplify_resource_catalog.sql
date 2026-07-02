alter table public.resources
  drop constraint if exists resources_course_id_check;

alter table public.resources
  drop column if exists sort_order;

comment on column public.resources.course_id is
  'Stable course identifier. New admin-created courses default to paid access.';
