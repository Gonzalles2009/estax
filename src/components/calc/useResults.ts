"use client";

import { useDeferredValue, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { BUDGET_MIN, inputsOf, useCalc } from "@/store/calc";
import { calculateAll, REGIME_IDS } from "@/lib/tax/engine";
import type { Inputs, RegimeId, RegimeResult } from "@/lib/tax/types";

export function useInputs(): Inputs {
  return useCalc(useShallow((s) => inputsOf(s)));
}

export function useResults(): RegimeResult[] {
  const inputs = useInputs();
  return useMemo(() => calculateAll(REGIME_IDS, inputs), [inputs]);
}

export interface CurvePoint {
  x: number;
  net: Record<RegimeId, number>;
}

export function domainMaxFor(budget: number): number {
  if (budget <= 120000) return 160000;
  if (budget <= 200000) return 250000;
  return 400000;
}

const POINTS = 56;

/** Кривые чистого дохода по всему диапазону бюджета. Не зависят от текущего бюджета — только от настроек. */
export function useCurves(): { points: CurvePoint[]; xMax: number } {
  const inputs = useInputs();
  const xMax = domainMaxFor(inputs.budget);
  const { budget: _b, ...rest } = inputs;
  void _b;
  const key = JSON.stringify(rest);
  const deferredKey = useDeferredValue(key);
  const deferredMax = useDeferredValue(xMax);

  const points = useMemo(() => {
    const settings = JSON.parse(deferredKey) as Omit<Inputs, "budget">;
    const out: CurvePoint[] = [];
    for (let i = 0; i < POINTS; i++) {
      const x = BUDGET_MIN + ((deferredMax - BUDGET_MIN) * i) / (POINTS - 1);
      const res = calculateAll(REGIME_IDS, { ...settings, budget: x });
      const net = {} as Record<RegimeId, number>;
      for (const r of res) net[r.regime] = r.netAnnual;
      out.push({ x, net });
    }
    return out;
  }, [deferredKey, deferredMax]);

  return { points, xMax: deferredMax };
}
