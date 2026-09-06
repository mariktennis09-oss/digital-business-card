'use client';

import gsap from 'gsap';
import { useEffect, type RefObject } from 'react';
import { grainDataUri } from '@/lib/grain';
import { GRAIN, VIGNETTE } from '@/lib/scene-constants';

/**
 * Фон страницы: сплошная заливка, виньетка и плёночное зерно.
 *
 * Это два слоя, и между ними по глубине проходит canvas. Заливка лежит под
 * сценой и отвечает за случай, когда WebGL недоступен: тогда страница
 * теряет объект, но не цвет. Виньетка и зерно, наоборот, лежат поверх
 * сцены — это свойства кадра целиком, а не подложки под ним. Плёночное
 * зерно на то и плёночное, что ложится и на объект тоже.
 *
 * Сам элемент заливки отдаётся наружу через `fillRef` — анимирует его
 * владелец таймлайна, а не этот компонент. Иначе смена цвета оказалась бы
 * отдельной анимацией рядом с открытием панели, а не вместе с ним.
 * По той же причине наружу отдаётся и зерно: на пике перехода оно
 * усиливается тем же таймлайном.
 */
export function Backdrop({
  fillRef,
  grainRef,
  initialColor,
  grainOpacity = GRAIN.opacity,
  grainFrequency = GRAIN.baseFrequency,
  grainOctaves = GRAIN.octaves,
}: {
  fillRef: RefObject<HTMLDivElement | null>;
  grainRef?: RefObject<HTMLDivElement | null>;
  initialColor: string;
  /** Насколько зерно проступает сквозь кадр. */
  grainOpacity?: number;
  /** Размер песчинок: больше значение — мельче зерно. */
  grainFrequency?: number;
  grainOctaves?: number;
}) {
  useEffect(() => {
    if (fillRef.current) {
      gsap.set(fillRef.current, { backgroundColor: initialColor });
    }
    // Только первичная установка: дальше цветом распоряжается таймлайн.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div aria-hidden ref={fillRef} className="fixed inset-0 -z-30" />

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent ${VIGNETTE.innerStop}%, rgba(0,0,0,${VIGNETTE.opacity}) 100%)`,
          }}
        />
        <div
          ref={grainRef}
          className="grain absolute inset-0"
          style={{
            opacity: grainOpacity,
            backgroundImage: grainDataUri(grainFrequency, grainOctaves),
          }}
        />
      </div>
    </>
  );
}
