import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
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
import type { ReservoirArtifact } from "@/types/reservoir";
import {
  getNodeReactionArrival,
  getSphereRecessionProgress,
} from "@/lib/reservoir/opening";
import {
  ArtifactNode,
  ORB_MESH_ENGAGEMENT_DELAY_MS,
} from "./ArtifactNode";
import { ArtifactTerritory } from "./ArtifactTerritory";
import { ArtifactShockwave } from "./ArtifactShockwave";
import { SphereGrid } from "./SphereGrid";

type ReservoirSphereProps = {
  surfaceRef?: RefObject<THREE.Mesh | null>;
  selectedArtifactId: string | null;
  hoveredArtifactId: string | null;
  isDragging: boolean;
  selectedPressActive: boolean;
  continuationCueEnabled: boolean;
  interactionRevisionRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  openingActive: boolean;
  shockwaveActive: boolean;
  openingArtifact: ReservoirArtifact | null;
  openingElapsedRef: MutableRefObject<number>;
  openingReducedMotion: boolean;
  openingReactionDistances: ReadonlyMap<string, number>;
  maximumOpeningReactionDistance: number;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  gridInspectionRef: MutableRefObject<ReservoirGridInspection>;
  onArtifactHoverChange: (artifactId: string, hovered: boolean) => void;
};

export function ReservoirSphere({
  surfaceRef,
  selectedArtifactId,
  hoveredArtifactId,
  isDragging,
  selectedPressActive,
  continuationCueEnabled,
  interactionRevisionRef,
  diagnosticsRef,
  openingActive,
  shockwaveActive,
  openingArtifact,
  openingElapsedRef,
  openingReducedMotion,
  openingReactionDistances,
  maximumOpeningReactionDistance,
  restoring,
  restorationProgressRef,
  gridInspectionRef,
  onArtifactHoverChange,
}: ReservoirSphereProps) {
  const geometry = useMemo(() => createReservoirSurfaceGeometry(), []);
  const sphereRef = useRef<THREE.Group | null>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const recessionProgressRef = useRef(0);
  const sphereColor = useMemo(() => new THREE.Color(RESERVOIR_THEME.sphere), []);
  const recessedSphereColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.sphereRecessed),
    [],
  );
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

  useFrame(() => {
    const progress = restoring
      ? 1 - restorationProgressRef.current
      : openingActive
        ? getSphereRecessionProgress(
            openingElapsedRef.current,
            openingReducedMotion,
          )
        : 0;
    recessionProgressRef.current = progress;
    sphereMaterialRef.current?.color
      .copy(sphereColor)
      .lerp(recessedSphereColor, progress);

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.sphereRecessionProgress =
        progress.toFixed(6);
    }
  });

  return (
    <group ref={sphereRef} rotation={RESERVOIR_BASE_ROTATION}>
      <mesh
        ref={surfaceRef}
        geometry={geometry}
        renderOrder={RESERVOIR_RENDER_ORDER.surface}
      >
        <meshStandardMaterial
          ref={sphereMaterialRef}
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
        recessionProgressRef={recessionProgressRef}
      />
      {shockwaveActive && openingArtifact ? (
        <ArtifactShockwave
          artifact={openingArtifact}
          elapsedRef={openingElapsedRef}
          maximumArtifactDistance={maximumOpeningReactionDistance}
          reducedMotion={openingReducedMotion}
          diagnosticsRef={diagnosticsRef}
        />
      ) : null}
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
          isDragging={isDragging}
          selectedPressActive={
            selectedPressActive && selectedArtifactId === artifact.id
          }
          continuationCueEnabled={continuationCueEnabled}
          interactionRevisionRef={interactionRevisionRef}
          diagnosticsRef={diagnosticsRef}
          opening={openingActive}
          openingSelected={openingArtifact?.id === artifact.id}
          openingElapsedRef={openingElapsedRef}
          openingReactionDelay={getNodeReactionArrival(
            openingReactionDistances.get(artifact.id) ?? 0,
            maximumOpeningReactionDistance,
            openingReducedMotion,
          )}
          openingReducedMotion={openingReducedMotion}
          restoring={restoring}
          restorationProgressRef={restorationProgressRef}
          onHoverChange={onArtifactHoverChange}
        />
      ))}
    </group>
  );
}
