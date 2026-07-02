create table if not exists public.course_modules (
  course_id text not null,
  id text not null,
  title text not null,
  sort_order integer not null default 0,
  primary key (course_id, id)
);

insert into public.course_modules (course_id, id, title, sort_order)
values
  ('course-2', 'module-1', 'Module 1: The Research Edge', 1),
  ('course-2', 'module-2', 'Module 2: The "Why Us" Answer', 2),
  ('course-2', 'module-3', 'Module 3: Your Story Bank', 3),
  ('course-2', 'module-4', 'Module 4: Closing Strong', 4)
on conflict (course_id, id) do update
set title = excluded.title,
    sort_order = excluded.sort_order;

alter table public.resources
  add column if not exists module_id text;

update public.resources
set module_id = 'module-' || substring(title from '([1-4])$')
where course_id = 'course-2'
  and module_id is null
  and title ~* '^DSA Module [1-4]$';

alter table public.resources
  drop constraint if exists resources_course_module_fkey;

alter table public.resources
  add constraint resources_course_module_fkey
  foreign key (course_id, module_id)
  references public.course_modules (course_id, id);

create index if not exists idx_resources_course_module
  on public.resources(course_id, module_id);

alter table public.course_modules enable row level security;

comment on column public.resources.module_id is
  'Optional module identifier; constrained to a module belonging to the same course.';
