'use client';

import { useEffect, useState } from 'react';
import { GREETING_INTERVAL_MS, GREETINGS } from '@/lib/design';
import type { ProfileLink } from '@/lib/api';
import { ConsoleArt } from './console-art';
import { WordChips } from './word-chips';

/**
 * Герой: объект-игрушка сверху, слоган плашками снизу, служебная строка
 * по нижнему краю.
 *
 * Слоган визуально выезжает из-под консоли — они намеренно перекрываются
 * по вертикали. Без нахлёста получаются две отдельные картинки одна над
 * другой, а нужен один объект.
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
  const greeting = useGreetingRotation();

  return (
    <section id="home" className="relative flex min-h-dvh flex-col px-5 pt-24 pb-6 sm:px-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <ConsoleArt className="h-[42vh] max-h-[400px] min-h-[220px] w-auto" />

        {/* Отрицательный отступ и есть нахлёст: слоган начинается раньше,
            чем заканчивается консоль. */}
        <WordChips
          as="h1"
          text={slogan}
          className="font-display -mt-[6vh] max-w-[13ch] text-center text-[clamp(56px,9vw,150px)]"
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] sm:text-[12px]">
        <p className="tracking-[0.04em] opacity-70">Creating Experiences Since {since}</p>

        <div className="flex items-center gap-3">
          {/* Ширина в символах фиксирована: без неё соседний адрес
              подпрыгивал бы на каждой смене языка. */}
          <span
            className="bg-yellow-hot text-ink inline-flex min-w-[9ch] justify-center rounded-full px-3 py-1.5"
            aria-live="polite"
          >
            {greeting}
          </span>

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
 * Ротация приветствия. Индекс, а не текст: список задан в одном месте,
 * и добавить язык — значит дописать строку туда, а не сюда.
 */
function useGreetingRotation(): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // При «меньше движения» приветствие замирает на первом языке: это
    // мигающая надпись, а не украшение, от которого можно отвернуться.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % GREETINGS.length),
      GREETING_INTERVAL_MS,
    );

    return () => window.clearInterval(timer);
  }, []);

  return GREETINGS[index];
}
