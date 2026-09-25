"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIONS } from "@/lib/tax/regions-2026";
import type { Family, RegimeResult, RegionId } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { InlinePicker } from "@/components/ui/Picker";
import { Stepper } from "@/components/ui/controls";
import { BeckhamCheck } from "./BeckhamCheck";
import { BudgetInput, budgetToPos, FAMILY_SHORT, posToBudget, usePickerOptions } from "./Hero";
import { MoreSettings } from "./MoreSettings";
import { useCurrentRegime } from "./useCurrent";
import { Mark } from "@/components/ui/Mark";

const ease = [0.22, 1, 0.36, 1] as const;

/** Ползунок в начале страницы ушёл из виду — пора показать плавающую панель */
export function useHeroControlsOut() {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const el = document.getElementById("hero-controls");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOut(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return out;
}

/** Все параметры расчёта — в раскрывающейся части панели */
export function DockSettings({ results }: { results: RegimeResult[] }) {
  const s = useCalc(
    useShallow((st) => ({ region: st.region, family: st.family, children: st.children, under3: st.childrenUnder3, set: st.set })),
  );
  const { regionOptions, familyOptions, pickerFooter } = usePickerOptions(results);
  return (
    <div className="space-y-6 @container">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-4">
        <div className="col-span-2 min-w-0 @md:col-span-1">
          <div className="eyebrow mb-2">Регион</div>
          <InlinePicker<RegionId>
            variant="chip"
            label="Регион"
            title="Регион проживания"
            value={s.region}
            onChange={(v) => s.set({ region: v })}
            options={regionOptions}
            footer={pickerFooter}
          />
        </div>
        <div className="col-span-2 min-w-0 @md:col-span-1">
          <div className="eyebrow mb-2">Семья</div>
          <InlinePicker<Family>
            variant="chip"
            label="Семья"
            title="Семья и декларация"
            value={s.family}
            onChange={(v) => s.set({ family: v })}
            options={familyOptions}
            footer={pickerFooter}
          />
        </div>
        <div>
          <div className="eyebrow mb-2">Дети</div>
          <Stepper label="Дети" value={s.children} onChange={(v) => s.set({ children: v })} max={6} />
        </div>
        <div className={s.children > 0 ? "" : "opacity-40"}>
          <div className="eyebrow mb-2">Из них до 3 лет</div>
          <Stepper
            label="Дети до 3 лет"
            value={s.under3}
            onChange={(v) => s.set({ childrenUnder3: v })}
            max={Math.min(3, s.children)}
          />
        </div>
      </div>
      <BeckhamCheck results={results} compact />
      <MoreSettings bare />
    </div>
  );
}

/**
 * Плавающая панель для телефона и планшета: сумма, ползунок и все параметры внизу экрана.
 * На десктопе вместо неё — вертикальная панель справа (SideRail).
 */
export function ControlDock({ results }: { results: RegimeResult[] }) {
  const s = useCalc(
    useShallow((st) => ({ budget: st.budget, region: st.region, family: st.family, children: st.children, set: st.set })),
  );
  const { current } = useCurrentRegime(results);
  const show = useHeroControlsOut();
  const [open, setOpen] = useState(false);
  const expanded = show && open;
  const pos = budgetToPos(s.budget);

  const summary = `${REGIONS[s.region].name} · ${FAMILY_SHORT[s.family]} · ${s.children ? `детей: ${s.children}` : "без детей"}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Параметры расчёта"
          initial={{ y: 160, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 160, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onKeyDown={(e) => {
            // Esc в открытом списке региона сначала закрывает список
            if (e.key === "Escape" && open && !e.defaultPrevented) setOpen(false);
          }}
          className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-[760px] sm:inset-x-4 sm:bottom-4 lg:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="card overflow-hidden backdrop-blur-xl">
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="settings"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="overflow-hidden"
                >
                  <div className="max-h-[min(62dvh,620px)] overflow-y-auto overscroll-contain border-b border-line px-4 py-5 sm:px-6">
                    <DockSettings results={results} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-1.5 px-4 pb-3 pt-3 sm:flex sm:items-center sm:gap-5 sm:px-5">
              <div className="min-w-0 shrink-0">
                <div className="text-[11px] text-ink-3">Сумма в год</div>
                <BudgetInput className="serif text-2xl font-medium leading-tight" />
              </div>

              <a href="#flow" className="min-w-0 text-right sm:order-last sm:shrink-0" title="Куда уходят деньги">
                <span className="flex items-center justify-end gap-1.5 text-[11px] text-ink-3">
                  <Mark color={REGIME_META[current.regime].color} className="!h-3" />
                  <span className="truncate">{REGIME_META[current.regime].short}</span>
                </span>
                <span className="serif block whitespace-nowrap text-2xl font-medium leading-tight text-ink">
                  <AnimatedNumber className="tnum" value={current.netMonthly} format={n0} />
                  <span className="ml-1 font-sans text-xs text-ink-3">€/мес</span>
                </span>
              </a>

              <input
                type="range"
                aria-label="Годовая сумма"
                className="range col-span-2 sm:min-w-0 sm:flex-1"
                min={0}
                max={1000}
                step={1}
                value={pos}
                style={{ ["--fill" as string]: `${pos / 10}%` }}
                onChange={(e) => s.set({ budget: posToBudget(Number(e.target.value)) })}
              />

              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen((o) => !o)}
                className={`col-span-2 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:max-w-[300px] sm:shrink ${
                  expanded ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink/40 hover:text-ink"
                }`}
              >
                <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 6h9M16 6h1M3 14h3M10 14h7" />
                  <circle cx="14" cy="6" r="2" />
                  <circle cx="8" cy="14" r="2" />
                </svg>
                <span className="min-w-0 flex-1 truncate">{summary}</span>
                <motion.svg animate={{ rotate: expanded ? 180 : 0 }} viewBox="0 0 20 20" className="size-3.5 shrink-0" aria-hidden>
                  <path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </motion.svg>
                <span className="sr-only">Все параметры</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
