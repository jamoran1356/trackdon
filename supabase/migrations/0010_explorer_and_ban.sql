-- Migration 0010: explorador público + ban + inventario de centros + tx hashes
--
-- Cambios:
--   * perfiles: anon_id público (u_NNNNN), banned_at + motivo, email_cache
--   * influencers: tx_hashes (jsonb)
--   * rendiciones / distribuciones: poblacion_destino, beneficiarios_cantidad, galeria_media_ids
--   * Nuevas tablas: centros_voluntarios, centros_camiones, centros_inventario

-- 1) perfiles: anon_id + ban
create sequence if not exists public.perfiles_anon_seq start 10000;

alter table public.perfiles
  add column if not exists anon_id text unique,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_motivo text;

update public.perfiles
set anon_id = 'u_' || lpad(nextval('public.perfiles_anon_seq')::text, 5, '0')
where anon_id is null;

alter table public.perfiles
  alter column anon_id set default 'u_' || lpad(nextval('public.perfiles_anon_seq')::text, 5, '0'),
  alter column anon_id set not null;

-- 2) influencers: tx hashes públicos (transferencias recibidas)
alter table public.influencers
  add column if not exists tx_hashes jsonb not null default '[]'::jsonb;

-- 3) rendiciones: destino + beneficiarios + galería
alter table public.rendiciones
  add column if not exists poblacion_destino text,
  add column if not exists beneficiarios_cantidad integer,
  add column if not exists galeria_media_ids uuid[] not null default '{}';

-- 4) distribuciones: destino + beneficiarios
alter table public.distribuciones
  add column if not exists poblacion_destino text,
  add column if not exists beneficiarios_cantidad integer;

-- 5) Voluntarios por centro (count + última actualización)
create table if not exists public.centros_voluntarios (
  centro_id uuid primary key references public.centros_acopio(id) on delete cascade,
  cantidad integer not null default 0 check (cantidad >= 0),
  actualizado_at timestamptz not null default now(),
  actualizado_por uuid references auth.users(id)
);

alter table public.centros_voluntarios enable row level security;
revoke all on public.centros_voluntarios from anon, authenticated;

-- 6) Camiones por centro
create table if not exists public.centros_camiones (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id) on delete cascade,
  identificador text not null,
  capacidad_kg numeric,
  estado text not null default 'disponible' check (estado in ('disponible','cargando','en_ruta','descargando','mantenimiento')),
  ultima_carga_at timestamptz,
  creado_at timestamptz not null default now()
);

alter table public.centros_camiones enable row level security;
revoke all on public.centros_camiones from anon, authenticated;
create index if not exists centros_camiones_centro_idx on public.centros_camiones(centro_id);

-- 7) Inventario por centro/evento
create table if not exists public.centros_inventario (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id) on delete cascade,
  evento_id uuid references public.eventos(id) on delete set null,
  item_descripcion text not null,
  cantidad numeric not null default 0 check (cantidad >= 0),
  unidad text not null default 'unidad',
  estado text not null default 'en_recoleccion' check (estado in ('en_recoleccion','empacado','enviado','distribuido')),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

alter table public.centros_inventario enable row level security;
revoke all on public.centros_inventario from anon, authenticated;
create index if not exists centros_inventario_centro_idx on public.centros_inventario(centro_id);
create index if not exists centros_inventario_evento_idx on public.centros_inventario(evento_id);
