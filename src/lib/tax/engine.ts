import type { Breakdown, Inputs, RegimeId, RegimeResult, Step } from "./types";
import { P } from "./params-2026";
import {
  applyScale,
  computeIrpf,
  familyDeduction,
  jointReduction,
  rentasBajasReduction,
  smiDeduction,
  workIncomeReduction,
} from "./irpf";
import {
  EMPLOYEE_RATE,
  EMPLOYER_RATE,
  employeeSS,
  grossFromEmployerCost,
  retaQuota,
} from "./social-security";
import { REGIONS } from "./regions-2026";

export const REGIME_IDS: readonly RegimeId[] = [
  "employee",
  "beckham",
  "autonomo",
  "autonomo_new",
  "sl_safe",
  "sl_optimal",
];

const pct = (x: number, digits = 2) =>
  `${(x * 100).toLocaleString("ru-RU", { maximumFractionDigits: digits })}%`;

function result(
  regime: RegimeId,
  inputs: Inputs,
  breakdown: Breakdown,
  steps: Step[],
  notes: string[],
  meta: RegimeResult["meta"] = {},
): RegimeResult {
  const toState =
    breakdown.irpf + breakdown.dividendTax + breakdown.corporateTax + breakdown.ssWorker + breakdown.ssEmployer;
  return {
    regime,
    budget: inputs.budget,
    netAnnual: breakdown.net,
    netMonthly: breakdown.net / 12,
    toState,
    effectiveRate: inputs.budget > 0 ? toState / inputs.budget : 0,
    breakdown,
    steps,
    notes,
    meta,
  };
}

/* ───────────────────────── IRPF по зарплате (общая база + сбережения) ───────────────────────── */

interface WageTax {
  kind: IncomeKind;
  rnPrevio: number;
  reduction: number;
  /** art. 32.2.3º — только для дохода от деятельности (socio SL) */
  rentasBajas: number;
  /** 2 000 € «otros gastos» (trabajo) или 5% gastos de difícil justificación (actividad) */
  fixedDeduction: number;
  rn: number;
  joint: number;
  blg: number;
  bla: number;
  general: number;
  savings: number;
  smi: number;
  irpf: ReturnType<typeof computeIrpf>;
}

/**
 * trabajo   — зарплата наёмного работника (art. 17 LIRPF)
 * actividad — вознаграждение socio за профессиональную работу в своей SL при регистрации в RETA
 *             (art. 27.1, párrafo 3º LIRPF): это доход от деятельности, а не зарплата
 */
type IncomeKind = "trabajo" | "actividad";

/**
 * IRPF по общей базе + дивиденды в базе сбережений.
 * trabajo:   íntegro − SS = RN previo → reducción art. 20 (от RN previo) → − 2 000 € → − reducción conjunta
 * actividad: íntegro − cuota = RN previo → − 5% difícil justificación (≤ 2 000 €) → − reducción conjunta
 */
function wageTax(grossWork: number, ssDeductible: number, dividends: number, inputs: Inputs, kind: IncomeKind): WageTax {
  const rnPrevio = Math.max(0, grossWork - ssDeductible);
  const reduction = kind === "trabajo" ? workIncomeReduction(rnPrevio, dividends) : 0;
  const fixedDeduction =
    kind === "trabajo"
      ? Math.min(P.irpf.otrosGastosTrabajo, rnPrevio)
      : Math.min(P.irpf.dificilJustificacion.cap, rnPrevio * P.irpf.dificilJustificacion.rate);
  const rentasBajas = kind === "actividad" ? rentasBajasReduction(rnPrevio - fixedDeduction, dividends) : 0;
  const rn = Math.max(0, rnPrevio - fixedDeduction - reduction - rentasBajas);
  const joint = jointReduction(inputs.family, inputs.children);
  const jointGeneral = Math.min(joint, rn);
  const blg = rn - jointGeneral;
  const bla = Math.max(0, dividends - (joint - jointGeneral));
  const irpf = computeIrpf({
    generalBase: blg,
    savingsBase: bla,
    region: inputs.region,
    family: inputs.family,
    children: inputs.children,
    childrenUnder3: inputs.childrenUnder3,
  });
  const smi = kind === "trabajo" ? smiDeduction(grossWork, dividends, irpf.general) : 0;
  return {
    kind,
    rnPrevio,
    reduction,
    rentasBajas,
    fixedDeduction,
    rn,
    joint,
    blg,
    bla,
    general: irpf.general - smi,
    savings: irpf.savings,
    smi,
    irpf,
  };
}

function irpfSteps(
  t: Pick<WageTax, "irpf" | "smi" | "savings">,
  inputs: Inputs,
  opts: { withSavings: boolean },
): Step[] {
  const region = REGIONS[inputs.region];
  const steps: Step[] = [];
  steps.push({
    group: "tax",
    label: "Mínimo personal y familiar (гос. часть)",
    amount: t.irpf.minState.total,
    kind: "info",
    note:
      t.irpf.minState.descendants > 0
        ? `${fmt(t.irpf.minState.personal)} на себя + ${fmt(t.irpf.minState.descendants)} на детей — облагается по 0%`
        : "Эта часть базы облагается по нулевой ставке",
    source: "lirpf_56",
  });
  if (region.minimos) {
    steps.push({
      group: "tax",
      label: `Mínimo в региональной части (${region.name})`,
      amount: t.irpf.minAuto.total,
      kind: "info",
      note: "Регион установил свои минимумы",
      source: "aeat_manual",
    });
  }
  steps.push({
    group: "tax",
    label: "IRPF — государственная шкала",
    amount: -t.irpf.generalState,
    kind: "minus",
    note: "9,5% → 24,5%",
    source: "lirpf_63",
  });
  steps.push({
    group: "tax",
    label: `IRPF — шкала ${region.name}`,
    amount: -t.irpf.generalAuto,
    kind: "minus",
    source: region.sourceUrl,
  });
  if (t.smi > 0) {
    steps.push({
      group: "tax",
      label: "Вычет для зарплат около SMI",
      amount: t.smi,
      kind: "plus",
      source: "lirpf",
      note: "DA 61ª LIRPF, 590,89 € до 17 094 € брутто",
    });
  }
  if (opts.withSavings) {
    steps.push({
      group: "tax",
      label: "IRPF на дивиденды (base del ahorro)",
      amount: -t.savings,
      kind: "minus",
      note: "19% / 21% / 23% / 27% / 30%",
      source: "lirpf_66",
    });
  }
  return steps;
}

function wageBaseSteps(t: WageTax, grossLabel: string, gross: number, ssLabel: string, ss: number): Step[] {
  const steps: Step[] = [
    { group: "base", label: grossLabel, amount: gross, kind: "start" },
    { group: "base", label: ssLabel, amount: -ss, kind: "minus", source: t.kind === "trabajo" ? "lirpf_19" : "lirpf_30" },
  ];
  if (t.reduction > 0) {
    steps.push({
      group: "base",
      label: "Reducción por rendimientos del trabajo",
      amount: -t.reduction,
      kind: "minus",
      note: "Для доходов до 19 747,50 €",
      source: "lirpf_20",
    });
  }
  steps.push(
    t.kind === "trabajo"
      ? {
          group: "base",
          label: "«Otros gastos» — фиксированный вычет",
          amount: -t.fixedDeduction,
          kind: "minus",
          source: "lirpf_19",
        }
      : {
          group: "base",
          label: `Gastos de difícil justificación (${pct(P.irpf.dificilJustificacion.rate, 0)}, макс. 2 000 €)`,
          amount: -t.fixedDeduction,
          kind: "minus",
          source: "lirpf_30",
        },
  );
  if (t.rentasBajas > 0) steps.push(rentasBajasStep(t.rentasBajas));
  if (t.joint > 0) {
    steps.push({
      group: "base",
      label: "Reducción por tributación conjunta",
      amount: -Math.min(t.joint, t.rn),
      kind: "minus",
      source: "lirpf_84",
    });
  }
  steps.push({ group: "base", label: "Base liquidable general", amount: t.blg, kind: "subtotal" });
  return steps;
}

function rentasBajasStep(amount: number): Step {
  return {
    group: "base",
    label: "Reducción por rentas bajas",
    amount: -amount,
    kind: "minus",
    note: "art. 32.2.3º: при доходах до 12 000 € — до 1 620 €",
    source: "lirpf_32",
  };
}

interface FamilyCredit {
  amount: number;
  label: string;
  /** IRPF к уплате после вычета */
  general: number;
  savings: number;
  /** Часть вычета сверх налога — Hacienda её выплачивает */
  benefit: number;
}

/** Вычет art. 81 bis уменьшает cuota diferencial: сначала общую часть, затем сбережения, остаток — выплата */
function familyCredit(inputs: Inputs, general: number, savings: number, ssTotal: number): FamilyCredit {
  const d = familyDeduction(inputs.family, inputs.children, ssTotal, inputs.noAlimony);
  const fromGeneral = Math.min(d.amount, Math.max(0, general));
  const fromSavings = Math.min(d.amount - fromGeneral, Math.max(0, savings));
  return {
    amount: d.amount,
    label: d.label,
    general: general - fromGeneral,
    savings: savings - fromSavings,
    benefit: d.amount - fromGeneral - fromSavings,
  };
}

/** Подсказка одинокому родителю с 2 детьми: вычет 81 bis зависит от алиментов, которых калькулятор не знает */
function familyNotes(inputs: Inputs): string[] {
  return inputs.family === "single" && inputs.children === 2 && !inputs.noAlimony
    ? ["Одинокому родителю с 2 детьми, который не получает на них алименты, положен вычет 1 200 € (art. 81 bis) — отметьте это в «Ещё параметры»."]
    : [];
}

function familySteps(fc: FamilyCredit): Step[] {
  if (fc.amount <= 0) return [];
  return [
    {
      group: "tax",
      label: `Вычет art. 81 bis — ${fc.label}`,
      amount: fc.amount,
      kind: "plus",
      note:
        fc.benefit > 0.5
          ? `Больше налога: ${fmt(fc.benefit)} € Hacienda выплатит — можно получать заранее помесячно`
          : "Уменьшает налог к уплате; можно получать заранее помесячно",
      source: "lirpf_81bis",
    },
  ];
}

function benefitFlowStep(fc: FamilyCredit): Step[] {
  return fc.benefit > 0.5
    ? [{ group: "flow", label: "Выплата Hacienda (вычет art. 81 bis сверх налога)", amount: fc.benefit, kind: "plus", source: "lirpf_81bis" }]
    : [];
}

/* ───────────────────────── 1. Наёмный работник ───────────────────────── */

function grossOf(inputs: Inputs): number {
  return inputs.employeeBasis === "cost" ? grossFromEmployerCost(inputs.budget) : inputs.budget;
}

function employee(inputs: Inputs): RegimeResult {
  const gross = grossOf(inputs);
  const ss = employeeSS(gross);
  const t = wageTax(gross, ss.employee, 0, inputs, "trabajo");
  const expenses = inputs.workExpenses * 12;
  const employer = inputs.employeeBasis === "cost" ? inputs.budget - gross : 0;
  // Лимит art. 81 bis — cotizaciones totales: доля работника + работодателя
  const fc = familyCredit(inputs, t.general, 0, ss.employee + ss.employer);
  const net = gross - ss.employee - fc.general - expenses + fc.benefit;

  const steps: Step[] = [];
  if (inputs.employeeBasis === "cost") {
    steps.push(
      { group: "flow", label: "Бюджет работодателя (coste empresa)", amount: inputs.budget, kind: "start" },
      {
        group: "flow",
        label: `Взносы работодателя в Seguridad Social (${pct(EMPLOYER_RATE)})`,
        amount: -employer,
        kind: "minus",
        note: "Contingencias comunes, desempleo, FOGASA, FP, MEI, AT/EP (CNAE 62)",
        source: "orden_2026",
      },
      { group: "flow", label: "Брутто-зарплата (salario bruto)", amount: gross, kind: "subtotal" },
    );
  } else {
    steps.push({ group: "flow", label: "Брутто-зарплата (salario bruto)", amount: gross, kind: "start" });
  }
  steps.push(
    {
      group: "flow",
      label: `Ваши взносы в Seguridad Social (${pct(EMPLOYEE_RATE)})`,
      amount: -ss.employee,
      kind: "minus",
      note: ss.capped
        ? `База ограничена максимумом ${fmt(P.ss.maxBaseMonthly)} €/мес + взнос солидарности`
        : undefined,
      source: "orden_2026",
    },
    { group: "flow", label: "IRPF", amount: -fc.general, kind: "minus", source: "lirpf" },
    ...benefitFlowStep(fc),
    { group: "flow", label: "Рабочие расходы", amount: -expenses, kind: "minus" },
    { group: "flow", label: "Остаётся вам", amount: net, kind: "result" },
    ...wageBaseSteps(t, "Брутто-зарплата", gross, "Взносы работника в SS", ss.employee),
    ...irpfSteps(t, inputs, { withSavings: false }),
    ...familySteps(fc),
  );

  const notes = [
    "Оплачиваемый отпуск, больничные, пособие по безработице (paro) и выходное пособие при увольнении — это деньги, которых нет в таблице.",
    "Рабочие расходы работник не может вычесть из налоговой базы.",
    ...familyNotes(inputs),
  ];
  if (inputs.employeeBasis === "gross") {
    notes.unshift(
      `Сверху работодатель платит ещё ≈${fmt(employeeSS(gross).employer)} € взносов — для честного сравнения с autónomo переключитесь на «бюджет работодателя».`,
    );
  }
  if (gross < P.ss.smiAnnual) {
    notes.unshift("Брутто ниже минимальной зарплаты (SMI) — на полный день так платить нельзя.");
  }

  return result(
    "employee",
    inputs,
    {
      net,
      irpf: fc.general,
      benefit: fc.benefit,
      dividendTax: 0,
      corporateTax: 0,
      ssWorker: ss.employee,
      ssEmployer: employer,
      expenses,
      gestoria: 0,
    },
    steps,
    notes,
    { grossSalary: gross },
  );
}

/* ───────────────────────── 2. Beckham ───────────────────────── */

function beckham(inputs: Inputs): RegimeResult {
  const gross = grossOf(inputs);
  const ss = employeeSS(gross);
  const tax = applyScale(gross, P.irpf.beckham.scale);
  const expenses = inputs.workExpenses * 12;
  const employer = inputs.employeeBasis === "cost" ? inputs.budget - gross : 0;
  const net = gross - ss.employee - tax - expenses;

  const steps: Step[] = [];
  if (inputs.employeeBasis === "cost") {
    steps.push(
      { group: "flow", label: "Бюджет работодателя (coste empresa)", amount: inputs.budget, kind: "start" },
      {
        group: "flow",
        label: `Взносы работодателя в Seguridad Social (${pct(EMPLOYER_RATE)})`,
        amount: -employer,
        kind: "minus",
        source: "orden_2026",
      },
      { group: "flow", label: "Брутто-зарплата", amount: gross, kind: "subtotal" },
    );
  } else {
    steps.push({ group: "flow", label: "Брутто-зарплата", amount: gross, kind: "start" });
  }
  steps.push(
    {
      group: "flow",
      label: `Ваши взносы в Seguridad Social (${pct(EMPLOYEE_RATE)})`,
      amount: -ss.employee,
      kind: "minus",
      source: "orden_2026",
    },
    { group: "flow", label: "IRPF по режиму импатриантов", amount: -tax, kind: "minus", source: "lirpf_93" },
    { group: "flow", label: "Рабочие расходы", amount: -expenses, kind: "minus" },
    { group: "flow", label: "Остаётся вам", amount: net, kind: "result" },
    {
      group: "base",
      label: "База = вся брутто-зарплата",
      amount: gross,
      kind: "start",
      note: "Правила IRNR: ни взносы, ни 2 000 €, ни mínimos не вычитаются (art. 24.1 TRLIRNR, DGT V1112-25)",
      source: "rirpf_114",
    },
    {
      group: "tax",
      label: "24% до 600 000 €",
      amount: -Math.min(gross, 600000) * 0.24,
      kind: "minus",
      source: "lirpf_93",
    },
  );
  if (gross > 600000) {
    steps.push({
      group: "tax",
      label: "47% свыше 600 000 €",
      amount: -(gross - 600000) * 0.47,
      kind: "minus",
      source: "lirpf_93",
    });
  }

  return result(
    "beckham",
    inputs,
    {
      net,
      irpf: tax,
      dividendTax: 0,
      corporateTax: 0,
      ssWorker: ss.employee,
      ssEmployer: employer,
      expenses,
      gestoria: 0,
    },
    steps,
    [
      "Только для тех, кто не был налоговым резидентом Испании 5 лет подряд перед переездом и переехал ради работы по найму (в т.ч. удалённой), должности администратора или стартапа с сертификатом ENISA.",
      "Обычному autónomo режим недоступен.",
      "Действует в год переезда + 5 следующих лет; заявление (modelo 149) — в течение 6 месяцев после регистрации в Seguridad Social.",
      "Скидок на детей и семейных минимумов нет — с детьми выгода меньше.",
    ],
    { grossSalary: gross },
  );
}

/* ───────────────────────── 3–4. Autónomo ───────────────────────── */

function autonomo(inputs: Inputs, firstYear: boolean): RegimeResult {
  const revenue = inputs.budget;
  const expenses = inputs.workExpenses * 12;
  const gestoria = inputs.gestoriaAutonomo * 12;
  const beforeQuota = revenue - expenses - gestoria;

  const difJOf = (rnPrevio: number) =>
    rnPrevio > 0 ? Math.min(P.irpf.dificilJustificacion.cap, rnPrevio * P.irpf.dificilJustificacion.rate) : 0;

  // Доход для cuota (art. 308.1.c LGSS): рендимьенто по IRPF + сама cuota − 7%.
  // Рендимьенто включает вычет 5%, который зависит от cuota, — поэтому пара итераций.
  let reta = retaQuota((Math.max(0, beforeQuota) * (1 - P.ss.reta.gastosGenericos)) / 12, false);
  let computable = reta.computableMonthly;
  for (let i = 0; i < 4; i++) {
    computable = (Math.max(0, beforeQuota - difJOf(beforeQuota - reta.monthly * 12)) * (1 - P.ss.reta.gastosGenericos)) / 12;
    reta = retaQuota(computable, false);
  }
  const quotaMonthly = firstYear ? P.ss.reta.tarifaPlanaMonthly : reta.monthly;
  const quota = quotaMonthly * 12;

  const rnPrevio = beforeQuota - quota;
  const difJ = difJOf(rnPrevio);
  const rn = rnPrevio - difJ;
  const rentasBajas = rentasBajasReduction(rn);
  const rnLow = rn - rentasBajas;
  const inicio = firstYear && rnLow > 0 ? Math.min(rnLow, P.irpf.inicioActividad.cap) * P.irpf.inicioActividad.rate : 0;
  const rnReduced = rnLow - inicio;
  const joint = jointReduction(inputs.family, inputs.children);
  const blg = Math.max(0, rnReduced - joint);
  const irpf = computeIrpf({
    generalBase: blg,
    savingsBase: 0,
    region: inputs.region,
    family: inputs.family,
    children: inputs.children,
    childrenUnder3: inputs.childrenUnder3,
  });
  const fc = familyCredit(inputs, irpf.general, 0, quota);
  const net = revenue - expenses - gestoria - quota - fc.general + fc.benefit;

  const steps: Step[] = [
    { group: "flow", label: "Выручка без IVA", amount: revenue, kind: "start" },
    { group: "flow", label: "Рабочие расходы (вычитаются)", amount: -expenses, kind: "minus", source: "lirpf_30" },
    { group: "flow", label: "Гестория / бухгалтерия", amount: -gestoria, kind: "minus", source: "lirpf_30" },
    firstYear
      ? {
          group: "flow",
          label: `Cuota autónomo — tarifa plana ${n2(P.ss.reta.tarifaPlanaMonthly)} €/мес`,
          amount: -quota,
          kind: "minus",
          note: "80 € + взнос MEI. Первые 12 месяцев; ещё 12 — только если доход ниже SMI",
          source: "leta_38ter",
        }
      : {
          group: "flow",
          label: `Cuota autónomo — ${fmt(reta.monthly)} €/мес`,
          amount: -quota,
          kind: "minus",
          note: `Трамо «${reta.tramo}»: ${fmt(computable)} €/мес дохода → база ${fmt(reta.base)} € × ${pct(P.ss.reta.rate)}`,
          source: "lgss_308",
        },
    { group: "flow", label: "IRPF", amount: -fc.general, kind: "minus", source: "lirpf" },
    ...benefitFlowStep(fc),
    { group: "flow", label: "Остаётся вам", amount: net, kind: "result" },

    { group: "base", label: "Доходы − расходы − cuota", amount: rnPrevio, kind: "start", source: "lirpf_30" },
    {
      group: "base",
      label: `Gastos de difícil justificación (${pct(P.irpf.dificilJustificacion.rate, 0)}, макс. 2 000 €)`,
      amount: -difJ,
      kind: "minus",
      source: "lirpf_30",
    },
  ];
  if (rentasBajas > 0) steps.push(rentasBajasStep(rentasBajas));
  if (inicio > 0) {
    steps.push({
      group: "base",
      label: "Reducción inicio de actividad (−20%)",
      amount: -inicio,
      kind: "minus",
      note: "Первый год с прибылью и следующий",
      source: "lirpf_32",
    });
  }
  if (joint > 0) {
    steps.push({
      group: "base",
      label: "Reducción por tributación conjunta",
      amount: -Math.min(joint, Math.max(0, rnReduced)),
      kind: "minus",
      source: "lirpf_84",
    });
  }
  steps.push({ group: "base", label: "Base liquidable general", amount: blg, kind: "subtotal" });
  steps.push(...irpfSteps({ irpf, smi: 0, savings: 0 }, inputs, { withSavings: false }), ...familySteps(fc));

  const notes = firstYear
    ? [
        "Сценарий первого года: tarifa plana 80 €/мес действует 12 месяцев, затем cuota считается по доходу.",
        "Скидка 20% по IRPF — в первый год с прибылью и следующий, если за предыдущий год деятельности не было и если больше половины дохода не приходит от прошлогоднего работодателя (art. 32.3 LIRPF).",
        "Смотрите обычный Autónomo — это ваш второй и последующие годы.",
      ]
    : [
        "Cuota считается по реальному доходу: весь год платите по прогнозу, а после декларации Seguridad Social пересчитает её и выставит доплату или вернёт переплату.",
        "Нет оплачиваемого отпуска; больничный — с 4-го дня (60–75% базы, а база минимальная).",
        "Каждый квартал — modelo 130 (аванс 20% IRPF) и modelo 303 (IVA).",
      ];
  notes.push(...familyNotes(inputs));

  return result(
    firstYear ? "autonomo_new" : "autonomo",
    inputs,
    { net, irpf: fc.general, benefit: fc.benefit, dividendTax: 0, corporateTax: 0, ssWorker: quota, ssEmployer: 0, expenses, gestoria },
    steps,
    notes,
    { retaMonthly: quotaMonthly, retaTramo: firstYear ? "Tarifa plana" : reta.tramo },
  );
}

/* ───────────────────────── 5–6. Sociedad Limitada ───────────────────────── */

export function corporateTax(profit: number, newCompany: boolean): number {
  if (profit <= 0) return 0;
  const micro = applyScale(profit, P.is.micro);
  return newCompany ? Math.min(micro, profit * P.is.nuevaCreacion) : micro;
}

interface SlEval {
  salary: number;
  quota: number;
  profit: number;
  is: number;
  dividends: number;
  wage: WageTax;
  fc: FamilyCredit;
  net: number;
  retaTramo: string;
  retaBase: number;
}

/**
 * Один вариант SL при заданном вознаграждении socio (без его cuota, которую платит компания).
 * minRemuneration — нижняя граница «вознаграждение + cuota» (art. 18.6 LIS) или 0.
 */
function evalSl(inputs: Inputs, salaryTarget: number, minRemuneration: number): SlEval {
  const revenue = inputs.budget;
  const pre = revenue - inputs.workExpenses * 12 - inputs.gestoriaSl * 12;

  // Socio впервые в RETA получает tarifa plana (art. 38 ter.9 LETA) на первые 12 месяцев
  let quota = inputs.slTarifaPlana ? P.ss.reta.tarifaPlanaMonthly * 12 : P.ss.reta.societarioMinBase * P.ss.reta.rate * 12;
  let salary = 0;
  let profit = 0;
  let is = 0;
  let dividends = 0;
  let tramo = "";
  let base = 0;
  for (let i = 0; i < 12; i++) {
    salary = Math.max(salaryTarget, minRemuneration - quota);
    salary = Math.max(0, Math.min(salary, pre - quota));
    profit = pre - salary - quota;
    is = corporateTax(profit, inputs.slNewCompany);
    dividends = Math.max(0, profit - is);
    if (inputs.slTarifaPlana) {
      tramo = "Tarifa plana";
      break;
    }
    // Рендимьенто socio: вознаграждение (+ cuota, оплаченная компанией, которая добавляется обратно)
    // минус 5% difícil justificación, плюс дивиденды íntegros; затем −3% (art. 308.1.c LGSS)
    const difJ = Math.min(P.irpf.dificilJustificacion.cap, salary * P.irpf.dificilJustificacion.rate);
    const computable =
      (Math.max(0, salary + quota - difJ + dividends) * (1 - P.ss.reta.gastosGenericosSocietario)) / 12;
    const r = retaQuota(computable, true);
    const next = r.monthly * 12;
    tramo = r.tramo;
    base = r.base;
    if (Math.abs(next - quota) < 0.01) break;
    // При «зацикливании» между трамо берём больший взнос — консервативно
    quota = i > 6 ? Math.max(next, quota) : next;
  }
  const wage = wageTax(salary + quota, quota, dividends, inputs, "actividad");
  const fc = familyCredit(inputs, wage.general, wage.savings, quota);
  const net = salary + dividends - fc.general - fc.savings + fc.benefit + Math.min(0, profit);
  return { salary, quota, profit, is, dividends, wage, fc, net, retaTramo: tramo, retaBase: base };
}

function bestSl(inputs: Inputs, minRemuneration: number): SlEval {
  const pre = Math.max(0, inputs.budget - inputs.workExpenses * 12 - inputs.gestoriaSl * 12);
  const N = 36;
  let best = evalSl(inputs, 0, minRemuneration);
  let bestX = 0;
  for (let i = 1; i <= N; i++) {
    const x = (pre * i) / N;
    const e = evalSl(inputs, x, minRemuneration);
    if (e.net > best.net + 1e-6) {
      best = e;
      bestX = x;
    }
  }
  // Уточнение вокруг лучшей точки
  const step = pre / N;
  for (let i = -8; i <= 8; i++) {
    const x = Math.max(0, bestX + (step * i) / 8);
    const e = evalSl(inputs, x, minRemuneration);
    if (e.net > best.net + 1e-6) best = e;
  }
  return best;
}

function sl(inputs: Inputs, safe: boolean): RegimeResult {
  const expenses = inputs.workExpenses * 12;
  const gestoria = inputs.gestoriaSl * 12;
  const pre = inputs.budget - expenses - gestoria;
  const { minShare, minAbsolute } = P.socioProfesional;
  const minRem = safe ? Math.max(minShare * pre, Math.min(pre, minAbsolute)) : 0;
  const e = bestSl(inputs, minRem);
  const isRateNote = inputs.slNewCompany
    ? `${pct(P.is.nuevaCreacion, 0)} — entidad de nueva creación`
    : `${pct(P.is.micro[0][2], 0)} до 50 000 €, ${pct(P.is.micro[1][2], 0)} свыше — microempresa`;

  const remShare = pre > 0 ? (e.salary + e.quota) / pre : 0;

  const steps: Step[] = [
    { group: "flow", label: "Выручка компании без IVA", amount: inputs.budget, kind: "start" },
    { group: "flow", label: "Рабочие расходы", amount: -expenses, kind: "minus", source: "lis" },
    { group: "flow", label: "Гестория, годовой отчёт, регистры", amount: -gestoria, kind: "minus", source: "lis" },
    inputs.slTarifaPlana
      ? {
          group: "flow",
          label: `Cuota autónomo societario — tarifa plana ${n2(P.ss.reta.tarifaPlanaMonthly)} €/мес`,
          amount: -e.quota,
          kind: "minus",
          note: "80 € + MEI первые 12 месяцев, если вы не были в RETA два года (art. 38 ter.9 LETA)",
          source: "leta_38ter",
        }
      : {
          group: "flow",
          label: `Cuota autónomo societario — ${fmt(e.quota / 12)} €/мес`,
          amount: -e.quota,
          kind: "minus",
          note: `Считается от вознаграждения + дивидендов (трамо «${e.retaTramo}»); с 2026 минимальная база для societarios — ${fmt(P.ss.reta.societarioMinBase)} €`,
          source: "lgss_308",
        },
    {
      group: "flow",
      label: "Вознаграждение вам за работу",
      amount: -e.salary,
      kind: "minus",
      note: `Вместе с cuota — ${pct(remShare, 0)} результата до вознаграждения`,
      source: "lis_18",
    },
    { group: "flow", label: "Прибыль компании", amount: e.profit, kind: "subtotal" },
    {
      group: "flow",
      label: "Impuesto sobre Sociedades",
      amount: -e.is,
      kind: "minus",
      note: isRateNote,
      source: "lis_29",
    },
    { group: "flow", label: "Дивиденды (вся прибыль после налога)", amount: e.dividends, kind: "subtotal" },
    { group: "flow", label: "Вознаграждение + дивиденды вам", amount: e.salary + e.dividends, kind: "subtotal" },
    {
      group: "flow",
      label: "IRPF с вознаграждения",
      amount: -e.fc.general,
      kind: "minus",
      note: "Доход от деятельности socio profesional (art. 27.1 LIRPF), а не зарплата",
      source: "lirpf",
    },
    { group: "flow", label: "IRPF с дивидендов", amount: -e.fc.savings, kind: "minus", source: "lirpf_66" },
    ...benefitFlowStep(e.fc),
    { group: "flow", label: "Остаётся вам", amount: e.net, kind: "result" },
    ...wageBaseSteps(
      e.wage,
      "Вознаграждение + cuota, оплаченная компанией",
      e.salary + e.quota,
      "Cuota autónomo (вычитается)",
      e.quota,
    ),
    { group: "base", label: "Base del ahorro (дивиденды)", amount: e.wage.bla, kind: "subtotal", source: "lirpf_66" },
    ...irpfSteps(e.wage, inputs, { withSavings: true }),
    ...familySteps(e.fc),
  ];

  const notes = safe
    ? [
        `Вознаграждение вам ≥ 75% результата до него и ≥ ${fmt(P.socioProfesional.minAbsolute)} € (5 × IPREM) — «безопасная гавань» art. 18.6 LIS для профессиональных услуг, куда входит IT (IAE 763). В этих рамках калькулятор подбирает лучшее соотношение вознаграждения и дивидендов.`,
        "Ваше вознаграждение облагается как доход от деятельности (art. 27.1 LIRPF): вы в RETA, работаете в своей же компании. С него удерживается 15% (7% в первые годы).",
        "Ставка 15% для новых компаний не положена, если ту же работу вы в прошлом году делали как autónomo (art. 29.1.b LIS).",
        "Деньги можно не выводить: оставленная в компании прибыль не облагается налогом на дивиденды, пока вы её не распределите.",
      ]
    : [
        "Минимум налогов без оглядки на art. 18.6 LIS. Если компания по сути продаёт ваш личный профессиональный труд, Hacienda может переквалифицировать дивиденды в вознаграждение (operación vinculada) и доначислить IRPF с процентами и штрафом.",
        "Показано для сравнения, а не как рекомендация.",
      ];
  notes.push(...familyNotes(inputs));

  return result(
    safe ? "sl_safe" : "sl_optimal",
    inputs,
    {
      net: e.net,
      irpf: e.fc.general,
      benefit: e.fc.benefit,
      dividendTax: e.fc.savings,
      corporateTax: e.is,
      ssWorker: e.quota,
      ssEmployer: 0,
      expenses,
      gestoria,
    },
    steps,
    notes,
    { grossSalary: e.salary, dividends: e.dividends, retaMonthly: e.quota / 12, retaTramo: e.retaTramo },
  );
}

/* ───────────────────────── Диспетчер ───────────────────────── */

export function calculate(regime: RegimeId, inputs: Inputs): RegimeResult {
  switch (regime) {
    case "employee":
      return employee(inputs);
    case "beckham":
      return beckham(inputs);
    case "autonomo":
      return autonomo(inputs, false);
    case "autonomo_new":
      return autonomo(inputs, true);
    case "sl_safe":
      return sl(inputs, true);
    case "sl_optimal":
      return sl(inputs, false);
  }
}

export function calculateAll(regimes: readonly RegimeId[], inputs: Inputs): RegimeResult[] {
  return regimes.map((r) => calculate(r, inputs));
}

function fmt(x: number): string {
  return Math.round(x).toLocaleString("ru-RU");
}

function n2(x: number): string {
  return x.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
