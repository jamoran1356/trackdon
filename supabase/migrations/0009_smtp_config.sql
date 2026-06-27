-- SMTP config singleton (id=1) editable solo por super_admin desde la app.
-- La app lee con SUPABASE_SECRET_KEY (bypass RLS) y escribe lo mismo.
-- Mantenemos RLS deny-all como red de seguridad.

create table if not exists public.smtp_config (
  id smallint primary key default 1 check (id = 1),
  host text not null,
  port integer not null check (port > 0 and port < 65536),
  username text not null,
  password text not null,
  from_email text not null,
  from_name text not null default 'trackdon',
  secure boolean not null default true,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.smtp_config enable row level security;

-- Deny-all; el server action usa service role para leer/escribir.
revoke all on public.smtp_config from anon, authenticated;
