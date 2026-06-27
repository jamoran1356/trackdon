# Programs — Solana smart contracts

## Status

**Archivado · no se va a deployear.**

> **Decisión de producto (2026-06-27):** trackdon no va a custodiar fondos
> de terceros. La app es un **libro público** de trazabilidad — registra
> qué se donó, a qué centro, qué responsable lo movió y cómo terminó
> entregándose. La gente dona DIRECTO al centro o influencer; nosotros
> no pasamos plata por en medio.

Este contrato queda en el repo como **referencia histórica** del diseño
explorado. Si en algún momento un proyecto descendiente quisiera
custodiar fondos, este código sirve de partida — pero requeriría
auditoría completa antes de cualquier deploy.

## Filosofía del contrato

> No-fee, no-monetization. El programa **no tiene función `withdraw`** para
> el authority. La única salida de fondos del vault de campaña es vía
> `claim` ejecutado por un beneficiario registrado. Esto es intencional:
> no quiero ganar nada y el código tiene que demostrarlo.

## Instrucciones

| Instrucción | Quién llama | Qué hace |
|---|---|---|
| `init_campaign` | Validador / multisig | Crea una campaña con su vault de USDC |
| `donate` | Cualquiera | Transfiere USDC al vault de la campaña |
| `register_beneficiary` | Authority de la campaña | Inscribe a un damnificado en el padrón |
| `close_intake` | Authority | Cierra el período de recolección y fija el monto per cápita |
| `claim` | Beneficiario | Reclama su parte equitativa |

## Modelo

- **USDC** como moneda base (SPL Token). Se puede generalizar después.
- **Una campaña por emergencia**, cada una con su propio vault PDA.
- **Distribución per cápita** simple: `total / count` al cerrar intake.
  Modelos más sofisticados (ponderado por daño, etc.) quedan para v2.
- **Pull model**: el contrato no empuja fondos. Cada damnificado reclama.
- **Registro de damnificados** controlado por authority. En fase 2 se
  integra con KYC tercerizado (Civic Pass) para que el authority no pueda
  inscribir wallets arbitrarias.

## Próximos pasos

- [ ] Suite de tests con `anchor test` + bankrun.
- [ ] Integración con Civic Pass para gating de `register_beneficiary`.
- [ ] Función de "campaña con regla ponderada" (vulnerabilidad / daño).
- [ ] Mecanismo de devolución si la campaña no logra mínimo de
      damnificados registrados antes de un deadline.
- [ ] Migración para indexer (Helius webhook → Supabase).
