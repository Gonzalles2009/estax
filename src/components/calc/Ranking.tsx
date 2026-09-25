"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import type { RegimeResult } from "@/lib/tax/types";
import { n0, pct } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { segmentsOf } from "./segments";

const fmtNet = (v: number) => n0(v);
const fmtLoss = (v: number) => (v < 0.5 ? "лучший вариант" : `−${n0(v)} € в месяц`);

export function Ranking({ results }: { results: RegimeResult[] }) {
  const { selected, focus, set } = useCalc(
    useShallow((s) => ({ selected: s.selected, focus: s.focus, set: s.set })),
  );
  const shown = results.filter((r) => selected.includes(r.regime)).sort((a, b) => b.netAnnual - a.netAnnual);
  const best = shown[0];

  return (
    <LayoutGroup>
      <ol className="space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((r, i) => {
            const meta = REGIME_META[r.regime];
            const isBest = i === 0;
            const active = focus === r.regime;
            const loss = (best.netAnnual - r.netAnnual) / 12;
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
                    document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onMouseEnter={() => set({ highlight: r.regime })}
                  onMouseLeave={() => set({ highlight: null })}
                  onFocus={() => set({ highlight: r.regime })}
                  onBlur={() => set({ highlight: null })}
                  className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-colors ${
                    isBest
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.04]"
                  } ${active ? "ring-1 ring-white/25" : ""}`}
                >
                  {isBest && (
                    <motion.span
                      layoutId="best-glow"
                      className="pointer-events-none absolute inset-0 -z-0 opacity-60"
                      style={{
                        background: `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${meta.color} 30%, transparent), transparent 60%)`,
                      }}
                    />
                  )}
                  <div className="relative flex items-center gap-3">
                    <span className="tnum w-4 text-sm text-fg-3">{i + 1}</span>
                    <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-fg">{meta.name}</span>
                        {meta.risk && (
                          <span className="shrink-0 rounded-full border border-seg-tax/40 px-1.5 py-px text-[10px] font-medium text-[#f3a0a0]">
                            {meta.risk}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-fg-3">{meta.tagline}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-lg font-semibold tracking-tight text-fg sm:text-xl">
                        <AnimatedNumber className="tnum" value={r.netMonthly} format={fmtNet} />
                        <span className="ml-1 text-sm font-normal text-fg-3">€</span>
                      </span>
                      <span className={`tnum block text-xs ${isBest ? "text-[#7fd6b4]" : "text-fg-3"}`}>
                        {fmtLoss(loss)}
                      </span>
                    </span>
                  </div>
                  <div className="relative mt-3 flex h-1.5 gap-[2px] overflow-hidden rounded-full">
                    {segmentsOf(r).map((s) => (
                      <motion.span
                        key={s.key}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{ background: s.color }}
                        initial={false}
                        animate={{ flexGrow: Math.max(0, s.value) }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                  </div>
                  <div className="relative mt-1.5 flex justify-between text-[11px] text-fg-3">
                    <span>вам {pct(r.netAnnual / r.budget, 0)}</span>
                    <span>государству {pct(r.effectiveRate, 0)}</span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </LayoutGroup>
  );
}
