import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { RolesGuard } from "../src/common/guards/roles.guard";

describe("rbac e2e", () => {
  it("deniega agent en ruta admin", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue("admin") };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ clerkOrgRole: "agent" })
      })
    };

    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenException);
  });

  it("permite admin en ruta admin", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue("admin") };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ clerkOrgRole: "admin" })
      })
    };

    expect(guard.canActivate(context as never)).toBe(true);
  });
});
