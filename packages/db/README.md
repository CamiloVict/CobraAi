# @cobrai/db

Prisma 5 + PostgreSQL 16. Modelo multi-tenant CobraAI con soft delete (`deleted_at`).

## Setup

```bash
pnpm run infra:up
# DATABASE_URL=postgresql://cobrai:cobrai_dev@localhost:5433/cobrai_dev

pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:seed:align   # demo bajo tu org de Clerk (ver abajo)
pnpm db:studio
```

## Seed (demo)

| Recurso | Detalle |
|---------|---------|
| Tenant | Por defecto `org_demo_fintech`; con `pnpm db:seed:align` usa tu org de Clerk |
| Users | `admin@demo.com` / `agent@demo.com` — password `demo123` (solo referencia BD) |
| Portfolio | Cartera Q1 2026 — 30 deudas, 15 deudores |
| Templates | 5 plantillas de notificación |
| Workflow rules | 6 reglas de ejemplo |

### Alinear con Clerk (dashboard con datos al loguearte)

1. Regístrate en la web y crea organización en `/onboarding`.
2. Ejecuta `pnpm db:seed:align` — detecta tu org vía API de Clerk y siembra 30 deudas bajo ese `org_xxx`.

Manual: `SEED_TENANT_ID=org_xxx pnpm db:seed:align`

Los IDs de tenant/usuario en producción se sincronizan desde Clerk (`org_xxx`, `user_xxx`) vía webhook del API Gateway.
