import { P } from "./params-2026";

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

export const EMPLOYEE_RATE = sum(P.ss.employee);
export const EMPLOYER_RATE = sum(P.ss.employer);

const MAX_BASE_ANNUAL = P.ss.maxBaseMonthly * 12;

/** Cotización adicional de solidaridad (art. 19 bis LGSS) — часть зарплаты выше максимальной базы */
export function solidarity(gross: number): { employer: number; employee: number } {
  const excess = Math.max(0, gross - MAX_BASE_ANNUAL);
  let employer = 0;
  let employee = 0;
  let prev = 0;
  for (const band of P.ss.solidarity) {
    const top = Math.min(excess, band.upTo * MAX_BASE_ANNUAL);
    if (top <= prev) break;
    employer += (top - prev) * band.employer;
    employee += (top - prev) * band.employee;
    prev = top;
  }
  return { employer, employee };
}

export interface EmployeeSS {
  base: number;
  employee: number;
  employer: number;
  solidarityEmployee: number;
  solidarityEmployer: number;
  capped: boolean;
}

/** Взносы наёмного работника и работодателя с годовой брутто-зарплаты */
export function employeeSS(gross: number): EmployeeSS {
  const base = Math.min(gross, MAX_BASE_ANNUAL);
  const sol = solidarity(gross);
  return {
    base,
    employee: base * EMPLOYEE_RATE + sol.employee,
    employer: base * EMPLOYER_RATE + sol.employer,
    solidarityEmployee: sol.employee,
    solidarityEmployer: sol.employer,
    capped: gross > MAX_BASE_ANNUAL,
  };
}

/** Брутто-зарплата, которую можно платить при заданной полной стоимости для работодателя */
export function grossFromEmployerCost(cost: number): number {
  let lo = 0;
  let hi = cost;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid + employeeSS(mid).employer > cost) hi = mid;
    else lo = mid;
  }
  return lo;
}

export interface RetaQuota {
  monthly: number;
  base: number;
  tramo: string;
  computableMonthly: number;
}

/**
 * Cuota RETA по системе реальных доходов (art. 308 LGSS, RDL 13/2022).
 * computableMonthly — рендимьенто за месяц после вычета gastos genéricos.
 * Берём минимальную базу своего трамо — так делает подавляющее большинство.
 */
export function retaQuota(computableMonthly: number, societario: boolean): RetaQuota {
  const tramos = P.ss.reta.tramos;
  // Трамо в таблице: «> от – ≤ до»
  const idx = tramos.findIndex(([from, to]) => computableMonthly > from && computableMonthly <= to);
  const i = idx === -1 ? (computableMonthly < 0 ? 0 : tramos.length - 1) : idx;
  const [, , minBase, , label] = tramos[i];
  const base = societario ? Math.max(minBase, P.ss.reta.societarioMinBase) : minBase;
  return {
    monthly: round2(base * P.ss.reta.rate),
    base,
    tramo: label,
    computableMonthly,
  };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
