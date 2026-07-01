alter table public.resources
  add column if not exists course_id text;

update public.resources
set course_id = case
  when category = 'course-2'
    or topic = 'interview-preparation'
    then 'course-2'
  when category = 'course-1'
    or topic in ('dsa-pathways', 'timelines-deadlines')
    then 'course-1'
  else course_id
end
where course_id is null;

do $$
begin
  if exists (
    select 1
    from public.resources
    where course_id is null
  ) then
    raise exception
      'Cannot make resources.course_id required: one or more resources could not be mapped';
  end if;
end
$$;

alter table public.resources
  alter column course_id set not null;

alter table public.resources
  drop constraint if exists resources_course_id_check;

alter table public.resources
  add constraint resources_course_id_check
  check (course_id in ('course-1', 'course-2'));

create index if not exists idx_resources_course_id
  on public.resources(course_id);

comment on column public.resources.course_id is
  'Stable course identifier used for entitlement authorization.';
