import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  createReservoirGridGeometry,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";

export function SphereGrid() {
  const geometry = useMemo(() => {
    const surface = createReservoirGridGeometry();
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

      points.push(
        start.clone().multiplyScalar(RESERVOIR_RADIUS * 1.0015),
        end.clone().multiplyScalar(RESERVOIR_RADIUS * 1.0015),
      );
    }

    surface.dispose();
    edges.dispose();

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#30322e" transparent opacity={0.42} />
    </lineSegments>
  );
}
