'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Появление при прокрутке. Наблюдатель отключается сразу после первого
 * срабатывания: элемент показывается один раз и больше не мигает, когда
 * читатель прокручивает страницу назад.
 *
 * Класс переключается на самом элементе, а не в состоянии React: появление
 * целиком описано в CSS, включая задержки чипов, и перерисовывать дерево
 * ради него незачем.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  const element = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = element.current;
    if (!node) {
      return;
    }

    // Без IntersectionObserver — просто показываем: отсутствие анимации
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={element} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
