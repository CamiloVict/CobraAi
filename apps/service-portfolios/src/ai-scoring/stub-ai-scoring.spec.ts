import { describe, expect, it } from "vitest";
import { StubAIScoringAdapter } from "./stub-ai-scoring.adapter";

describe("StubAIScoringAdapter", () => {
  const adapter = new StubAIScoringAdapter();

  it("returns deterministic score for same inputs", async () => {
    const input = {
      debt_id: "d1",
      tenant_id: "t1",
      features: {
        aging_days: 60,
        amount: 1000,
        amount_outstanding: 1000,
        has_whatsapp: true,
        has_phone: true,
        has_email: true,
        promises_broken_count: 0,
        previous_contacts_count: 0
      }
    };
    const a = await adapter.scoreDebt(input);
    const b = await adapter.scoreDebt(input);
    expect(a.score).toBe(b.score);
    expect(a.score).toBe(97);
    expect(a.segment).toBe("minimal");
    expect(a.best_channel).toBe("whatsapp");
  });

  it("prefers voice when score below 50 and no whatsapp", async () => {
    const result = await adapter.scoreDebt({
      debt_id: "d2",
      tenant_id: "t1",
      features: {
        aging_days: 200,
        amount: 500,
        amount_outstanding: 500,
        has_whatsapp: false,
        has_phone: true,
        has_email: false,
        promises_broken_count: 0,
        previous_contacts_count: 0
      }
    });
    expect(result.score).toBeLessThan(50);
    expect(result.best_channel).toBe("voice");
  });
});
