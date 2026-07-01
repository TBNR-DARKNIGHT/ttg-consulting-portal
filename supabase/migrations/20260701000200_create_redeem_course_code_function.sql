create or replace function public.redeem_course_code(
  p_code_hash text,
  p_user_id uuid
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code public.access_codes%rowtype;
begin
  if p_code_hash is null or length(p_code_hash) <> 64 then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_CODE';
  end if;

  if p_user_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'USER_NOT_FOUND';
  end if;

  -- Lock the code so only one transaction can redeem it.
  select *
  into v_code
  from public.access_codes
  where code_hash = lower(p_code_hash)
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_CODE';
  end if;

  if v_code.redeemed_at is not null
    or v_code.redeemed_by_user_id is not null then
    raise exception using
      errcode = 'P0001',
      message = 'CODE_ALREADY_REDEEMED';
  end if;

  if v_code.expires_at is not null
    and v_code.expires_at <= now() then
    raise exception using
      errcode = 'P0001',
      message = 'CODE_EXPIRED';
  end if;

  -- Lock the user to serialize attempts to redeem different codes for the
  -- same course at the same time.
  perform 1
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'USER_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.course_entitlements
    where user_id = p_user_id
      and course_id = v_code.course_id
      and revoked_at is null
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ALREADY_ENTITLED';
  end if;

  -- A previously revoked entitlement may be restored by redeeming a new code.
  insert into public.course_entitlements (
    user_id,
    course_id,
    source,
    source_reference,
    granted_at,
    revoked_at
  )
  values (
    p_user_id,
    v_code.course_id,
    'access_code',
    coalesce(v_code.order_id, v_code.id::text),
    now(),
    null
  )
  on conflict (user_id, course_id)
  do update set
    source = excluded.source,
    source_reference = excluded.source_reference,
    granted_at = excluded.granted_at,
    revoked_at = null;

  update public.access_codes
  set
    redeemed_by_user_id = p_user_id,
    redeemed_at = now()
  where id = v_code.id;

  return v_code.course_id;
end;
$$;

comment on function public.redeem_course_code(text, uuid) is
  'Atomically consumes one transferable access code and grants its course entitlement.';

revoke execute on function public.redeem_course_code(text, uuid)
  from public, anon, authenticated;

grant execute on function public.redeem_course_code(text, uuid)
  to service_role;
