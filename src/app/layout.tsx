import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/site/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://estax.vercel.app"),
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
  themeColor: "#07080c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
