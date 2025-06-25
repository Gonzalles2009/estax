import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  CalculatorParams, 
  TaxCalculationResult, 
  TaxRegime, 
  AutonomousCommunity,
  MaritalStatus,
  UISettings 
} from '@/types/tax';

interface CalculatorStore extends CalculatorParams, UISettings {
  // Результаты расчетов
  results: TaxCalculationResult[];
  
  // Actions для параметров
  setRegimes: (regimes: TaxRegime[]) => void;
  setCommunity: (community: AutonomousCommunity) => void;
  setMaritalStatus: (status: MaritalStatus) => void;
  setChildren: (children: number) => void;
  setAnnualRevenue: (revenue: number) => void;
  setMonthlyExpenses: (expenses: number) => void;
  setCompanyAge: (age: number) => void;
  setBeckhamYear: (year: number) => void;
  setPlannedDividends: (dividends: number) => void;
  setStockOptions: (options: number) => void;
  
  // Actions для UI
  setSelectedRegimes: (regimes: TaxRegime[]) => void;
  toggleRegime: (regime: TaxRegime) => void;
  setShowAdvanced: (show: boolean) => void;
  setActiveChart: (chart: UISettings['activeChart']) => void;
  setShowInsights: (show: boolean) => void;
  
  // Actions для результатов
  setResults: (results: TaxCalculationResult[]) => void;
  clearResults: () => void;
  
  // URL синхронизация
  loadFromURL: () => void;
  updateURL: () => void;
  
  // Сброс к начальным значениям
  reset: () => void;
}

// Начальные значения
const initialParams: CalculatorParams = {
  regime: ['empleado', 'autonomo_regular', 'sl_micro'],
  community: 'madrid',
  maritalStatus: 'soltero',
  children: 0,
  annualRevenue: 75000,
  monthlyExpenses: 1000,
  companyAge: 1,
  beckhamYear: 1,
  plannedDividends: 0,
  stockOptions: 0
};

const initialUI: UISettings = {
  selectedRegimes: ['empleado', 'autonomo_regular', 'sl_micro'],
  showAdvanced: false,
  activeChart: 'main',
  showInsights: true
};

export const useCalculatorStore = create<CalculatorStore>()(
  subscribeWithSelector((set, get) => ({
    // Начальное состояние
    ...initialParams,
    ...initialUI,
    results: [],

    // Actions для параметров
    setRegimes: (regimes) => set({ regime: regimes }),
    setCommunity: (community) => set({ community }),
    setMaritalStatus: (maritalStatus) => set({ maritalStatus }),
    setChildren: (children) => set({ children }),
    setAnnualRevenue: (annualRevenue) => set({ annualRevenue }),
    setMonthlyExpenses: (monthlyExpenses) => set({ monthlyExpenses }),
    setCompanyAge: (companyAge) => set({ companyAge }),
    setBeckhamYear: (beckhamYear) => set({ beckhamYear }),
    setPlannedDividends: (plannedDividends) => set({ plannedDividends }),
    setStockOptions: (stockOptions) => set({ stockOptions }),

    // Actions для UI
    setSelectedRegimes: (selectedRegimes) => set({ selectedRegimes }),
    
    toggleRegime: (regime) => {
      const current = get().selectedRegimes;
      const updated = current.includes(regime)
        ? current.filter(r => r !== regime)
        : [...current, regime];
      set({ selectedRegimes: updated });
    },
    
    setShowAdvanced: (showAdvanced) => set({ showAdvanced }),
    setActiveChart: (activeChart) => set({ activeChart }),
    setShowInsights: (showInsights) => set({ showInsights }),

    // Actions для результатов
    setResults: (results) => set({ results }),
    clearResults: () => set({ results: [] }),

    // URL синхронизация
    loadFromURL: () => {
      if (typeof window === 'undefined') return;
      
      const params = new URLSearchParams(window.location.search);
      const updates: Partial<CalculatorStore> = {};
      
      // Режимы
      if (params.get('r')) {
        const regimes = params.get('r')!.split(',') as TaxRegime[];
        updates.selectedRegimes = regimes;
        updates.regime = regimes;
      }
      
      // Сообщество
      if (params.get('c')) {
        updates.community = params.get('c') as AutonomousCommunity;
      }
      
      // Семейное положение
      if (params.get('m')) {
        updates.maritalStatus = params.get('m') as MaritalStatus;
      }
      
      // Дети
      if (params.get('ch')) {
        updates.children = parseInt(params.get('ch')!);
      }
      
      // Доход
      if (params.get('rev')) {
        updates.annualRevenue = parseInt(params.get('rev')!);
      }
      
      // Расходы
      if (params.get('exp')) {
        updates.monthlyExpenses = parseInt(params.get('exp')!);
      }
      
      set(updates);
    },

    updateURL: () => {
      if (typeof window === 'undefined') return;
      
      const state = get();
      const params = new URLSearchParams();
      
      // Только не-дефолтные значения
      if (state.selectedRegimes.length > 0) {
        params.set('r', state.selectedRegimes.join(','));
      }
      
      if (state.community !== 'madrid') {
        params.set('c', state.community);
      }
      
      if (state.maritalStatus !== 'soltero') {
        params.set('m', state.maritalStatus);
      }
      
      if (state.children > 0) {
        params.set('ch', state.children.toString());
      }
      
      if (state.annualRevenue !== 75000) {
        params.set('rev', state.annualRevenue.toString());
      }
      
      if (state.monthlyExpenses !== 1000) {
        params.set('exp', state.monthlyExpenses.toString());
      }
      
      const url = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
        
      window.history.replaceState({}, '', url);
    },

    // Сброс
    reset: () => set({
      ...initialParams,
      ...initialUI,
      results: []
    })
  }))
);

// Подписка на изменения для автоматического обновления URL
if (typeof window !== 'undefined') {
  let debounceTimeout: NodeJS.Timeout | null = null;
  let lastUpdateTime = 0;
  const MIN_UPDATE_INTERVAL = 1000; // Минимум 1 секунда между обновлениями URL
  
  useCalculatorStore.subscribe(
    (state) => ({
      selectedRegimes: state.selectedRegimes,
      community: state.community,
      maritalStatus: state.maritalStatus,
      children: state.children,
      annualRevenue: state.annualRevenue,
      monthlyExpenses: state.monthlyExpenses
    }),
    () => {
      // Очищаем предыдущий timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Проверяем, что прошло достаточно времени
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;
      
      if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
        // Если слишком часто - откладываем обновление
        debounceTimeout = setTimeout(() => {
          lastUpdateTime = Date.now();
          useCalculatorStore.getState().updateURL();
        }, MIN_UPDATE_INTERVAL - timeSinceLastUpdate);
      } else {
        // Можно обновить сразу
        debounceTimeout = setTimeout(() => {
          lastUpdateTime = Date.now();
          useCalculatorStore.getState().updateURL();
        }, 500); // Небольшая задержка для batching
      }
    }
  );
} 