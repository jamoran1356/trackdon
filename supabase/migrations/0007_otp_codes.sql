-- trackdon · migration 0007
-- OTP custom: la app genera el código, lo guarda hasheado y lo verifica.
-- Supabase Auth ya no manda email; solo guarda el user al final.

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nombre text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  ip text,
  user_agent text,
  creado_at timestamptz not null default now()
);

create index if not exists otp_codes_email_pending_idx
  on public.otp_codes (email)
  where consumed_at is null;
create index if not exists otp_codes_creado_idx on public.otp_codes (creado_at desc);

-- Rate limit por email: 5 requests / 24h. Trigger antes de insert.
create or replace function public.fn_check_otp_ratelimit()
returns trigger language plpgsql security definer as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.otp_codes
  where email = new.email and creado_at > now() - interval '24 hours';
  if v_count >= 5 then
    raise exception 'Rate limit: máximo 5 códigos por email en 24 horas';
  end if;
  return new;
end $$;

drop trigger if exists otp_codes_ratelimit on public.otp_codes;
create trigger otp_codes_ratelimit
  before insert on public.otp_codes
  for each row execute function public.fn_check_otp_ratelimit();

-- RLS: cerrado para anon. La app accede vía service_role (admin client).
alter table public.otp_codes enable row level security;
alter table public.otp_codes force row level security;
-- No policy → deny-all por default. Solo service_role bypassa.
