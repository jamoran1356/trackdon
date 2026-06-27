-- Migration 0023: validador_id nullable en centros_acopio
--
-- El validador se asigna durante la auditoría posterior, no al momento
-- del registro inicial del centro. NOT NULL bloqueaba el onboarding.

alter table public.centros_acopio
  alter column validador_id drop not null;
