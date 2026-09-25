import type { Bracket, RegionId } from "./types";

const INF = Number.POSITIVE_INFINITY;

export interface Region {
  name: string;
  /** Escala autonómica general 2026 */
  scale: readonly Bracket[];
  /** Собственные mínimos, если регион их установил; иначе — государственные */
  minimos?: { personal: number; descendants: readonly number[]; under3: number };
  /** Где проверено и что важно знать */
  note?: string;
  sourceUrl: string;
}

export const REGIONS: Record<RegionId, Region> = {
  andalucia: {
    name: "Andalucía",
    scale: [
      [0, 13000, 0.095],
      [13000, 21100, 0.12],
      [21100, 35200, 0.15],
      [35200, 60000, 0.185],
      [60000, INF, 0.225],
    ],
    minimos: { personal: 5790, descendants: [2510, 2820, 4170, 4700], under3: 2920 },
    note: "Ley 5/2021, art. 23 и 23 bis (свои минимумы). Снижение ставок объявлено только с 2027.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2021-17915",
  },
  aragon: {
    name: "Aragón",
    scale: [
      [0, 13072.5, 0.095],
      [13072.5, 21210, 0.12],
      [21210, 36960, 0.15],
      [36960, 52500, 0.185],
      [52500, 60000, 0.205],
      [60000, 80000, 0.23],
      [80000, 90000, 0.24],
      [90000, 130000, 0.25],
      [130000, INF, 0.255],
    ],
    note: "DLeg 1/2005, art. 110-1 (Ley 17/2023). Снижение объявлено с 2027.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOA-d-2005-90006",
  },
  asturias: {
    name: "Asturias",
    scale: [
      [0, 12450, 0.09],
      [12450, 17707.2, 0.12],
      [17707.2, 33007.2, 0.14],
      [33007.2, 53407.2, 0.192],
      [53407.2, 70000, 0.215],
      [70000, 90000, 0.225],
      [90000, 175000, 0.25],
      [175000, INF, 0.26],
    ],
    minimos: { personal: 6105, descendants: [2640, 2970, 4400, 4950], under3: 3080 },
    note: "Ley 3/2025 (BOPA 02.12.2025) — новая шкала и свои минимумы с 2025 года.",
    sourceUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-25707",
  },
  baleares: {
    name: "Illes Balears",
    scale: [
      [0, 10000, 0.09],
      [10000, 18000, 0.1125],
      [18000, 30000, 0.1425],
      [30000, 48000, 0.175],
      [48000, 70000, 0.19],
      [70000, 90000, 0.2175],
      [90000, 120000, 0.2275],
      [120000, 175000, 0.2375],
      [175000, INF, 0.2475],
    ],
    minimos: { personal: 5550, descendants: [2400, 2970, 4400, 4950], under3: 2800 },
    note: "TR DLeg 1/2014, art. 1 (Ley 12/2023); минимум на 2-го и следующих детей +10%.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-6925",
  },
  canarias: {
    name: "Canarias",
    scale: [
      [0, 13748, 0.09],
      [13748, 19422, 0.115],
      [19422, 35924, 0.14],
      [35924, 57566, 0.185],
      [57566, 93268, 0.235],
      [93268, 123745, 0.25],
      [123745, INF, 0.26],
    ],
    minimos: { personal: 5606, descendants: [2424, 2727, 4040, 4545], under3: 2828 },
    note: "Ley 9/2025, DF 11ª — дефлированная шкала с 01.01.2025; минимумы art. 18 quater.",
    sourceUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7560",
  },
  cantabria: {
    name: "Cantabria",
    scale: [
      [0, 13000, 0.085],
      [13000, 21000, 0.11],
      [21000, 35200, 0.145],
      [35200, 60000, 0.18],
      [60000, 90000, 0.225],
      [90000, INF, 0.245],
    ],
    note: "DLeg 62/2008, art. 1 (Ley 3/2023).",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOCT-c-2008-90028",
  },
  castilla_la_mancha: {
    name: "Castilla-La Mancha",
    scale: [
      [0, 12450, 0.095],
      [12450, 20200, 0.12],
      [20200, 35200, 0.15],
      [35200, 60000, 0.185],
      [60000, INF, 0.225],
    ],
    note: "Ley 8/2013, art. 13 bis — без изменений с 2015.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-1368",
  },
  castilla_y_leon: {
    name: "Castilla y León",
    scale: [
      [0, 12450, 0.09],
      [12450, 20200, 0.12],
      [20200, 35200, 0.14],
      [35200, 53407.2, 0.185],
      [53407.2, INF, 0.215],
    ],
    note: "DLeg 1/2013, art. 1 (Ley 2/2022). Снижение первой ставки объявлено только на 2027.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOCL-h-2013-90254",
  },
  cataluna: {
    name: "Catalunya",
    scale: [
      [0, 12500, 0.095],
      [12500, 22000, 0.125],
      [22000, 33000, 0.16],
      [33000, 53000, 0.19],
      [53000, 90000, 0.215],
      [90000, 120000, 0.235],
      [120000, 175000, 0.245],
      [175000, INF, 0.255],
    ],
    note: "DLeg 1/2024, art. 611-1 (Decret-llei 5/2025, с 2025 года). Llei 11/2026 шкалу не меняла.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2024-6951",
  },
  extremadura: {
    name: "Extremadura",
    scale: [
      [0, 12450, 0.0775],
      [12450, 20200, 0.0975],
      [20200, 24200, 0.16],
      [24200, 35200, 0.175],
      [35200, 60000, 0.21],
      [60000, 80200, 0.235],
      [80200, 99200, 0.24],
      [99200, 120200, 0.245],
      [120200, INF, 0.25],
    ],
    note: "Ley 2/2026 (Presupuestos 2026), DF 2ª — новая шкала с 01.01.2026.",
    sourceUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-17839",
  },
  galicia: {
    name: "Galicia",
    scale: [
      [0, 12985.35, 0.09],
      [12985.35, 21068.6, 0.1165],
      [21068.6, 35200, 0.149],
      [35200, 60000, 0.184],
      [60000, INF, 0.225],
    ],
    minimos: { personal: 5789, descendants: [2503, 2816, 4172, 4694], under3: 2920 },
    note: "DLeg 1/2011, art. 4 и 4 bis (свои минимумы).",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-18161",
  },
  madrid: {
    name: "Comunidad de Madrid",
    scale: [
      [0, 13362.22, 0.085],
      [13362.22, 19004.63, 0.107],
      [19004.63, 35425.68, 0.128],
      [35425.68, 57320.4, 0.174],
      [57320.4, INF, 0.205],
    ],
    minimos: { personal: 5956.65, descendants: [2575.85, 2897.83, 4400, 4950], under3: 3005.16 },
    note: "DLeg 1/2010, art. 1 и 2–2 quater (Ley 13/2023). Снижение на 0,5 п.п. объявлено только на 2027.",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOCM-m-2010-90068",
  },
  murcia: {
    name: "Región de Murcia",
    scale: [
      [0, 12450, 0.095],
      [12450, 20200, 0.112],
      [20200, 34000, 0.133],
      [34000, 60000, 0.179],
      [60000, INF, 0.225],
    ],
    note: "DLeg 1/2010, art. 2 (Ley 14/2018).",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2011-10542",
  },
  rioja: {
    name: "La Rioja",
    scale: [
      [0, 12450, 0.08],
      [12450, 20200, 0.106],
      [20200, 35200, 0.136],
      [35200, 40000, 0.178],
      [40000, 50000, 0.183],
      [50000, 60000, 0.19],
      [60000, 120000, 0.245],
      [120000, INF, 0.27],
    ],
    note: "Ley 10/2017, art. 31 (Ley 13/2023). Автодефляция Ley 9/2025 в 2026 не сработала (IPC 2,6%).",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-2017-13750",
  },
  valencia: {
    name: "Comunitat Valenciana",
    scale: [
      [0, 12000, 0.088],
      [12000, 22000, 0.117],
      [22000, 32000, 0.146],
      [32000, 42000, 0.17],
      [42000, 52000, 0.194],
      [52000, 62000, 0.219],
      [62000, 72000, 0.244],
      [72000, 100000, 0.261],
      [100000, 150000, 0.2735],
      [150000, 200000, 0.2835],
      [200000, INF, 0.2935],
    ],
    minimos: { personal: 6105, descendants: [2640, 2970, 4400, 4950], under3: 3080 },
    note: "Ley 5/2026 (DOGV 10.08.2026), art. 18 — новая шкала с 01.01.2026; минимумы art. 2 bis Ley 13/1997.",
    sourceUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-19331",
  },
};

export const REGION_ORDER: RegionId[] = [
  "madrid",
  "cataluna",
  "valencia",
  "andalucia",
  "baleares",
  "canarias",
  "aragon",
  "asturias",
  "cantabria",
  "castilla_la_mancha",
  "castilla_y_leon",
  "extremadura",
  "galicia",
  "murcia",
  "rioja",
];
