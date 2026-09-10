'use client';

import { useEffect, useRef, useState } from 'react';
import { COMMANDS } from '@/lib/design';

/**
 * Командная строка по «/». Не украшение: она же переключает режимы «bw»
 * и «negative», которых иначе не достать ниоткуда.
 *
 * Режимы вешаются классом на <html>, а не на состояние React. Палитра
 * цветов задана переменными CSS, и подмена их на предке перекрашивает
 * страницу целиком — включая то, что нарисовано в SVG.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValue('');
    setMessage(null);
    input.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const run = (raw: string) => {
    const command = raw.trim().toLowerCase();
    const root = document.documentElement;

    switch (command) {
      case 'close':
        onClose();
        return;

      case 'bw':
        root.classList.toggle('mode-bw');
        setMessage('акцентные цвета переключены');
        return;

      case 'negative':
        root.classList.toggle('mode-negative');
        setMessage('бумага и чернила поменялись местами');
        return;

      case 'reset':
        root.classList.remove('mode-bw', 'mode-negative');
        setMessage('всё вернулось как было');
        return;

      case 'home':
        window.scrollTo({ top: 0 });
        onClose();
        return;

      default:
        break;
    }

    const target = document.getElementById(command);

    if (target) {
      target.scrollIntoView({ block: 'start' });
      onClose();
      return;
    }

    setMessage(`не знаю такой команды: ${command}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Командная строка"
    >
      {/* Подложка закрывает по щелчку мимо панели. Затемнение сплошное:
          стеклянных размытий в этой системе нет. */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(13, 13, 14, 0.55)' }}
      />

      <div
        className="relative w-full max-w-[560px] rounded-lg p-5"
        style={{ backgroundColor: '#0d0d0e', color: '#faf6ef' }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(value);
            setValue('');
          }}
          className="flex items-center gap-2 font-mono text-[13px]"
        >
          <label htmlFor="command-input" className="shrink-0 opacity-70">
            {'T:\\>'}
          </label>
          <input
            id="command-input"
            ref={input}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent outline-none"
          />
        </form>

        <p className="mt-4 font-mono text-[11px] opacity-50">
          {message ?? 'Enter — выполнить, Esc — закрыть'}
        </p>

        <ul className="mt-4 grid gap-1.5 font-mono text-[11px] sm:grid-cols-2">
          {COMMANDS.map((command) => (
            <li key={command.name}>
              <button
                type="button"
                onClick={() => run(command.name)}
                className="w-full text-left opacity-70 transition-opacity duration-300 hover:opacity-100"
              >
                <span className="inline-block w-[11ch]">{command.name}</span>
                <span className="opacity-60">{command.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
