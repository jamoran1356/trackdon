-- Migration 0013: el campo 'nombre' del signup va a nombre_real (privado, KYC)
-- Antes iba a nombre_mostrado. Ahora ambos quedan sincronizados al crear el user.

create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_anon text := 'u_' || lpad(nextval('public.perfiles_anon_seq')::text, 5, '0');
  v_nombre text := new.raw_user_meta_data->>'nombre';
begin
  insert into public.perfiles (id, rol, nombre_mostrado, anon_id, username, nombre_real)
  values (
    new.id,
    'donante',
    coalesce(v_nombre, new.email),
    v_anon,
    coalesce(new.raw_user_meta_data->>'username', v_anon),
    v_nombre
  );
  return new;
end;
$$;
