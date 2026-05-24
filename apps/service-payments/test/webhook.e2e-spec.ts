import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  hasDocker,
  seedMinimalTenant,
  startPostgres,
  stopPostgres,
  type TestDatabase
} from "@cobrai/test-utils";
import { PaymentConfirmationService } from "../src/payments/payment-confirmation.service";

const describeE2e = hasDocker() ? describe : describe.skip;

describeE2e("payment webhook e2e", () => {
  let db: TestDatabase;
  let confirmation: PaymentConfirmationService;

  beforeAll(async () => {
    db = await startPostgres();
    const kafka = { publish: vi.fn().mockResolvedValue(undefined) };
    confirmation = new PaymentConfirmationService(db.prisma, kafka as never);
  }, 120_000);

  afterAll(async () => {
    await stopPostgres(db);
  });

  it("confirma pago e idempotencia por gateway_ref", async () => {
    const { tenantId, portfolio, debtor } = await seedMinimalTenant(db.prisma);
    const debt = await db.prisma.debt.create({
      data: {
        tenantId,
        portfolioId: portfolio.id,
        debtorId: debtor.id,
        amountOriginal: 100_000,
        amountOutstanding: 100_000,
        currency: "COP",
        dueDate: new Date("2026-06-01"),
        agingBucket: "d0_30",
        status: "active"
      }
    });

    const first = await confirmation.confirmPayment({
      tenantId,
      debtId: debt.id,
      amount: 100_000,
      currency: "COP",
      gateway: "mercadopago",
      gatewayRef: "mp-e2e-123"
    });
    expect(first.duplicate).toBe(false);

    const second = await confirmation.confirmPayment({
      tenantId,
      debtId: debt.id,
      amount: 100_000,
      currency: "COP",
      gateway: "mercadopago",
      gatewayRef: "mp-e2e-123"
    });
    expect(second.duplicate).toBe(true);
  });
});
