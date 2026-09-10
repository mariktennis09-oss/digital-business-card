'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * Появление при прокрутке — четыре примитива на весь сайт.
 *
 * Разница между ними только в начальном состоянии и кривой; конечное
 * состояние у всех одно, поэтому их можно мешать внутри одной группы,
 * не рассинхронизируя каскад.
 *
 * Наблюдатель отключается сразу после первого срабатывания. Появление,
 * повторяющееся при каждом возврате скролла вверх, превращает страницу
 * в мигалку и мешает перечитывать.
 */
export type RevealVariant = 'slide' | 'scale' | 'fade' | 'mask';

export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'slide',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Задержка в миллисекундах. Каскад внутри группы — 75, между группами — 200. */
  delay?: number;
  className?: string;
}) {
  const element = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = element.current;
    if (!node) {
      return;
    }

    // Без IntersectionObserver просто показываем: отсутствие анимации
    // лучше, чем невидимый контент.
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      // Двадцать процентов высоты элемента: срабатывает, когда блок уже
      // читается, а не когда он едва задел край экрана.
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={element}
      className={`reveal reveal--${variant} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
