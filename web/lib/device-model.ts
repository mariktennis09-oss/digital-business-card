import * as THREE from 'three';
import { Box3, BufferGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildRuggedModule } from './rugged-module';
import { DEVICE, ENVIRONMENT } from './scene-constants';

export interface DeviceModel {
  /** Готовая к сцене группа: центрирована и приведена к габаритам кадра. */
  object: Group;
  /** Полурёбра габаритной коробки. По ним тень считает ширину силуэта. */
  halfExtents: Vector3;
  dispose(): void;
}

/**
 * Приводит принятую модель к сцене.
 *
 * Сама модель ничего не знает про кадр: она собрана в метрах, стоит базой
 * на нуле и состоит из сотни отдельных мешей. Здесь она склеивается по
 * материалам, центрируется и масштабируется под габарит кадра — всё, что
 * зависит от сцены, живёт тут, а не в файле модели. Положить новую версию
 * поверх старой можно, не трогая ничего вокруг.
 *
 * Склейка нужна ради кадрового цикла: сотня узлов — это сотня обновлений
 * матриц и сотня проверок отсечения каждый кадр, тогда как рисуется всегда
 * весь объект целиком. После склейки остаётся по одному мешу на материал,
 * то есть шесть. Полигонов при этом ровно столько же.
 */
export function createDeviceModel(): DeviceModel {
  const raw = buildRuggedModule(THREE);
  raw.updateMatrixWorld(true);

  // Геометрии группируются по материалу: склеивать можно только то, что
  // рисуется одним и тем же материалом.
  const batches = new Map<MeshStandardMaterial, BufferGeometry[]>();
  const sources: BufferGeometry[] = [];

  raw.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    const material = node.material as MeshStandardMaterial;
    const baked = node.geometry.clone();

    // Меш встраивается в общую геометрию вместе со своим положением:
    // после склейки собственных матриц у частей не останется.
    baked.applyMatrix4(node.matrixWorld);

    const batch = batches.get(material);
    if (batch) {
      batch.push(baked);
    } else {
      batches.set(material, [baked]);
    }

    sources.push(node.geometry);
  });

  const object = new Group();
  object.name = 'device';

  const geometries: BufferGeometry[] = [];
  const materials: MeshStandardMaterial[] = [];

  for (const [material, batch] of batches) {
    const merged = mergeGeometries(batch);
    batch.forEach((geometry) => geometry.dispose());

    // Отражения приходят из общей карты окружения сцены, и её вклад
    // задаётся здесь: в модели про сцену ничего не знают.
    material.envMapIntensity = ENVIRONMENT.intensity;

    geometries.push(merged);
    materials.push(material);
    object.add(new Mesh(merged, material));
  }

  // Исходные геометрии больше не нужны: в дереве сцены их не будет.
  sources.forEach((geometry) => geometry.dispose());

  // Модель стоит базой на нуле и имеет свой масштаб. Кадру нужен объект
  // в центре и нужного размера, поэтому и то, и другое пересчитывается —
  // от габарита, а не от чисел внутри модели.
  const bounds = new Box3().setFromObject(object);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());

  geometries.forEach((geometry) => geometry.translate(-center.x, -center.y, -center.z));

  const scale = DEVICE.targetSize / Math.max(size.x, size.y, size.z);
  object.scale.setScalar(scale);

  return {
    object,
    halfExtents: size.multiplyScalar(scale / 2),
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
