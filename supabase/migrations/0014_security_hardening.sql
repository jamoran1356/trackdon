-- Migration 0014: cerrar fugas de RLS
--
-- 1) donantes_self_read tenía OR true → exposición total. Lo restringimos.
-- 2) INSERT policies con qual=null reciben WITH CHECK de identity.
-- 3) Refrescar política de patrocinadores para lectura pública solo de activos.

-- 1) donantes: que NO sea lectura pública. Solo el propio donante o admin.
drop policy if exists donantes_self_read on public.donantes;
create policy donantes_self_read on public.donantes
  for select
  using (
    usuario_auth_id = auth.uid()
    or public.fn_current_rol() = 'super_admin'::public.app_rol
    or public.fn_current_rol() = 'validador'::public.app_rol
  );

-- 2) INSERTs con with_check para identity / ownership
drop policy if exists rendiciones_self_write on public.rendiciones;
create policy rendiciones_self_write on public.rendiciones
  for insert
  with check (
    -- influencer que crea su propia rendición
    exists (
      select 1 from public.influencers i
      where i.id = rendiciones.influencer_id
        and i.usuario_auth_id = auth.uid()
    )
    or public.fn_current_rol() in ('super_admin', 'validador')
  );

drop policy if exists influencers_self_insert on public.influencers;
create policy influencers_self_insert on public.influencers
  for insert
  with check (
    usuario_auth_id = auth.uid()
    or public.fn_current_rol() = 'super_admin'::public.app_rol
  );

drop policy if exists donantes_self_insert on public.donantes;
create policy donantes_self_insert on public.donantes
  for insert
  with check (
    usuario_auth_id = auth.uid()
    or usuario_auth_id is null    -- anónimo permitido (donante invitado)
  );

-- 3) donaciones_self_insert: el donante debe ser el actual user
drop policy if exists donaciones_self_insert on public.donaciones;
create policy donaciones_self_insert on public.donaciones
  for insert
  with check (
    exists (
      select 1 from public.donantes d
      where d.id = donaciones.donante_id
        and (d.usuario_auth_id = auth.uid() or d.usuario_auth_id is null)
    )
    or public.fn_current_rol() = 'super_admin'::public.app_rol
  );

-- 4) Patrocinadores: lectura pública solo de activos (el admin usa service role)
drop policy if exists patrocinadores_public_read on public.patrocinadores;
create policy patrocinadores_public_read on public.patrocinadores
  for select
  using (activo = true);

-- 5) Confirmar que perfiles NO se puede listar (solo self).
--    perfiles_self_read ya está bien: (id = auth.uid())
--    No agregar policy de listado público; el username público se expone
--    por views específicas o por el admin client.

-- 6) Asegurar que las tablas nuevas (centros_voluntarios, camiones, inventario,
--    smtp_config, patrocinadores) sigan en deny-all para el cliente anon.
revoke all on public.centros_voluntarios from anon, authenticated;
revoke all on public.centros_camiones from anon, authenticated;
revoke all on public.centros_inventario from anon, authenticated;
revoke all on public.smtp_config from anon, authenticated;
-- patrocinadores tiene policy de lectura pública arriba; grant select a anon
grant select on public.patrocinadores to anon, authenticated;
