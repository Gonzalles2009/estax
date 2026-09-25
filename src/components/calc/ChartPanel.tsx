"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCalc, type ChartMode } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIME_IDS } from "@/lib/tax/engine";
import type { RegimeId } from "@/lib/tax/types";
import { kEur } from "@/lib/format";
import { Segmented } from "@/components/ui/controls";
import { NetChart } from "./NetChart";
import { useCurves } from "./useResults";

const MODE_HINT: Record<ChartMode, string> = {
  net: "Сколько остаётся вам в месяц, после налогов, взносов и расходов",
  share: "Какая доля годовой суммы остаётся вам",
  delta: "Насколько больше (или меньше) остаётся по сравнению с наймом, € в месяц",
};

export function ChartPanel() {
  const { selected, mode, toggle, set, highlight } = useCalc(
    useShallow((s) => ({
      selected: s.selected,
      mode: s.chartMode,
      toggle: s.toggle,
      set: s.set,
      highlight: s.highlight,
    })),
  );
  const { points, xMax } = useCurves();

  const leaders = useMemo(() => {
    const out: { from: number; to: number; r: RegimeId }[] = [];
    for (const p of points) {
      let best = selected[0];
      for (const r of selected) if (p.net[r] > p.net[best]) best = r;
      const last = out[out.length - 1];
      if (last && last.r === best) last.to = p.x;
      else out.push({ from: p.x, to: p.x, r: best });
    }
    return out;
  }, [points, selected]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">
            {mode === "delta" ? "Выгода против найма" : "Все режимы на одном графике"}
          </h2>
          <p className="mt-0.5 text-xs text-fg-3">{MODE_HINT[mode]}</p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-80">
          <Segmented<ChartMode>
            label="Что показывать на графике"
            size="sm"
            value={mode}
            onChange={(v) => set({ chartMode: v })}
            options={[
              { value: "delta", label: "против найма" },
              { value: "net", label: "€ в месяц" },
              { value: "share", label: "% от суммы" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Какие режимы сравнивать">
        {REGIME_IDS.map((id) => {
          const on = selected.includes(id);
          const meta = REGIME_META[id];
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.94 }}
              aria-pressed={on}
              onClick={() => toggle(id)}
              onMouseEnter={() => on && set({ highlight: id })}
              onMouseLeave={() => set({ highlight: null })}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                on ? "border-line-strong bg-white/[0.05] text-fg" : "border-line text-fg-3 hover:text-fg-2"
              } ${highlight === id ? "bg-white/[0.1]" : ""}`}
            >
              <span
                className="relative size-2.5 rounded-full transition-all"
                style={{
                  background: on ? meta.color : "transparent",
                  boxShadow: on ? `0 0 12px ${meta.color}` : `inset 0 0 0 1.5px ${meta.color}`,
                }}
              />
              {meta.short}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 -mx-1">
        {points.length > 0 && <NetChart points={points} xMax={xMax} />}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-3">
        <span>Кто выгоднее:</span>
        {leaders.map((l, i) => (
          <span key={`${l.r}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>→</span>}
            <span className="size-2 rounded-full" style={{ background: REGIME_META[l.r].color }} />
            <span className="text-fg-2">{REGIME_META[l.r].short}</span>
            <span className="tnum">
              {leaders.length === 1 ? "на всём диапазоне" : i === 0 ? `до ${kEur(l.to)}` : `с ${kEur(l.from)}`}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
