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

  it("администратор компании — условно", () => {
    const v = beckhamVerdict({ ...ok, basis: "admin" });
    expect(v.status).toBe("maybe");
    expect(availabilityOf("beckham", v)).toBe("check");
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
      { ...ok, filed: "no" },
      { ...ok, prior: "yes" },
      { ...ok, arrival: "earlier" },
    ];
    for (const c of cases) for (const s of beckhamVerdict(c).sources) expect(SOURCES).toHaveProperty(s);
  });
});
