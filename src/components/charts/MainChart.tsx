'use client';

import { Line } from 'react-chartjs-2';
import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartDataset
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import dragDataPlugin from 'chartjs-plugin-dragdata';
import { TaxCalculationResult } from '@/types/tax';
import { calculateTaxRegime } from '@/lib/calculations/tax-calculations';
import { useCalculatorStore } from '@/store/calculator-store';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
  dragDataPlugin
);

// Константы для цветов режимов
const CHART_COLORS: Record<string, string> = {
  empleado: '#00ffff',           // Циан
  autonomo_regular: '#ff00ff',   // Мажента  
  autonomo_tarifa_plana: '#ffff00', // Желтый
  sl_micro: '#00ff00',           // Зеленый
  sl_regular: '#ff8000',         // Оранжевый
  startup_certificada: '#8000ff', // Фиолетовый
  beckham: '#ff0080'             // Розовый
};

const REGIME_NAMES: Record<string, string> = {
  empleado: 'Empleado',
  autonomo_regular: 'Autónomo Regular',
  autonomo_tarifa_plana: 'Autónomo Tarifa Plana',
  sl_micro: 'SL Micro',
  sl_regular: 'SL Regular',
  startup_certificada: 'Startup Certificada',
  beckham: 'Régimen Beckham'
};

// Мобильные сокращенные названия
const REGIME_NAMES_MOBILE: Record<string, string> = {
  empleado: 'Empleado',
  autonomo_regular: 'Autónomo Reg.',
  autonomo_tarifa_plana: 'Autónomo TP',
  sl_micro: 'SL Micro',
  sl_regular: 'SL Regular',
  startup_certificada: 'Startup',
  beckham: 'Beckham'
};

interface ExtendedChartData {
  datasets: ChartDataset<'line'>[];
  _revenueRange: number[];
  _currentIncomeIndex: number;
}

interface MainChartProps {
  results: TaxCalculationResult[];
}

export function MainChart({}: MainChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [chartKey, setChartKey] = useState(0); // Для принудительной перерисовки
  const [isClient, setIsClient] = useState(false); // Проверка что мы на клиенте
  const [isDragging, setIsDragging] = useState(false); // Отслеживание drag состояния
  
  const { 
    selectedRegimes, 
    community, 
    maritalStatus, 
    children, 
    monthlyExpenses,
    annualRevenue,
    setAnnualRevenue
  } = useCalculatorStore();

  // Throttling для drag событий (усиленный для предотвращения browser throttling)
  const lastDragTime = useRef(0);
  const dragThrottleMs = 100; // Ограничиваем до 10 FPS для избежания browser flood protection
  
  // Батчинг обновлений для предотвращения flooding
  const pendingUpdate = useRef<number | null>(null);
  const lastRevenueUpdate = useRef<number>(annualRevenue);

  // Хелпер для мобильного логирования
  const mobileLog = (message: string, type = 'log') => {
    if (typeof window !== 'undefined' && 'addMobileLog' in window) {
      const logger = (window as typeof window & { addMobileLog: (msg: string, type?: string) => void }).addMobileLog;
      logger(message, type);
    }
  };

  // Проверка клиентской стороны и детект мобильного устройства
  useEffect(() => {
    setIsClient(true); // Мы на клиенте!
    
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
        // Перерисовываем график только если не идёт drag
        if (!isDragging) {
          setChartKey(prev => prev + 1);
        }
      }
    };
    
    checkIsMobile();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, [isDragging]);

  // Cleanup pending updates при размонтировании
  useEffect(() => {
    return () => {
      if (pendingUpdate.current) {
        cancelAnimationFrame(pendingUpdate.current);
      }
    };
  }, []);

  // Логирование для детальной диагностики
  useEffect(() => {
    mobileLog(`📊 Chart component mounted. Client: ${isClient}, Mobile: ${isMobile}`);
    mobileLog(`🎯 Selected regimes: ${selectedRegimes.join(', ')}`);
    mobileLog(`💰 Annual revenue: €${annualRevenue}`);
  }, [isClient, isMobile, selectedRegimes, annualRevenue]);

  const generateChartData = (): ExtendedChartData => {
    try {
      // Генерация диапазона доходов от 30k до 300k с шагом 5k
      const revenueRange = Array.from({ length: 55 }, (_, i) => 30000 + (i * 5000)); // 30k, 35k, 40k... 300k

      const datasets = [];

      // 1. Добавляем линию валовой выручки (для сравнения) - только на десктопе
      if (!isMobile) {
        datasets.push({
          label: 'Валовой доход',
          data: revenueRange.map((revenue, index) => ({x: index, y: revenue / 12})), // Месячный валовой доход
          borderColor: '#666666',
          backgroundColor: '#66666620',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          pointBackgroundColor: '#666666',
          pointBorderColor: '#0a0a0f',
          pointBorderWidth: 1,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#666666',
          pointHoverBorderWidth: 2,
          fill: false,
          borderDash: [5, 5], // Пунктирная линия
          // Отключаем tooltip для валового дохода
          tooltip: {
            enabled: false
          }
        });
      }

      // 2. Добавляем перетаскиваемую точку на текущем доходе
      const currentIncomeIndex = revenueRange.findIndex(revenue => revenue >= annualRevenue);
      const actualIndex = Math.max(0, Math.min(currentIncomeIndex, revenueRange.length - 1));

      datasets.push({
        label: 'Текущий доход',
        data: [{x: actualIndex, y: 0}], // Одна точка на текущем индексе
        backgroundColor: '#ffff00',
        borderColor: '#ffff00',
        borderWidth: isMobile ? 4 : 3,
        pointRadius: isMobile ? 20 : 15, // Больше на мобильном для touch
        pointHoverRadius: isMobile ? 22 : 15,
        pointHitRadius: isMobile ? 50 : 40, // Большая область для касания
        pointBackgroundColor: '#ffff00',
        pointBorderColor: '#000000',
        pointBorderWidth: isMobile ? 4 : 3,
        pointHoverBackgroundColor: '#ffff00',
        pointHoverBorderColor: '#000000',
        pointHoverBorderWidth: isMobile ? 4 : 3,
        showLine: false,
        dragData: true,
        // Отключаем tooltip для этого dataset
        tooltip: {
          enabled: false
        }
      });

      // 3. Добавляем линии для выбранных налоговых режимов
      selectedRegimes.forEach(regime => {
        const data = revenueRange.map((revenue, index) => {
          try {
            const params = {
              regime: [regime],
              community,
              maritalStatus,
              children,
              annualRevenue: revenue,
              monthlyExpenses,
              companyAge: 1,
              beckhamYear: 1,
              plannedDividends: 0,
              stockOptions: 0
            };

            const result = calculateTaxRegime(regime, params);
            const netMonthly = Math.max(0, result.netMonthly);
            return {x: index, y: netMonthly};
          } catch (error) {
            console.error(`Error calculating ${regime} for revenue ${revenue}:`, error);
            return {x: index, y: 0};
          }
        });

        datasets.push({
          label: isMobile ? (REGIME_NAMES_MOBILE[regime] || regime) : (REGIME_NAMES[regime] || regime),
          data,
          borderColor: CHART_COLORS[regime] || '#00ffff',
          backgroundColor: (CHART_COLORS[regime] || '#00ffff') + '20',
          borderWidth: isMobile ? 4 : 3, // Толще на мобильном
          tension: 0.4,
          pointRadius: isMobile ? 6 : 4, // Больше точки на мобильном
          pointHoverRadius: isMobile ? 8 : 6,
          pointBackgroundColor: CHART_COLORS[regime] || '#00ffff',
          pointBorderColor: '#0a0a0f',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: CHART_COLORS[regime] || '#00ffff',
          pointHoverBorderWidth: 3,
          fill: false
        });
      });

      const chartData = {
        datasets,
        // Сохраняем данные для вертикальной линии
        _revenueRange: revenueRange,
        _currentIncomeIndex: actualIndex
      };

      return chartData;
    } catch (error) {
      console.error('Error generating chart data:', error);
      return {
        datasets: [],
        _revenueRange: [],
        _currentIncomeIndex: -1
      };
    }
  };

  // Генерируем данные графика для получения индекса текущего дохода
  const chartData = generateChartData();
  const currentIncomeIndex = chartData._currentIncomeIndex;

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'point',
      intersect: true,
    },
    plugins: {
      dragData: {
        round: 0,
        showTooltip: false, // Отключаем tooltip при drag
        dragX: true,
        dragY: false,
        onDragStart: (event: MouseEvent | TouchEvent, datasetIndex: number) => {
          try {
            // Проверяем что мы на клиенте
            if (typeof window === 'undefined' || !isClient) return false;
            
            // Сбрасываем throttling и устанавливаем drag состояние
            lastDragTime.current = 0;
            setIsDragging(true);
            
            mobileLog(`🎮 Drag started on dataset ${datasetIndex}`);
            
            // Разрешаем drag только для нашей точки (datasetIndex = 1 на мобильном, 1 на десктопе)
            return datasetIndex === (isMobile ? 0 : 1);
          } catch (error) {
            console.error('DragStart error:', error);
            setIsDragging(false);
            
            mobileLog(`❌ DragStart error: ${error instanceof Error ? error.message : String(error)}`, 'error');
            return false;
          }
        },
        onDrag: (event: MouseEvent | TouchEvent, datasetIndex: number, index: number, value: number | {x: number, y: number} | null) => {
          try {
            // Проверяем что мы на клиенте
            if (typeof window === 'undefined' || !isClient) return;
            
            // Батчинг обновлений для предотвращения browser flooding
            if (datasetIndex === (isMobile ? 0 : 1)) {
              // Получаем диапазон доходов
              const revenueRange = Array.from({ length: 55 }, (_, i) => 30000 + (i * 5000));
              
              // Получаем новое значение дохода из позиции точки
              let newIncomeIndex: number;
              if (typeof value === 'object' && value !== null && 'x' in value) {
                newIncomeIndex = Math.round(Math.max(0, Math.min(revenueRange.length - 1, value.x)));
              } else {
                newIncomeIndex = Math.round(Math.max(0, Math.min(revenueRange.length - 1, index)));
              }
              const newRevenue = revenueRange[newIncomeIndex];
              const safeRevenue = Math.min(Math.max(newRevenue, 30000), 300000);
              
              // Сохраняем последнее значение для батчинга
              lastRevenueUpdate.current = safeRevenue;
              
              // Throttled обновление с батчингом
              const now = Date.now();
              if (now - lastDragTime.current >= dragThrottleMs) {
                lastDragTime.current = now;
                
                // Отменяем предыдущий pending update
                if (pendingUpdate.current) {
                  cancelAnimationFrame(pendingUpdate.current);
                }
                
                // Планируем обновление на следующий frame
                pendingUpdate.current = requestAnimationFrame(() => {
                  setAnnualRevenue(lastRevenueUpdate.current);
                  pendingUpdate.current = null;
                });
              }
            }
          } catch (error) {
            console.error('Drag error:', error);
            setIsDragging(false);
            
            mobileLog(`❌ Drag error: ${error instanceof Error ? error.message : String(error)}`, 'error');
          }
        },
        onDragEnd: (event: MouseEvent | TouchEvent, datasetIndex: number, index: number, value: number | {x: number, y: number} | null) => {
          try {
            // Проверяем что мы на клиенте
            if (typeof window === 'undefined' || !isClient) return;
            
            // Сбрасываем drag состояние
            setIsDragging(false);
            
            // Отменяем все pending updates
            if (pendingUpdate.current) {
              cancelAnimationFrame(pendingUpdate.current);
              pendingUpdate.current = null;
            }
            
            // Финальное обновление позиции точки
            if (datasetIndex === (isMobile ? 0 : 1)) {
              // Получаем диапазон доходов
              const revenueRange = Array.from({ length: 55 }, (_, i) => 30000 + (i * 5000));
              
              // Получаем новое значение дохода из позиции точки
              let newIncomeIndex: number;
              if (typeof value === 'object' && value !== null && 'x' in value) {
                newIncomeIndex = Math.round(Math.max(0, Math.min(revenueRange.length - 1, value.x)));
              } else {
                newIncomeIndex = Math.round(Math.max(0, Math.min(revenueRange.length - 1, index)));
              }
              const newRevenue = revenueRange[newIncomeIndex];
              
              // Финальное безопасное обновление дохода (синхронно)
              const safeRevenue = Math.min(Math.max(newRevenue, 30000), 300000);
              
              // Используем setTimeout для разделения обновления от drag события
              setTimeout(() => {
                setAnnualRevenue(safeRevenue);
                console.log('Drag ended, final revenue:', safeRevenue);
                
                mobileLog(`🏁 Drag ended. Final revenue: €${safeRevenue}`);
              }, 0);
            }
          } catch (error) {
            console.error('DragEnd error:', error);
            setIsDragging(false);
            
            mobileLog(`❌ DragEnd error: ${error instanceof Error ? error.message : String(error)}`, 'error');
          }
        }
      },
      title: {
        display: false // Убираем заголовок для экономии места
      },
      legend: {
        position: isMobile ? 'bottom' : 'top', // Легенда снизу на мобильном
        labels: {
          color: '#ffffff',
          font: {
            family: 'monospace',
            size: isMobile ? 10 : 12 // Меньший шрифт на мобильном
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: isMobile ? 10 : 20, // Меньший отступ на мобильном
          boxWidth: isMobile ? 15 : 20, // Меньше иконки на мобильном
          boxHeight: isMobile ? 15 : 20,
          filter: (legendItem) => {
            // Скрываем служебные элементы из легенды
            return legendItem.text !== 'Текущий доход' && legendItem.text !== 'Валовой доход';
          }
        },
        // Мобильная легенда в несколько строк
        ...(isMobile && {
          maxHeight: 80,
          fullSize: false
        })
      },
      tooltip: {
        enabled: false // Полностью отключаем все tooltips
      },
      // Добавляем вертикальную линию для текущего дохода ТОЛЬКО если индекс найден
      ...(currentIncomeIndex >= 0 && {
        annotation: {
          annotations: {
            currentIncome: {
              type: 'line',
              xMin: currentIncomeIndex,
              xMax: currentIncomeIndex,
              borderColor: '#ffff00',
              borderWidth: isMobile ? 3 : 2, // Толще на мобильном
              borderDash: [10, 5],
              label: {
                display: false // Убираем надпись, оставляем только линию
              }
            }
          }
        }
      })
    },
    scales: {
      x: {
        type: 'linear', // Изменяем на linear для поддержки dragX
        display: true,
        min: 0,
        max: 54, // 55 точек (0-54)
        title: {
          display: !isMobile, // Скрываем заголовок на мобильном для экономии места
          text: 'Валовая выручка в год',
          color: '#00ffff',
          font: {
            family: 'monospace',
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
          drawOnChartArea: true
        },
        ticks: {
          color: '#a0a0a0',
          font: {
            family: 'monospace',
            size: isMobile ? 9 : 11 // Меньший шрифт на мобильном
          },
          stepSize: isMobile ? 4 : 2, // Реже тики на мобильном
          maxTicksLimit: isMobile ? 8 : 12, // Ограничиваем количество тиков
          callback: function(value) {
            // Преобразуем индекс в label дохода
            const revenue = 30000 + (Number(value) * 5000);
            return isMobile ? `${revenue / 1000}k` : `${revenue / 1000}k€`;
          }
        }
      },
      y: {
        display: true,
        title: {
          display: !isMobile, // Скрываем заголовок на мобильном
          text: 'Доход на руки (месяц)',
          color: '#00ffff',
          font: {
            family: 'monospace',
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 255, 255, 0.1)',
          drawOnChartArea: true
        },
        ticks: {
          color: '#a0a0a0',
          font: {
            family: 'monospace',
            size: isMobile ? 9 : 11 // Меньший шрифт на мобильном
          },
          maxTicksLimit: isMobile ? 6 : 8, // Меньше тиков на мобильном
          callback: function(value) {
            const num = Math.round(Number(value));
            return isMobile ? `€${num > 1000 ? (num/1000).toFixed(1) + 'k' : num}` : '€' + num.toLocaleString();
          }
        },
        beginAtZero: true
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
        borderCapStyle: 'round'
      }
    }
  };

  // Не рендерим Chart.js на сервере
  if (!isClient) {
    return (
      <div className="cyber-chart flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-cyber cyber-text-glow mb-2`}>
            Загрузка графика...
          </h3>
        </div>
      </div>
    );
  }

  if (selectedRegimes.length === 0) {
    return (
      <div className="cyber-chart flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📊</div>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-cyber cyber-text-glow mb-2`}>
            Выберите режимы для сравнения
          </h3>
          <p className={`text-cyber-text-secondary ${isMobile ? 'text-sm' : ''}`}>
            {isMobile ? 'Откройте меню и отметьте режимы' : 'Отметьте галочками режимы в левой панели'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-chart">
      {/* Мобильная информация о текущем доходе */}
      {isMobile && (
        <div className="mb-4 p-3 bg-cyber-darker/50 rounded border border-cyber-yellow/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cyber-text-muted">Текущий доход:</span>
            <span className="text-cyber-yellow font-cyber">
              €{annualRevenue.toLocaleString()}/год
            </span>
          </div>
          <div className="text-xs text-cyber-text-muted mt-1">
            💡 Перетащите желтую точку для изменения
          </div>
        </div>
      )}
      
      <div className={`${isMobile ? 'h-[300px]' : 'h-[500px]'} w-full`}>
        {isClient && typeof window !== 'undefined' && (
          <Line key={chartKey} data={chartData} options={options} />
        )}
      </div>
      
      {/* Мобильная легенда осей */}
      {isMobile && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-cyber-text-muted">
          <div className="text-center">
            <span className="text-cyber-cyan">↔</span> Валовая выручка в год
          </div>
          <div className="text-center">
            <span className="text-cyber-cyan">↕</span> Доход на руки (месяц)
          </div>
        </div>
      )}
    </div>
  );
} 