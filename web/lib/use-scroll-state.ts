'use client';

import { useEffect, useState } from 'react';

export type Tone = 'light' | 'dark';

export interface ScrollState {
  /** Раздел, до которого дочитали. По нему плашка навигации меняет форму. */
  activeSection: string | null;
  /** Тон секции под шапкой. Шапка перекрашивается, пересекая границу. */
  tone: Tone;
}

/**
 * Что происходит под шапкой.
 *
 * Обе величины считаются одним наблюдателем по одной и той же полосе
 * высотой в шапку: раздел и тон меняются в один и тот же момент, и
 * рассинхрона между цветом шапки и формой плашки не бывает.
 *
 * Полоса задаётся отрицательными полями: наблюдателя интересует не
 * «видно ли секцию», а «какая секция сейчас проходит под шапкой».
 */
export function useScrollState(): ScrollState {
  const [state, setState] = useState<ScrollState>({ activeSection: null, tone: 'light' });

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-tone]'));

    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const header = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      10,
    );
    const band = Number.isFinite(header) ? header : 76;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const element = entry.target as HTMLElement;

          setState({
            activeSection: element.id || null,
            tone: element.dataset.tone === 'dark' ? 'dark' : 'light',
          });
        }
      },
      // Нижнее поле почти во всю высоту: от области наблюдения остаётся
      // полоска сразу под шапкой.
      { rootMargin: `-${band}px 0px -99% 0px`, threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return state;
}
