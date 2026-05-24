import { describe, expect, it } from "vitest";
import {
  getAgingBucket,
  getCollectionQuarter,
  getInitialDebtStatus,
  getQuarterDateRange,
  getQuarterLabel,
  isActiveDebt
} from "./quarters";

describe("getCollectionQuarter", () => {
  it("asigna Q1–Q4 correctamente", () => {
    expect(getCollectionQuarter(new Date("2026-01-15"))).toBe("Q1-2026");
    expect(getCollectionQuarter(new Date("2026-04-01"))).toBe("Q2-2026");
    expect(getCollectionQuarter(new Date("2026-08-22"))).toBe("Q3-2026");
    expect(getCollectionQuarter(new Date("2026-11-01"))).toBe("Q4-2026");
  });

  it("maneja bordes de año", () => {
    expect(getCollectionQuarter(new Date("2026-12-31"))).toBe("Q4-2026");
    expect(getCollectionQuarter(new Date("2027-01-01"))).toBe("Q1-2027");
  });
});

describe("getInitialDebtStatus", () => {
  const today = new Date("2026-05-24");

  it("future cuando vence en más de 30 días", () => {
    const due = new Date("2026-08-22");
    expect(getInitialDebtStatus(due, undefined, today)).toEqual({
      status: "future",
      agingBucket: "future"
    });
  });

  it("upcoming cuando vence en ≤ 30 días", () => {
    const due = new Date("2026-06-10");
    expect(getInitialDebtStatus(due, undefined, today)).toEqual({
      status: "upcoming",
      agingBucket: "upcoming"
    });
  });

  it("new cuando vence hoy", () => {
    expect(getInitialDebtStatus(today, undefined, today)).toEqual({
      status: "new",
      agingBucket: "d0_30"
    });
  });

  it("active y d31_60 cuando vencida 45 días", () => {
    const due = new Date("2026-04-09");
    expect(getInitialDebtStatus(due, undefined, today)).toEqual({
      status: "active",
      agingBucket: "d31_60"
    });
  });

  it("d180_plus cuando vencida 200 días", () => {
    const due = new Date("2025-11-05");
    expect(getInitialDebtStatus(due, undefined, today).agingBucket).toBe("d180_plus");
  });
});

describe("getAgingBucket", () => {
  const today = new Date("2026-05-24");

  it("cubre límites de buckets", () => {
    expect(getAgingBucket(new Date("2026-05-24"), today)).toBe("d0_30");
    expect(getAgingBucket(new Date("2026-04-23"), today)).toBe("d31_60");
    expect(getAgingBucket(new Date("2026-03-24"), today)).toBe("d61_90");
    expect(getAgingBucket(new Date("2026-01-23"), today)).toBe("d91_180");
    expect(getAgingBucket(new Date("2025-05-23"), today)).toBe("d180_plus");
  });
});

describe("isActiveDebt", () => {
  it("excluye future, upcoming y pagadas", () => {
    expect(isActiveDebt("future")).toBe(false);
    expect(isActiveDebt("upcoming")).toBe(false);
    expect(isActiveDebt("paid_full")).toBe(false);
    expect(isActiveDebt("written_off")).toBe(false);
  });

  it("incluye estados de gestión", () => {
    expect(isActiveDebt("new")).toBe(true);
    expect(isActiveDebt("active")).toBe(true);
    expect(isActiveDebt("contacted")).toBe(true);
    expect(isActiveDebt("legal")).toBe(true);
  });
});

describe("getQuarterDateRange", () => {
  it("retorna rango Q3-2026", () => {
    const { start, end } = getQuarterDateRange("Q3-2026");
    expect(start.toISOString().slice(0, 10)).toBe("2026-07-01");
    expect(end.toISOString().slice(0, 10)).toBe("2026-09-30");
  });
});

describe("getQuarterLabel", () => {
  it("formatea etiqueta", () => {
    expect(getQuarterLabel("Q3-2026")).toBe("Jul – Sep 2026");
  });
});
