export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="10" fill="var(--ink)" />
      <circle cx="16" cy="15" r="7" fill="var(--f-you)" />
      <path d="M4 21.5h24" stroke="var(--ink)" strokeWidth="3.2" />
      <path d="M9 25.5h14" stroke="var(--f-you)" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
