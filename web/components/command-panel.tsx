'use client';

import { useEffect, useRef, useState } from 'react';
import { COMMANDS } from '@/lib/design';

export interface Effects {
  bw: boolean;
  negative: boolean;
  crt: boolean;
}

export const NO_EFFECTS: Effects = { bw: false, negative: false, crt: false };

/**
 * Командный терминал. Выдвигается справа и раздвигает страницу, а не
 * накрывает её: содержимое уезжает влево ровно на ширину панели.
 *
 * Панель живёт вне оболочки, к которой применяются фильтры. Иначе в режиме
 * инверсии она инвертировалась бы вместе со страницей, и кнопка, которой
 * эффект выключают, оказалась бы нечитаемой ровно тогда, когда нужна.
 */
export function CommandPanel({
  open,
  effects,
  onClose,
  onEffects,
}: {
  open: boolean;
  effects: Effects;
  onClose: () => void;
  onEffects: (next: Effects) => void;
}) {
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

  const active = effects.bw || effects.negative || effects.crt;

  const run = (raw: string) => {
    const command = raw.trim().toLowerCase();

    switch (command) {
      case 'close':
        onClose();
        return;

      case 'bw':
        onEffects({ ...effects, bw: !effects.bw });
        setMessage('обесцвечивание переключено');
        return;

      case 'negative':
        onEffects({ ...effects, negative: !effects.negative });
        setMessage('инверсия переключена');
        return;

      case 'crt':
        onEffects({ ...effects, crt: !effects.crt });
        setMessage('скан-линии переключены');
        return;

      case 'reset':
        onEffects(NO_EFFECTS);
        setMessage('всё вернулось как было');
        return;

      case 'home':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onClose();
        return;

      default:
        break;
    }

    const target = document.getElementById(command);

    if (target) {
      target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      onClose();
      return;
    }

    setMessage(`не знаю такой команды: ${command}`);
  };

  return (
    <aside
      className={`panel bg-surface text-ink ${open ? 'panel--open' : ''}`}
      aria-hidden={!open}
      aria-label="Командная строка"
    >
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
        <h2 className="font-ui text-[13px] tracking-[0.05em] uppercase opacity-70">Terminal</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(value);
            setValue('');
          }}
          className="border-ink/20 flex items-center gap-2 border-b pb-2 font-mono text-[13px]"
        >
          <label htmlFor="command-input" className="shrink-0 opacity-60">
            :/
          </label>
          <input
            id="command-input"
            ref={input}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Enter Command"
            spellCheck={false}
            autoComplete="off"
            tabIndex={open ? 0 : -1}
            className="w-full bg-transparent outline-none placeholder:opacity-40"
          />
        </form>

        <p className="font-mono text-[11px] opacity-60">
          {message ?? 'Введи команду или нажми на чип ниже'}
        </p>

        <ul className="flex flex-wrap gap-1.5">
          {COMMANDS.map((command, index) => (
            <li key={command.name}>
              <button
                type="button"
                onClick={() => run(command.name)}
                title={command.description}
                tabIndex={open ? 0 : -1}
                className={`morph bg-paper hover:bg-ink hover:text-paper px-2.5 py-1 font-mono text-[11px] ${
                  index % 2 === 0 ? 'morph--pill' : 'morph--box'
                }`}
              >
                {command.name}
              </button>
            </li>
          ))}
        </ul>

        {active ? (
          <button
            type="button"
            onClick={() => onEffects(NO_EFFECTS)}
            tabIndex={open ? 0 : -1}
            className="morph morph--box bg-ink text-paper px-3 py-2 font-mono text-[11px]"
          >
            Clear Effects
          </button>
        ) : null}

        <p className="mt-auto font-mono text-[11px] opacity-50">ESC to close</p>
      </div>
    </aside>
  );
}
