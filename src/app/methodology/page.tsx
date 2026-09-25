import type { Metadata } from "next";
import Link from "next/link";
import { Background } from "@/components/site/Background";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { P } from "@/lib/tax/params-2026";
import { REGIONS, REGION_ORDER } from "@/lib/tax/regions-2026";
import { SOURCES } from "@/lib/tax/sources";
import type { Bracket } from "@/lib/tax/types";
import { n0, n2 } from "@/lib/format";

export const metadata: Metadata = {
  title: "Методология и источники",
  description:
    "Все ставки, шкалы и формулы калькулятора EsTax·26 с ссылками на BOE, AEAT и Seguridad Social: IRPF 2026, 15 региональных шкал, RETA, Impuesto sobre Sociedades, Ley Beckham.",
};

const rate = (r: number) => `${(r * 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%`;
const upTo = (x: number) => (x === Infinity ? "и выше" : n2(x));

function ScaleTable({ scale, caption }: { scale: readonly Bracket[]; caption?: string }) {
  return (
    <table className="w-full text-sm">
      {caption && <caption className="mb-2 text-left text-xs text-ink-3">{caption}</caption>}
      <thead>
        <tr className="text-left text-xs text-ink-3">
          <th className="py-1.5 pr-3 font-medium">База от, €</th>
          <th className="py-1.5 pr-3 font-medium">до, €</th>
          <th className="py-1.5 text-right font-medium">Ставка</th>
        </tr>
      </thead>
      <tbody className="tnum">
        {scale.map(([from, to, r]) => (
          <tr key={from} className="border-t border-line">
            <td className="py-1.5 pr-3 text-ink-2">{n2(from)}</td>
            <td className="py-1.5 pr-3 text-ink-2">{upTo(to)}</td>
            <td className="py-1.5 text-right font-medium text-ink">{rate(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Card({ title, children, source }: { title: string; children: React.ReactNode; source?: string[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="serif mb-4 text-xl font-medium tracking-tight text-ink">{title}</h3>
      {children}
      {source && (
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Источник:{" "}
          {source.map((id, i) => {
            const s = SOURCES[id as keyof typeof SOURCES];
            return (
              <span key={id}>
                {i > 0 && ", "}
                <a href={s.url} target="_blank" rel="noreferrer" className="text-ink-2 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-accent">
                  {s.short}
                </a>
              </span>
            );
          })}
        </p>
      )}
    </section>
  );
}

function H2({ id, children, lead }: { id: string; children: React.ReactNode; lead?: string }) {
  return (
    <header id={id} className="mb-6 mt-16 max-w-3xl scroll-mt-6">
      <h2 className="serif text-4xl font-medium tracking-tight text-ink">{children}</h2>
      {lead && <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{lead}</p>}
    </header>
  );
}

export default function Methodology() {
  const employee = Object.values(P.ss.employee).reduce((a, b) => a + b, 0);
  const employer = Object.values(P.ss.employer).reduce((a, b) => a + b, 0);
  const verified = new Date(P.verifiedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Background />
      <Nav />
      <main className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <header className="pb-4 pt-8">
          <Link href="/" className="text-sm text-ink-3 hover:text-ink">
            ← К калькулятору
          </Link>
          <h1 className="serif mt-6 text-5xl font-medium tracking-[-0.03em] text-ink sm:text-7xl">Методология</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-2">
            Все параметры {P.year} года, по которым считает калькулятор, с источниками. Проверено {verified} по
            консолидированным текстам BOE, страницам AEAT и Seguridad Social. Если нашли расхождение с нормой — это баг,
            откройте issue на GitHub.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2 text-sm">
            {[
              ["regimes", "Как считается каждый режим"],
              ["irpf", "IRPF"],
              ["ss", "Seguridad Social"],
              ["reta", "Cuota autónomo"],
              ["is", "Sociedades"],
              ["regions", "15 регионов"],
              ["limits", "Упрощения"],
              ["sources", "Источники"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-md border border-line px-3 py-1.5 text-ink-2 transition hover:border-line-strong hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
        </header>

        <H2
          id="regimes"
          lead="Главный принцип — одинаковая сумма на входе. Для найма это полная стоимость для работодателя (или брутто, если вы так выбрали), для autónomo и SL — выручка без IVA. Из неё вычитается всё, что уходит государству и на расходы; остаток — ваш."
        >
          Как считается каждый режим
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Работа по найму" source={["lirpf_19", "lirpf_20", "lirpf_63", "ss_bases"]}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
              <li>Брутто = бюджет − взносы работодателя {rate(employer)} (база до {n2(P.ss.maxBaseMonthly)} €/мес).</li>
              <li>Ваши взносы {rate(employee)} + взнос солидарности с части выше максимальной базы.</li>
              <li>База IRPF = брутто − взносы − reducción art. 20 (только для низких доходов) − 2 000 € «otros gastos».</li>
              <li>IRPF = гос. шкала + региональная, минус та же шкала от mínimo personal y familiar.</li>
              <li>Вычет для зарплат около SMI (DA 61ª): до 590,89 €.</li>
              <li>
                Многодетным (от 3 детей) и одинокому родителю с 2 детьми без алиментов — вычет art. 81 bis: 1 200 €, от 5 детей 2 400 €, +600 € за
                каждого ребёнка сверх минимума категории; если оба родителя работают — пополам. Он больше налога — разницу выплачивает
                Hacienda. То же для autónomo и SL, но не для Beckham.
              </li>
            </ol>
          </Card>
          <Card title="Найм + Ley Beckham" source={["lirpf_93", "rirpf_114", "rirpf_116"]}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
              <li>
                Кому доступен (проверка на главной): не были налоговым резидентом Испании 5 лет до переезда (при переезде до 2023 года —
                10 лет и только найм, перевод или должность администратора); переехали из-за работы по
                найму (в том числе удалённой на иностранного работодателя или по направлению), должности администратора, бизнеса с
                отчётом ENISA или работы на стартап; супруг и дети до 25 лет могут присоединиться (art. 93.3); подали modelo 149 в течение 6 месяцев с даты alta в Seguridad Social (члену семьи — с въезда или в срок основного заявителя). Действует в год
                переезда и ещё 5 лет. Обычному autónomo недоступен. Пока проверка не пройдена, Beckham не считается «лучшим» режимом.
              </li>
              <li>Брутто и взносы — как при найме.</li>
              <li>База = вся брутто-зарплата: по правилам IRNR (art. 24.1 TRLIRNR) не вычитаются ни взносы, ни 2 000 €, ни mínimos — подтверждено DGT V1112-25.</li>
              <li>24% до 600 000 €, 47% свыше. Региональной части нет.</li>
            </ol>
          </Card>
          <Card title="Autónomo" source={["lirpf_30", "lgss_308", "lirpf_32"]}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
              <li>Доход для cuota = рендимьенто по IRPF + сама cuota, минус 7%: (выручка − расходы − гестория − 5% difícil justificación) × 93% / 12 → трамо → минимальная база трамо × {rate(P.ss.reta.rate)}.</li>
              <li>Рендимьенто = выручка − расходы − гестория − cuota.</li>
              <li>Gastos de difícil justificación: 5% (макс. 2 000 €) — в 2026 году 5%, 7% было только в 2023.</li>
              <li>IRPF — как у найма, но без 2 000 € и без art. 20. При доходах до 12 000 € — вычет до 1 620 € (art. 32.2.3º LIRPF).</li>
              <li>
                Первый год: tarifa plana {n2(P.ss.reta.tarifaPlanaMonthly)} € (80 € + MEI) и −20% рендимьенто (art. 32.3 LIRPF). Скидки
                20% нет, если больше половины дохода приходит от прошлогоднего работодателя.
              </li>
            </ol>
          </Card>
          <Card title="Своя SL" source={["lis_18", "lis_29", "lgss_308", "lirpf_66"]}>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
              <li>Результат = выручка − расходы − гестория. Из него компания платит вам вознаграждение и вашу cuota autónomo societario.</li>
              <li>Cuota societario считается от вознаграждения + дивидендов × 97%, минимальная база с 2026 года — {n2(P.ss.reta.societarioMinBase)} €.</li>
              <li>Прибыль облагается IS {rate(P.is.micro[0][2])} до 50 000 € и {rate(P.is.micro[1][2])} свыше (microempresa); остаток — дивиденды 19–30%.</li>
              <li>Ваше вознаграждение — доход от деятельности (art. 27.1 LIRPF): 5% difícil justificación, общая шкала.</li>
              <li>Два независимых переключателя: новая SL — IS 15% в первый год с прибылью и следующий (art. 29.1 LIS); первые 12 месяцев socio в RETA — tarifa plana {n2(P.ss.reta.tarifaPlanaMonthly)} €, если он не был в RETA два года (art. 38 ter.9 LETA).</li>
              <li>«SL»: вознаграждение + cuota ≥ 75% результата и ≥ {n0(P.socioProfesional.minAbsolute)} € (art. 18.6 LIS). «SL агрессивно»: без этого ограничения. В обоих случаях калькулятор перебирает соотношение вознаграждения и дивидендов и берёт лучшее.</li>
            </ol>
          </Card>
        </div>

        <H2 id="irpf" lead="Общая база облагается суммой государственной и региональной шкал; база сбережений (дивиденды) — единой шкалой.">
          IRPF 2026
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Государственная шкала (art. 63 LIRPF)" source={["lirpf_63"]}>
            <ScaleTable scale={P.irpf.stateScale} />
          </Card>
          <Card title="Шкала сбережений, суммарно (arts. 66 и 76)" source={["lirpf_66"]}>
            <ScaleTable scale={P.irpf.savingsScaleHalf.map(([a, b, r]) => [a, b, r * 2] as const)} />
          </Card>
          <Card title="Mínimo personal y familiar (гос. часть)" source={["lirpf_56"]}>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>На себя: <b className="text-ink">{n0(P.irpf.minimos.personal)} €</b></li>
              <li>Дети (1-й, 2-й, 3-й, 4-й+): <b className="text-ink">{P.irpf.minimos.descendants.map(n0).join(" / ")} €</b></li>
              <li>Ребёнок до 3 лет: <b className="text-ink">+{n0(P.irpf.minimos.under3)} €</b></li>
              <li>Пара, подающая декларации раздельно, делит минимум на детей пополам.</li>
            </ul>
          </Card>
          <Card title="Вычеты из базы" source={["lirpf_19", "lirpf_20", "lirpf_84"]}>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>«Otros gastos» работника: <b className="text-ink">2 000 €</b></li>
              <li>Reducción art. 20: <b className="text-ink">7 302 €</b> до 14 852 €, ноль с 19 747,50 €</li>
              <li>Совместная декларация: <b className="text-ink">3 400 €</b> (пара), <b className="text-ink">2 150 €</b> (родитель-одиночка)</li>
              <li>Вычет SMI (DA 61ª, RDL 5/2026): <b className="text-ink">590,89 €</b> до 17 094 € брутто</li>
            </ul>
          </Card>
        </div>

        <H2 id="ss" lead="Orden PJC/297/2026 и RDL 3/2026. Бюджета на 2026 год нет, но ставки и базы установлены этими нормами.">
          Seguridad Social 2026
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Ставки при бессрочном контракте" source={["orden_2026", "ss_bases"]}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-3">
                  <th className="py-1.5 font-medium">Взнос</th>
                  <th className="py-1.5 text-right font-medium">Работодатель</th>
                  <th className="py-1.5 text-right font-medium">Работник</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {[
                  ["Contingencias comunes", P.ss.employer.cc, P.ss.employee.cc],
                  ["Desempleo", P.ss.employer.desempleo, P.ss.employee.desempleo],
                  ["FOGASA", P.ss.employer.fogasa, 0],
                  ["Formación profesional", P.ss.employer.fp, P.ss.employee.fp],
                  ["MEI", P.ss.employer.mei, P.ss.employee.mei],
                  ["AT/EP (CNAE 62)", P.ss.employer.atep, 0],
                ].map(([l, a, b]) => (
                  <tr key={l as string} className="border-t border-line">
                    <td className="py-1.5 text-ink-2">{l}</td>
                    <td className="py-1.5 text-right text-ink">{rate(a as number)}</td>
                    <td className="py-1.5 text-right text-ink">{rate(b as number)}</td>
                  </tr>
                ))}
                <tr className="border-t border-line-strong font-semibold">
                  <td className="py-1.5 text-ink">Итого</td>
                  <td className="py-1.5 text-right text-ink">{rate(employer)}</td>
                  <td className="py-1.5 text-right text-ink">{rate(employee)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card title="Базы и взнос солидарности" source={["rdl_3_2026", "lgss_19bis"]}>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>Максимальная база: <b className="text-ink">{n2(P.ss.maxBaseMonthly)} €/мес</b></li>
              <li>Минимальная база (группы 4–7) = SMI: <b className="text-ink">{n2(P.ss.minBaseMonthly)} €/мес</b></li>
              <li className="pt-2 text-ink-3">Солидарность — с части зарплаты выше максимальной базы (работодатель + работник):</li>
              {P.ss.solidarity.map((b, i) => (
                <li key={i}>
                  {i === 0 ? "до +10%" : i === 1 ? "от +10% до +50%" : "свыше +50%"}:{" "}
                  <b className="text-ink">{rate(b.employer)} + {rate(b.employee)}</b>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <H2 id="reta" lead={`Таблицы 2025 года заморожены на 2026 (art. 3.4 RDL 3/2026); общая ставка выросла до ${rate(P.ss.reta.rate)} из-за MEI. Калькулятор берёт минимальную базу трамо — так платит большинство.`}>
          Cuota autónomo 2026
        </H2>
        <Card title="Трамо по реальному доходу" source={["lgss_308", "orden_2026", "rdl_3_2026"]}>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-3">
                  <th className="px-2 py-1.5 font-medium">Трамо</th>
                  <th className="px-2 py-1.5 font-medium">Доход в месяц, €</th>
                  <th className="px-2 py-1.5 text-right font-medium">Мин. база</th>
                  <th className="px-2 py-1.5 text-right font-medium">Макс. база</th>
                  <th className="px-2 py-1.5 text-right font-medium">Cuota (мин.)</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {P.ss.reta.tramos.map(([from, to, min, max, label]) => (
                  <tr key={label} className="border-t border-line">
                    <td className="px-2 py-1.5 text-ink-2">{label}</td>
                    <td className="px-2 py-1.5 text-ink-2">
                      {from === -Infinity ? `до ${n2(to)}` : to === Infinity ? `свыше ${n2(from)}` : `${n2(from)} – ${n2(to)}`}
                    </td>
                    <td className="px-2 py-1.5 text-right text-ink-2">{n2(min)}</td>
                    <td className="px-2 py-1.5 text-right text-ink-2">{n2(max)}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-ink">{n2(min * P.ss.reta.rate)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Доход для трамо: рендимьенто по IRPF + сама cuota, минус 7% gastos genéricos (3% для autónomos societarios).
            Минимальная база для societarios с 2026 года — база группы 7 ({n2(P.ss.reta.societarioMinBase)} €): cuota не
            ниже {n2(P.ss.reta.societarioMinBase * P.ss.reta.rate)} €/мес.
          </p>
        </Card>

        <H2 id="is" lead="Для периодов, начинающихся в 2026 году (DT 44ª LIS). Для компании с оборотом до 1 млн € — пониженные ставки microempresa.">
          Impuesto sobre Sociedades 2026
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Ставки" source={["lis_29"]}>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>Microempresa (оборот &lt; 1 млн €): <b className="text-ink">{rate(P.is.micro[0][2])}</b> на первые 50 000 €, <b className="text-ink">{rate(P.is.micro[1][2])}</b> на остальное</li>
              <li>Empresa de reducida dimensión: <b className="text-ink">23%</b></li>
              <li>Общая ставка: <b className="text-ink">25%</b></li>
              <li>Новая компания: <b className="text-ink">15%</b> в первый год с прибылью и следующий — но не если ту же деятельность вы вели как autónomo в прошлом году (art. 29.1.b)</li>
              <li>В 2027 году microempresa — 17% / 20%.</li>
            </ul>
          </Card>
          <Card title="«Безопасная гавань» art. 18.6 LIS" source={["lis_18"]}>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>Более 75% дохода компании — от профессиональной деятельности (IT-консалтинг: IAE, группа 763).</li>
              <li>Вознаграждение socios-profesionales ≥ <b className="text-ink">75%</b> результата до этого вознаграждения.</li>
              <li>И не меньше 1,5 зарплаты сотрудников на похожей должности или, если таких нет, <b className="text-ink">5 × IPREM</b> = 5 × 7 200 € = {n0(P.socioProfesional.minAbsolute)} € (IPREM anual 2026, DA 90ª Ley 31/2022).</li>
            </ul>
          </Card>
        </div>

        <H2 id="regions" lead="Региональные шкалы 2026 года и собственные минимумы. Валенсия (Ley 5/2026) и Эстремадура (Ley 2/2026) снизили ставки с 1 января 2026 года; Астурия и Канары обновили шкалы с 2025 года.">
          15 регионов общего режима
        </H2>
        <div className="grid gap-4 md:grid-cols-2">
          {REGION_ORDER.map((id) => {
            const r = REGIONS[id];
            return (
              <details key={id} className="card group p-5 open:pb-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span>
                    <span className="serif block text-lg font-medium text-ink">{r.name}</span>
                    <span className="tnum mt-0.5 block text-xs text-ink-3">
                      {rate(r.scale[0][2])} → {rate(r.scale[r.scale.length - 1][2])} · {r.scale.length} ступеней
                      {r.minimos ? " · свои минимумы" : ""}
                    </span>
                  </span>
                  <svg viewBox="0 0 20 20" className="size-4 text-ink-3 transition group-open:rotate-180" aria-hidden>
                    <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </summary>
                <div className="mt-4">
                  <ScaleTable scale={r.scale} />
                  {r.minimos && (
                    <p className="mt-3 text-xs leading-relaxed text-ink-2">
                      Свои минимумы: на себя {n2(r.minimos.personal)} €; дети {r.minimos.descendants.map(n2).join(" / ")} €; до 3 лет +{n2(r.minimos.under3)} €.
                    </p>
                  )}
                  {r.note && <p className="mt-2 text-xs leading-relaxed text-ink-3">{r.note}</p>}
                  <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-ink-2 underline decoration-[var(--line-strong)] underline-offset-4 hover:text-accent">
                    Текст закона в BOE ↗
                  </a>
                </div>
              </details>
            );
          })}
        </div>

        <H2 id="limits" lead="Модель честно считает главное, но не всё. Вот что сознательно не учтено.">
          Упрощения и допущения
        </H2>
        <div className="card p-5 sm:p-6">
          <ul className="grid gap-x-8 gap-y-3 text-sm leading-relaxed text-ink-2 md:grid-cols-2">
            <li>Региональные вычеты (аренда, рождение детей, учёба, спорт и т.д.) и государственный вычет для работающих матерей (art. 81) не учтены. Вычет для многодетных (art. 81 bis) учтён; вычеты на детей и родственников с инвалидностью — нет.</li>
            <li>Доходы только из одного источника; нет аренды, инвестиций, пенсионных планов, ипотеки до 2013 года.</li>
            <li>Autónomo платит по минимальной базе своего трамо. Сокращение art. 32.2.2º (один клиент / TRADE) не применяется; вычет art. 32.2.3º для доходов до 12 000 € — применяется.</li>
            <li>Для найма — бессрочный контракт, CNAE 62 (AT/EP 1,50%), 12 или 14 выплат — неважно, считаем год.</li>
            <li>SL распределяет всю прибыль как дивиденды в том же году. Реальная SL может копить прибыль и откладывать налог на дивиденды.</li>
            <li>IVA не влияет на результат: autónomo и SL собирают его с клиентов и передают государству.</li>
            <li>Не поддерживаются Страна Басков и Наварра (свой IRPF), а также льготы Ceuta, Melilla и La Palma.</li>
            <li>Beckham — только для работы по найму; дивиденды и прирост капитала не моделируются.</li>
          </ul>
        </div>

        <H2 id="sources">Источники</H2>
        <ul className="grid gap-2 md:grid-cols-2">
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="card flex items-start justify-between gap-3 p-4 text-sm text-ink-2 transition hover:text-ink">
                <span>{s.title}</span>
                <span className="text-ink-3">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
