'use client';

import { useEffect, useState } from 'react';
import { useCalculatorStore } from '@/store/calculator-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainChart } from '@/components/charts/MainChart';
import { InsightsPanel } from '@/components/ui/InsightsPanel';
import { calculateAllRegimes } from '@/lib/calculations/tax-calculations';

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    loadFromURL, 
    annualRevenue, 
    monthlyExpenses, 
    community, 
    maritalStatus, 
    children,
    selectedRegimes,
    results,
    setResults
  } = useCalculatorStore();

  // Загрузка данных из URL при монтировании
  useEffect(() => {
    loadFromURL();
  }, [loadFromURL]);

  // Пересчет при изменении параметров
  useEffect(() => {
    if (selectedRegimes.length > 0) {
      const params = {
        regime: selectedRegimes,
        community,
        maritalStatus,
        children,
        annualRevenue,
        monthlyExpenses,
        companyAge: 1,
        beckhamYear: 1,
        plannedDividends: 0,
        stockOptions: 0
      };

      const newResults = calculateAllRegimes(params);
      setResults(newResults);
    }
  }, [selectedRegimes, community, maritalStatus, children, annualRevenue, monthlyExpenses, setResults]);

  // Закрытие мобильного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.cyber-sidebar');
      const mobileButton = document.querySelector('.mobile-menu-button');
      
      if (sidebar && mobileButton && 
          !sidebar.contains(event.target as Node) && 
          !mobileButton.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Предотвращаем скролл фона
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="cyber-grid-bg min-h-screen">
      {/* Мобильный хедер с кнопкой меню */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 cyber-mobile-header">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-button cyber-button-mobile p-2"
            aria-label="Открыть меню"
          >
            <div className={`cyber-hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          
          <h1 className="text-lg font-cyber cyber-text-glow truncate">
            EsTax Calculator
          </h1>
          
          <div className="w-10"> {/* Spacer для центрирования заголовка */}</div>
        </div>
      </div>

      {/* Мобильный оверлей */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cyber-mobile-overlay" />
      )}

      {/* Sidebar с мобильной поддержкой */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Основной контент */}
      <main className="cyber-main cyber-scrollbar">
        {/* Десктопный заголовок */}
        <header className="pt-8 mb-8 cyber-appear hidden lg:block">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-cyber cyber-text-glow">
            EsTax Calculator 2025
          </h1>
          <p className="text-cyber-text-secondary mt-2 text-sm lg:text-base">
            Сравнение налоговых режимов для IT-специалистов в Испании
          </p>
        </header>

        {/* Мобильный отступ для фиксированного хедера */}
        <div className="lg:hidden h-16"></div>

        {/* Мобильное приветствие */}
        <section className="lg:hidden mb-6 cyber-appear">
          <div className="cyber-card-mobile p-4">
            <h2 className="text-xl font-cyber cyber-text-glow mb-2">
              Добро пожаловать! 👋
            </h2>
            <p className="text-sm text-cyber-text-secondary">
              Настройте параметры в меню и сравните налоговые режимы Испании
            </p>
          </div>
        </section>

        {/* Quick Stats для мобильной версии */}
        {results.length > 0 && (
          <section className="lg:hidden mb-6 cyber-appear">
            <div className="cyber-card-mobile p-4">
              <h3 className="text-sm font-cyber text-cyber-cyan mb-3 flex items-center">
                📊 Быстрая статистика
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-cyber-darker/50 rounded border border-cyber-cyan/20">
                  <div className="text-xs text-cyber-text-muted">Лучший режим</div>
                  <div className="text-sm font-cyber text-cyber-green">
                    {results.sort((a, b) => b.netAnnual - a.netAnnual)[0]?.regime || '-'}
                  </div>
                </div>
                <div className="text-center p-3 bg-cyber-darker/50 rounded border border-cyber-cyan/20">
                  <div className="text-xs text-cyber-text-muted">Экономия/год</div>
                  <div className="text-sm font-cyber text-cyber-green">
                    €{results.length > 1 ? 
                      Math.round(results.sort((a, b) => b.netAnnual - a.netAnnual)[0].netAnnual - 
                                results.sort((a, b) => b.netAnnual - a.netAnnual)[1].netAnnual).toLocaleString() 
                      : '0'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* График */}
        <section className="mb-8 cyber-appear">
          <MainChart results={results} />
        </section>

        {/* Insights панель */}
        <section className="cyber-appear">
          <InsightsPanel results={results} />
        </section>

        {/* Футер */}
        <footer className="mt-16 pt-8 border-t border-cyber-cyan/20 text-center">
          <div className="space-y-3">
            {/* Автор */}
            <div className="cyber-appear">
              <p className="text-cyber-text-secondary text-sm font-cyber">
                Made with <span className="text-cyber-magenta animate-pulse">❤️</span> by{' '}
                <a 
                  href="https://t.me/Gonzalles2009" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyber-cyan hover:text-cyber-magenta transition-all duration-300 hover:underline font-semibold"
                >
                  Aleksandr Kudriavtsev
                </a>
              </p>
            </div>

            {/* Основная информация */}
            <div className="cyber-appear">
              <p className="text-cyber-text-muted text-sm">
                © 2025 EsTax Calculator | Данные актуальны на 2025 год
              </p>
              <p className="text-cyber-text-muted text-xs mt-2">
                ⚠️ Для точных расчетов обращайтесь к налоговому консультанту
              </p>
            </div>

            {/* Контактная информация */}
            <div className="cyber-appear">
              <div className="flex justify-center items-center space-x-6 mt-4">
                {/* Telegram */}
                <a 
                  href="https://t.me/Gonzalles2009" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-2 text-cyber-cyan hover:text-cyber-magenta transition-all duration-300"
                  title="Связаться в Telegram"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">📱</span>
                  <span className="text-xs font-medium group-hover:underline hidden lg:inline">
                    @Gonzalles2009
                  </span>
                </a>

                {/* Разделитель */}
                <span className="text-cyber-cyan/30">•</span>

                {/* GitHub (когда будет репозиторий) */}
                <a 
                  href="https://github.com/Gonzalles2009/estax" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-2 text-cyber-cyan hover:text-cyber-magenta transition-all duration-300"
                  title="Исходный код на GitHub"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">💻</span>
                  <span className="text-xs font-medium group-hover:underline hidden lg:inline">
                    Source Code
                  </span>
                </a>
              </div>
            </div>

            {/* Дополнительная информация для мобильных */}
            <div className="lg:hidden mt-4 cyber-appear">
              <p className="text-cyber-text-muted text-xs">
                vibe producting. присматриваю как работает AI
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
