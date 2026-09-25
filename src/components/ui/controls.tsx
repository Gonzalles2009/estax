"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";

/* ───────── Segmented control с «перетекающей» подложкой ───────── */

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
    <div
      role="radiogroup"
      aria-label={label}
      className="relative flex w-full rounded-2xl border border-line bg-ink-2/80 p-1"
    >
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
            className={`relative flex-1 rounded-xl px-2 ${size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm"} font-medium transition-colors ${
              active ? "text-ink" : "text-fg-2 hover:text-fg"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-fg"
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
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-line bg-ink-2/80 p-1">
      <button
        type="button"
        aria-label={`${label}: меньше`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid size-8 place-items-center rounded-xl text-lg text-fg-2 transition hover:bg-white/5 hover:text-fg disabled:opacity-30"
      >
        −
      </button>
      <motion.span
        key={value}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="tnum w-6 text-center text-base font-semibold"
        aria-live="polite"
      >
        {value}
      </motion.span>
      <button
        type="button"
        aria-label={`${label}: больше`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid size-8 place-items-center rounded-xl text-lg text-fg-2 transition hover:bg-white/5 hover:text-fg disabled:opacity-30"
      >
        +
      </button>
    </div>
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-fg-3">{hint}</span>}
      </span>
      <span
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-sun" : "bg-white/12"}`}
      >
        <motion.span
          className="absolute top-0.5 size-5 rounded-full bg-white shadow"
          animate={{ left: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}

/* ───────── Слайдер с числом ───────── */

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
        <span className="text-sm text-fg-2">{label}</span>
        <span className="tnum text-sm font-semibold text-fg">{format(value)}</span>
      </span>
      <input
        type="range"
        className="range range-sm mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="block text-xs leading-relaxed text-fg-3">{hint}</span>}
    </label>
  );
}

export function FieldLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="eyebrow">{children}</span>
      {aside}
    </div>
  );
}
