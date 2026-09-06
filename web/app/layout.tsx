import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { SECTION_COLORS } from '@/lib/scene-constants';
import './globals.css';

/**
 * Шрифты берутся через next/font: файлы скачиваются на сборке и раздаются
 * со своего домена. В рантайме запроса на сторону нет, и вёрстка не скачет
 * при загрузке.
 *
 * Направление «Полевой терминал»: гротеск с сильной разрядкой на вордмарк,
 * моноширинный — на всё остальное. Переменные названы по роли, а не по
 * имени гарнитуры: смена шрифта не должна тянуть за собой правку разметки.
 */
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-face',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mark Omelchenko — Frontend Developer',
  description:
    'Frontend developer working with React, Next.js and TypeScript. Selected work, projects and skills.',
};

export const viewport: Viewport = {
  themeColor: SECTION_COLORS.home,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
