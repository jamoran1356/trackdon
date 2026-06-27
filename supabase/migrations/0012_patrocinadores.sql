-- Migration 0012: patrocinadores / apoyos de la iniciativa

create table if not exists public.patrocinadores (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  logo_url text not null,
  url text,
  orden integer not null default 0,
  activo boolean not null default true,
  creado_at timestamptz not null default now(),
  creado_por_auth_id uuid references auth.users(id)
);

alter table public.patrocinadores enable row level security;
revoke all on public.patrocinadores from anon, authenticated;

create index if not exists patrocinadores_orden_idx on public.patrocinadores (orden, creado_at desc);
