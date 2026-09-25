"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useCalc } from "@/store/calc";
import { REGION_ORDER, REGIONS } from "@/lib/tax/regions-2026";
import type { Family, RegionId } from "@/lib/tax/types";
import { FieldLabel, RangeField, Segmented, Stepper, Switch } from "@/components/ui/controls";
import { n0 } from "@/lib/format";

export function Settings() {
  const s = useCalc();
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Где вы живёте</FieldLabel>
        <div className="relative">
          <select
            aria-label="Автономное сообщество"
            value={s.region}
            onChange={(e) => s.set({ region: e.target.value as RegionId })}
            className="w-full appearance-none rounded-2xl border border-line bg-ink-2/80 px-4 py-3 pr-10 text-sm font-medium text-fg outline-none transition hover:border-line-strong focus:border-sun/60"
          >
            {REGION_ORDER.map((id) => (
              <option key={id} value={id} className="bg-panel">
                {REGIONS[id].name}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-3"
          >
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-1.5 text-xs text-fg-3">Страна Басков и Наварра не поддерживаются: у них собственный IRPF.</p>
      </div>

      <div>
        <FieldLabel>Семья</FieldLabel>
        <Segmented<Family>
          label="Семейное положение"
          size="sm"
          value={s.family}
          onChange={(v) => s.set({ family: v })}
          options={[
            { value: "single", label: "Один", hint: "Один или одна; дети живут с вами" },
            { value: "couple", label: "Пара · 2 дохода", hint: "Каждый подаёт декларацию сам" },
            { value: "couple_joint", label: "Пара · 1 доход", hint: "Супруг(а) без дохода, совместная декларация" },
          ]}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-fg-2">Детей до 25 лет</span>
          <Stepper label="Дети" value={s.children} onChange={(v) => s.set({ children: v })} max={6} />
        </div>
        <AnimatePresence initial={false}>
          {s.children > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-fg-2">Из них младше 3 лет</span>
                <Stepper
                  label="Дети до 3 лет"
                  value={s.childrenUnder3}
                  onChange={(v) => s.set({ childrenUnder3: v })}
                  max={Math.min(3, s.children)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-2 text-xs leading-relaxed text-fg-3">
          {s.family === "couple"
            ? "Каждый подаёт декларацию сам — минимум на детей делится пополам."
            : s.family === "couple_joint"
              ? "Совместная декларация: −3 400 € из налоговой базы."
              : s.children > 0
                ? "Родитель-одиночка: совместная декларация с детьми даёт −2 150 € из базы."
                : "Индивидуальная декларация."}
        </p>
      </div>

      <RangeField
        label="Рабочие расходы"
        value={s.workExpenses}
        onChange={(v) => s.set({ workExpenses: v })}
        min={0}
        max={1500}
        step={10}
        format={(v) => `${n0(v)} €/мес`}
        hint="Ноутбук, связь, софт, коворкинг. Тратятся в любом режиме, но вычесть их из налоговой базы могут только autónomo и SL."
      />

      <div className="rounded-2xl border border-line">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
          className="flex w-full items-center justify-between px-4 py-3 text-sm text-fg-2 transition hover:text-fg"
        >
          Тонкая настройка
          <motion.svg animate={{ rotate: advanced ? 180 : 0 }} viewBox="0 0 20 20" className="size-4">
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </motion.svg>
        </button>
        <AnimatePresence initial={false}>
          {advanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-line px-4 py-4">
                <RangeField
                  label="Гестория autónomo"
                  value={s.gestoriaAutonomo}
                  onChange={(v) => s.set({ gestoriaAutonomo: v })}
                  min={0}
                  max={200}
                  step={5}
                  format={(v) => `${n0(v)} €/мес`}
                  hint="Типично 40–90 €/мес: квартальные 130/303, годовая декларация."
                />
                <RangeField
                  label="Гестория SL"
                  value={s.gestoriaSl}
                  onChange={(v) => s.set({ gestoriaSl: v })}
                  min={0}
                  max={500}
                  step={10}
                  format={(v) => `${n0(v)} €/мес`}
                  hint="Типично 120–250 €/мес: бухгалтерия, nóminas, IS, годовой отчёт в Registro Mercantil."
                />
                <Switch
                  checked={s.slNewCompany}
                  onChange={(v) => s.set({ slNewCompany: v })}
                  label="SL — новая компания"
                  hint="Impuesto sobre Sociedades 15% в первый год с прибылью и следующий (art. 29.1 LIS)."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
