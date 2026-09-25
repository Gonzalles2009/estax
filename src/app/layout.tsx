import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/site/Providers";
import "./globals.css";

// metadataBase не задаём: на Vercel Next.js сам берёт адрес деплоя (VERCEL_PROJECT_PRODUCTION_URL / VERCEL_BRANCH_URL)
export const metadata: Metadata = {
  title: {
    default: "EsTax·26 — честный калькулятор налогов Испании 2026",
    template: "%s · EsTax·26",
  },
  description:
    "Найм, Ley Beckham, autónomo или своя SL: сколько останется вам в 2026 году. 15 регионов, ставки сверены с BOE, каждая цифра со ссылкой на закон.",
  openGraph: {
    title: "EsTax·26 — сколько останется вам, а не Hacienda",
    description: "Найм, Beckham, autónomo и SL на одном бюджете. Налоги Испании 2026 с исходниками.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4eee3" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

// Тема до первой отрисовки: выбор пользователя из localStorage, иначе — системная
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
