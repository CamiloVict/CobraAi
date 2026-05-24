import { describe, expect, it } from "vitest";
import { CsvParserService } from "./csv-parser.service";

describe("CsvParserService", () => {
  const parser = new CsvParserService();

  it("parses valid UTF-8 CSV", () => {
    const csv = Buffer.from(
      "external_ref,debtor_name,debtor_tax_id,debtor_phone,debtor_email,amount,currency,due_date\nREF-1,Juan,123,+573001234567,j@x.com,1000,COP,2026-01-15",
      "utf-8"
    );
    const rows = parser.parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.debtor_name).toBe("Juan");
    expect(rows[0]?.currency).toBe("COP");
  });

  it("throws on incomplete row", () => {
    const csv = Buffer.from("debtor_name,amount\nJuan,1000", "utf-8");
    expect(() => parser.parseCsv(csv)).toThrow();
  });
});
