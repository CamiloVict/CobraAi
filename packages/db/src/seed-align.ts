import { PrismaClient } from "@prisma/client";
import { loadSeedEnv } from "./load-seed-env";
import {
  listClerkOrganizations,
  resolveSeedTenant
} from "./resolve-seed-tenant";
import { runSeed } from "./seed";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  loadSeedEnv();

  const tenant = await resolveSeedTenant();

  if (tenant.source === "default") {
    const orgs = await listClerkOrganizations();
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  No hay organización de Clerk para alinear el seed               ║
╚══════════════════════════════════════════════════════════════════╝

Organizaciones encontradas en Clerk: ${orgs.length}

Pasos:
  1. Levanta la web:     pnpm web:dev
  2. Regístrate:         http://localhost:3001/register
  3. Crea tu org:        http://localhost:3001/onboarding
  4. Repite este comando: pnpm db:seed:align

Alternativa manual (copia el org ID desde Clerk Dashboard):
  SEED_TENANT_ID=org_xxxxxxxx pnpm db:seed:align
`);
    process.exit(1);
  }

  if (tenant.source === "clerk") {
    const orgs = await listClerkOrganizations();
    if (orgs.length > 1) {
      console.warn(
        `Hay ${orgs.length} organizaciones en Clerk. Usando la primera: ${tenant.id} (${tenant.name})`
      );
      console.warn(
        "Para otra org: SEED_TENANT_ID=org_xxx pnpm db:seed:align\n"
      );
    }
  }

  console.info(
    `\n→ Sembrando demo para tenant ${tenant.id} (${tenant.name}) [${tenant.source}]\n`
  );

  process.env.SEED_TENANT_ID = tenant.id;
  process.env.SEED_TENANT_NAME = tenant.name;
  process.env.SEED_TENANT_SLUG = tenant.slug;

  await runSeed({ requireClerkAlign: true });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
