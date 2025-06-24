import { TaxConstants, TaxRegime, AutonomousCommunity } from '@/types/tax';

// Дополнительные константы
export const REGIME_NAMES: Record<TaxRegime, string> = {
  empleado: 'Empleado (Работник)',
  autonomo_regular: 'Autónomo Regular',
  autonomo_tarifa_plana: 'Autónomo Tarifa Plana',
  sl_micro: 'SL Microempresa',
  sl_regular: 'SL Regular',
  startup_certificada: 'Startup Certificada',
  beckham: 'Régimen Beckham'
};

export const COMMUNITY_NAMES: Record<AutonomousCommunity, string> = {
  madrid: 'Madrid',
  catalunya: 'Catalunya',
  valencia: 'Valencia'
};

export const CHART_COLORS: Record<TaxRegime, string> = {
  empleado: '#00ffff',        // cyan
  autonomo_regular: '#ff007a', // magenta
  autonomo_tarifa_plana: '#00ffb3', // green
  sl_micro: '#8b5cf6',        // purple
  sl_regular: '#ffd700',      // yellow
  startup_certificada: '#ff8c00', // orange
  beckham: '#ff69b4'          // pink
};

// Трамы доходов для автономо удалены дублирование

export const TAX_CONSTANTS: TaxConstants = {
  irpfBrackets: {
    // Государственные трамы IRPF 2025
    estatal: [
      { min: 0, max: 12450, rate: 0.19 },
      { min: 12450, max: 20200, rate: 0.24 },
      { min: 20200, max: 35200, rate: 0.30 },
      { min: 35200, max: 60000, rate: 0.37 },
      { min: 60000, max: 300000, rate: 0.45 },
      { min: 300000, max: Infinity, rate: 0.47 }
    ],
    
    // Автономные трамы IRPF 2025
    autonomico: {
      madrid: [
        // Escala Madrid 2025 (проверенные данные)
        { min: 0, max: 12450, rate: 0.085 },
        { min: 12450, max: 20200, rate: 0.115 },
        { min: 20200, max: 35200, rate: 0.14 },
        { min: 35200, max: 60000, rate: 0.175 },
        { min: 60000, max: Infinity, rate: 0.205 }
      ],
      catalunya: [
        // Escala Catalunya 2025 (Llei 2/2025)
        { min: 0, max: 12450, rate: 0.105 },
        { min: 12450, max: 17707, rate: 0.12 },
        { min: 17707, max: 21000, rate: 0.14 },
        { min: 21000, max: 33007, rate: 0.15 },
        { min: 33007, max: 53407, rate: 0.188 },
        { min: 53407, max: 90000, rate: 0.215 },
        { min: 90000, max: 120000, rate: 0.235 },
        { min: 120000, max: 175000, rate: 0.245 },
        { min: 175000, max: Infinity, rate: 0.255 }
      ],
      valencia: [
        // Escala Comunitat Valenciana 2025 (официальные данные)
        { min: 0, max: 12450, rate: 0.09 },
        { min: 12450, max: 20200, rate: 0.12 },
        { min: 20200, max: 35200, rate: 0.15 },
        { min: 35200, max: 60000, rate: 0.185 },
        { min: 60000, max: Infinity, rate: 0.225 }
      ]
    }
  },

  socialSecurity: {
    // Взносы работника
    employee: {
      general: 0.047,    // 4.7%
      unemployment: 0.0155, // 1.55%
      training: 0.001,   // 0.1%
      mei: 0.0013       // 0.13% (MEI 2025: 0.8% total)
    },
    
    // Взносы автономо
    autonomo: {
      rate: 0.283,      // 28.3% общая ставка (contingencias comunes)
      minBase: 653.59,  // минимальная база котизации
      maxBase: 4909.50  // максимальная база котизации 2025
    },
    
    // Базы котизации работника
    bases: {
      min: 1381.20,     // минимальная база котизации 2025
      max: 4909.50      // максимальная база котизации 2025
    }
  },

  corporateTax: {
    // SL микро (до 1 млн оборота)
    micro: {
      // Плоская ставка 23 % для sociedades con facturación <1 M€ (Ley 38/2024)
      rate1: 0.23,
      rate2: 0.23,
      threshold: 0
    },
    
    // SL обычная (свыше 1 млн оборота)
    regular: 0.25,      // 25%
    
    // Startup сертифицированная
    startup: 0.15       // 15% первые 4 года
  },

  tarifaPlana: {
    months: 12,         // первые 12 месяцев
    amount: 80          // 80€/месяц (по-прежнему 80€ в 2025)
  },

  beckham: {
    rate: 0.24,         // 24% до порога
    threshold: 600000,  // 600k€ порог
    highRate: 0.47      // 47% свыше порога
  },

  personalAllowances: {
    // Mínimo personal y familiar (необлагаемый минимум)
    general: 5550,
    // Reducción por tributación conjunta (прямой вычет из базы)
    jointFilingMarried: 3400,
    jointFilingSingleParent: 2150,
    // Mínimo por descendientes
    children: [
      { num: 1, amount: 2400 },
      { num: 2, amount: 2700 },
      { num: 3, amount: 4000 },
      { num: 4, amount: 4500 } // для 4-го и последующих
    ],
    // Дополнительно за ребенка до 3 лет
    childUnder3: 2800
  }
};

// Трамы доходов автономо 2025 (Tabla reducida + Tabla general)
export const AUTONOMO_INCOME_BRACKETS = [
  // Tabla reducida
  { min: 0, max: 670, baseMin: 653.59, baseMax: 718.94 },
  { min: 670, max: 900, baseMin: 718.95, baseMax: 900 },
  { min: 900, max: 1166.70, baseMin: 849.67, baseMax: 1166.70 },
  
  // Tabla general
  { min: 1166.70, max: 1300, baseMin: 950.98, baseMax: 1300 },
  { min: 1300, max: 1500, baseMin: 960.78, baseMax: 1500 },
  { min: 1500, max: 1700, baseMin: 960.78, baseMax: 1700 },
  { min: 1700, max: 1850, baseMin: 1143.79, baseMax: 1850 },
  { min: 1850, max: 2030, baseMin: 1209.15, baseMax: 2030 },
  { min: 2030, max: 2330, baseMin: 1274.51, baseMax: 2330 },
  { min: 2330, max: 2760, baseMin: 1356.21, baseMax: 2760 },
  { min: 2760, max: 3190, baseMin: 1437.91, baseMax: 3190 },
  { min: 3190, max: 3620, baseMin: 1519.61, baseMax: 3620 },
  { min: 3620, max: 4050, baseMin: 1601.31, baseMax: 4050 },
  { min: 4050, max: 6000, baseMin: 1732.03, baseMax: 4909.50 },
  { min: 6000, max: Infinity, baseMin: 1928.10, baseMax: 4909.50 }
];

// Дублирование констант удалено 