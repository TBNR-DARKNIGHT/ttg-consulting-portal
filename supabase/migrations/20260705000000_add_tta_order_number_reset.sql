create or replace function public.admin_reset_tta_order_numbering(
  p_reason text,
  p_actor_user_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if length(trim(p_reason)) < 3 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  if exists (
    select 1
    from public.access_codes
    where order_id ~ '^TTA-STUDENT-[0-9]+$'
      and revoked_at is null
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACTIVE_TTA_CODES_EXIST';
  end if;

  perform setval('public.tta_student_order_number_seq', 1, false);

  insert into public.admin_audit_log (
    actor_user_id, action, target_type, details
  )
  values (
    p_actor_user_id,
    'access_code.tta_numbering_reset',
    'sequence',
    jsonb_build_object(
      'reason', trim(p_reason),
      'next_order_id', 'TTA-STUDENT-0001'
    )
  );

  return 'TTA-STUDENT-0001';
end;
$$;

revoke execute on function public.admin_reset_tta_order_numbering(text, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_reset_tta_order_numbering(text, uuid)
  to service_role;
