# Security policy

trackdon maneja datos de personas en una situación vulnerable
(damnificados de emergencias, voluntarios, donantes). Una filtración no es
sólo un bug — puede exponer a alguien a daño físico o estafas dirigidas.
Esta es la política de hardening obligatoria.

## Principios

1. **Privacidad de damnificados es no negociable.** Su identidad real
   nunca se sirve por API pública, nunca se loguea, nunca aparece en
   exports CSV.
2. **Lo público es público de verdad, lo privado es privado de verdad.**
   No hay "casi privado".
3. **Auditar lo que pasa, no confiar en buenas intenciones.** Cada acción
   sensible queda en `audit_log`.

## Supabase

### Row Level Security
- RLS **enabled** y `deny-all` por defecto en todas las tablas. Después se
  abre lo que cada role necesita leer/escribir.
- Tablas con campos marcados 🔒 (ver `docs/DATA_MODEL.md`) solo se leen
  con rol `validador` correspondiente o `super_admin`.

### Keys
- `SUPABASE_SERVICE_ROLE_KEY` se usa **únicamente server-side** (API
  routes, server actions, scripts). Nunca se importa desde un componente
  cliente.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` se usa en el navegador, pero RLS sigue
  bloqueando todo lo no explícitamente permitido.
- Toda key se rota inmediatamente si:
  - Alguien externo al equipo la vio.
  - Apareció en logs, screenshots o issues.
  - Hubo cambio de personal con acceso.

### Storage
- Bucket `privado` con `public = false`.
- Archivos sensibles (recibos, fotos de damnificados, actas firmadas) se
  sirven con `createSignedUrl` con `expiresIn` ≤ 300 segundos.
- Antes de devolver la signed URL, el servidor valida el rol del
  solicitante.

## Aplicación

### Logging
- **Prohibido** loguear nombres reales, documentos, emails de
  damnificados.
- Logs estructurados con IDs/UUIDs en lugar de PII.
- Errores que incluyan PII se sanitizan antes de subir al servicio de
  logs.

### Headers / cookies
- CSP estricta en producción.
- Cookies de sesión `httpOnly`, `secure`, `sameSite=lax`.
- `Strict-Transport-Security` con `max-age=31536000; includeSubDomains`.

### Inputs
- Validación con Zod en cada endpoint.
- Sanitización HTML para todo campo que vaya a renderizarse (descripción
  de donación, notas).
- Rate limiting en endpoints públicos (donación pública, login).

## Secrets

- Nunca commit de claves, tokens, credenciales en el repo.
  - `.env*` ignorados.
  - PR template recuerda revisar `git diff` antes de push.
  - GitHub secret scanning activado en el repo.
- `.env.example` solo nombra variables, jamás valores.
- Pre-commit hook (futuro) que bloquea patrones tipo `ghp_`, `sk-`,
  `eyJ...` largos.

## Auditoría

- `audit_log` registra: actor, acción, tabla, registro_id, payload, ts.
- Toda escritura a `damnificados_padron`, `distribuciones`, `rendiciones`,
  `validadores` deja entrada en `audit_log`. Disparado por trigger SQL,
  no por código de aplicación.
- Backups encriptados, retención 30 días mínimo.

## Reportes

¿Encontraste una vulnerabilidad? Abre un issue con etiqueta `security` y
descripción mínima, o escribe directo al maintainer. No publiques
detalles explotables hasta que se haya parcheado.
