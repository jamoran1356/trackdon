# Supabase

Migraciones de base de datos para trackdon.

## Estructura

- `migrations/0001_init.sql` — Schema completo (tablas, enums, triggers,
  function helpers). RLS NO está activada todavía aquí (más fácil de
  inspeccionar).
- `migrations/0002_rls.sql` — Activa RLS en todas las tablas + policies
  por rol + vistas sanitizadas para acceso público.

## Aplicar

Con la CLI de Supabase:

```bash
supabase db reset                # local
supabase db push                  # contra el proyecto remoto
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
