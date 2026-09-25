/** Живой фон: медленно дрейфующие тёплые пятна + тонкая сетка. Только CSS-трансформации. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[20%] -top-[30%] h-[80vh] w-[80vw] animate-drift-a rounded-full opacity-[0.22]"
        style={{ background: "radial-gradient(closest-side, #ff8a3d, transparent)" }}
      />
      <div
        className="absolute -right-[25%] top-[10%] h-[70vh] w-[70vw] animate-drift-b rounded-full opacity-[0.16]"
        style={{ background: "radial-gradient(closest-side, #ff4d6d, transparent)" }}
      />
      <div
        className="absolute bottom-[-30%] left-[20%] h-[70vh] w-[60vw] animate-drift-a rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(closest-side, #3d7bff, transparent)", animationDelay: "-12s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)",
        }}
      />
    </div>
  );
}
