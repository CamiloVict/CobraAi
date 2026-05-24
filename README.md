# CobraAI

Plataforma SaaS de cobranza y cuentas por cobrar para América Latina.

## Stack

- Monorepo: Turborepo + pnpm
- Frontend: Next.js 14 + Clerk + Tailwind
- API Gateway: NestJS 10 + Clerk JWT + proxy a microservicios
- Base de datos: PostgreSQL 16 + Prisma 5
- Mensajería async: Kafka · Cache: Redis

## Estructura

```txt
apps/
  web/                     Next.js 14 (:3001)
  api-gateway/             Único punto de entrada (:3000)
  service-portfolios/      Portafolios y deudas (:3001 interno)
  service-workflows/       Estrategias (:3002)
  service-notifications/   Omnicanal (:3003)
  service-payments/        Pagos (:3004)
packages/
  db/          Prisma + @cobrai/db
  ports/       Contratos externos (IA, voz, WhatsApp stubs)
  types/       Tipos API compartidos
  utils/       Helpers LATAM + tenant middleware
  kafka/       Envelope de eventos
  ui/          Componentes React compartidos
  config/      ESLint, TSConfig, Jest
infra/docker/  Postgres, Redis, Kafka, Kafka UI
```

## Inicio rápido

```bash
pnpm install
pnpm run infra:up

cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
# Completar claves de Clerk

pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Tras registrarte y crear org en Clerk (/onboarding):
pnpm db:seed:align   # 30 deudas demo bajo TU org de Clerk

pnpm gateway:dev   # http://localhost:3000
pnpm web:dev        # http://localhost:3001
PORT=3011 pnpm portfolios:dev
```

### Service Portfolios (1.1)

Expuesto vía gateway en `/api/v1/portfolios|debts|debtors`. Requiere headers `X-Tenant-Id` (o token Clerk en gateway).

```bash
# Ejemplo directo al microservicio (dev)
curl -H "X-Tenant-Id: org_demo_fintech" http://localhost:3001/api/v1/portfolios
curl -H "X-Tenant-Id: org_demo_fintech" "http://localhost:3001/api/v1/debts?filter[ai_segment]=medium"
```

## Auth (Clerk)

1. Crear app en [Clerk Dashboard](https://dashboard.clerk.com) con Organizations.
2. Roles de org: `admin`, `manager`, `agent`, `viewer`.
3. Webhook → `POST http://localhost:3000/api/v1/webhooks/clerk`.

| Ruta | Acceso |
|------|--------|
| `GET /health` | Público |
| `POST /api/v1/webhooks/clerk` | Firma Svix |
| `GET /api/v1/portfolios` | Bearer Clerk + org activa |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm run infra:up` | Docker: Postgres, Redis, Kafka |
| `pnpm db:migrate` | Migraciones Prisma |
| `pnpm db:seed` | Datos demo (tenant fijo si no hay Clerk) |
| `pnpm db:seed:align` | Demo alineado a tu org de Clerk |
| `pnpm build` | Build de todo el monorepo |
| `pnpm test` | Tests |
