"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIONS } from "@/lib/tax/regions-2026";
import type { RegimeResult } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { MoneyFlow } from "./MoneyFlow";
import { useCurrentRegime } from "./useCurrent";

export { useCurrentRegime } from "./useCurrent";

const ease = [0.22, 1, 0.36, 1] as const;

export function FlowSection({ results }: { results: RegimeResult[] }) {
  const { budget, region, set } = useCalc(useShallow((s) => ({ budget: s.budget, region: s.region, set: s.set })));
  const { shown, best, current, avail } = useCurrentRegime(results);
  const currentAvail = avail(current.regime);
  const employee = results.find((r) => r.regime === "employee")!;
  const meta = REGIME_META[current.regime];
  const vsEmployee = (current.netAnnual - employee.netAnnual) / 12;
  const vsBest = (best.netAnnual - current.netAnnual) / 12;

  return (
    <section id="flow" className="mx-auto max-w-[1240px] scroll-mt-6 px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease }}
        className="card relative overflow-hidden p-5 sm:p-8 lg:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="eyebrow">
              {n0(budget)} € в год · {REGIONS[region].name}
            </div>
            <div className="serif tnum mt-4 flex items-baseline gap-2 text-[64px] font-medium leading-none tracking-[-0.03em] text-ink sm:text-[80px]">
              <AnimatedNumber value={current.netMonthly} format={n0} />
              <span className="text-3xl text-ink-3 sm:text-4xl">€</span>
            </div>
            <div className="mt-2 text-[15px] text-ink-2">в месяц остаётся вам</div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`${current.regime}-${best.regime}-${currentAvail}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-5 text-[15px] leading-relaxed text-ink-2"
              >
                {currentAvail === "no" ? (
                  <>
                    <b className="font-semibold text-ink">{meta.name}</b> вам недоступен по результатам проверки — схема только для
                    сравнения.
                  </>
                ) : currentAvail === "check" && vsBest < -0.5 ? (
                  <>
                    <b className="font-semibold text-ink">{meta.name}</b> даст на {n0(-vsBest)} € в месяц больше, чем «
                    {REGIME_META[best.regime].name}», — если режим вам доступен.
                  </>
                ) : current.regime === best.regime ? (
                  <>
                    Лучший вариант — <b className="font-semibold text-ink">{meta.name}</b>.{" "}
                    {current.regime !== "employee" && vsEmployee > 0.5 && <>Это на {n0(vsEmployee)} € в месяц больше, чем в найме.</>}
                  </>
                ) : (
                  <>
                    <b className="font-semibold text-ink">{meta.name}</b>: на {n0(vsBest)} € в месяц меньше, чем в режиме «
                    {REGIME_META[best.regime].name}».
                  </>
                )}
              </motion.p>
            </AnimatePresence>

            <LayoutGroup>
              <ul className="mt-6 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Режим для схемы">
                {shown.map((r) => {
                  const m = REGIME_META[r.regime];
                  const active = r.regime === current.regime;
                  return (
                    <motion.li key={r.regime} layout transition={{ type: "spring", stiffness: 380, damping: 36 }} className="shrink-0">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => set({ focus: r.regime })}
                        className={`relative flex w-full items-center gap-2.5 rounded-full px-3.5 py-2 text-left text-sm transition-colors lg:rounded-2xl ${
                          active ? "text-bg" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                        }`}
                      >
                        {active && (
                          <motion.span layoutId="flow-active" className="absolute inset-0 rounded-full bg-ink lg:rounded-2xl" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                        )}
                        <span className="relative size-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                        <span className="relative whitespace-nowrap font-medium">{m.short}</span>
                        {r.regime === best.regime && (
                          <span className={`relative rounded-full px-1.5 py-px text-[10px] font-semibold ${active ? "bg-bg/20" : "bg-f-you/20 text-ink"}`}>лучший</span>
                        )}
                        {avail(r.regime) !== "ok" && (
                          <span
                            className={`relative rounded-full border px-1.5 py-px text-[10px] font-medium ${
                              active ? "border-bg/30" : avail(r.regime) === "no" ? "border-f-tax/40 text-f-tax" : "border-line-strong text-ink-3"
                            }`}
                          >
                            {avail(r.regime) === "no" ? "недоступен" : "условно"}
                          </span>
                        )}
                        <span className="tnum relative ml-auto hidden pl-3 lg:inline">{n0(r.netMonthly)} €</span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </div>

          <div className="min-w-0">
            <MoneyFlow result={current} />
            <p className="mt-3 text-xs text-ink-3">
              Каждая точка — деньги в пути. Наведите на ленту, чтобы увидеть сумму в год.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
