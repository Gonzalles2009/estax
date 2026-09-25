"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Тема живёт в атрибуте <html data-theme>: подписываемся на его изменения
function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** Переключатель темы с круговым раскрытием через View Transitions API */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);

  useEffect(() => {
    // Следуем за системой, пока пользователь не выбрал тему сам
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("theme")) return;
      } catch {}
      document.documentElement.dataset.theme = e.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      apply();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement.style;
    root.setProperty("--vt-x", `${x}px`);
    root.setProperty("--vt-y", `${y}px`);
    root.setProperty("--vt-r", `${radius}px`);
    doc.startViewTransition(apply);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      className="relative grid size-9 place-items-center overflow-hidden rounded-lg border border-line text-ink-2 transition hover:border-line-strong hover:text-ink"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme ?? "none"}
          viewBox="0 0 24 24"
          className="size-[18px]"
          initial={{ y: 14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.25 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {theme === "dark" ? (
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
