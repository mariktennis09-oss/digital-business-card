/**
 * Постоянные величины дизайна: разделы, ротация приветствия, команды
 * терминала. Всё, что не приходит из API и при этом повторяется в разных
 * местах, живёт здесь, а не разбросано по компонентам.
 *
 * Цвета и шрифты сюда не попали намеренно: ими распоряжается CSS, и там же
 * их подменяют режимы «bw» и «negative». Дублировать палитру в TypeScript
 * значило бы завести второй источник правды.
 */

export interface Section {
  id: string;
  label: string;
}

/** Разделы страницы. Порядок задаёт и навигацию, и порядок на странице. */
export const SECTIONS: Section[] = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack', label: 'Stack' },
  { id: 'connect', label: 'Connect' },
];

/**
 * Приветствие в жёлтом чипе меняется по кругу. Языки — те, на которых
 * пишут потенциальные заказчики; последнее вставлено, чтобы ротация не
 * выглядела списком из шаблона.
 */
export const GREETINGS = ['Say Hi', 'Zeg Hallo', 'Sano Hei', '인사해', 'Привет'] as const;

export const GREETING_INTERVAL_MS = 2500;

/** Категории навыков в порядке показа, с человеческими названиями. */
export const SKILL_CATEGORIES = [
  { id: 'FRONTEND', label: 'Frontend', accent: 'lilac' },
  { id: 'BACKEND', label: 'Backend', accent: 'surface' },
  { id: 'AI', label: 'AI', accent: 'pink' },
  { id: 'TOOLS', label: 'Tools', accent: 'yellow' },
] as const;

export type AccentName = 'lilac' | 'pink' | 'yellow' | 'surface';

/** Команды палитры. Открывается по «/», закрывается по Esc. */
export interface Command {
  name: string;
  description: string;
}

export const COMMANDS: Command[] = [
  { name: 'work', description: 'перейти к работам' },
  { name: 'experience', description: 'перейти к опыту' },
  { name: 'stack', description: 'перейти к стеку' },
  { name: 'connect', description: 'перейти к контактам' },
  { name: 'home', description: 'наверх' },
  { name: 'bw', description: 'убрать акцентные цвета' },
  { name: 'negative', description: 'поменять местами бумагу и чернила' },
  { name: 'reset', description: 'вернуть всё как было' },
  { name: 'close', description: 'закрыть' },
];
