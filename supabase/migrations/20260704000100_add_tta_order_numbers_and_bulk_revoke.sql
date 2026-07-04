create sequence if not exists public.tta_student_order_number_seq;

do $$
declare
  v_last_number bigint;
begin
  select coalesce(max(substring(order_id from '^TTA-STUDENT-([0-9]+)$')::bigint), 0)
  into v_last_number
  from public.access_codes
  where order_id ~ '^TTA-STUDENT-[0-9]+$';

  if v_last_number > 0 then
    perform setval('public.tta_student_order_number_seq', v_last_number, true);
  else
    perform setval('public.tta_student_order_number_seq', 1, false);
  end if;
end;
$$;

drop function if exists public.admin_create_access_code_batch(text[], text, uuid);

create function public.admin_create_access_code_batch(
  p_code_hashes text[],
  p_course_id text,
  p_actor_user_id uuid
)
returns table(code_index integer, code_id uuid, order_id text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_index integer;
  v_code_id uuid;
  v_order_id text;
begin
  if coalesce(array_length(p_code_hashes, 1), 0) < 1
     or array_length(p_code_hashes, 1) > 500 then
    raise exception using errcode = '22023', message = 'INVALID_BATCH_SIZE';
  end if;

  for v_index in 1..array_length(p_code_hashes, 1) loop
    v_order_id := 'TTA-STUDENT-' ||
      lpad(nextval('public.tta_student_order_number_seq')::text, 4, '0');

    insert into public.access_codes (
      code_hash, course_id, order_id, created_by_user_id
    )
    values (
      lower(p_code_hashes[v_index]), p_course_id, v_order_id, p_actor_user_id
    )
    returning id into v_code_id;

    insert into public.admin_audit_log (
      actor_user_id, action, target_type, target_id, details
    )
    values (
      p_actor_user_id, 'access_code.created', 'access_code', v_code_id,
      jsonb_build_object(
        'course_id', p_course_id,
        'order_id', v_order_id,
        'batch', 'TTA Students'
      )
    );

    code_index := v_index;
    code_id := v_code_id;
    order_id := v_order_id;
    return next;
  end loop;
end;
$$;

create or replace function public.admin_revoke_all_active_access_codes(
  p_reason text,
  p_actor_user_id uuid
)
returns setof uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code_id uuid;
begin
  if length(trim(p_reason)) < 3 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  for v_code_id in
    update public.access_codes
    set revoked_at = now(),
        revoked_by_user_id = p_actor_user_id,
        revocation_reason = trim(p_reason)
    where redeemed_at is null
      and revoked_at is null
      and (expires_at is null or expires_at > now())
    returning id
  loop
    insert into public.admin_audit_log (
      actor_user_id, action, target_type, target_id, details
    )
    values (
      p_actor_user_id, 'access_code.revoked', 'access_code', v_code_id,
      jsonb_build_object('reason', trim(p_reason), 'bulk', true)
    );
    return next v_code_id;
  end loop;
end;
$$;

revoke execute on function public.admin_create_access_code_batch(text[], text, uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_revoke_all_active_access_codes(text, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_create_access_code_batch(text[], text, uuid)
  to service_role;
grant execute on function public.admin_revoke_all_active_access_codes(text, uuid)
  to service_role;
