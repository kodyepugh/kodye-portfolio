import * as THREE from "three";

export const RESERVOIR_RADIUS = 3.2;
export const RESERVOIR_SURFACE_DETAIL = 7;
export const RESERVOIR_GRID_DETAIL = 15;
export const RESERVOIR_NODE_RADIUS = 0.052;
export const RESERVOIR_COLLECTION_NODE_SCALE = 2;
export const RESERVOIR_COLLECTION_NODE_RADIUS =
  RESERVOIR_NODE_RADIUS * RESERVOIR_COLLECTION_NODE_SCALE;
export const RESERVOIR_LABEL_RADIAL_OFFSET = 0.205;
export const RESERVOIR_BASE_ROTATION = [-0.1, -0.14, 0] as const;
const reservoirLayoutModeViewQuaternion = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(...RESERVOIR_BASE_ROTATION),
);
export const RESERVOIR_LAYOUT_MODE_VIEW_QUATERNION = [
  reservoirLayoutModeViewQuaternion.x,
  reservoirLayoutModeViewQuaternion.y,
  reservoirLayoutModeViewQuaternion.z,
  reservoirLayoutModeViewQuaternion.w,
] as const;

/** Surface tessellation is a rendering concern and never defines node layout. */
export function createReservoirSurfaceGeometry(
  radius = RESERVOIR_RADIUS,
  detail = RESERVOIR_SURFACE_DETAIL,
) {
  return new THREE.IcosahedronGeometry(radius, detail);
}

/**
 * Builds the visual grid used inside dormant collection nodes. The active
 * reservoir intentionally renders only its clean surface.
 */
export function createReservoirGridLineGeometry(
  radius: number,
  detail: number,
  surfaceScale = 1.0015,
  arcSegments = 1,
) {
  const surface = new THREE.IcosahedronGeometry(radius, detail);
  const edges = new THREE.EdgesGeometry(surface, 1);
  const edgePositions = edges.getAttribute("position");
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < edgePositions.count; index += 2) {
    const start = new THREE.Vector3()
      .fromBufferAttribute(edgePositions, index)
      .normalize();
    const end = new THREE.Vector3()
      .fromBufferAttribute(edgePositions, index + 1)
      .normalize();

    for (let segment = 0; segment < arcSegments; segment += 1) {
      const startProgress = segment / arcSegments;
      const endProgress = (segment + 1) / arcSegments;
      points.push(
        start
          .clone()
          .lerp(end, startProgress)
          .normalize()
          .multiplyScalar(radius * surfaceScale),
        start
          .clone()
          .lerp(end, endProgress)
          .normalize()
          .multiplyScalar(radius * surfaceScale),
      );
    }
  }

  surface.dispose();
  edges.dispose();

  return new THREE.BufferGeometry().setFromPoints(points);
}
