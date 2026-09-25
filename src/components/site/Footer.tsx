import Link from "next/link";
import { P } from "@/lib/tax/params-2026";
import { Logo } from "./Logo";

export function Footer() {
  const verified = new Date(P.verifiedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return (
    <footer className="mx-auto mt-28 max-w-[1240px] px-4 pb-44 sm:px-8 lg:pb-14">
      <div className="flex flex-col gap-10 border-t border-line pt-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5">
            <Logo className="size-7" />
            <span className="serif text-xl font-semibold">EsTax·26</span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
            Параметры {P.year} года сверены с BOE, AEAT и Seguridad Social (проверка — {verified}). Это модель, а не
            консультация: у вашей ситуации могут быть детали, которых здесь нет. Перед решением покажите цифры
            налоговому консультанту (asesor fiscal).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm">
          <Link href="/" className="text-ink-2 hover:text-ink">Калькулятор</Link>
          <Link href="/methodology" className="text-ink-2 hover:text-ink">Методология и источники</Link>
          <a href="https://github.com/Gonzalles2009/estax" target="_blank" rel="noreferrer" className="text-ink-2 hover:text-ink">
            Исходный код
          </a>
          <a href="https://t.me/Gonzalles2009" target="_blank" rel="noreferrer" className="text-ink-2 hover:text-ink">
            Telegram автора
          </a>
        </div>
      </div>
      <p className="mt-10 text-xs text-ink-3">
        Сделал{" "}
        <a href="https://t.me/Gonzalles2009" target="_blank" rel="noreferrer" className="text-ink-2 underline-offset-4 hover:underline">
          Aleksandr Kudriavtsev
        </a>
        . Нашли ошибку в цифрах — откройте issue на GitHub со ссылкой на норму.
      </p>
    </footer>
  );
}
