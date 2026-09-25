import type { RegimeResult } from "@/lib/tax/types";
import { n0, pct } from "@/lib/format";
import { SEGMENT_META } from "./segments";

/** Подпись под полоской бюджета: вам, расходы (если есть), государству */
export function SegmentLegend({ r, className = "" }: { r: RegimeResult; className?: string }) {
  const b = r.breakdown;
  const cost = b.expenses + b.gestoria;
  const costParts = [
    b.expenses > 0.5 && `рабочие расходы ${n0(b.expenses)} €`,
    b.gestoria > 0.5 && `гестория ${n0(b.gestoria)} €`,
  ].filter(Boolean);
  const item = (color: string, text: string, title?: string) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" title={title}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
  return (
    <div className={`flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-ink-3 ${className}`}>
      {item(SEGMENT_META.net.color, `вам ${pct(r.netAnnual / r.budget, 0)}`)}
      {cost / r.budget >= 0.005 && item(SEGMENT_META.cost.color, `расходы ${pct(cost / r.budget, 0)}`, `В год: ${costParts.join(", ")}`)}
      {item(`linear-gradient(90deg, ${SEGMENT_META.tax.color} 50%, ${SEGMENT_META.ss.color} 50%)`, `государству ${pct(r.effectiveRate, 0)}`)}
    </div>
  );
}
