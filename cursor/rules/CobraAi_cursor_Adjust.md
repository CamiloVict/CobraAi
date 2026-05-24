# CobraAI — Prompt Cursor: Cobro Diferido por Trimestres

> **Alcance:** ajustes al MVP para soportar cuentas con fecha de cobro
> futura (crédito diferido). Afecta schema, service-portfolios,
> service-workflows y el frontend (card de portafolio).
>
> **Pre-requisito:** tener la Etapa 1 del MVP ya implementada.
> Pega este prompt en Cursor Agent como una sola sesión.

---

## CONTEXTO PARA CURSOR

```
En CobraAI una cuenta por cobrar puede tener la venta registrada hoy
pero el cobro programado para el siguiente trimestre (Q3, Q4, etc.).

Ejemplo real:
  Venta registrada:        24 mayo 2026
  Términos de pago:        net 90 días
  Fecha de vencimiento:    22 agosto 2026  (Q3-2026)
  Inicio de gestión:       22 agosto 2026

Estos son los cambios que hay que implementar en este orden:
  1. Schema de base de datos (Prisma)
  2. Helper de quarters compartido (packages/utils)
  3. service-portfolios (lógica de negocio + endpoints)
  4. service-workflows  (scheduler + máquina de estados)
  5. Frontend web       (card de portafolio + dashboard CFO)

Reglas que aplican:
  - Las deudas 'future' y 'upcoming' se EXCLUYEN del DSO activo y de
    la tasa de recuperación del portafolio.
  - No se crean portafolios separados por trimestre — el portafolio
    es la entidad padre, el quarter es un atributo de la deuda.
  - El scheduler recalcula aging_bucket y status cada 4 horas.
  - Publicar cobrai.debt.status_changed en Kafka en cada transición.
```

---

## PASO 1 — Schema Prisma

```
Modifica packages/db/prisma/schema.prisma con los siguientes cambios.

CAMBIO 1: enum AgingBucket — agregar dos valores al inicio

  Antes:
    enum AgingBucket { d0_30, d31_60, d61_90, d91_180, d180_plus }

  Después:
    enum AgingBucket {
      future      // due_date > hoy + 30 días
      upcoming    // due_date entre hoy y hoy + 30 días
      d0_30       // vencida 0–30 días
      d31_60
      d61_90
      d91_180
      d180_plus
    }

CAMBIO 2: enum DebtStatus — agregar dos valores al inicio

  Antes:
    enum DebtStatus { new, analyzing, active, contacted, ... }

  Después:
    enum DebtStatus {
      future      // vence en más de 30 días, no iniciar gestión
      upcoming    // vence en ≤ 30 días, enviar recordatorio suave
      new         // acaba de vencer, iniciar análisis IA
      analyzing
      active
      contacted
      promised
      plan
      disputed
      legal_risk
      legal
      paid_partial
      paid_full
      written_off
    }

CAMBIO 3: modelo Debt — agregar tres campos opcionales

  Dentro del modelo Debt, agregar después de due_date:

    scheduled_collection_date  DateTime?
    // Fecha en que el sistema empieza la gestión activa.
    // Si es null, usa due_date como default.

    payment_terms_days         Int?
    // Días de crédito pactados (30, 60, 90, 120...).
    // Informativo, sirve para calcular due_date desde invoice_date.

    collection_quarter         String?
    // Calculado automáticamente al crear/actualizar la deuda.
    // Formato: "Q1-2026", "Q2-2026", "Q3-2026", "Q4-2026".
    // Se basa en due_date (o scheduled_collection_date si existe).

    invoice_date               DateTime?
    // Fecha en que se emitió la factura original.
    // Puede ser anterior a due_date.

  Agregar también el índice compuesto para consultas de breakdown:
    @@index([tenant_id, portfolio_id, collection_quarter])

CAMBIO 4: migración y seed

  1. Ejecutar: pnpm prisma migrate dev --name add_deferred_collection_fields
  2. En packages/db/src/seed.ts agregar deudas de ejemplo con quarters futuros:
     - 5 deudas con due_date en Q3 2026 (jul–sep 2026) → future/upcoming
     - 3 deudas con due_date en Q4 2026 (oct–dic 2026) → future
     - Mantener las 30 deudas originales del seed (son del trimestre activo)
  3. Ejecutar: pnpm prisma db seed

Al terminar:
  - pnpm prisma studio muestra los nuevos campos y los valores del seed.
  - Las deudas nuevas del seed tienen collection_quarter = "Q3-2026" / "Q4-2026".
  - Las deudas originales tienen collection_quarter = "Q2-2026".
```

---

## PASO 2 — Helper de quarters (packages/utils)

```
Crea packages/utils/src/quarters.ts con las utilidades compartidas.
Este archivo lo importan service-portfolios, service-workflows y el frontend.

FUNCIONES A IMPLEMENTAR:

1. getCollectionQuarter(date: Date): string
   Retorna el quarter en formato "Q1-2026", "Q2-2026", etc.
   - Ene–Mar → Q1   · Abr–Jun → Q2
   - Jul–Sep → Q3   · Oct–Dic → Q4

   Ejemplo:
     getCollectionQuarter(new Date('2026-08-22')) → "Q3-2026"
     getCollectionQuarter(new Date('2026-11-01')) → "Q4-2026"

2. getInitialDebtStatus(dueDate: Date, scheduledDate?: Date): {
     status: DebtStatus,
     agingBucket: AgingBucket
   }
   Determina status y aging_bucket iniciales según la fecha de cobro.

   Lógica:
     const collectionDate = scheduledDate ?? dueDate
     const daysUntil = differenceInDays(collectionDate, today)

     if (daysUntil > 30)  → { status: 'future',   agingBucket: 'future' }
     if (daysUntil > 0)   → { status: 'upcoming', agingBucket: 'upcoming' }
     if (daysUntil === 0) → { status: 'new',       agingBucket: 'd0_30' }
     if (daysUntil < 0)   → calcular aging normal con valor absoluto

3. getAgingBucket(dueDate: Date): AgingBucket
   Para deudas ya vencidas (daysUntil <= 0).
   Calcula días desde vencimiento y retorna el bucket correcto.

   Lógica:
     const overdueDays = differenceInDays(today, dueDate)
     if (overdueDays <= 30)  → 'd0_30'
     if (overdueDays <= 60)  → 'd31_60'
     if (overdueDays <= 90)  → 'd61_90'
     if (overdueDays <= 180) → 'd91_180'
     else                    → 'd180_plus'

4. isActiveDebt(status: DebtStatus): boolean
   Retorna true solo si el status implica gestión activa de cobro.
   FALSE para: 'future', 'upcoming', 'paid_full', 'paid_partial', 'written_off'
   TRUE para: 'new', 'analyzing', 'active', 'contacted', 'promised', etc.

5. getQuarterDateRange(quarter: string): { start: Date; end: Date }
   Dado "Q3-2026" retorna { start: 2026-07-01, end: 2026-09-30 }.
   Útil para filtros en queries de BD.

TESTS (packages/utils/src/__tests__/quarters.spec.ts):
  - getCollectionQuarter: cubrir los 4 quarters y casos de borde (31 dic, 1 ene)
  - getInitialDebtStatus: future, upcoming, mismo día, vencida 1 día, vencida 200 días
  - getAgingBucket: cada bucket incluyendo sus límites exactos
  - isActiveDebt: cada valor del enum

Exportar todas las funciones desde packages/utils/src/index.ts.

Al terminar: pnpm test --filter=@cobrai/utils pasa con 100% cobertura
en quarters.spec.ts (es lógica pura, sin dependencias externas).
```

---

## PASO 3 — service-portfolios

```
Modifica apps/service-portfolios con los siguientes cambios.

─────────────────────────────────────────
3A. DebtsService — lógica de creación
─────────────────────────────────────────

En debts.service.ts, modificar createDebt() para calcular
automáticamente collection_quarter, status y aging_bucket:

  import { getCollectionQuarter, getInitialDebtStatus } from '@cobrai/utils';

  async createDebt(dto: CreateDebtDto, tenantId: string) {
    const dueDate       = new Date(dto.due_date);
    const scheduledDate = dto.scheduled_collection_date
      ? new Date(dto.scheduled_collection_date)
      : undefined;

    // Calcular valores derivados automáticamente
    const { status, agingBucket } = getInitialDebtStatus(dueDate, scheduledDate);
    const collectionQuarter       = getCollectionQuarter(scheduledDate ?? dueDate);

    const debt = await this.prisma.debt.create({
      data: {
        ...dto,
        tenant_id:          tenantId,
        status,
        aging_bucket:       agingBucket,
        collection_quarter: collectionQuarter,
        amount_outstanding: dto.amount_original, // saldo inicial = total
      },
    });

    // Publicar evento Kafka solo si es una deuda activa
    // Las deudas 'future' NO generan cobrai.debt.created todavía
    // Se generará cuando transicionen a 'new'
    if (status === 'new' || status === 'analyzing' || status === 'active') {
      await this.kafkaProducer.publish('cobrai.debt.created', {
        debt_id:    debt.id,
        tenant_id:  tenantId,
        status,
        due_date:   dueDate,
      });
    }

    return debt;
  }

NOTA: las deudas 'future' y 'upcoming' NO publican cobrai.debt.created
al crearse. El evento se publica cuando el scheduler las transfiere a 'new'.
Esto evita que el motor IA intente scorear deudas que no hay que cobrar aún.

─────────────────────────────────────────
3B. Importación CSV — nuevas columnas opcionales
─────────────────────────────────────────

En import/csv-parser.service.ts, agregar al mapping de columnas:

  Columnas opcionales nuevas:
    scheduled_collection_date  → fecha ISO o vacío (si vacío = due_date)
    payment_terms_days         → número entero o vacío
    invoice_date               → fecha ISO o vacío

  Validaciones adicionales:
    - scheduled_collection_date >= due_date (si viene informado)
    - payment_terms_days: entero positivo entre 1 y 720
    - invoice_date <= due_date

  Si la columna scheduled_collection_date no existe en el CSV
  (importaciones antiguas), no romper — usar null como default.

─────────────────────────────────────────
3C. Endpoint de stats — breakdown por quarter
─────────────────────────────────────────

Modificar GET /api/v1/portfolios/:id/stats para incluir el campo 'quarters'.

RESPUESTA ACTUALIZADA:
  {
    // Campos existentes — SOLO cuentas activas (excluye future/upcoming):
    total_active_amount:   number,
    total_active_debts:    number,
    recovery_rate:         number,   // sobre cuentas activas solamente
    dso_average:           number,   // solo deudas vencidas activas
    recovered_amount:      number,

    // Campos nuevos — pipeline completo:
    total_portfolio_amount: number,  // incluye todos los estados
    total_portfolio_debts:  number,

    // Breakdown por trimestre:
    quarters: [
      {
        quarter:       "Q2-2026",       // ej: el trimestre activo
        label:         "Abr – Jun 2026",
        amount:        2100000,
        debts_count:   1240,
        status:        "active",        // "active" | "upcoming" | "future"
        recovered:     1300000,
        recovery_rate: 0.619,
        aging_summary: {               // solo si status = "active"
          d0_30: 120, d31_60: 450, d61_90: 380,
          d91_180: 200, d180_plus: 90
        }
      },
      {
        quarter:    "Q3-2026",
        label:      "Jul – Sep 2026",
        amount:     1400000,
        debts_count: 127,
        status:     "upcoming",
        recovered:  0,
        recovery_rate: 0,
        aging_summary: null
      },
      {
        quarter:    "Q4-2026",
        label:      "Oct – Dic 2026",
        amount:     700000,
        debts_count: 43,
        status:     "future",
        recovered:  0,
        recovery_rate: 0,
        aging_summary: null
      }
    ]
  }

QUERY para el breakdown — agrupar por collection_quarter:

  const quarterBreakdown = await this.prisma.debt.groupBy({
    by: ['collection_quarter'],
    where: {
      portfolio_id: portfolioId,
      tenant_id:    tenantId,
      deleted_at:   null,
    },
    _sum:   { amount_original: true },
    _count: { id: true },
    orderBy: { collection_quarter: 'asc' },
  });

  // Para cada quarter, calcular su status general:
  // Si ALL deudas son 'future'   → status = "future"
  // Si alguna es 'upcoming'      → status = "upcoming"
  // Si alguna está vencida       → status = "active"

─────────────────────────────────────────
3D. Endpoint de listado de deudas — filtros nuevos
─────────────────────────────────────────

GET /api/v1/debts — agregar query params nuevos:

  ?filter[collection_quarter]=Q3-2026
  ?filter[status]=future
  ?filter[status]=upcoming
  ?include_future=true   (default: false — por defecto NO muestra future/upcoming)

  Por defecto, el listado de deudas EXCLUYE future y upcoming
  (el equipo de cobranza solo ve lo que ya se puede gestionar).
  Para verlas hay que pasar ?include_future=true explícitamente.

─────────────────────────────────────────
3E. Tests
─────────────────────────────────────────

Agregar en service-portfolios/src/debts/__tests__/:

  deferred-collection.spec.ts:
    ✓ Crear deuda con due_date +90 días → status='future', quarter='Q3-2026'
    ✓ Crear deuda con due_date +20 días → status='upcoming', quarter correcto
    ✓ Crear deuda con due_date = hoy    → status='new', aging_bucket='d0_30'
    ✓ Crear deuda con due_date -45 días → status='active', aging_bucket='d31_60'
    ✓ Crear deuda con scheduled_collection_date diferente a due_date
    ✓ Deuda 'future' NO publica cobrai.debt.created al crearse
    ✓ Deuda 'new' SÍ publica cobrai.debt.created al crearse

  portfolio-stats.spec.ts (actualizar tests existentes):
    ✓ stats.quarters tiene 3 entries cuando hay deudas en 3 quarters
    ✓ recovery_rate excluye deudas future/upcoming
    ✓ total_portfolio_amount incluye todos los estados
    ✓ Quarter con todas las deudas pagadas → recovery_rate = 1.0
```

---

## PASO 4 — service-workflows

```
Modifica apps/service-workflows con los siguientes cambios.

─────────────────────────────────────────
4A. Scheduler — transiciones de estado diferido
─────────────────────────────────────────

En el cron job existente (cron cada 4 horas), agregar al INICIO
del ciclo de ejecución las siguientes transiciones:

  import { addDays, isToday, isBefore } from 'date-fns';
  import { getAgingBucket } from '@cobrai/utils';

  // ── TRANSICIÓN 1: future → upcoming ──────────────────────────
  // Deudas que vencen en los próximos 30 días

  const nowUpcoming = await this.prisma.debt.findMany({
    where: {
      status:    'future',
      deleted_at: null,
      OR: [
        { scheduled_collection_date: { lte: addDays(new Date(), 30) } },
        {
          scheduled_collection_date: null,
          due_date: { lte: addDays(new Date(), 30) }
        }
      ]
    },
    select: { id: true, tenant_id: true, due_date: true, debtor_id: true }
  });

  for (const debt of nowUpcoming) {
    await this.prisma.debt.update({
      where: { id: debt.id },
      data:  { status: 'upcoming', aging_bucket: 'upcoming' }
    });

    await this.kafka.publish('cobrai.debt.status_changed', {
      debt_id:    debt.id,
      tenant_id:  debt.tenant_id,
      from_status: 'future',
      to_status:   'upcoming',
      reason:      'due_date_approaching_30d',
    });
  }

  this.logger.log(`Transición future→upcoming: ${nowUpcoming.length} deudas`);

  // ── TRANSICIÓN 2: upcoming → new ─────────────────────────────
  // Deudas que ya vencieron o que su scheduled_collection_date es hoy o pasada

  const nowNew = await this.prisma.debt.findMany({
    where: {
      status:    'upcoming',
      deleted_at: null,
      OR: [
        { scheduled_collection_date: { lte: new Date() } },
        {
          scheduled_collection_date: null,
          due_date: { lte: new Date() }
        }
      ]
    },
    select: { id: true, tenant_id: true, due_date: true, debtor_id: true }
  });

  for (const debt of nowNew) {
    const agingBucket = getAgingBucket(debt.due_date);

    await this.prisma.debt.update({
      where: { id: debt.id },
      data:  { status: 'new', aging_bucket: agingBucket }
    });

    // AHORA sí publicar cobrai.debt.created para que la IA la recoja
    await this.kafka.publish('cobrai.debt.created', {
      debt_id:    debt.id,
      tenant_id:  debt.tenant_id,
      due_date:   debt.due_date,
      source:     'deferred_activation', // indica que viene de cobro diferido
    });

    await this.kafka.publish('cobrai.debt.status_changed', {
      debt_id:     debt.id,
      tenant_id:   debt.tenant_id,
      from_status: 'upcoming',
      to_status:   'new',
      reason:      'collection_date_reached',
    });
  }

  this.logger.log(`Transición upcoming→new: ${nowNew.length} deudas activadas`);

  // ── Continuar con el ciclo normal del scheduler ───────────────
  // (recalcular aging de deudas activas, promesas vencidas, etc.)

─────────────────────────────────────────
4B. Motor de reglas — ignorar deudas diferidas
─────────────────────────────────────────

En rule-engine.service.ts, agregar condición al inicio de evaluateRules():

  // Las reglas de contacto y escalamiento NUNCA se aplican a deudas
  // en estado 'future' o 'upcoming' (aún no hay que cobrar)
  if (['future', 'upcoming'].includes(debt.status)) {
    return { applied: false, reason: 'debt_not_yet_collectable' };
  }

─────────────────────────────────────────
4C. Queue del día — separar por tipo
─────────────────────────────────────────

Modificar GET /api/v1/workflows/queue para incluir resumen de pipeline:

  {
    // Cola activa (lo que se gestiona hoy):
    scheduled_today: 1247,
    by_channel: { whatsapp: 812, voice: 389, email: 338, sms: 275 },

    // Pipeline diferido (informativo, no en la cola):
    deferred_pipeline: {
      upcoming_debts: 127,    // entran a la cola en ≤ 30 días
      future_debts:   43,     // entran en más de 30 días
      upcoming_amount: 1400000,
      future_amount:   700000,
      next_activation_date: "2026-07-22",  // cuándo entra la próxima
    }
  }

─────────────────────────────────────────
4D. Tests
─────────────────────────────────────────

En service-workflows/src/__tests__/:

  deferred-transitions.spec.ts:
    ✓ Deuda 'future' con due_date en 25 días → pasa a 'upcoming'
    ✓ Deuda 'future' con due_date en 35 días → sigue en 'future'
    ✓ Deuda 'upcoming' con due_date = ayer → pasa a 'new'
    ✓ Al pasar a 'new' → publica cobrai.debt.created con source='deferred_activation'
    ✓ Deuda 'upcoming' con scheduled_collection_date futuro → no pasa a 'new' aún
    ✓ Rule engine ignora deudas 'future' y 'upcoming'
    ✓ Queue del día: deferred_pipeline tiene conteos correctos
```

---

## PASO 5 — Frontend (apps/web)

```
Modifica el frontend con los siguientes cambios visuales.

─────────────────────────────────────────
5A. PortfolioCard — breakdown por quarter
─────────────────────────────────────────

Modifica components/portfolios/PortfolioCard.tsx para mostrar
el desglose trimestral debajo de las métricas principales.

ESTRUCTURA DEL CARD ACTUALIZADO:

  ┌─────────────────────────────────────────────────────────┐
  │  📁 [Nombre del portafolio]              [pill estado]  │
  │  Importado [fecha]                                      │
  │                                                         │
  │  $4.2M total · 1,410 cuentas                           │
  │                                                         │
  │  ████████████████░░░░░░░  62% recuperado               │
  │  (barra solo refleja cuentas activas)                   │
  │                                                         │
  │  ─────────────────────────────────────────────         │
  │  PIPELINE POR TRIMESTRE                                 │
  │                                                         │
  │  Q2 · Abr–Jun  $2.1M  1,240 ctas  ● Activo            │
  │  Q3 · Jul–Sep  $1.4M    127 ctas  ● Próximo            │
  │  Q4 · Oct–Dic  $0.7M     43 ctas  ○ Futuro            │
  └─────────────────────────────────────────────────────────┘

REGLAS DE COLOR para el badge de cada quarter:
  - "active"   → punto coral (#D85A30), texto "Activo"
  - "upcoming" → punto ámbar (#EF9F27), texto "Próximo · vence en Nd"
  - "future"   → punto gris  (text3),   texto "Futuro · vence en Nd"

La sección "PIPELINE POR TRIMESTRE" solo se muestra si el portafolio
tiene al menos un quarter en estado 'upcoming' o 'future'.
Si todas las deudas están en el quarter activo, no mostrar la sección
(no añadir ruido innecesario).

Datos: vienen del campo 'quarters' del endpoint
GET /api/v1/portfolios/:id/stats — llamar a este endpoint al montar
el card. Mientras carga, mostrar skeleton de 3 líneas en esa sección.

─────────────────────────────────────────
5B. Dashboard CFO — tab "Proyección de cartera"
─────────────────────────────────────────

En app/(dashboard)/dashboard/page.tsx, agregar tabs al dashboard:

  [Recuperación activa]  [Proyección de cartera]

El tab "Proyección de cartera" muestra una vista consolidada de todos
los portafolios agrupados por quarter:

  PRÓXIMO TRIMESTRE — Q3 · Jul–Sep 2026
  ┌──────────┬──────────────┬────────────┬──────────┐
  │ Portfolio│    Monto     │  Cuentas   │  Estado  │
  ├──────────┼──────────────┼────────────┼──────────┤
  │ Demo FT  │   $1.4M      │    127     │ Próximo  │
  │ Telco BR │   $2.1M      │    340     │ Próximo  │
  │ Total Q3 │   $3.5M      │    467     │          │
  └──────────┴──────────────┴────────────┴──────────┘

  TRIMESTRE FUTURO — Q4 · Oct–Dic 2026
  ┌──────────┬──────────────┬────────────┬──────────┐
  │ Demo FT  │   $0.7M      │     43     │  Futuro  │
  │ Total Q4 │   $0.7M      │     43     │          │
  └──────────┴──────────────┴────────────┴──────────┘

  KPIs adicionales en este tab:
  - Monto total en pipeline diferido (suma upcoming + future)
  - Fecha de próxima activación masiva
  - Proyección: "En 30 días se activarán $3.5M en gestión"

Datos: llamar a GET /api/v1/portfolios?include_future=true y
construir la vista agrupando por collection_quarter.

─────────────────────────────────────────
5C. Formulario de nueva deuda — campos adicionales
─────────────────────────────────────────

En el modal "Nueva cuenta por cobrar" (y en el wizard de importación),
agregar campos opcionales colapsables bajo un toggle
"⚙ Opciones de crédito diferido":

  Al expandir muestra:
    [ ] Términos de pago (días):  [___] (net 30 / 60 / 90 / 120)
    [ ] Fecha inicio de gestión:  [datepicker]
                                  (default: igual a due_date)
    [ ] Fecha de factura:         [datepicker]

  Al cambiar "Términos de pago", calcular due_date automáticamente:
    due_date = invoice_date + payment_terms_days

  Al cambiar due_date, mostrar preview del quarter calculado:
    "Esta cuenta se activará en Q3 2026 (Jul–Sep)"
    con badge de color correspondiente.

─────────────────────────────────────────
5D. Tabla de deudas — filtro de pipeline
─────────────────────────────────────────

En el listado de deudas (/debts), agregar al grupo de filtros:

  [Activas]  [Críticas]  [Promesas]  [Legal]  [Pipeline futuro]

El botón "Pipeline futuro" activa ?include_future=true y filtra
solo status 'future' y 'upcoming'. Muestra un banner informativo:

  ℹ️ "Mostrando 170 cuentas diferidas — aún no en gestión activa"

En la tabla, cuando una fila es 'future' o 'upcoming':
  - La columna "Score IA" muestra "—" (no hay score aún)
  - La columna "Estado" muestra el badge correspondiente
  - Las acciones de contacto están deshabilitadas con tooltip:
    "Esta cuenta aún no está disponible para gestión"
  - La columna "Activa en" muestra los días restantes:
    "En 45 días" o "En 12 días"
```

---

## CHECKLIST DE FINALIZACIÓN

```
SCHEMA:
□ Migración aplicada sin errores
□ Seed tiene deudas en Q2, Q3 y Q4 con estados correctos
□ pnpm prisma studio muestra los nuevos campos

PACKAGES/UTILS:
□ pnpm test --filter=@cobrai/utils → 100% cobertura en quarters.spec.ts
□ getCollectionQuarter('2026-08-22') retorna "Q3-2026"
□ getInitialDebtStatus con due_date +90d retorna { status:'future' }

SERVICE-PORTFOLIOS:
□ POST /api/v1/debts con due_date +90d → status='future' en BD
□ POST /api/v1/debts con due_date +20d → status='upcoming' en BD
□ GET /api/v1/portfolios/:id/stats → campo 'quarters' presente
□ GET /api/v1/debts (sin params) → NO muestra future/upcoming
□ GET /api/v1/debts?include_future=true → SÍ muestra future/upcoming
□ Deuda 'future' creada → Kafka NO recibe cobrai.debt.created
□ recovery_rate de stats excluye deudas future/upcoming
□ pnpm test --filter=service-portfolios → ≥ 80% cobertura

SERVICE-WORKFLOWS:
□ Scheduler corre → deuda con due_date en 25d pasa a 'upcoming'
□ Scheduler corre → deuda con due_date ayer pasa a 'new'
□ Al pasar a 'new' → Kafka recibe cobrai.debt.created
□ Rule engine no aplica reglas a 'future'/'upcoming'
□ Queue del día incluye deferred_pipeline con conteos correctos
□ pnpm test --filter=service-workflows → ≥ 80% cobertura

FRONTEND:
□ PortfolioCard muestra sección quarters si hay future/upcoming
□ Badge "Próximo · vence en 30 días" con color ámbar
□ Tab "Proyección de cartera" en dashboard muestra tabla por quarter
□ Modal nueva deuda tiene sección colapsable de crédito diferido
□ Preview de quarter al seleccionar due_date funciona
□ Botón "Pipeline futuro" en tabla de deudas funciona
□ Acciones deshabilitadas en filas future/upcoming con tooltip

INTEGRACIÓN:
□ Crear deuda vía frontend con due_date +60d → aparece en portafolio
  bajo el quarter correcto con badge "Futuro"
□ Simular paso del tiempo (cambiar fecha en BD al día de vencimiento)
  → scheduler pasa la deuda a 'new' y el motor IA la recoge
```

---

## NOTAS PARA CURSOR

```
1. Importar siempre getCollectionQuarter y getInitialDebtStatus desde
   @cobrai/utils — nunca reimplementar esta lógica en los servicios.

2. La barra de progreso del portafolio (recovery_rate) siempre se
   calcula sobre cuentas activas. No confundir con total_portfolio_amount
   que sí incluye todo. Documentar esto en los comentarios del código.

3. En el frontend, cuando due_date y scheduled_collection_date son iguales
   (caso más común), no mostrar el campo scheduled_collection_date al usuario
   — es redundante. Solo mostrarlo si son distintos.

4. El campo collection_quarter es calculado por el backend al crear/actualizar
   la deuda. El frontend nunca lo envía en el body del request.

5. Nunca crear un Portafolio separado por quarter — el portafolio es la
   entidad de agrupación por cliente/origen, no por período. El quarter
   es solo un atributo de filtro y visualización.

6. Si una deuda tiene scheduled_collection_date (diferente a due_date),
   el quarter se calcula sobre scheduled_collection_date, NO sobre due_date.
   Ejemplo: due_date = 22 ago (Q3) pero scheduled = 1 oct (Q4) →
   collection_quarter = "Q4-2026".
```