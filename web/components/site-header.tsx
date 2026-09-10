'use client';

import { SECTIONS } from '@/lib/design';

/**
 * Шапка держится поверх всего и не прячется при прокрутке: на странице без
 * привычного меню она единственный способ понять, где ты находишься.
 *
 * Слева терминальный квадрат — он же кнопка командной палитры. Подсказка
 * справа объясняет клавишу, но на телефоне клавиатуры нет, и без
 * нажимаемого квадрата палитра оказалась бы недоступна вовсе.
 */
export function SiteHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-10">
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Открыть командную строку"
        className="bg-ink text-paper flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] font-mono text-[13px] transition-transform duration-300 hover:scale-105"
      >
        <span>{'T:\\'}</span>
        <span className="caret ml-px inline-block h-[11px] w-[6px] bg-current align-middle" />
      </button>

      <nav className="hidden items-center gap-1 sm:flex">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="bg-surface text-ink hover:bg-ink hover:text-paper font-ui rounded-full px-5 py-2.5 text-[13px] tracking-[0.05em] uppercase transition-colors duration-300"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <p className="font-mono text-[11px] tracking-[0.04em] opacity-70 sm:text-[12px]">
        Press <span className="font-medium">/</span> for ?
      </p>
    </header>
  );
}
