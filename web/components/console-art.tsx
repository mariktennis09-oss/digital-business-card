/**
 * Портативная консоль в герое — единственный объект-игрушка на странице.
 *
 * Нарисована в SVG, а не собрана в three.js и не положена картинкой.
 * Внешнего файла нет, значит нечего грузить и нечем ошибиться на прелоаде;
 * при этом объект остаётся векторным и одинаково резким на любом экране.
 *
 * Вид трёхчетвертной: корпус смещён относительно своей боковины, отсюда
 * читается толщина. Тень — отдельный размытый эллипс под объектом, а не
 * тень элемента: цветных теней в этой системе нет, а форма пятна не
 * повторяет прямоугольник корпуса.
 */
export function ConsoleArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 400"
      role="img"
      aria-label="Портативная игровая консоль"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="console-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <clipPath id="console-screen">
          <rect x="80" y="84" width="160" height="116" rx="4" />
        </clipPath>
      </defs>

      {/* Тень лежит вне качающейся группы: объект наклоняется, пятно нет */}
      <ellipse
        cx="164"
        cy="372"
        rx="98"
        ry="15"
        fill="#0d0d0e"
        opacity="0.18"
        filter="url(#console-shadow)"
      />

      <g className="console-rock">
        {/* Боковина: тот же контур со сдвигом — от неё корпус получает толщину */}
        <rect x="50" y="52" width="240" height="300" rx="28" fill="#cfccc6" />
        <rect x="40" y="40" width="240" height="300" rx="28" fill="#e8e6e2" />

        {/* Экран: рамка, поле и диагональный блик поверх */}
        <rect x="72" y="76" width="176" height="132" rx="10" fill="#0d0d0e" />
        <rect x="80" y="84" width="160" height="116" rx="4" fill="#14181a" />
        <g clipPath="url(#console-screen)">
          <path d="M60 210 L170 60 L214 60 L104 210 Z" fill="#ffffff" opacity="0.07" />
          <path d="M132 210 L242 60 L262 60 L152 210 Z" fill="#ffffff" opacity="0.05" />
        </g>

        {/* Крестовина */}
        <rect x="84" y="248" width="52" height="18" rx="4" fill="#3d3d40" />
        <rect x="101" y="231" width="18" height="52" rx="4" fill="#3d3d40" />

        {/* Кнопки: единственные два цветных пятна на объекте */}
        <circle cx="246" cy="250" r="15" fill="#f5d2a8" />
        <circle cx="212" cy="272" r="15" fill="#e0b8e8" />

        {/* Start / Select */}
        <rect x="130" y="302" width="24" height="8" rx="4" fill="#a9a6a0" />
        <rect x="162" y="302" width="24" height="8" rx="4" fill="#a9a6a0" />

        {/* Динамик */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((column) => (
            <circle
              key={`speaker-${row}-${column}`}
              cx={214 + column * 11}
              cy={306 + row * 9}
              r="2.4"
              fill="#c4c1bb"
            />
          )),
        )}

        {/* Подпись на корпусе */}
        <rect x="76" y="60" width="34" height="7" rx="3.5" fill="#c4c1bb" />
      </g>
    </svg>
  );
}
