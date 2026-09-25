import { describe, expect, it } from "vitest";
import {
  availabilityOf,
  beckhamVerdict,
  decodeBeckham,
  EMPTY_BECKHAM,
  encodeBeckham,
  visibleQuestions,
  type BeckhamAnswers,
} from "./beckham";
import { SOURCES } from "./tax/sources";

const ok: BeckhamAnswers = { arrival: "2025", prior: "no", basis: "hire", filed: "yes" };

describe("проверка Ley Beckham", () => {
  it("без ответов — не проверено, режим условный", () => {
    const v = beckhamVerdict(EMPTY_BECKHAM);
    expect(v.status).toBe("unknown");
    expect(availabilityOf("beckham", v)).toBe("check");
    expect(availabilityOf("employee", v)).toBe("ok");
  });

  it("все условия — доступен на год переезда и ещё 5 лет", () => {
    const v = beckhamVerdict(ok);
    expect(v.status).toBe("yes");
    expect(v.until).toBe(2030);
    expect(availabilityOf("beckham", v)).toBe("ok");
    expect(beckhamVerdict({ ...ok, arrival: "2021" }).until).toBe(2026);
  });

  it("удалённая работа, перевод и ещё не поданное заявление подходят", () => {
    for (const basis of ["remote", "transfer"] as const) expect(beckhamVerdict({ ...ok, basis }).status).toBe("yes");
    expect(beckhamVerdict({ ...ok, filed: "pending" }).status).toBe("yes");
  });

  it("до переезда вопрос о modelo 149 не задаётся", () => {
    const a: BeckhamAnswers = { arrival: "planned", prior: "no", basis: "remote", filed: null };
    expect(beckhamVerdict(a).status).toBe("yes");
    expect(beckhamVerdict(a).until).toBeUndefined();
    expect(visibleQuestions(a).map((q) => q.key)).toEqual(["arrival", "prior", "basis"]);
  });

  it("каждое нарушенное условие закрывает режим, даже без остальных ответов", () => {
    expect(beckhamVerdict({ ...EMPTY_BECKHAM, arrival: "earlier" }).status).toBe("no");
    expect(beckhamVerdict({ ...EMPTY_BECKHAM, arrival: "2024", prior: "yes" }).status).toBe("no");
    expect(beckhamVerdict({ ...ok, basis: "freelance", filed: null }).status).toBe("no");
    expect(beckhamVerdict({ ...ok, basis: "other" }).status).toBe("no");
    expect(beckhamVerdict({ ...ok, filed: "no" }).status).toBe("no");
    expect(availabilityOf("beckham", beckhamVerdict({ ...ok, filed: "no" }))).toBe("no");
  });

  it("администратор, ENISA, стартап и член семьи — условно", () => {
    for (const basis of ["admin", "enisa", "startup", "family"] as const) {
      const v = beckhamVerdict({ ...ok, basis });
      expect(v.status).toBe("maybe");
      expect(availabilityOf("beckham", v)).toBe("check");
    }
    // Член семьи — пока режим действует у того, кто переехал по работе
    expect(beckhamVerdict({ ...ok, basis: "family" }).until).toBeUndefined();
  });

  it("ответы на скрытые вопросы не влияют на вердикт", () => {
    // Сняли ответ о годе переезда — прежний «срок прошёл» больше не учитывается
    const a: BeckhamAnswers = { arrival: null, prior: "no", basis: "hire", filed: "no" };
    expect(beckhamVerdict(a).status).toBe("unknown");
    expect(visibleQuestions(a).map((q) => q.key)).toEqual(["arrival"]);
    expect(beckhamVerdict({ ...a, prior: null, arrival: "2025" }).status).toBe("unknown");
    // Вернули ответ — остальные снова в силе
    expect(beckhamVerdict({ ...a, arrival: "2025" }).status).toBe("no");
  });

  it("вопросы открываются по одному и обрываются на отказе", () => {
    expect(visibleQuestions(EMPTY_BECKHAM).map((q) => q.key)).toEqual(["arrival"]);
    expect(visibleQuestions({ ...EMPTY_BECKHAM, arrival: "2026" }).map((q) => q.key)).toEqual(["arrival", "prior"]);
    expect(visibleQuestions({ ...EMPTY_BECKHAM, arrival: "earlier", prior: "no" }).map((q) => q.key)).toEqual(["arrival"]);
    expect(visibleQuestions(ok).map((q) => q.key)).toEqual(["arrival", "prior", "basis", "filed"]);
  });

  it("ответы переживают ссылку и отбрасывают мусор", () => {
    expect(encodeBeckham(EMPTY_BECKHAM)).toBe("");
    expect(decodeBeckham(encodeBeckham(ok))).toEqual(ok);
    const partial: BeckhamAnswers = { ...EMPTY_BECKHAM, arrival: "planned", basis: "remote" };
    expect(decodeBeckham(encodeBeckham(partial))).toEqual(partial);
    expect(decodeBeckham("1999.maybe.hire")).toEqual({ ...EMPTY_BECKHAM, basis: "hire" });
    expect(decodeBeckham(null)).toBeUndefined();
  });

  it("каждый вывод ссылается на известный источник", () => {
    const cases: BeckhamAnswers[] = [
      EMPTY_BECKHAM,
      ok,
      { ...ok, basis: "admin" },
      { ...ok, basis: "enisa" },
      { ...ok, basis: "startup" },
      { ...ok, basis: "family" },
      { ...ok, basis: "freelance" },
      { ...ok, basis: "other" },
      { ...ok, filed: "no" },
      { ...ok, prior: "yes" },
      { ...ok, arrival: "earlier" },
    ];
    for (const c of cases) for (const s of beckhamVerdict(c).sources) expect(SOURCES).toHaveProperty(s);
  });
});

describe("переезд до 2023 года — прежняя редакция art. 93", () => {
  it("10 лет без резидентства и вопрос об этом", () => {
    const a: BeckhamAnswers = { arrival: "2022", prior: null, basis: null, filed: null };
    expect(visibleQuestions(a).find((q) => q.key === "prior")?.title).toContain("10 лет");
    expect(visibleQuestions({ ...a, arrival: "2024" }).find((q) => q.key === "prior")?.title).toContain("5 лет");
    expect(beckhamVerdict({ ...a, prior: "yes" }).title).toContain("10 лет");
  });

  it("удалёнка, ENISA, стартап и семья до 2023 года не подходят; контракт и перевод — да", () => {
    for (const basis of ["remote", "enisa", "startup", "family"] as const) {
      expect(beckhamVerdict({ arrival: "2021", prior: "no", basis, filed: "yes" }).status).toBe("no");
      expect(beckhamVerdict({ arrival: "2023", prior: "no", basis, filed: "yes" }).status).not.toBe("no");
    }
    expect(beckhamVerdict({ arrival: "2022", prior: "no", basis: "hire", filed: "yes" })).toMatchObject({ status: "yes", until: 2027 });
    expect(beckhamVerdict({ arrival: "2021", prior: "no", basis: "transfer", filed: "yes" }).status).toBe("yes");
    expect(beckhamVerdict({ arrival: "2022", prior: "no", basis: "admin", filed: "yes" }).status).toBe("maybe");
  });
});
