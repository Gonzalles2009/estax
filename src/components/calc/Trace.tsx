"use client";

import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIME_IDS } from "@/lib/tax/engine";
import { SOURCES, type KnownSourceId } from "@/lib/tax/sources";
import type { RegimeResult, Step, StepGroup } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { useCurrentRegime } from "./useCurrent";

const GROUPS: { id: StepGroup; title: string; hint: string }[] = [
  { id: "flow", title: "Движение денег", hint: "За год, в евро" },
  { id: "base", title: "Налоговая база IRPF", hint: "С чего считается налог" },
  { id: "tax", title: "Расчёт IRPF", hint: "Шкалы и минимумы" },
];

function Amount({ step }: { step: Step }) {
  if (Number.isNaN(step.amount)) return null;
  const v = step.amount;
  const strong = step.kind === "result" || step.kind === "subtotal" || step.kind === "start";
  const sign = step.kind === "minus" && v < -0.5 ? "−" : step.kind === "plus" && v > 0.5 ? "+" : v < -0.5 ? "−" : "";
  return (
    <span
      className={`tnum whitespace-nowrap text-right ${
        step.kind === "result"
          ? "text-base font-semibold text-ink"
          : strong
            ? "font-semibold text-ink"
            : step.kind === "info"
              ? "text-ink-3"
              : step.kind === "plus"
                ? "text-r-sl_safe"
                : "text-ink-2"
      }`}
    >
      {sign}
      {n0(Math.abs(v))} €
    </span>
  );
}

export function SourceChip({ id }: { id: string }) {
  const src = id.startsWith("https://")
    ? { url: id, short: "Закон региона", title: "Консолидированный текст регионального закона в BOE" }
    : SOURCES[id as KnownSourceId];
  if (!src) return null;
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noreferrer"
      title={src.title}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-1.5 py-px text-[10px] font-medium text-ink-3 transition hover:border-accent/50 hover:text-accent"
    >
      {src.short}
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
        <path d="M4 2h6v6M10 2L3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </a>
  );
}

export function Trace({ results }: { results: RegimeResult[] }) {
  const { selected, set } = useCalc(useShallow((s) => ({ selected: s.selected, set: s.set })));
  const tabs = REGIME_IDS.filter((id) => selected.includes(id));
  // Как в потоке денег: выбранный пользователем режим или лучший из доступных
  const current = useCurrentRegime(results).current.regime;
  const r = results.find((x) => x.regime === current)!;

  return (
    <div>
      <div role="tablist" aria-label="Режим" className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1">
        {tabs.map((id) => {
          const active = id === current;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => set({ focus: id })}
              className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors ${
                active ? "text-ink" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="trace-tab"
                  className="absolute inset-0 rounded-full border border-line-strong bg-ink/[0.06]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: REGIME_META[id].color }} />
                {REGIME_META[id].short}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {GROUPS.map((g, gi) => {
            const steps = r.steps.filter((s) => s.group === g.id);
            if (!steps.length) return null;
            return (
              <section key={g.id} className="rounded-2xl border border-line bg-ink/[0.02] p-4">
                <header className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-ink">{g.title}</h3>
                  <span className="text-[11px] text-ink-3">{g.hint}</span>
                </header>
                <ol className="space-y-0.5">
                  {steps.map((s, i) => (
                    <motion.li
                      key={`${s.label}-${i}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.08 + i * 0.03 }}
                      className={`flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 ${
                        s.kind === "result"
                          ? "mt-2 bg-ink/[0.06]"
                          : s.kind === "subtotal"
                            ? "border-t border-line pt-2"
                            : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[13px] ${s.kind === "info" ? "text-ink-3" : "text-ink-2"}`}>
                            {s.label}
                          </span>
                          {s.source && <SourceChip id={s.source} />}
                        </span>
                        {s.note && <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">{s.note}</span>}
                      </span>
                      <Amount step={s} />
                    </motion.li>
                  ))}
                </ol>
              </section>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.ul
          key={`notes-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-6 grid gap-3 md:grid-cols-2"
        >
          {r.notes.map((n) => (
            <li key={n} className="flex gap-3 rounded-2xl border border-line p-4 text-[13px] leading-relaxed text-ink-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: REGIME_META[current].color }} />
              {n}
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
