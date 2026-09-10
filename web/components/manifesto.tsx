import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Первый тёмный блок. Встык с бумажным, без разделителя и градиента —
 * переключение фона здесь работает как смена кадра.
 *
 * Заголовок приколот: он стоит на месте, пока абзац проезжает под ним.
 * Держит его `position: sticky`, а не пересчёт координат в кадровом цикле —
 * браузер делает это сам, ничего не рассинхронизируя при изменении размера
 * окна. Поэтому имя и проза лежат в соседних колонках одной сетки: у
 * прилипания нет способа удержать элемент за пределами своего родителя.
 */
export function Manifesto({ name, description }: { name: string; description: string }) {
  return (
    <section
      data-tone="dark"
      className="bg-ink text-paper px-5 py-[100px] sm:px-10 sm:py-[160px]"
    >
      <div className="mx-auto grid max-w-[1600px] gap-16 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] lg:gap-20">
        <div className="order-2 flex flex-col gap-12 lg:order-1">
          <Reveal variant="slide">
            <p className="font-prose text-[clamp(20px,2.2vw,30px)] leading-[1.35]">{description}</p>
          </Reveal>

          {/* Заглушка под ролик: настоящего видео нет, и рисовать вместо
              него декоративную картинку значило бы соврать. Открывается
              шторкой — прямоугольник, проявляющийся фейдом, читается как
              недогруженная картинка. */}
          <Reveal variant="mask" delay={200}>
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

        <div className="order-1 lg:order-2">
          <div className="pin flex justify-end">
            <WordChips
              as="h2"
              text={name}
              className="font-display text-ink max-w-[10ch] text-right text-[clamp(40px,6vw,92px)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
