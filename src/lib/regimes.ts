import type { RegimeId } from "./tax/types";

export interface RegimeMeta {
  name: string;
  short: string;
  tagline: string;
  color: string;
  dashed?: boolean;
  risk?: string;
}

export const REGIME_META: Record<RegimeId, RegimeMeta> = {
  employee: {
    name: "Работа по найму",
    short: "Найм",
    tagline: "Contrato laboral, IRPF по общей шкале",
    color: "var(--color-r-employee)",
  },
  beckham: {
    name: "Найм + Ley Beckham",
    short: "Beckham",
    tagline: "Импатриант: 24% до 600 000 €, 6 лет",
    color: "var(--color-r-beckham)",
  },
  autonomo: {
    name: "Autónomo",
    short: "Autónomo",
    tagline: "Фрилансер, estimación directa simplificada",
    color: "var(--color-r-autonomo)",
  },
  autonomo_new: {
    name: "Autónomo · первый год",
    short: "Autónomo 1-й год",
    tagline: "Tarifa plana 80 € + скидка 20% на IRPF",
    color: "var(--color-r-autonomo_new)",
  },
  sl_safe: {
    name: "Своя SL",
    short: "SL",
    tagline: "Зарплата ≥ 75% + дивиденды, по правилам art. 18.6 LIS",
    color: "var(--color-r-sl_safe)",
  },
  sl_optimal: {
    name: "SL · агрессивно",
    short: "SL агрессивно",
    tagline: "Минимум налогов через дивиденды, есть налоговый риск",
    color: "var(--color-r-sl_optimal)",
    dashed: true,
    risk: "Риск доначисления",
  },
};
