'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { Group, Quaternion } from 'three';
import { OBJECT } from '@/lib/scene-constants';
import type { PointerNdc } from '@/lib/use-pointer-ndc';

/**
 * Поведение центрального объекта: положение, покачивание, доворот за
 * курсором и подъём при открытой панели.
 *
 * Сама модель приходит готовой снаружи. Здесь про её устройство ничего не
 * известно намеренно: заменить прибор на другой — значит положить новый
 * файл модели, а не править этот компонент.
 *
 * Две вложенные группы, и это не лишний уровень. Внешняя отвечает за
 * положение и доворот за курсором, внутренняя — за собственное кувыркание.
 * Смешать их в одном узле нельзя: доворот задаётся углами от курсора,
 * кувыркание — накопленным кватернионом, и одно затирало бы другое.
 */
export function Device({
  model,
  orientation,
  pointer,
  lift,
  reducedMotion = false,
}: {
  /** Готовая группа модели: центрирована и приведена к габаритам кадра. */
  model: Group;
  /** Накопленная ориентация. Считает её Tumble, здесь только применяется. */
  orientation: RefObject<Quaternion>;
  /** Курсор в NDC. Читается в кадровом цикле, перерисовок React не вызывает. */
  pointer?: RefObject<PointerNdc>;
  /** 0 — объект в центре, 1 — уехал вверх за край. Ведёт таймлайн панели. */
  lift?: RefObject<{ value: number }>;
  reducedMotion?: boolean;
}) {
  const carrier = useRef<Group>(null);
  const spinner = useRef<Group>(null);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const outer = carrier.current;
    const inner = spinner.current;

    if (!outer || !inner) {
      return;
    }

    const lifted = lift?.current.value ?? 0;

    inner.quaternion.copy(orientation.current);

    const bob = reducedMotion
      ? 0
      : Math.sin((state.clock.elapsedTime * Math.PI * 2) / OBJECT.bobPeriod) * OBJECT.bobAmplitude;

    outer.position.y = bob + lifted * OBJECT.liftDistance;

    // Доворот за курсором: цель считается из позиции мыши, фактический угол
    // идёт к ней через lerp — объект догоняет лениво, с запаздыванием.
    const target = pointer?.current;
    if (target?.active && !reducedMotion) {
      const factor = 1 - Math.pow(1 - OBJECT.tiltLerp, delta * 60);
      tilt.current.x += (-target.y * OBJECT.tiltMax - tilt.current.x) * factor;
      tilt.current.y += (target.x * OBJECT.tiltMax - tilt.current.y) * factor;
    }

    outer.rotation.x = tilt.current.x;
    outer.rotation.z = tilt.current.y * OBJECT.tiltRoll;
  });

  return (
    <group ref={carrier}>
      <group ref={spinner}>
        <primitive object={model} />
      </group>
    </group>
  );
}
