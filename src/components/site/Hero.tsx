"use client";

import { motion } from "motion/react";
import { P } from "@/lib/tax/params-2026";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const verified = new Date(P.verifiedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return (
    <header className="mx-auto max-w-[1320px] px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1 pl-1 pr-3 text-xs text-fg-2"
      >
        <span className="rounded-full bg-sun px-2 py-0.5 font-semibold text-ink">2026</span>
        Ставки сверены с BOE {verified} · 15 регионов · 6 режимов
      </motion.div>
      <h1 className="max-w-5xl text-[44px] font-semibold leading-[0.95] tracking-[-0.04em] text-fg sm:text-7xl lg:text-[88px]">
        {["Сколько", "останется"].map((w, i) => (
          <motion.span
            key={w}
            className="mr-[0.22em] inline-block"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.08 * i, ease }}
          >
            {w}
          </motion.span>
        ))}
        <motion.span
          className="text-sunset mr-[0.22em] inline-block animate-shine"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.16, ease }}
        >
          вам,
        </motion.span>
        <br className="hidden sm:block" />
        {["а", "не", "Hacienda"].map((w, i) => (
          <motion.span
            key={w}
            className="mr-[0.22em] inline-block text-fg-3"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.24 + 0.08 * i, ease }}
          >
            {w}
          </motion.span>
        ))}
      </h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease }}
        className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-2"
      >
        Найм, Ley Beckham, autónomo или своя SL — на одном и том же бюджете. Каждая ставка сверена с законами 2026 года,
        у каждой цифры в расчёте есть ссылка на норму.
      </motion.p>
    </header>
  );
}
