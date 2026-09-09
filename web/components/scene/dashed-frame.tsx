'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineDashedMaterial,
  LineSegments,
  Quaternion,
} from 'three';
import { DEVICE, FRAME, OBJECT, SURFACE } from '@/lib/scene-constants';
import type { PointerNdc } from '@/lib/use-pointer-ndc';

/**
 * Пунктирная оболочка вокруг объекта.
 *
 * Это не обводка, и устроена она нарочно не так, как обводка. Габаритной
 * коробки модели рамка не знает; она вращается своими скоростями, медленнее
 * объекта, и раздувается по вершинам вразнобой. Отсюда постоянное
 * расслоение между прибором и оболочкой — то, ради чего модуль и нужен.
 *
 * Каждая вершина идёт к своему целевому положению со своим коэффициентом,
 * поэтому в движении рамка перекашивается в перспективе, а не растёт
 * целиком. Одинаковые коэффициенты превратили бы её в обычный масштаб.
 *
 * Рёбра — двенадцать отдельных объектов, а не один LineSegments. Иначе
 * прозрачность у них была бы общей: у материала она одна на весь объект,
 * а промт требует, чтобы каждое ребро гасло по своей фазе. Двенадцать
 * вызовов отрисовки за это заплатить не жалко.
 */

/** Восемь углов куба: знаки по осям. */
const CORNERS = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
] as const;

/** Двенадцать рёбер: пары индексов углов. */
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

/**
 * Коэффициенты сглаживания по вершинам. Индекс умножается на пять по
 * модулю восьми — перестановка, в которой соседние углы куба получают
 * далёкие друг от друга значения. Если раздать коэффициенты по порядку,
 * рамка будет расти ровной волной от одного угла к другому, а нужен
 * перекос.
 */
const VERTEX_LERP = CORNERS.map(
  (_, index) => FRAME.lerpMin + (((index * 5) % 8) / 7) * (FRAME.lerpMax - FRAME.lerpMin),
);

/** Фазы мерцания. Шаг иррациональный, чтобы рёбра не гасли группами. */
const EDGE_PHASE = EDGES.map((_, index) => index * Math.PI * 2 * 0.381);

export function DashedFrame({
  orientation,
  pointer,
  lift,
  force,
  reducedMotion = false,
  size = DEVICE.size,
  bobAmplitude = OBJECT.bobAmplitude,
  swollenHalf = FRAME.swollenHalf,
}: {
  /** Своя ориентация, не объекта. Считает её отдельный Tumble. */
  orientation: RefObject<Quaternion>;
  /** Курсор в NDC. Раздувание считается по скорости его движения. */
  pointer?: RefObject<PointerNdc>;
  /** 0 — объект в центре, 1 — уехал вверх. Оболочка едет вместе с ним. */
  lift?: RefObject<{ value: number }>;
  /** Принудительное раздувание для стенда: берётся наибольшее из двух. */
  force?: RefObject<{ value: number }>;
  reducedMotion?: boolean;
  size?: number;
  bobAmplitude?: number;
  swollenHalf?: number;
}) {
  const group = useRef<Group>(null);

  /** Текущее полуребро каждой вершины. Своё у каждой — в этом весь перекос. */
  const halves = useRef<number[]>(CORNERS.map(() => FRAME.restHalf));
  const inflate = useRef(0);
  const previous = useRef({ x: 0, y: 0, seen: false });

  const edges = useMemo(
    () =>
      EDGES.map((pair, index) => {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));

        const material = new LineDashedMaterial({
          color: SURFACE.frame,
          dashSize: FRAME.dashSize,
          gapSize: FRAME.gapSize,
          transparent: true,
          opacity: FRAME.opacity,
          depthWrite: false,
        });

        const line = new LineSegments(geometry, material);

        // Вершины двигаются каждый кадр, а описанная сфера считается один
        // раз при создании. С отсечением по ней рёбра пропадали бы
        // в раздутом состоянии — там, где как раз должны быть видны.
        line.frustumCulled = false;

        return { line, geometry, material, pair, phase: EDGE_PHASE[index] };
      }),
    [],
  );

  useEffect(
    () => () =>
      edges.forEach(({ geometry, material }) => {
        geometry.dispose();
        material.dispose();
      }),
    [edges],
  );

  useFrame((state, delta) => {
    const element = group.current;
    if (!element) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    const lifted = lift?.current.value ?? 0;

    element.quaternion.copy(orientation.current);

    // Положение общее с объектом: в покое оболочка облегает его, значит
    // и качаться, и уезжать вверх обязана вместе с ним. Расходятся они
    // только вращением.
    const phase = reducedMotion
      ? 0
      : Math.sin((elapsed * Math.PI * 2) / OBJECT.bobPeriod);

    element.position.y = phase * bobAmplitude + lifted * OBJECT.liftDistance;

    // Раздувание идёт от скорости курсора, а не от его положения: рамка
    // реагирует на движение, а не на то, где мышь остановилась.
    let drive = force?.current.value ?? 0;
    const cursor = pointer?.current;

    if (cursor?.active && !reducedMotion) {
      if (previous.current.seen) {
        const travelled = Math.hypot(cursor.x - previous.current.x, cursor.y - previous.current.y);
        drive = Math.max(drive, Math.min(1, (travelled / Math.max(delta, 1e-4)) * FRAME.inflateGain));
      }

      previous.current.x = cursor.x;
      previous.current.y = cursor.y;
      previous.current.seen = true;
    } else {
      previous.current.seen = false;
    }

    if (drive > inflate.current) {
      // Вскидывается быстро.
      inflate.current += (drive - inflate.current) * (1 - Math.pow(1 - FRAME.inflateRise, delta * 60));
    } else {
      // Оседает медленно и по экспоненте — так же, как затухает импульс.
      inflate.current *= Math.exp(-FRAME.inflateDecay * delta);
    }

    const target = FRAME.restHalf + (swollenHalf - FRAME.restHalf) * inflate.current;

    for (let index = 0; index < halves.current.length; index += 1) {
      const factor = 1 - Math.pow(1 - VERTEX_LERP[index], delta * 60);
      halves.current[index] += (target - halves.current[index]) * factor;
    }

    for (const { line, geometry, material, pair, phase: edgePhase } of edges) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const array = position.array as Float32Array;

      writeCorner(array, 0, pair[0], halves.current, size);
      writeCorner(array, 3, pair[1], halves.current, size);
      position.needsUpdate = true;

      // Длины пересчитываются каждый кадр: рёбра меняют длину, а рисунок
      // пунктира задан в мировых единицах. Без пересчёта штрихи
      // растягивались бы вместе с ребром.
      line.computeLineDistances();

      const flicker = reducedMotion
        ? 1
        : 0.5 + 0.5 * Math.sin((elapsed * Math.PI * 2) / FRAME.flickerPeriod + edgePhase);

      material.opacity = FRAME.opacity * (1 - FRAME.flickerDepth + FRAME.flickerDepth * flicker);
    }
  });

  return (
    <group ref={group}>
      {edges.map(({ line }, index) => (
        <primitive key={index} object={line} />
      ))}
    </group>
  );
}

function writeCorner(
  array: Float32Array,
  offset: number,
  corner: number,
  halves: number[],
  size: number,
) {
  const half = halves[corner] * size;

  array[offset] = CORNERS[corner][0] * half;
  array[offset + 1] = CORNERS[corner][1] * half;
  array[offset + 2] = CORNERS[corner][2] * half;
}
