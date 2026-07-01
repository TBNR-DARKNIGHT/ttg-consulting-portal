create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),

  -- SHA-256 or HMAC-SHA-256 digest encoded as 64 hexadecimal characters.
  -- Plaintext redemption codes must never be stored.
  code_hash text not null unique
    check (char_length(code_hash) = 64),

  course_id text not null,
  order_id text unique,

  redeemed_by_user_id uuid
    references public.users(id)
    on delete restrict,

  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),

  constraint access_codes_redemption_state_check check (
    (
      redeemed_by_user_id is null
      and redeemed_at is null
    )
    or
    (
      redeemed_by_user_id is not null
      and redeemed_at is not null
    )
  )
);

create index if not exists idx_access_codes_course_id
  on public.access_codes(course_id);

create index if not exists idx_access_codes_redeemed_by_user_id
  on public.access_codes(redeemed_by_user_id);

alter table public.access_codes enable row level security;

comment on table public.access_codes is
  'Transferable, single-use course redemption codes; backend service-role access only.';

comment on column public.access_codes.code_hash is
  '64-character hexadecimal digest of a high-entropy code; never plaintext.';
