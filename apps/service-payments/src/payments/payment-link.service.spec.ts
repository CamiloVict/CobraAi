import { describe, expect, it, vi } from "vitest";
import { PaymentLinksService } from "./payments.service";

describe("PaymentLinksService", () => {
  const prisma = {
    debt: { findFirst: vi.fn() },
    paymentLink: { create: vi.fn() }
  };
  const config = { get: vi.fn(() => "http://localhost:3001/pay") };
  const gateway = { createCheckout: vi.fn() };
  const confirmation = { confirmPayment: vi.fn() };

  const service = new PaymentLinksService(
    prisma as never,
    config as never,
    gateway as never,
    confirmation as never
  );

  it("genera link con expiración por defecto 48h", async () => {
    prisma.debt.findFirst.mockResolvedValue({
      id: "debt-1",
      currency: "COP",
      amountOutstanding: 100000,
      debtor: { address: { country: "CO" }, name: "Juan Pérez" },
      tenant: { name: "Demo" }
    });
    prisma.paymentLink.create.mockImplementation(({ data }: { data: object }) => ({
      id: "link-1",
      token: "tok-abc",
      expiresAt: new Date(Date.now() + 48 * 3600000),
      currency: "COP",
      gateway: "mercadopago",
      ...data
    }));

    const result = await service.create("tenant-1", { debt_id: "debt-1" });
    expect(result.url).toContain("tok-abc");
    expect(result.amount).toBe(100000);
    expect(result.gateway).toBe("mercadopago");
  });
});
