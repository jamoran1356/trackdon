# trackdon

**Tracking de donaciones humanitarias. Mobile-first, open source, transparente.**

Aplicación web (responsive, pensada primero para teléfono) para que después
de una emergencia humanitaria toda la ayuda quede **centralizada y
trazable**: quién donó, qué centro la recibió, qué responsable la movió,
cómo terminó llegando al damnificado.

MIT. Sin venta, sin lucro — el código es público para que cualquier
organización pueda usarlo o auditarlo.

## El problema

Tras un evento mayor se activan muchos canales de recolección:

- Centros de acopio físicos reciben bienes (ropa, comida, medicinas).
- Influencers, fundaciones y wallets cripto reciben donaciones en dinero.
- Voluntarios compran medicamentos con esos fondos y los llevan a campo.

En la mayoría de casos **el rastro termina en el momento de la entrega
inicial**. La gente que donó no sabe si su caja llegó, los voluntarios no
pueden auditar el manejo, y siempre aparece alguien aprovechándose de la
urgencia para quedarse con recursos ajenos.

## La solución

> Centralizar toda la ayuda en un solo registro, dar transparencia
> hacia quien la maneja, proteger la dignidad de quien la recibe.

## Fases

**Fase 1 — MVP (en construcción, esta fase).** Toda la lógica vive en
Supabase + Next.js. Sin smart contract todavía (queda pendiente para
cuando haya recursos para deploy + auditoría). Se aprovecha al máximo
las garantías de Postgres y RLS para que los datos no se filtren.

**Fase 2 — On-chain.** Cada donación, custodia y entrega se ancla en
Solana como evento público con hash de la evidencia off-chain. KYC del
damnificado tercerizado (Civic Pass / Truora / Persona). El dashboard
público pasa a verificar contra blockchain.

## Dashboards

Cada actor tiene su propio panel, con permisos estrictamente separados:

### Dashboard Centro de Acopio
- Inventario en tiempo real de lo recibido.
- Registro de cada donación entrante (donante, descripción, foto, valor
  estimado).
- Movimientos a otros centros o entregas a damnificados.
- Responsables internos del centro (quién firmó qué).

### Dashboard Influencer / Receptor cash
- Wallet o cuentas vinculadas (Zelle, USDC, bancos).
- Donaciones recibidas con su origen.
- **Rendición obligatoria**: cada salida de fondos debe tener un destino
  documentado — factura de compra de insumos, transferencia a un centro
  con su comprobante, etc.
- Saldo pendiente de rendir vs. saldo total recibido.

### Dashboard público
- Vista de solo lectura para cualquier persona.
- Totales por centro, por influencer, por categoría de ayuda.
- Búsqueda por ID de donación o por nombre del donante (si optó por
  hacerlo público).
- **Nunca expone identidad de damnificados**, solo agregados.

## Actores

| Actor | Qué hace |
|---|---|
| **Donante** | Registra su donación (bien físico o dinero). Recibe ID de tracking. Sigue el flujo en tiempo real. |
| **Centro de acopio** | Recibe bienes. Inventarea. Firma cada movimiento. |
| **Influencer / fundación cash** | Recibe dinero. Rinde cuentas con recibos y transferencias documentadas. |
| **Damnificado** | Pasa KYC (fase 2 con proveedor tercerizado). Aparece en padrón privado como pseudónimo. |
| **Validador autorizado** | Organización (Cruz Roja, alcaldías, ONGs) que atestigua damnificados y centros. |
| **Observador público** | Cualquiera con el link. Solo lectura, sin datos sensibles. |

## Principios

1. **Transparencia hacia quien maneja, dignidad para quien recibe.**
2. **Código abierto, datos privados.** El repo es público (MIT). El padrón
   KYC, las fotos y las facturas viven en Supabase con RLS estricta y nunca
   se commitean al repo.
3. **KYC tercerizado** (fase 2). No manejamos identidades reales
   internamente.
4. **Distribución equitativa.** La "bolsa común" se reparte entre el
   padrón verificado siguiendo una regla declarada y auditable.

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend / Dashboard | Next.js 16 (App Router, Turbopack) + Tailwind + shadcn/ui | Mobile-first. Deploy en Vercel. |
| API | Next.js Route Handlers | Una sola codebase. |
| DB | Supabase (Postgres + RLS) | Fuente de verdad mientras no hay chain. |
| Storage | Supabase Storage | Fotos, recibos, actas. Hash almacenado para fase 2. |
| Auth | Supabase Auth | Roles: `donante`, `centro_admin`, `centro_responsable`, `influencer`, `validador`, `super_admin`. |
| KYC (fase 2) | Civic Pass / Truora / Persona | Interfaz abstracta `lib/kyc/provider.ts`. |
| On-chain (fase 2) | Solana + Anchor | Eventos públicos con hash de evidencia. |

## Seguridad

Ver [SECURITY.md](./SECURITY.md). Resumen:

- Supabase: `service_role` **solo server-side**, jamás expuesto al navegador.
- RLS por defecto **deny-all**, los reads se abren explícitamente.
- Anon key del navegador con scope mínimo (solo selects públicos).
- Archivos privados nunca con URLs públicas; signed URLs de corta vida.
- Sin secrets en el repo. `.env.example` solo nombra las variables.

## Estado

**Pre-código.** Este commit es el esqueleto y la documentación. El primer
sprint trabaja sobre:

- Schema inicial Supabase + RLS deny-all.
- Roles y políticas.
- Landing pública.
- Vista pública de solo lectura (mock).

## Cómo contribuir

Buscamos:

- **Next.js + Supabase** — dashboards mobile-first, RLS, roles, server actions.
- **Diseño / UX** — flujos mobile para donante, centro y damnificado.
- **Solana / Anchor** (fase 2) — programa de anclaje de eventos.
- **Legal / privacidad** — revisión de modelo de datos y separación
  código/datos.
- **Conexión con ONGs** — para validar el modelo con casos reales.

Abre un Issue con la etiqueta `propuesta` o un PR pequeño. Las
contribuciones públicas quedan atribuidas en `CONTRIBUTORS.md`.

## Licencia

MIT. Ver [LICENSE](./LICENSE).
