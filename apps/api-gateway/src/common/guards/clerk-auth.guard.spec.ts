import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClerkAuthGuard } from "./clerk-auth.guard";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn()
}));

import { verifyToken } from "@clerk/backend";

describe("ClerkAuthGuard", () => {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
  const config = { get: vi.fn().mockReturnValue("sk_test_secret") };
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new ClerkAuthGuard(
      reflector as unknown as Reflector,
      config as unknown as ConfigService
    );
  });

  function mockContext(request: Record<string, unknown>) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request
      })
    };
  }

  it("allows public routes", async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const result = await guard.canActivate(mockContext({}) as never);
    expect(result).toBe(true);
  });

  it("throws when token is missing", async () => {
    await expect(
      guard.canActivate(mockContext({ headers: {} }) as never)
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("injects clerk context on valid token", async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: "user_test",
      org_id: "org_test",
      org_role: "org:admin"
    } as never);

    const request = {
      headers: { authorization: "Bearer valid_token" }
    };

    const result = await guard.canActivate(mockContext(request) as never);
    expect(result).toBe(true);
    expect(request).toMatchObject({
      clerkUserId: "user_test",
      clerkOrgId: "org_test",
      clerkOrgRole: "admin"
    });
  });

  it("throws on invalid token", async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error("invalid"));
    await expect(
      guard.canActivate(
        mockContext({ headers: { authorization: "Bearer bad" } }) as never
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
