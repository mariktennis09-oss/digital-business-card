'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { ProfileLink } from '@/lib/api';
import { GREETING_INTERVAL_MS, GREETINGS } from '@/lib/design';
import { ConsoleArt } from './console-art';
import { WordChips } from './word-chips';

/**
 * Герой: объект-игрушка сверху, слоган плашками снизу, служебная строка
 * по нижнему краю.
 *
 * Интерфейс собирается по очереди, а не появляется целиком: сначала
 * заголовок по словам, затем консоль, затем нижняя строка. Задержки
 * заданы в разметке, само движение — в CSS, поэтому сборка идёт с первого
 * кадра и не ждёт гидратации.
 */
export function Hero({
  slogan,
  since,
  email,
}: {
  slogan: string;
  /** Год, с которого считается стаж. Приходит из данных, а не из вёрстки. */
  since: number;
  email: ProfileLink | null;
}) {
  return (
    <section
      id="home"
      data-tone="light"
      className="relative flex min-h-dvh flex-col px-5 pt-24 pb-6 sm:px-10"
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="intro-item intro-item--scale"
          style={{ '--intro-delay': '700ms' } as CSSProperties}
        >
          <ConsoleArt className="h-[42vh] max-h-[400px] min-h-[220px] w-auto" />
        </div>

        {/* Отрицательный отступ и есть нахлёст: слоган начинается раньше,
            чем заканчивается консоль. */}
        <WordChips
          as="h1"
          text={slogan}
          className="font-display -mt-[6vh] max-w-[13ch] text-center text-[clamp(56px,9vw,150px)]"
          chipClassName="intro-item"
          chipDelay={(index) => 400 + index * 75}
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] sm:text-[12px]">
        <p
          className="intro-item tracking-[0.04em] opacity-70"
          style={{ '--intro-delay': '900ms' } as CSSProperties}
        >
          Creating Experiences Since {since}
        </p>

        <div
          className="intro-item flex items-center gap-3"
          style={{ '--intro-delay': '900ms' } as CSSProperties}
        >
          <GreetingChip />

          {email ? (
            <a href={email.url} className="tracking-[0.04em] underline-offset-4 hover:underline">
              {email.url.replace(/^mailto:/, '')}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Жёлтый чип с приветствием.
 *
 * Ширина не прыгает под новое слово, а доезжает: слово измеряется в
 * скрытом двойнике, и в чип уходит уже число. Без измерения пришлось бы
 * либо фиксировать ширину по самому длинному языку — и оставлять дыру
 * рядом с коротким, — либо мириться с рывком соседнего адреса.
 */
function GreetingChip() {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const measure = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % GREETINGS.length),
      GREETING_INTERVAL_MS,
    );

    return () => window.clearInterval(timer);
  }, []);

  // Замер до отрисовки: иначе на один кадр видна старая ширина с новым
  // словом, и чип дёргается.
  useLayoutEffect(() => {
    if (measure.current) {
      setWidth(measure.current.getBoundingClientRect().width);
    }
  }, [index]);

  return (
    <span className="relative inline-flex">
      {/* Двойник считает ширину и не показывается ни глазами, ни программой
          чтения с экрана. */}
      <span
        ref={measure}
        aria-hidden
        className="pointer-events-none absolute px-3 py-1.5 whitespace-nowrap opacity-0"
      >
        {GREETINGS[index]}
      </span>

      <span
        className="morph morph--pill bg-yellow-hot text-ink inline-flex justify-center overflow-hidden px-3 py-1.5 whitespace-nowrap"
        style={width === null ? undefined : { width }}
        aria-live="polite"
      >
        {GREETINGS[index]}
      </span>
    </span>
  );
}
