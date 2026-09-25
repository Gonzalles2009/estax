// useGrouping: "always" — чтобы 1 328 и 13 280 выглядели одинаково (по умолчанию ru-RU не делит четырёхзначные)
const eur0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0, useGrouping: "always" });
const eur2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });

/** 12 345 */
export const n0 = (x: number) => eur0.format(Math.round(x));
/** 12 345,67 */
export const n2 = (x: number) => eur2.format(x);
/** 12 345 € */
export const eur = (x: number) => `${n0(x)} €`;
/** +1 234 € / −1 234 € */
export const signedEur = (x: number) => `${x > 0.5 ? "+" : x < -0.5 ? "−" : ""}${n0(Math.abs(x))} €`;
/** 34,5% */
export const pct = (x: number, digits = 1) =>
  `${(x * 100).toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
/** 70k */
export const kEur = (x: number) => (x >= 1000 ? `${n0(x / 1000)}k` : n0(x));
