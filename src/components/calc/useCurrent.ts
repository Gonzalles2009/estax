"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { availabilityOf, beckhamVerdict, type Availability } from "@/lib/beckham";
import type { RegimeId, RegimeResult } from "@/lib/tax/types";

export function useBeckhamVerdict() {
  const answers = useCalc((s) => s.beckham);
  return useMemo(() => beckhamVerdict(answers), [answers]);
}

/** Доступен ли режим пользователю: ok — да, check — не проверено, no — нет */
export function useAvailability() {
  const verdict = useBeckhamVerdict();
  return useCallback((r: RegimeId): Availability => availabilityOf(r, verdict), [verdict]);
}

/** Лидер среди сравниваемых режимов: только доступные, если такие есть */
export function leaderOf(net: Record<RegimeId, number>, selected: RegimeId[], avail: (r: RegimeId) => Availability): RegimeId {
  const ok = selected.filter((r) => avail(r) === "ok");
  const pool = ok.length ? ok : selected;
  let best = pool[0];
  for (const r of pool) if (net[r] > net[best]) best = r;
  return best;
}

/**
 * Выбранный режим: явно выбранный пользователем или лучший из доступных.
 * Недоступные режимы уходят в конец списка, непроверенные стоят на своём месте, но лучшими не считаются.
 */
export function useCurrentRegime(results: RegimeResult[]) {
  const { selected, focus } = useCalc(useShallow((s) => ({ selected: s.selected, focus: s.focus })));
  const avail = useAvailability();
  const byNet = results.filter((r) => selected.includes(r.regime)).sort((a, b) => b.netAnnual - a.netAnnual);
  const shown = [...byNet.filter((r) => avail(r.regime) !== "no"), ...byNet.filter((r) => avail(r.regime) === "no")];
  const best = shown.find((r) => avail(r.regime) === "ok") ?? shown[0];
  const current = (focus && shown.find((r) => r.regime === focus)) || best;
  return { shown, best, current, avail, pinned: !!focus && current.regime === focus };
}
