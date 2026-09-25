import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { calculateAll } from "@/lib/tax/engine";
import { DEFAULTS, inputsOf } from "@/lib/defaults";
import { REGIME_META } from "@/lib/regimes";
import { n0 } from "@/lib/format";

export const alt = "EsTax·26 — сколько останется вам, а не Hacienda. Налоги Испании 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori не читает CSS-переменные: светлая «бумажная» палитра продублирована здесь
const C = {
  bg: "#f4eee3",
  surface: "#fbf8f2",
  ink: "#1c1a17",
  ink3: "#857d70",
  gold: "#b57d00",
  accent: "#c55123",
  line: "rgba(28,26,23,0.12)",
  regime: { employee: "#2e69b2", beckham: "#7750b1", autonomo: "#c55123", sl_safe: "#118659" },
} as const;

export default async function Image() {
  const dir = join(process.cwd(), "src/app/_og");
  const [serif, serifItalic, sans] = await Promise.all([
    readFile(join(dir, "Literata-Display-Medium.ttf")),
    readFile(join(dir, "Literata-Display-MediumItalic.ttf")),
    readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf")),
  ]);
  const ids = ["employee", "beckham", "autonomo", "sl_safe"] as const;
  const results = calculateAll(ids, inputsOf(DEFAULTS)).sort((a, b) => b.netAnnual - a.netAnnual);
  const max = results[0].netMonthly;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 60,
          background: `radial-gradient(circle at 12% 0%, #ecd9ae 0%, ${C.bg} 45%)`,
          color: C.ink,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, background: C.gold }} />
            </div>
            <div style={{ fontFamily: "Literata", fontSize: 32 }}>EsTax·26</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Literata", fontSize: 78, lineHeight: 1, letterSpacing: -2.5 }}>
            <div style={{ display: "flex" }}>Сколько</div>
            <div style={{ display: "flex" }}>
              останется&nbsp;
              <span style={{ fontStyle: "italic", color: C.accent }}>вам,</span>
            </div>
            <div style={{ display: "flex", color: C.ink3 }}>а не Hacienda</div>
          </div>
          <div style={{ fontSize: 22, color: C.ink3 }}>Налоги Испании 2026 · 15 регионов · сверено с BOE</div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            width: 420,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            padding: 34,
            borderRadius: 28,
            background: C.surface,
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ fontSize: 16, letterSpacing: 3, color: C.ink3 }}>{`${n0(DEFAULTS.budget)} € В ГОД · МАДРИД`}</div>
          {results.map((r) => (
            <div key={r.regime} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
                <span>{REGIME_META[r.regime].name}</span>
                <span style={{ fontFamily: "Literata", fontSize: 26 }}>{`${n0(r.netMonthly)} €`}</span>
              </div>
              <div
                style={{
                  height: 10,
                  width: Math.round((r.netMonthly / max) * 352),
                  borderRadius: 5,
                  background: C.regime[r.regime as keyof typeof C.regime],
                }}
              />
            </div>
          ))}
          <div style={{ fontSize: 17, color: C.ink3 }}>остаётся в месяц</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Literata", data: serif, weight: 500, style: "normal" },
        { name: "Literata", data: serifItalic, weight: 500, style: "italic" },
        { name: "Geist", data: sans, weight: 500, style: "normal" },
      ],
    },
  );
}
