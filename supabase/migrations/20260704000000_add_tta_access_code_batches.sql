create or replace function public.admin_create_access_code_batch(
  p_code_hashes text[],
  p_course_id text,
  p_actor_user_id uuid
)
returns table(code_index integer, code_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_index integer;
  v_code_id uuid;
begin
  if coalesce(array_length(p_code_hashes, 1), 0) < 1
     or array_length(p_code_hashes, 1) > 500 then
    raise exception using errcode = '22023', message = 'INVALID_BATCH_SIZE';
  end if;

  for v_index in 1..array_length(p_code_hashes, 1) loop
    insert into public.access_codes (
      code_hash, course_id, created_by_user_id
    )
    values (
      lower(p_code_hashes[v_index]), p_course_id, p_actor_user_id
    )
    returning id into v_code_id;

    insert into public.admin_audit_log (
      actor_user_id, action, target_type, target_id, details
    )
    values (
      p_actor_user_id, 'access_code.created', 'access_code', v_code_id,
      jsonb_build_object(
        'course_id', p_course_id,
        'batch', 'TTA Students'
      )
    );

    code_index := v_index;
    code_id := v_code_id;
    return next;
  end loop;
end;
$$;

revoke execute on function public.admin_create_access_code_batch(text[], text, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_create_access_code_batch(text[], text, uuid)
  to service_role;
