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
        {/* Глобальная обработка ошибок для отладки */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Простая обработка ошибок без навязчивого UI
              window.addEventListener('error', function(e) {
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
                console.error('🚨 Global unhandled rejection:', {
                  reason: e.reason,
                  promise: e.promise,
                  timestamp: new Date().toISOString()
                });
              });
            `
          }}
        />
        
        {/* Eruda консоль только для мобильных устройств */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Загружаем Eruda только на мобильных для полноценной отладки
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
                script.crossOrigin = 'anonymous';
                
                script.onload = function() { 
                  try {
                    eruda.init({
                      useShadowDom: false,
                      autoScale: true,
                      defaults: {
                        transparency: 0.9,
                        displaySize: 50,
                        theme: 'Dark'
                      }
                    });
                    console.log('✅ Eruda console loaded successfully');
                    
                    // Автоматически открываем консоль при ошибках
                    window.addEventListener('error', () => {
                      if (typeof eruda !== 'undefined') {
                        eruda.show('console');
                      }
                    });
                  } catch (erudiErr) {
                    console.error('❌ Eruda init failed:', erudiErr);
                  }
                };
                
                script.onerror = function() {
                  console.error('❌ Failed to load Eruda CDN');
                };
                
                document.head.appendChild(script);
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
