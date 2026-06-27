-- trackdon · migration 0005
-- Multi-evento: cada emergencia es un "evento" con su propio scope.
-- Centros, influencers, donaciones y damnificados se asocian a un evento
-- (nullable para mantener compat con filas pre-existentes).

-- ============================================================ Enum

do $$ begin
  create type evento_categoria as enum (
    'terremoto',
    'inundacion',
    'huracan',
    'incendio',
    'conflicto',
    'crisis_humanitaria',
    'otro'
  );
exception when duplicate_object then null; end $$;

-- ============================================================ Tabla eventos

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  lugar text,                                 -- texto libre (sin geocode)
  categoria evento_categoria not null default 'otro',
  banner_url text,
  fecha_inicio date,
  activo boolean not null default true,
  creado_por_auth_id uuid references auth.users(id),
  creado_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);

create index if not exists eventos_activo_idx on public.eventos (activo);
create unique index if not exists eventos_slug_lower_uidx
  on public.eventos (lower(slug));

drop trigger if exists eventos_touch on public.eventos;
create trigger eventos_touch
  before update on public.eventos
  for each row execute function public.fn_touch_updated();

alter table public.eventos enable row level security;

-- Lectura pública de eventos activos
drop policy if exists "eventos_public_read" on public.eventos;
create policy "eventos_public_read" on public.eventos
  for select using (activo = true);

-- Lectura completa solo super_admin
drop policy if exists "eventos_super_admin_read" on public.eventos;
create policy "eventos_super_admin_read" on public.eventos
  for select using (public.fn_current_rol() = 'super_admin');

-- Solo super_admin crea / edita
drop policy if exists "eventos_super_admin_write" on public.eventos;
create policy "eventos_super_admin_write" on public.eventos
  for all using (public.fn_current_rol() = 'super_admin')
  with check (public.fn_current_rol() = 'super_admin');

-- ============================================================ FK en tablas operativas

alter table public.centros_acopio
  add column if not exists evento_id uuid references public.eventos(id);
create index if not exists centros_evento_idx on public.centros_acopio (evento_id);

alter table public.influencers
  add column if not exists evento_id uuid references public.eventos(id);
create index if not exists influencers_evento_idx on public.influencers (evento_id);

alter table public.donaciones
  add column if not exists evento_id uuid references public.eventos(id);
create index if not exists donaciones_evento_idx on public.donaciones (evento_id);

alter table public.damnificados_padron
  add column if not exists evento_id uuid references public.eventos(id);
create index if not exists padron_evento_idx on public.damnificados_padron (evento_id);

-- ============================================================ Stats por evento

create or replace view public.v_evento_stats as
  select
    e.id as evento_id,
    e.slug,
    e.nombre,
    e.categoria,
    e.lugar,
    e.fecha_inicio,
    e.activo,
    coalesce((
      select sum(d.valor_estimado_usd) from public.donaciones d
      where d.evento_id = e.id
    ), 0) as total_donaciones_usd,
    (
      select count(*) from public.donaciones d
      where d.evento_id = e.id
    ) as cantidad_donaciones,
    (
      select count(*) from public.centros_acopio c
      where c.evento_id = e.id and c.activo = true
    ) as centros_activos,
    (
      select count(*) from public.influencers i
      where i.evento_id = e.id and i.activo = true
    ) as influencers_activos,
    (
      select count(*) from public.damnificados_padron p
      where p.evento_id = e.id
    ) as damnificados_registrados,
    coalesce((
      select sum(r.monto_usd) from public.rendiciones r
      join public.influencers i on i.id = r.influencer_id
      where i.evento_id = e.id and r.verificado_at is not null
    ), 0) as total_rendido_usd
  from public.eventos e
  where e.activo = true;

grant select on public.v_evento_stats to anon, authenticated;

-- ============================================================ Audit

drop trigger if exists audit_eventos on public.eventos;
create trigger audit_eventos
  after insert or update or delete on public.eventos
  for each row execute function public.fn_audit_changes();
