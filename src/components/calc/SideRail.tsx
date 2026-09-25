"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIONS } from "@/lib/tax/regions-2026";
import type { RegimeResult } from "@/lib/tax/types";
import { kEur, n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { VSlider } from "@/components/ui/VSlider";
import { DockSettings, useHeroControlsOut } from "./ControlDock";
import { BudgetInput, budgetToPos, FAMILY_SHORT, posToBudget } from "./Hero";
import { useCurrentRegime } from "./useCurrent";
import { Mark } from "@/components/ui/Mark";

const ease = [0.22, 1, 0.36, 1] as const;
const PRESETS = [30000, 45000, 60000, 80000, 100000, 150000];

/**
 * Десктоп: узкая вертикальная панель справа — итог, вертикальный ползунок суммы
 * и кнопка всех параметров. Появляется, когда ползунок в начале страницы уходит из виду.
 */
export function SideRail({ results }: { results: RegimeResult[] }) {
  const s = useCalc(
    useShallow((st) => ({ budget: st.budget, region: st.region, family: st.family, children: st.children, set: st.set })),
  );
  const { current } = useCurrentRegime(results);
  const show = useHeroControlsOut();
  const [open, setOpen] = useState(false);
  const expanded = show && open;
  const meta = REGIME_META[current.regime];
  const budgetText = `${n0(s.budget)} € в год`;
  const summary = `${REGIONS[s.region].name} · ${FAMILY_SHORT[s.family]} · ${s.children ? `детей: ${s.children}` : "без детей"}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="rail"
          role="region"
          aria-label="Параметры расчёта"
          initial={{ x: 130, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 130, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          onKeyDown={(e) => {
            // Esc в открытом списке региона сначала закрывает список
            if (e.key === "Escape" && open && !e.defaultPrevented) setOpen(false);
          }}
          className="pointer-events-none fixed inset-y-0 right-4 z-40 hidden items-center gap-3 lg:flex"
        >
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="panel"
                initial={{ opacity: 0, x: 28, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 28, scale: 0.97, transition: { duration: 0.18 } }}
                transition={{ duration: 0.35, ease }}
                style={{ transformOrigin: "right center" }}
                className="card pointer-events-auto max-h-[calc(100dvh-40px)] w-[400px] overflow-y-auto overscroll-contain p-5 backdrop-blur-xl"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="eyebrow">Сумма в год</div>
                    <BudgetInput className="serif mt-1 text-[28px] font-medium leading-tight" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Закрыть параметры"
                    className="grid size-9 shrink-0 place-items-center rounded-md text-ink-3 transition hover:bg-ink/5 hover:text-ink"
                  >
                    <svg viewBox="0 0 20 20" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
                  </button>
                </div>
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => s.set({ budget: p })}
                      className={`tnum rounded-md border px-2.5 py-1 text-xs transition ${
                        s.budget === p ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {kEur(p)}
                    </button>
                  ))}
                </div>
                <DockSettings results={results} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card pointer-events-auto flex w-[88px] flex-col items-center px-2 py-4 backdrop-blur-xl">
            <a href="#flow" className="flex w-full flex-col items-center text-center" title={`${meta.name} — куда уходят деньги`}>
              <span className="flex max-w-full items-center gap-1 text-[10px] text-ink-3">
                <Mark color={meta.color} className="!h-2.5" />
                <span className="truncate">{meta.short}</span>
              </span>
              <span className="serif mt-1 text-[20px] font-medium leading-none text-ink">
                <AnimatedNumber className="tnum" value={current.netMonthly} format={n0} />
              </span>
              <span className="mt-1 text-[10px] text-ink-3">€ в месяц</span>
            </a>

            <div className="my-3 h-px w-10 bg-line" />

            <VSlider
              className="h-[min(280px,36vh)] w-10"
              label="Годовая сумма"
              value={Math.round(budgetToPos(s.budget))}
              onChange={(p) => s.set({ budget: posToBudget(p) })}
              valueText={budgetText}
              bubble={budgetText}
            />

            <div className="mt-3 text-center">
              <span className="tnum block text-[13px] font-semibold text-ink">{kEur(s.budget)} €</span>
              <span className="block text-[10px] text-ink-3">в год</span>
            </div>

            <div className="my-3 h-px w-10 bg-line" />

            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen((o) => !o)}
              title={`Все параметры: ${summary}`}
              className={`relative grid size-11 place-items-center rounded-lg border transition-colors ${
                expanded ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink/40 hover:text-ink"
              }`}
            >
              <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h9M16 6h1M3 14h3M10 14h7" />
                <circle cx="14" cy="6" r="2" />
                <circle cx="8" cy="14" r="2" />
              </svg>
              <span className="sr-only">Все параметры</span>
            </button>
            <span className="mt-1.5 text-[10px] text-ink-3">параметры</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
