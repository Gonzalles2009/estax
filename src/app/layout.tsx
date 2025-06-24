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
        {/* Мобильная консоль для дебага */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
                script.onload = function() { eruda.init(); };
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
