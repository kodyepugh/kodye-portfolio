import * as THREE from "three";

export const RESERVOIR_RADIUS = 3.2;
export const RESERVOIR_SURFACE_DETAIL = 7;
export const RESERVOIR_GRID_DETAIL = 15;
export const RESERVOIR_PLACEMENT_DETAIL = 3;
export const RESERVOIR_NODE_RADIUS = 0.052;
export const RESERVOIR_BASE_ROTATION = [-0.1, -0.14, 0] as const;

const POSITION_PRECISION = 5;

export function createReservoirSurfaceGeometry() {
  return new THREE.IcosahedronGeometry(
    RESERVOIR_RADIUS,
    RESERVOIR_SURFACE_DETAIL,
  );
}

export function createReservoirGridGeometry() {
  return new THREE.IcosahedronGeometry(
    RESERVOIR_RADIUS,
    RESERVOIR_GRID_DETAIL,
  );
}

export function getReservoirVertices(
  detail = RESERVOIR_PLACEMENT_DETAIL,
) {
  const geometry = new THREE.IcosahedronGeometry(RESERVOIR_RADIUS, detail);
  const positions = geometry.getAttribute("position");
  const uniqueVertices = new Map<string, THREE.Vector3>();

  for (let index = 0; index < positions.count; index += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
    const key = vertex
      .toArray()
      .map((coordinate) => coordinate.toFixed(POSITION_PRECISION))
      .join(":");

    uniqueVertices.set(key, vertex);
  }

  geometry.dispose();

  return Array.from(uniqueVertices.values()).sort(
    (a, b) => a.x - b.x || a.y - b.y || a.z - b.z,
  );
}

export const reservoirVertices = getReservoirVertices();
