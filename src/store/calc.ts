"use client";

import { create } from "zustand";
import type { EmployeeBasis, Family, RegimeId, RegionId } from "@/lib/tax/types";
import { REGIME_IDS } from "@/lib/tax/engine";
import { REGIONS } from "@/lib/tax/regions-2026";
import { BUDGET_MAX, BUDGET_MIN, DEFAULTS, LEGACY_WORK_EXPENSES, type ChartMode, type UiState } from "@/lib/defaults";
import { decodeBeckham, encodeBeckham } from "@/lib/beckham";

export { BUDGET_MAX, BUDGET_MIN, DEFAULTS, inputsOf, type ChartMode } from "@/lib/defaults";

export interface CalcState extends UiState {
  set: (patch: Partial<UiState>) => void;
  toggle: (regime: RegimeId) => void;
}

export const useCalc = create<CalcState>()((set, get) => ({
  ...DEFAULTS,
  set: (patch) => set(sanitize({ ...get(), ...patch })),
  toggle: (regime) => {
    const { selected } = get();
    const next = selected.includes(regime) ? selected.filter((r) => r !== regime) : [...selected, regime];
    if (next.length === 0) return;
    set({ selected: REGIME_IDS.filter((r) => next.includes(r)) });
  },
}));

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

function sanitize<T extends UiState>(s: T): T {
  return {
    ...s,
    budget: clamp(Math.round(s.budget), BUDGET_MIN, BUDGET_MAX),
    children: clamp(Math.round(s.children), 0, 8),
    childrenUnder3: clamp(Math.round(s.childrenUnder3), 0, Math.min(3, Math.round(s.children))),
    workExpenses: clamp(Math.round(s.workExpenses), 0, 5000),
    gestoriaAutonomo: clamp(Math.round(s.gestoriaAutonomo), 0, 1000),
    gestoriaSl: clamp(Math.round(s.gestoriaSl), 0, 2000),
  };
}

/* ───────── URL ⇄ состояние ───────── */

const FAMILIES: Family[] = ["single", "couple", "couple_joint"];
const BASES: EmployeeBasis[] = ["cost", "gross"];
const MODES: ChartMode[] = ["net", "share", "delta"];

const KNOWN_KEYS = ["b", "r", "f", "k", "k3", "m", "ga", "gs", "n", "tp", "na", "v", "s", "bk"];

export function toQuery(s: UiState): string {
  const q = new URLSearchParams();
  const put = (k: string, v: string | number, d: string | number) => {
    if (v !== d) q.set(k, String(v));
  };
  put("b", s.budget, DEFAULTS.budget);
  put("r", s.region, DEFAULTS.region);
  put("f", s.family, DEFAULTS.family);
  put("k", s.children, DEFAULTS.children);
  put("k3", s.childrenUnder3, DEFAULTS.childrenUnder3);
  put("x", s.workExpenses, DEFAULTS.workExpenses);
  put("m", s.employeeBasis, DEFAULTS.employeeBasis);
  put("ga", s.gestoriaAutonomo, DEFAULTS.gestoriaAutonomo);
  put("gs", s.gestoriaSl, DEFAULTS.gestoriaSl);
  put("n", s.slNewCompany ? 1 : 0, 0);
  put("tp", s.slTarifaPlana ? 1 : 0, 0);
  put("na", s.noAlimony ? 1 : 0, 0);
  put("v", s.chartMode, DEFAULTS.chartMode);
  put("s", s.selected.join("."), DEFAULTS.selected.join("."));
  put("bk", encodeBeckham(s.beckham), "");
  // Расходы пишем в любую непустую ссылку явно: так ссылка без «x» однозначно старая (см. fromQuery)
  if (q.toString() !== "" && !q.has("x")) q.set("x", String(s.workExpenses));
  return q.toString();
}

export function fromQuery(search: string): Partial<UiState> {
  const q = new URLSearchParams(search);
  const out: Partial<UiState> = {};
  const num = (k: string) => {
    const v = q.get(k);
    if (v === null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const b = num("b");
  if (b !== undefined) out.budget = b;
  const r = q.get("r");
  if (r && r in REGIONS) out.region = r as RegionId;
  const f = q.get("f");
  if (f && FAMILIES.includes(f as Family)) out.family = f as Family;
  const k = num("k");
  if (k !== undefined) out.children = k;
  const k3 = num("k3");
  if (k3 !== undefined) out.childrenUnder3 = k3;
  const x = num("x");
  if (x !== undefined) out.workExpenses = x;
  // Старая ссылка: расходы были по умолчанию и не записывались
  else if (KNOWN_KEYS.some((k) => q.has(k))) out.workExpenses = LEGACY_WORK_EXPENSES;
  const m = q.get("m");
  if (m && BASES.includes(m as EmployeeBasis)) out.employeeBasis = m as EmployeeBasis;
  const ga = num("ga");
  if (ga !== undefined) out.gestoriaAutonomo = ga;
  const gs = num("gs");
  if (gs !== undefined) out.gestoriaSl = gs;
  if (q.get("n") === "1") out.slNewCompany = true;
  if (q.get("tp") === "1") out.slTarifaPlana = true;
  if (q.get("na") === "1") out.noAlimony = true;
  const v = q.get("v");
  if (v && MODES.includes(v as ChartMode)) out.chartMode = v as ChartMode;
  const sel = q.get("s");
  if (sel) {
    const ids = sel.split(".").filter((id): id is RegimeId => (REGIME_IDS as readonly string[]).includes(id));
    if (ids.length) out.selected = REGIME_IDS.filter((r) => ids.includes(r));
  }
  const bk = decodeBeckham(q.get("bk"));
  if (bk) out.beckham = bk;
  return out;
}
