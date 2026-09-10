'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '@/lib/api';
import { useScrollState } from '@/lib/use-scroll-state';
import { CommandPanel, NO_EFFECTS, type Effects } from './command-panel';
import { CrtOverlay } from './crt-overlay';
import { ExperienceList } from './experience-list';
import { Hero } from './hero';
import { IntroCurtain, INTRO_DURATION_MS } from './intro-curtain';
import { Manifesto } from './manifesto';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Stack } from './stack';
import { Works } from './works';

/**
 * Клиентская оболочка страницы. Данные приходят готовыми с сервера —
 * здесь только то, что требует браузера: клавиша «/», состояние панели,
 * режимы эффектов и блокировка прокрутки на время интро.
 *
 * Слоган живёт в коде, а не в API. Это не контент визитки, а строка
 * фирменного стиля: она разбивается на плашки по правилам вёрстки, и
 * менять её вместе с данными профиля не нужно.
 */
const SLOGAN = 'Frontend Developer Shipping Real Products';

export function Site({ profile }: { profile: Profile }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [effects, setEffects] = useState<Effects>(NO_EFFECTS);
  const { activeSection, tone } = useScrollState();

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Пока идёт сборка, страница не прокручивается: интро иначе проматывают
  // раньше, чем оно доиграет, и от него остаётся только дёрганый кусок.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    document.body.dataset.intro = 'running';
    const timer = window.setTimeout(() => {
      delete document.body.dataset.intro;
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
      delete document.body.dataset.intro;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      // Пока курсор в поле ввода, «/» — обычный символ. Без этой проверки
      // панель перехватывала бы саму себя.
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      event.preventDefault();
      setPanelOpen(true);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const email = profile.links.find((link) => link.url.startsWith('mailto:')) ?? null;
  const social = profile.links.filter((link) => link !== email);

  const shell = [
    'shell',
    panelOpen ? 'shell--pushed' : '',
    effects.bw ? 'shell--bw' : '',
    effects.negative ? 'shell--negative' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={shell}>
        <SiteHeader tone={tone} activeSection={activeSection} onOpenPalette={openPanel} />

        <main>
          <Hero slogan={SLOGAN} since={startingYear(profile)} email={email} />
          <Manifesto name={profile.name} description={profile.description} />
          <Works projects={profile.projects} />
          <ExperienceList experience={profile.experience} />
          <Stack skills={profile.skills} />
        </main>

        <SiteFooter slogan={SLOGAN} name={profile.name} email={email} links={social} />
      </div>

      <CommandPanel
        open={panelOpen}
        effects={effects}
        onClose={closePanel}
        onEffects={setEffects}
      />

      {effects.crt ? <CrtOverlay /> : null}

      <IntroCurtain />
    </>
  );
}

/**
 * Год, с которого считается стаж, — самый ранний год начала работы.
 * Считается из данных, а не вписан числом: иначе он врал бы ровно через
 * год после того, как его вписали.
 */
function startingYear(profile: Profile): number {
  const years = profile.experience
    .map((role) => new Date(role.startDate).getFullYear())
    .filter((year) => Number.isFinite(year));

  return years.length > 0 ? Math.min(...years) : new Date().getFullYear();
}
