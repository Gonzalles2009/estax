"use client";

import { useState } from "react";
import { BUDGET_MAX, BUDGET_MIN, useCalc } from "@/store/calc";
import { n0 } from "@/lib/format";
import { Segmented } from "@/components/ui/controls";

const CURVE = 2.2;
const toPos = (b: number) => Math.pow((b - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN), 1 / CURVE) * 1000;
const fromPos = (p: number) => {
  const raw = BUDGET_MIN + (BUDGET_MAX - BUDGET_MIN) * Math.pow(p / 1000, CURVE);
  const step = raw < 100000 ? 500 : 1000;
  return Math.round(raw / step) * step;
};

const PRESETS = [30000, 45000, 60000, 80000, 100000, 150000];

export function BudgetControl({ compact = false }: { compact?: boolean }) {
  const budget = useCalc((s) => s.budget);
  const basis = useCalc((s) => s.employeeBasis);
  const set = useCalc((s) => s.set);
  const [draft, setDraft] = useState<string | null>(null);

  const pos = toPos(budget);

  const commit = (text: string) => {
    const n = Number(text.replace(/[^\d]/g, ""));
    if (n > 0) set({ budget: n });
    setDraft(null);
  };

  return (
    <div>
      {!compact && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="eyebrow">Сумма в год</span>
          <span className="text-xs text-fg-3">{n0(budget / 12)} € в месяц</span>
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <input
          aria-label="Годовая сумма, евро"
          inputMode="numeric"
          value={draft ?? n0(budget)}
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
          className={`tnum w-full min-w-0 bg-transparent font-semibold tracking-tight text-fg outline-none ${
            compact ? "text-2xl" : "text-5xl sm:text-6xl"
          }`}
        />
        <span className={`${compact ? "text-xl" : "text-3xl"} font-medium text-fg-3`}>€</span>
      </div>
      <input
        type="range"
        aria-label="Годовая сумма"
        className="range mt-3"
        min={0}
        max={1000}
        step={1}
        value={pos}
        style={{ ["--fill" as string]: `${pos / 10}%` }}
        onChange={(e) => set({ budget: fromPos(Number(e.target.value)) })}
      />
      {!compact && (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set({ budget: p })}
                className={`tnum rounded-full border px-2.5 py-1 text-xs transition ${
                  budget === p
                    ? "border-sun/60 bg-sun/15 text-fg"
                    : "border-line text-fg-2 hover:border-line-strong hover:text-fg"
                }`}
              >
                {n0(p / 1000)}k
              </button>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-2 text-xs leading-relaxed text-fg-3">Для найма эта сумма — это</div>
            <Segmented
              label="Что означает сумма для наёмной работы"
              size="sm"
              value={basis}
              onChange={(v) => set({ employeeBasis: v })}
              options={[
                { value: "cost", label: "бюджет компании", hint: "Честное сравнение: сколько тратит работодатель" },
                { value: "gross", label: "брутто-зарплата", hint: "Как в оффере: salario bruto anual" },
              ]}
            />
            <p className="mt-2 text-xs leading-relaxed text-fg-3">
              {basis === "cost"
                ? "Одинаковые деньги от компании или клиента для всех режимов. Работодатель платит ≈32% взносов сверх брутто — они вычитаются из этой суммы."
                : "Сумма из оффера. Работодатель платит сверх неё ещё ≈32% взносов, поэтому такое сравнение занижает autónomo и SL."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
