export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="55%" stopColor="#ffb224" />
          <stop offset="100%" stopColor="#ff5f45" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#12151d" />
      <circle cx="16" cy="17" r="7.5" fill="url(#logo-sun)" />
      <path d="M5 23.5h22" stroke="#07080c" strokeWidth="3" />
      <path d="M8 26.5h16" stroke="#ffb224" strokeOpacity=".55" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
