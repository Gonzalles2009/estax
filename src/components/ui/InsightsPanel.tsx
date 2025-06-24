'use client';

import { useState, useEffect } from 'react';
import { TaxCalculationResult } from '@/types/tax';
import { REGIME_NAMES, CHART_COLORS } from '@/lib/constants/tax-constants';
import { useCalculatorStore } from '@/store/calculator-store';

interface InsightsPanelProps {
  results: TaxCalculationResult[];
}

export function InsightsPanel({ results }: InsightsPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { annualRevenue } = useCalculatorStore();

  // Детект мобильного устройства
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (results.length === 0) {
    return null;
  }

  // Сортируем результаты по чистому доходу (по убыванию)
  const sortedResults = [...results].sort((a, b) => b.netAnnual - a.netAnnual);
  const bestRegime = sortedResults[0];

  // Мобильная версия с карточками
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Заголовок */}
        <div className="cyber-card-mobile p-4">
          <h3 className="text-sm font-cyber text-cyber-cyan mb-2 flex items-center">
            📊 Сравнение режимов
          </h3>
          <div className="text-xs text-cyber-text-muted">
            Доходы при €{(annualRevenue / 1000).toFixed(0)}k/год
          </div>
        </div>

        {/* Карточки режимов */}
        <div className="space-y-3">
          {sortedResults.map((result, index) => {
            const isWinner = index === 0;
            const monthlyTaxes = ((result.breakdown?.irpf || 0) + (result.breakdown?.corporateTax || 0) + (result.breakdown?.dividendTax || 0)) / 12;
            const monthlySS = (result.breakdown?.socialSecurity || 0) / 12;
            
            return (
              <div 
                key={result.regime} 
                className={`cyber-card-mobile p-4 ${isWinner ? 'border-cyber-green/40 bg-cyber-green/5' : ''}`}
              >
                {/* Заголовок карточки */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isWinner && <span className="text-cyber-green">🏆</span>}
                    <span className={`font-cyber text-sm ${isWinner ? 'text-cyber-green' : 'text-cyber-cyan'}`}>
                      {REGIME_NAMES[result.regime]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-cyber text-lg ${isWinner ? 'text-cyber-green' : 'text-cyber-cyan'}`}>
                      €{result.netMonthly.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-cyber-text-muted">в месяц</div>
                  </div>
                </div>

                {/* Детали */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-cyber-darker/30 rounded">
                    <div className="text-cyber-magenta font-cyber">
                      €{monthlyTaxes.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-cyber-text-muted">Налоги</div>
                  </div>
                  <div className="text-center p-2 bg-cyber-darker/30 rounded">
                    <div className="text-cyber-orange font-cyber">
                      €{monthlySS.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-cyber-text-muted">Соц.взносы</div>
                  </div>
                  <div className="text-center p-2 bg-cyber-darker/30 rounded">
                    <div className="text-cyber-cyan font-cyber">
                      {(result.effectiveRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-cyber-text-muted">Эфф.ставка</div>
                  </div>
                </div>

                {/* Разность с лучшим режимом */}
                {!isWinner && (
                  <div className="mt-3 pt-2 border-t border-cyber-cyan/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-cyber-text-muted">Потеря:</span>
                      <span className="text-cyber-red font-cyber">
                        -€{Math.round(bestRegime.netMonthly - result.netMonthly).toLocaleString()}/мес
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Общая статистика */}
        {sortedResults.length > 1 && (
          <div className="cyber-card-mobile p-4">
            <h4 className="text-sm font-cyber text-cyber-yellow mb-3 flex items-center">
              💰 Итоговая экономия
            </h4>
            <div className="space-y-2">
              {sortedResults.slice(1).map((result) => {
                const monthlyLoss = bestRegime.netMonthly - result.netMonthly;
                const annualLoss = monthlyLoss * 12;
                return (
                  <div key={result.regime} className="flex justify-between items-center text-xs">
                    <span style={{ color: CHART_COLORS[result.regime] }} className="truncate flex-1 mr-2">
                      {REGIME_NAMES[result.regime]}:
                    </span>
                    <span className="text-cyber-red font-cyber whitespace-nowrap">
                      -€{Math.round(annualLoss).toLocaleString()}/год
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Заметка */}
        <div className="cyber-panel p-3 border-cyber-yellow/20">
          <div className="flex items-start space-x-2">
            <div className="text-sm">⚠️ </div>
            <div className="text-xs text-cyber-text-muted">
              Приблизительные расчеты. Для точного планирования обратитесь к налоговому консультанту.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Десктопная версия с таблицей
  return (
    <div className="space-y-4">
      {/* Сравнительная таблица всех выбранных режимов */}
      {sortedResults.length > 1 && (
        <div className="cyber-card">
          <h3 className="text-sm font-cyber text-cyber-cyan mb-4">
            📊 Сравнение всех режимов (€{(annualRevenue / 1000).toFixed(0)}k/год или €{(annualRevenue / 12).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/мес)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-cyber-cyan/20">
                  <th className="text-left py-2 pr-3 font-cyber text-cyber-cyan">Режим</th>
                  <th className="text-right py-2 px-2 font-cyber text-cyber-green">Чистый/мес</th>
                  <th className="text-right py-2 px-2 font-cyber text-cyber-magenta">Налоги/мес</th>
                  <th className="text-right py-2 px-2 font-cyber text-cyber-orange">Соц.взносы/мес</th>
                  <th className="text-right py-2 pl-2 font-cyber text-cyber-cyan">Эфф.ставка</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result, index) => {
                  const isWinner = index === 0;
                  const monthlyTaxes = ((result.breakdown?.irpf || 0) + (result.breakdown?.corporateTax || 0) + (result.breakdown?.dividendTax || 0)) / 12;
                  const monthlySS = (result.breakdown?.socialSecurity || 0) / 12;
                  
                  return (
                    <tr key={result.regime} className={`border-b border-cyber-cyan/10 ${isWinner ? 'bg-cyber-green/5' : ''}`}>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          {isWinner && <span className="text-cyber-green">🏆</span>}
                          <span className={`font-cyber ${isWinner ? 'text-cyber-green' : 'text-cyber-blue'}`}>
                            {REGIME_NAMES[result.regime]}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-cyber-green font-bold">
                        €{result.netMonthly.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-cyber-magenta">
                        €{monthlyTaxes.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-cyber-orange">
                        €{monthlySS.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="text-right py-2 pl-2 font-mono text-cyber-cyan">
                        {(result.effectiveRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Разность с лучшим режимом */}
          {sortedResults.length > 1 && (
            <div className="mt-3 pt-3 border-t border-cyber-cyan/10">
              <div className="text-xs text-cyber-text-muted mb-2">💸 Потери относительно лучшего:</div>
              <div className="space-y-1">
                {sortedResults.slice(1).map((result) => {
                  const monthlyLoss = bestRegime.netMonthly - result.netMonthly;
                  const annualLoss = monthlyLoss * 12;
                  return (
                    <div key={result.regime} className="flex justify-between items-center text-xs">
                      <span style={{ color: CHART_COLORS[result.regime] }}>
                        {REGIME_NAMES[result.regime]}:
                      </span>
                      <span className="text-cyber-red">
                        -€{Math.round(monthlyLoss).toLocaleString()}/мес (-€{Math.round(annualLoss).toLocaleString()}/год)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Заметка */}
      <div className="cyber-panel p-3 border-cyber-yellow/20">
        <div className="flex items-start space-x-2">
          <div className="text-sm">⚠️ </div>
          <div className="text-xs text-cyber-text-muted">
            Приблизительные расчеты. Для точного планирования обратитесь к налоговому консультанту.
          </div>
        </div>
      </div>
    </div>
  );
} 