import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EsTax Calculator 2025 - Налоговый калькулятор для IT в Испании",
  description: "Калькулятор налогов для фрилансеров и IT-специалистов в Испании. Сравнение 7 налоговых режимов с киберпанк дизайном.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Детальная диагностика всех ошибок */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Создаем детальный лог прямо на странице для iPhone
              function createMobileLogger() {
                const logDiv = document.createElement('div');
                logDiv.id = 'mobile-debug-log';
                logDiv.style.cssText = \`
                  position: fixed;
                  top: 10px;
                  left: 10px;
                  right: 10px;
                  max-height: 200px;
                  overflow-y: auto;
                  background: rgba(0,0,0,0.9);
                  color: #00ff00;
                  font-family: monospace;
                  font-size: 10px;
                  padding: 10px;
                  border: 1px solid #00ff00;
                  z-index: 10000;
                  border-radius: 5px;
                  display: none;
                \`;
                document.body.appendChild(logDiv);
                return logDiv;
              }
              
              let mobileLog = null;
              let logEntries = [];
              
              function addMobileLog(message, type = 'log') {
                if (!mobileLog) mobileLog = createMobileLogger();
                
                const timestamp = new Date().toISOString().substr(11, 12);
                const color = type === 'error' ? '#ff0000' : type === 'warn' ? '#ffff00' : '#00ff00';
                
                logEntries.unshift(\`[\${timestamp}] \${type.toUpperCase()}: \${message}\`);
                if (logEntries.length > 20) logEntries = logEntries.slice(0, 20);
                
                mobileLog.innerHTML = logEntries.map(entry => 
                  \`<div style="color: \${color}; margin-bottom: 2px;">\${entry}</div>\`
                ).join('');
                
                mobileLog.style.display = 'block';
                
                // Скрываем через 10 сек если не error
                if (type !== 'error') {
                  setTimeout(() => {
                    if (mobileLog) mobileLog.style.display = 'none';
                  }, 10000);
                }
              }
              
              // Показываем лог при касании по углу экрана
              document.addEventListener('touchstart', function(e) {
                if (e.touches[0].clientX < 50 && e.touches[0].clientY < 50) {
                  if (mobileLog) {
                    mobileLog.style.display = mobileLog.style.display === 'none' ? 'block' : 'none';
                  }
                }
              });
              
              addMobileLog('🚀 Debug system initialized');
              addMobileLog('📱 Device: ' + navigator.userAgent.substring(0, 50) + '...');
              addMobileLog('🌐 URL: ' + window.location.href);
              
              // Глобальная обработка script errors с мобильным логом
              window.addEventListener('error', function(e) {
                const errorMsg = \`❌ \${e.message} at \${e.filename}:\${e.lineno}:\${e.colno}\`;
                addMobileLog(errorMsg, 'error');
                
                console.error('🚨 Global script error:', {
                  message: e.message,
                  filename: e.filename,
                  lineno: e.lineno,
                  colno: e.colno,
                  error: e.error,
                  stack: e.error ? e.error.stack : 'No stack',
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString()
                });
              });
              
              // Обработка unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                const rejectMsg = \`🚫 Promise rejected: \${e.reason}\`;
                addMobileLog(rejectMsg, 'error');
                
                console.error('🚨 Global unhandled rejection:', {
                  reason: e.reason,
                  promise: e.promise,
                  timestamp: new Date().toISOString()
                });
              });
              
              // Логируем когда Chart.js загружается
              const originalConsoleError = console.error;
              console.error = function(...args) {
                if (args[0] && args[0].includes && (args[0].includes('Chart') || args[0].includes('drag') || args[0].includes('ownerDocument'))) {
                  addMobileLog('📊 Chart.js error: ' + args[0], 'error');
                }
                originalConsoleError.apply(console, args);
              };
              
              addMobileLog('🛡️ Error handlers installed');
            `
          }}
        />
        
        {/* Упрощенная мобильная консоль с fallback */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Пытаемся загрузить Eruda только на мобильных
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                addMobileLog('📱 Loading Eruda console...');
                
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
                script.crossOrigin = 'anonymous';
                
                script.onload = function() { 
                  try {
                    eruda.init({
                      useShadowDom: false,
                      autoScale: true,
                      defaults: {
                        transparency: 0.8,
                        displaySize: 40,
                        theme: 'Dark'
                      }
                    });
                    addMobileLog('✅ Eruda console loaded');
                    
                    // Автоматически открываем консоль если есть ошибки
                    window.addEventListener('error', () => {
                      if (typeof eruda !== 'undefined') {
                        eruda.show('console');
                      }
                    });
                  } catch (erudiErr) {
                    addMobileLog('❌ Eruda init failed: ' + erudiErr.message, 'error');
                  }
                };
                
                script.onerror = function() {
                  addMobileLog('❌ Failed to load Eruda CDN', 'error');
                };
                
                document.head.appendChild(script);
              } else {
                addMobileLog('💻 Desktop detected, skipping Eruda');
              }
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
