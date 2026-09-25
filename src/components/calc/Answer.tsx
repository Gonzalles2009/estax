"use client";

import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import type { RegimeResult } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { REGIONS } from "@/lib/tax/regions-2026";

const fmt = (v: number) => n0(v);

/** Главный ответ: кто выигрывает и насколько */
export function Answer({ results }: { results: RegimeResult[] }) {
  const { selected, budget, region } = useCalc(
    useShallow((s) => ({ selected: s.selected, budget: s.budget, region: s.region })),
  );
  const shown = results.filter((r) => selected.includes(r.regime)).sort((a, b) => b.netAnnual - a.netAnnual);
  const best = shown[0];
  const employee = results.find((r) => r.regime === "employee")!;
  const worst = shown[shown.length - 1];
  const vsEmployee = (best.netAnnual - employee.netAnnual) / 12;
  const spread = (best.netAnnual - worst.netAnnual) / 12;
  const meta = REGIME_META[best.regime];

  return (
    <div className="relative">
      <div className="eyebrow mb-3">
        При {n0(budget)} € в год · {REGIONS[region].name}
      </div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div className="text-6xl font-semibold leading-none tracking-tighter text-fg sm:text-7xl">
          <AnimatedNumber className="tnum" value={best.netMonthly} format={fmt} />
          <span className="ml-2 text-3xl font-medium tracking-normal text-fg-3 sm:text-4xl">€/мес</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-fg-2">
        <span>останется вам в режиме</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={best.regime}
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-fg"
            style={{
              borderColor: `color-mix(in oklab, ${meta.color} 55%, transparent)`,
              background: `color-mix(in oklab, ${meta.color} 16%, transparent)`,
            }}
          >
            <span className="size-2 rounded-full" style={{ background: meta.color }} />
            {meta.name}
          </motion.span>
        </AnimatePresence>
      </div>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white/[0.02] px-4">
        <div className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[13px] text-fg-3">
            {best.regime === "employee" ? "Найм — самый выгодный вариант" : "Больше, чем в найме"}
          </dt>
          <dd className="tnum whitespace-nowrap text-[15px] font-semibold text-fg">
            {best.regime === "employee" ? "—" : <>+<AnimatedNumber value={vsEmployee} format={fmt} /> €/мес</>}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[13px] text-fg-3">Разница лучшего и худшего</dt>
          <dd className="tnum whitespace-nowrap text-[15px] font-semibold text-fg">
            <AnimatedNumber value={spread} format={fmt} /> €/мес
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[13px] text-fg-3">Уходит государству</dt>
          <dd className="tnum whitespace-nowrap text-[15px] font-semibold text-fg">
            <AnimatedNumber value={best.effectiveRate * 100} format={(v) => `${v.toFixed(1).replace(".", ",")}%`} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
