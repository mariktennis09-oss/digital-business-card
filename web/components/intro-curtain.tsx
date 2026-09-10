'use client';

import { useEffect, useState, type CSSProperties } from 'react';

/** Столько длится вся сборка: шторка плюс самый поздний элемент интерфейса. */
export const INTRO_DURATION_MS = 1400;

const COLUMNS = 8;

/**
 * Шторка интро: восемь чёрных колонок, уезжающих вверх с разбегом.
 * Из-за разбега верхняя кромка получается рваной, лесенкой — тот же приём,
 * которым в референсе закрывается экран при переходе между страницами.
 *
 * Уходит она сама, анимацией, а из дерева убирается по таймеру. Держать
 * её дальше незачем: восемь элементов поверх страницы мешают отладке
 * и попадают в снимки экрана.
 *
 * Смонтирована она только на клиенте. На сервере чёрный экран попал бы
 * в HTML, и при выключенном JavaScript страница осталась бы закрытой.
 */
export function IntroCurtain() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="curtain" aria-hidden>
      {Array.from({ length: COLUMNS }, (_, index) => (
        <span
          key={index}
          className="curtain__column"
          style={{ '--column-index': index } as CSSProperties}
        />
      ))}
    </div>
  );
}
