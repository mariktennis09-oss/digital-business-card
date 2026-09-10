'use client';

/**
 * Граница ошибок на всё приложение.
 *
 * Без неё Next показывает одну строчку про «client-side exception» и
 * отправляет в консоль браузера. Текст ошибки выводится прямо на странице:
 * так поломку видно сразу, без открытых инструментов разработчика.
 *
 * В продакшен-сборке React не отдаёт сюда сообщение — остаётся только
 * digest, короткий идентификатор записи в логе сервера. Показываем то,
 * что есть.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-paper text-ink flex min-h-dvh flex-col justify-center gap-6 px-5 py-10 sm:px-10">
      <p className="font-ui text-[13px] tracking-[0.05em] uppercase opacity-70">Ошибка на странице</p>

      <pre className="font-mono max-w-3xl text-[13px] leading-relaxed break-words whitespace-pre-wrap">
        {error.message || 'Сообщение недоступно в этой сборке.'}
      </pre>

      {error.digest ? (
        <p className="font-mono text-[11px] opacity-55">digest {error.digest}</p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={reset}
          className="bg-surface text-ink hover:bg-ink hover:text-paper font-ui rounded-full px-5 py-2.5 text-[13px] tracking-[0.05em] uppercase transition-colors duration-300"
        >
          попробовать снова
        </button>
      </div>
    </main>
  );
}
