import type { RegimeResult } from "@/lib/tax/types";

export type SegmentKey = "net" | "tax" | "ss" | "cost";

export interface Segment {
  key: SegmentKey;
  label: string;
  color: string;
  value: number;
  parts: { label: string; value: number }[];
}

export const SEGMENT_META: Record<SegmentKey, { label: string; color: string }> = {
  net: { label: "Вам", color: "var(--f-you)" },
  tax: { label: "Hacienda", color: "var(--f-tax)" },
  ss: { label: "Seguridad Social", color: "var(--f-ss)" },
  cost: { label: "Расходы", color: "var(--f-cost)" },
};

/** Бюджет → 4 крупные части для полосок */
export function segmentsOf(r: RegimeResult): Segment[] {
  const b = r.breakdown;
  const all: Segment[] = [
    { key: "net", ...SEGMENT_META.net, value: b.net, parts: [{ label: "Остаётся вам", value: b.net }] },
    {
      key: "tax",
      ...SEGMENT_META.tax,
      value: b.irpf + b.dividendTax + b.corporateTax,
      parts: [
        { label: "IRPF", value: b.irpf },
        { label: "IRPF на дивиденды", value: b.dividendTax },
        { label: "Impuesto sobre Sociedades", value: b.corporateTax },
      ],
    },
    {
      key: "ss",
      ...SEGMENT_META.ss,
      value: b.ssWorker + b.ssEmployer,
      parts: [
        { label: "Ваши взносы", value: b.ssWorker },
        { label: "Взносы работодателя", value: b.ssEmployer },
      ],
    },
    {
      key: "cost",
      ...SEGMENT_META.cost,
      value: b.expenses + b.gestoria,
      parts: [
        { label: "Рабочие расходы", value: b.expenses },
        { label: "Гестория", value: b.gestoria },
      ],
    },
  ];
  return all.filter((s) => s.value > 0.5);
}
