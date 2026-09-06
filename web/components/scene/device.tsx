'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Group, MeshStandardMaterial, Quaternion } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DEVICE, DEVICE_MATERIALS, ENVIRONMENT, OBJECT } from '@/lib/scene-constants';
import type { PointerNdc } from '@/lib/use-pointer-ndc';

/**
 * Центральный объект — полевой терминал: компактный прибор с пропорциями,
 * близкими к кубу.
 *
 * Собран из примитивов, а не загружен моделью. Внешнего файла нет, значит
 * нечего сжимать Draco и нечем ошибиться на прелоаде: первый кадр рисуется
 * сразу. Когда появится настоящая модель, она подменит содержимое этой
 * группы — снаружи ничего не изменится.
 *
 * Корпус тёмный и матовый, силуэт держится контрастом с яркой заливкой.
 * Фаска по рёбрам нужна именно для того, чтобы на них садился слабый блик:
 * острое ребро на матовом материале не видно вовсе.
 *
 * Две вложенные группы, и это не лишний уровень. Внешняя отвечает за
 * положение и доворот за курсором, внутренняя — за собственное кувыркание.
 * Смешать их в одном узле нельзя: доворот задаётся углами от курсора,
 * кувыркание — накопленным кватернионом, и одно затирало бы другое.
 */
export function Device({
  orientation,
  pointer,
  lift,
  reducedMotion = false,
}: {
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

  const shell = useMemo(
    () =>
      new RoundedBoxGeometry(
        DEVICE.body.width,
        DEVICE.body.height,
        DEVICE.body.depth,
        1,
        DEVICE.body.bevel,
      ),
    [],
  );

  useEffect(() => () => shell.dispose(), [shell]);

  const materials = useMemo(() => {
    const common = { envMapIntensity: ENVIRONMENT.intensity };

    return {
      shell: new MeshStandardMaterial({
        ...common,
        color: DEVICE_MATERIALS.shell,
        roughness: 0.82,
        metalness: 0.08,
        flatShading: true,
      }),
      recess: new MeshStandardMaterial({
        ...common,
        color: DEVICE_MATERIALS.recess,
        roughness: 0.62,
        metalness: 0.12,
      }),
      mark: new MeshStandardMaterial({ ...common, color: DEVICE_MATERIALS.mark, roughness: 0.55 }),
      stripe: new MeshStandardMaterial({ color: DEVICE_MATERIALS.stripe, roughness: 0.5 }),
      // Светодиод светится сам: на матовом тёмном корпусе отражённого
      // света не хватит, чтобы пятно осталось единственным ярким.
      accent: new MeshStandardMaterial({
        color: DEVICE_MATERIALS.accent,
        emissive: DEVICE_MATERIALS.accent,
        emissiveIntensity: 1.5,
        roughness: 0.4,
      }),
    };
  }, []);

  useEffect(
    () => () => Object.values(materials).forEach((material) => material.dispose()),
    [materials],
  );

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

  const front = DEVICE.body.depth / 2;
  const top = DEVICE.body.height / 2;
  const right = DEVICE.body.width / 2;
  const bottom = -DEVICE.body.height / 2;

  return (
    <group ref={carrier}>
      <group ref={spinner}>
        <mesh geometry={shell} material={materials.shell} />

        {/* Утопленная панель в верхней половине лица */}
        <mesh material={materials.recess} position={[0, DEVICE.panel.y, front]}>
          <boxGeometry args={[DEVICE.panel.width, DEVICE.panel.height, 0.03]} />
        </mesh>

        {/* Решётка вентиляции на лице */}
        {range(DEVICE.grille.count).map((index) => (
          <mesh
            key={`grille-${index}`}
            material={materials.recess}
            position={[DEVICE.grille.x + index * DEVICE.grille.pitch, DEVICE.grille.y, front]}
          >
            <boxGeometry args={[DEVICE.grille.slotWidth, DEVICE.grille.slotHeight, 0.02]} />
          </mesh>
        ))}

        {/* Наклейка с маркировкой и полосы на ней */}
        <mesh material={materials.mark} position={[DEVICE.label.x, DEVICE.label.y, front]}>
          <boxGeometry args={[DEVICE.label.width, DEVICE.label.height, 0.012]} />
        </mesh>
        {range(DEVICE.label.stripes).map((index) => (
          <mesh
            key={`stripe-${index}`}
            material={materials.stripe}
            position={[
              DEVICE.label.x,
              DEVICE.label.y + DEVICE.label.height / 2 - 0.06 - index * 0.05,
              front + 0.008,
            ]}
          >
            <boxGeometry args={[DEVICE.label.width * 0.66, 0.014, 0.006]} />
          </mesh>
        ))}

        {/* Прорези на правом боку */}
        {range(DEVICE.vents.count).map((index) => (
          <mesh
            key={`vent-${index}`}
            material={materials.recess}
            position={[
              right,
              0,
              (index - (DEVICE.vents.count - 1) / 2) * DEVICE.vents.pitch,
            ]}
          >
            <boxGeometry args={[0.02, DEVICE.vents.height, DEVICE.vents.thickness]} />
          </mesh>
        ))}

        {/* Кнопки на верхней грани */}
        {[-1, 1].map((side) => (
          <mesh
            key={`button-${side}`}
            material={materials.recess}
            position={[side * DEVICE.buttons.x, top, DEVICE.buttons.z]}
          >
            <boxGeometry args={[DEVICE.buttons.size, DEVICE.buttons.height, DEVICE.buttons.size]} />
          </mesh>
        ))}

        {/* Ручка для переноски: полукольцо над корпусом */}
        <mesh material={materials.shell} position={[0, top - 0.02, 0]}>
          <torusGeometry args={[DEVICE.handle.radius, DEVICE.handle.tube, 8, 24, Math.PI]} />
        </mesh>

        {/* Ножки */}
        {[-1, 1].map((sideX) =>
          [-1, 1].map((sideZ) => (
            <mesh
              key={`foot-${sideX}-${sideZ}`}
              material={materials.recess}
              position={[sideX * DEVICE.feet.x, bottom, sideZ * DEVICE.feet.z]}
            >
              <boxGeometry args={[DEVICE.feet.width, DEVICE.feet.height, DEVICE.feet.depth]} />
            </mesh>
          )),
        )}

        {/* Светодиод — единственное цветное пятно на объекте */}
        <mesh material={materials.accent} position={[DEVICE.led.x, DEVICE.led.y, front]}>
          <boxGeometry args={[DEVICE.led.size, DEVICE.led.size, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
