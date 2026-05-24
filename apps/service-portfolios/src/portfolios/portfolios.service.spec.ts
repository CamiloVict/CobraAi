import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortfoliosService } from "./portfolios.service";

describe("PortfoliosService", () => {
  const prisma = {
    portfolio: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    debt: {
      groupBy: vi.fn()
    }
  };

  let service: PortfoliosService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PortfoliosService(prisma as never);
  });

  it("creates portfolio for tenant", async () => {
    prisma.portfolio.create.mockResolvedValue({ id: "p1", name: "Test" });
    const result = await service.create("org_1", { name: "Test" });
    expect(result.id).toBe("p1");
    expect(prisma.portfolio.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: "org_1" }) })
    );
  });

  it("throws when portfolio missing", async () => {
    prisma.portfolio.findFirst.mockResolvedValue(null);
    await expect(service.findOne("org_1", "missing")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
