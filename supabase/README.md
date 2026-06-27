# Supabase

Migraciones de base de datos para trackdon.

## Estructura

- `migrations/0001_init.sql` — Schema completo (tablas, enums, triggers,
  function helpers). RLS NO está activada todavía aquí (más fácil de
  inspeccionar).
- `migrations/0002_rls.sql` — Activa RLS en todas las tablas + policies
  por rol + vistas sanitizadas para acceso público.

## Aplicar

**Opción A — Supabase Studio (manual).** Pegar el contenido de cada
archivo en SQL Editor → Run, en orden (`0001` antes que `0002`).

**Opción B — Script Python via Management API.** Requiere PAT
(`Account → Access Tokens` en supabase.com):

```bash
# ~/.openclaw/secrets/trackdon-supabase.env (no commit, mode 600)
SUPABASE_PROJECT_REF=<ref>
SUPABASE_PAT=<sbp_...>

python3 supabase/apply.py                # aplica todas las migraciones
python3 supabase/apply.py supabase/migrations/0001_init.sql  # una sola
```

**Opción C — Supabase CLI.** Si tienes el `supabase` CLI instalado:

```bash
supabase db push   # contra el proyecto vinculado
```

## Reglas operativas

1. **Nunca apliques `0002_rls.sql` antes de `0001_init.sql`** — los
   policies referencian `fn_current_rol()` definido en la primera.
2. **Nunca DROP-eés `audit_log`** — es la bitácora histórica.
3. Antes de cualquier `UPDATE` masivo, abre `audit_log` con `select * from
   audit_log where tabla = '<x>' order by timestamp desc limit 100;`.

## Roles aplicación (`app_rol`)

| Rol | Acceso |
|---|---|
| `donante` | Lee público + escribe sus propias donaciones |
| `centro_admin` | Administra un centro, sus responsables y movimientos |
| `centro_responsable` | Firma custodias y movimientos en su centro |
| `influencer` | Administra sus rendiciones |
| `validador` | Lee padrón damnificados y escribe distribuciones |
| `super_admin` | Acceso completo + lectura de `audit_log` |

## Vistas públicas

- `v_donantes_public` — solo `nombre_mostrado`, sin email ni wallet.
- `v_distribuciones_public` — usa `pseudo_id` del damnificado, jamás
  `nombre_real`.
- `v_totales_publico` — agregados para landing.

## Datos sensibles (🔒)

`damnificados_padron.nombre_real`, `documento_identidad` y
`metadatos_privados` están protegidos por RLS y **nunca** salen vía las
vistas públicas. Solo se leen con rol `validador` (con scope correcto) o
`super_admin`.

`donantes.email_contacto` e `influencers.cuentas_fiat` igual: nunca en
vistas públicas.
