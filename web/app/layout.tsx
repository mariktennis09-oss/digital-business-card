import type { Metadata, Viewport } from 'next';
import { Archivo_Narrow, DM_Mono, Handjet, Tinos } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * Четыре гарнитуры, у каждой одна роль. Контраст пиксельного дисплейного
 * шрифта и классической антиквы — ядро стиля: убери одно из двух, и
 * страница станет обычным лендингом.
 *
 * Берутся через next/font: файлы скачиваются на сборке и раздаются со
 * своего домена. В рантайме запроса на сторону нет, и вёрстка не скачет
 * при загрузке.
 */
const handjet = Handjet({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-handjet',
  display: 'swap',
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  variable: '--font-archivo-narrow',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

const tinos = Tinos({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-tinos',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mark Omelchenko — Full-Stack Developer',
  description:
    'Full-stack developer working with React, Next.js, TypeScript and NestJS. Selected work, experience and stack.',
};

export const viewport: Viewport = {
  themeColor: '#faf6ef',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${handjet.variable} ${archivoNarrow.variable} ${dmMono.variable} ${tinos.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
