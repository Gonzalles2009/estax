import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { calculateAll } from "@/lib/tax/engine";
import { DEFAULTS, inputsOf } from "@/lib/defaults";
import { REGIME_META } from "@/lib/regimes";
import { n0 as n0Narrow } from "@/lib/format";

// В PNG используем обычный пробел: узкий неразрывный в Satori рендерится нестабильно
const n0 = (x: number) => n0Narrow(x).replace(/\u202f/g, " ");

export const alt = "EsTax·26 — сколько останется вам, а не Hacienda. Налоги Испании 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");

// Цвета режимов для картинки (CSS-переменные в Satori недоступны)
const COLORS = { employee: "#3987e5", beckham: "#9085e9", autonomo: "#d95926", sl_safe: "#199e70" } as const;

export default async function Image() {
  const [semibold, regular] = await Promise.all([
    readFile(join(fontDir, "Geist-SemiBold.ttf")),
    readFile(join(fontDir, "Geist-Regular.ttf")),
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
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "radial-gradient(circle at 85% 0%, #5a2a12 0%, #07080c 55%)",
          color: "#f1f2f6",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 600 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "linear-gradient(135deg, #ffd166, #ffb224 55%, #ff5f45)",
            }}
          />
          EsTax·26
          <span style={{ color: "#7b8194", fontWeight: 400, fontSize: 24, marginLeft: 12 }}>налоги Испании 2026</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>
            Сколько останется вам,
          </div>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.1, color: "#7b8194" }}>
            а не Hacienda
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 22, color: "#b4b9c7" }}>
            {`Бюджет ${n0(DEFAULTS.budget)} € в год, Мадрид — остаётся в месяц:`}
          </div>
          {results.map((r) => (
            <div key={r.regime} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 290, fontSize: 24, color: "#f1f2f6" }}>{REGIME_META[r.regime].name}</div>
              <div
                style={{
                  height: 18,
                  width: Math.round((r.netMonthly / max) * 560),
                  borderRadius: 9,
                  background: COLORS[r.regime as keyof typeof COLORS],
                }}
              />
              <div style={{ fontSize: 24, fontWeight: 600 }}>{`${n0(r.netMonthly)} €`}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
