# Architecture (draft)

> Working document. Subject to change as the model gets validated with
> real-world organizations.

## High-level

```
                                         ┌────────────────────┐
   Donante (web wallet) ───── 1 ───────▶ │  Programa Solana   │
                                         │  (eventos públicos) │
                                         └─────────┬──────────┘
                                                   │ 2 (event)
                                                   ▼
                                         ┌────────────────────┐
                                         │ Indexer / Supabase │
                                         │   (off-chain)      │
                                         └─────────┬──────────┘
                                                   │ 3 (query)
                                                   ▼
                                         ┌────────────────────┐
                                         │   Dashboard Next   │
                                         │   (público)        │
                                         └────────────────────┘
```

1. El donante firma una transacción que registra la donación en el programa
   Solana. Bienes físicos: la transacción referencia un hash de manifesto.
   Dinero: la transacción referencia hash de comprobante (Zelle/SWIFT/etc.)
   o transfiere directamente USDC al contract.

2. Un indexer escucha los eventos del programa y los replica en Supabase
   con metadatos extra (fotos, descripciones, vínculos con centros).

3. El dashboard consulta Supabase para mostrar el flujo. Para cualquier
   item visible, el observador puede pedir el "proof" que retorna la
   transacción Solana original — esto garantiza que la DB no fue manipulada.

## Capas

### On-chain (Solana / Anchor)

Almacena solo lo verificable y auditable:

- `Donacion { id, donante, tipo, valor_pseudo, hash_descripcion, timestamp }`
- `Custodia { donacion_id, centro_id, responsable, recibido_at }`
- `Movimiento { custodia_id, centro_origen, centro_destino, hash_acta }`
- `Distribucion { donacion_id, beneficiario_pseudo_id, monto, hash_recibo }`
- `Validador { pubkey, scope, atestado_por }`

Diseño guía: el programa NUNCA recibe datos sensibles, solo hashes y
referencias. La privacidad se logra antes de hacer la transacción.

### Off-chain (Supabase / Postgres)

Almacena lo sensible y lo voluminoso:

- `centros_acopio` — datos del centro, responsables, ubicación
- `responsables` — personas vinculadas a centros
- `damnificados_padron` — KYC pseudónimo + datos privados (RLS estricta)
- `medias` — fotos, facturas, actas (con hash que casa con on-chain)
- `audit_log` — bitácora interna

### KYC (proveedor externo)

Civic Pass por defecto. Interfaz `lib/kyc/provider.ts` que abstrae el
proveedor. El damnificado se verifica con el proveedor; recibimos una
credencial atada a su wallet. Nuestro programa Solana solo verifica
"¿tiene credencial X válida?", sin saber quién es.

## Decisiones pendientes

- **Indexer:** Helius webhook vs. propio listener con `@solana/web3.js`.
- **Distribución equitativa:** lógica en programa Solana vs. propuesta off-chain
  con ejecución on-chain.
- **Monedas aceptadas para cash:** SOL, USDC, ambos.
- **Bridge de donaciones fiat (Zelle, etc.):** modelo de attestation por
  validador.
