import { describe, expect, it, vi } from "vitest";
import { of } from "rxjs";
import { AuditInterceptor } from "./audit.interceptor";

describe("AuditInterceptor", () => {
  it("registra escrituras en audit_logs", async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { auditLog: { create } } as never;
    const interceptor = new AuditInterceptor(prisma);

    const req = {
      method: "POST",
      path: "/api/v1/debts",
      tenantId: "tenant-1",
      userId: "user-1",
      body: { amount: 100 },
      params: {},
      headers: { "user-agent": "test" },
      ip: "127.0.0.1"
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => req })
    } as never;

    await new Promise<void>((resolve) => {
      interceptor
        .intercept(context, { handle: () => of({ data: { id: "550e8400-e29b-41d4-a716-446655440000" } }) })
        .subscribe({
          complete: () => resolve()
        });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          action: "POST /api/v1/debts"
        })
      })
    );
  });

  it("registra lectura sensible de deudor", async () => {
    const create = vi.fn().mockResolvedValue({});
    const prisma = { auditLog: { create } } as never;
    const interceptor = new AuditInterceptor(prisma);

    const req = {
      method: "GET",
      path: "/api/v1/debtors/550e8400-e29b-41d4-a716-446655440000",
      tenantId: "tenant-1",
      userId: "user-1",
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      headers: {},
      ip: "127.0.0.1"
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => req })
    } as never;

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, { handle: () => of({}) }).subscribe({
        complete: () => resolve()
      });
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "debtor.sensitive_read"
        })
      })
    );
  });
});
