import { describe, expect, it, vi } from "vitest";
import { WhatsAppAdapter } from "./whatsapp.adapter";

describe("WhatsAppAdapter stub", () => {
  it("publica evento Kafka y retorna sent", async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const kafka = { publish } as never;
    const adapter = new WhatsAppAdapter(kafka);

    const result = await adapter.sendTemplate({
      to: "+573001234567",
      template_id: "tpl-wa",
      variables: { nombre: "Ana" },
      tenant_id: "org_demo"
    });

    expect(result.status).toBe("sent");
    expect(result.message_id).toBeTruthy();
    expect(publish).toHaveBeenCalledWith(
      "cobrai.whatsapp.send_requested",
      "org_demo",
      expect.objectContaining({
        to: "+573001234567",
        template_id: "tpl-wa"
      })
    );
  });
});
