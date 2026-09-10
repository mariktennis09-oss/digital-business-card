'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/lib/api';
import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Две колонки кейсов, намеренно сбитые по вертикали и уезжающие с разной
 * скоростью. Расхождение накапливается, и к концу секции правая колонка
 * заметно обгоняет левую — лента перестаёт читаться как обычная сетка.
 *
 * Картинки внутри карточек едут медленнее самих карточек. Они лежат
 * внутри колонки и уже несут её сдвиг, поэтому им задаётся встречное
 * смещение в пятнадцать процентов — так их итоговая скорость и выходит
 * равной 0.85 от скорости карточки.
 */
const COLUMN_SPEED = [-0.05, -0.12];
const IMAGE_FACTOR = 0.85;

export function Works({ projects }: { projects: Project[] }) {
  const columns = useRef<(HTMLDivElement | null)[]>([]);
  const images = useRef<HTMLElement[][]>([[], []]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 900px)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    let frame = 0;

    const apply = () => {
      frame = 0;
      const offset = window.scrollY;

      columns.current.forEach((column, index) => {
        if (!column) {
          return;
        }

        const shift = offset * COLUMN_SPEED[index];
        column.style.transform = `translateY(${shift}px)`;

        const lag = shift * (IMAGE_FACTOR - 1);
        images.current[index].forEach((image) => {
          image.style.transform = `translateY(${lag}px)`;
        });
      });
    };

    const onScroll = () => {
      // Обработчик прокрутки только назначает работу, а сама она делается
      // раз в кадр: браузер зовёт его чаще, чем успевает рисовать.
      frame ||= window.requestAnimationFrame(apply);
    };

    const reset = () => {
      columns.current.forEach((column) => {
        if (column) {
          column.style.transform = '';
          column.style.willChange = '';
        }
      });
      images.current.flat().forEach((image) => {
        image.style.transform = '';
      });
    };

    const sync = () => {
      window.removeEventListener('scroll', onScroll);
      reset();

      if (!wide.matches || calm.matches) {
        return;
      }

      // will-change ставится только тем, кто действительно едет, и только
      // пока едет: постоянный слой композитора на каждую колонку — это
      // память, потраченная впустую.
      columns.current.forEach((column) => {
        if (column) {
          column.style.willChange = 'transform';
        }
      });

      window.addEventListener('scroll', onScroll, { passive: true });
      apply();
    };

    sync();
    wide.addEventListener('change', sync);
    calm.addEventListener('change', sync);

    return () => {
      window.removeEventListener('scroll', onScroll);
      wide.removeEventListener('change', sync);
      calm.removeEventListener('change', sync);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const split: Project[][] = [
    projects.filter((_, index) => index % 2 === 0),
    projects.filter((_, index) => index % 2 === 1),
  ];

  return (
    <section
      id="work"
      data-tone="dark"
      className="bg-ink text-paper px-5 pb-[100px] sm:px-10 sm:pb-[160px]"
    >
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-end">
          <WordChips
            as="h2"
            text="Selected Work"
            className="font-display text-ink text-right text-[clamp(40px,6vw,92px)]"
          />
        </Reveal>

        <div className="mt-16 grid gap-10 sm:mt-24 lg:grid-cols-2 lg:gap-14">
          {split.map((column, columnIndex) => (
            <div
              key={columnIndex}
              ref={(node) => {
                columns.current[columnIndex] = node;
              }}
              className={`flex flex-col gap-10 lg:gap-14 ${columnIndex === 1 ? 'lg:mt-[180px]' : ''}`}
            >
              {column.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onImage={(node) => {
                    if (node) {
                      images.current[columnIndex].push(node);
                    }
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Карточка трёхслойная: заголовок, картинка, теги. Каждый слой появляется
 * со своей задержкой в 75 мс — тем же шагом, что и везде на странице.
 */
function ProjectCard({
  project,
  onImage,
}: {
  project: Project;
  onImage: (node: HTMLElement | null) => void;
}) {
  const href = project.liveUrl ?? project.repoUrl;

  // Теги не сочиняются, а читаются из данных: есть репозиторий — есть тег.
  const tags = [project.liveUrl ? 'Live' : null, project.repoUrl ? 'Repo' : null].filter(Boolean);

  const card = (
    <article className="card bg-ink-soft overflow-hidden rounded-lg p-5 sm:p-7">
      <Reveal variant="slide">
        <WordChips
          text={project.name}
          className="font-display text-ink block text-[clamp(26px,3vw,44px)]"
        />
      </Reveal>

      <Reveal variant="mask" delay={75} className="mt-6">
        <div
          ref={onImage}
          className="border-line aspect-[4/3] w-full rounded border"
          style={{ backgroundColor: 'var(--color-line)', opacity: 0.35 }}
          aria-hidden
        />
      </Reveal>

      {project.description ? (
        <Reveal variant="fade" delay={150}>
          <p className="font-ui mt-5 max-w-[46ch] text-[14px] leading-relaxed opacity-70">
            {project.description}
          </p>
        </Reveal>
      ) : null}

      {tags.length > 0 ? (
        <Reveal variant="fade" delay={225}>
          <p className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="morph morph--box bg-surface text-ink px-2 py-[3px] font-mono text-[11px]"
              >
                {tag}
              </span>
            ))}
          </p>
        </Reveal>
      ) : null}
    </article>
  );

  if (!href) {
    return card;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="group block">
      {card}
    </a>
  );
}
