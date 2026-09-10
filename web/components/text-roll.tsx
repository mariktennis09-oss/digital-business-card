/**
 * Подпись, которая прокручивается при наведении.
 *
 * Текст лежит внутри дважды, контейнер высотой ровно в кегль. На наведении
 * стопка уезжает вверх на свою высоту, и вторая копия встаёт на место
 * первой — движение читается как проворот барабана, а не как подмена.
 *
 * Дубль спрятан от чтения с экрана: для программы это одна подпись,
 * повторённая ради эффекта, и озвучивать её дважды не нужно.
 */
export function TextRoll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll__stack">
        <span className="roll__line">{children}</span>
        <span className="roll__line" aria-hidden>
          {children}
        </span>
      </span>
    </span>
  );
}
