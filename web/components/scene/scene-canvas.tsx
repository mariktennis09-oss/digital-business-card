'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect, useState, type RefObject } from 'react';
import { supportsWebGl2 } from '@/lib/device';
import { LIGHTS, SCENE_CAMERA } from '@/lib/scene-constants';
import type { PointerNdc } from '@/lib/use-pointer-ndc';
import { Device } from './device';
import { GroundShadow } from './ground-shadow';
import { SceneBackground } from './scene-background';
import { SceneEnvironment } from './scene-environment';
import { Tumble, useOrientation } from './tumble';

/**
 * Единственная сцена three.js на всё приложение. Она не пересоздаётся при
 * смене секции: меняются положение объекта и цвет фона, а сцена живёт.
 *
 * Canvas стоит между двумя слоями фона — заливкой снизу и виньеткой
 * с зерном сверху. Заливка нужна на случай отсутствия WebGL: тогда canvas'а
 * нет вовсе, а страница остаётся цветной.
 *
 * Заливка при этом продублирована внутрь сцены. Это не лишнее: глитч-пасс
 * из четвёртого модуля работает по отрендеренному кадру и обязан смазывать
 * фон вместе с тенью, а не только объект. Значит цвет должен попасть
 * в кадр, а не лежать под ним в DOM.
 */
export function SceneCanvas({
  className,
  color,
  pointer,
  lift,
  reducedMotion = false,
  tumbleSpeed,
}: {
  className?: string;
  /** Цвет секции. Уходит в фон сцены — его и будет мять глитч-пасс. */
  color: string;
  pointer?: RefObject<PointerNdc>;
  lift?: RefObject<{ value: number }>;
  reducedMotion?: boolean;
  /** Подмена скорости кувыркания — нужна стенду, чтобы подобрать её глазами. */
  tumbleSpeed?: number;
}) {
  const [visible, setVisible] = useState(true);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);

  const orientation = useOrientation();

  // Проверка после монтирования: на сервере canvas создать негде, а решать
  // до гидратации нельзя — разметка разойдётся.
  useEffect(() => setWebglReady(supportsWebGl2()), []);

  useEffect(() => {
    const onVisibilityChange = () => setVisible(!document.hidden);

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  if (!webglReady) {
    return null;
  }

  return (
    <div aria-hidden className={className}>
      <Canvas
        // При «меньше движения» кадр рисуется один раз: объект стоит,
        // но остаётся на месте — убирать его незачем.
        frameloop={reducedMotion ? 'demand' : visible ? 'always' : 'never'}
        camera={{
          position: [...SCENE_CAMERA.position],
          fov: SCENE_CAMERA.fov,
          near: SCENE_CAMERA.near,
          far: SCENE_CAMERA.far,
        }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <SceneBackground color={color} />
        <SceneEnvironment />

        <ambientLight intensity={LIGHTS.ambient} />
        <directionalLight intensity={LIGHTS.key} position={[...LIGHTS.keyPosition]} />
        {/* Контровой отбивает рёбра от заливки, иначе тёмный корпус
            сливается с фоном по контуру. */}
        <directionalLight intensity={LIGHTS.rim} position={[...LIGHTS.rimPosition]} />

        {/* Стоит раньше потребителей ориентации: его кадровый обработчик
            подписывается первым и отрабатывает до них. */}
        <Tumble orientation={orientation} speed={tumbleSpeed} reducedMotion={reducedMotion} />

        <GroundShadow orientation={orientation} lift={lift} reducedMotion={reducedMotion} />
        <Device
          orientation={orientation}
          pointer={pointer}
          lift={lift}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
