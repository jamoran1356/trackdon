# Modelo de datos (borrador)

> Estado: borrador inicial. Las entidades cambiarán en los primeros sprints
> a medida que se valide con organizaciones reales.

## Entidades principales

### `donante`
- `id` (uuid)
- `wallet_pubkey` (text, único)
- `nombre_mostrado` (text, opcional, lo que el donante quiere que se vea
  públicamente — puede ser su nombre real o un alias)
- `creado_at`

### `donacion`
- `id` (uuid)
- `donante_id`
- `tipo` (enum: `bienes` | `dinero_cripto` | `dinero_fiat`)
- `descripcion` (text, opcional)
- `valor_estimado` (numeric, en USD)
- `tx_solana` (text — signature de la transacción en Solana)
- `hash_descripcion` (text — hash de la descripción detallada, va on-chain)
- `creado_at`

### `centro_acopio`
- `id` (uuid)
- `nombre` (text)
- `tipo` (enum: `fisico` | `wallet_influencer` | `comprador_medicamentos`)
- `validador_id` (referencia — qué validador autorizó este centro)
- `direccion` (text, opcional)
- `wallet_pubkey` (text, opcional — para receptores cripto)
- `creado_at`

### `responsable`
- `id` (uuid)
- `centro_id`
- `nombre` (text)
- `rol` (text — ej. coordinador, voluntario, contador)
- `wallet_pubkey` (text)
- `kyc_credential` (text — credencial del proveedor KYC)

### `custodia`
- `id` (uuid)
- `donacion_id`
- `centro_id`
- `responsable_id` (quien firma la recepción)
- `tx_solana` (signature)
- `recibido_at`
- `notas` (text)

### `movimiento`
- `id` (uuid)
- `custodia_origen_id`
- `centro_destino_id`
- `responsable_origen_id`
- `responsable_destino_id`
- `tx_solana`
- `acta_media_id` (referencia a `medias` — foto del acta firmada)
- `creado_at`

### `damnificado_padron`
- `id` (uuid)
- `pseudo_id` (text — lo que aparece on-chain)
- `wallet_pubkey` (text)
- `kyc_credential` (text — credencial del proveedor)
- `validador_id` (quien atestiguó)
- `metadatos_privados` (jsonb — protegido por RLS, no se commitea ni se
  expone públicamente)
- `creado_at`

### `distribucion`
- `id` (uuid)
- `donacion_id` (o `bolsa_id` si viene de la bolsa común)
- `beneficiario_id` (referencia a `damnificado_padron`)
- `monto_o_descripcion`
- `tx_solana`
- `recibo_media_id` (foto del recibo firmado por el beneficiario)
- `entregado_at`

### `validador`
- `id` (uuid)
- `nombre` (text — organización)
- `wallet_pubkey` (text)
- `scope` (enum: `centros` | `damnificados` | `ambos`)
- `creado_at`

### `media`
- `id` (uuid)
- `storage_url` (Supabase Storage)
- `hash_sha256` (text — el mismo hash va on-chain en la tx que la referencia)
- `mime_type`
- `subido_por`
- `subido_at`

### `audit_log`
- `id` (uuid)
- `actor` (wallet_pubkey o user_id)
- `accion`
- `payload` (jsonb)
- `tx_solana` (si aplica)
- `timestamp`

## Reglas operativas

- Toda escritura sensible genera una entrada en `audit_log`.
- Toda media privada (foto, factura, acta) tiene su hash anclado en una
  transacción Solana — si alguien manipula la imagen en Supabase, el hash
  ya no cuadra.
- `damnificado_padron.metadatos_privados` solo es legible por validadores
  autorizados con RLS.
- Las queries públicas del dashboard NUNCA tocan `metadatos_privados`.
