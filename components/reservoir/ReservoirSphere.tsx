import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, RefObject } from "react";
import type * as THREE from "three";
import { activeReservoirArtifacts } from "@/content/reservoir/artifacts";
import {
  createReservoirSurfaceGeometry,
  RESERVOIR_BASE_ROTATION,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import type { ReservoirGridInspection } from "@/types/reservoir";
import {
  ArtifactNode,
  ORB_MESH_ENGAGEMENT_DELAY_MS,
} from "./ArtifactNode";
import { ArtifactTerritory } from "./ArtifactTerritory";
import { SphereGrid } from "./SphereGrid";

type ReservoirSphereProps = {
  surfaceRef?: RefObject<THREE.Mesh | null>;
  selectedArtifactId: string | null;
  hoveredArtifactId: string | null;
  gridInspectionRef: MutableRefObject<ReservoirGridInspection>;
  onArtifactHoverChange: (artifactId: string, hovered: boolean) => void;
};

export function ReservoirSphere({
  surfaceRef,
  selectedArtifactId,
  hoveredArtifactId,
  gridInspectionRef,
  onArtifactHoverChange,
}: ReservoirSphereProps) {
  const geometry = useMemo(() => createReservoirSurfaceGeometry(), []);
  const sphereRef = useRef<THREE.Group | null>(null);
  const meshEngagementTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [meshEngagedArtifactId, setMeshEngagedArtifactId] = useState<
    string | null
  >(null);
  const [territoryArtifactIds, setTerritoryArtifactIds] = useState<
    string[]
  >(selectedArtifactId ? [selectedArtifactId] : []);
  const [trackedSelectedArtifactId, setTrackedSelectedArtifactId] = useState(
    selectedArtifactId,
  );
  if (trackedSelectedArtifactId !== selectedArtifactId) {
    setTrackedSelectedArtifactId(selectedArtifactId);
    setMeshEngagedArtifactId(null);
    if (
      selectedArtifactId &&
      !territoryArtifactIds.includes(selectedArtifactId)
    ) {
      setTerritoryArtifactIds([
        ...territoryArtifactIds,
        selectedArtifactId,
      ]);
    }
  }
  const territoryArtifacts = territoryArtifactIds
    .map((artifactId) =>
      activeReservoirArtifacts.find((artifact) => artifact.id === artifactId),
    )
    .filter((artifact) => artifact !== undefined);

  const removeRetractedTerritory = useCallback((artifactId: string) => {
    setTerritoryArtifactIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== artifactId),
    );
  }, []);

  useEffect(() => {
    if (meshEngagementTimeout.current) {
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    }
    if (!selectedArtifactId) return;

    meshEngagementTimeout.current = setTimeout(() => {
      meshEngagementTimeout.current = null;
      setMeshEngagedArtifactId(selectedArtifactId);
    }, ORB_MESH_ENGAGEMENT_DELAY_MS);

    return () => {
      if (!meshEngagementTimeout.current) return;
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    };
  }, [selectedArtifactId]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group ref={sphereRef} rotation={RESERVOIR_BASE_ROTATION}>
      <mesh
        ref={surfaceRef}
        geometry={geometry}
        renderOrder={RESERVOIR_RENDER_ORDER.surface}
      >
        <meshStandardMaterial
          color={RESERVOIR_THEME.sphere}
          roughness={0.96}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {territoryArtifacts.map((artifact) => (
        <ArtifactTerritory
          key={`${artifact.id}-territory`}
          active={
            artifact.id === selectedArtifactId &&
            artifact.id === meshEngagedArtifactId
          }
          selected={artifact.id === selectedArtifactId}
          artifact={artifact}
          onRetractionComplete={removeRetractedTerritory}
        />
      ))}
      <SphereGrid
        inspectionRef={gridInspectionRef}
        selectedArtifactVertexIds={territoryArtifacts.map(
          (artifact) => artifact.vertexId,
        )}
        sphereRef={sphereRef}
      />
      {activeReservoirArtifacts.map((artifact) => (
        <ArtifactNode
          key={artifact.id}
          artifact={artifact}
          sphereRef={sphereRef}
          selected={selectedArtifactId === artifact.id}
          meshEngaged={
            selectedArtifactId === artifact.id &&
            meshEngagedArtifactId === artifact.id
          }
          selectionActive={selectedArtifactId !== null}
          hovered={hoveredArtifactId === artifact.id}
          onHoverChange={onArtifactHoverChange}
        />
      ))}
    </group>
  );
}
