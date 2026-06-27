# donaciones-traza

**Rastreo y transparencia on-chain de donaciones humanitarias.**

Open source, MIT. Pensado para que después de una emergencia (terremotos,
inundaciones, crisis) cualquier persona pueda donar y **ver con su nombre
de usuario o ID a dónde llegó su aporte**, qué centro lo recibió, quién lo
movió y con qué cara llegó al damnificado.

## El problema

Tras un evento mayor, se activan muchos canales de recolección:

- Centros de acopio físicos reciben bienes (ropa, comida, medicinas).
- Influencers, fundaciones y wallets cripto reciben donaciones en dinero.
- Voluntarios compran medicamentos con esos fondos y los llevan a campo.

Hoy, en la mayoría de casos, **el rastro termina en el momento de la
entrega**. La gente que donó no sabe si su caja llegó, los voluntarios
que aportaron tiempo no pueden auditar el manejo, y siempre aparece alguien
aprovechándose de la urgencia para quedarse con recursos ajenos.

`donaciones-traza` ataca exactamente ese punto ciego.

## La idea

> Cada donación, cada custodia, cada entrega final queda registrada como
> evento público en blockchain. Los datos sensibles (identidad de
> damnificados, fotos, recibos) viven off-chain con permisos. Los hashes
> y los flujos son públicos.

## Actores

| Actor | Qué hace |
|---|---|
| **Donante** | Registra qué dona (bienes o dinero). Recibe un ID de tracking. Puede seguir el recorrido de su aporte en tiempo real. |
| **Receptor con rendición** | Centros de acopio físicos, fundaciones, influencers, compradores de medicamentos. Reciben donaciones y deben justificar el destino (transferencias, recibos, fotos firmadas). |
| **Damnificado** | Pasa por verificación de identidad (KYC) provisto por un tercero. Queda en el padrón con un pseudónimo on-chain. Recibe distribución equitativa de la bolsa común. |
| **Validador autorizado** | Organización confiable (Cruz Roja, alcaldías, ONGs verificadas) que puede atestiguar damnificados y centros. |
| **Observador público** | Cualquier persona con el link. Puede ver montos, flujos y verificar hashes contra blockchain. |

## Principios

1. **Transparencia hacia quien maneja, dignidad para quien recibe.**
   Centros, influencers y validadores quedan expuestos al escrutinio
   público. Los damnificados solo aparecen como pseudónimos.

2. **KYC tercerizado.** No manejamos identidades reales internamente.
   El proveedor (Civic Pass, Truora, Persona o equivalente) verifica
   y nos entrega una credencial reusable atada al wallet.

3. **Código abierto, datos privados.** El código vive público (MIT).
   El padrón, las fotos y las facturas viven en una base con permisos
   y nunca se commitean al repo.

4. **Distribución equitativa.** La "bolsa común" se reparte entre el
   padrón verificado según una regla declarada on-chain (per cápita,
   ponderada por daño, etc.), no por decisión opaca del operador.

## Stack

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend / Dashboard | Next.js (App Router) + Tailwind | Deploy a Vercel directo, SSR para audit page |
| API / Backend | Next.js Route Handlers | Una sola codebase, sin servicio extra |
| Off-chain DB | Supabase (Postgres + RLS) | Padrón, fotos, facturas, audit logs |
| On-chain | Solana (programa Anchor) | Costos ~0 por evento, finalidad rápida |
| KYC | Civic Pass (default), Truora / Persona como alternativas | Tercerizado, credencial reusable |
| Storage de fotos / facturas | Supabase Storage | Hash on-chain, archivo off-chain |

## Estado

**Alpha — pre-código.** Este commit inicial es el esqueleto y la
documentación. El modelo de datos y el primer programa Solana están en
diseño.

## Cómo contribuir

Buscamos personas con experiencia en:

- **Solana / Anchor** — diseño del programa, instructions, PDAs.
- **Next.js + Supabase** — dashboard de auditoría, RLS, RBAC.
- **UX / diseño** — flujos de donante, centro, damnificado.
- **Legal** — revisión de modelo KYC y separación código/datos.
- **Coordinación con ONGs** — pruebas de campo con organizaciones reales.

Abre un Issue con la etiqueta `propuesta` o un PR pequeño. Toda
contribución pública queda atribuida en `CONTRIBUTORS.md`.

## Licencia

MIT. Ver [LICENSE](./LICENSE).
