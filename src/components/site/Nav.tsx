import Link from "next/link";
import { Logo } from "./Logo";

export function Nav() {
  return (
    <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 text-fg">
        <Logo />
        <span className="text-[17px] font-semibold tracking-tight">
          EsTax<span className="text-fg-3">·26</span>
        </span>
      </Link>
      <div className="flex items-center gap-1 text-sm">
        <Link href="/methodology" className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-white/5 hover:text-fg">
          Методология
        </Link>
        <a
          href="https://github.com/Gonzalles2009/estax"
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-3 py-1.5 text-fg-2 transition hover:bg-white/5 hover:text-fg"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
