-- Migration 0015: invitaciones para organizaciones / influencers
--
-- Cuando un donante registra una transferencia pero la org receptora no está
-- en trackdon todavía, le mandamos un link único con explicación del proyecto
-- para que se registre y reclame las donaciones que le hicieron.

create table if not exists public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  evento_id uuid references public.eventos(id) on delete set null,
  invitado_por_auth_id uuid references auth.users(id),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  mensaje text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'expirada')),
  creado_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  aceptada_at timestamptz,
  aceptada_por_auth_id uuid references auth.users(id)
);

alter table public.invitaciones enable row level security;
revoke all on public.invitaciones from anon, authenticated;

create index if not exists invitaciones_email_idx on public.invitaciones (lower(email));
create index if not exists invitaciones_token_idx on public.invitaciones (token);
create index if not exists invitaciones_estado_idx on public.invitaciones (estado, creado_at desc);

-- Rate limit: máximo 10 invitaciones por user/día
create or replace function public.fn_check_invitacion_ratelimit()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  if new.invitado_por_auth_id is null then
    return new;
  end if;
  select count(*) into v_count
  from public.invitaciones
  where invitado_por_auth_id = new.invitado_por_auth_id
    and creado_at > now() - interval '24 hours';
  if v_count >= 10 then
    raise exception 'Rate limit: máximo 10 invitaciones por 24h';
  end if;
  return new;
end;
$$;

drop trigger if exists invitaciones_ratelimit on public.invitaciones;
create trigger invitaciones_ratelimit
  before insert on public.invitaciones
  for each row execute function public.fn_check_invitacion_ratelimit();
