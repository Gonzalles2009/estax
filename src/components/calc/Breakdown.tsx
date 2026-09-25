"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIME_IDS } from "@/lib/tax/engine";
import type { RegimeResult } from "@/lib/tax/types";
import { eur, n0, pct } from "@/lib/format";
import { SEGMENT_META, segmentsOf, type SegmentKey } from "./segments";

export function Breakdown({ results }: { results: RegimeResult[] }) {
  const { selected, set } = useCalc(useShallow((s) => ({ selected: s.selected, set: s.set })));
  const [hover, setHover] = useState<{ regime: string; key: SegmentKey } | null>(null);
  const [table, setTable] = useState(false);
  const shown = REGIME_IDS.filter((id) => selected.includes(id)).map((id) => results.find((r) => r.regime === id)!);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Легенда">
          {(Object.keys(SEGMENT_META) as SegmentKey[]).map((k) => (
            <li key={k} className="flex items-center gap-2 text-xs text-fg-2">
              <span className="size-2.5 rounded-[3px]" style={{ background: SEGMENT_META[k].color }} />
              {SEGMENT_META[k].label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setTable((v) => !v)}
          className="rounded-full border border-line px-3 py-1 text-xs text-fg-2 transition hover:border-line-strong hover:text-fg"
        >
          {table ? "Показать полосами" : "Показать таблицей"}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!table ? (
          <motion.ul
            key="bars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {shown.map((r, row) => {
              const segs = segmentsOf(r);
              const total = segs.reduce((a, s) => a + s.value, 0);
              return (
                <motion.li
                  key={r.regime}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: row * 0.05, duration: 0.4 }}
                  onMouseEnter={() => set({ highlight: r.regime })}
                  onMouseLeave={() => set({ highlight: null })}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-fg">
                      <span className="size-2 rounded-full" style={{ background: REGIME_META[r.regime].color }} />
                      {REGIME_META[r.regime].name}
                    </span>
                    <span className="tnum text-xs text-fg-3">
                      вам <span className="font-semibold text-fg">{pct(r.netAnnual / total, 1)}</span> · государству{" "}
                      <span className="font-semibold text-fg">{pct(r.effectiveRate, 1)}</span>
                    </span>
                  </div>
                  <div className="relative flex h-9 gap-[2px]">
                    {segs.map((s) => {
                      const on = hover?.regime === r.regime && hover.key === s.key;
                      return (
                        <motion.div
                          key={s.key}
                          className="relative min-w-0 overflow-hidden first:rounded-l-xl last:rounded-r-xl"
                          style={{ background: s.color }}
                          initial={false}
                          animate={{ flexGrow: s.value, opacity: hover?.regime === r.regime && !on ? 0.55 : 1 }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          onMouseEnter={() => setHover({ regime: r.regime, key: s.key })}
                          onMouseLeave={() => setHover(null)}
                        >
                          {s.value / total > 0.12 && (
                            <span
                              className={`tnum absolute inset-0 flex items-center whitespace-nowrap px-2.5 text-[11px] font-semibold ${
                                s.key === "net" ? "text-ink" : "text-white"
                              }`}
                            >
                              {n0(s.value / 12)} €
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {hover?.regime === r.regime && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-fg-2">
                          {segs
                            .find((s) => s.key === hover.key)!
                            .parts.filter((p) => p.value > 0.5)
                            .map((p) => (
                              <span key={p.label}>
                                {p.label}: <span className="tnum font-semibold text-fg">{eur(p.value)}</span>
                                <span className="text-fg-3"> в год</span>
                              </span>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="-mx-2 overflow-x-auto"
          >
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-3">
                  <th className="px-2 py-2 font-medium">Режим, € в год</th>
                  <th className="px-2 py-2 text-right font-medium">Вам</th>
                  <th className="px-2 py-2 text-right font-medium">IRPF</th>
                  <th className="px-2 py-2 text-right font-medium">Дивиденды</th>
                  <th className="px-2 py-2 text-right font-medium">Sociedades</th>
                  <th className="px-2 py-2 text-right font-medium">SS ваши</th>
                  <th className="px-2 py-2 text-right font-medium">SS работодателя</th>
                  <th className="px-2 py-2 text-right font-medium">Расходы</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {shown.map((r) => (
                  <tr key={r.regime} className="border-t border-line">
                    <td className="px-2 py-2 text-fg">{REGIME_META[r.regime].name}</td>
                    <td className="px-2 py-2 text-right font-semibold text-fg">{n0(r.breakdown.net)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.irpf)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.dividendTax)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.corporateTax)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.ssWorker)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.ssEmployer)}</td>
                    <td className="px-2 py-2 text-right text-fg-2">{n0(r.breakdown.expenses + r.breakdown.gestoria)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
