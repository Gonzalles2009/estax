import type { KnownSourceId as SourceId } from "./tax/sources";
import { P } from "./tax/params-2026";

/**
 * Проверка права на режим импатриантов («Ley Beckham»).
 * Условия — art. 93.1 LIRPF (в редакции Ley 28/2022) и art. 113–116 RIRPF (RD 1008/2023):
 *  a) не быть резидентом Испании 5 налоговых периодов до переезда;
 *  b) переехать из-за работы по найму (в т.ч. удалённой или по направлению работодателя),
 *     должности администратора, предпринимательства с одобрением ENISA
 *     или работы высококвалифицированного специалиста на стартап;
 *  c) не вести деятельность через постоянное представительство (обычный autónomo не подходит);
 *  режим действует в год переезда и ещё 5 лет, заявление (modelo 149) — не позже 6 месяцев
 *  с даты alta в Seguridad Social.
 */

const YEAR = P.year;

/** Год, с которого вы налоговый резидент Испании */
export type BkArrival = "planned" | `${number}` | "earlier";
/** Были ли резидентом Испании в любой из 5 лет до переезда */
export type BkPrior = "no" | "yes";
/** Основание переезда */
export type BkBasis = "hire" | "remote" | "transfer" | "admin" | "enisa" | "startup" | "family" | "freelance" | "other";
/** Подано ли заявление modelo 149 */
export type BkFiled = "yes" | "pending" | "no";

export interface BeckhamAnswers {
  arrival: BkArrival | null;
  prior: BkPrior | null;
  basis: BkBasis | null;
  filed: BkFiled | null;
}

export const EMPTY_BECKHAM: BeckhamAnswers = { arrival: null, prior: null, basis: null, filed: null };

export type BeckhamStatus = "unknown" | "yes" | "maybe" | "no";

export interface BeckhamVerdict {
  status: BeckhamStatus;
  title: string;
  text: string;
  /** Последний год действия режима */
  until?: number;
  /** На каком вопросе остановились: следующие не нужны */
  stopAt?: keyof BeckhamAnswers;
  sources: SourceId[];
}

/** Годы переезда, при которых режим ещё действует в текущем году: год переезда + 5 */
export const ARRIVAL_YEARS: string[] = Array.from({ length: 6 }, (_, i) => String(YEAR - i));

export const QUESTIONS: {
  key: keyof BeckhamAnswers;
  title: string;
  hint?: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "arrival",
    title: "С какого года вы налоговый резидент Испании?",
    hint: "Первый год, в котором вы провели в Испании больше 183 дней",
    options: [
      { value: "planned", label: "Ещё не переехал(а)" },
      ...ARRIVAL_YEARS.map((y) => ({ value: y, label: y })),
      { value: "earlier", label: `${YEAR - 6} или раньше` },
    ],
  },
  {
    key: "prior",
    title: "В любой из 5 лет до этого вы были налоговым резидентом Испании?",
    options: [
      { value: "no", label: "Нет" },
      { value: "yes", label: "Да" },
    ],
  },
  {
    key: "basis",
    title: "Из-за чего вы переехали?",
    options: [
      { value: "hire", label: "Контракт с испанской компанией" },
      { value: "remote", label: "Удалённо на иностранного работодателя" },
      { value: "transfer", label: "Перевод от работодателя" },
      { value: "admin", label: "Администратор компании" },
      { value: "enisa", label: "Свой бизнес с одобрением ENISA" },
      { value: "startup", label: "Специалист для стартапа или R&D" },
      { value: "family", label: "Вслед за супругом или родителем с Beckham" },
      { value: "freelance", label: "Обычный фриланс / autónomo" },
      { value: "other", label: "Другое" },
    ],
  },
  {
    key: "filed",
    title: "Вы подали modelo 149?",
    hint: "Срок — 6 месяцев с даты alta в Seguridad Social (члену семьи — с въезда в Испанию)",
    options: [
      { value: "yes", label: "Да, режим оформлен" },
      { value: "pending", label: "Ещё нет, 6 месяцев не прошли" },
      { value: "no", label: "Нет, срок прошёл" },
    ],
  },
];

const SRC_LAW: SourceId[] = ["lirpf_93"];
const SRC_FILING: SourceId[] = ["lirpf_93", "rirpf_116"];

const SRC_RIRPF: SourceId[] = ["lirpf_93", "rirpf_114"];

const UNKNOWN: BeckhamVerdict = {
  status: "unknown",
  title: "Не проверено",
  text: "Режим только для недавно переехавших по работе. Ответьте на несколько вопросов — калькулятор учтёт ответ.",
  sources: SRC_LAW,
};

/**
 * Вердикт по ответам — строго по порядку вопросов: ответ учитывается,
 * только если на все предыдущие уже ответили (как и видно в интерфейсе).
 */
export function beckhamVerdict(a: BeckhamAnswers): BeckhamVerdict {
  if (a.arrival === null) return UNKNOWN;
  if (a.arrival === "earlier") {
    return {
      status: "no",
      title: "Срок режима уже вышел",
      text: `Режим действует шесть лет: год переезда и ещё пять. При переезде в ${YEAR - 6} году или раньше он закончился не позже ${YEAR - 1}-го.`,
      stopAt: "arrival",
      sources: SRC_LAW,
    };
  }

  if (a.prior === null) return UNKNOWN;
  if (a.prior === "yes") {
    return {
      status: "no",
      title: "Не подходит: нужно 5 лет без резидентства",
      text: "Режим только для тех, кто не был налоговым резидентом Испании ни в один из пяти лет до переезда (art. 93.1.a LIRPF).",
      stopAt: "prior",
      sources: SRC_LAW,
    };
  }

  if (a.basis === null) return UNKNOWN;
  if (a.basis === "freelance") {
    return {
      status: "no",
      title: "Обычный фриланс режима не даёт",
      text: "Обычный autónomo, в том числе с иностранными клиентами, под режим не подпадает (art. 93.1.c LIRPF). Если ваш бизнес одобрен ENISA или вы работаете на стартап как высококвалифицированный специалист — выберите этот вариант выше.",
      stopAt: "basis",
      sources: SRC_LAW,
    };
  }
  if (a.basis === "other") {
    return {
      status: "no",
      title: "Нужен переезд ради работы",
      text: "Режим дают за переезд ради работы по найму, должности администратора, бизнеса с одобрением ENISA или работы на стартап (art. 93.1.b LIRPF). Если вы переехали вслед за супругом или родителем с Beckham — выберите этот вариант выше.",
      stopAt: "basis",
      sources: SRC_LAW,
    };
  }

  if (a.arrival !== "planned") {
    if (a.filed === null) return UNKNOWN;
    if (a.filed === "no") {
      return {
        status: "no",
        title: "Срок заявления пропущен",
        text: "Modelo 149 подают не позже шести месяцев с даты alta в Seguridad Social, члену семьи — с въезда в Испанию (art. 116 RIRPF). Пропущенный срок не восстанавливается.",
        stopAt: "filed",
        sources: SRC_FILING,
      };
    }
  }

  const until = a.arrival === "planned" ? undefined : Number(a.arrival) + 5;
  const period = until ? `по ${until} год включительно` : "шесть лет: год переезда и ещё пять";
  const noAutonomo = "Пока режим действует, вести обычную деятельность autónomo нельзя.";
  const model = "Калькулятор считает Beckham для зарплаты по найму.";

  // Пути, где право зависит от условий, которые калькулятор проверить не может
  const conditional: Partial<Record<BkBasis, { text: string; sources: SourceId[] }>> = {
    admin: {
      text: `Администратор компании подходит, если компания ведёт реальную деятельность; если это холдинг (entidad patrimonial), доля должна быть меньше 25% (art. 93.1.b.2º LIRPF). Режим действует ${period}. ${model}`,
      sources: SRC_LAW,
    },
    enisa: {
      text: `Нужен положительный отчёт ENISA о том, что бизнес инновационный, — полученный до переезда (art. 93.1.b.3º LIRPF, art. 113 RIRPF). Тогда по 24% облагается и доход от этого бизнеса. Режим действует ${period}. ${model}`,
      sources: SRC_RIRPF,
    },
    startup: {
      text: `Нужна квалификация высококвалифицированного специалиста (art. 71 Ley 14/2013), а работа на стартап по Ley 28/2022 или в обучении и R&D должна давать больше 40% всех ваших доходов (art. 93.1.b.4º LIRPF, art. 113 RIRPF). Режим действует ${period}. ${model}`,
      sources: SRC_RIRPF,
    },
    family: {
      text: "Супруг, дети до 25 лет или второй родитель подходят, если переехали вместе с членом семьи, у которого Beckham, или до конца его первого года в режиме, и если сумма их баз меньше его базы (art. 93.3 LIRPF). Режим действует, пока он действует у него.",
      sources: SRC_LAW,
    },
  };
  const c = conditional[a.basis];
  if (c) {
    return { status: "maybe", title: "Возможно, доступен", text: c.text, until: a.basis === "family" ? undefined : until, sources: c.sources };
  }

  const filing =
    a.arrival === "planned"
      ? "После переезда подайте modelo 149 в течение шести месяцев с даты alta в Seguridad Social."
      : a.filed === "pending"
        ? "Не забудьте подать modelo 149 до конца шестого месяца с даты alta в Seguridad Social — потом право сгорает."
        : "";
  return {
    status: "yes",
    title: until ? `Доступен по ${until} год` : "Будет доступен после переезда",
    text: [`Условия выполнены: режим действует ${period}.`, filing, noAutonomo].filter(Boolean).join(" "),
    until,
    sources: SRC_FILING,
  };
}

/** Какие вопросы показывать: по порядку, до первого без ответа или до отказа */
export function visibleQuestions(a: BeckhamAnswers, verdict = beckhamVerdict(a)) {
  const out: (typeof QUESTIONS)[number][] = [];
  for (const q of QUESTIONS) {
    if (q.key === "filed" && a.arrival === "planned") continue;
    out.push(q);
    if (verdict.stopAt === q.key) break;
    if (a[q.key] === null) break;
  }
  return out;
}

/* ───────── URL: bk=2025.no.hire.yes, «-» — нет ответа ───────── */

const ALLOWED: { [K in keyof BeckhamAnswers]: string[] } = {
  arrival: ["planned", "earlier", ...ARRIVAL_YEARS],
  prior: ["no", "yes"],
  basis: ["hire", "remote", "transfer", "admin", "enisa", "startup", "family", "freelance", "other"],
  filed: ["yes", "pending", "no"],
};
const KEYS = Object.keys(ALLOWED) as (keyof BeckhamAnswers)[];

export function encodeBeckham(a: BeckhamAnswers): string {
  if (KEYS.every((k) => a[k] === null)) return "";
  return KEYS.map((k) => a[k] ?? "-").join(".");
}

export function decodeBeckham(s: string | null): BeckhamAnswers | undefined {
  if (!s) return undefined;
  const parts = s.split(".");
  const out = { ...EMPTY_BECKHAM } as Record<keyof BeckhamAnswers, string | null>;
  KEYS.forEach((k, i) => {
    const v = parts[i];
    out[k] = v && ALLOWED[k].includes(v) ? v : null;
  });
  return out as BeckhamAnswers;
}

/** Доступность режима с учётом проверки: ok — считается лучшим наравне с другими */
export type Availability = "ok" | "check" | "no";

export function availabilityOf(regime: string, verdict: BeckhamVerdict): Availability {
  if (regime !== "beckham") return "ok";
  if (verdict.status === "yes") return "ok";
  if (verdict.status === "no") return "no";
  return "check";
}
