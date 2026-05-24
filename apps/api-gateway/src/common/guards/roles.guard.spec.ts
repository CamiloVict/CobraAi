import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RolesGuard } from "./roles.guard";

describe("RolesGuard", () => {
  const reflector = { getAllAndOverride: vi.fn() };
  let guard: RolesGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function mockContext(role?: string, required?: string) {
    reflector.getAllAndOverride.mockReturnValue(required);
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ clerkOrgRole: role })
      })
    };
  }

  it("allows access without @Roles()", () => {
    expect(guard.canActivate(mockContext("agent") as never)).toBe(true);
  });

  it("allows admin on admin route", () => {
    expect(guard.canActivate(mockContext("admin", "admin") as never)).toBe(true);
  });

  it("denies agent on admin route", () => {
    expect(() =>
      guard.canActivate(mockContext("agent", "admin") as never)
    ).toThrow(ForbiddenException);
  });

  it("allows admin on agent route via hierarchy", () => {
    expect(guard.canActivate(mockContext("admin", "agent") as never)).toBe(true);
  });
});
