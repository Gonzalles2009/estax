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
        {/* Минимальная обработка ошибок для production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Базовая обработка ошибок
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
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
