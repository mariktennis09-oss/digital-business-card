import type { Experience } from '@/lib/api';
import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Опыт работы. Раздела с таким содержимым в референсе нет — он добавлен
 * потому, что визитка без мест работы бессмысленна, а достижения по каждому
 * из них уже лежат в API.
 *
 * Форма подчинена той же асимметрии: заголовок вправо, строки влево.
 * Период и длительность считает бэкенд — сайт их только показывает.
 */
export function ExperienceList({ experience }: { experience: Experience[] }) {
  return (
    <section id="experience" data-tone="light" className="px-5 py-[100px] sm:px-10 sm:py-[160px]">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-end">
          <WordChips
            as="h2"
            text="Experience"
            className="font-display text-right text-[clamp(40px,6vw,92px)]"
          />
        </Reveal>

        <div className="mt-16 flex flex-col gap-14 sm:mt-24 sm:gap-20">
          {experience.map((role) => (
            <Reveal key={role.id}>
              <article className="border-ink/15 grid gap-6 border-t pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
                <div>
                  <h3 className="font-display text-[clamp(28px,3.4vw,48px)] leading-[0.95]">
                    {role.company}
                  </h3>

                  <p className="font-ui mt-3 text-[13px] tracking-[0.05em] uppercase opacity-70">
                    {role.position}
                  </p>

                  <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="bg-surface text-ink rounded-[3px] px-2 py-[3px]">
                      {role.period}
                    </span>
                    <span
                      className={`text-ink rounded-[3px] px-2 py-[3px] ${
                        role.isCurrent ? 'bg-yellow' : 'bg-surface'
                      }`}
                    >
                      {role.durationMonths} mo
                    </span>
                  </p>
                </div>

                <ul className="font-prose flex flex-col gap-3 text-[clamp(17px,1.5vw,21px)] leading-[1.4]">
                  {role.achievements.map((achievement) => (
                    <li key={achievement.id} className="flex gap-3">
                      <span className="mt-[0.55em] h-[3px] w-4 shrink-0 bg-current opacity-40" />
                      <span>{achievement.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
