import { describe, expect, it } from "vitest";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../src/common/decorators/public.decorator";
import { ClerkAuthGuard } from "../src/common/guards/clerk-auth.guard";

describe("Clerk auth e2e", () => {
  it("permite rutas públicas sin token", async () => {
    const reflector = new Reflector();
    const handler = () => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);

    const guard = new ClerkAuthGuard(
      reflector,
      new ConfigService({ CLERK_SECRET_KEY: "sk_test_fake" })
    );

    const allowed = await guard.canActivate({
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} })
      })
    } as never);

    expect(allowed).toBe(true);
  });

  it("rechaza request sin Authorization", async () => {
    const guard = new ClerkAuthGuard(
      new Reflector(),
      new ConfigService({ CLERK_SECRET_KEY: "sk_test_fake" })
    );

    await expect(
      guard.canActivate({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} })
        })
      } as never)
    ).rejects.toThrow("Token requerido");
  });
});
