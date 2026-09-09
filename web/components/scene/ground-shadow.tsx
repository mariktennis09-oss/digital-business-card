'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { CanvasTexture, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from 'three';
import { DEVICE, OBJECT, SHADOW } from '@/lib/scene-constants';

/**
 * Тень под прибором: размытое пятно чуть темнее фона, а не shadow map.
 *
 * Честные тени ради одного объекта на плоской заливке — лишний проход
 * рендера и настройка света, которой здесь неоткуда взяться: свет тут
 * ровно для того, чтобы различались грани.
 *
 * Пятно не просто лежит под объектом, а следует его силуэту. Полуоси
 * считаются из текущей ориентации корпуса: для повёрнутой коробки габарит
 * вдоль оси — это сумма её полурёбер, взвешенных модулями строки матрицы
 * поворота. Поэтому при кувыркании тень то растягивается, когда прибор
 * повёрнут к нам углом, то поджимается, когда гранью.
 *
 * На ходе вверх-вниз пятно расплывается и бледнеет. Без этого подъём
 * читался бы как сдвиг картинки, а не как то, что объект отходит от
 * поверхности.
 */
export function GroundShadow({
  orientation,
  halfExtents,
  lift,
  reducedMotion = false,
  size = DEVICE.size,
  bobAmplitude = OBJECT.bobAmplitude,
}: {
  orientation: RefObject<Quaternion>;
  /** Полурёбра габаритной коробки объекта, уже в масштабе кадра. */
  halfExtents: Vector3;
  lift?: RefObject<{ value: number }>;
  reducedMotion?: boolean;
  /** Те же размер и размах хода, что у объекта: пятно живёт по ним. */
  size?: number;
  bobAmplitude?: number;
}) {
  const mesh = useRef<Mesh>(null);
  const rotation = useRef(new Matrix4());

  const texture = useMemo(() => createRadialTexture(), []);

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: texture,
        color: '#000000',
        transparent: true,
        depthWrite: false,
        opacity: SHADOW.opacity,
      }),
    [texture],
  );

  useEffect(
    () => () => {
      texture?.dispose();
      material.dispose();
    },
    [texture, material],
  );

  useFrame((state) => {
    const element = mesh.current;
    if (!element) {
      return;
    }

    const lifted = lift?.current.value ?? 0;

    rotation.current.makeRotationFromQuaternion(orientation.current);
    const m = rotation.current.elements;

    // Габарит повёрнутой коробки вдоль мировой оси. Матрица у three
    // хранится по столбцам, поэтому строка — это элементы 0, 4, 8.
    const acrossX =
      Math.abs(m[0]) * halfExtents.x +
      Math.abs(m[4]) * halfExtents.y +
      Math.abs(m[8]) * halfExtents.z;
    const alongZ =
      Math.abs(m[2]) * halfExtents.x +
      Math.abs(m[6]) * halfExtents.y +
      Math.abs(m[10]) * halfExtents.z;

    // Фаза хода считается по той же формуле и от тех же часов, что
    // у корпуса. Берётся именно фаза, а не готовое смещение: от неё
    // отклик тени не зависит от того, каким выставлен размах.
    const phase = reducedMotion
      ? 0
      : Math.sin((state.clock.elapsedTime * Math.PI * 2) / OBJECT.bobPeriod);

    // Чем выше объект, тем шире и бледнее пятно: так читается расстояние
    // до поверхности.
    const spread = 1 + phase * SHADOW.bobResponse + lifted * SHADOW.liftResponse;
    const fade = 1 - phase * SHADOW.bobResponse - lifted * SHADOW.liftResponse * 2;

    element.scale.set(
      acrossX * 2 * SHADOW.spread * spread,
      alongZ * 2 * SHADOW.squash * spread,
      1,
    );

    const shadowMaterial = element.material as MeshBasicMaterial;
    shadowMaterial.opacity = Math.max(0, SHADOW.opacity * fade);

    // Пятно повторяет ход вполсилы: полностью синхронное движение
    // выглядело бы приклеенным.
    element.position.y =
      -size * SHADOW.drop + phase * bobAmplitude * 0.4 - lifted * OBJECT.liftDistance * 0.18;
  });

  return (
    <mesh ref={mesh} material={material} position={[0, -size * SHADOW.drop, SHADOW.z]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

/** Радиальный градиент в текстуру: файла нет, рисуется один раз при монтировании. */
function createRadialTexture(): CanvasTexture | null {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.42, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return new CanvasTexture(canvas);
}
