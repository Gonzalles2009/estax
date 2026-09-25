import { describe, expect, it } from "vitest";
import { DEFAULTS, LEGACY_WORK_EXPENSES } from "@/lib/defaults";
import { fromQuery, toQuery } from "./calc";

describe("состояние в ссылке", () => {
  it("по умолчанию ссылка пустая", () => {
    expect(toQuery(DEFAULTS)).toBe("");
    expect(fromQuery("")).toEqual({});
  });

  it("новая ссылка переживает круг туда-обратно, расходы 0 — явно", () => {
    const s = { ...DEFAULTS, budget: 90000, region: "cataluna" as const };
    const q = toQuery(s);
    expect(q).toContain("x=0");
    expect(fromQuery(q)).toMatchObject({ budget: 90000, region: "cataluna", workExpenses: 0 });
    expect(fromQuery(toQuery({ ...s, workExpenses: 250 })).workExpenses).toBe(250);
  });

  it("старая ссылка без «x» открывается с прежними расходами по умолчанию", () => {
    expect(fromQuery("?b=90000&r=cataluna").workExpenses).toBe(LEGACY_WORK_EXPENSES);
    expect(fromQuery("?b=90000&x=0").workExpenses).toBe(0);
    // Посторонние параметры (метки рекламы) расчётом не считаются
    expect(fromQuery("?utm_source=tg")).toEqual({});
  });

  it("ответы проверки Beckham сохраняются", () => {
    const s = { ...DEFAULTS, beckham: { arrival: "2025" as const, prior: "no" as const, basis: "remote" as const, filed: "yes" as const } };
    expect(fromQuery(toQuery(s)).beckham).toEqual(s.beckham);
  });
});
