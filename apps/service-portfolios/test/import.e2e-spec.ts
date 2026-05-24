import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildCsvRows,
  hasDocker,
  seedMinimalTenant,
  startPostgres,
  stopPostgres,
  type TestDatabase
} from "@cobrai/test-utils";
import { CsvParserService } from "../src/import/csv-parser.service";

const describeE2e = hasDocker() ? describe : describe.skip;

describeE2e("import CSV e2e", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startPostgres();
  }, 120_000);

  afterAll(async () => {
    await stopPostgres(db);
  });

  it("parsea CSV de 50 filas", () => {
    const parser = new CsvParserService();
    const csv = buildCsvRows(50);
    const rows = parser.parseCsv(Buffer.from(csv, "utf-8"));
    expect(rows).toHaveLength(50);
    expect(rows[0]?.debtor_name).toBe("Deudor 1");
    expect(rows[49]?.amount).toBeGreaterThan(0);
  });

  it("persiste 50 deudas vía bulk prisma", async () => {
    const { tenantId, portfolio } = await seedMinimalTenant(db.prisma);
    const parser = new CsvParserService();
    const rows = parser.parseCsv(Buffer.from(buildCsvRows(50), "utf-8"));

    for (const row of rows) {
      const debtor = await db.prisma.debtor.create({
        data: {
          tenantId,
          name: row.debtor_name,
          email: row.debtor_email,
          phones: row.debtor_phone ? [row.debtor_phone] : [],
          address: { country: "CO" }
        }
      });
      await db.prisma.debt.create({
        data: {
          tenantId,
          portfolioId: portfolio.id,
          debtorId: debtor.id,
          externalRef: row.external_ref,
          amountOriginal: row.amount,
          amountOutstanding: row.amount,
          currency: row.currency,
          dueDate: new Date(row.due_date),
          agingBucket: "d0_30",
          status: "new"
        }
      });
    }

    const count = await db.prisma.debt.count({
      where: { tenantId, portfolioId: portfolio.id }
    });
    expect(count).toBe(50);
  });
});
