import type { Skill } from '@/lib/api';
import { SKILL_CATEGORIES } from '@/lib/design';
import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Стек. По форме это список из референса — цветной моно-чип категории плюс
 * содержимое строки, выключка вправо.
 *
 * Категории перечислены в константах, а не выведены из данных: порядок
 * важен (фронтенд первым, инструменты последними), а сортировать по алфавиту
 * или по количеству навыков значило бы отдать этот порядок случаю.
 * Категория без навыков не рисуется вовсе.
 */
export function Stack({ skills }: { skills: Skill[] }) {
  return (
    <section id="stack" className="px-5 pb-[100px] sm:px-10 sm:pb-[160px]">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-end">
          <WordChips
            as="h2"
            text="Stack"
            className="font-display text-right text-[clamp(40px,6vw,92px)]"
          />
        </Reveal>

        <div className="mt-14 flex flex-col items-end gap-6 sm:mt-20 sm:gap-8">
          {SKILL_CATEGORIES.map((category) => {
            const inCategory = skills.filter((skill) => skill.category === category.id);

            if (inCategory.length === 0) {
              return null;
            }

            return (
              <Reveal key={category.id} className="w-full">
                <div className="border-ink/15 flex flex-wrap items-baseline justify-end gap-x-4 gap-y-3 border-t pt-5 text-right">
                  <span
                    className="text-ink rounded-[3px] px-2 py-[3px] font-mono text-[11px]"
                    style={{ backgroundColor: `var(--color-${category.accent})` }}
                  >
                    {category.label}
                  </span>

                  <p className="font-display text-[clamp(22px,2.6vw,40px)] leading-[1.05]">
                    {inCategory.map((skill) => skill.name).join(' · ')}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
