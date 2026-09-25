"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { BUDGET_MAX, BUDGET_MIN, useCalc } from "@/store/calc";
import { REGION_ORDER, REGIONS } from "@/lib/tax/regions-2026";
import type { Family, RegionId } from "@/lib/tax/types";
import { P } from "@/lib/tax/params-2026";
import { n0 } from "@/lib/format";
import { Stepper } from "@/components/ui/controls";
import { Azulejo } from "@/components/site/Background";
import { MoreSettings } from "./MoreSettings";
import { useCurrentRegime } from "./FlowSection";
import { segmentsOf } from "./segments";
import { REGIME_META } from "@/lib/regimes";
import type { RegimeResult } from "@/lib/tax/types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { pct } from "@/lib/format";

const ease = [0.22, 1, 0.36, 1] as const;

const CURVE = 2.2;
export const budgetToPos = (b: number) => Math.pow((b - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN), 1 / CURVE) * 1000;
export const posToBudget = (p: number) => {
  const raw = BUDGET_MIN + (BUDGET_MAX - BUDGET_MIN) * Math.pow(p / 1000, CURVE);
  const step = raw < 100000 ? 500 : 1000;
  return Math.round(raw / step) * step;
};

const FAMILY_LABEL: Record<Family, string> = {
  single: "один / одна",
  couple: "в паре, доход у обоих",
  couple_joint: "в паре, супруг(а) без дохода",
};

const PRESETS = [30000, 45000, 60000, 80000, 100000, 150000];

/** Нативный select поверх текста: подпись любой длины, системный выбор на телефоне */
function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <span className="inline-field relative inline-flex items-baseline gap-1 px-1 text-ink">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
      <svg aria-hidden viewBox="0 0 20 20" className="size-[0.55em] self-center text-accent">
        <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function BudgetInput() {
  const budget = useCalc((s) => s.budget);
  const set = useCalc((s) => s.set);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? n0(budget);
  const commit = (text: string) => {
    const n = Number(text.replace(/[^\d]/g, ""));
    if (n > 0) set({ budget: n });
    setDraft(null);
  };
  return (
    <span className="inline-field inline-flex items-baseline px-1">
      <input
        aria-label="Годовая сумма, евро"
        inputMode="numeric"
        value={shown}
        style={{ width: `${[...shown].reduce((w, ch) => w + (/\d/.test(ch) ? 0.58 : 0.26), 0.25)}em` }}
        onFocus={(e) => {
          setDraft(String(budget));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(null);
        }}
        className="tnum min-w-0 bg-transparent font-semibold text-ink outline-none"
      />
      <span className="text-ink-2">&nbsp;€</span>
    </span>
  );
}

function Word({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.span>
  );
}

/** Мгновенный ответ рядом с формой: меняется вместе с каждым полем */
function HeroResult({ results }: { results: RegimeResult[] }) {
  const { current } = useCurrentRegime(results);
  const meta = REGIME_META[current.regime];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease }}
      className="card relative overflow-hidden p-6 lg:sticky lg:top-8 lg:self-start"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--f-you), transparent 70%)" }}
      />
      <div className="relative">
        <div className="eyebrow">Останется вам</div>
        <div className="serif tnum mt-3 text-[56px] font-medium leading-none tracking-[-0.03em] text-ink">
          <AnimatedNumber value={current.netMonthly} format={n0} />
          <span className="ml-1.5 text-2xl text-ink-3">€/мес</span>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.regime}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm font-medium text-ink"
          >
            <span className="size-2 rounded-full" style={{ background: meta.color }} />
            {meta.name}
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex h-2 gap-[2px] overflow-hidden rounded-full">
          {segmentsOf(current).map((sg) => (
            <motion.span
              key={sg.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: sg.color }}
              initial={false}
              animate={{ flexGrow: Math.max(0, sg.value) }}
              transition={{ duration: 0.5, ease }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-3">
          <span>вам {pct(current.netAnnual / current.budget, 0)}</span>
          <span>государству {pct(current.effectiveRate, 0)}</span>
        </div>
        <a
          href="#flow"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Куда уходят деньги
          <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
            <path d="M10 4v12M5 11l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

export function Hero({ results }: { results: RegimeResult[] }) {
  const s = useCalc(
    useShallow((st) => ({
      budget: st.budget,
      basis: st.employeeBasis,
      region: st.region,
      family: st.family,
      children: st.children,
      under3: st.childrenUnder3,
      moreOpen: st.moreOpen,
      set: st.set,
    })),
  );
  const pos = budgetToPos(s.budget);
  const verified = new Date(P.verifiedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  return (
    <header className="relative mx-auto max-w-[1240px] px-4 pb-10 pt-4 sm:px-8 sm:pb-16 sm:pt-10">
      <Azulejo className="pointer-events-none absolute -right-10 -top-24 hidden h-[520px] w-[520px] text-ink opacity-[0.05] [mask-image:radial-gradient(closest-side,black,transparent)] lg:block" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="mb-7 inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-3 text-xs text-ink-2 backdrop-blur"
      >
        <span className="rounded-full bg-ink px-2 py-0.5 font-semibold text-bg">2026</span>
        Сверено с BOE {verified} · 15 регионов · 6 режимов
      </motion.div>

      <h1 className="serif max-w-6xl text-[46px] font-medium leading-[0.98] tracking-[-0.035em] text-ink sm:text-7xl lg:text-[96px]">
        <Word delay={0}>Сколько</Word> <Word delay={0.06}>останется</Word>{" "}
        <Word delay={0.12}>
          <em className="text-gold pr-[0.08em] font-medium italic">вам,</em>
        </Word>
        <br className="hidden sm:block" /> <Word delay={0.2}>
          <span className="text-ink-3">а не Hacienda</span>
        </Word>
      </h1>

      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35, ease }}
        className="min-w-0"
      >
        <p className="serif text-[26px] leading-[1.55] text-ink-2 sm:text-[34px] sm:leading-[1.5]">
          {s.basis === "cost" ? "Моя работа стоит компании или клиентам " : "Моя зарплата брутто — "}
          <BudgetInput /> в год. Живу в&nbsp;
          <InlineSelect<RegionId>
            label="Регион"
            value={s.region}
            onChange={(v) => s.set({ region: v })}
            options={REGION_ORDER.map((id) => ({ value: id, label: REGIONS[id].name }))}
          />
          ,{" "}
          <InlineSelect<Family>
            label="Семья"
            value={s.family}
            onChange={(v) => s.set({ family: v })}
            options={(Object.keys(FAMILY_LABEL) as Family[]).map((f) => ({ value: f, label: FAMILY_LABEL[f] }))}
          />
          , детей —{" "}
          <span className="inline-field inline-flex px-1 text-ink">
            <Stepper size="inline" label="Дети" value={s.children} onChange={(v) => s.set({ children: v })} max={6} />
          </span>
          {s.children > 0 && (
            <>
              , из них до 3 лет —{" "}
              <span className="inline-field inline-flex px-1 text-ink">
                <Stepper
                  size="inline"
                  label="Дети до 3 лет"
                  value={s.under3}
                  onChange={(v) => s.set({ childrenUnder3: v })}
                  max={Math.min(3, s.children)}
                />
              </span>
            </>
          )}
          .
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <input
            type="range"
            aria-label="Годовая сумма"
            className="range sm:max-w-md"
            min={0}
            max={1000}
            step={1}
            value={pos}
            style={{ ["--fill" as string]: `${pos / 10}%` }}
            onChange={(e) => s.set({ budget: posToBudget(Number(e.target.value)) })}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => s.set({ budget: p })}
                className={`tnum rounded-full border px-2.5 py-1 text-xs transition ${
                  s.budget === p ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                }`}
              >
                {n0(p / 1000)}k
              </button>
            ))}
            <button
              type="button"
              aria-expanded={s.moreOpen}
              onClick={() => s.set({ moreOpen: !s.moreOpen })}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
            >
              Ещё параметры
              <motion.svg animate={{ rotate: s.moreOpen ? 180 : 0 }} viewBox="0 0 20 20" className="size-3.5">
                <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </motion.svg>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {s.moreOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-hidden"
            >
              <MoreSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <HeroResult results={results} />
      </div>
    </header>
  );
}
