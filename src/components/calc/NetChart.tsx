"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { BUDGET_MIN, useCalc, type ChartMode } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import type { RegimeId } from "@/lib/tax/types";
import { linear, niceDomain, niceTicks } from "@/lib/scale";
import { kEur, n0, pct } from "@/lib/format";
import type { CurvePoint } from "./useResults";
import { leaderOf, useAvailability } from "./useCurrent";
import { Mark } from "@/components/ui/Mark";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function valueOf(mode: ChartMode, p: { x: number; net: Record<RegimeId, number> }, r: RegimeId): number {
  switch (mode) {
    case "net":
      return p.net[r] / 12;
    case "share":
      return p.x > 0 ? p.net[r] / p.x : 0;
    case "delta":
      return (p.net[r] - p.net.employee) / 12;
  }
}

function interpolate(points: CurvePoint[], x: number): CurvePoint {
  if (x <= points[0].x) return points[0];
  const last = points[points.length - 1];
  if (x >= last.x) return last;
  let i = 1;
  while (points[i].x < x) i++;
  const a = points[i - 1];
  const b = points[i];
  const t = (x - a.x) / (b.x - a.x);
  const net = {} as Record<RegimeId, number>;
  for (const k of Object.keys(a.net) as RegimeId[]) net[k] = a.net[k] + (b.net[k] - a.net[k]) * t;
  return { x, net };
}

const fmtY = (mode: ChartMode, v: number) =>
  mode === "share" ? pct(v, 0) : mode === "delta" ? `${v > 0 ? "+" : v < 0 ? "−" : ""}${n0(Math.abs(v))}` : n0(v);

const fmtValue = (mode: ChartMode, v: number) =>
  mode === "share"
    ? pct(v, 1)
    : mode === "delta"
      ? `${v > 0.5 ? "+" : v < -0.5 ? "−" : ""}${n0(Math.abs(v))} €/мес`
      : `${n0(v)} €/мес`;

export function NetChart({ points, xMax }: { points: CurvePoint[]; xMax: number }) {
  const { selected, budget, mode, highlight, set } = useCalc(
    useShallow((s) => ({
      selected: s.selected,
      budget: s.budget,
      mode: s.chartMode,
      highlight: s.highlight,
      set: s.set,
    })),
  );
  const avail = useAvailability();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const mobile = width > 0 && width < 560;
  const H = mobile ? 320 : 420;
  const pad = { l: mobile ? 50 : 56, r: mobile ? 12 : 128, t: 34, b: 44 };
  const W = Math.max(width, 280);

  const { x, y, yTicks, xTicks } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of points) {
      for (const r of selected) {
        const v = valueOf(mode, p, r);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (mode === "delta" || mode === "net") {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    if (mode === "share") {
      lo = Math.max(0, lo - 0.05);
      hi = Math.min(1, hi + 0.03);
    }
    const [d0, d1] = niceDomain(lo, hi, 5);
    const xs = linear(BUDGET_MIN, xMax, pad.l, W - pad.r);
    const ys = linear(d0, d1, H - pad.b, pad.t);
    const step = xMax <= 160000 ? 25000 : xMax <= 250000 ? 50000 : 100000;
    const xt: number[] = [];
    for (let v = step; v <= xMax; v += step) if (v >= BUDGET_MIN) xt.push(v);
    return { x: xs, y: ys, yTicks: niceTicks(d0, d1, 5), xTicks: xt };
  }, [points, selected, mode, xMax, W, H, pad.l, pad.r, pad.t, pad.b]);

  const paths = useMemo(() => {
    const out = {} as Record<RegimeId, string>;
    for (const r of selected) {
      out[r] = points
        .map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(valueOf(mode, p, r)).toFixed(1)}`)
        .join("");
    }
    return out;
  }, [points, selected, mode, x, y]);

  // Полоса лидера: кто выгоднее на каждом участке
  const leaderSegments = useMemo(() => {
    const segs: { from: number; to: number; r: RegimeId }[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const best = leaderOf(p.net, selected, avail);
      const x0 = i === 0 ? p.x : (points[i - 1].x + p.x) / 2;
      const x1 = i === points.length - 1 ? p.x : (p.x + points[i + 1].x) / 2;
      const last = segs[segs.length - 1];
      if (last && last.r === best) last.to = x1;
      else segs.push({ from: x0, to: x1, r: best });
    }
    return segs;
  }, [points, selected, avail]);

  const at = useMemo(() => interpolate(points, Math.min(budget, xMax)), [points, budget, xMax]);
  const hoverPoint = hoverX !== null ? interpolate(points, hoverX) : null;

  // Прямые подписи справа с разведением по вертикали
  const labels = useMemo(() => {
    if (mobile) return [];
    const last = points[points.length - 1];
    const items = selected
      .map((r) => ({ r, y: y(valueOf(mode, last, r)) }))
      .sort((a, b) => a.y - b.y);
    const GAP = 17;
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < GAP) items[i].y = items[i - 1].y + GAP;
    }
    const overflow = items.length ? items[items.length - 1].y - (H - pad.b) : 0;
    if (overflow > 0) for (const it of items) it.y -= overflow;
    return items;
  }, [points, selected, mode, y, mobile, H, pad.b]);

  const toBudget = (clientX: number, el: Element) => {
    const rect = el.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const v = x.invert(Math.min(Math.max(px, pad.l), W - pad.r));
    return Math.round(v / 500) * 500;
  };

  const bx = x(Math.min(budget, xMax));
  const spring = dragging ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };

  const tooltipItems = hoverPoint
    ? selected
        .map((r) => ({ r, v: valueOf(mode, hoverPoint, r) }))
        .sort((a, b) => b.v - a.v)
    : [];
  const tipLeft = hoverX !== null ? x(hoverX) : 0;
  const tipOnLeft = tipLeft > W * 0.55;

  return (
    <div ref={wrapRef} className="relative select-none">
      {width > 0 && (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block cursor-crosshair touch-pan-y"
          role="img"
          aria-label="График: сколько остаётся вам в каждом режиме в зависимости от годовой суммы. Нажмите или перетащите, чтобы выбрать сумму."
          onPointerDown={(e) => {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            setDragging(true);
            set({ budget: toBudget(e.clientX, e.currentTarget) });
          }}
          onPointerMove={(e) => {
            const v = toBudget(e.clientX, e.currentTarget);
            if (dragging) set({ budget: v });
            if (e.pointerType === "mouse") setHoverX(v);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onPointerLeave={() => setHoverX(null)}
        >
          <defs>
            <linearGradient id="budget-line" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={pad.t - 6} y2={H - pad.b}>
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Сетка и ось Y */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={W - pad.r}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 && mode !== "share" ? "var(--line-strong)" : "var(--line)"}
                strokeDasharray={t === 0 ? undefined : "2 4"}
              />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tnum fill-ink-3 text-[11px]">
                {fmtY(mode, t)}
              </text>
            </g>
          ))}

          {/* Ось X */}
          {xTicks.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={H - pad.b + 30}
              textAnchor="middle"
              className="tnum fill-ink-3 text-[11px]"
            >
              {kEur(t)}
            </text>
          ))}

          {/* Полоса лидера */}
          <g>
            {leaderSegments.map((s, i) => (
              <motion.rect
                key={`${s.r}-${i}`}
                initial={false}
                animate={{ x: x(s.from), width: Math.max(0, x(s.to) - x(s.from) - 2) }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                y={H - pad.b + 8}
                height={5}
                rx={2.5}
                fill={REGIME_META[s.r].color}
              />
            ))}
          </g>

          {/* Линии режимов */}
          {selected.map((r) => {
            const meta = REGIME_META[r];
            // Недоступный пользователю режим — бледной линией, только для сравнения
            const dim = (highlight !== null && highlight !== r) || (highlight !== r && avail(r) === "no");
            // Пунктир несовместим с анимацией pathLength (она сама управляет dasharray) — его проявляем прозрачностью
            const draw = meta.dashed ? {} : { pathLength: 1 };
            return (
              <motion.path
                key={r}
                d={paths[r]}
                initial={meta.dashed ? { opacity: 0, d: paths[r] } : { pathLength: 0, d: paths[r] }}
                animate={{ ...draw, d: paths[r], opacity: dim ? 0.18 : 1 }}
                transition={{
                  pathLength: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                  d: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: meta.dashed ? 0.8 : 0.2 },
                }}
                fill="none"
                stroke={meta.color}
                strokeWidth={highlight === r ? 3.5 : 2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={meta.dashed ? "6 5" : undefined}
              />
            );
          })}

          {/* Подписи справа */}
          {labels.map(({ r, y: ly }) => (
            <motion.g
              key={r}
              initial={false}
              animate={{ y: ly, opacity: highlight !== null && highlight !== r ? 0.3 : 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            >
              <circle cx={W - pad.r + 10} cy={0} r={3.5} fill={REGIME_META[r].color} />
              <text x={W - pad.r + 20} y={0} dy="0.32em" className="fill-ink-2 text-[12px] font-medium">
                {REGIME_META[r].short}
              </text>
            </motion.g>
          ))}

          {/* Текущий бюджет */}
          <motion.g initial={false} animate={{ x: bx }} transition={spring}>
            <line x1={0} x2={0} y1={pad.t - 6} y2={H - pad.b} stroke="url(#budget-line)" strokeWidth={1.5} />
            <g transform={`translate(0, ${pad.t - 20})`}>
              <rect x={-40} y={-11} width={80} height={22} rx={4} fill="var(--ink)" />
              <text textAnchor="middle" dy="0.34em" className="tnum fill-bg text-[11.5px] font-semibold">
                {n0(budget)} €
              </text>
            </g>
          </motion.g>
          {selected.map((r) => (
            <motion.circle
              key={r}
              initial={false}
              animate={{ cx: bx, cy: y(valueOf(mode, at, r)), opacity: highlight !== null && highlight !== r ? 0.3 : 1 }}
              transition={spring}
              r={5}
              fill={REGIME_META[r].color}
              stroke="var(--surface)"
              strokeWidth={2.5}
            />
          ))}

          {/* Наведение */}
          {hoverX !== null && !dragging && (
            <line
              x1={x(hoverX)}
              x2={x(hoverX)}
              y1={pad.t}
              y2={H - pad.b}
              stroke="var(--line-strong)"
              strokeDasharray="3 3"
              pointerEvents="none"
            />
          )}
        </svg>
      )}

      <AnimatePresence>
        {hoverPoint && !dragging && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute top-10 z-10 min-w-52 rounded-[10px] border border-line-strong bg-surface/95 p-3 shadow-2xl backdrop-blur"
            style={tipOnLeft ? { right: W - tipLeft + 14 } : { left: tipLeft + 14 }}
          >
            <div className="tnum mb-2 text-xs text-ink-3">
              {n0(hoverPoint.x)} € в год · клик — выбрать
            </div>
            <ul className="space-y-1">
              {tooltipItems.map(({ r, v }) => (
                <li key={r} className="flex items-center justify-between gap-4 text-[13px]">
                  <span className="flex items-center gap-2 text-ink-2">
                    <Mark color={REGIME_META[r].color} className="!h-3" />
                    {REGIME_META[r].short}
                  </span>
                  <span className="tnum font-medium text-ink">{fmtValue(mode, v)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
