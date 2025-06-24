import { 
  CalculatorParams, 
  TaxCalculationResult, 
  AutonomousCommunity,
  TaxRegime,
  MaritalStatus
} from '@/types/tax';
import { TAX_CONSTANTS, AUTONOMO_INCOME_BRACKETS } from '../constants/tax-constants';

// --- НОВЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ЛЬГОТ ---

// Расчет необлагаемого минимума (Mínimo Personal y Familiar)
function getFamilyMinimum(params: { children: number }): number {
  const { children } = params;
  const { personalAllowances } = TAX_CONSTANTS;
  
  let totalMinimum = personalAllowances.general;

  if (children > 0) {
    const childrenBrackets = personalAllowances.children;
    if (children >= 4) {
      totalMinimum += childrenBrackets[0].amount + childrenBrackets[1].amount + childrenBrackets[2].amount;
      totalMinimum += (children - 3) * childrenBrackets[3].amount;
    } else if (children === 3) {
      totalMinimum += childrenBrackets[0].amount + childrenBrackets[1].amount + childrenBrackets[2].amount;
    } else if (children === 2) {
      totalMinimum += childrenBrackets[0].amount + childrenBrackets[1].amount;
    } else if (children === 1) {
      totalMinimum += childrenBrackets[0].amount;
    }
    // Упрощение: пока не учитываем возраст детей для бонуса +2800
  }
  
  return totalMinimum;
}

// Расчет прямого вычета из базы для совместной декларации
function getJointFilingReduction(params: { maritalStatus: MaritalStatus, children: number }): number {
  const { maritalStatus, children } = params;
  const { personalAllowances } = TAX_CONSTANTS;
  
  // Для одинокого родителя (неполная семья)
  if (maritalStatus === 'con_hijos' && children > 0) {
    return personalAllowances.jointFilingSingleParent;
  }
  
  // Для женатой пары
  if (maritalStatus === 'casado') {
    return personalAllowances.jointFilingMarried;
  }
  
  return 0;
}


// --- ИЗМЕНЕННАЯ ЛОГИКА РАСЧЕТА IRPF ---

// Расчет налога на часть дохода по прогрессивной шкале
function calculateProgressiveTax(income: number, brackets: { min: number; max: number; rate: number }[]): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }
  
  return tax;
}

// ИЗМЕНЕННАЯ ФУНКЦИЯ: Расчет IRPF с учетом необлагаемого минимума
export function calculateIRPF(
  income: number, 
  community: AutonomousCommunity,
  familyMinimum: number
): number {
  // Налог считается как: Налог(Доход) - Налог(Необлагаемый минимум)
  const totalTaxEstatal = calculateProgressiveTax(income, TAX_CONSTANTS.irpfBrackets.estatal);
  const totalTaxAutonomico = calculateProgressiveTax(income, TAX_CONSTANTS.irpfBrackets.autonomico[community]);
  
  const minimumTaxEstatal = calculateProgressiveTax(familyMinimum, TAX_CONSTANTS.irpfBrackets.estatal);
  const minimumTaxAutonomico = calculateProgressiveTax(familyMinimum, TAX_CONSTANTS.irpfBrackets.autonomico[community]);

  const totalTax = totalTaxEstatal + totalTaxAutonomico;
  const minimumTax = minimumTaxEstatal + minimumTaxAutonomico;
  
  return Math.max(0, totalTax - minimumTax);
}

// Расчет социальных взносов работника
function calculateEmployeeSS(grossAnnual: number): number {
  const monthlyGross = grossAnnual / 12;
  const cotizationBase = Math.min(
    Math.max(monthlyGross, TAX_CONSTANTS.socialSecurity.bases.min),
    TAX_CONSTANTS.socialSecurity.bases.max
  );
  
  const { employee } = TAX_CONSTANTS.socialSecurity;
  const totalRate = employee.general + employee.unemployment + employee.training + employee.mei;
  
  return cotizationBase * 12 * totalRate;
}

// Расчет квоты автономо по доходам
function calculateAutonomoQuota(monthlyIncome: number): number {
  const bracket = AUTONOMO_INCOME_BRACKETS.find(
    b => monthlyIncome >= b.min && monthlyIncome < b.max
  );
  
  if (!bracket) {
    // Максимальный трамо
    const maxBracket = AUTONOMO_INCOME_BRACKETS[AUTONOMO_INCOME_BRACKETS.length - 1];
    return maxBracket.baseMax * TAX_CONSTANTS.socialSecurity.autonomo.rate;
  }
  
  // Используем минимальную базу трамо для упрощения
  return bracket.baseMin * TAX_CONSTANTS.socialSecurity.autonomo.rate;
}

// --- ИЗМЕНЕННЫЕ ФУНКЦИИ РАСЧЕТА РЕЖИМОВ ---

// 1. EMPLEADO - Работник по найму
export function calculateEmpleado(params: CalculatorParams): TaxCalculationResult {
  const { annualRevenue, community, maritalStatus, children } = params;
  
  // Социальные взносы
  const socialSecurity = calculateEmployeeSS(annualRevenue);
  
  // Прямой вычет из базы
  const jointReduction = getJointFilingReduction({ maritalStatus, children });

  // Налогооблагаемая база
  const taxableIncome = Math.max(0, annualRevenue - socialSecurity - jointReduction);
  
  // Необлагаемый минимум
  const familyMinimum = getFamilyMinimum({ children });

  // IRPF
  const irpf = calculateIRPF(taxableIncome, community, familyMinimum);

  const totalTaxes = irpf + socialSecurity;
  
  // Чистый доход "на руки"
  const netAnnual = annualRevenue - totalTaxes;
  const netMonthly = netAnnual / 12;

  // Эффективная ставка (учитывает только налоги)
  const effectiveRate = annualRevenue > 0 ? totalTaxes / annualRevenue : 0;
  
  return {
    regime: 'empleado',
    grossAnnual: annualRevenue,
    netAnnual,
    netMonthly,
    effectiveRate,
    breakdown: {
      irpf,
      socialSecurity,
      mei: annualRevenue * TAX_CONSTANTS.socialSecurity.employee.mei
    },
    advantages: [
      'Полная социальная защита',
      'Оплачиваемые отпуска и больничные',
      'Право на пособие по безработице'
    ],
    disadvantages: [
      'Высокие налоги при больших доходах',
      'НЕТ налогового щита от расходов',
      'Ограниченные возможности оптимизации'
    ],
    requirements: [
      'Контракт с испанской компанией',
      'Любое гражданство'
    ]
  };
}

// 2. AUTONOMO REGULAR - Автономо обычный
export function calculateAutonomoRegular(params: CalculatorParams): TaxCalculationResult {
  const { annualRevenue, monthlyExpenses, community, maritalStatus, children } = params;
  
  // Прямой вычет из базы
  const jointReduction = getJointFilingReduction({ maritalStatus, children });
  
  // Налогооблагаемая база (с учетом расходов и вычета)
  const taxableIncome = Math.max(0, annualRevenue - (monthlyExpenses * 12) - jointReduction);
  
  // Необлагаемый минимум
  const familyMinimum = getFamilyMinimum({ children });

  // IRPF
  const irpf = calculateIRPF(taxableIncome, community, familyMinimum);
  
  // Квота автономо (база для квоты считается от дохода до вычетов)
  const autonomoIncomeForQuota = annualRevenue - (monthlyExpenses * 12);
  const monthlyQuota = calculateAutonomoQuota(autonomoIncomeForQuota / 12);
  const annualQuota = monthlyQuota * 12;

  // Чистый доход "на руки" = валовый доход - налоги (расходы остаются в распоряжении)
  const netAnnual = annualRevenue - irpf - annualQuota;
  const netMonthly = netAnnual / 12;
  
  // Эфф. ставка = только налоги / валовый доход
  const totalTaxes = irpf + annualQuota;
  const effectiveRate = annualRevenue > 0 ? totalTaxes / annualRevenue : 0;
  
  return {
    regime: 'autonomo_regular',
    grossAnnual: annualRevenue,
    netAnnual,
    netMonthly,
    effectiveRate,
    breakdown: {
      irpf,
      socialSecurity: annualQuota
    },
    advantages: [
      'ЕСТЬ налоговый щит от расходов',
      'Возможность вычета расходов',
      'Гибкость работы',
      'Социальная защита'
    ],
    disadvantages: [
      'Высокие фиксированные взносы',
      'Сложная отчетность'
    ],
    requirements: [
      'Регистрация в RETA',
      'Ведение книг доходов/расходов'
    ]
  };
}

// 3. AUTONOMO TARIFA PLANA - Льготная ставка
export function calculateAutonomoTarifaPlana(params: CalculatorParams): TaxCalculationResult {
  const { annualRevenue, monthlyExpenses, community, maritalStatus, children } = params;
  
  // Прямой вычет из базы
  const jointReduction = getJointFilingReduction({ maritalStatus, children });

  // Налогооблагаемая база
  const taxableIncome = Math.max(0, annualRevenue - (monthlyExpenses * 12) - jointReduction);
  
  // Необлагаемый минимум
  const familyMinimum = getFamilyMinimum({ children });

  // IRPF
  const irpf = calculateIRPF(taxableIncome, community, familyMinimum);
  
  // Льготная квота первые 12 месяцев
  const annualQuota = TAX_CONSTANTS.tarifaPlana.amount * TAX_CONSTANTS.tarifaPlana.months;
  
  // Чистый доход "на руки" = валовый доход - налоги (расходы остаются в распоряжении)
  const netAnnual = annualRevenue - irpf - annualQuota;
  const netMonthly = netAnnual / 12;
  
  // Эфф. ставка = только налоги / валовый доход
  const totalTaxes = irpf + annualQuota;
  const effectiveRate = annualRevenue > 0 ? totalTaxes / annualRevenue : 0;
  
  return {
    regime: 'autonomo_tarifa_plana',
    grossAnnual: annualRevenue,
    netAnnual,
    netMonthly,
    effectiveRate,
    breakdown: {
      irpf,
      socialSecurity: annualQuota
    },
    advantages: [
      'ЕСТЬ налоговый щит от расходов',
      'Очень низкие начальные затраты (80€/мес)',
      'Время для развития бизнеса'
    ],
    disadvantages: [
      'Ограниченное время действия (12 месяцев)',
      'Потом резкий скачок взносов'
    ],
    requirements: [
      'Впервые регистрируется как автономо',
      'Не был автономо последние 2 года',
      'Без долгов перед Hacienda и SS'
    ]
  };
}

// Функция расчета налога на дивиденды по прогрессивной шкале
function calculateDividendTax(dividendAmount: number): number {
  if (dividendAmount <= 0) return 0;
  
  let tax = 0;
  let remaining = dividendAmount;
  
  // Прогрессивная шкала для дивидендов 2025
  const brackets = [
    { limit: 6000, rate: 0.19 },
    { limit: 44000, rate: 0.21 },    // 50,000 - 6,000 = 44,000
    { limit: 150000, rate: 0.23 },   // 200,000 - 50,000 = 150,000  
    { limit: 100000, rate: 0.27 },   // 300,000 - 200,000 = 100,000
    { limit: Infinity, rate: 0.30 }  // свыше 300,000
  ];
  
  for (const bracket of brackets) {
    const taxableInThisBracket = Math.min(remaining, bracket.limit);
    tax += taxableInThisBracket * bracket.rate;
    remaining -= taxableInThisBracket;
    
    if (remaining <= 0) break;
  }
  
  return tax;
}

// Функция расчета социальных взносов администратора SL (RETA)
function calculateAdministratorSocialSecurity(): number {
  // По новой системе 2025, минимальные взносы для администраторов SL
  // Берем первый трамп (до €670/мес) = €205/мес = €2,460/год
  return 205 * 12; // €2,460/год
}

// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ SL (ИСПРАВЛЕННАЯ МОДЕЛЬ)
function calculateSlNetIncome(
  params: CalculatorParams,
  taxType: 'micro' | 'regular' | 'startup'
): TaxCalculationResult {
  const { annualRevenue, monthlyExpenses } = params;

  // 1. СОЦИАЛЬНЫЕ ВЗНОСЫ АДМИНИСТРАТОРА (обязательные для всех SL)
  const administratorSocialSecurity = calculateAdministratorSocialSecurity();
  
  // 2. НАЛОГОВЫЙ ЩИТ: расходы компании уменьшают прибыль до корпоративного налога
  const businessExpenses = monthlyExpenses * 12;
  const totalCompanyExpenses = businessExpenses + administratorSocialSecurity;
  
  // 3. Прибыль до корпоративного налога
  const profitBeforeTax = Math.max(0, annualRevenue - totalCompanyExpenses);

  // 4. Корпоративный налог в зависимости от типа SL
  let corporateTaxRate: number;
  switch (taxType) {
    case 'micro':
      corporateTaxRate = TAX_CONSTANTS.corporateTax.micro.rate1; // 23%
      break;
    case 'regular':
      corporateTaxRate = TAX_CONSTANTS.corporateTax.regular; // 25%
      break;
    case 'startup':
      corporateTaxRate = TAX_CONSTANTS.corporateTax.startup; // 15%
      break;
  }
  
  const corporateTax = profitBeforeTax * corporateTaxRate;
  const profitAfterCorpTax = profitBeforeTax - corporateTax;

  // 5. Дивиденды = вся чистая прибыль компании
  const dividends = profitAfterCorpTax;
  
  // 6. Налог на дивиденды по прогрессивной шкале
  const dividendTax = calculateDividendTax(dividends);
  
  // 7. ИТОГОВЫЙ ЧИСТЫЙ ДОХОД "НА РУКИ" = валовый доход - все налоги (расходы остаются в распоряжении)
  const totalTaxes = administratorSocialSecurity + corporateTax + dividendTax;
  const netAnnual = annualRevenue - totalTaxes;
  const netMonthly = netAnnual / 12;
  
  // 8. Эффективная ставка = все налоги / валовый доход
  const effectiveRate = annualRevenue > 0 ? totalTaxes / annualRevenue : 0;

  const regimeMap = {
    micro: 'sl_micro',
    regular: 'sl_regular', 
    startup: 'startup_certificada',
  };

  return {
    regime: regimeMap[taxType] as TaxRegime,
    grossAnnual: annualRevenue,
    netAnnual,
    netMonthly,
    effectiveRate,
    breakdown: {
      irpf: 0, // В SL нет зарплаты, значит нет IRPF с зарплаты
      socialSecurity: administratorSocialSecurity, // Обязательные взносы администратора
      corporateTax,
      dividendTax,
    },
    advantages: [
      'ЕСТЬ налоговый щит от расходов',
      'Ограниченная ответственность',
      'Оптимизация через дивиденды', 
      `Корпоративный налог: ${corporateTaxRate * 100}%`,
      'Нет соцвзносов с дивидендов'
    ],
    disadvantages: [
      'Обязательные соцвзносы администратора: €205/мес',
      'Сложная администрация',
      'Двойное налогообложение',
      'Минимальный капитал €3,000'
    ],
    requirements: [
      'Регистрация юр. лица (SL)',
      'Регистрация администратора в RETA',
      'Ведение бухучета',
      'Годовая отчетность'
    ]
  };
}

// 4. SL MICRO - Микропредприятие
export function calculateSLMicro(params: CalculatorParams): TaxCalculationResult {
  return calculateSlNetIncome(params, 'micro');
}

// 5. SL REGULAR - Обычное предприятие
export function calculateSLRegular(params: CalculatorParams): TaxCalculationResult {
  return calculateSlNetIncome(params, 'regular');
}

// 6. STARTUP CERTIFICADA - Сертифицированный стартап
export function calculateStartupCertificada(params: CalculatorParams): TaxCalculationResult {
  return calculateSlNetIncome(params, 'startup');
}

// 7. REGIMEN BECKHAM - Режим Бекхэма (ИСПРАВЛЕННАЯ ВЕРСИЯ)
export function calculateBeckham(params: CalculatorParams): TaxCalculationResult {
  const { annualRevenue, monthlyExpenses } = params;
  
  // НАЛОГОВЫЙ ЩИТ: в режиме Beckham можно вычитать бизнес-расходы от испанских доходов
  const taxableIncome = annualRevenue - (monthlyExpenses * 12);
  
  // Простой расчет налога по фиксированным ставкам Beckham
  let irpf = 0;
  if (taxableIncome <= TAX_CONSTANTS.beckham.threshold) {
    irpf = taxableIncome * TAX_CONSTANTS.beckham.rate;
  } else {
    irpf = (TAX_CONSTANTS.beckham.threshold * TAX_CONSTANTS.beckham.rate) +
           ((taxableIncome - TAX_CONSTANTS.beckham.threshold) * TAX_CONSTANTS.beckham.highRate);
  }
  
  // Соцвзносы платятся как у Empleado
  const socialSecurity = calculateEmployeeSS(annualRevenue);
  
  const totalTaxes = irpf + socialSecurity;
  
  // Чистый доход "на руки" = валовый доход - налоги (расходы остаются в распоряжении)
  const netAnnual = annualRevenue - totalTaxes;
  const netMonthly = netAnnual / 12;

  // Эффективная ставка: налоги к валовому доходу
  const effectiveRate = annualRevenue > 0 ? totalTaxes / annualRevenue : 0;
  
  return {
    regime: 'beckham',
    grossAnnual: annualRevenue,
    netAnnual,
    netMonthly,
    effectiveRate,
    breakdown: {
      irpf,
      socialSecurity
    },
    advantages: [
      'ЕСТЬ налоговый щит от расходов',
      'Фиксированная ставка 24% до 600k€',
      'Налогообложение только доходов в Испании',
      'Простая декларация'
    ],
    disadvantages: [
      'Нет стандартных вычетов (аренда, дети и т.д.)',
      'Высокая ставка свыше 600k€ (47%)',
      'Нельзя применять для всех',
      'Ограниченное время действия (6 лет)'
    ],
    requirements: [
      'Не был резидентом последние 5 лет',
      'Переезд в Испанию по работе',
      'Трудовой договор в Испании',
      'Подать заявку в течение 6 месяцев'
    ]
  };
}

// Основная функция-диспетчер
export function calculateTaxRegime(
  regime: TaxRegime, 
  params: CalculatorParams
): TaxCalculationResult {
  switch (regime) {
    case 'empleado':
      return calculateEmpleado(params);
    case 'autonomo_regular':
      return calculateAutonomoRegular(params);
    case 'autonomo_tarifa_plana':
      return calculateAutonomoTarifaPlana(params);
    case 'sl_micro':
      return calculateSLMicro(params);
    case 'sl_regular':
      return calculateSLRegular(params);
    case 'startup_certificada':
      return calculateStartupCertificada(params);
    case 'beckham':
      return calculateBeckham(params);
    default:
      throw new Error(`Unknown tax regime: ${regime}`);
  }
}

// Расчет для всех выбранных режимов
export function calculateAllRegimes(params: CalculatorParams): TaxCalculationResult[] {
  return params.regime.map(regime => calculateTaxRegime(regime, params));
} 