"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { renderSVG } from "uqr";
import { useCalc } from "@/store/calc";
import { REGIME_META } from "@/lib/regimes";
import { REGIONS } from "@/lib/tax/regions-2026";
import type { Family, RegimeResult } from "@/lib/tax/types";
import { n2, pct } from "@/lib/format";
import { useCurrentRegime } from "./FlowSection";

const FAMILY: Record<Family, string> = {
  single: "один / одна",
  couple: "пара, 2 дохода",
  couple_joint: "пара, 1 доход",
};

const ease = [0.22, 1, 0.36, 1] as const;

/** Короткие подписи для узкой ленты чека */
const SHORT: [RegExp, string][] = [
  [/^Бюджет работодателя.*/, "Бюджет компании"],
  [/^Взносы работодателя.*/, "Взносы работодателя"],
  [/^Ваши взносы.*/, "Ваши взносы в SS"],
  [/^Брутто-зарплата.*/, "Брутто-зарплата"],
  [/^IRPF по режиму.*/, "IRPF (Beckham)"],
  [/^Выручка.*/, "Выручка без IVA"],
  [/^Рабочие расходы.*/, "Рабочие расходы"],
  [/^Гестория.*/, "Гестория"],
  [/^Cuota autónomo — tarifa plana.*/, "Cuota (tarifa plana)"],
  [/^Cuota autónomo societario.*/, "Cuota autónomo"],
  [/^Cuota autónomo.*/, "Cuota autónomo"],
  [/^Вознаграждение вам.*/, "Вознаграждение"],
  [/^Impuesto sobre Sociedades.*/, "Налог на прибыль"],
  [/^Дивиденды.*/, "Дивиденды"],
  [/^Вознаграждение \+ дивиденды.*/, "Вам до IRPF"],
  [/^Выплата Hacienda.*/, "Выплата Hacienda (81 bis)"],
];
const shortLabel = (label: string) => SHORT.find(([re]) => re.test(label))?.[1] ?? label;

/** Короткий «номер чека» из параметров расчёта */
function receiptNo(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}

function Line({ label, value, strong, big }: { label: string; value: string; strong?: boolean; big?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 ${big ? "text-[15px]" : "text-[12.5px]"} ${strong ? "font-semibold" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="mb-[3px] min-w-3 flex-1 border-b border-dotted border-black/30" />
      <span className="tnum shrink-0 whitespace-nowrap">{value}</span>
    </div>
  );
}

function ReceiptPaper({ r, url }: { r: RegimeResult; url: string }) {
  const s = useCalc(useShallow((st) => ({ region: st.region, family: st.family, children: st.children, basis: st.employeeBasis })));
  const flow = r.steps.filter((st) => st.group === "flow");
  const qr = useMemo(() => (url ? renderSVG(url, { border: 0, blackColor: "#1c1a17", whiteColor: "#fffdf8" }) : ""), [url]);
  const date = new Date().toLocaleDateString("ru-RU");
  const host = url ? new URL(url).host : "";

  return (
    <div className="receipt w-[340px] max-w-full px-7 pb-10 pt-11 font-mono shadow-[0_30px_60px_-25px_rgb(40_25_10/0.45)]">
      <div className="text-center">
        <div className="serif text-[26px] font-semibold tracking-tight">EsTax·26</div>
        <div className="mt-1 text-[10.5px] uppercase tracking-[0.2em] text-black/55">расчёт налогов · Испания 2026</div>
        <div className="mt-2 text-[11px] text-black/55">
          Чек № {receiptNo(url)} · {date}
        </div>
      </div>

      <div className="receipt-rule my-4" />
      <div className="space-y-1">
        <Line label="Режим" value={REGIME_META[r.regime].name} />
        <Line label="Регион" value={REGIONS[s.region].name.replace("Comunidad de ", "").replace("Comunitat ", "")} />
        <Line label="Семья" value={`${FAMILY[s.family]}${s.children ? `, детей ${s.children}` : ""}`} />
      </div>
      <div className="receipt-rule my-4" />

      <div className="space-y-1.5">
        {flow.map((st, i) =>
          st.kind === "result" ? null : (
            <Line
              key={i}
              label={shortLabel(st.label)}
              value={`${st.kind === "minus" && st.amount < -0.005 ? "−" : st.kind === "plus" && st.amount > 0.005 ? "+" : ""}${n2(Math.abs(st.amount))}`}
              strong={st.kind === "start" || st.kind === "subtotal"}
            />
          ),
        )}
      </div>

      <div className="receipt-rule my-4" />
      <div className="space-y-1.5">
        <Line label="ИТОГО ВАМ ЗА ГОД" value={`${n2(r.netAnnual)} €`} strong big />
        <Line label="В МЕСЯЦ" value={`${n2(r.netMonthly)} €`} strong big />
      </div>
      <div className="receipt-rule my-4" />

      <div className="flex justify-between text-[11.5px]">
        <span>Государству: {pct(r.effectiveRate, 1)}</span>
        <span>Вам: {pct(r.netAnnual / r.budget, 1)}</span>
      </div>

      <div className="mt-6 flex items-center gap-4">
        {qr && <div className="size-[76px] shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />}
        <div className="text-[10.5px] leading-snug text-black/60">
          Отсканируйте, чтобы открыть этот расчёт.
          <div className="mt-1 font-semibold text-black/80">{host}</div>
        </div>
      </div>
      <div className="mt-6 text-center text-[10px] uppercase tracking-[0.18em] text-black/45">
        ¡Gracias! · это модель, не консультация
      </div>
    </div>
  );
}

export function ReceiptSection({ results }: { results: RegimeResult[] }) {
  const { current } = useCurrentRegime(results);
  const paperRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const printed = useInView(slotRef, { once: true, margin: "0px 0px -20% 0px" });
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const state = useCalc();

  // Ссылка на расчёт — из текущего адреса (URL синхронизируется с параметрами)
  useEffect(() => {
    const t = setTimeout(() => setUrl(window.location.href), 450);
    return () => clearTimeout(t);
  }, [state]);

  const flash = (text: string) => {
    setStatus(text);
    setTimeout(() => setStatus(null), 2400);
  };

  const makePng = async () => {
    const { domToBlob } = await import("modern-screenshot");
    const node = paperRef.current!.firstElementChild as HTMLElement;
    return domToBlob(node, { scale: 2, type: "image/png" });
  };

  const download = async () => {
    setBusy(true);
    try {
      const blob = await makePng();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `estax-${current.regime}-${Math.round(current.budget)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      flash("Картинка сохранена");
    } catch {
      flash("Не получилось сохранить картинку");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = `${REGIME_META[current.regime].name}: остаётся ${n2(current.netMonthly)} € в месяц из ${n2(current.budget)} € в год`;
    try {
      if (navigator.share) {
        setBusy(true);
        let files: File[] | undefined;
        try {
          const blob = await makePng();
          const file = new File([blob], "estax.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) files = [file];
        } catch {}
        await navigator.share({ title: "EsTax·26", text, url, ...(files ? { files } : {}) });
      } else {
        await navigator.clipboard.writeText(url);
        flash("Ссылка скопирована");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          flash("Ссылка скопирована");
        } catch {
          flash("Не получилось поделиться");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="receipt" className="mx-auto mt-28 max-w-[1240px] scroll-mt-6 px-4 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div className="max-w-xl">
          <div className="eyebrow mb-3">Поделиться</div>
          <h2 className="serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">Ваш налоговый чек</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
            Весь расчёт на одной бумажке: сколько пришло, кому ушло и что осталось. Сохраните картинку для себя или
            отправьте в чат. QR-код откроет этот же расчёт со всеми вашими параметрами.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={share}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
              </svg>
              Поделиться
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={download}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
              </svg>
              Сохранить картинку
            </button>
            <AnimatePresence>
              {status && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-ink-2"
                  role="status"
                >
                  {status}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div ref={slotRef} className="relative mx-auto">
          {/* Щель «кассового аппарата», из которой выезжает чек */}
          <div className="relative z-10 mx-auto h-3 w-[360px] max-w-full rounded-full bg-ink/85 shadow-[0_6px_14px_-4px_rgb(0_0_0/0.5)]" />
          {/* Видимость отслеживаем по обёртке: обрезанный clip-path элемент браузер считает невидимым */}
          <motion.div
            key={current.regime}
            ref={paperRef}
            initial={{ clipPath: "inset(0 0 100% 0)", y: -40 }}
            animate={printed ? { clipPath: "inset(0 0 0% 0)", y: 0 } : undefined}
            transition={{ duration: 1.4, ease }}
            className="relative -mt-1.5 flex justify-center [transform-origin:top] lg:rotate-[-1.2deg]"
          >
            <ReceiptPaper r={current} url={url} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
