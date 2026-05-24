import { describe, expect, it } from "vitest";
import { WaterfallService } from "../src/orchestrator/waterfall.service";

describe("waterfall e2e", () => {
  const service = new WaterfallService();

  it("recorre canales en orden omnicanal", () => {
    const channels = ["whatsapp", "voice", "email", "sms"] as const;
    let current: (typeof channels)[number] | null = null;
    const visited: string[] = [];

    while (current !== null || visited.length === 0) {
      const next = service.nextChannel(current, [...channels]);
      if (!next) break;
      visited.push(next);
      current = next;
    }

    expect(visited).toEqual(["whatsapp", "voice", "email", "sms"]);
  });
});
