create or replace function public.admin_delete_revoked_access_codes(
  p_reason text,
  p_actor_user_id uuid
)
returns setof uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code_ids uuid[];
  v_code_id uuid;
begin
  if length(trim(p_reason)) < 3 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select array_agg(candidate.id)
  into v_code_ids
  from (
    select code.id
    from public.access_codes code
    where code.revoked_at is not null
      and code.redeemed_at is null
      and not exists (
        select 1
        from public.access_codes replacement
        where replacement.replacement_for_code_id = code.id
      )
    for update
  ) candidate;

  if v_code_ids is null then
    return;
  end if;

  foreach v_code_id in array v_code_ids loop
    insert into public.admin_audit_log (
      actor_user_id, action, target_type, target_id, details
    )
    values (
      p_actor_user_id,
      'access_code.deleted',
      'access_code',
      v_code_id,
      jsonb_build_object('reason', trim(p_reason), 'previous_status', 'revoked')
    );
  end loop;

  delete from public.access_codes
  where id = any(v_code_ids);

  return query select unnest(v_code_ids);
end;
$$;

revoke execute on function public.admin_delete_revoked_access_codes(text, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_delete_revoked_access_codes(text, uuid)
  to service_role;
