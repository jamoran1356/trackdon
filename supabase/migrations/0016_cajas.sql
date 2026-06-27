-- Migration 0016: cajas (inventario empacado por donantes, trackeado por centros)
--
-- Flow:
--   donante crea borrador → agrega items → asigna centro → sella
--   centro recibe → cambia estado: en_camion → en_via → distribuida
--   al distribuir registra receptor (texto + evidencia opcional)
--
-- Estados (caja.estado):
--   borrador      ← editable, sin centro fijo aún
--   sellada       ← inmutable items, en espera de recibo
--   recibida      ← centro confirmó recepción
--   en_camion     ← cargada para envío
--   en_via        ← en tránsito al destino
--   distribuida   ← entregada al beneficiario final

create type public.caja_estado as enum (
  'borrador', 'sellada', 'recibida', 'en_camion', 'en_via', 'distribuida'
);

create sequence if not exists public.cajas_codigo_seq start 1000;

create table if not exists public.cajas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default 'BOX-' || lpad(nextval('public.cajas_codigo_seq')::text, 6, '0'),
  donante_auth_id uuid not null references auth.users(id) on delete cascade,
  evento_id uuid references public.eventos(id) on delete set null,
  centro_destino_id uuid references public.centros_acopio(id) on delete set null,
  titulo text,
  estado public.caja_estado not null default 'borrador',
  receptor_descripcion text,
  receptor_evidencia_media_id uuid references public.medias(id),
  creado_at timestamptz not null default now(),
  sellada_at timestamptz,
  recibida_at timestamptz,
  en_camion_at timestamptz,
  en_via_at timestamptz,
  distribuida_at timestamptz,
  actualizada_at timestamptz not null default now()
);

alter table public.cajas enable row level security;
revoke all on public.cajas from anon, authenticated;
create index if not exists cajas_donante_idx on public.cajas (donante_auth_id, creado_at desc);
create index if not exists cajas_centro_idx on public.cajas (centro_destino_id, estado, creado_at desc);
create index if not exists cajas_estado_idx on public.cajas (estado, creado_at desc);

-- Lecturas:
--   donante: sus cajas
--   centro_admin/responsable: cajas asignadas a su centro
--   super_admin/validador: todas
--   anon (público): solo cajas selladas+ (no borradores) → para el explorador
create policy cajas_donante_read on public.cajas
  for select using (donante_auth_id = auth.uid());

create policy cajas_centro_read on public.cajas
  for select using (
    centro_destino_id is not null
    and exists (
      select 1 from public.responsables r
      where r.centro_id = cajas.centro_destino_id
        and r.usuario_auth_id = auth.uid()
    )
  );

create policy cajas_admin_read on public.cajas
  for select using (public.fn_current_rol() in ('super_admin', 'validador'));

create policy cajas_public_read on public.cajas
  for select using (estado <> 'borrador');

create policy cajas_donante_insert on public.cajas
  for insert with check (donante_auth_id = auth.uid());

create policy cajas_donante_update on public.cajas
  for update using (
    donante_auth_id = auth.uid() and estado = 'borrador'
  );

-- Items por caja
create table if not exists public.caja_items (
  id uuid primary key default gen_random_uuid(),
  caja_id uuid not null references public.cajas(id) on delete cascade,
  descripcion text not null,
  cantidad numeric not null check (cantidad > 0),
  unidad text not null default 'unidad',
  subcategoria text,
  notas text,
  creado_at timestamptz not null default now()
);

alter table public.caja_items enable row level security;
revoke all on public.caja_items from anon, authenticated;
create index if not exists caja_items_caja_idx on public.caja_items (caja_id);

create policy caja_items_owner_read on public.caja_items
  for select using (
    exists (
      select 1 from public.cajas c
      where c.id = caja_items.caja_id
        and (
          c.donante_auth_id = auth.uid()
          or public.fn_current_rol() in ('super_admin', 'validador')
          or exists (
            select 1 from public.responsables r
            where r.centro_id = c.centro_destino_id and r.usuario_auth_id = auth.uid()
          )
        )
    )
  );

create policy caja_items_public_read on public.caja_items
  for select using (
    exists (select 1 from public.cajas c where c.id = caja_items.caja_id and c.estado <> 'borrador')
  );

create policy caja_items_donante_write on public.caja_items
  for all using (
    exists (
      select 1 from public.cajas c
      where c.id = caja_items.caja_id
        and c.donante_auth_id = auth.uid()
        and c.estado = 'borrador'
    )
  );

-- Log inmutable de cambios de estado (auditoría / línea de tiempo pública)
create table if not exists public.caja_eventos (
  id uuid primary key default gen_random_uuid(),
  caja_id uuid not null references public.cajas(id) on delete cascade,
  estado_anterior public.caja_estado,
  estado_nuevo public.caja_estado not null,
  actor_auth_id uuid references auth.users(id),
  nota text,
  creado_at timestamptz not null default now()
);

alter table public.caja_eventos enable row level security;
revoke all on public.caja_eventos from anon, authenticated;
create index if not exists caja_eventos_caja_idx on public.caja_eventos (caja_id, creado_at desc);

create policy caja_eventos_public_read on public.caja_eventos
  for select using (
    exists (select 1 from public.cajas c where c.id = caja_eventos.caja_id and c.estado <> 'borrador')
  );

-- Trigger: registrar cambio de estado en caja_eventos + sincronizar timestamps
create or replace function public.fn_cajas_track_estado()
returns trigger
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
begin
  new.actualizada_at := now();

  if tg_op = 'INSERT' then
    insert into public.caja_eventos (caja_id, estado_anterior, estado_nuevo, actor_auth_id)
    values (new.id, null, new.estado, v_actor);
    return new;
  end if;

  if new.estado <> old.estado then
    -- Sincronizar timestamps por estado
    if new.estado = 'sellada' and new.sellada_at is null then new.sellada_at := now(); end if;
    if new.estado = 'recibida' and new.recibida_at is null then new.recibida_at := now(); end if;
    if new.estado = 'en_camion' and new.en_camion_at is null then new.en_camion_at := now(); end if;
    if new.estado = 'en_via' and new.en_via_at is null then new.en_via_at := now(); end if;
    if new.estado = 'distribuida' and new.distribuida_at is null then new.distribuida_at := now(); end if;

    insert into public.caja_eventos (caja_id, estado_anterior, estado_nuevo, actor_auth_id)
    values (new.id, old.estado, new.estado, v_actor);
  end if;

  return new;
end;
$$;

drop trigger if exists cajas_track on public.cajas;
create trigger cajas_track
  before insert or update on public.cajas
  for each row execute function public.fn_cajas_track_estado();
