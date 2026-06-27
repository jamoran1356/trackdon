# Architecture (draft)

> Working document. Subject to change as the model gets validated with
> real-world organizations.

## Fase 1 — MVP (esta fase)

```
   Donante (web móvil) ─┐
                        │
   Centro de acopio ────┼──▶  Next.js (App Router)  ─▶  Supabase
                        │     • Route handlers          • Postgres + RLS
   Influencer ──────────┘     • Server actions          • Storage
                              • Auth (cookies)          • Auth users
                              │
                              ▼
                      Dashboard público (solo lectura)
```

- Toda la lógica corre en Next.js, deploy a Vercel.
- Postgres es la fuente de verdad mientras no haya programa on-chain.
- RLS es la garantía principal de confidencialidad de damnificados.
- Storage privado: archivos accedidos solo con signed URL de corta vida.

## Fase 2 — On-chain (cuando haya recursos para deploy + auditoría)

```
                                         ┌────────────────────┐
   Donante (wallet) ───── 1 ───────────▶ │  Programa Solana   │
                                         │  (eventos públicos) │
                                         └─────────┬──────────┘
                                                   │ 2 (event)
                                                   ▼
                                         ┌────────────────────┐
                                         │ Indexer + Supabase │
                                         │   (off-chain)      │
                                         └─────────┬──────────┘
                                                   │ 3 (query)
                                                   ▼
                                         ┌────────────────────┐
                                         │  Dashboard Next    │
                                         │  (verifica chain)  │
                                         └────────────────────┘
```

En fase 2 cada evento crítico (donación, custodia, movimiento,
distribución) emite además una transacción Solana con el hash de la
evidencia. El dashboard puede mostrar el "proof" — si alguien manipulara
los datos en Supabase, el hash dejaría de cuadrar.

## Capas

### Supabase / Postgres (fase 1 — fuente de verdad)

Almacena todo:

- `donantes`, `donaciones`, `centros_acopio`, `responsables`
- `custodias`, `movimientos`
- `influencers`, `rendiciones`
- `damnificados_padron` (RLS estrictísima)
- `medias` (storage + hash)
- `audit_log`

### Auth + roles

Supabase Auth con roles claros vía claims JWT:

- `donante` — público, registra donaciones.
- `centro_admin` — administra un centro de acopio.
- `centro_responsable` — firma movimientos en un centro.
- `influencer` — administra rendiciones de su cuenta.
- `validador` — atestigua centros y damnificados, lee padrón.
- `super_admin` — operación / soporte; auditado.

Cada acción sensible queda en `audit_log` con el actor.

### KYC (fase 2)

Interfaz `lib/kyc/provider.ts` con providers intercambiables:
`civic`, `truora`, `persona`. El damnificado se verifica con el proveedor
externo; recibimos una credencial atada a su wallet o ID interno. Nuestro
backend solo verifica "credencial válida del provider X". La identidad
real nunca toca nuestros servidores.

### Programa Solana (fase 2)

Almacena hashes y referencias, jamás datos sensibles. Diseño guía: el
programa nunca recibe nombres, cédulas ni fotos — solo `bytes32` que
casan contra archivos en Storage y filas en Postgres.

## Decisiones pendientes

- **Categorización de bienes:** taxonomía inicial (comida, ropa,
  medicamentos, agua, higiene, otros) — abierta a votación de las primeras
  ONGs que adopten.
- **Distribución equitativa:** regla por defecto + override por
  validador. ¿Per cápita, ponderado por daño, mixto?
- **Bridge fiat (Zelle, transferencias bancarias):** modelo de
  attestation por validador.
- **Notificaciones al donante** cuando su aporte cambia de estado.
