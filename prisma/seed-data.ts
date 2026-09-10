import { SkillCategory } from '@prisma/client';
import { PROFILE_SLUG } from '../src/profile/profile.constants';

/**
 * Данные визитки. Единственный источник правды: то, что здесь написано, —
 * ровно то, что отдаёт API после сида (см. стратегию resync в seed.ts).
 *
 * Правило наполнения: только реальные заказчики, проекты и ссылки.
 * Стек самой визитки (NestJS, Prisma, GraphQL, Docker) в список навыков
 * намеренно не добавлен — он показан делом, а не декларацией.
 */

/** Дата с точностью до месяца: день начала фриланс-заказа — ложная точность. */
function month(value: `${number}-${number}`): Date {
  const [year, monthNumber] = value.split('-').map(Number);

  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

interface SkillSeed {
  name: string;
  category: SkillCategory;
}

interface ExperienceSeed {
  company: string;
  position: string;
  startDate: Date;
  /** null — работа над заказом продолжается. */
  endDate: Date | null;
  achievements: string[];
}

/**
 * Инвариант «у проекта есть хотя бы одна ссылка» выражен типом, а не проверкой:
 * запись без repoUrl и без liveUrl не пройдёт компиляцию.
 */
type ProjectSeed = { name: string; description?: string } & (
  { repoUrl: string; liveUrl?: string } | { repoUrl?: string; liveUrl: string }
);

interface LinkSeed {
  label: string;
  url: string;
}

export interface SeedData {
  profile: { slug: string; name: string; description: string };
  links: LinkSeed[];
  skills: SkillSeed[];
  experience: ExperienceSeed[];
  projects: ProjectSeed[];
}

export const seedData: SeedData = {
  profile: {
    slug: PROFILE_SLUG,
    name: 'Mark Omelchenko',
    description:
      'IT-track student at Lyceum No. 23 with 2+ years of self-taught web development. ' +
      'Focused on React, Next.js and TypeScript; also work with Python on the backend. ' +
      'Have shipped commercial projects all the way to production.',
  },

  // Почта — такая же ссылка, как остальные, просто со схемой mailto. Иначе
  // адрес пришлось бы держать в вёрстке сайта, а весь контент обязан
  // приходить из API.
  links: [
    { label: 'Email', url: 'mailto:vfhrtefvbasfdb@gmail.com' },
    { label: 'GitHub', url: 'https://github.com/mariktennis09-oss' },
    { label: 'Portfolio', url: 'https://domuvmorya.ru' },
  ],

  skills: [
    { name: 'TypeScript', category: SkillCategory.FRONTEND },
    { name: 'JavaScript', category: SkillCategory.FRONTEND },
    { name: 'React', category: SkillCategory.FRONTEND },
    { name: 'Next.js (App Router)', category: SkillCategory.FRONTEND },
    { name: 'Tailwind CSS', category: SkillCategory.FRONTEND },
    { name: 'Responsive layout', category: SkillCategory.FRONTEND },

    { name: 'Python', category: SkillCategory.BACKEND },
    { name: 'REST API', category: SkillCategory.BACKEND },
    { name: 'Next.js server routes', category: SkillCategory.BACKEND },

    { name: 'AI API integration', category: SkillCategory.AI },
    { name: 'LLM capabilities and limits', category: SkillCategory.AI },

    { name: 'Git', category: SkillCategory.TOOLS },
    { name: 'Vercel', category: SkillCategory.TOOLS },
    { name: 'ESLint', category: SkillCategory.TOOLS },
  ],

  // Даты хранятся месяцем: день в резюме роли не играет, а первое число
  // делает период однозначным. endDate: null — работа продолжается, и это
  // не пропуск данных, а состояние: на нём держатся isCurrent и сортировка.
  experience: [
    {
      company: 'Njord Group',
      position: 'Frontend Developer (freelance)',
      startDate: month('2025-03'),
      endDate: null,
      achievements: [
        'Built a multi-page site on Next.js 15 (App Router) with strict TypeScript and Tailwind v4.',
        'Set up static generation for service, fleet and news pages via generateStaticParams.',
        'Implemented voyage search and cargo tracking.',
        'Wrote the server-side API route for inbound requests and prepared CRM and Yandex.Metrica integration through environment variables.',
        'Moved all copy into a separate layer (src/content) so the client edits texts without touching code.',
      ],
    },
    {
      company: 'Seaside House',
      position: 'Frontend Developer (freelance)',
      startDate: month('2024-09'),
      endDate: month('2025-01'),
      achievements: [
        'Built a single-page site for a rental house in Zelenogradsk: gallery, video tours, FAQ accordion, map and activity pages.',
        'Implemented a booking form with date range and guest count.',
        'Made the layout responsive for mobile devices.',
        'Shipped the site to production at domuvmorya.ru.',
      ],
    },
  ],

  projects: [
    {
      name: 'Njord Group',
      repoUrl: 'https://github.com/mariktennis09-oss/njordgroup',
    },
    {
      name: 'Seaside House',
      liveUrl: 'https://domuvmorya.ru',
      description: 'Rental house site in Zelenogradsk. Demo: seaside-house.vercel.app',
    },
    {
      name: 'Weather App',
      repoUrl: 'https://github.com/mariktennis09-oss/weather-app',
      description: 'React + TypeScript + Vite, Visual Crossing Timeline API integration.',
    },
    {
      name: 'Baltartec',
      repoUrl: 'https://github.com/mariktennis09-oss/baltartec',
      description: 'Backend project in Python.',
    },
    {
      name: 'Backend Business Card',
      repoUrl: 'https://github.com/mariktennis09-oss/digital-business-card',
      description: 'Business card backend on NestJS, GraphQL, Prisma and Docker — this very API.',
    },
  ],
};
