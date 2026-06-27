-- Migration 0011: separar username (público) de nombre real (KYC)
--
-- username: público, único, [a-z0-9_-]{3,20}, para tracking sin doxxear
-- nombre_real: privado, opcional, validable por KYC

alter table public.perfiles
  add column if not exists username text,
  add column if not exists nombre_real text,
  add column if not exists kyc_verificado_at timestamptz,
  add column if not exists kyc_verificado_por_validador_id uuid references public.validadores(id);

-- Backfill: usar anon_id como username inicial para users existentes
update public.perfiles set username = anon_id where username is null;

alter table public.perfiles
  alter column username set not null;

-- Permite tanto el formato libre como el anon_id fallback (u_NNNNN)
alter table public.perfiles
  drop constraint if exists perfiles_username_format;

alter table public.perfiles
  add constraint perfiles_username_format
  check (username ~ '^[a-z0-9_-]{3,20}$' or username ~ '^u_[0-9]+$');

-- Único case-insensitive
create unique index if not exists perfiles_username_idx on public.perfiles (lower(username));

-- otp_codes guarda el username elegido durante el signup
alter table public.otp_codes
  add column if not exists username text;

-- Trigger handle_new_user: lee username y nombre_real del metadata
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_anon text := 'u_' || lpad(nextval('public.perfiles_anon_seq')::text, 5, '0');
begin
  insert into public.perfiles (id, rol, nombre_mostrado, anon_id, username, nombre_real)
  values (
    new.id,
    'donante',
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    v_anon,
    coalesce(new.raw_user_meta_data->>'username', v_anon),
    new.raw_user_meta_data->>'nombre_real'
  );
  return new;
end;
$$;
