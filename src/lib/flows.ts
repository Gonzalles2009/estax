import type { RegimeResult } from "./tax/types";

export type TerminalId = "you" | "tax" | "ss" | "cost";
export type FlowNodeId = "budget" | "gross" | "income" | "company" | "salary" | "div" | "refund" | TerminalId;

export interface FlowNode {
  id: FlowNodeId;
  label: string;
  terminal: boolean;
}

export interface FlowLink {
  source: FlowNodeId;
  target: FlowNodeId;
  value: number;
  /** Что это за деньги — для подсказки */
  label: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  links: FlowLink[];
  /** Итог по конечным получателям, € в год */
  totals: Record<TerminalId, number>;
  /** Модель не укладывается в поток (например, убыток) */
  invalid?: string;
}

export const TERMINALS: { id: TerminalId; label: string; color: string; hint: string }[] = [
  { id: "you", label: "Вам", color: "var(--f-you)", hint: "Остаётся на жизнь после всего" },
  { id: "tax", label: "Hacienda", color: "var(--f-tax)", hint: "IRPF, налог на прибыль и дивиденды" },
  { id: "ss", label: "Seguridad Social", color: "var(--f-ss)", hint: "Ваши взносы и взносы работодателя" },
  { id: "cost", label: "Расходы", color: "var(--f-cost)", hint: "Рабочие расходы и бухгалтерия" },
];

const ORDER: FlowNodeId[] = ["budget", "gross", "income", "company", "salary", "div", "refund", "you", "tax", "ss", "cost"];
export const nodeOrder = (id: FlowNodeId) => ORDER.indexOf(id);

/**
 * Раскладывает результат режима на потоки «кто сколько получает».
 * Сумма потоков в конечные узлы всегда равна бюджету — это проверяется тестом движка.
 */
export function flowsOf(r: RegimeResult): FlowGraph {
  const b = r.breakdown;
  const costs = b.expenses + b.gestoria;
  // Вычет art. 81 bis сверх налога: Hacienda доплачивает — отдельный источник денег
  const benefit = b.benefit ?? 0;
  const links: FlowLink[] = [];
  const nodes: FlowNode[] = [];
  const add = (id: FlowNodeId, label: string) => nodes.push({ id, label, terminal: false });
  const link = (source: FlowNodeId, target: FlowNodeId, value: number, label: string) => {
    if (value > 0.5) links.push({ source, target, value, label });
  };

  switch (r.regime) {
    case "employee":
    case "beckham": {
      const gross = r.meta.grossSalary ?? r.budget;
      if (b.ssEmployer > 0.5) {
        add("budget", "Бюджет компании");
        add("gross", "Брутто");
        link("budget", "ss", b.ssEmployer, "Взносы работодателя");
        link("budget", "gross", gross, "Брутто-зарплата");
      } else {
        add("gross", "Брутто");
      }
      link("gross", "ss", b.ssWorker, "Ваши взносы");
      link("gross", "tax", b.irpf, r.regime === "beckham" ? "IRPF по Beckham" : "IRPF");
      link("gross", "cost", costs, "Рабочие расходы");
      link("gross", "you", b.net - benefit, "Остаётся вам");
      break;
    }
    case "autonomo":
    case "autonomo_new": {
      add("budget", "Выручка");
      add("income", "Доход до налогов");
      link("budget", "cost", costs, "Расходы и гестория");
      link("budget", "income", r.budget - costs, "Доход до налогов");
      link("income", "ss", b.ssWorker, "Cuota autónomo");
      link("income", "tax", b.irpf, "IRPF");
      link("income", "you", b.net - benefit, "Остаётся вам");
      break;
    }
    case "sl_safe":
    case "sl_optimal": {
      const salary = r.meta.grossSalary ?? 0;
      const div = r.meta.dividends ?? 0;
      add("budget", "Выручка SL");
      add("company", "Результат SL");
      if (salary > 0.5) add("salary", "Вознаграждение");
      if (div > 0.5) add("div", "Дивиденды");
      link("budget", "cost", costs, "Расходы и гестория");
      link("budget", "company", r.budget - costs, "Результат компании");
      link("company", "ss", b.ssWorker, "Cuota societario");
      link("company", "tax", b.corporateTax, "Impuesto sobre Sociedades");
      link("company", "salary", salary, "Вознаграждение вам");
      link("company", "div", div, "Дивиденды");
      link("salary", "tax", b.irpf, "IRPF с вознаграждения");
      link("salary", "you", salary - b.irpf, "Вознаграждение на руки");
      link("div", "tax", b.dividendTax, "IRPF с дивидендов");
      link("div", "you", div - b.dividendTax, "Дивиденды на руки");
      break;
    }
  }

  if (benefit > 0.5) {
    add("refund", "Выплата Hacienda");
    link("refund", "you", benefit, "Вычет art. 81 bis сверх налога");
  }

  const totals: Record<TerminalId, number> = {
    you: b.net,
    tax: b.irpf + b.dividendTax + b.corporateTax,
    ss: b.ssWorker + b.ssEmployer,
    cost: costs,
  };
  for (const t of TERMINALS) {
    if (links.some((l) => l.target === t.id)) nodes.push({ id: t.id, label: t.label, terminal: true });
  }

  // Поток не может быть отрицательным: при убытке показываем объяснение вместо схемы
  let invalid: string | undefined;
  if (b.net < 0) invalid = "При такой сумме этот режим убыточен: взносы и расходы больше выручки.";
  else if (r.regime.startsWith("sl") && r.budget - costs < (r.meta.grossSalary ?? 0) + b.ssWorker - 0.5)
    invalid = "При такой сумме компании не хватает денег даже на минимальные взносы.";

  return { nodes: nodes.sort((a, b2) => nodeOrder(a.id) - nodeOrder(b2.id)), links, totals, invalid };
}
