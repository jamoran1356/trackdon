-- Migration 0018: auditoría pública de influencers
--
-- Permite marcar influencers como sospechosos o desactivados cuando
-- no aportan transparencia: reciben donaciones, se toman fotos, pero
-- no publican rendiciones con comprobantes.

create type public.influencer_revision_estado as enum ('ok', 'sospechoso', 'desactivado');

alter table public.influencers
  add column if not exists revision_estado public.influencer_revision_estado not null default 'ok',
  add column if not exists revision_motivo text,
  add column if not exists revision_at timestamptz,
  add column if not exists revision_por_validador_id uuid references public.validadores(id);

create index if not exists influencers_revision_idx on public.influencers (revision_estado);

-- Vista de métricas para auditoría
create or replace view public.v_influencer_auditoria as
select
  i.id,
  i.slug,
  i.nombre_publico,
  i.verificado_at,
  i.revision_estado,
  i.revision_motivo,
  i.revision_at,
  i.activo,
  coalesce(d.total_recibido_usd, 0) as total_recibido_usd,
  coalesce(d.count_donaciones, 0) as count_donaciones,
  coalesce(r.total_rendido_usd, 0) as total_rendido_usd,
  coalesce(r.count_verificadas, 0) as rendiciones_verificadas,
  coalesce(r.count_pendientes, 0) as rendiciones_pendientes,
  case
    when coalesce(d.total_recibido_usd, 0) = 0 then null
    else round((coalesce(r.total_rendido_usd, 0) / d.total_recibido_usd) * 100, 1)
  end as ratio_rendicion_pct,
  coalesce(den.count_denuncias, 0) as denuncias_count
from public.influencers i
left join (
  select influencer_recibio_id, sum(valor_estimado_usd) as total_recibido_usd, count(*) as count_donaciones
  from public.donaciones
  where influencer_recibio_id is not null
  group by influencer_recibio_id
) d on d.influencer_recibio_id = i.id
left join (
  select
    influencer_id,
    sum(monto_usd) filter (where verificado_at is not null) as total_rendido_usd,
    count(*) filter (where verificado_at is not null) as count_verificadas,
    count(*) filter (where verificado_at is null and rechazado_at is null) as count_pendientes
  from public.rendiciones
  group by influencer_id
) r on r.influencer_id = i.id
left join (
  select target_influencer_id, count(*) as count_denuncias
  from public.denuncias
  where target_influencer_id is not null
  group by target_influencer_id
) den on den.target_influencer_id = i.id;

grant select on public.v_influencer_auditoria to authenticated;
