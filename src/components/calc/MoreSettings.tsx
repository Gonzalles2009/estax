"use client";

import { useShallow } from "zustand/react/shallow";
import { useCalc } from "@/store/calc";
import { n0 } from "@/lib/format";
import { RangeField, Segmented, Switch } from "@/components/ui/controls";

export function MoreSettings({ bare = false }: { bare?: boolean }) {
  const s = useCalc(
    useShallow((st) => ({
      basis: st.employeeBasis,
      workExpenses: st.workExpenses,
      gestoriaAutonomo: st.gestoriaAutonomo,
      gestoriaSl: st.gestoriaSl,
      slNewCompany: st.slNewCompany,
      slTarifaPlana: st.slTarifaPlana,
      noAlimony: st.noAlimony,
      singleWithTwo: st.family === "single" && st.children === 2,
      set: st.set,
    })),
  );

  return (
    <div className={`@container ${bare ? "" : "card mt-6 p-5 sm:p-7"}`}>
      <div className="grid gap-x-10 gap-y-7 @xl:grid-cols-2">
        <div>
          <div className="eyebrow mb-2">Для найма сумма — это</div>
          <Segmented
            label="Что означает сумма для наёмной работы"
            size="sm"
            value={s.basis}
            onChange={(v) => s.set({ employeeBasis: v })}
            options={[
              { value: "cost", label: "бюджет компании", hint: "Честное сравнение: сколько тратит работодатель" },
              { value: "gross", label: "брутто-зарплата", hint: "Как в оффере: salario bruto anual" },
            ]}
          />
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            {s.basis === "cost"
              ? "Одинаковые деньги от компании или клиентов для всех режимов. Работодатель платит ≈32% взносов сверх брутто — они вычитаются из этой суммы."
              : "Сумма из оффера. Работодатель платит сверх неё ещё ≈32% взносов, поэтому такое сравнение занижает autónomo и SL."}
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
          hint="Ваши собственные траты на работу: ноутбук, софт, связь, коворкинг. Они уходят из вашего кармана в любом режиме, но autónomo и SL вычитают их из налоговой базы — в этом их экономия. По умолчанию 0, как в обычном зарплатном калькуляторе."
        />

        <RangeField
          label="Гестория autónomo"
          value={s.gestoriaAutonomo}
          onChange={(v) => s.set({ gestoriaAutonomo: v })}
          min={0}
          max={200}
          step={5}
          format={(v) => `${n0(v)} €/мес`}
          hint="Типично 40–90 €/мес: квартальные 130 и 303, годовая декларация."
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

        <div className="@xl:col-span-2">
          <Switch
            checked={s.slNewCompany}
            onChange={(v) => s.set({ slNewCompany: v })}
            label="SL — новая компания (налог на прибыль 15%)"
            hint="Первый год с прибылью и следующий (art. 29.1 LIS). Не положено, если ту же работу вы в прошлом году делали как autónomo."
          />
        </div>
        <div className="@xl:col-span-2">
          <Switch
            checked={s.slTarifaPlana}
            onChange={(v) => s.set({ slTarifaPlana: v })}
            label="SL — ваши первые 12 месяцев в RETA (tarifa plana 80 €)"
            hint="Для socio, который не был в RETA последние два года (art. 38 ter.9 LETA). Для обычного autónomo то же самое — режим «Autónomo · первый год»."
          />
        </div>
        {s.singleWithTwo && (
          <div className="@xl:col-span-2">
            <Switch
              checked={s.noAlimony}
              onChange={(v) => s.set({ noAlimony: v })}
              label="Не получаю алименты на детей"
              hint="Одинокому родителю с 2 детьми без права на алименты положен вычет 1 200 € в год (art. 81 bis LIRPF)."
            />
          </div>
        )}
        <p className="text-xs text-ink-3 @xl:col-span-2">Страна Басков и Наварра не поддерживаются: у них собственный IRPF.</p>
      </div>
    </div>
  );
}
