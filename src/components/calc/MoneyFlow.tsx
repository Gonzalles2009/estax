"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyLink, type SankeyNode } from "d3-sankey";
import { flowsOf, nodeOrder, TERMINALS, type FlowLink, type FlowNode, type TerminalId } from "@/lib/flows";
import type { RegimeResult } from "@/lib/tax/types";
import { n0, pct } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

type N = SankeyNode<FlowNode, FlowLink>;
type L = SankeyLink<FlowNode, FlowLink>;

const TERMINAL_COLOR = Object.fromEntries(TERMINALS.map((t) => [t.id, t.color])) as Record<TerminalId, string>;
const ease = [0.22, 1, 0.36, 1] as const;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const linkPath = sankeyLinkHorizontal<FlowNode, FlowLink>();

/** Частицы-«монетки», бегущие по ленте */
function Particles({ d, width, color, count, seed }: { d: string; width: number; color: string; count: number; seed: number }) {
  const dur = 3.2 + (seed % 5) * 0.35;
  return (
    <g pointerEvents="none">
      {Array.from({ length: count }, (_, i) => {
        const spread = Math.max(0, width / 2 - 3);
        // Детерминированный «шум», чтобы не было рассинхрона SSR/CSR
        const dy = spread * Math.sin((i + 1) * 12.9898 + seed) * 0.9;
        const delay = -((dur / count) * i + (seed % 7) * 0.13);
        return (
          <g key={i} transform={`translate(0 ${dy.toFixed(2)})`}>
            <circle r={2.6} fill={color} opacity={0.9}>
              <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} calcMode="linear" />
            </circle>
          </g>
        );
      })}
    </g>
  );
}

export function MoneyFlow({ result }: { result: RegimeResult }) {
  const [ref, width] = useSize<HTMLDivElement>();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const graph = useMemo(() => flowsOf(result), [result]);

  const mobile = width > 0 && width < 560;
  const H = mobile ? 340 : 400;
  const labelW = mobile ? 128 : 168;
  const top = 34;

  const layout = useMemo(() => {
    if (!width || graph.invalid) return null;
    const gen = sankey<FlowNode, FlowLink>()
      .nodeId((d) => d.id)
      .nodeWidth(mobile ? 8 : 10)
      .nodePadding(mobile ? 18 : 22)
      .nodeAlign(sankeyJustify)
      .nodeSort((a, b) => nodeOrder(a.id) - nodeOrder(b.id))
      .linkSort((a, b) => nodeOrder((a.target as N).id) - nodeOrder((b.target as N).id))
      .extent([
        [1, top],
        [width - labelW, H - 6],
      ]);
    return gen({ nodes: graph.nodes.map((n) => ({ ...n })), links: graph.links.map((l) => ({ ...l })) });
  }, [graph, width, mobile, H, labelW]);

  // Подписи получателей справа: разводим, чтобы не наезжали
  const terminalLabels = useMemo(() => {
    if (!layout) return [];
    const items = (layout.nodes as N[])
      .filter((n) => n.terminal)
      .map((n) => ({ id: n.id as TerminalId, y: ((n.y0 ?? 0) + (n.y1 ?? 0)) / 2, x: n.x1 ?? 0 }))
      .sort((a, b) => a.y - b.y);
    const GAP = mobile ? 42 : 48;
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < GAP) items[i].y = items[i - 1].y + GAP;
    const overflow = items.length ? items[items.length - 1].y - (H - 18) : 0;
    if (overflow > 0) for (const it of items) it.y -= overflow;
    return items;
  }, [layout, mobile, H]);

  const root = graph.nodes[0];
  const rootTotal = graph.links.filter((l) => l.source === root?.id).reduce((a, l) => a + l.value, 0);

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: H }}>
      {graph.invalid && (
        <div className="grid h-full place-items-center rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-2">
          {graph.invalid}
        </div>
      )}
      {layout && (
        <>
          <svg width={width} height={H} className="absolute inset-0 overflow-visible" role="img" aria-label="Поток денег: из бюджета к вам, в Hacienda, в Seguridad Social и на расходы">
            <defs>
              {(layout.links as L[]).map((l) => {
                const s = l.source as N;
                const t = l.target as N;
                const to = t.terminal ? TERMINAL_COLOR[t.id as TerminalId] : "var(--f-mid)";
                return (
                  <linearGradient key={`g-${s.id}-${t.id}`} id={`g-${s.id}-${t.id}`} gradientUnits="userSpaceOnUse" x1={s.x1} x2={t.x0}>
                    <stop offset="0%" stopColor="var(--f-mid)" />
                    <stop offset="100%" stopColor={to} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Ленты */}
            <g fill="none">
              <AnimatePresence initial={false}>
                {(layout.links as L[]).map((l) => {
                  const s = l.source as N;
                  const t = l.target as N;
                  const key = `${s.id}-${t.id}`;
                  const d = linkPath(l) ?? "";
                  const dim = hover !== null && hover !== t.id && hover !== key;
                  return (
                    <motion.path
                      key={key}
                      initial={{ opacity: 0, d, strokeWidth: Math.max(1, l.width ?? 1) }}
                      animate={{ opacity: dim ? 0.12 : t.terminal ? 0.6 : 0.55, d, strokeWidth: Math.max(1, l.width ?? 1) }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease }}
                      stroke={`url(#g-${key})`}
                      onMouseEnter={() => setHover(key)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <title>{`${l.label}: ${n0(l.value)} € в год · ${n0(l.value / 12)} € в месяц`}</title>
                    </motion.path>
                  );
                })}
              </AnimatePresence>
            </g>

            {/* Монетки */}
            {!reduce &&
              (layout.links as L[]).map((l, i) => {
                const s = l.source as N;
                const t = l.target as N;
                const share = l.value / rootTotal;
                const count = Math.max(2, Math.min(14, Math.round(share * 30)));
                return (
                  <Particles
                    key={`p-${result.regime}-${s.id}-${t.id}-${Math.round(l.width ?? 0)}`}
                    d={linkPath(l) ?? ""}
                    width={l.width ?? 2}
                    count={count}
                    seed={i * 3 + 1}
                    color={t.terminal ? TERMINAL_COLOR[t.id as TerminalId] : "var(--ink-3)"}
                  />
                );
              })}

            {/* Узлы */}
            <AnimatePresence initial={false}>
              {(layout.nodes as N[]).map((n) => (
                <motion.rect
                  key={n.id}
                  initial={{ opacity: 0, x: n.x0, y: n.y0, height: (n.y1 ?? 0) - (n.y0 ?? 0), width: (n.x1 ?? 0) - (n.x0 ?? 0) }}
                  animate={{ opacity: 1, x: n.x0, y: n.y0, height: Math.max(2, (n.y1 ?? 0) - (n.y0 ?? 0)), width: (n.x1 ?? 0) - (n.x0 ?? 0) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease }}
                  rx={3}
                  fill={n.terminal ? TERMINAL_COLOR[n.id as TerminalId] : "var(--ink)"}
                  onMouseEnter={() => n.terminal && setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </AnimatePresence>
          </svg>

          {/* Подписи промежуточных узлов */}
          <AnimatePresence initial={false}>
            {(layout.nodes as N[])
              .filter((n) => !n.terminal)
              .map((n) => {
                const isRoot = n.id === root.id;
                const h = (n.y1 ?? 0) - (n.y0 ?? 0);
                if (!isRoot && mobile && h < 26) return null;
                const value = graph.links.filter((l) => l.source === n.id).reduce((a, l) => a + l.value, 0);
                return (
                  <motion.div
                    key={`l-${n.id}`}
                    className="pointer-events-none absolute whitespace-nowrap text-[11px] leading-tight sm:text-xs"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      left: isRoot ? n.x0 ?? 0 : (n.x1 ?? 0) + 6,
                      top: isRoot ? (n.y0 ?? 0) - 30 : ((n.y0 ?? 0) + (n.y1 ?? 0)) / 2 - 15,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease }}
                  >
                    <span className="block text-ink-3">{n.label}</span>
                    <span className="tnum block font-semibold text-ink [text-shadow:0_0_6px_var(--surface),0_0_2px_var(--surface)]">
                      {n0(value / 12)} €/мес
                    </span>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Подписи получателей */}
          {terminalLabels.map((t) => {
            const meta = TERMINALS.find((x) => x.id === t.id)!;
            const total = graph.totals[t.id];
            return (
              <motion.div
                key={`t-${t.id}`}
                className="absolute"
                style={{ left: t.x + 10, width: labelW - 14 }}
                initial={false}
                animate={{ top: t.y - (mobile ? 19 : 22) }}
                transition={{ duration: 0.7, ease }}
                onMouseEnter={() => setHover(t.id)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-ink-3 sm:text-xs">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="truncate">{meta.label}</span>
                  <span className="tnum ml-auto">{pct(total / rootTotal, 0)}</span>
                </div>
                <div className={`serif tnum whitespace-nowrap leading-tight text-ink ${t.id === "you" ? "text-[22px] font-semibold sm:text-[28px]" : "text-lg sm:text-xl"}`}>
                  <AnimatedNumber value={total / 12} format={n0} />
                  <span className="ml-1 font-sans text-[11px] font-normal text-ink-3">€/мес</span>
                </div>
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}
