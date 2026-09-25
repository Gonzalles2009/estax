"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import type { RegimeResult } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { segmentsOf } from "./segments";
import { SegmentLegend } from "./SegmentLegend";
import { useCurrentRegime } from "./useCurrent";
import type { Availability } from "@/lib/beckham";

function fmtLoss(v: number, isBest: boolean, a: Availability) {
  // Доступность важнее «лучшего»: непроверенный режим лучший, только если других не выбрано
  if (a === "no") return "вам недоступен";
  if (a === "check") return v < -0.5 ? `+${n0(-v)} €, если доступен` : Math.abs(v) < 0.5 ? "если доступен" : `−${n0(v)} € в месяц`;
  if (isBest) return "лучший вариант";
  return Math.abs(v) < 0.5 ? "так же" : `−${n0(v)} € в месяц`;
}

export function Ranking({ results }: { results: RegimeResult[] }) {
  const set = useCalc((s) => s.set);
  const { shown, best, avail } = useCurrentRegime(results);
  let place = 0;

  return (
    <LayoutGroup>
      <ol className="space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((r) => {
            const meta = REGIME_META[r.regime];
            const a = avail(r.regime);
            const isBest = r.regime === best.regime;
            const loss = (best.netAnnual - r.netAnnual) / 12;
            const rank = a === "ok" ? String(++place) : a === "no" ? "—" : "?";
            return (
              <motion.li
                key={r.regime}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ layout: { type: "spring", stiffness: 380, damping: 36 }, duration: 0.25 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    set({ focus: r.regime });
                    document.getElementById("flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onMouseEnter={() => set({ highlight: r.regime })}
                  onMouseLeave={() => set({ highlight: null })}
                  onFocus={() => set({ highlight: r.regime })}
                  onBlur={() => set({ highlight: null })}
                  className={`group relative w-full overflow-hidden rounded-[10px] border px-4 py-3.5 text-left transition ${
                    isBest ? "border-line-strong bg-surface" : "border-line bg-surface/50 hover:border-line-strong hover:bg-surface"
                  } ${a === "check" ? "border-dashed" : ""} ${a === "no" ? "opacity-55 hover:opacity-80" : ""}`}
                >
                  {isBest && (
                    <motion.span
                      layoutId="best-glow"
                      className="pointer-events-none absolute inset-0"
                      style={{ background: `radial-gradient(120% 160% at 0% 0%, color-mix(in oklab, ${meta.color} 16%, transparent), transparent 60%)` }}
                    />
                  )}
                  <div className="relative flex items-center gap-3">
                    <span className="serif tnum w-5 text-lg text-ink-3">{rank}</span>
                    <span className="h-9 w-[3px] shrink-0 rounded-[1px]" style={{ background: meta.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-ink">{meta.name}</span>
                        {a === "check" && (
                          <span className="shrink-0 text-[11px] text-ink-3">условно</span>
                        )}
                        {meta.risk && (
                          <span className="shrink-0 text-[11px] font-medium text-f-tax">
                            {meta.risk}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-ink-3">{meta.tagline}</span>
                    </span>
                    <span className="text-right">
                      <span className="serif block text-xl font-medium tracking-tight text-ink sm:text-2xl">
                        <AnimatedNumber className="tnum" value={r.netMonthly} format={n0} />
                        <span className="ml-1 font-sans text-sm font-normal text-ink-3">€</span>
                      </span>
                      <span className={`tnum block text-xs ${isBest ? "font-medium text-ink-2" : "text-ink-3"}`}>{fmtLoss(loss, isBest, a)}</span>
                    </span>
                  </div>
                  <div className="relative mt-3 flex h-1.5 gap-[2px] overflow-hidden rounded-[2px]">
                    {segmentsOf(r).map((s) => (
                      <motion.span
                        key={s.key}
                        className="h-full"
                        style={{ background: s.color }}
                        initial={false}
                        animate={{ flexGrow: Math.max(0, s.value) }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                  </div>
                  <SegmentLegend r={r} className="relative mt-1.5 text-[11px]" />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </LayoutGroup>
  );
}
