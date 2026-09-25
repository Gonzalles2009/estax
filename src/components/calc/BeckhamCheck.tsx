"use client";

import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { useId } from "react";
import { beckhamVerdict, EMPTY_BECKHAM, visibleQuestions, type BeckhamAnswers, type BeckhamStatus } from "@/lib/beckham";
import { REGIME_META } from "@/lib/regimes";
import { REGIME_IDS } from "@/lib/tax/engine";
import type { RegimeResult } from "@/lib/tax/types";
import { n0 } from "@/lib/format";
import { SourceChip } from "./Trace";
import { useBeckhamVerdict, useCurrentRegime } from "./useCurrent";

const ease = [0.22, 1, 0.36, 1] as const;

const STATUS_CLS: Record<BeckhamStatus, string> = {
  unknown: "text-ink-2",
  yes: "text-ok",
  maybe: "text-f-you",
  no: "text-f-tax",
};

/**
 * Проверка права на Ley Beckham: несколько вопросов по art. 93 LIRPF.
 * Ответ сразу меняет расчёт: непроверенный или недоступный режим не считается лучшим.
 */
export function BeckhamCheck({ results, compact = false }: { results: RegimeResult[]; compact?: boolean }) {
  const { answers, open, selected, set } = useCalc(
    useShallow((s) => ({ answers: s.beckham, open: s.checkOpen, selected: s.selected, set: s.set })),
  );
  const verdict = useBeckhamVerdict();
  const { avail } = useCurrentRegime(results);
  const panelId = useId();

  // Сколько даст Beckham против лучшего из остальных доступных режимов
  const bk = results.find((r) => r.regime === "beckham")!;
  const alternatives = results.filter((r) => r.regime !== "beckham" && selected.includes(r.regime) && avail(r.regime) === "ok");
  const alt = alternatives.sort((a, b) => b.netAnnual - a.netAnnual)[0] ?? results.find((r) => r.regime === "employee")!;
  const gain = (bk.netAnnual - alt.netAnnual) / 12;

  const answer = (key: keyof BeckhamAnswers, value: string) => {
    const next = { ...answers, [key]: answers[key] === value ? null : value } as BeckhamAnswers;
    // Если Beckham подтвердился, его стоит видеть в сравнении
    const add = beckhamVerdict(next).status === "yes" && !selected.includes("beckham");
    set({ beckham: next, ...(add ? { selected: REGIME_IDS.filter((r) => r === "beckham" || selected.includes(r)) } : {}) });
  };

  const questions = visibleQuestions(answers, verdict);
  // Строка статуса под заголовком: цветное слово + пояснение, без плашек
  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const [statusWord, statusRest] =
    verdict.status === "unknown"
      ? ["Не проверено.", "24% вместо шкалы до 47% — только для недавно переехавших по работе"]
      : verdict.status === "yes"
        ? [verdict.until ? `${verdict.title} включительно` : verdict.title, ""]
        : verdict.status === "maybe"
          ? ["Возможно, доступен", "— зависит от условий ниже"]
          : ["Недоступен:", lower(verdict.title)];

  return (
    <div id={compact ? undefined : "beckham-check"} className="card scroll-mt-24 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => set({ checkOpen: !open })}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.03] sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">Ley Beckham — доступен ли вам?</span>
          <span className="mt-0.5 block text-xs leading-snug text-ink-3">
            <span className={`font-medium ${STATUS_CLS[verdict.status]}`}>{statusWord}</span> {statusRest}
          </span>
        </span>
        {!compact && verdict.status !== "no" && Math.abs(gain) >= 0.5 && (
          <span className="hidden shrink-0 text-right sm:block">
            <span className={`serif tnum block text-lg font-medium leading-tight ${gain > 0 ? "text-ink" : "text-ink-3"}`}>
              {gain > 0 ? "+" : "−"}
              {n0(Math.abs(gain))} €
            </span>
            <span className="block text-[11px] text-ink-3">в месяц против {alt.regime === "employee" ? "найма" : REGIME_META[alt.regime].short}</span>
          </span>
        )}
        <motion.svg animate={{ rotate: open ? 180 : 0 }} viewBox="0 0 20 20" className="size-4 shrink-0 text-accent" aria-hidden>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
              <ol className="space-y-4">
                <AnimatePresence initial={false}>
                  {questions.map((q, i) => (
                    <motion.li
                      key={q.key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <div className="flex gap-2.5">
                        <span className="serif tnum mt-px w-4 shrink-0 text-sm text-ink-3">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug text-ink">{q.title}</div>
                          {q.hint && <div className="mt-0.5 text-xs text-ink-3">{q.hint}</div>}
                          <div role="group" aria-label={q.title} className="mt-2 flex flex-wrap gap-1.5">
                            {q.options.map((o) => {
                              const on = answers[q.key] === o.value;
                              return (
                                <motion.button
                                  key={o.value}
                                  type="button"
                                  aria-pressed={on}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => answer(q.key, o.value)}
                                  className={`tnum rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                                    on ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink/40 hover:text-ink"
                                  }`}
                                >
                                  {o.label}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${verdict.status}-${verdict.title}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className={`mt-5 rounded-[10px] border p-4 ${
                    verdict.status === "yes"
                      ? "border-ok/30 bg-ok/[0.06]"
                      : verdict.status === "no"
                        ? "border-f-tax/30 bg-f-tax/[0.05]"
                        : verdict.status === "maybe"
                          ? "border-f-you/40 bg-f-you/[0.06]"
                          : "border-line bg-surface-2/50"
                  }`}
                  aria-live="polite"
                >
                  <div className="text-sm font-semibold text-ink">
                    {verdict.status === "unknown" ? "Как это влияет на расчёт" : verdict.status === "yes" && verdict.until ? `${verdict.title} включительно` : verdict.title}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                    {verdict.status === "unknown"
                      ? "Пока нет ответа, Beckham показан в сравнении как условный вариант и не становится «лучшим». Ответьте на вопросы — расчёт пересчитается."
                      : verdict.text}
                  </p>
                  {verdict.status !== "unknown" && (
                    <p className="mt-2 text-xs text-ink-3">
                      {verdict.status === "yes"
                        ? "Beckham участвует в расчёте наравне с другими режимами."
                        : verdict.status === "no"
                          ? "Beckham убран из выбора лучшего режима и показан бледным — только для сравнения."
                          : "Beckham показан как условный вариант и не считается лучшим."}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {verdict.sources.map((s) => (
                      <SourceChip key={s} id={s} />
                    ))}
                    {Object.values(answers).some((v) => v !== null) && (
                      <button
                        type="button"
                        onClick={() => set({ beckham: EMPTY_BECKHAM })}
                        className="ml-auto text-xs font-medium text-ink-3 underline-offset-4 transition hover:text-ink hover:underline"
                      >
                        Сбросить ответы
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
