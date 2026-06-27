-- Migration 0019: fix del trigger cajas_track
--
-- Bug: el trigger BEFORE INSERT intentaba insertar en caja_eventos
-- usando new.id, pero el row de cajas aún no existe → FK violation.
-- Fix: separar en dos triggers — BEFORE para timestamps, AFTER para log.

drop trigger if exists cajas_track on public.cajas;

create or replace function public.fn_cajas_touch()
returns trigger
language plpgsql
as $$
begin
  new.actualizada_at := now();
  if tg_op = 'UPDATE' and new.estado <> old.estado then
    if new.estado = 'sellada' and new.sellada_at is null then new.sellada_at := now(); end if;
    if new.estado = 'recibida' and new.recibida_at is null then new.recibida_at := now(); end if;
    if new.estado = 'en_camion' and new.en_camion_at is null then new.en_camion_at := now(); end if;
    if new.estado = 'en_via' and new.en_via_at is null then new.en_via_at := now(); end if;
    if new.estado = 'distribuida' and new.distribuida_at is null then new.distribuida_at := now(); end if;
  end if;
  return new;
end;
$$;

create or replace function public.fn_cajas_log_estado()
returns trigger
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.caja_eventos (caja_id, estado_anterior, estado_nuevo, actor_auth_id)
    values (new.id, null, new.estado, v_actor);
  elsif tg_op = 'UPDATE' and new.estado <> old.estado then
    insert into public.caja_eventos (caja_id, estado_anterior, estado_nuevo, actor_auth_id)
    values (new.id, old.estado, new.estado, v_actor);
  end if;
  return new;
end;
$$;

create trigger cajas_touch
  before insert or update on public.cajas
  for each row execute function public.fn_cajas_touch();

create trigger cajas_log
  after insert or update on public.cajas
  for each row execute function public.fn_cajas_log_estado();
