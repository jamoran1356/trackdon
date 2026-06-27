-- Migration 0020: centro dashboard extendido + onboarding unificado
--
-- 1) otp_codes: soporta signup combinado (user + centro o user + influencer)
-- 2) centros_puntos_recepcion: ubicaciones físicas adicionales del centro
-- 3) centros_costos: gastos operativos asociados al centro

alter table public.otp_codes
  add column if not exists tipo_signup text not null default 'user'
    check (tipo_signup in ('user', 'centro', 'influencer')),
  add column if not exists extra_data jsonb;

create table if not exists public.centros_puntos_recepcion (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id) on delete cascade,
  nombre text not null,
  direccion text,
  geo_lat double precision,
  geo_lng double precision,
  horario text,
  capacidad_estimada text,
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

alter table public.centros_puntos_recepcion enable row level security;
revoke all on public.centros_puntos_recepcion from anon, authenticated;
create index if not exists cpr_centro_idx on public.centros_puntos_recepcion (centro_id, activo);

create policy cpr_owner_all on public.centros_puntos_recepcion
  for all using (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1 from public.responsables r
      where r.centro_id = centros_puntos_recepcion.centro_id
        and r.usuario_auth_id = auth.uid()
    )
  );

create policy cpr_public_read on public.centros_puntos_recepcion
  for select using (activo = true);

grant select on public.centros_puntos_recepcion to anon, authenticated;

-- Costos operativos del centro
create table if not exists public.centros_costos (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id) on delete cascade,
  categoria text not null check (categoria in (
    'combustible', 'mantenimiento_vehiculo', 'mano_de_obra',
    'alquiler', 'servicios', 'logistica', 'empaque', 'otros'
  )),
  descripcion text,
  monto_usd numeric not null check (monto_usd >= 0),
  fecha date not null default current_date,
  comprobante_media_id uuid references public.medias(id),
  creado_por_auth_id uuid references auth.users(id),
  creado_at timestamptz not null default now()
);

alter table public.centros_costos enable row level security;
revoke all on public.centros_costos from anon, authenticated;
create index if not exists ccost_centro_idx on public.centros_costos (centro_id, fecha desc);

create policy ccost_owner_all on public.centros_costos
  for all using (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1 from public.responsables r
      where r.centro_id = centros_costos.centro_id
        and r.usuario_auth_id = auth.uid()
    )
  );

-- Vista de stats del centro (para dashboard)
create or replace view public.v_centro_stats as
select
  c.id as centro_id,
  c.nombre,
  coalesce(cajas.recibidas, 0) as cajas_recibidas,
  coalesce(cajas.en_transito, 0) as cajas_en_transito,
  coalesce(cajas.distribuidas, 0) as cajas_distribuidas,
  coalesce(p.personal_activo, 0) as personal_activo,
  coalesce(v.vehiculos_total, 0) as vehiculos_total,
  coalesce(pr.puntos_activos, 0) as puntos_recepcion,
  coalesce(co.costo_total_usd, 0) as costo_total_usd,
  coalesce(co.costo_mes_actual_usd, 0) as costo_mes_actual_usd
from public.centros_acopio c
left join (
  select centro_destino_id,
    count(*) filter (where estado = 'recibida') as recibidas,
    count(*) filter (where estado in ('en_camion','en_via','recibida')) as en_transito,
    count(*) filter (where estado = 'distribuida') as distribuidas
  from public.cajas group by centro_destino_id
) cajas on cajas.centro_destino_id = c.id
left join (
  select centro_id, count(*) as personal_activo
  from public.centro_personal where activo = true group by centro_id
) p on p.centro_id = c.id
left join (
  select centro_id, count(*) as vehiculos_total
  from public.centros_camiones group by centro_id
) v on v.centro_id = c.id
left join (
  select centro_id, count(*) as puntos_activos
  from public.centros_puntos_recepcion where activo = true group by centro_id
) pr on pr.centro_id = c.id
left join (
  select centro_id,
    sum(monto_usd) as costo_total_usd,
    sum(monto_usd) filter (where date_trunc('month', fecha) = date_trunc('month', current_date)) as costo_mes_actual_usd
  from public.centros_costos group by centro_id
) co on co.centro_id = c.id;

grant select on public.v_centro_stats to authenticated;
