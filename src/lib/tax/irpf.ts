import type { Bracket, Family, RegionId } from "./types";
import { P } from "./params-2026";
import { REGIONS } from "./regions-2026";

/** Налог по прогрессивной шкале: сумма (часть базы в полосе × ставка) */
export function applyScale(base: number, scale: readonly Bracket[]): number {
  let tax = 0;
  for (const [from, to, rate] of scale) {
    if (base <= from) break;
    tax += (Math.min(base, to) - from) * rate;
  }
  return tax;
}

/** Предельная ставка шкалы для заданной базы */
export function marginalRate(base: number, scale: readonly Bracket[]): number {
  for (const [from, to, rate] of scale) {
    if (base >= from && base < to) return rate;
  }
  return scale[scale.length - 1][2];
}

export interface Minimos {
  personal: number;
  descendants: number;
  total: number;
}

/**
 * Mínimo personal y familiar (arts. 56–58 LIRPF).
 * При раздельных декларациях двух родителей минимум на детей делится поровну (art. 58.1 + 61.1ª).
 */
export function familyMinimum(
  family: Family,
  children: number,
  childrenUnder3: number,
  amounts: { personal: number; descendants: readonly number[]; under3: number },
): Minimos {
  const share = family === "couple" ? 0.5 : 1;
  let descendants = 0;
  for (let i = 0; i < children; i++) {
    descendants += amounts.descendants[Math.min(i, amounts.descendants.length - 1)];
  }
  descendants += Math.min(childrenUnder3, children) * amounts.under3;
  descendants *= share;
  return { personal: amounts.personal, descendants, total: amounts.personal + descendants };
}

/** Прямое уменьшение базы при совместной декларации (art. 84.2.3º y 4º LIRPF) */
export function jointReduction(family: Family, children: number): number {
  if (family === "couple_joint") return P.irpf.jointReduction.married;
  if (family === "single" && children > 0) return P.irpf.jointReduction.singleParent;
  return 0;
}

export interface IrpfInput {
  generalBase: number;
  savingsBase: number;
  region: RegionId;
  family: Family;
  children: number;
  childrenUnder3: number;
}

export interface IrpfOutput {
  minState: Minimos;
  minAuto: Minimos;
  generalState: number;
  generalAuto: number;
  savingsState: number;
  savingsAuto: number;
  general: number;
  savings: number;
  total: number;
}

/**
 * Cuota íntegra IRPF (arts. 56, 63, 64, 66, 74–76 LIRPF).
 * Минимум сначала «гасит» общую базу, остаток — базу сбережений.
 * Налог = шкала(база) − шкала(минимум), отдельно для государственной и региональной частей.
 */
export function computeIrpf(input: IrpfInput): IrpfOutput {
  const region = REGIONS[input.region];
  const blg = Math.max(0, input.generalBase);
  const bla = Math.max(0, input.savingsBase);

  const minState = familyMinimum(input.family, input.children, input.childrenUnder3, P.irpf.minimos);
  const minAuto = familyMinimum(
    input.family,
    input.children,
    input.childrenUnder3,
    region.minimos ?? P.irpf.minimos,
  );

  const part = (scaleGeneral: readonly Bracket[], scaleSavings: readonly Bracket[], minimo: number) => {
    const minInGeneral = Math.min(minimo, blg);
    const minInSavings = Math.min(minimo - minInGeneral, bla);
    const general = Math.max(0, applyScale(blg, scaleGeneral) - applyScale(minInGeneral, scaleGeneral));
    const savings = Math.max(0, applyScale(bla, scaleSavings) - applyScale(minInSavings, scaleSavings));
    return { general, savings };
  };

  const st = part(P.irpf.stateScale, P.irpf.savingsScaleHalf, minState.total);
  const au = part(region.scale, P.irpf.savingsScaleHalf, minAuto.total);

  const general = st.general + au.general;
  const savings = st.savings + au.savings;
  return {
    minState,
    minAuto,
    generalState: st.general,
    generalAuto: au.general,
    savingsState: st.savings,
    savingsAuto: au.savings,
    general,
    savings,
    total: general + savings,
  };
}

/**
 * Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF).
 * Не применяется, если прочие доходы (кроме освобождённых) > 6 500 €.
 */
export function workIncomeReduction(netWorkIncome: number, otherIncome: number): number {
  const r = P.irpf.workReduction;
  if (otherIncome > r.otherIncomeLimit) return 0;
  const rn = netWorkIncome;
  let red = 0;
  if (rn <= r.t1) red = r.max;
  else if (rn <= r.t2) red = r.max - r.k1 * (rn - r.t1);
  else if (rn <= r.t3) red = r.mid - r.k2 * (rn - r.t2);
  return Math.max(0, Math.min(red, Math.max(0, rn)));
}

/**
 * Deducción por obtención de rendimientos del trabajo для зарплат около SMI (DA 61ª LIRPF, RDL 5/2026).
 * Считается от брутто-дохода от работы; не больше налога, приходящегося на этот доход.
 */
export function smiDeduction(grossWorkIncome: number, otherIncome: number, cuotaOnWork: number): number {
  const d = P.irpf.smiDeduction;
  if (otherIncome > d.otherIncomeLimit || grossWorkIncome >= d.t2) return 0;
  const raw = grossWorkIncome <= d.t1 ? d.max : d.max - d.k * (grossWorkIncome - d.t1);
  return Math.max(0, Math.min(raw, cuotaOnWork));
}
