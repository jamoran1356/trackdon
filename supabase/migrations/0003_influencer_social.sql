-- trackdon · migration 0003
-- 1) Influencers: redes sociales + slug público
-- 2) Rendiciones: marca de verificación por validador (sólo lo verificado
--    cuenta como "entregado"); INSERT lleva verificado_at NULL por defecto.
-- 3) Vistas públicas actualizadas para reflejar la regla.

-- ============================================================ 1) Influencers social

alter table public.influencers
  add column if not exists slug text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists twitter_handle text,
  add column if not exists instagram_handle text,
  add column if not exists tiktok_handle text,
  add column if not exists youtube_handle text,
  add column if not exists website_url text;

-- Unique slug (case-insensitive) for stable /i/<slug> URLs.
create unique index if not exists influencers_slug_lower_uidx
  on public.influencers (lower(slug))
  where slug is not null;

-- Sanity: handles sin '@' (lo agrega la UI al renderizar)
alter table public.influencers
  drop constraint if exists influencers_twitter_no_at;
alter table public.influencers
  add constraint influencers_twitter_no_at check (twitter_handle is null or twitter_handle !~ '^@');

alter table public.influencers
  drop constraint if exists influencers_instagram_no_at;
alter table public.influencers
  add constraint influencers_instagram_no_at check (instagram_handle is null or instagram_handle !~ '^@');

alter table public.influencers
  drop constraint if exists influencers_tiktok_no_at;
alter table public.influencers
  add constraint influencers_tiktok_no_at check (tiktok_handle is null or tiktok_handle !~ '^@');

-- ============================================================ 2) Rendiciones verificadas

alter table public.rendiciones
  add column if not exists verificado_at timestamptz,
  add column if not exists verificado_por_validador_id uuid references public.validadores(id),
  add column if not exists rechazado_at timestamptz,
  add column if not exists rechazado_motivo text;

-- Si se rechaza, no puede estar también verificada
alter table public.rendiciones
  drop constraint if exists rendiciones_verif_xor_rechazo;
alter table public.rendiciones
  add constraint rendiciones_verif_xor_rechazo check (
    not (verificado_at is not null and rechazado_at is not null)
  );

create index if not exists rendiciones_verif_idx
  on public.rendiciones (influencer_id) where verificado_at is not null;

-- Solo validadores y super_admin marcan verificación
create policy "rendiciones_validador_verify" on public.rendiciones
  for update using (
    public.fn_current_rol() in ('validador','super_admin')
  )
  with check (
    public.fn_current_rol() in ('validador','super_admin')
  );

-- ============================================================ 3) Vistas públicas

-- Recalcula totales: rendido = sólo verificadas
create or replace view public.v_totales_publico as
  select
    (select coalesce(sum(valor_estimado_usd),0) from public.donaciones) as total_donaciones_usd,
    (select count(*) from public.donaciones) as cantidad_donaciones,
    (select count(*) from public.centros_acopio where activo = true) as centros_activos,
    (select count(*) from public.influencers where activo = true) as influencers_activos,
    (select count(*) from public.damnificados_padron) as damnificados_registrados,
    (select coalesce(sum(monto_usd),0) from public.rendiciones where verificado_at is not null) as total_rendido_usd,
    (select coalesce(sum(monto_usd),0) from public.rendiciones where verificado_at is null and rechazado_at is null) as total_pendiente_verif_usd;

grant select on public.v_totales_publico to anon, authenticated;

-- Vista del perfil público del influencer
create or replace view public.v_influencer_perfil as
  select
    i.id,
    i.slug,
    i.nombre_publico,
    i.bio,
    i.avatar_url,
    i.twitter_handle,
    i.instagram_handle,
    i.tiktok_handle,
    i.youtube_handle,
    i.website_url,
    i.activo,
    i.creado_at,
    (
      select coalesce(sum(d.valor_estimado_usd), 0)
      from public.donaciones d
      where d.influencer_recibio_id = i.id
    ) as recibido_usd,
    (
      select coalesce(sum(r.monto_usd), 0)
      from public.rendiciones r
      where r.influencer_id = i.id and r.verificado_at is not null
    ) as entregado_usd,
    (
      select coalesce(sum(r.monto_usd), 0)
      from public.rendiciones r
      where r.influencer_id = i.id and r.verificado_at is null and r.rechazado_at is null
    ) as pendiente_verif_usd,
    (
      select count(*) from public.rendiciones r
      where r.influencer_id = i.id and r.verificado_at is not null
    ) as rendiciones_verificadas_count
  from public.influencers i
  where i.activo = true;

grant select on public.v_influencer_perfil to anon, authenticated;

-- Rendiciones públicas (sólo verificadas con sus comprobantes)
create or replace view public.v_rendiciones_publico as
  select
    r.id,
    r.influencer_id,
    r.concepto,
    r.monto_usd,
    r.destino_tipo,
    r.verificado_at,
    v.nombre as verificado_por,
    r.creado_at
  from public.rendiciones r
  left join public.validadores v on v.id = r.verificado_por_validador_id
  where r.verificado_at is not null;

grant select on public.v_rendiciones_publico to anon, authenticated;
