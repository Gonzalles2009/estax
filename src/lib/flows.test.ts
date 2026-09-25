import { describe, expect, test } from "vitest";
import { calculateAll, REGIME_IDS } from "./tax/engine";
import { flowsOf } from "./flows";
import { DEFAULTS, inputsOf } from "./defaults";
import type { Inputs } from "./tax/types";

const base = inputsOf(DEFAULTS);

describe("поток денег", () => {
  const variants: Partial<Inputs>[] = [
    {},
    { employeeBasis: "gross" },
    { workExpenses: 600, family: "couple_joint", children: 2 },
    // Многодетные: вычет art. 81 bis больше налога — появляется выплата Hacienda
    { family: "single", children: 5, childrenUnder3: 1 },
  ];
  for (const v of variants) {
    for (const budget of [15000, 30000, 70000, 150000, 400000]) {
      test(`${JSON.stringify(v)} @ ${budget}: всё, что вошло в узел, из него вышло`, () => {
        for (const r of calculateAll(REGIME_IDS, { ...base, ...v, budget })) {
          const g = flowsOf(r);
          if (g.invalid) continue;
          const root = g.nodes[0].id;
          const inflow = (id: string) => g.links.filter((l) => l.target === id).reduce((a, l) => a + l.value, 0);
          const outflow = (id: string) => g.links.filter((l) => l.source === id).reduce((a, l) => a + l.value, 0);
          // Корень = бюджет (или брутто при сравнении по брутто)
          expect(outflow(root), r.regime).toBeCloseTo(r.meta.grossSalary && root === "gross" ? r.meta.grossSalary : budget, 0);
          for (const n of g.nodes) {
            if (n.id === root) continue;
            // Выплата Hacienda — второй источник: всё, что из неё вышло, равно benefit
            if (n.id === "refund") {
              expect(outflow(n.id), `${r.regime}.refund`).toBeCloseTo(r.breakdown.benefit ?? 0, 0);
              continue;
            }
            if (n.terminal) expect(inflow(n.id), `${r.regime}.${n.id}`).toBeCloseTo(g.totals[n.id as keyof typeof g.totals], 0);
            else expect(outflow(n.id), `${r.regime}.${n.id}`).toBeCloseTo(inflow(n.id), 0);
          }
        }
      });
    }
  }
});
