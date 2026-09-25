"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { fromQuery, toQuery, useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { n0 } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Answer } from "./Answer";
import { BudgetControl } from "./BudgetControl";
import { Breakdown } from "./Breakdown";
import { ChartPanel } from "./ChartPanel";
import { Ranking } from "./Ranking";
import { Settings } from "./Settings";
import { Trace } from "./Trace";
import { useResults } from "./useResults";

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

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Calculator() {
  useUrlSync();
  const results = useResults();
  const sentinel = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setDock(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 px-4 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-6">
        {/* Порядок на телефоне: сумма → ответ → настройки. На десктопе сумма и настройки — левая колонка. */}
        <Reveal className="lg:col-start-1 lg:row-start-1">
          <aside className="panel p-5 sm:p-6">
            <BudgetControl />
            <div ref={sentinel} />
          </aside>
        </Reveal>

        <div className="min-w-0 space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:space-y-6">
          <Reveal delay={0.05}>
            <section className="panel relative overflow-hidden p-5 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, #ffb224, transparent 65%)" }}
              />
              <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-start [&>*]:min-w-0">
                <Answer results={results} />
                <Ranking results={results} />
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.1}>
            <section className="panel p-5 sm:p-7">
              <ChartPanel />
            </section>
          </Reveal>
        </div>

        <Reveal className="lg:col-start-1 lg:row-start-2 lg:self-start" delay={0.05}>
          <aside className="panel p-5 sm:p-6" aria-label="Параметры">
            <Settings />
          </aside>
        </Reveal>
      </div>

      <section id="where" className="mx-auto mt-16 max-w-[1320px] scroll-mt-6 px-4 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="Структура бюджета"
            title="Куда уходит каждый евро"
            text="Одна и та же сумма, разные получатели. Наведите на полосу — увидите детали. Цифры на полосах — € в месяц."
          />
          <div className="panel p-5 sm:p-7">
            <Breakdown results={results} />
          </div>
        </Reveal>
      </section>

      <section id="how" className="mx-auto mt-16 max-w-[1320px] scroll-mt-6 px-4 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="Прозрачность"
            title="Как посчитана каждая цифра"
            text="Пошаговый расчёт для выбранного режима. Серые метки ведут на статьи закона в BOE — можно проверить самому."
          />
          <div className="panel p-5 sm:p-7">
            <Trace results={results} />
          </div>
        </Reveal>
      </section>

      <MobileDock show={dock} results={results} />
    </>
  );
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header className="mb-6 max-w-2xl">
      <div className="eyebrow mb-2">{eyebrow}</div>
      <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{text}</p>}
    </header>
  );
}

function MobileDock({ show, results }: { show: boolean; results: ReturnType<typeof useResults> }) {
  const selected = useCalc((s) => s.selected);
  const best = results.filter((r) => selected.includes(r.regime)).sort((a, b) => b.netAnnual - a.netAnnual)[0];
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-line-strong bg-panel-2/90 px-4 pb-2 pt-3 shadow-2xl backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <BudgetControl compact />
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-fg-3">
                <span className="size-1.5 rounded-full" style={{ background: REGIME_META[best.regime].color }} />
                {REGIME_META[best.regime].short}
              </div>
              <div className="text-lg font-semibold text-fg">
                <AnimatedNumber className="tnum" value={best.netMonthly} format={n0} />
                <span className="ml-1 text-xs text-fg-3">€/мес</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
