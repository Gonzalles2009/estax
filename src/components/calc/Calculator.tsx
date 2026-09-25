"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { fromQuery, toQuery, useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIME_IDS } from "@/lib/tax/engine";
import { Breakdown } from "./Breakdown";
import { ChartPanel } from "./ChartPanel";
import { FlowSection } from "./FlowSection";
import { Hero } from "./Hero";
import { ControlDock } from "./ControlDock";
import { Ranking } from "./Ranking";
import { ReceiptSection } from "./Receipt";
import { Trace } from "./Trace";
import { useResults } from "./useResults";

const ease = [0.22, 1, 0.36, 1] as const;

function useUrlSync() {
  useEffect(() => {
    const initial = fromQuery(window.location.search);
    if (Object.keys(initial).length) useCalc.getState().set(initial);
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = useCalc.subscribe((s) => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = toQuery(s);
        const url = q ? `${window.location.pathname}?${q}` : window.location.pathname;
        if (url !== `${window.location.pathname}${window.location.search}`) {
          window.history.replaceState(window.history.state, "", url);
        }
      }, 400);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, []);
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{text}</p>}
    </header>
  );
}

function RegimeChips() {
  const { selected, toggle, set, highlight } = useCalc(
    useShallow((s) => ({ selected: s.selected, toggle: s.toggle, set: s.set, highlight: s.highlight })),
  );
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Какие режимы сравнивать">
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
              on ? "border-line-strong bg-surface text-ink" : "border-dashed border-line-strong text-ink-3 hover:text-ink-2"
            } ${highlight === id ? "bg-ink/[0.06]" : ""}`}
          >
            <span
              className="size-2.5 rounded-full transition-all"
              style={{ background: on ? meta.color : "transparent", boxShadow: on ? "none" : `inset 0 0 0 1.5px ${meta.color}` }}
            />
            {meta.short}
          </motion.button>
        );
      })}
    </div>
  );
}

type Tab = "chart" | "structure";

function Comparison({ results }: { results: ReturnType<typeof useResults> }) {
  const [tab, setTab] = useState<Tab>("chart");
  return (
    <section id="compare" className="mx-auto mt-28 max-w-[1240px] scroll-mt-6 px-4 sm:px-8">
      <Reveal>
        <SectionTitle
          eyebrow="Сравнение"
          title="Все режимы рядом"
          text="Добавьте первый год autónomo или агрессивную SL, чтобы увидеть временные льготы и налоговый риск. Клик по режиму показывает его поток денег и чек."
        />
      </Reveal>
      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-8">
        <Reveal className="min-w-0 space-y-4">
          <RegimeChips />
          <Ranking results={results} />
        </Reveal>
        <Reveal delay={0.08} className="min-w-0">
          <div className="card p-5 sm:p-7">
            <div role="tablist" className="mb-6 flex gap-1 border-b border-line">
              {(
                [
                  ["chart", "По всем суммам"],
                  ["structure", "Куда уходят деньги"],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`relative -mb-px px-3 pb-3 text-sm font-medium transition-colors ${tab === id ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
                >
                  {label}
                  {tab === id && <motion.span layoutId="cmp-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink" />}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "chart" ? <ChartPanel /> : <Breakdown results={results} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Calculator() {
  useUrlSync();
  const results = useResults();

  return (
    <>
      <Hero results={results} />
      <FlowSection results={results} />
      <Comparison results={results} />
      <ReceiptSection results={results} />

      <section id="how" className="mx-auto mt-28 max-w-[1240px] scroll-mt-6 px-4 sm:px-8">
        <Reveal>
          <SectionTitle
            eyebrow="Прозрачность"
            title="Как посчитана каждая цифра"
            text="Пошаговый расчёт выбранного режима. Метки ведут на статьи закона в BOE — можно проверить самому."
          />
          <div className="card p-5 sm:p-8">
            <Trace results={results} />
          </div>
        </Reveal>
      </section>

      <ControlDock results={results} />
    </>
  );
}
