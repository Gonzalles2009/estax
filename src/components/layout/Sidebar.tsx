'use client';
import { useCalculatorStore } from '@/store/calculator-store';
import { REGIME_NAMES, COMMUNITY_NAMES } from '@/lib/constants/tax-constants';
import { TaxRegime, AutonomousCommunity, MaritalStatus } from '@/types/tax';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isMobileMenuOpen = false, onMobileClose, isMobile = false }: SidebarProps) {

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



  return (
    <aside className={`cyber-sidebar cyber-scrollbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className={`py-6 space-y-6 ${isMobile ? 'px-4' : 'px-16'}`}>
        {/* Мобильный хедер с кнопкой закрытия */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6">
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
        )}

        {/* Десктопный заголовок */}
        {!isMobile && (
          <div className="text-center">
            <h2 className="text-xl font-cyber cyber-text-glow mb-2">
              Параметры расчета
            </h2>
            <div className="w-full h-px" style={{background: 'linear-gradient(90deg, #00ffff, #ff007a, #00ffb3)'}}></div>
          </div>
        )}

        {/* Автономное сообщество */}
                  <div className="space-y-4">
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cyber text-cyber-cyan flex items-center`}>
              📍 Автономное сообщество
            </h3>
            <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            {(Object.keys(COMMUNITY_NAMES) as AutonomousCommunity[]).map((com) => (
              <label 
                key={com} 
                className={`flex items-center space-x-3 cursor-pointer cyber-border-animated rounded-md ${isMobile ? 'px-3 py-3' : 'px-8 py-4'}`}
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
                  <span className={`text-cyber-text font-cyber ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {COMMUNITY_NAMES[com]}
                  </span>
                  {isMobile && (
                    <div className="text-xs text-cyber-text-muted mt-1">
                      {com === 'madrid' && '🟢 Низкие налоги'}
                      {com === 'catalunya' && '🔴 Высокие налоги'}
                      {com === 'valencia' && '🟡 Средние налоги'}
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <span className="text-xs text-cyber-text-muted">
                    {com === 'madrid' && '🟢 Низкие налоги'}
                    {com === 'catalunya' && '🔴 Высокие налоги'}
                    {com === 'valencia' && '🟡 Средние налоги'}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Семейное положение */}
        <div className="space-y-4">
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cyber text-cyber-cyan flex items-center`}>
              👤 Семейное положение
            </h3>
            <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            {[
              { value: 'soltero', label: 'Одинокий/ая' },
              { value: 'casado', label: 'Женат/замужем' }
            ].map((status) => (
              <label 
                key={status.value} 
                className={`flex items-center space-x-3 cursor-pointer cyber-border-animated rounded-md ${isMobile ? 'px-3 py-3' : 'px-8 py-4'}`}
              >
                <input
                  type="radio"
                  name="maritalStatus"
                  value={status.value}
                  checked={maritalStatus === status.value}
                  onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                  className="cyber-radio"
                />
                <span className={`text-cyber-text font-cyber ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {status.label}
                </span>
              </label>
            ))}
          </div>
          

        </div>

        {/* Количество детей */}
        <div className="space-y-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cyber text-cyber-cyan flex items-center`}>
            👶 Количество детей
          </h3>
          
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value))}
              className="cyber-slider w-full"
            />
            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'} text-cyber-text-muted`}>
              <span>0</span>
              <span className="text-cyber-cyan font-cyber">
                {children === 0 ? '0 детей' : children === 1 ? '1 ребёнок' : `${children} детей`}
              </span>
              <span>12</span>
            </div>
          </div>
        </div>

        {/* Ежемесячные расходы */}
        <div className="space-y-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cyber text-cyber-cyan flex items-center`}>
            💳 Расходы (мес.)
          </h3>
          
          {/* Мобильная версия - только слайдер */}
          {isMobile && (
            <div className="space-y-3">
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
                  {monthlyExpenses}€/мес
                </span>
                <span>5000€</span>
              </div>
            </div>
          )}

          {/* Десктопная версия - только слайдер */}
          {!isMobile && (
            <div className="space-y-3">
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
            </div>
          )}
        </div>

        {/* Выбор режимов */}
        <div className="space-y-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-cyber text-cyber-cyan flex items-center`}>
            🎯 Сравнить режимы
          </h3>
          
          {/* Мобильная версия - grid layout */}
          {isMobile && (
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(REGIME_NAMES) as TaxRegime[]).map((regime) => (
                <label 
                  key={regime} 
                  className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-3 py-3 rounded-md"
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
          )}

          {/* Десктопная версия */}
          {!isMobile && (
            <div className="space-y-3">
              {(Object.keys(REGIME_NAMES) as TaxRegime[]).map((regime) => (
                <label key={regime} className="flex items-center space-x-3 cursor-pointer cyber-border-animated px-8 py-3">
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
          )}
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3 pt-4">
          <button
            onClick={reset}
            className="cyber-button w-full text-sm"
          >
            🔄 Сбросить параметры
          </button>
          
          {/* Мобильная кнопка применения */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              className="cyber-button w-full text-base font-bold bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-dark shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            >
              ✓ Применить и закрыть
            </button>
          )}
        </div>

        {/* Информация */}
        <div className="text-xs text-cyber-text-muted space-y-2 pt-4 border-t border-cyber-cyan/20">
          {!isMobile && (
            <>
              <p>💡 Используйте слайдеры или вводите точные значения</p>
              <p>🔗 URL автоматически обновляется для сохранения настроек</p>
            </>
          )}
          {isMobile && <p>💡 Выберите несколько параметров, затем нажмите &quot;Применить&quot;</p>}
          <p>📱 Интерфейс адаптирован для мобильных устройств</p>
        </div>
      </div>
    </aside>
  );
} 