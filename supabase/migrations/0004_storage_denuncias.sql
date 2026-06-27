-- trackdon · migration 0004
-- 1) Storage buckets (avatares, pruebas, comprobantes, denuncias)
-- 2) Storage policies (RLS sobre storage.objects)
-- 3) Tabla `denuncias` + RLS + audit trigger

-- ============================================================ 1) Buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatares',     'avatares',     true,  2097152,  array['image/jpeg','image/png','image/webp']),
  ('pruebas',      'pruebas',      true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('comprobantes', 'comprobantes', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('denuncias',    'denuncias',    false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- ============================================================ 2) Storage policies

-- avatares (público): cualquiera lee; el dueño sube/borra los suyos.
drop policy if exists "avatares_read" on storage.objects;
create policy "avatares_read" on storage.objects
  for select using (bucket_id = 'avatares');

drop policy if exists "avatares_owner_write" on storage.objects;
create policy "avatares_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'avatares' and auth.uid() = owner
  );

drop policy if exists "avatares_owner_update" on storage.objects;
create policy "avatares_owner_update" on storage.objects
  for update using (bucket_id = 'avatares' and auth.uid() = owner);

drop policy if exists "avatares_owner_delete" on storage.objects;
create policy "avatares_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatares' and auth.uid() = owner);

-- pruebas (público): mismas reglas — autenticado escribe, todos leen.
drop policy if exists "pruebas_read" on storage.objects;
create policy "pruebas_read" on storage.objects
  for select using (bucket_id = 'pruebas');

drop policy if exists "pruebas_owner_write" on storage.objects;
create policy "pruebas_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'pruebas' and auth.uid() = owner
  );

-- comprobantes (privado): solo dueño, validador, super_admin leen.
drop policy if exists "comprobantes_owner_read" on storage.objects;
create policy "comprobantes_owner_read" on storage.objects
  for select using (
    bucket_id = 'comprobantes' and (
      auth.uid() = owner
      or public.fn_current_rol() in ('validador','super_admin')
    )
  );

drop policy if exists "comprobantes_owner_write" on storage.objects;
create policy "comprobantes_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'comprobantes' and auth.uid() = owner
  );

-- denuncias (privado): cualquiera (anon) puede subir adjunto al crear denuncia;
-- solo validador/super_admin lee. owner es NULL para anon.
drop policy if exists "denuncias_anyone_write" on storage.objects;
create policy "denuncias_anyone_write" on storage.objects
  for insert with check (bucket_id = 'denuncias');

drop policy if exists "denuncias_validador_read" on storage.objects;
create policy "denuncias_validador_read" on storage.objects
  for select using (
    bucket_id = 'denuncias' and public.fn_current_rol() in ('validador','super_admin')
  );

-- ============================================================ 3) Tabla denuncias

do $$ begin
  create type denuncia_tipo as enum (
    'contra_centro',
    'contra_influencer',
    'contra_responsable',
    'irregularidad_general'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type denuncia_estado as enum (
    'nueva',
    'en_revision',
    'resuelta',
    'descartada'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  tipo denuncia_tipo not null,
  target_centro_id uuid references public.centros_acopio(id),
  target_influencer_id uuid references public.influencers(id),
  target_responsable_id uuid references public.responsables(id),
  reporter_email text,                       -- opcional, para contacto
  reporter_nombre text,                       -- opcional, puede ser anónima
  descripcion text not null,
  estado denuncia_estado not null default 'nueva',
  revisada_por_validador_id uuid references public.validadores(id),
  resolucion text,
  adjuntos_media_ids uuid[] not null default '{}',
  creado_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);

create index if not exists denuncias_estado_idx on public.denuncias (estado);
create index if not exists denuncias_creado_idx on public.denuncias (creado_at desc);

-- Trigger para actualizada_at
create or replace function public.fn_touch_updated()
returns trigger language plpgsql as $$
begin
  new.actualizada_at = now();
  return new;
end $$;

drop trigger if exists denuncias_touch on public.denuncias;
create trigger denuncias_touch
  before update on public.denuncias
  for each row execute function public.fn_touch_updated();

alter table public.denuncias enable row level security;
alter table public.denuncias force row level security;

-- INSERT: cualquiera (incluso anon) puede denunciar.
drop policy if exists "denuncias_anyone_insert" on public.denuncias;
create policy "denuncias_anyone_insert" on public.denuncias
  for insert with check (true);

-- SELECT: solo validador/super_admin.
drop policy if exists "denuncias_validador_read" on public.denuncias;
create policy "denuncias_validador_read" on public.denuncias
  for select using (public.fn_current_rol() in ('validador','super_admin'));

-- UPDATE: validador/super_admin para cambiar estado y resolución.
drop policy if exists "denuncias_validador_update" on public.denuncias;
create policy "denuncias_validador_update" on public.denuncias
  for update using (public.fn_current_rol() in ('validador','super_admin'))
  with check (public.fn_current_rol() in ('validador','super_admin'));

-- Audit
drop trigger if exists audit_denuncias on public.denuncias;
create trigger audit_denuncias
  after insert or update or delete on public.denuncias
  for each row execute function public.fn_audit_changes();

-- Vista pública agregada (sin contenido sensible, solo conteos por estado)
create or replace view public.v_denuncias_resumen as
  select
    estado,
    count(*) as cantidad
  from public.denuncias
  group by estado;

grant select on public.v_denuncias_resumen to anon, authenticated;
