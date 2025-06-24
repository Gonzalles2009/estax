// Налоговые режимы
export type TaxRegime = 
  | 'empleado'
  | 'autonomo_regular'
  | 'autonomo_tarifa_plana'
  | 'sl_micro'
  | 'sl_regular'
  | 'startup_certificada'
  | 'beckham';

// Автономные сообщества
export type AutonomousCommunity = 'madrid' | 'catalunya' | 'valencia';

// Семейное положение
export type MaritalStatus = 'soltero' | 'casado' | 'con_hijos';

// Параметры калькулятора
export interface CalculatorParams {
  regime: TaxRegime[];
  community: AutonomousCommunity;
  maritalStatus: MaritalStatus;
  children: number;
  annualRevenue: number;
  monthlyExpenses: number;
  companyAge?: number; // для startup льгот
  beckhamYear?: number; // 1-6 для Beckham
  plannedDividends?: number; // для SL
  stockOptions?: number; // для startup
}

// Результат расчета
export interface TaxCalculationResult {
  regime: TaxRegime;
  grossAnnual: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number;
  breakdown: {
    irpf: number;
    socialSecurity: number;
    corporateTax?: number;
    mei?: number;
    dividendTax?: number;
  };
  advantages: string[];
  disadvantages: string[];
  requirements: string[];
}

// Данные для графика
export interface ChartDataPoint {
  revenue: number;
  [key: string]: number; // динамические ключи для режимов
}

// Точки пересечения режимов
export interface CrossoverPoint {
  revenue: number;
  regime1: TaxRegime;
  regime2: TaxRegime;
  difference: number;
}

// Константы для расчетов
export interface TaxConstants {
  irpfBrackets: {
    estatal: { min: number; max: number; rate: number }[];
    autonomico: {
      madrid: { min: number; max: number; rate: number }[];
      catalunya: { min: number; max: number; rate: number }[];
      valencia: { min: number; max: number; rate: number }[];
    };
  };
  socialSecurity: {
    employee: {
      general: number;
      unemployment: number;
      training: number;
      mei: number;
    };
    autonomo: {
      rate: number;
      minBase: number;
      maxBase: number;
    };
    bases: {
      min: number;
      max: number;
    };
  };
  corporateTax: {
    micro: { rate1: number; rate2: number; threshold: number };
    regular: number;
    startup: number;
  };
  tarifaPlana: {
    months: number;
    amount: number;
  };
  beckham: {
    rate: number;
    threshold: number;
    highRate: number;
  };
  personalAllowances: {
    general: number;
    jointFilingMarried: number;
    jointFilingSingleParent: number;
    children: { num: number; amount: number }[];
    childUnder3: number;
  };
}

// URL параметры
export interface URLParams {
  r?: string; // режимы
  c?: string; // сообщество
  m?: string; // семейное положение
  ch?: string; // дети
  rev?: string; // доход
  exp?: string; // расходы
}

// Настройки UI
export interface UISettings {
  selectedRegimes: TaxRegime[];
  showAdvanced: boolean;
  activeChart: 'main' | 'breakdown' | 'effectiveRate' | 'crossover';
  showInsights: boolean;
} 