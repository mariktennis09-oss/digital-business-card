'use client';

import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Backdrop } from '@/components/scene/backdrop';
import { DashedFrame } from '@/components/scene/dashed-frame';
import { Device } from '@/components/scene/device';
import { SceneBackground } from '@/components/scene/scene-background';
import { SceneEnvironment } from '@/components/scene/scene-environment';
import { Tumble, useOrientation } from '@/components/scene/tumble';
import { createDeviceModel } from '@/lib/device-model';
import {
  BACKDROP,
  DEVICE,
  FRAME,
  FRAME_PRESETS,
  LIGHTS,
  SCENE_CAMERA,
  SECTION_COLORS,
  SURFACE,
  type SectionColorKey,
} from '@/lib/scene-constants';
import { usePointerNdc } from '@/lib/use-pointer-ndc';

const COLOR_KEYS = Object.keys(SECTION_COLORS) as SectionColorKey[];

/**
 * Стенд шага 4: пунктирная оболочка отдельно от всего остального.
 *
 * Промт прямо требует отлаживать этот модуль изолированно, поэтому здесь
 * своя сцена, а не общая SceneCanvas: прибор включается кнопкой, и видно,
 * что рамка живёт сама по себе — своё вращение, свой перекос, своё
 * мерцание рёбер.
 *
 * Раздувание на странице пойдёт от скорости курсора. Здесь его вдобавок
 * можно задрать кнопкой: проверять форму в крайнем положении, елозя мышью,
 * невозможно.
 */
export default function FrameLabPage() {
  const fill = useRef<HTMLDivElement>(null);
  const lift = useRef({ value: 0 });
  const force = useRef({ value: 0 });
  const pointer = usePointerNdc();

  const deviceOrientation = useOrientation();
  const frameOrientation = useOrientation();

  const [color, setColor] = useState<SectionColorKey>('home');
  const [showDevice, setShowDevice] = useState(true);
  const [inflated, setInflated] = useState(false);
  const [swollenHalf, setSwollenHalf] = useState<number>(FRAME.swollenHalf);

  const model = useMemo(() => createDeviceModel(), []);
  useEffect(() => () => model.dispose(), [model]);

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

  function toggleInflate() {
    const next = !inflated;
    setInflated(next);
    gsap.to(force.current, { value: next ? 1 : 0, duration: 0.5, ease: 'power2.out' });
  }

  return (
    <main className="relative h-dvh w-full" style={{ color: SURFACE.text }}>
      <Backdrop fillRef={fill} initialColor={SECTION_COLORS.home} />

      <div aria-hidden className="fixed inset-0 -z-20">
        <Canvas
          camera={{
            position: [...SCENE_CAMERA.position],
            fov: SCENE_CAMERA.fov,
            near: SCENE_CAMERA.near,
            far: SCENE_CAMERA.far,
          }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <SceneBackground color={SECTION_COLORS[color]} />
          <SceneEnvironment />

          <ambientLight intensity={LIGHTS.ambient} />
          <directionalLight intensity={LIGHTS.key} position={[...LIGHTS.keyPosition]} />
          <directionalLight intensity={LIGHTS.rim} position={[...LIGHTS.rimPosition]} />

          <Tumble orientation={deviceOrientation} />
          <Tumble orientation={frameOrientation} speeds={FRAME.tumble} />

          {showDevice ? (
            <Device model={model.object} orientation={deviceOrientation} pointer={pointer} lift={lift} />
          ) : null}

          <DashedFrame
            orientation={frameOrientation}
            pointer={pointer}
            lift={lift}
            force={force}
            swollenHalf={swollenHalf}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none flex h-full flex-col justify-between p-6 sm:p-8">
        <div>
          <p className="font-mono text-xs tracking-[0.16em] uppercase">Frame — isolated</p>
          <p className="mt-2 max-w-md font-mono text-[11px] leading-relaxed opacity-70">
            Подвигай мышью резко — рамка раздуется от скорости движения и осядет обратно.
            Кнопка держит её раздутой, чтобы разглядеть форму.
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col gap-5">
          <Row label="Цвет секции">
            {COLOR_KEYS.map((key) => (
              <Chip key={key} active={key === color} onClick={() => switchColor(key)}>
                {key}
              </Chip>
            ))}
          </Row>

          <Row label="Раздувание">
            {FRAME_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                active={preset.swollenHalf === swollenHalf}
                onClick={() => setSwollenHalf(preset.swollenHalf)}
              >
                {preset.label} · {preset.swollenHalf}
              </Chip>
            ))}
          </Row>

          <Row label="Проверка">
            <Chip active={inflated} onClick={toggleInflate}>
              {inflated ? 'отпустить' : 'держать раздутой'}
            </Chip>
            <Chip active={showDevice} onClick={() => setShowDevice((value) => !value)}>
              {showDevice ? 'спрятать прибор' : 'показать прибор'}
            </Chip>
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-55">
              покой {FRAME.restHalf} · размер {DEVICE.size}
            </span>
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
