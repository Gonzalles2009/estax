"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  hint?: ReactNode;
  /** Правая колонка: например, сумма в месяц */
  aside?: ReactNode;
  /** Подпись справа вторым рядом: например, разница */
  asideHint?: ReactNode;
}

const ease = [0.22, 1, 0.36, 1] as const;

// Портал — только после гидратации: на сервере его нет
const noop = () => () => {};
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);
const POPOVER_W = 400;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Фокус на соседний по порядку табуляции элемент относительно данного */
function focusSibling(from: HTMLElement | null, back: boolean) {
  if (!from) return;
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0),
  );
  const i = all.indexOf(from);
  const next = i === -1 ? from : all[i + (back ? -1 : 1)] ?? from;
  next.focus();
}

interface Pos {
  top: number;
  left: number;
  maxHeight: number;
  above: boolean;
}

/**
 * Встроенный в текст выбор: слово-триггер открывает карточку-список (десктоп)
 * или шторку снизу (телефон). Клавиатура: ↑ ↓ Home End, Enter, Esc, поиск по первым буквам.
 */
export function InlinePicker<T extends string>({
  value,
  options,
  onChange,
  label,
  title,
  footer,
  variant = "inline",
}: {
  value: T;
  options: PickerOption<T>[];
  onChange: (v: T) => void;
  /** Доступное имя поля */
  label: string;
  /** Заголовок в карточке/шторке */
  title: string;
  footer?: ReactNode;
  /** inline — слово в тексте, chip — компактное поле (плавающая панель) */
  variant?: "inline" | "chip";
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Вся панель (заголовок, ручка шторки, список) — клик внутри неё не закрывает меню
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const isClient = useIsClient();

  const current = options.find((o) => o.value === value);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(POPOVER_W, innerWidth - 32);
    const left = Math.min(Math.max(16, r.left), innerWidth - width - 16);
    const below = innerHeight - r.bottom - 16;
    const aboveSpace = r.top - 16;
    const above = below < 300 && aboveSpace > below;
    const maxHeight = Math.min(460, (above ? aboveSpace : below) - 10);
    setPos({ top: above ? r.top - 10 : r.bottom + 10, left, maxHeight, above });
  }, []);

  const openPicker = () => {
    const isSheet = matchMedia("(max-width: 639px)").matches;
    setSheet(isSheet);
    setActive(selectedIndex);
    if (!isSheet) place();
    setOpen(true);
  };

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    close();
  };

  // Позиция следует за словом при прокрутке и ресайзе
  useEffect(() => {
    if (!open || sheet) return;
    const onMove = () => place();
    addEventListener("scroll", onMove, true);
    addEventListener("resize", onMove);
    return () => {
      removeEventListener("scroll", onMove, true);
      removeEventListener("resize", onMove);
    };
  }, [open, sheet, place]);

  // Клик мимо — закрыть
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // Шторка блокирует прокрутку страницы
  useEffect(() => {
    if (!open || !sheet) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open, sheet]);

  // Фокус в список и прокрутка к выбранному
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    list?.focus({ preventScroll: true });
    list?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        return;
      case "Home":
        e.preventDefault();
        setActive(0);
        return;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        return;
      case "Escape":
        e.preventDefault();
        close();
        return;
      case "Tab": {
        // Список живёт в портале в конце документа — Tab оттуда увёл бы фокус в конец страницы.
        // Ведём себя как нативный select: следующее (или предыдущее) поле после слова-триггера.
        e.preventDefault();
        const back = e.shiftKey;
        close(false);
        requestAnimationFrame(() => focusSibling(triggerRef.current, back));
        return;
      }
    }
    // Поиск по первым буквам любого слова
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const q = typed.current.text;
      const i = options.findIndex((o) => o.label.toLowerCase().split(/[\s/,-]+/).some((w) => w.startsWith(q)));
      if (i >= 0) setActive(i);
    }
  };

  // Клик по заголовку или ручке не должен уводить фокус из списка — иначе ломается клавиатура
  const keepFocus = (e: React.MouseEvent) => {
    if (!listRef.current?.contains(e.target as Node)) e.preventDefault();
  };

  const list = (
    <div
      ref={listRef}
      role="listbox"
      id={`${id}-list`}
      aria-label={title}
      tabIndex={-1}
      aria-activedescendant={`${id}-opt-${active}`}
      onKeyDown={onKeyDown}
      className="outline-none"
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        const isActive = i === active;
        return (
          <motion.div
            key={o.value}
            id={`${id}-opt-${i}`}
            data-index={i}
            role="option"
            aria-selected={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.018, ease }}
            onPointerMove={() => setActive(i)}
            onClick={() => choose(i)}
            className={`relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
              isActive ? "bg-ink/[0.06]" : ""
            }`}
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-full ${selected ? "bg-ink text-bg" : "border border-line-strong"}`}>
              {selected && (
                <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] leading-snug ${selected ? "font-semibold text-ink" : "text-ink"}`}>{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-xs leading-snug text-ink-3">{o.hint}</span>}
            </span>
            {(o.aside || o.asideHint) && (
              <span className="shrink-0 text-right">
                {o.aside && <span className="serif tnum block text-[15px] font-medium text-ink">{o.aside}</span>}
                {o.asideHint && <span className="tnum block text-[11px] text-ink-3">{o.asideHint}</span>}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const header = (
    <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-1">
      <span className="eyebrow">{title}</span>
      {footer}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${current?.label ?? ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openPicker();
          }
        }}
        className={
          variant === "chip"
            ? "relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-lg border border-line bg-surface-2/60 px-3.5 py-2 text-left text-sm font-medium text-ink transition-colors hover:border-line-strong"
            : "inline-field relative inline-flex items-baseline gap-1 px-1 text-left text-ink"
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={current?.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className={variant === "chip" ? "truncate" : undefined}
          >
            {current?.label}
          </motion.span>
        </AnimatePresence>
        <motion.svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`${variant === "chip" ? "size-3.5 shrink-0" : "size-[0.55em]"} self-center text-accent`}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </motion.svg>
      </button>

      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && !sheet && pos && (
              <motion.div
                key="popover"
                ref={panelRef}
                onMouseDown={keepFocus}
                initial={{ opacity: 0, scale: 0.96, y: pos.above ? 8 : -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: pos.above ? 6 : -6, transition: { duration: 0.15 } }}
                transition={{ duration: 0.28, ease }}
                style={{
                  position: "fixed",
                  left: pos.left,
                  width: Math.min(POPOVER_W, innerWidth - 32),
                  ...(pos.above ? { bottom: innerHeight - pos.top } : { top: pos.top }),
                  transformOrigin: pos.above ? "bottom left" : "top left",
                }}
                className="card z-[60] p-2 backdrop-blur-xl"
              >
                {header}
                <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: pos.maxHeight - 48 }}>
                  {list}
                </div>
              </motion.div>
            )}
            {open && sheet && (
              <motion.div key="sheet" className="fixed inset-0 z-[60]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
                <motion.div
                  className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => close(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 90 || info.velocity.y > 600) close(false);
                  }}
                  ref={panelRef}
                  onMouseDown={keepFocus}
                  className="card absolute inset-x-0 bottom-0 !rounded-b-none !rounded-t-[18px] px-2 pt-2"
                  style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
                >
                  <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-ink/15" />
                  {header}
                  <div className="max-h-[65dvh] overflow-y-auto overscroll-contain">{list}</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
