"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";

/* ───────── Сегменты с «перетекающей» подложкой ───────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: ReactNode; hint?: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="relative flex w-full rounded-full border border-line bg-surface-2/60 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={`relative flex-1 rounded-full px-3 ${size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm"} font-medium transition-colors ${
              active ? "text-bg" : "text-ink-2 hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────── Степпер ───────── */

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 8,
  label,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: "md" | "inline";
}) {
  const btn =
    size === "inline"
      ? "grid size-[1.05em] place-items-center rounded-full font-sans text-[0.62em] font-medium text-accent transition hover:bg-accent/10 disabled:text-ink-3 disabled:opacity-40"
      : "grid size-8 place-items-center rounded-full text-lg text-ink-2 transition hover:bg-ink/10 hover:text-ink disabled:opacity-25";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full ${size === "inline" ? "" : "border border-line bg-surface-2/60 p-1"}`}>
      <button type="button" aria-label={`${label}: меньше`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        −
      </button>
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`tnum inline-block text-center ${size === "inline" ? "w-[1.1em]" : "w-6 text-base font-semibold"}`}
        aria-live="polite"
      >
        {value}
      </motion.span>
      <button type="button" aria-label={`${label}: больше`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </span>
  );
}

/* ───────── Переключатель ───────── */

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start justify-between gap-4 text-left">
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{hint}</span>}
      </span>
      <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-ink/15"}`}>
        <motion.span
          className="absolute top-0.5 size-5 rounded-full bg-surface shadow"
          animate={{ left: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

/* ───────── Ползунок с числом ───────── */

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  hint?: ReactNode;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="tnum text-sm font-semibold text-ink">{format(value)}</span>
      </span>
      <input
        type="range"
        className="range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="block text-xs leading-relaxed text-ink-3">{hint}</span>}
    </label>
  );
}
