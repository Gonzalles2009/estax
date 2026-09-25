import type { Inputs, RegimeId } from "./tax/types";

export type ChartMode = "net" | "share" | "delta";

export interface UiState extends Inputs {
  selected: RegimeId[];
  focus: RegimeId;
  chartMode: ChartMode;
  /** Подсветка режима при наведении (не сохраняется в URL) */
  highlight: RegimeId | null;
}

export const DEFAULTS: UiState = {
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
  // Временные льготы первого года и агрессивная SL — только по запросу, чтобы не искажать «лучший» режим
  selected: ["employee", "beckham", "autonomo", "sl_safe"],
  focus: "autonomo",
  chartMode: "delta",
  highlight: null,
};

export const BUDGET_MIN = 15000;
export const BUDGET_MAX = 400000;

/** Входные параметры для движка из состояния */
export function inputsOf(s: Inputs): Inputs {
  return {
    budget: s.budget,
    region: s.region,
    family: s.family,
    children: s.children,
    childrenUnder3: s.childrenUnder3,
    workExpenses: s.workExpenses,
    employeeBasis: s.employeeBasis,
    gestoriaAutonomo: s.gestoriaAutonomo,
    gestoriaSl: s.gestoriaSl,
    slNewCompany: s.slNewCompany,
  };
}

