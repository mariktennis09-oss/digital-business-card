import type { ElementType } from 'react';

/**
 * Каждое слово в собственной плашке — главный узнаваемый ход этого дизайна.
 *
 * Форма и цвет чередуются по кругу из пяти. Круг именно нечётный: при
 * чётном соседние строки заголовка вставали бы одинаково, и рисунок из
 * плашек превращался бы в полосатый узор. Пятёрка даёт двум цветным
 * позициям расходиться по строкам произвольно.
 */

interface ChipStyle {
  shape: 'pill' | 'box';
  background: string;
}

const CYCLE: ChipStyle[] = [
  { shape: 'pill', background: 'var(--color-lilac)' },
  { shape: 'box', background: 'var(--color-surface)' },
  { shape: 'pill', background: 'var(--color-surface)' },
  { shape: 'box', background: 'var(--color-surface)' },
  { shape: 'pill', background: 'var(--color-pink)' },
];

export function WordChips({
  text,
  as: Tag = 'span',
  className = '',
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag className={`chips ${className}`}>
      {words.map((word, index) => {
        const style = CYCLE[index % CYCLE.length];

        return (
          <span
            // Слова в заголовке повторяются редко, но позиция всё равно
            // часть ключа: иначе React переиспользует чужую плашку и
            // ломает поочерёдное появление.
            key={`${word}-${index}`}
            className={`chip chip--${style.shape}`}
            style={
              {
                backgroundColor: style.background,
                '--chip-index': index,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        );
      })}
    </Tag>
  );
}
