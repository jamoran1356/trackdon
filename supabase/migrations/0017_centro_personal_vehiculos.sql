-- Migration 0017: personal, vehículos, asignaciones y acuso de cajas por centro

-- 1) centros_acopio: email de contacto público
alter table public.centros_acopio
  add column if not exists email_contacto text;

-- 2) Personal del centro (PII: cédula)
create table if not exists public.centro_personal (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id) on delete cascade,
  nombre text not null,
  cedula text,
  cargo text,
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

alter table public.centro_personal enable row level security;
revoke all on public.centro_personal from anon, authenticated;
create index if not exists centro_personal_centro_idx on public.centro_personal (centro_id);

-- Solo responsables del centro y super_admin pueden leer/escribir
create policy centro_personal_owner_all on public.centro_personal
  for all using (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1 from public.responsables r
      where r.centro_id = centro_personal.centro_id
        and r.usuario_auth_id = auth.uid()
    )
  );

-- 3) centros_camiones: extender con marca, modelo, placa
alter table public.centros_camiones
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists placa text;

create policy centros_camiones_owner_all on public.centros_camiones
  for all using (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1 from public.responsables r
      where r.centro_id = centros_camiones.centro_id
        and r.usuario_auth_id = auth.uid()
    )
  );

-- Lectura pública limitada (sin placa exacta — la mostramos enmascarada en el explorador)
create policy centros_camiones_public_read on public.centros_camiones
  for select using (true);

-- 4) Asignación personal ↔ vehículo (N:M)
create table if not exists public.centro_personal_vehiculo (
  id uuid primary key default gen_random_uuid(),
  personal_id uuid not null references public.centro_personal(id) on delete cascade,
  vehiculo_id uuid not null references public.centros_camiones(id) on delete cascade,
  activo boolean not null default true,
  asignado_at timestamptz not null default now(),
  unique (personal_id, vehiculo_id)
);

alter table public.centro_personal_vehiculo enable row level security;
revoke all on public.centro_personal_vehiculo from anon, authenticated;

create policy cpv_owner_all on public.centro_personal_vehiculo
  for all using (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1
      from public.centro_personal p
      join public.responsables r on r.centro_id = p.centro_id
      where p.id = centro_personal_vehiculo.personal_id
        and r.usuario_auth_id = auth.uid()
    )
  );

-- 5) Acusos por caja (recibo / entrega) con foto y firmante
create type public.acuso_tipo as enum ('recibo', 'entrega');

create table if not exists public.caja_acusos (
  id uuid primary key default gen_random_uuid(),
  caja_id uuid not null references public.cajas(id) on delete cascade,
  tipo public.acuso_tipo not null,
  foto_media_id uuid references public.medias(id),
  firmado_por_personal_id uuid references public.centro_personal(id),
  firmado_por_auth_id uuid references auth.users(id),
  notas text,
  creado_at timestamptz not null default now()
);

alter table public.caja_acusos enable row level security;
revoke all on public.caja_acusos from anon, authenticated;
create index if not exists caja_acusos_caja_idx on public.caja_acusos (caja_id, tipo);

-- Lectura: público puede ver acusos de cajas no-borrador (excepto datos del firmante).
-- Para simplicidad, lectura pública del row pero sin exponer cédulas (esas viven en centro_personal con RLS).
create policy caja_acusos_public_read on public.caja_acusos
  for select using (
    exists (select 1 from public.cajas c where c.id = caja_acusos.caja_id and c.estado <> 'borrador')
  );

create policy caja_acusos_centro_insert on public.caja_acusos
  for insert with check (
    public.fn_current_rol() = 'super_admin'::public.app_rol
    or exists (
      select 1
      from public.cajas c
      join public.responsables r on r.centro_id = c.centro_destino_id
      where c.id = caja_acusos.caja_id
        and r.usuario_auth_id = auth.uid()
    )
  );
