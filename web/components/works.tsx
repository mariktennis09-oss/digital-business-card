'use client';

import { useEffect, useRef } from 'react';
import type { Project } from '@/lib/api';
import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Две колонки кейсов, намеренно сбитые по вертикали и уезжающие с разной
 * скоростью. Из-за разной скорости колонки всё время расходятся, и лента
 * не читается как обычная сетка карточек.
 *
 * Смещение и скорости — только на широком экране. В одну колонку всё это
 * складывается в дёрганый скачок: сдвигать нечего относительно чего.
 */
const COLUMN_SPEED = [-0.05, -0.12];

export function Works({ projects }: { projects: Project[] }) {
  const columns = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    let frame = 0;

    const apply = () => {
      frame = 0;
      const offset = window.scrollY;

      columns.current.forEach((column, index) => {
        if (column) {
          column.style.transform = `translateY(${offset * COLUMN_SPEED[index]}px)`;
        }
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
        }
      });
    };

    const sync = () => {
      window.removeEventListener('scroll', onScroll);
      reset();

      if (wide.matches && !calm.matches) {
        window.addEventListener('scroll', onScroll, { passive: true });
        apply();
      }
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
    <section id="work" className="bg-ink text-paper px-5 pb-[100px] sm:px-10 sm:pb-[160px]">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-end">
          <WordChips
            as="h2"
            text="Selected Work"
            className="font-display text-ink text-right text-[clamp(40px,6vw,92px)]"
          />
        </Reveal>

        <div className="mt-16 grid gap-10 sm:mt-24 lg:grid-cols-2 lg:gap-14">
          {split.map((column, index) => (
            <div
              key={index}
              ref={(node) => {
                columns.current[index] = node;
              }}
              className={`flex flex-col gap-10 lg:gap-14 ${index === 1 ? 'lg:mt-[180px]' : ''}`}
            >
              {column.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const href = project.liveUrl ?? project.repoUrl;

  // Теги не сочиняются, а читаются из данных: есть репозиторий — есть тег.
  const tags = [project.liveUrl ? 'Live' : null, project.repoUrl ? 'Repo' : null].filter(Boolean);

  const card = (
    <article className="bg-ink-soft rounded-lg p-5 transition-transform duration-300 group-hover:scale-[1.015] sm:p-7">
      <WordChips
        text={project.name}
        className="font-display text-ink block text-[clamp(26px,3vw,44px)]"
      />

      <div
        className="border-line mt-6 aspect-[4/3] w-full rounded border"
        style={{ backgroundColor: 'var(--color-line)', opacity: 0.35 }}
        aria-hidden
      />

      {project.description ? (
        <p className="font-ui mt-5 max-w-[46ch] text-[14px] leading-relaxed opacity-70">
          {project.description}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <p className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-surface text-ink rounded-[3px] px-2 py-[3px] font-mono text-[11px]"
            >
              {tag}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );

  if (!href) {
    return <Reveal>{card}</Reveal>;
  }

  return (
    <Reveal>
      <a href={href} target="_blank" rel="noreferrer noopener" className="group block">
        {card}
      </a>
    </Reveal>
  );
}
