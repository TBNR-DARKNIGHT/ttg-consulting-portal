alter table public.access_codes
  add column if not exists created_by_user_id uuid
    references public.users(id) on delete restrict,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by_user_id uuid
    references public.users(id) on delete restrict,
  add column if not exists revocation_reason text,
  add column if not exists replacement_for_code_id uuid
    references public.access_codes(id) on delete restrict;

alter table public.access_codes
  drop constraint if exists access_codes_order_id_key;

create unique index if not exists idx_access_codes_active_order_id
  on public.access_codes(order_id)
  where order_id is not null and revoked_at is null;

create unique index if not exists idx_access_codes_replacement
  on public.access_codes(replacement_for_code_id)
  where replacement_for_code_id is not null;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create or replace function public.admin_create_access_code(
  p_code_hash text,
  p_course_id text,
  p_order_id text,
  p_expires_at timestamptz,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code_id uuid;
begin
  insert into public.access_codes (
    code_hash, course_id, order_id, expires_at, created_by_user_id
  )
  values (
    lower(p_code_hash), p_course_id, nullif(trim(p_order_id), ''),
    p_expires_at, p_actor_user_id
  )
  returning id into v_code_id;

  insert into public.admin_audit_log (
    actor_user_id, action, target_type, target_id, details
  )
  values (
    p_actor_user_id, 'access_code.created', 'access_code', v_code_id,
    jsonb_build_object('course_id', p_course_id, 'order_id', nullif(trim(p_order_id), ''))
  );

  return v_code_id;
end;
$$;

create or replace function public.admin_revoke_access_code(
  p_code_id uuid,
  p_reason text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.access_codes
  set revoked_at = now(),
      revoked_by_user_id = p_actor_user_id,
      revocation_reason = trim(p_reason)
  where id = p_code_id
    and redeemed_at is null
    and revoked_at is null;

  if not found then
    raise exception using errcode = 'P0001', message = 'CODE_NOT_REVOCABLE';
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, target_type, target_id, details
  )
  values (
    p_actor_user_id, 'access_code.revoked', 'access_code', p_code_id,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

create or replace function public.admin_reissue_access_code(
  p_code_id uuid,
  p_new_code_hash text,
  p_reason text,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old public.access_codes%rowtype;
  v_new_id uuid;
begin
  select * into v_old
  from public.access_codes
  where id = p_code_id
  for update;

  if not found or v_old.redeemed_at is not null or v_old.revoked_at is not null then
    raise exception using errcode = 'P0001', message = 'CODE_NOT_REISSUABLE';
  end if;

  update public.access_codes
  set revoked_at = now(),
      revoked_by_user_id = p_actor_user_id,
      revocation_reason = trim(p_reason)
  where id = p_code_id;

  insert into public.access_codes (
    code_hash, course_id, order_id, expires_at, created_by_user_id,
    replacement_for_code_id
  )
  values (
    lower(p_new_code_hash), v_old.course_id, v_old.order_id, v_old.expires_at,
    p_actor_user_id, v_old.id
  )
  returning id into v_new_id;

  insert into public.admin_audit_log (
    actor_user_id, action, target_type, target_id, details
  )
  values (
    p_actor_user_id, 'access_code.reissued', 'access_code', v_new_id,
    jsonb_build_object('replaces_code_id', v_old.id, 'reason', trim(p_reason))
  );

  return v_new_id;
end;
$$;

revoke execute on function public.admin_create_access_code(text, text, text, timestamptz, uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_revoke_access_code(uuid, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_reissue_access_code(uuid, text, text, uuid)
  from public, anon, authenticated;

grant execute on function public.admin_create_access_code(text, text, text, timestamptz, uuid)
  to service_role;
grant execute on function public.admin_revoke_access_code(uuid, text, uuid)
  to service_role;
grant execute on function public.admin_reissue_access_code(uuid, text, text, uuid)
  to service_role;

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
    raise exception using errcode = 'P0001', message = 'INVALID_CODE';
  end if;

  select * into v_code
  from public.access_codes
  where code_hash = lower(p_code_hash)
  for update;

  if not found or v_code.revoked_at is not null then
    raise exception using errcode = 'P0001', message = 'INVALID_CODE';
  end if;
  if v_code.redeemed_at is not null then
    raise exception using errcode = 'P0001', message = 'CODE_ALREADY_REDEEMED';
  end if;
  if v_code.expires_at is not null and v_code.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'CODE_EXPIRED';
  end if;

  perform 1 from public.users where id = p_user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  if exists (
    select 1 from public.course_entitlements
    where user_id = p_user_id and course_id = v_code.course_id and revoked_at is null
  ) then
    raise exception using errcode = 'P0001', message = 'ALREADY_ENTITLED';
  end if;

  insert into public.course_entitlements (
    user_id, course_id, source, source_reference, granted_at, revoked_at
  )
  values (
    p_user_id, v_code.course_id, 'access_code',
    coalesce(v_code.order_id, v_code.id::text), now(), null
  )
  on conflict (user_id, course_id)
  do update set source = excluded.source,
    source_reference = excluded.source_reference,
    granted_at = excluded.granted_at, revoked_at = null;

  update public.access_codes
  set redeemed_by_user_id = p_user_id, redeemed_at = now()
  where id = v_code.id;

  return v_code.course_id;
end;
$$;

revoke execute on function public.redeem_course_code(text, uuid)
  from public, anon, authenticated;
grant execute on function public.redeem_course_code(text, uuid)
  to service_role;
