'use client';

import gsap from 'gsap';
import { useRef, useState } from 'react';
import { Backdrop } from '@/components/scene/backdrop';
import { SceneCanvas } from '@/components/scene/scene-canvas';
import {
  BACKDROP,
  SECTION_COLORS,
  SURFACE,
  TUMBLE_PRESETS,
  type SectionColorKey,
} from '@/lib/scene-constants';
import { usePointerNdc } from '@/lib/use-pointer-ndc';

const COLOR_KEYS = Object.keys(SECTION_COLORS) as SectionColorKey[];

/**
 * Стенд шага 3: прибор в сцене поверх заливки. Кувыркание по всем осям,
 * покачивание, тень по силуэту и доворот за курсором — всё, что объект
 * умеет сам, без панели, рамки и переходов.
 *
 * Скорость кувыркания переключается здесь же: подобрать её глазами
 * быстрее, чем описывать словами и переводить в числа. Выбранное значение
 * переезжает в TUMBLE, стенд остаётся для проверки.
 *
 * Кнопка «поднять» дёргает ту же величину, которой на странице будет
 * распоряжаться таймлайн открытия панели: проверить движение проще здесь,
 * чем внутри готовой оркестровки.
 */
export default function ObjectLabPage() {
  const fill = useRef<HTMLDivElement>(null);
  const lift = useRef({ value: 0 });
  const pointer = usePointerNdc();

  const [color, setColor] = useState<SectionColorKey>('home');
  const [lifted, setLifted] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  function switchColor(key: SectionColorKey) {
    setColor(key);

    if (fill.current) {
      gsap.to(fill.current, {
        backgroundColor: SECTION_COLORS[key],
        duration: BACKDROP.duration,
        ease: BACKDROP.ease,
      });
    }
  }

  function toggleLift() {
    const next = !lifted;
    setLifted(next);
    gsap.to(lift.current, { value: next ? 1 : 0, duration: 0.7, ease: 'power3.out' });
  }

  return (
    <main className="relative h-dvh w-full" style={{ color: SURFACE.text }}>
      <Backdrop fillRef={fill} initialColor={SECTION_COLORS.home} />
      <SceneCanvas
        className="fixed inset-0 -z-20"
        color={SECTION_COLORS[color]}
        pointer={pointer}
        lift={lift}
        tumbleSpeed={speed}
      />

      <div className="pointer-events-none flex h-full flex-col justify-between p-6 sm:p-8">
        <p className="font-mono text-xs tracking-[0.16em] uppercase">Object — isolated</p>

        <div className="pointer-events-auto flex flex-col gap-5">
          <Row label="Цвет секции">
            {COLOR_KEYS.map((key) => (
              <Chip key={key} active={key === color} onClick={() => switchColor(key)}>
                {key}
              </Chip>
            ))}

            <Chip active={lifted} onClick={toggleLift}>
              {lifted ? 'опустить' : 'поднять'}
            </Chip>
          </Row>

          <Row label="Кувыркание">
            {TUMBLE_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                active={preset.scale === speed}
                onClick={() => setSpeed(preset.scale)}
              >
                {preset.label} · {preset.scale}
              </Chip>
            ))}
          </Row>
        </div>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-32 font-mono text-[11px] tracking-[0.16em] uppercase opacity-70">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[11px] tracking-[0.14em] uppercase transition-opacity ${
        active ? 'opacity-100' : 'opacity-55 hover:opacity-100'
      }`}
      style={{
        border: `1px solid ${SURFACE.text}`,
        borderStyle: active ? 'solid' : 'dashed',
        padding: '5px 12px',
      }}
    >
      {children}
    </button>
  );
}
