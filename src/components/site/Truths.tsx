"use client";

import { motion } from "motion/react";
import { P } from "@/lib/tax/params-2026";
import { n0, n2 } from "@/lib/format";

const retaMin = P.ss.reta.tramos[0][2] * P.ss.reta.rate;
const retaTop = P.ss.reta.tramos[P.ss.reta.tramos.length - 1][2] * P.ss.reta.rate;
const societario = P.ss.reta.societarioMinBase * P.ss.reta.rate;
const employer = Object.values(P.ss.employer).reduce((a, b) => a + b, 0);

const TRUTHS = [
  {
    kicker: "Найм",
    title: `Работодатель платит за вас ещё ${(employer * 100).toFixed(2).replace(".", ",")}%`,
    text: `Эти взносы не видны в брутто, но входят в ваш «ценник» для компании. Поэтому честное сравнение — при одинаковом бюджете компании, а не при одинаковом брутто. Зато найм даёт то, чего нет в таблице: оплачиваемый отпуск, больничный, пособие по безработице и выходное пособие.`,
  },
  {
    kicker: "Autónomo",
    title: `Cuota — от ${n2(retaMin)} до ${n2(retaTop)} €/мес`,
    text: "С 2023 года взнос зависит от реального дохода: 15 трамо, в 2026 году таблицы заморожены на уровне 2025-го, общая ставка 31,5%. Весь год платите по своему прогнозу, после декларации Seguridad Social пересчитает взнос. Tarifa plana 80 € (+ MEI) действует только первые 12 месяцев.",
  },
  {
    kicker: "Своя SL",
    title: "Дивиденды вместо вознаграждения — налоговый риск",
    text: `Если компания продаёт ваш личный профессиональный труд, Hacienda ждёт, что вознаграждение вам составит ≥ 75% прибыли до него (art. 18.6 LIS). Плюс минимальная cuota autónomo societario с 2026 года — ${n2(societario)} €/мес и бухгалтерия 1,5–3 тыс. € в год. SL начинает окупаться только на высоких доходах.`,
  },
  {
    kicker: "Ley Beckham",
    title: `24% до ${n0(600000)} € — но не для всех`,
    text: "Нужно не быть налоговым резидентом Испании 5 лет подряд перед переездом и переехать ради работы по найму (можно удалённой), должности администратора или стартапа с сертификатом ENISA. Обычному autónomo режим недоступен. Вычетов нет совсем, даже взносы в Seguridad Social не уменьшают базу.",
  },
  {
    kicker: "Регион решает",
    title: "Половина IRPF — региональная",
    text: "Шкала IRPF — это сумма государственной и региональной. В 2026 году Валенсия и Эстремадура снизили свои ставки, Мадрид, Галисия, Андалусия, Астурия, Канары, Валенсия и частично Балеары используют собственные минимумы. Всё это учтено для 15 регионов общего режима.",
  },
  {
    kicker: "Чего здесь нет",
    title: "Честно о границах модели",
    text: "Региональные вычеты (аренда, рождение ребёнка, спорт…), вычет для работающих матерей, пенсионные планы, доходы от аренды и инвестиций, IVA, Ceuta/Melilla, Страна Басков и Наварра. Autónomo без учёта art. 32.2.2º (для одного клиента). Всё это может сдвинуть итог на сотни евро.",
  },
];

export function Truths() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {TRUTHS.map((t, i) => (
        <motion.article
          key={t.kicker}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="card relative p-6"
        >
          <div className="eyebrow">{t.kicker}</div>
          <h3 className="serif mt-3 text-[22px] font-medium leading-snug tracking-tight text-ink">{t.title}</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{t.text}</p>
        </motion.article>
      ))}
    </div>
  );
}
