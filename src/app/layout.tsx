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
      <body>
        {children}
      </body>
    </html>
  );
}
