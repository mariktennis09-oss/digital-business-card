import * as THREE from 'three';

/**
 * Типы к принятой модели. Сам файл на JavaScript и правится заменой
 * целиком, поэтому подпись описана здесь, а не выведена из кода: иначе
 * `three` протёк бы в проект как `any`.
 *
 * Возвращает группу с базой на y = 0 и габаритом порядка 0.45 метра.
 * Нормировкой занимается device-model.ts.
 */
export declare function buildRuggedModule(three: typeof THREE): THREE.Group;
