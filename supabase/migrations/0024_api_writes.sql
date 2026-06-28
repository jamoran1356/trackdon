-- Migration 0024: soportar escritura desde API keys (terceros)
--
-- Agrega:
-- - donaciones.external_ref text + donaciones.via_api_key_id uuid
--   (idempotencia: misma api_key + mismo external_ref → no duplica)
-- - donaciones.creado_via_api_at timestamptz
-- - tabla api_call_log para auditar requests por api_key
-- - RPC api_key_recent_calls(p_api_key_id, p_minutes) para rate-limit

alter table public.donaciones
  add column if not exists external_ref text,
  add column if not exists via_api_key_id uuid references public.api_keys(id) on delete set null,
  add column if not exists creado_via_api_at timestamptz;

create unique index if not exists donaciones_apikey_extref_idx
  on public.donaciones (via_api_key_id, external_ref)
  where via_api_key_id is not null and external_ref is not null;

create table if not exists public.api_call_log (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete set null,
  metodo text not null,
  ruta text not null,
  status_code int,
  ip_hash text,
  user_agent text,
  request_bytes int,
  response_bytes int,
  duracion_ms int,
  error text,
  creado_at timestamptz not null default now()
);

alter table public.api_call_log enable row level security;
revoke all on public.api_call_log from anon, authenticated;

create index if not exists api_call_log_key_idx on public.api_call_log (api_key_id, creado_at desc);
create index if not exists api_call_log_creado_idx on public.api_call_log (creado_at desc);

create or replace function public.api_key_recent_calls(p_api_key_id uuid, p_minutes int)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.api_call_log
  where api_key_id = p_api_key_id
    and creado_at > now() - (p_minutes || ' minutes')::interval
$$;

grant execute on function public.api_key_recent_calls(uuid, int) to authenticated;
