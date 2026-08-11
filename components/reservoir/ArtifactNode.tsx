import {
  reservoirVertices,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import type { ReservoirArtifact } from "@/types/reservoir";

type ArtifactNodeProps = {
  artifact: ReservoirArtifact;
};

export function ArtifactNode({ artifact }: ArtifactNodeProps) {
  const vertex = reservoirVertices[artifact.vertexId];

  if (!vertex) {
    return null;
  }

  const position = vertex
    .clone()
    .normalize()
    .multiplyScalar(
      RESERVOIR_RADIUS + RESERVOIR_NODE_RADIUS * 0.04,
    );

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[RESERVOIR_NODE_RADIUS, 18, 14]} />
        <meshStandardMaterial color="#252721" roughness={0.8} />
      </mesh>
    </group>
  );
}
