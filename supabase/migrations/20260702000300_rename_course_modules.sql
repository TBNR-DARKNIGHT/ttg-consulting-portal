insert into public.course_modules (course_id, id, title, sort_order)
values
  ('course-2', 'module-1', 'Module 1: The Research Edge', 1),
  ('course-2', 'module-2', 'Module 2: The "Why Us" Answer', 2),
  ('course-2', 'module-3', 'Module 3: Your Story Bank', 3),
  ('course-2', 'module-4', 'Module 4: Closing Strong', 4)
on conflict (course_id, id) do update
set title = excluded.title,
    sort_order = excluded.sort_order;
