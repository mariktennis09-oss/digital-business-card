'use client';

import type { CSSProperties } from 'react';
import { SECTIONS } from '@/lib/design';
import type { Tone } from '@/lib/use-scroll-state';
import { TextRoll } from './text-roll';

/**
 * Шапка держится поверх всего и не прячется при прокрутке: на странице без
 * привычного меню она единственный способ понять, где ты находишься.
 *
 * Три приёма сходятся здесь одновременно. Плашка текущего раздела
 * перетекает из пилюли в прямоугольник — форма меняется от состояния, а не
 * от мыши. Подписи прокручиваются при наведении. Цвет всей шапки
 * подстраивается под тон секции, проходящей под ней.
 */
export function SiteHeader({
  tone,
  activeSection,
  onOpenPalette,
}: {
  tone: Tone;
  activeSection: string | null;
  onOpenPalette: () => void;
}) {
  const dark = tone === 'dark';

  // Активная плашка не подсвечивается акцентом, а заливается тоном,
  // противоположным секции: на бумаге чернилами, на чернилах бумагой.
  const activeBackground = dark ? 'var(--color-paper)' : 'var(--color-ink)';
  const activeForeground = dark ? 'var(--color-ink)' : 'var(--color-paper)';

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 sm:px-10"
      style={{ color: dark ? 'var(--color-paper)' : 'var(--color-ink)' }}
    >
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Открыть командную строку"
        className="morph morph--box intro-item flex h-11 w-11 shrink-0 items-center justify-center font-mono text-[13px]"
        style={{
          backgroundColor: dark ? 'var(--color-paper)' : 'var(--color-ink)',
          color: dark ? 'var(--color-ink)' : 'var(--color-paper)',
          borderRadius: '6px',
        }}
      >
        <span>{'T:\\'}</span>
        <span className="caret ml-px inline-block h-[11px] w-[6px] bg-current align-middle" />
      </button>

      <nav className="hidden items-center gap-1 sm:flex">
        {SECTIONS.map((section, index) => {
          const active = section.id === activeSection;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active ? 'true' : undefined}
              className={`morph intro-item font-ui px-5 py-2.5 text-[13px] tracking-[0.05em] uppercase ${
                active ? 'morph--box' : 'morph--pill'
              }`}
              style={
                {
                  backgroundColor: active ? activeBackground : 'var(--color-surface)',
                  color: active ? activeForeground : 'var(--color-ink)',
                  '--intro-delay': `${150 + index * 75}ms`,
                } as CSSProperties
              }
            >
              <TextRoll>{section.label}</TextRoll>
            </a>
          );
        })}
      </nav>

      <p
        className="intro-item font-mono text-[11px] tracking-[0.04em] opacity-70 sm:text-[12px]"
        style={{ '--intro-delay': '1000ms' } as CSSProperties}
      >
        Press <span className="font-medium">/</span> for ?
      </p>
    </header>
  );
}
