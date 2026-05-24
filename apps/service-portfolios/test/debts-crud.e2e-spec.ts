import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  hasDocker,
  seedMinimalTenant,
  startPostgres,
  stopPostgres,
  type TestDatabase
} from "@cobrai/test-utils";

const describeE2e = hasDocker() ? describe : describe.skip;

describeE2e("debts CRUD e2e", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startPostgres();
  }, 120_000);

  afterAll(async () => {
    await stopPostgres(db);
  });

  it("crea, lista y actualiza deuda", async () => {
    const { tenantId, portfolio, debtor } = await seedMinimalTenant(db.prisma);

    const created = await db.prisma.debt.create({
      data: {
        tenantId,
        portfolioId: portfolio.id,
        debtorId: debtor.id,
        externalRef: "DEBT-E2E-1",
        amountOriginal: 500_000,
        amountOutstanding: 500_000,
        currency: "COP",
        dueDate: new Date("2026-06-15"),
        agingBucket: "d0_30",
        status: "active"
      }
    });

    const listed = await db.prisma.debt.findMany({
      where: { tenantId, portfolioId: portfolio.id, deletedAt: null }
    });
    expect(listed.some((d) => d.id === created.id)).toBe(true);

    const updated = await db.prisma.debt.update({
      where: { id: created.id },
      data: { status: "contacted", amountOutstanding: 450_000 }
    });
    expect(updated.status).toBe("contacted");
    expect(Number(updated.amountOutstanding)).toBe(450_000);
  });
});
