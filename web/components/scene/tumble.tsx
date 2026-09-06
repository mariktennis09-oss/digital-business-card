'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { Euler, Quaternion } from 'three';
import { TUMBLE } from '@/lib/scene-constants';

/**
 * Ориентация объекта живёт в кватернионе, который накапливается кадр
 * за кадром. Это не вращение вокруг вертикали: прибор кувыркается по всем
 * трём осям, регулярно оказываясь вверх ногами и на ребре.
 *
 * Углы Эйлера здесь не годятся принципиально. При свободном вращении они
 * рано или поздно приходят к совпадению осей и объект дёргается; кватернион
 * такой особенности не имеет. Накапливаем именно приращение за кадр —
 * тогда движение не зависит от частоты кадров.
 *
 * Значение отдаётся наружу ссылкой: его читают и корпус, и тень. Тень
 * выводит из ориентации ширину силуэта, поэтому пересчитывать вращение
 * у себя ей нельзя — накопление разошлось бы.
 */
export function useOrientation(): RefObject<Quaternion> {
  return useRef(new Quaternion());
}

/**
 * Крутит ориентацию. Отдельный компонент, а не часть корпуса: значение
 * общее, и владеть им должен кто-то один.
 *
 * Ставится в дереве раньше потребителей — тогда его кадровый обработчик
 * подписывается первым и отрабатывает до них.
 */
export function Tumble({
  orientation,
  speed = 1,
  reducedMotion = false,
}: {
  orientation: RefObject<Quaternion>;
  /** Общий множитель скорости. Соотношение осей при этом сохраняется. */
  speed?: number;
  reducedMotion?: boolean;
}) {
  const step = useRef(new Quaternion());
  const angles = useRef(new Euler());

  useFrame((_, delta) => {
    if (reducedMotion) {
      return;
    }

    angles.current.set(
      TUMBLE.x * speed * delta,
      TUMBLE.y * speed * delta,
      TUMBLE.z * speed * delta,
    );
    step.current.setFromEuler(angles.current);

    // Нормализация обязательна: за десятки тысяч умножений накапливается
    // ошибка округления, и кватернион перестаёт быть единичным — объект
    // начинает еле заметно раздуваться.
    orientation.current.multiply(step.current).normalize();
  });

  return null;
}
