import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import type * as THREE from "three";
import { reservoirArtifacts } from "@/content/reservoir/artifacts";
import {
  createReservoirSurfaceGeometry,
  RESERVOIR_BASE_ROTATION,
} from "@/lib/reservoir/geometry";
import { ArtifactNode } from "./ArtifactNode";
import { SphereGrid } from "./SphereGrid";

type ReservoirSphereProps = {
  surfaceRef?: RefObject<THREE.Mesh | null>;
};

export function ReservoirSphere({ surfaceRef }: ReservoirSphereProps) {
  const geometry = useMemo(() => createReservoirSurfaceGeometry(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group rotation={RESERVOIR_BASE_ROTATION}>
      <mesh ref={surfaceRef} geometry={geometry}>
        <meshStandardMaterial
          color="#bfc0b8"
          roughness={0.96}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <SphereGrid />
      {reservoirArtifacts.map((artifact) => (
        <ArtifactNode key={artifact.id} artifact={artifact} />
      ))}
    </group>
  );
}
