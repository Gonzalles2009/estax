export interface Source {
  title: string;
  /** Короткая метка для чипа в интерфейсе */
  short: string;
  url: string;
}

/**
 * Все нормативные источники, на которые ссылаются параметры и шаги расчёта.
 * Ссылки ведут на консолидированные тексты BOE или официальные страницы AEAT / Seguridad Social.
 */
export const SOURCES = {
  lirpf: {
    title: "Ley 35/2006 del IRPF (texto consolidado)",
    short: "LIRPF",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764",
  },
  lirpf_19: {
    title: "LIRPF art. 19 — gastos deducibles del trabajo (incl. 2 000 € «otros gastos»)",
    short: "LIRPF art. 19",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a19",
  },
  lirpf_20: {
    title: "LIRPF art. 20 — reducción por obtención de rendimientos del trabajo",
    short: "LIRPF art. 20",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a20",
  },
  lirpf_30: {
    title: "LIRPF art. 30 + RIRPF art. 30 — estimación directa simplificada",
    short: "RIRPF art. 30",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a30",
  },
  lirpf_32: {
    title: "LIRPF art. 32 — reducciones por inicio de actividad",
    short: "LIRPF art. 32",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a32",
  },
  lirpf_56: {
    title: "LIRPF arts. 56–61 — mínimo personal y familiar",
    short: "LIRPF art. 56–61",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a56",
  },
  lirpf_63: {
    title: "LIRPF art. 63 — escala general estatal",
    short: "LIRPF art. 63",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a63",
  },
  lirpf_66: {
    title: "LIRPF arts. 66 y 76 — escala del ahorro",
    short: "LIRPF art. 66/76",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a66",
  },
  lirpf_84: {
    title: "LIRPF art. 84 — tributación conjunta",
    short: "LIRPF art. 84",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a84",
  },
  lirpf_93: {
    title: "LIRPF art. 93 — régimen especial de impatriados («Ley Beckham»)",
    short: "LIRPF art. 93",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a93",
  },
  lirpf_81bis: {
    title: "LIRPF art. 81 bis — deducciones por familia numerosa o personas con discapacidad a cargo",
    short: "LIRPF art. 81 bis",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764#a81bis",
  },
  rirpf_114: {
    title: "RIRPF arts. 113–120 — régimen de impatriados",
    short: "RIRPF art. 114",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a114",
  },
  rirpf_116: {
    title: "RIRPF art. 116 — opción por el régimen de impatriados: modelo 149 en 6 meses (RD 1008/2023)",
    short: "RIRPF art. 116",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a116",
  },
  lgss_308: {
    title: "LGSS art. 308 — cotización de autónomos por ingresos reales",
    short: "LGSS art. 308",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724#a308",
  },
  lgss_19bis: {
    title: "LGSS art. 19 bis — cotización adicional de solidaridad",
    short: "LGSS art. 19 bis",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724#a1-4",
  },
  leta_38ter: {
    title: "Ley 20/2007 (Estatuto del trabajo autónomo) art. 38 ter — tarifa plana por inicio de actividad",
    short: "LETA art. 38 ter",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409#a3-5",
  },
  ss_bases: {
    title: "Seguridad Social — bases y tipos de cotización 2026",
    short: "Seg. Social",
    url: "https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/36537",
  },
  orden_2026: {
    title: "Orden PJC/297/2026 — cotización 2026 (art. 18: tramos RETA; arts. 4, 16, 17: Régimen General)",
    short: "Orden PJC/297/2026",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296",
  },
  rdl_3_2026: {
    title: "RDL 3/2026 — bases máximas 2026, congelación de tramos RETA, tarifa AT/EP (DA 61ª LGSS)",
    short: "RDL 3/2026",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-2548",
  },
  lis: {
    title: "Ley 27/2014 del Impuesto sobre Sociedades (texto consolidado)",
    short: "LIS",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328",
  },
  lis_29: {
    title: "LIS art. 29 y DT 44ª — tipos de gravamen (microempresas 19/21% en 2026, nueva creación 15%)",
    short: "LIS art. 29",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328#a29",
  },
  lis_18: {
    title: "LIS art. 18.6 — valoración de servicios del socio profesional",
    short: "LIS art. 18.6",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328#a18",
  },
  aeat_manual: {
    title: "AEAT — Manual práctico de Renta 2025: gravamen autonómico y mínimos de cada comunidad",
    short: "AEAT Manual Renta",
    url: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-autonomico.html",
  },
} satisfies Record<string, Source>;

export type KnownSourceId = keyof typeof SOURCES;
