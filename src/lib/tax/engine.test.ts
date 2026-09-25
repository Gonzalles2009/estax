import { describe, expect, test } from "vitest";
import { calculate, calculateAll, REGIME_IDS } from "./engine";
import { applyScale, computeIrpf, familyDeduction, rentasBajasReduction, workIncomeReduction } from "./irpf";
import { employeeSS, grossFromEmployerCost, retaQuota } from "./social-security";
import { P } from "./params-2026";
import { REGIONS, REGION_ORDER } from "./regions-2026";
import type { Inputs } from "./types";

const base: Inputs = {
  budget: 70000,
  region: "madrid",
  family: "single",
  children: 0,
  childrenUnder3: 0,
  workExpenses: 100,
  employeeBasis: "cost",
  gestoriaAutonomo: 60,
  gestoriaSl: 180,
  slNewCompany: false,
};

describe("шкалы", () => {
  test("государственная шкала: накопленный налог на границах (AEAT)", () => {
    const s = P.irpf.stateScale;
    expect(applyScale(12450, s)).toBeCloseTo(1182.75, 2);
    expect(applyScale(20200, s)).toBeCloseTo(2112.75, 2);
    expect(applyScale(35200, s)).toBeCloseTo(4362.75, 2);
    expect(applyScale(60000, s)).toBeCloseTo(8950.75, 2);
    expect(applyScale(300000, s)).toBeCloseTo(62950.75, 2);
  });

  test("региональные шкалы совпадают с официальными накопленными суммами", () => {
    expect(applyScale(57320.4, REGIONS.madrid.scale)).toBeCloseTo(7651.1, 1);
    expect(applyScale(60000, REGIONS.galicia.scale)).toBeCloseTo(8779.16, 1);
    expect(applyScale(60000, REGIONS.murcia.scale)).toBeCloseTo(8540.15, 1);
    expect(applyScale(120000, REGIONS.rioja.scale)).toBeCloseTo(23141.9, 1);
    expect(applyScale(120200, REGIONS.extremadura.scale)).toBeCloseTo(23945.5, 1);
    expect(applyScale(200000, REGIONS.valencia.scale)).toBeCloseTo(47114, 0);
    expect(applyScale(175000, REGIONS.cataluna.scale)).toBeCloseTo(36415, 0);
    expect(applyScale(13748, REGIONS.canarias.scale)).toBeCloseTo(1237.32, 2);
  });

  test("все шкалы непрерывны, начинаются с 0 и заканчиваются бесконечностью", () => {
    for (const id of REGION_ORDER) {
      const sc = REGIONS[id].scale;
      expect(sc[0][0], id).toBe(0);
      expect(sc[sc.length - 1][1], id).toBe(Infinity);
      for (let i = 1; i < sc.length; i++) {
        expect(sc[i][0], id).toBe(sc[i - 1][1]);
        expect(sc[i][2], id).toBeGreaterThan(sc[i - 1][2]);
      }
      expect(REGIONS[id].sourceUrl, id).toMatch(/^https:\/\/www\.boe\.es\//);
    }
  });
});

describe("IRPF", () => {
  test("reducción art. 20: 7 302 € до 14 852 €, ноль с 19 747,50 €", () => {
    expect(workIncomeReduction(14000, 0)).toBe(7302);
    expect(workIncomeReduction(17673.52, 0)).toBeCloseTo(2364.34, 1);
    expect(workIncomeReduction(19747.5, 0)).toBeCloseTo(0, 1);
    expect(workIncomeReduction(14000, 7000)).toBe(0);
  });

  test("ручной расчёт: база 47 527 €, Мадрид, без детей", () => {
    const r = computeIrpf({ generalBase: 47527, savingsBase: 0, region: "madrid", family: "single", children: 0, childrenUnder3: 0 });
    // гос.: 4 362,75 + (47 527 − 35 200) × 18,5% − 5 550 × 9,5%
    expect(r.generalState).toBeCloseTo(4362.75 + 12327 * 0.185 - 527.25, 2);
    // Мадрид со своим минимумом 5 956,65 €
    const madrid = applyScale(47527, REGIONS.madrid.scale) - 5956.65 * 0.085;
    expect(r.generalAuto).toBeCloseTo(madrid, 2);
  });

  test("минимум на детей делится пополам при раздельных декларациях пары", () => {
    const one = computeIrpf({ generalBase: 40000, savingsBase: 0, region: "cataluna", family: "single", children: 2, childrenUnder3: 1 });
    const half = computeIrpf({ generalBase: 40000, savingsBase: 0, region: "cataluna", family: "couple", children: 2, childrenUnder3: 1 });
    expect(one.minState.descendants).toBe(2400 + 2700 + 2800);
    expect(half.minState.descendants).toBe((2400 + 2700 + 2800) / 2);
  });

  test("остаток минимума переходит в базу сбережений", () => {
    const r = computeIrpf({ generalBase: 2000, savingsBase: 10000, region: "madrid", family: "single", children: 0, childrenUnder3: 0 });
    // гос. часть: (10 000 − 3 550 остатка минимума) по шкале сбережений
    expect(r.savingsState).toBeCloseTo(applyScale(10000, P.irpf.savingsScaleHalf) - applyScale(3550, P.irpf.savingsScaleHalf), 2);
    expect(r.generalState).toBe(0);
  });
});

describe("Seguridad Social", () => {
  test("ставки 2026: работник 6,50%, работодатель 32,15% (CNAE 62)", () => {
    const s = employeeSS(40000);
    expect(s.employee).toBeCloseTo(40000 * 0.065, 6);
    expect(s.employer).toBeCloseTo(40000 * 0.3215, 6);
  });

  test("выше максимальной базы — только взнос солидарности", () => {
    const max = 5101.2 * 12;
    const s = employeeSS(max * 1.2);
    const solEmployee = max * 0.1 * 0.0019 + max * 0.1 * 0.0021;
    expect(s.employee).toBeCloseTo(max * 0.065 + solEmployee, 4);
  });

  test("брутто из стоимости для работодателя — обратная функция", () => {
    for (const cost of [25000, 70000, 150000]) {
      const g = grossFromEmployerCost(cost);
      expect(g + employeeSS(g).employer).toBeCloseTo(cost, 4);
    }
  });

  test("RETA 2026: 205,88 € минимум, 607,35 € в верхнем трамо, societario ≥ 448,69 €", () => {
    expect(retaQuota(500, false).monthly).toBeCloseTo(205.88, 2);
    expect(retaQuota(7000, false).monthly).toBeCloseTo(607.35, 2);
    expect(retaQuota(800, true).monthly).toBeCloseTo(448.69, 2);
  });

  test("границы трамо: «> от – ≤ до», 1 166,70 € уже General 1", () => {
    expect(retaQuota(900, false).tramo).toBe("Reducida 2");
    expect(retaQuota(900.01, false).tramo).toBe("Reducida 3");
    expect(retaQuota(1166.69, false).tramo).toBe("Reducida 3");
    expect(retaQuota(1166.7, false).tramo).toBe("General 1");
    expect(retaQuota(6000, false).tramo).toBe("General 11");
    expect(retaQuota(6000.01, false).tramo).toBe("General 12");
  });
});

describe("режимы", () => {
  const budgets = [15000, 25000, 40000, 55000, 70000, 95000, 130000, 200000, 400000];
  const variants: Partial<Inputs>[] = [
    {},
    { employeeBasis: "gross" },
    { family: "couple_joint", children: 2, childrenUnder3: 1 },
    { family: "single", children: 1, region: "valencia" },
    { region: "canarias", workExpenses: 600, slNewCompany: true },
    { region: "cataluna", family: "couple", children: 3 },
  ];

  test("структура бюджета всегда сходится до евро", () => {
    for (const v of variants) {
      for (const budget of budgets) {
        for (const r of calculateAll(REGIME_IDS, { ...base, ...v, budget })) {
          const b = r.breakdown;
          // Выплата Hacienda (art. 81 bis сверх налога) входит в net, но не в бюджет
          const sum = b.net + b.irpf + b.dividendTax + b.corporateTax + b.ssWorker + b.ssEmployer + b.expenses + b.gestoria - (b.benefit ?? 0);
          const expected = r.regime === "employee" || r.regime === "beckham" ? (v.employeeBasis === "gross" ? r.meta.grossSalary! : budget) : budget;
          expect(sum, `${r.regime} @ ${budget} ${JSON.stringify(v)}`).toBeCloseTo(expected, 4);
          for (const [k, val] of Object.entries(b)) {
            if (k !== "net") expect(val, `${r.regime}.${k} @ ${budget}`).toBeGreaterThanOrEqual(-1e-9);
          }
        }
      }
    }
  });

  test("шаги «движения денег» заканчиваются итогом, равным net", () => {
    for (const r of calculateAll(REGIME_IDS, base)) {
      const flow = r.steps.filter((s) => s.group === "flow");
      const last = flow[flow.length - 1];
      expect(last.kind).toBe("result");
      expect(last.amount).toBeCloseTo(r.netAnnual, 6);
    }
  });

  test("SL в рамках art. 18.6: вознаграждение + cuota ≥ 75% результата", () => {
    for (const budget of [60000, 120000, 250000]) {
      const r = calculate("sl_safe", { ...base, budget });
      const pre = budget - base.workExpenses * 12 - base.gestoriaSl * 12;
      expect(r.meta.grossSalary! + r.meta.retaMonthly! * 12).toBeGreaterThanOrEqual(0.75 * pre - 1);
    }
  });

  test("агрессивная SL никогда не хуже безопасной", () => {
    for (const budget of budgets) {
      const safe = calculate("sl_safe", { ...base, budget });
      const opt = calculate("sl_optimal", { ...base, budget });
      expect(opt.netAnnual).toBeGreaterThanOrEqual(safe.netAnnual - 1);
    }
  });

  test("Beckham: 24% со всей брутто-зарплаты, без вычетов", () => {
    const r = calculate("beckham", { ...base, employeeBasis: "gross", budget: 80000 });
    expect(r.breakdown.irpf).toBeCloseTo(80000 * 0.24, 6);
  });

  test("tarifa plana первого года", () => {
    const r = calculate("autonomo_new", base);
    expect(r.breakdown.ssWorker).toBeCloseTo(88.64 * 12, 6);
  });

  test("эталон: найм, бюджет 70 000 €, Мадрид", () => {
    const r = calculate("employee", base);
    const gross = 70000 / 1.3215;
    const ss = gross * 0.065;
    const blg = gross - ss - 2000;
    const irpf =
      applyScale(blg, P.irpf.stateScale) - applyScale(5550, P.irpf.stateScale) +
      applyScale(blg, REGIONS.madrid.scale) - applyScale(5956.65, REGIONS.madrid.scale);
    expect(r.netAnnual).toBeCloseTo(gross - ss - irpf - 1200, 2);
  });
});

describe("источники", () => {
  test("каждый шаг расчёта ссылается на известный источник", async () => {
    const { SOURCES } = await import("./sources");
    for (const r of calculateAll(REGIME_IDS, { ...base, family: "couple_joint", children: 1 })) {
      for (const s of r.steps) {
        if (!s.source) continue;
        expect(s.source in SOURCES || s.source.startsWith("https://www.boe.es/"), `${r.regime}: ${s.source}`).toBe(true);
      }
    }
  });
});

describe("находки проверки данных 25.09.2026", () => {
  test("art. 81 bis: многодетные и одинокий родитель с 2 детьми", () => {
    const big = 1e6;
    expect(familyDeduction("single", 2, big).amount).toBe(1200);
    expect(familyDeduction("single", 1, big).amount).toBe(0);
    expect(familyDeduction("couple_joint", 2, big).amount).toBe(0);
    expect(familyDeduction("couple_joint", 3, big).amount).toBe(1200);
    expect(familyDeduction("couple_joint", 4, big).amount).toBe(1800);
    expect(familyDeduction("couple_joint", 5, big).amount).toBe(2400);
    expect(familyDeduction("couple_joint", 6, big).amount).toBe(3000);
    // Оба родителя работают — вычет делится пополам
    expect(familyDeduction("couple", 4, big).amount).toBe(900);
    // Лимит взносами — только для базовых 1 200 €, надбавки сверх него
    expect(familyDeduction("single", 6, 500).amount).toBe(500 + 1200 + 600);
  });

  test("art. 81 bis: вычет в расчёте, сверх налога — выплата; у Beckham вычета нет", () => {
    for (const regime of ["employee", "autonomo", "sl_safe"] as const) {
      for (const budget of [20000, 70000]) {
        const r = calculate(regime, { ...base, family: "couple_joint", children: 3, budget });
        const step = r.steps.find((s) => s.source === "lirpf_81bis" && s.group === "tax");
        expect(step?.amount, `${regime} @ ${budget}`).toBe(1200);
        // Выплата бывает, только когда налог к уплате уже обнулён
        if ((r.breakdown.benefit ?? 0) > 0) expect(r.breakdown.irpf + r.breakdown.dividendTax).toBe(0);
      }
    }
    expect(calculate("beckham", { ...base, family: "couple_joint", children: 3 }).steps.some((s) => s.source === "lirpf_81bis")).toBe(false);
    // На низком доходе налог меньше вычета — Hacienda доплачивает
    const low = calculate("employee", { ...base, family: "couple_joint", children: 4, budget: 20000 });
    expect(low.breakdown.irpf).toBe(0);
    expect(low.breakdown.benefit).toBeGreaterThan(0);
  });

  test("art. 32.2.3º: вычет для низких доходов от деятельности", () => {
    expect(rentasBajasReduction(7000)).toBe(1620);
    expect(rentasBajasReduction(8000)).toBe(1620);
    expect(rentasBajasReduction(10000)).toBeCloseTo(1620 - 0.405 * 2000, 6);
    expect(rentasBajasReduction(12000)).toBe(0);
    expect(rentasBajasReduction(1000)).toBe(1000);
    const r = calculate("autonomo", { ...base, budget: 15000 });
    expect(r.steps.some((s) => s.label === "Reducción por rentas bajas")).toBe(true);
    expect(calculate("autonomo", { ...base, budget: 30000 }).steps.some((s) => s.label === "Reducción por rentas bajas")).toBe(false);
  });

  test("art. 20: на границе 19 747,50 € вычета нет", () => {
    expect(workIncomeReduction(19747.5, 0)).toBe(0);
    expect(workIncomeReduction(19747.49, 0)).toBeGreaterThan(0);
  });

  test("art. 18.6 LIS: минимум — 5 × IPREM 7 200 € = 36 000 €", () => {
    expect(P.socioProfesional.minAbsolute).toBe(36000);
  });

  test("новая SL: tarifa plana для socio (art. 38 ter.9 LETA)", () => {
    const r = calculate("sl_safe", { ...base, slNewCompany: true, budget: 60000 });
    expect(r.breakdown.ssWorker).toBeCloseTo(P.ss.reta.tarifaPlanaMonthly * 12, 6);
    expect(r.meta.retaTramo).toBe("Tarifa plana");
    expect(calculate("sl_safe", { ...base, budget: 60000 }).breakdown.ssWorker).toBeGreaterThan(P.ss.reta.tarifaPlanaMonthly * 12);
  });
});
