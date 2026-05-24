import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConfigService } from "@nestjs/config";
import { EmailAdapter } from "./email.adapter";

describe("EmailAdapter", () => {
  let adapter: EmailAdapter;

  beforeEach(() => {
    const config = {
      get: vi.fn((key: string) => {
        if (key === "SENDGRID_API_KEY") return undefined;
        if (key === "SENDGRID_FROM_EMAIL") return "noreply@test.com";
        return undefined;
      })
    };
    adapter = new EmailAdapter(config as unknown as ConfigService);
  });

  it("simula envío sin API key", async () => {
    const result = await adapter.sendTemplate({
      to: "test@example.com",
      template_id: "tpl-1",
      variables: { body: "Hola" },
      tenant_id: "t1"
    });
    expect(result.status).toBe("sent");
    expect(result.message_id).toBeTruthy();
  });
});
