import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-4 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5 text-ink">
        <Logo />
        <span className="serif text-[22px] font-semibold tracking-tight">
          EsTax<span className="text-ink-3">·26</span>
        </span>
      </Link>
      <div className="flex items-center gap-1 text-sm">
        <Link href="/methodology" className="rounded-full px-3 py-1.5 text-ink-2 transition hover:bg-ink/5 hover:text-ink">
          Методология
        </Link>
        <a
          href="https://github.com/Gonzalles2009/estax"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full px-3 py-1.5 text-ink-2 transition hover:bg-ink/5 hover:text-ink sm:block"
        >
          GitHub
        </a>
        <span className="ml-1">
          <ThemeToggle />
        </span>
      </div>
    </nav>
  );
}
