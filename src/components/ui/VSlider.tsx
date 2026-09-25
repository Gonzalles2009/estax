"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

/**
 * Вертикальный ползунок: вверх — больше. Значение 0…1000.
 * Клавиатура: ↑ → больше, ↓ ← меньше, PageUp/PageDown — шаг 10%, Home/End — края.
 */
export function VSlider({
  value,
  onChange,
  label,
  valueText,
  bubble,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  valueText: string;
  /** Подпись у бегунка при перетаскивании и фокусе */
  bubble?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);
  const clamp = (v: number) => Math.min(1000, Math.max(0, Math.round(v)));

  const fromPointer = (clientY: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    onChange(clamp(((r.bottom - clientY) / r.height) * 1000));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10, PageUp: 100, PageDown: -100 }[e.key];
    if (step !== undefined) onChange(clamp(value + step));
    else if (e.key === "Home") onChange(0);
    else if (e.key === "End") onChange(1000);
    else return;
    e.preventDefault();
  };

  const pct = value / 10;
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={1000}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        fromPointer(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientY);
      }}
      className={`group relative flex cursor-pointer touch-none justify-center rounded-full outline-none ${className}`}
    >
      <div ref={trackRef} className="relative h-full w-1 rounded-full bg-line-strong">
        <div className="absolute inset-x-0 bottom-0 rounded-full bg-ink" style={{ height: `${pct}%` }} />
        <div
          className="absolute left-1/2 size-6 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-ink bg-surface shadow-[0_4px_14px_rgb(0_0_0/0.18)] transition-transform group-focus-visible:ring-4 group-focus-visible:ring-accent/30 group-active:scale-110"
          style={{ bottom: `${pct}%` }}
        >
          <AnimatePresence>
            {bubble && (active || hover) && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="tnum pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-bg shadow-lg"
              >
                {bubble}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
