import type { Inputs, RegimeId } from "./tax/types";
import { EMPTY_BECKHAM, type BeckhamAnswers } from "./beckham";

export type ChartMode = "net" | "share" | "delta";

export interface UiState extends Inputs {
  selected: RegimeId[];
  /** Режим, выбранный для потока денег, чека и расчёта; null — следовать за лучшим */
  focus: RegimeId | null;
  /** Открыта ли панель дополнительных параметров */
  moreOpen: boolean;
  chartMode: ChartMode;
  /** Подсветка режима при наведении (не сохраняется в URL) */
  highlight: RegimeId | null;
  /** Ответы на проверку права на Ley Beckham */
  beckham: BeckhamAnswers;
  /** Раскрыта ли проверка Beckham (не сохраняется в URL) */
  checkOpen: boolean;
}

export const DEFAULTS: UiState = {
  budget: 70000,
  region: "madrid",
  family: "single",
  children: 0,
  childrenUnder3: 0,
  // Свои траты на работу; 0 — как в обычном зарплатном калькуляторе
  workExpenses: 0,
  employeeBasis: "cost",
  gestoriaAutonomo: 60,
  gestoriaSl: 180,
  slNewCompany: false,
  slTarifaPlana: false,
  noAlimony: false,
  // Временные льготы первого года и агрессивная SL — только по запросу, чтобы не искажать «лучший» режим
  selected: ["employee", "beckham", "autonomo", "sl_safe"],
  focus: null,
  moreOpen: false,
  chartMode: "delta",
  highlight: null,
  beckham: EMPTY_BECKHAM,
  checkOpen: false,
};

/** До 25.09.2026 расходы по умолчанию были 100 €/мес и в ссылку не попадали — старые ссылки читаем с ними */
export const LEGACY_WORK_EXPENSES = 100;

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
    slTarifaPlana: s.slTarifaPlana,
    noAlimony: s.noAlimony,
  };
}

