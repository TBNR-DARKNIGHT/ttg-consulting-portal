do $$
begin
  if exists (
    select 1
    from public.resources
    where course_id is null
  ) then
    raise exception
      'Cannot drop resources.category: one or more resources have no course_id';
  end if;
end
$$;

alter table public.resources
  drop column if exists category;
