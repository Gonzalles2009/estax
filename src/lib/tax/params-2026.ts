import type { Bracket } from "./types";

const INF = Number.POSITIVE_INFINITY;

/**
 * Параметры 2026 года. Каждое значение сверено с источником из sources.ts.
 */
export const P = {
  year: 2026,
  verifiedAt: "2026-09-25",

  irpf: {
    /** Escala general estatal, art. 63.1 LIRPF */
    stateScale: [
      [0, 12450, 0.095],
      [12450, 20200, 0.12],
      [20200, 35200, 0.15],
      [35200, 60000, 0.185],
      [60000, 300000, 0.225],
      [300000, INF, 0.245],
    ] as readonly Bracket[],

    /** Escala del ahorro — половина (гос. и региональная части одинаковы), arts. 66 и 76 LIRPF */
    savingsScaleHalf: [
      [0, 6000, 0.095],
      [6000, 50000, 0.105],
      [50000, 200000, 0.115],
      [200000, 300000, 0.135],
      [300000, INF, 0.15],
    ] as readonly Bracket[],

    /** arts. 57–58 LIRPF */
    minimos: {
      personal: 5550,
      descendants: [2400, 2700, 4000, 4500] as readonly number[],
      under3: 2800,
    },

    /** art. 19.2.f LIRPF */
    otrosGastosTrabajo: 2000,

    /**
     * art. 20 LIRPF (redacción RDL 4/2024). Порог считается по RN до вычета 2 000 € «otros gastos»
     * (AEAT, Manual Renta 2025, fase 3).
     */
    workReduction: {
      max: 7302,
      t1: 14852,
      t2: 17673.52,
      t3: 19747.5,
      k1: 1.75,
      mid: 2364.34,
      k2: 1.14,
      otherIncomeLimit: 6500,
    },

    /**
     * Deducción por obtención de rendimientos del trabajo (DA 61ª LIRPF, redacción RDL 5/2026):
     * 590,89 € при брутто ≤ 17 094 €, далее −0,2 × превышение, ноль при 20 048,45 €.
     */
    smiDeduction: { max: 590.89, t1: 17094, t2: 20048.45, k: 0.2, otherIncomeLimit: 6500 },

    /** art. 84.2 LIRPF */
    jointReduction: { married: 3400, singleParent: 2150 },

    /** art. 30.2.4ª LIRPF + art. 30 RIRPF */
    dificilJustificacion: { rate: 0.05, cap: 2000 },

    /** art. 32.3 LIRPF */
    inicioActividad: { rate: 0.2, cap: 100000 },

    /**
     * art. 93 LIRPF: база = брутто без вычетов (art. 24.1 TRLIRNR) — соцвзносы не вычитаются
     * (DGT V1112-25), 2 000 € и mínimos не применяются.
     */
    beckham: {
      scale: [
        [0, 600000, 0.24],
        [600000, INF, 0.47],
      ] as readonly Bracket[],
    },
  },

  ss: {
    /** art. 3.1 RDL 3/2026, Orden PJC/297/2026 arts. 2–3 */
    maxBaseMonthly: 5101.2,
    /** Grupos 4–7 = SMI 2026 (RD 126/2026: 1 221 € × 14) */
    minBaseMonthly: 1424.4,
    /** Доля работника (contrato indefinido), Orden PJC/297/2026 */
    employee: { cc: 0.047, desempleo: 0.0155, fp: 0.001, mei: 0.0015 },
    /** Доля работодателя; AT/EP для CNAE 62 — 0,80 IT + 0,70 IMS (DA 61ª LGSS) */
    employer: { cc: 0.236, desempleo: 0.055, fogasa: 0.002, fp: 0.006, mei: 0.0075, atep: 0.015 },
    /** Cotización adicional de solidaridad 2026 (art. 19 bis LGSS, art. 17 Orden): доли от превышения макс. базы */
    solidarity: [
      { upTo: 0.1, employer: 0.0096, employee: 0.0019 },
      { upTo: 0.5, employer: 0.0104, employee: 0.0021 },
      { upTo: INF, employer: 0.0122, employee: 0.0024 },
    ],

    reta: {
      /** 28,30 CC + 1,30 CP + 0,90 cese + 0,10 FP + 0,90 MEI (Orden PJC/297/2026 art. 18.2) */
      rate: 0.315,
      /** art. 308.1.c LGSS */
      gastosGenericos: 0.07,
      gastosGenericosSocietario: 0.03,
      /** С 2026 — база группы 7 Régimen General (art. 308.1.a regla 4ª; DT 7ª RDL 13/2022) */
      societarioMinBase: 1424.4,
      /** 80 € + MEI; итог по данным Seguridad Social (Importass) */
      tarifaPlanaMonthly: 88.64,
      /**
       * [от (не вкл.), до (вкл.), мин. база, макс. база, метка] — доход в месяц.
       * Таблицы 2025 заморожены на 2026 (art. 3.4 RDL 3/2026). Граница 1 166,70 € относится к General 1
       * («≥ 1 166,70»), поэтому она записана как 1 166,695 — доходы считаются в центах.
       */
      tramos: [
        [-INF, 670, 653.59, 718.94, "Reducida 1"],
        [670, 900, 718.95, 900, "Reducida 2"],
        [900, 1166.695, 849.67, 1166.7, "Reducida 3"],
        [1166.695, 1300, 950.98, 1300, "General 1"],
        [1300, 1500, 960.78, 1500, "General 2"],
        [1500, 1700, 960.78, 1700, "General 3"],
        [1700, 1850, 1143.79, 1850, "General 4"],
        [1850, 2030, 1209.15, 2030, "General 5"],
        [2030, 2330, 1274.51, 2330, "General 6"],
        [2330, 2760, 1356.21, 2760, "General 7"],
        [2760, 3190, 1437.91, 3190, "General 8"],
        [3190, 3620, 1519.61, 3620, "General 9"],
        [3620, 4050, 1601.31, 4050, "General 10"],
        [4050, 6000, 1732.03, 5101.2, "General 11"],
        [6000, INF, 1928.1, 5101.2, "General 12"],
      ] as readonly (readonly [number, number, number, number, string])[],
    },
  },

  is: {
    /** Microempresas (INCN < 1 M€), DT 44ª.2.a LIS — периоды, начинающиеся в 2026 */
    micro: [
      [0, 50000, 0.19],
      [50000, INF, 0.21],
    ] as readonly Bracket[],
    /**
     * Entidad de nueva creación (art. 29.1 LIS): 15% в первый период с прибылью и следующий.
     * Не применяется, если ту же деятельность в прошлом году вёл физлицо-владелец >50% (art. 29.1.b).
     */
    nuevaCreacion: 0.15,
  },

  /**
   * art. 18.6 LIS — «безопасная гавань» для socio profesional: вознаграждение ≥ 75% результата до него
   * и ≥ 5 × IPREM (DA 90ª Ley 31/2022: 600 €/мес; 7 200 € буквально, 8 400 € с 14 выплатами — берём консервативно).
   */
  socioProfesional: { minShare: 0.75, minAbsolute: 5 * 8400 },
} as const;
