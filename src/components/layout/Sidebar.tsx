'use client';

import { useCalculatorStore } from '@/store/calculator-store';
import { REGIME_NAMES, COMMUNITY_NAMES } from '@/lib/constants/tax-constants';
import { TaxRegime, AutonomousCommunity, MaritalStatus } from '@/types/tax';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileMenuOpen = false, onMobileClose }: SidebarProps) {
  const {
    community,
    maritalStatus,
    children,
    monthlyExpenses,
    selectedRegimes,
    setCommunity,
    setMaritalStatus,
    setChildren,
    setMonthlyExpenses,
    toggleRegime,
    reset
  } = useCalculatorStore();

  const handleMobileSelect = () => {
    // Закрываем меню после выбора на мобильном
    if (onMobileClose && window.innerWidth < 1024) {
      setTimeout(() => onMobileClose(), 300);
    }
  };

  return (
    <aside className={`cyber-sidebar cyber-scrollbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Мобильный хедер с кнопкой закрытия */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h2 className="text-lg font-cyber cyber-text-glow">
            Настройки
          </h2>
          <button
            onClick={onMobileClose}
            className="cyber-button-mobile p-2 text-cyber-cyan"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        {/* Десктопный заголовок */}
        <div className="text-center hidden lg:block">
          <h2 className="text-xl font-cyber cyber-text-glow mb-2">
            Параметры расчета
          </h2>
          <div className="w-full h-px" style={{background: 'linear-gradient(90deg, #00ffff, #ff007a, #00ffb3)'}}></div>
        </div>

        {/* Автономное сообщество */}
        <div className="space-y-4">
          <h3 className="text-base lg:text-lg font-cyber text-cyber-cyan flex items-center">
            📍 Автономное сообщество
          </h3>
          <div className="space-y-2 lg:space-y-3">
            {(Object.keys(COMMUNITY_NAMES) as AutonomousCommunity[]).map((com) => (
              <label 
                key={com} 
                className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-3 lg:px-4 py-3 lg:py-4 rounded-md"
                onClick={handleMobileSelect}
              >
                <input
                  type="radio"
                  name="community"
                  value={com}
                  checked={community === com}
                  onChange={(e) => setCommunity(e.target.value as AutonomousCommunity)}
                  className="cyber-radio"
                />
                <div className="flex-1">
                  <span className="text-cyber-text font-cyber text-sm lg:text-base">
                    {COMMUNITY_NAMES[com]}
                  </span>
                  <div className="text-xs text-cyber-text-muted mt-1 lg:hidden">
                    {com === 'madrid' && '🟢 Низкие налоги'}
                    {com === 'catalunya' && '🔴 Высокие налоги'}
                    {com === 'valencia' && '🟡 Средние налоги'}
                  </div>
                </div>
                <span className="text-xs text-cyber-text-muted hidden lg:block">
                  {com === 'madrid' && '🟢 Низкие налоги'}
                  {com === 'catalunya' && '🔴 Высокие налоги'}
                  {com === 'valencia' && '🟡 Средние налоги'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Семейное положение */}
        <div className="space-y-4">
          <h3 className="text-base lg:text-lg font-cyber text-cyber-cyan flex items-center">
            👤 Семейное положение
          </h3>
          <div className="space-y-2 lg:space-y-3">
            {[
              { value: 'soltero', label: 'Одинокий/ая' },
              { value: 'casado', label: 'Женат/замужем' },
              { value: 'con_hijos', label: 'С детьми' }
            ].map((status) => (
              <label 
                key={status.value} 
                className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-3 lg:px-4 py-3 lg:py-4 rounded-md"
                onClick={handleMobileSelect}
              >
                <input
                  type="radio"
                  name="maritalStatus"
                  value={status.value}
                  checked={maritalStatus === status.value}
                  onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                  className="cyber-radio"
                />
                <span className="text-cyber-text font-cyber text-sm lg:text-base">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
          
          {maritalStatus === 'con_hijos' && (
            <div className="mt-4 p-4 bg-cyber-darker/30 rounded border border-cyber-cyan/20">
              <label className="block text-sm text-cyber-text-secondary mb-2">
                Количество детей:
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                className="cyber-input w-full"
                placeholder="0"
              />
            </div>
          )}
        </div>



        {/* Ежемесячные расходы */}
        <div className="space-y-4">
          <h3 className="text-base lg:text-lg font-cyber text-cyber-cyan flex items-center">
            💳 Расходы (мес.)
          </h3>
          
          {/* Мобильная версия - компактная */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0"
                max="10000"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(parseInt(e.target.value) || 0)}
                className="cyber-input flex-1"
                placeholder="1000"
              />
              <span className="text-cyber-cyan font-cyber text-sm whitespace-nowrap">
                €/мес
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(parseInt(e.target.value))}
              className="cyber-slider w-full"
            />
            <div className="flex justify-between text-xs text-cyber-text-muted">
              <span>0€</span>
              <span className="text-cyber-cyan font-cyber">
                {monthlyExpenses}€
              </span>
              <span>5000€</span>
            </div>
          </div>

          {/* Десктопная версия */}
          <div className="hidden lg:block space-y-3">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(parseInt(e.target.value))}
              className="cyber-slider"
            />
            <div className="flex justify-between text-xs text-cyber-text-muted">
              <span>0€</span>
              <span className="text-cyber-cyan font-cyber">
                {monthlyExpenses}€/мес
              </span>
              <span>5000€</span>
            </div>
            <input
              type="number"
              min="0"
              max="10000"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(parseInt(e.target.value) || 0)}
              className="cyber-input"
              placeholder="1000"
            />
          </div>
        </div>

        {/* Выбор режимов */}
        <div className="space-y-4">
          <h3 className="text-base lg:text-lg font-cyber text-cyber-cyan flex items-center">
            🎯 Сравнить режимы
          </h3>
          
          {/* Мобильная версия - grid layout */}
          <div className="lg:hidden grid grid-cols-1 gap-2">
            {(Object.keys(REGIME_NAMES) as TaxRegime[]).map((regime) => (
              <label 
                key={regime} 
                className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-3 py-3 rounded-md"
                onClick={handleMobileSelect}
              >
                <input
                  type="checkbox"
                  checked={selectedRegimes.includes(regime)}
                  onChange={() => toggleRegime(regime)}
                  className="cyber-checkbox"
                />
                <span className="text-cyber-text font-cyber text-sm flex-1">
                  {REGIME_NAMES[regime]}
                </span>
              </label>
            ))}
          </div>

          {/* Десктопная версия */}
          <div className="hidden lg:block space-y-3">
            {(Object.keys(REGIME_NAMES) as TaxRegime[]).map((regime) => (
              <label key={regime} className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRegimes.includes(regime)}
                  onChange={() => toggleRegime(regime)}
                  className="cyber-checkbox"
                />
                <span className="text-cyber-text font-cyber text-sm">
                  {REGIME_NAMES[regime]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3 pt-4">
          <button
            onClick={reset}
            className="cyber-button w-full text-sm"
          >
            🔄 Сбросить параметры
          </button>
          
          {/* Мобильная кнопка закрытия */}
          <button
            onClick={onMobileClose}
            className="lg:hidden cyber-button w-full text-sm bg-cyber-green/10 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-dark"
          >
            ✓ Применить настройки
          </button>
        </div>

        {/* Информация */}
        <div className="text-xs text-cyber-text-muted space-y-2 pt-4 border-t border-cyber-cyan/20">
          <p className="hidden lg:block">💡 Используйте слайдеры или вводите точные значения</p>
          <p className="hidden lg:block">🔗 URL автоматически обновляется для сохранения настроек</p>
          <p className="lg:hidden">💡 Настройки сохраняются автоматически</p>
          <p>📱 Интерфейс адаптирован для мобильных устройств</p>
        </div>
      </div>
    </aside>
  );
} 