'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '@/lib/api';
import { CommandPalette } from './command-palette';
import { ExperienceList } from './experience-list';
import { Hero } from './hero';
import { Manifesto } from './manifesto';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { Stack } from './stack';
import { Works } from './works';

/**
 * Клиентская оболочка страницы. Данные приходят готовыми с сервера —
 * здесь только то, что требует браузера: клавиша «/» и состояние палитры.
 *
 * Слоган живёт в коде, а не в API. Это не контент визитки, а строка
 * фирменного стиля: она разбивается на плашки по правилам вёрстки, и
 * менять её вместе с данными профиля не нужно.
 */
const SLOGAN = 'Frontend Developer Shipping Real Products';

export function Site({ profile }: { profile: Profile }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      // Пока курсор в поле ввода, «/» — обычный символ. Без этой проверки
      // палитра перехватывала бы саму себя.
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      event.preventDefault();
      setPaletteOpen(true);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const email = profile.links.find((link) => link.url.startsWith('mailto:')) ?? null;
  const social = profile.links.filter((link) => link !== email);

  return (
    <>
      <SiteHeader onOpenPalette={openPalette} />

      <main>
        <Hero slogan={SLOGAN} since={startingYear(profile)} email={email} />
        <Manifesto name={profile.name} description={profile.description} />
        <Works projects={profile.projects} />
        <ExperienceList experience={profile.experience} />
        <Stack skills={profile.skills} />
      </main>

      <SiteFooter slogan={SLOGAN} name={profile.name} email={email} links={social} />

      <CommandPalette open={paletteOpen} onClose={closePalette} />
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
