-- trackdon — initial schema
-- Convention:
--   - All tables have id uuid primary key + creado_at timestamptz default now()
--   - RLS enabled + deny-all by default; explicit policies opened per role
--   - Fields commented `🔒 PRIVATE` never appear in public queries

-- ============================================================ Extensions

create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ============================================================ Enums

create type donacion_tipo as enum ('bienes', 'dinero_cripto', 'dinero_fiat');
create type donacion_estado as enum ('pendiente', 'recibida', 'en_transito', 'distribuida');
create type centro_tipo as enum ('fisico', 'comprador_medicamentos');
create type validador_scope as enum ('centros', 'damnificados', 'ambos');
create type rendicion_destino as enum ('compra_insumos', 'transferencia_centro', 'entrega_directa', 'otro');
create type app_rol as enum (
  'donante',
  'centro_admin',
  'centro_responsable',
  'influencer',
  'validador',
  'super_admin'
);

-- ============================================================ Profiles (1-1 with auth.users)

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol app_rol not null default 'donante',
  nombre_mostrado text,
  creado_at timestamptz not null default now()
);

-- ============================================================ Validadores

create table public.validadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,                       -- nombre de la organización
  usuario_auth_id uuid references auth.users(id),
  wallet_pubkey text,
  scope validador_scope not null default 'ambos',
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

-- ============================================================ Donantes

create table public.donantes (
  id uuid primary key default gen_random_uuid(),
  usuario_auth_id uuid references auth.users(id),
  nombre_mostrado text not null,
  email_contacto text,                        -- 🔒 PRIVATE
  wallet_pubkey text,
  creado_at timestamptz not null default now()
);

-- ============================================================ Centros de acopio

create table public.centros_acopio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo centro_tipo not null,
  validador_id uuid not null references public.validadores(id),
  direccion text,
  geo_lat double precision,
  geo_lng double precision,
  responsable_principal_id uuid,              -- forward ref, set after responsables exists
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

-- ============================================================ Responsables

create table public.responsables (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros_acopio(id),
  usuario_auth_id uuid references auth.users(id),
  nombre text not null,
  rol text not null default 'voluntario',     -- coordinador, voluntario, contador
  kyc_credential text,                        -- fase 2
  creado_at timestamptz not null default now()
);

alter table public.centros_acopio
  add constraint centros_acopio_resp_fk
  foreign key (responsable_principal_id) references public.responsables(id);

-- ============================================================ Influencers

create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  nombre_publico text not null,
  usuario_auth_id uuid references auth.users(id),
  wallet_pubkey text,
  cuentas_fiat jsonb,                         -- 🔒 PRIVATE (Zelle alias, banks)
  validador_id uuid references public.validadores(id),
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

-- ============================================================ Donaciones

create table public.donaciones (
  id uuid primary key default gen_random_uuid(),
  donante_id uuid not null references public.donantes(id),
  tipo donacion_tipo not null,
  descripcion text,
  valor_estimado_usd numeric(14,2) not null default 0,
  centro_recibio_id uuid references public.centros_acopio(id),
  influencer_recibio_id uuid references public.influencers(id),
  estado donacion_estado not null default 'pendiente',
  tx_solana text,                             -- fase 2
  hash_descripcion text,                      -- fase 2
  creado_at timestamptz not null default now(),
  check (
    (centro_recibio_id is not null and influencer_recibio_id is null) or
    (centro_recibio_id is null and influencer_recibio_id is not null) or
    (centro_recibio_id is null and influencer_recibio_id is null) -- pendiente, sin destino aún
  )
);

create index on public.donaciones (centro_recibio_id);
create index on public.donaciones (influencer_recibio_id);
create index on public.donaciones (donante_id);
create index on public.donaciones (estado);

-- ============================================================ Custodias

create table public.custodias (
  id uuid primary key default gen_random_uuid(),
  donacion_id uuid not null references public.donaciones(id),
  centro_id uuid not null references public.centros_acopio(id),
  responsable_id uuid not null references public.responsables(id),
  recibido_at timestamptz not null default now(),
  notas text,
  tx_solana text,                             -- fase 2
  creado_at timestamptz not null default now()
);

create index on public.custodias (donacion_id);
create index on public.custodias (centro_id);

-- ============================================================ Movimientos entre centros

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  custodia_origen_id uuid not null references public.custodias(id),
  centro_destino_id uuid not null references public.centros_acopio(id),
  responsable_origen_id uuid not null references public.responsables(id),
  responsable_destino_id uuid references public.responsables(id),
  acta_media_id uuid,                         -- fk a public.medias
  tx_solana text,                             -- fase 2
  creado_at timestamptz not null default now()
);

-- ============================================================ Rendiciones (influencers)

create table public.rendiciones (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id),
  donacion_id uuid references public.donaciones(id),
  concepto text not null,
  monto_usd numeric(14,2) not null,
  destino_tipo rendicion_destino not null,
  comprobante_media_id uuid,                  -- fk a public.medias
  tx_solana text,                             -- fase 2
  creado_at timestamptz not null default now()
);

create index on public.rendiciones (influencer_id);

-- ============================================================ Damnificados (🔒 SENSITIVE)

create table public.damnificados_padron (
  id uuid primary key default gen_random_uuid(),
  pseudo_id text unique not null,             -- el que aparecería on-chain
  wallet_pubkey text,
  kyc_credential text,                        -- fase 2
  validador_id uuid not null references public.validadores(id),
  nombre_real text not null,                  -- 🔒 PRIVATE
  documento_identidad text,                   -- 🔒 PRIVATE
  metadatos_privados jsonb,                   -- 🔒 PRIVATE
  creado_at timestamptz not null default now()
);

create index on public.damnificados_padron (validador_id);

-- ============================================================ Distribuciones

create table public.distribuciones (
  id uuid primary key default gen_random_uuid(),
  donacion_id uuid references public.donaciones(id),
  bolsa_id uuid,                              -- agrupador opcional
  damnificado_id uuid not null references public.damnificados_padron(id),
  monto_o_descripcion text not null,
  recibo_media_id uuid,
  entregado_at timestamptz not null default now(),
  tx_solana text,                             -- fase 2
  creado_at timestamptz not null default now()
);

create index on public.distribuciones (donacion_id);
create index on public.distribuciones (damnificado_id);

-- ============================================================ Medias (with hash for fase 2)

create table public.medias (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  hash_sha256 text not null,
  mime_type text not null,
  subido_por_auth_id uuid references auth.users(id),
  es_privado boolean not null default true,
  creado_at timestamptz not null default now(),
  unique (bucket, path)
);

-- Patch forward refs
alter table public.movimientos
  add constraint movimientos_acta_fk foreign key (acta_media_id) references public.medias(id);
alter table public.rendiciones
  add constraint rendiciones_comprobante_fk foreign key (comprobante_media_id) references public.medias(id);
alter table public.distribuciones
  add constraint distribuciones_recibo_fk foreign key (recibo_media_id) references public.medias(id);

-- ============================================================ Audit log

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_auth_id uuid references auth.users(id),
  accion text not null,
  tabla text not null,
  registro_id uuid,
  payload jsonb,
  tx_solana text,                             -- fase 2
  timestamp timestamptz not null default now()
);

create index on public.audit_log (tabla, registro_id);
create index on public.audit_log (actor_auth_id);

-- ============================================================ Audit trigger

create or replace function public.fn_audit_changes()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (actor_auth_id, accion, tabla, registro_id, payload)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce((new).id, (old).id),
    case TG_OP
      when 'INSERT' then to_jsonb(new)
      when 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      when 'DELETE' then to_jsonb(old)
    end
  );
  return coalesce(new, old);
end;
$$;

-- Attach audit to sensitive tables
create trigger audit_damnificados
  after insert or update or delete on public.damnificados_padron
  for each row execute function public.fn_audit_changes();

create trigger audit_distribuciones
  after insert or update or delete on public.distribuciones
  for each row execute function public.fn_audit_changes();

create trigger audit_rendiciones
  after insert or update or delete on public.rendiciones
  for each row execute function public.fn_audit_changes();

create trigger audit_validadores
  after insert or update or delete on public.validadores
  for each row execute function public.fn_audit_changes();

-- ============================================================ Profile auto-creation

create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.perfiles (id, rol, nombre_mostrado)
  values (new.id, 'donante', coalesce(new.raw_user_meta_data->>'nombre', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ============================================================ Role helper

create or replace function public.fn_current_rol()
returns app_rol
language sql
stable
security definer
as $$
  select rol from public.perfiles where id = auth.uid();
$$;
