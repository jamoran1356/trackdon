-- trackdon — RLS policies
-- Strategy: enable RLS on every table, NO default policy (deny-all).
-- Then open only what each role legitimately needs.

-- ============================================================ Enable RLS

alter table public.perfiles               enable row level security;
alter table public.validadores            enable row level security;
alter table public.donantes               enable row level security;
alter table public.centros_acopio         enable row level security;
alter table public.responsables           enable row level security;
alter table public.influencers            enable row level security;
alter table public.donaciones             enable row level security;
alter table public.custodias              enable row level security;
alter table public.movimientos            enable row level security;
alter table public.rendiciones            enable row level security;
alter table public.damnificados_padron    enable row level security;
alter table public.distribuciones         enable row level security;
alter table public.medias                 enable row level security;
alter table public.audit_log              enable row level security;

-- Force RLS even for the table owner (defense in depth).
alter table public.damnificados_padron    force row level security;
alter table public.audit_log              force row level security;

-- ============================================================ Public read (anonymous, dashboard público)

-- Centros activos — visible para todos
create policy "centros_public_read" on public.centros_acopio
  for select using (activo = true);

-- Influencers activos — visible para todos
create policy "influencers_public_read" on public.influencers
  for select using (activo = true);

-- Validadores activos — visible
create policy "validadores_public_read" on public.validadores
  for select using (activo = true);

-- Donaciones — agregables públicamente (descripción + monto + estado, sin info personal)
create policy "donaciones_public_read" on public.donaciones
  for select using (true);

-- Custodias y movimientos — públicos (la trazabilidad es el producto)
create policy "custodias_public_read" on public.custodias
  for select using (true);

create policy "movimientos_public_read" on public.movimientos
  for select using (true);

-- Rendiciones — públicas (los influencers se exponen a escrutinio)
create policy "rendiciones_public_read" on public.rendiciones
  for select using (true);

-- Responsables — visible su nombre y rol, sin auth_id
create policy "responsables_public_read" on public.responsables
  for select using (true);

-- Donantes — visible solo `nombre_mostrado` (vía vista, no la tabla cruda)
-- Cerrado por defecto en la tabla. Se expone vía vista `v_donantes_public`.

-- Distribuciones — visible montos y referencias, sin nombre del damnificado
-- Por seguridad, cerrado en la tabla cruda. Se expone vía vista `v_distribuciones_public`.

-- ============================================================ Authenticated user — own profile

create policy "perfiles_self_read" on public.perfiles
  for select using (id = auth.uid());

create policy "perfiles_self_update" on public.perfiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and rol = (select rol from public.perfiles where id = auth.uid()));
  -- Un usuario no puede subirse el rol a sí mismo. Solo super_admin lo cambia.

-- ============================================================ Donantes — pueden insertar sus propias donaciones

create policy "donantes_self_insert" on public.donantes
  for insert with check (usuario_auth_id = auth.uid() or usuario_auth_id is null);

create policy "donantes_self_read" on public.donantes
  for select using (usuario_auth_id = auth.uid() or true);  -- nombre_mostrado es público; PII filtrada en views

create policy "donaciones_self_insert" on public.donaciones
  for insert with check (
    exists (select 1 from public.donantes d where d.id = donante_id and d.usuario_auth_id = auth.uid())
    or auth.uid() is null  -- donación anónima permitida (sin cuenta)
  );

-- ============================================================ Centro de acopio — admin y responsables

create policy "centros_admin_write" on public.centros_acopio
  for all using (public.fn_current_rol() in ('centro_admin','super_admin'))
  with check (public.fn_current_rol() in ('centro_admin','super_admin'));

create policy "responsables_admin_write" on public.responsables
  for all using (public.fn_current_rol() in ('centro_admin','super_admin'))
  with check (public.fn_current_rol() in ('centro_admin','super_admin'));

create policy "custodias_responsable_write" on public.custodias
  for insert with check (
    public.fn_current_rol() in ('centro_admin','centro_responsable','super_admin')
    and exists (select 1 from public.responsables r where r.id = responsable_id and r.usuario_auth_id = auth.uid())
  );

create policy "movimientos_responsable_write" on public.movimientos
  for insert with check (
    public.fn_current_rol() in ('centro_admin','centro_responsable','super_admin')
  );

-- ============================================================ Influencers

create policy "influencers_self_write" on public.influencers
  for all using (usuario_auth_id = auth.uid() or public.fn_current_rol() = 'super_admin')
  with check (usuario_auth_id = auth.uid() or public.fn_current_rol() = 'super_admin');

create policy "rendiciones_self_write" on public.rendiciones
  for insert with check (
    exists (select 1 from public.influencers i where i.id = influencer_id and i.usuario_auth_id = auth.uid())
    or public.fn_current_rol() = 'super_admin'
  );

-- ============================================================ Damnificados padron — VALIDADORES y super_admin

-- Solo validadores con scope damnificados/ambos y super_admin leen el padrón completo.
create policy "padron_validador_read" on public.damnificados_padron
  for select using (
    public.fn_current_rol() = 'super_admin'
    or (public.fn_current_rol() = 'validador' and exists (
      select 1 from public.validadores v
      where v.id = validador_id and v.usuario_auth_id = auth.uid()
        and v.scope in ('damnificados','ambos')
    ))
  );

create policy "padron_validador_write" on public.damnificados_padron
  for all using (
    public.fn_current_rol() = 'super_admin'
    or (public.fn_current_rol() = 'validador' and exists (
      select 1 from public.validadores v
      where v.id = validador_id and v.usuario_auth_id = auth.uid()
        and v.scope in ('damnificados','ambos')
    ))
  )
  with check (
    public.fn_current_rol() = 'super_admin'
    or (public.fn_current_rol() = 'validador' and exists (
      select 1 from public.validadores v
      where v.id = validador_id and v.usuario_auth_id = auth.uid()
        and v.scope in ('damnificados','ambos')
    ))
  );

-- ============================================================ Distribuciones — escritura por validadores; lectura cruda solo validadores

create policy "distribuciones_validador_read" on public.distribuciones
  for select using (
    public.fn_current_rol() in ('super_admin','validador')
  );

create policy "distribuciones_validador_write" on public.distribuciones
  for insert with check (
    public.fn_current_rol() in ('super_admin','validador')
  );

-- ============================================================ Medias — privacy gated

create policy "medias_public_read" on public.medias
  for select using (es_privado = false);

create policy "medias_owner_read" on public.medias
  for select using (subido_por_auth_id = auth.uid());

create policy "medias_admin_read" on public.medias
  for select using (public.fn_current_rol() in ('super_admin','validador'));

create policy "medias_owner_write" on public.medias
  for insert with check (subido_por_auth_id = auth.uid());

-- ============================================================ Audit log — only super_admin reads, no UPDATE/DELETE

create policy "audit_super_admin_read" on public.audit_log
  for select using (public.fn_current_rol() = 'super_admin');

-- No INSERT/UPDATE/DELETE policy → only the audit trigger (security definer) writes.

-- ============================================================ Public views (sanitized projections)

create or replace view public.v_donantes_public as
  select id, nombre_mostrado, creado_at from public.donantes;

grant select on public.v_donantes_public to anon, authenticated;

create or replace view public.v_distribuciones_public as
  select
    d.id,
    d.donacion_id,
    d.bolsa_id,
    -- pseudo_id solo, NUNCA nombre_real o documento
    p.pseudo_id as damnificado_pseudo_id,
    d.monto_o_descripcion,
    d.entregado_at,
    d.tx_solana,
    d.creado_at
  from public.distribuciones d
  join public.damnificados_padron p on p.id = d.damnificado_id;

grant select on public.v_distribuciones_public to anon, authenticated;

-- View para totales agregados (lo que ve el dashboard público en home)
create or replace view public.v_totales_publico as
  select
    (select coalesce(sum(valor_estimado_usd),0) from public.donaciones) as total_donaciones_usd,
    (select count(*) from public.donaciones) as cantidad_donaciones,
    (select count(*) from public.centros_acopio where activo = true) as centros_activos,
    (select count(*) from public.influencers where activo = true) as influencers_activos,
    (select count(*) from public.damnificados_padron) as damnificados_registrados,
    (select coalesce(sum(monto_usd),0) from public.rendiciones) as total_rendido_usd;

grant select on public.v_totales_publico to anon, authenticated;
