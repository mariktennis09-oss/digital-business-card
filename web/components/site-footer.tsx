import type { ProfileLink } from '@/lib/api';
import { Reveal } from './reveal';
import { WordChips } from './word-chips';

/**
 * Футер повторяет слоган плашками — единственное место, кроме навигации,
 * где что-то центрируется. Повтор намеренный: страница открывается и
 * закрывается одной и той же фразой.
 */
export function SiteFooter({
  slogan,
  name,
  email,
  links,
}: {
  slogan: string;
  name: string;
  email: ProfileLink | null;
  links: ProfileLink[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer id="connect" data-tone="light" className="bg-surface px-5 py-[80px] sm:px-10 sm:py-[120px]">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="flex justify-center">
          <WordChips
            text={slogan}
            className="font-display max-w-[14ch] text-center text-[clamp(40px,7vw,110px)]"
          />
        </Reveal>

        <div className="mt-20 grid gap-6 font-mono text-[12px] sm:mt-28 lg:grid-cols-3 lg:items-center">
          <p className="opacity-70">
            ©{year} {name}® All Rights Reserved
          </p>

          <p className="flex flex-wrap items-center justify-start gap-3 lg:justify-center">
            <span className="bg-lilac text-ink rounded-[3px] px-2 py-[3px]">General Enquiries</span>
            {email ? (
              <a href={email.url} className="underline-offset-4 hover:underline">
                {email.url.replace(/^mailto:/, '')}
              </a>
            ) : null}
          </p>

          <p className="flex flex-wrap gap-5 lg:justify-end">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="tracking-[0.04em] uppercase underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
