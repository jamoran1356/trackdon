# Modelo de datos (borrador)

> Estado: borrador inicial. Las entidades cambiarán en los primeros sprints
> a medida que se valide con organizaciones reales. Este documento es la
> referencia para escribir el SQL inicial.

Convenciones:

- Todas las tablas tienen `id uuid primary key default gen_random_uuid()`,
  `creado_at timestamptz default now()`.
- Toda referencia es `foreign key on delete restrict` salvo en `audit_log`.
- RLS por defecto **deny-all**; cada role abre solo lo que necesita leer.
- Campos marcados `🔒` son sensibles y nunca aparecen en queries públicas.

## Entidades principales

### `donantes`
- `usuario_auth_id` (uuid, ref `auth.users`) — null si donó sin cuenta
- `nombre_mostrado` (text) — lo que el donante quiere que se vea públicamente,
  puede ser su nombre real o un alias
- `email_contacto` (text, opcional, 🔒)
- `wallet_pubkey` (text, opcional)

### `donaciones`
- `donante_id` (fk)
- `tipo` (enum: `bienes` | `dinero_cripto` | `dinero_fiat`)
- `descripcion` (text)
- `valor_estimado_usd` (numeric)
- `centro_recibio_id` (fk a `centros_acopio` — null si va a influencer)
- `influencer_recibio_id` (fk a `influencers` — null si va a centro)
- `estado` (enum: `pendiente` | `recibida` | `en_transito` | `distribuida`)
- `tx_solana` (text, fase 2)
- `hash_descripcion` (text, fase 2)

### `centros_acopio`
- `nombre` (text)
- `tipo` (enum: `fisico` | `comprador_medicamentos`)
- `validador_id` (fk, quien autorizó este centro)
- `direccion` (text)
- `geo` (point, opcional)
- `responsable_principal_id` (fk a `responsables`)
- `activo` (bool)

### `responsables`
- `centro_id` (fk)
- `usuario_auth_id` (fk, ref `auth.users`)
- `nombre` (text)
- `rol` (text — ej. coordinador, voluntario, contador)
- `kyc_credential` (text, fase 2)

### `custodias`
- `donacion_id` (fk)
- `centro_id` (fk)
- `responsable_id` (fk, quien firma la recepción)
- `recibido_at` (timestamptz)
- `notas` (text)
- `tx_solana` (text, fase 2)

### `movimientos`
- `custodia_origen_id` (fk)
- `centro_destino_id` (fk)
- `responsable_origen_id` (fk)
- `responsable_destino_id` (fk)
- `acta_media_id` (fk a `medias` — foto del acta firmada)
- `tx_solana` (text, fase 2)

### `influencers`
- `nombre_publico` (text)
- `usuario_auth_id` (fk)
- `wallet_pubkey` (text, opcional)
- `cuentas_fiat` (jsonb, opcional, 🔒 — alias de Zelle, bancos, etc.)
- `validador_id` (fk, quien lo certificó)
- `activo` (bool)

### `rendiciones`
- `influencer_id` (fk)
- `donacion_id` (fk, opcional — null si es agregado)
- `concepto` (text)
- `monto_usd` (numeric)
- `destino_tipo` (enum: `compra_insumos` | `transferencia_centro` |
  `entrega_directa` | `otro`)
- `comprobante_media_id` (fk a `medias`)
- `tx_solana` (text, fase 2)

### `damnificados_padron` 🔒
- `pseudo_id` (text — el que aparecería on-chain en fase 2)
- `wallet_pubkey` (text, opcional)
- `kyc_credential` (text, fase 2)
- `validador_id` (fk, quien atestiguó)
- `nombre_real` (text 🔒)
- `documento_identidad` (text 🔒)
- `metadatos_privados` (jsonb 🔒 — composición familiar, nivel de daño,
  notas del validador, etc.)

### `distribuciones`
- `donacion_id` (fk, o `bolsa_id` cuando la regla agrupe varias)
- `damnificado_id` (fk)
- `monto_o_descripcion` (text)
- `recibo_media_id` (fk a `medias`)
- `entregado_at`
- `tx_solana` (text, fase 2)

### `validadores`
- `nombre` (text — organización)
- `usuario_auth_id` (fk)
- `wallet_pubkey` (text, opcional)
- `scope` (enum: `centros` | `damnificados` | `ambos`)
- `activo` (bool)

### `medias`
- `bucket` (text — Supabase Storage)
- `path` (text)
- `hash_sha256` (text) — el mismo hash va a chain en fase 2
- `mime_type` (text)
- `subido_por_auth_id` (fk)
- `es_privado` (bool) — true para fotos de damnificados, facturas, padrón

### `audit_log`
- `actor_auth_id` (fk, nullable para acciones de sistema)
- `accion` (text)
- `tabla` (text)
- `registro_id` (uuid)
- `payload` (jsonb)
- `tx_solana` (text, fase 2)

## Reglas operativas

- Toda escritura sensible genera entrada en `audit_log`.
- `damnificados_padron.nombre_real` y `metadatos_privados` solo legibles
  por `validador` con scope correspondiente y `super_admin`.
- `medias` con `es_privado = true` se sirven exclusivamente con signed URL
  de máximo 5 minutos, validando rol del solicitante.
- Hash SHA-256 del archivo se calcula al subir y se persiste en `medias`.
- Cualquier UPDATE/DELETE sobre `damnificados_padron`, `distribuciones`,
  `rendiciones` queda inmutable en `audit_log`.
