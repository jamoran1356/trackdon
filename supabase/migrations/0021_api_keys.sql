-- Migration 0021: API keys para integración con sistemas externos
--
-- Permite que organizaciones aliadas (otros sitios de tracking de donaciones)
-- consuman el ledger público de trackdon vía REST con autenticación.
-- Scopes determinan qué endpoints puede llamar la key.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  key_prefix text not null unique,         -- 8 chars visibles (ej. tk_a3f2b1)
  key_hash text not null unique,           -- sha256 del key completo (no se guarda plain)
  scopes text[] not null default '{read}'::text[],
  creado_por_auth_id uuid references auth.users(id),
  creado_at timestamptz not null default now(),
  expira_at timestamptz,
  revocada_at timestamptz,
  last_used_at timestamptz,
  call_count bigint not null default 0
);

alter table public.api_keys enable row level security;
revoke all on public.api_keys from anon, authenticated;
create index if not exists api_keys_prefix_idx on public.api_keys (key_prefix);
create index if not exists api_keys_active_idx on public.api_keys (revocada_at) where revocada_at is null;
