export type RegimeId =
  | "employee"
  | "beckham"
  | "autonomo"
  | "autonomo_new"
  | "sl_safe"
  | "sl_optimal";

export type RegionId =
  | "andalucia"
  | "aragon"
  | "asturias"
  | "baleares"
  | "canarias"
  | "cantabria"
  | "castilla_la_mancha"
  | "castilla_y_leon"
  | "cataluna"
  | "extremadura"
  | "galicia"
  | "madrid"
  | "murcia"
  | "rioja"
  | "valencia";

/**
 * single       — один/одна; дети (если есть) живут со мной → «монопарентальная» совместная декларация
 * couple       — пара, каждый подаёт декларацию сам (минимум на детей делится 50/50)
 * couple_joint — совместная декларация с супругом(ой) без дохода
 */
export type Family = "single" | "couple" | "couple_joint";

/** Как интерпретировать сумму для наёмного работника */
export type EmployeeBasis = "cost" | "gross";

export interface Inputs {
  /** Годовая сумма: что тратит работодатель (coste empresa) или сколько вы выставляете клиентам без IVA */
  budget: number;
  region: RegionId;
  family: Family;
  children: number;
  childrenUnder3: number;
  /** Рабочие расходы в месяц (ноутбук, связь, коворкинг…) — тратятся в любом режиме */
  workExpenses: number;
  employeeBasis: EmployeeBasis;
  /** Бухгалтерия/гестория, € в месяц */
  gestoriaAutonomo: number;
  gestoriaSl: number;
  /** SL в первые два года с прибылью — ставка 15% (art. 29.1 LIS) */
  slNewCompany: boolean;
  /**
   * Socio SL в первые 12 месяцев в RETA и не был в нём два года — tarifa plana (art. 38 ter.9 LETA).
   * Отдельно от slNewCompany: у льгот разные сроки и условия.
   */
  slTarifaPlana: boolean;
  /**
   * Одинокий родитель не получает алименты на детей — условие вычета 1 200 € при двух детях (art. 81 bis.1.c).
   */
  noAlimony: boolean;
}

export type Bracket = readonly [from: number, to: number, rate: number];

export type StepKind = "start" | "minus" | "plus" | "subtotal" | "result" | "info";

/** flow — движение денег, base — налоговая база, tax — расчёт налога */
export type StepGroup = "flow" | "base" | "tax";

export interface Step {
  group: StepGroup;
  label: string;
  /** Годовая сумма, € (NaN — строка без суммы) */
  amount: number;
  kind: StepKind;
  note?: string;
  source?: SourceId;
}

export interface Breakdown {
  /** Остаётся вам после всего */
  net: number;
  /** IRPF по общей базе (зарплата / деятельность) */
  irpf: number;
  /** IRPF по базе сбережений (дивиденды) */
  dividendTax: number;
  /** Налог на прибыль компании */
  corporateTax: number;
  /** Ваши взносы в Seguridad Social (доля работника или cuota autónomo) */
  ssWorker: number;
  /** Взносы работодателя — часть бюджета, которую вы не видите в зарплате */
  ssEmployer: number;
  /** Рабочие расходы */
  expenses: number;
  /**
   * Выплата от Hacienda сверх налога: вычет art. 81 bis (многодетные) больше IRPF к уплате.
   * Входит в net, поэтому сумма частей = бюджет + benefit.
   */
  benefit?: number;
  /** Бухгалтерия */
  gestoria: number;
}

export interface RegimeResult {
  regime: RegimeId;
  budget: number;
  netAnnual: number;
  netMonthly: number;
  /** Всё, что уходит государству: налоги + взносы (обе стороны) */
  toState: number;
  /** toState / budget */
  effectiveRate: number;
  breakdown: Breakdown;
  steps: Step[];
  notes: string[];
  meta: {
    grossSalary?: number;
    dividends?: number;
    retaMonthly?: number;
    retaTramo?: string;
  };
}

// Реестр источников живёт в sources.ts, здесь только тип ключа
export type SourceId = string;
