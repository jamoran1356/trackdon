-- trackdon · migration 0006
-- 1) Influencers: verificación por validador (badge "verificado")
-- 2) Denuncias: requiere usuario autenticado, rate-limit 5/día/usuario
-- 3) Open policy para que cualquier usuario autenticado pueda crear SU influencer

-- ============================================================ 1) Verificación de influencers

alter table public.influencers
  add column if not exists verificado_at timestamptz,
  add column if not exists verificado_por_validador_id uuid references public.validadores(id),
  add column if not exists rechazado_at timestamptz,
  add column if not exists rechazado_motivo text;

create index if not exists influencers_verif_idx
  on public.influencers (verificado_at)
  where verificado_at is not null;

-- ============================================================ 2) Influencer self-registration policies

-- Cualquier authenticated user puede insertarse a sí mismo como influencer
-- (con verificado_at NULL — un validador lo aprueba después).
drop policy if exists "influencers_self_insert" on public.influencers;
create policy "influencers_self_insert" on public.influencers
  for insert with check (auth.uid() = usuario_auth_id);

-- Dueño puede actualizar sus campos no críticos
drop policy if exists "influencers_self_update_safe" on public.influencers;
create policy "influencers_self_update_safe" on public.influencers
  for update using (usuario_auth_id = auth.uid())
  with check (
    usuario_auth_id = auth.uid()
    -- No puede cambiar verificación de sí mismo
    and verificado_at is not distinct from (select i.verificado_at from public.influencers i where i.id = id)
    and verificado_por_validador_id is not distinct from (select i.verificado_por_validador_id from public.influencers i where i.id = id)
    and validador_id is not distinct from (select i.validador_id from public.influencers i where i.id = id)
  );

-- Validadores pueden verificar/rechazar
drop policy if exists "influencers_validador_verify" on public.influencers;
create policy "influencers_validador_verify" on public.influencers
  for update using (public.fn_current_rol() in ('validador','super_admin'))
  with check (public.fn_current_rol() in ('validador','super_admin'));

-- ============================================================ 3) Denuncias: solo authenticated + rate limit

alter table public.denuncias
  add column if not exists reporter_auth_id uuid references auth.users(id);

create index if not exists denuncias_reporter_idx on public.denuncias (reporter_auth_id, creado_at desc);

-- Reemplaza policy de "anyone insert" → solo authenticated
drop policy if exists "denuncias_anyone_insert" on public.denuncias;

-- Rate limit por trigger: 5 denuncias / día / user
create or replace function public.fn_check_denuncia_ratelimit()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  if new.reporter_auth_id is null then
    raise exception 'reporter_auth_id requerido (auth.uid())';
  end if;
  select count(*) into v_count from public.denuncias
  where reporter_auth_id = new.reporter_auth_id
    and creado_at > now() - interval '24 hours';
  if v_count >= 5 then
    raise exception 'Rate limit: máximo 5 denuncias por usuario en 24 horas';
  end if;
  return new;
end $$;

drop trigger if exists denuncias_ratelimit on public.denuncias;
create trigger denuncias_ratelimit
  before insert on public.denuncias
  for each row execute function public.fn_check_denuncia_ratelimit();

-- Nueva policy: authenticated puede insertar su propia denuncia
drop policy if exists "denuncias_auth_insert" on public.denuncias;
create policy "denuncias_auth_insert" on public.denuncias
  for insert with check (auth.uid() = reporter_auth_id);

-- ============================================================ 4) Storage: denuncias bucket — solo authenticated

drop policy if exists "denuncias_anyone_write" on storage.objects;
drop policy if exists "denuncias_auth_write" on storage.objects;
create policy "denuncias_auth_write" on storage.objects
  for insert with check (
    bucket_id = 'denuncias' and auth.uid() is not null
  );

-- ============================================================ 5) Vista pública sin PII del reporter

create or replace view public.v_denuncias_resumen as
  select
    estado,
    count(*) as cantidad
  from public.denuncias
  group by estado;

grant select on public.v_denuncias_resumen to anon, authenticated;
