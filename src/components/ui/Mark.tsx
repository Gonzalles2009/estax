/** Цветная метка режима или части бюджета: короткий штрих вместо точки */
export function Mark({ color, dir = "v", className = "" }: { color: string; dir?: "v" | "h"; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-[1px] ${dir === "v" ? "h-3.5 w-[3px]" : "h-[3px] w-3"} ${className}`}
      style={{ background: color }}
    />
  );
}
