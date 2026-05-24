import { describe, expect, it } from "vitest";
import { WaterfallService } from "./waterfall.service";

describe("WaterfallService", () => {
  const service = new WaterfallService();

  it("escala whatsapp → voice → email → sms", () => {
    const available = ["whatsapp", "voice", "email", "sms"] as const;
    expect(service.nextChannel(null, [...available])).toBe("whatsapp");
    expect(service.nextChannel("whatsapp", [...available])).toBe("voice");
    expect(service.nextChannel("voice", [...available])).toBe("email");
    expect(service.nextChannel("email", [...available])).toBe("sms");
    expect(service.nextChannel("sms", [...available])).toBeNull();
  });

  it("respeta canales disponibles", () => {
    expect(service.nextChannel(null, ["email", "sms"])).toBe("email");
    expect(service.nextChannel("email", ["email", "sms"])).toBe("sms");
  });
});
