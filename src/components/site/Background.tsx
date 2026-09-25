/** Бумажное зерно и тёплые отсветы. Только CSS, без JS. */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
).replace(/%2523/g, "%23")}")`;

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[15%] -top-[25%] h-[75vh] w-[70vw] rounded-full opacity-40 blur-3xl dark:opacity-25"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--f-you) 55%, transparent), transparent)" }}
      />
      <div
        className="absolute -right-[20%] top-[5%] h-[65vh] w-[60vw] rounded-full opacity-30 blur-3xl dark:opacity-20"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 50%, transparent), transparent)" }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: GRAIN, opacity: "var(--grain-opacity)" }} />
    </div>
  );
}

/** Геометрия средиземноморской плитки-азулехо — тонкими линиями, как водяной знак */
export function Azulejo({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="100%" height="100%">
      <defs>
        <pattern id="azulejo" width="72" height="72" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="71" height="71" />
            <circle cx="36" cy="36" r="22" />
            <path d="M36 6 L44 28 L66 36 L44 44 L36 66 L28 44 L6 36 L28 28 Z" />
            <path d="M0 0 Q18 18 0 36 M72 0 Q54 18 72 36 M0 72 Q18 54 0 36 M72 72 Q54 54 72 36" />
            <circle cx="36" cy="36" r="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#azulejo)" />
    </svg>
  );
}
