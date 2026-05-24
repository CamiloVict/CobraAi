import { describe, expect, it } from "vitest";
import { WebhookValidatorService } from "./webhook-validator.service";

describe("WebhookValidatorService", () => {
  const config = {
    get: (key: string) => {
      if (key === "CONEKTA_WEBHOOK_SECRET") return "test_secret";
      if (key === "MP_WEBHOOK_SECRET") return "mp_secret";
      return undefined;
    }
  };

  const service = new WebhookValidatorService(config as never);

  it("permite webhook sin secret configurado", () => {
    const noSecret = new WebhookValidatorService({ get: () => undefined } as never);
    expect(() => noSecret.verifyConektaSignature("{}", undefined)).not.toThrow();
  });

  it("rechaza firma Conekta inválida", () => {
    expect(() =>
      service.verifyConektaSignature('{"a":1}', "invalid")
    ).toThrow("Firma Conekta inválida");
  });
});
