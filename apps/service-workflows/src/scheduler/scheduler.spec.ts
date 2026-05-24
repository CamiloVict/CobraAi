import { describe, expect, it } from "vitest";
import { filterDebtsForContact } from "../rule-engine/rule-engine.service";

describe("scheduler filters", () => {
  it("excluye deudas ya encoladas", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const queued = new Set(["b"]);
    const result = filterDebtsForContact(items, queued);
    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
  });
});
