"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  format: (x: number) => string;
  className?: string;
  duration?: number;
}

/** Число, которое плавно «докручивается» до нового значения */
export function AnimatedNumber({ value, format, className, duration = 0.6 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);
  const reduce = useReducedMotion();
  // Текст обновляет motion напрямую в DOM — React рендерит только стартовое значение
  const [initial] = useState(() => format(value));

  useEffect(() => {
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
    return unsub;
  }, [mv, format]);

  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      if (ref.current) ref.current.textContent = format(value);
      return;
    }
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, duration, mv, reduce, format]);

  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  );
}
