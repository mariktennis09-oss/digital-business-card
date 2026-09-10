import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Первый тёмный блок. Встык с бумажным, без разделителя и градиента —
 * переключение фона здесь работает как смена кадра.
 *
 * Композиция асимметрична: имя прижато вправо, проза влево, между ними
 * большая пустота. Это правило всей страницы, центрируются только
 * навигация и слоган в футере.
 */
export function Manifesto({ name, description }: { name: string; description: string }) {
  return (
    <section className="bg-ink text-paper px-5 py-[100px] sm:px-10 sm:py-[160px]">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-end">
          <WordChips
            as="h2"
            text={name}
            className="font-display text-ink max-w-[10ch] text-right text-[clamp(40px,6vw,92px)]"
          />
        </Reveal>

        <div className="mt-16 grid gap-12 sm:mt-24 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <p className="font-prose text-[clamp(20px,2.2vw,30px)] leading-[1.35]">{description}</p>
          </Reveal>

          <Reveal className="self-start">
            {/* Заглушка под ролик: настоящего видео нет, и рисовать вместо
                него декоративную картинку значило бы соврать. */}
            <div
              className="border-line bg-ink-soft relative aspect-video w-full border"
              role="img"
              aria-label="Место под видео о работе"
            >
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  className="border-y-[14px] border-l-[24px] border-y-transparent"
                  style={{ borderLeftColor: 'var(--color-paper)' }}
                />
              </span>
              <span className="absolute bottom-3 left-4 font-mono text-[11px] opacity-50">
                Showreel — soon
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
