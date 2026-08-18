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
import type { ReservoirFrame } from "@/lib/reservoir/frame";
import {
  RESERVOIR_BASE_ROTATION,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import type { ReservoirLayout } from "@/lib/reservoir/layout";
import type { ReservoirNodeSizingSnapshot } from "@/lib/reservoir/node-sizing";
import {
  RESERVOIR_SURFACE_MATERIAL,
  RESERVOIR_SURFACE_PATTERN,
  RESERVOIR_SURFACE_PULSE,
  addReservoirSurfacePulse,
  type ReservoirSurfacePulseUniforms,
} from "@/lib/reservoir/surface-material";
import {
  getCollectionReconstitutionFrame,
} from "@/lib/reservoir/collection-entry";
import type { CollectionReconstitutionPhase } from "@/lib/reservoir/collection-entry";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import type { Collection } from "@/types/content";
import type { Artifact } from "@/types/content";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import {
  getNodeReactionArrival,
  getShockwaveStart,
  getSphereRecessionProgress,
} from "@/lib/reservoir/opening";
import {
  ArtifactNode,
  ORB_MESH_ENGAGEMENT_DELAY_MS,
} from "./ArtifactNode";
import { CollectionNode } from "./CollectionNode";
import { CollectionSphere } from "./CollectionSphere";
import { ReservoirQueryActivity } from "./ReservoirQueryActivity";
import type { ReservoirQueryActivityMode } from "./ReservoirQueryActivity";
import { ReservoirSurfacePattern } from "./ReservoirSurfacePattern";

type ReservoirSphereProps = {
  activeCollection: Collection;
  activeNodes: readonly ReservoirContentNode[];
  layout: ReservoirLayout;
  nodeSizing: ReservoirNodeSizingSnapshot;
  layoutModeTransitionState: "idle" | "sinking" | "orienting" | "emerging";
  collectionReconstitutionPhase: CollectionReconstitutionPhase;
  collectionReconstitutionProgressRef: MutableRefObject<number>;
  collectionReconstitutionElapsedRef: MutableRefObject<number>;
  layoutModeTransitionElapsedRef: MutableRefObject<number>;
  layoutModeTransitionProgressRef: MutableRefObject<number>;
  layoutModeTransitionPulseRef: MutableRefObject<number>;
  selectedMeshRetractionStarted: boolean;
  collectionActivityRevision?: number | null;
  surfaceRef?: RefObject<THREE.Mesh | null>;
  selectedArtifactId: string | null;
  selectedCollectionId: string | null;
  hoveredArtifactId: string | null;
  interactionEnabled: boolean;
  isDragging: boolean;
  reservoirFrame: ReservoirFrame;
  zoomLevel: number;
  selectedPressActive: boolean;
  surfacedNodeIds?: ReadonlySet<string>;
  filterVisibleNodeIds?: ReadonlySet<string>;
  locatingArtifactId?: string | null;
  continuationCueEnabled: boolean;
  interactionRevisionRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  openingActive: boolean;
  openingArtifact: Artifact | null;
  openingElapsedRef: MutableRefObject<number>;
  openingReducedMotion: boolean;
  openingReactionDistances: ReadonlyMap<string, number>;
  maximumOpeningReactionDistance: number;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  emergingChildren: boolean;
  emergenceProgressRef: MutableRefObject<number>;
  onArtifactHoverChange: (artifactId: string, hovered: boolean) => void;
  queryActivityRevision?: number | null;
  queryActivityMode?: ReservoirQueryActivityMode | null;
  onQueryActivityComplete?: () => void;
};

export function ReservoirSphere({
  activeCollection,
  activeNodes,
  layout,
  nodeSizing,
  layoutModeTransitionState,
  collectionReconstitutionPhase,
  collectionReconstitutionProgressRef,
  collectionReconstitutionElapsedRef,
  layoutModeTransitionElapsedRef,
  layoutModeTransitionProgressRef,
  layoutModeTransitionPulseRef,
  selectedMeshRetractionStarted,
  collectionActivityRevision = null,
  surfaceRef,
  selectedArtifactId,
  selectedCollectionId,
  hoveredArtifactId,
  interactionEnabled,
  isDragging,
  reservoirFrame,
  zoomLevel,
  selectedPressActive,
  surfacedNodeIds,
  filterVisibleNodeIds,
  locatingArtifactId = null,
  continuationCueEnabled,
  interactionRevisionRef,
  diagnosticsRef,
  openingActive,
  openingArtifact,
  openingElapsedRef,
  openingReducedMotion,
  openingReactionDistances,
  maximumOpeningReactionDistance,
  restoring,
  restorationProgressRef,
  emergingChildren,
  emergenceProgressRef,
  onArtifactHoverChange,
  queryActivityRevision = null,
  queryActivityMode = null,
  onQueryActivityComplete,
}: ReservoirSphereProps) {
  const sphereRef = useRef<THREE.Group | null>(null);
  const childNodesRef = useRef<THREE.Group | null>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const surfacePatternMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const surfacePulseUniforms = useRef<ReservoirSurfacePulseUniforms>({
    layoutTransitionPulse: { value: 0 },
    layoutTransitionPulseColor: {
      value: new THREE.Color(RESERVOIR_SURFACE_PULSE.color),
    },
  });
  const sphereColor = useMemo(() => new THREE.Color(RESERVOIR_THEME.sphere), []);
  const recessedSphereColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.sphereRecessed),
    [],
  );
  const neutralSphereColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.environment),
    [],
  );
  const meshEngagementTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const collectionReconstituting =
    collectionReconstitutionPhase !== "idle";
  const collectionDeactivating =
    collectionReconstitutionPhase === "deactivating";
  const layoutModeSwitchSinking =
    layoutModeTransitionState === "sinking";
  const layoutModeSwitchEmerging =
    layoutModeTransitionState === "emerging";
  const layoutModeSwitchHidden =
    layoutModeTransitionState === "orienting";
  const selectedNodeId = selectedArtifactId ?? selectedCollectionId;
  const presentedSelectedNodeId =
    selectedMeshRetractionStarted
    ? null
    : selectedNodeId;
  const [meshEngagedNodeId, setMeshEngagedNodeId] = useState<
    string | null
  >(null);
  const [trackedMeshSelectionNodeId, setTrackedMeshSelectionNodeId] =
    useState(presentedSelectedNodeId);
  if (trackedMeshSelectionNodeId !== presentedSelectedNodeId) {
    setTrackedMeshSelectionNodeId(presentedSelectedNodeId);
    setMeshEngagedNodeId(null);
  }
  const meshEngagementCurrent =
    trackedMeshSelectionNodeId === presentedSelectedNodeId;

  useEffect(() => {
    if (meshEngagementTimeout.current) {
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    }
    if (!presentedSelectedNodeId) return;

    meshEngagementTimeout.current = setTimeout(() => {
      meshEngagementTimeout.current = null;
      setMeshEngagedNodeId(presentedSelectedNodeId);
    }, ORB_MESH_ENGAGEMENT_DELAY_MS);

    return () => {
      if (!meshEngagementTimeout.current) return;
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    };
  }, [presentedSelectedNodeId]);

  useEffect(() => {
    const diagnostics = diagnosticsRef.current;
    if (!diagnostics) return;
    diagnostics.dataset.surfaceMaterial = RESERVOIR_SURFACE_MATERIAL.name;
    diagnostics.dataset.surfaceMeshDetail = String(
      RESERVOIR_SURFACE_MATERIAL.detail,
    );
    diagnostics.dataset.surfaceDisplacement = "none";
    diagnostics.dataset.surfaceRoughness = String(
      RESERVOIR_SURFACE_MATERIAL.roughness,
    );
    diagnostics.dataset.surfacePattern = "dense";
    diagnostics.dataset.surfacePatternDetail = String(
      RESERVOIR_SURFACE_PATTERN.detail,
    );
    diagnostics.dataset.surfacePatternLineOpacity = String(
      RESERVOIR_SURFACE_PATTERN.lineOpacity,
    );
    diagnostics.dataset.surfacePulseColor = RESERVOIR_SURFACE_PULSE.color;
    diagnostics.dataset.surfacePatternPresentationOnly = "true";
  }, [diagnosticsRef]);

  const configureSurfacePulse = useCallback(
    (
      shader: Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0],
    ) => {
      addReservoirSurfacePulse(shader, surfacePulseUniforms.current);
    },
    [],
  );

  const getSurfacePulseProgramCacheKey = useCallback(
    () => "reservoir-surface-pulse-v1",
    [],
  );

  useFrame(() => {
    const openingProgress = restoring
      ? 1 - restorationProgressRef.current
      : openingActive
        ? getSphereRecessionProgress(
            openingElapsedRef.current,
            openingReducedMotion,
          )
        : 0;
    const reconstitutionFrame = getCollectionReconstitutionFrame(
      collectionReconstitutionProgressRef.current,
    );
    const layoutTransitionPulse = layoutModeTransitionPulseRef.current;
    const neutrality = collectionReconstituting
      ? reconstitutionFrame.neutrality
      : 0;
    sphereMaterialRef.current?.color
      .copy(sphereColor)
      .lerp(recessedSphereColor, openingProgress)
      .lerp(neutralSphereColor, neutrality);
    const patternMaterial = surfacePatternMaterialRef.current;
    if (patternMaterial) {
      patternMaterial.uniforms.lineOpacity.value =
        RESERVOIR_SURFACE_PATTERN.lineOpacity *
        (1 - openingProgress) *
        (1 - neutrality);
    }
    surfacePulseUniforms.current.layoutTransitionPulse.value =
      layoutTransitionPulse;
    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.sphereRecessionProgress =
        openingProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionNeutrality =
        neutrality.toFixed(6);
      diagnosticsRef.current.dataset.collectionGreyDrainProgress =
        reconstitutionFrame.deactivationProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionGreyReturnProgress =
        reconstitutionFrame.reactivationProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionPresentationState =
        collectionReconstitutionPhase;
      diagnosticsRef.current.dataset.layoutModeTransitionPulse =
        layoutTransitionPulse.toFixed(6);
    }
  });

  return (
    <group ref={sphereRef} rotation={RESERVOIR_BASE_ROTATION}>
      <CollectionSphere
        collection={activeCollection}
        state="active"
        radius={RESERVOIR_RADIUS}
        surfaceDetail={RESERVOIR_SURFACE_MATERIAL.detail}
        surfaceRef={surfaceRef}
        surfaceMaterialRef={sphereMaterialRef}
        surfaceRoughness={RESERVOIR_SURFACE_MATERIAL.roughness}
        surfaceOnBeforeCompile={configureSurfacePulse}
        surfaceProgramCacheKey={getSurfacePulseProgramCacheKey}
      />
      <ReservoirSurfacePattern
        materialRef={surfacePatternMaterialRef}
        radius={RESERVOIR_RADIUS}
      />
      {(onQueryActivityComplete || collectionActivityRevision !== null) ? (
        <ReservoirQueryActivity
          diagnosticsRef={diagnosticsRef}
          mode={collectionActivityRevision !== null ? "success" : queryActivityMode}
          onComplete={onQueryActivityComplete ?? (() => {})}
          reducedMotion={openingReducedMotion}
          revision={collectionActivityRevision ?? queryActivityRevision}
          surfaceMaterialRef={sphereMaterialRef}
          externalProgressRef={
            collectionActivityRevision !== null
              ? collectionReconstitutionProgressRef
              : undefined
          }
        />
      ) : null}
      <group ref={childNodesRef} visible={!layoutModeSwitchHidden}>
        {activeNodes.map((node, nodeIndex) => {
        const direction = layout.get(node.id);
        if (!direction) return null;
        const filterSurfaced = surfacedNodeIds?.has(node.id) ?? true;
        const filterVisible = filterVisibleNodeIds?.has(node.id) ?? true;
        const surfaced =
          filterSurfaced ||
          (node.kind === "artifact" && node.id === locatingArtifactId) ||
          (node.kind === "artifact" && node.id === openingArtifact?.id);
        const reconstitutionSinking = collectionDeactivating;
        const layoutTransitionSink = layoutModeSwitchSinking;
        const layoutTransitionEmerging = layoutModeSwitchEmerging;
        const reconstitutionReactionDelay = openingReducedMotion
          ? 0
          : nodeIndex * 0.018;
        const nodeOpening =
          openingActive || reconstitutionSinking || layoutTransitionSink;
        const nodeRestoring = restoring || layoutTransitionEmerging;
        const nodeOpeningElapsedRef = layoutTransitionSink
          ? layoutModeTransitionElapsedRef
          : reconstitutionSinking
            ? collectionReconstitutionElapsedRef
            : openingElapsedRef;
        const nodeRestorationProgressRef = layoutTransitionEmerging
          ? layoutModeTransitionProgressRef
          : restorationProgressRef;
        const nodeOpeningReactionDelay = layoutTransitionSink
          ? 0
          : openingActive && openingArtifact?.id === node.id
            ? 0
            : reconstitutionSinking
              ? reconstitutionReactionDelay
              : getNodeReactionArrival(
                  openingReactionDistances.get(node.id) ?? 0,
                  maximumOpeningReactionDistance,
                  openingReducedMotion,
                  getShockwaveStart(openingReducedMotion),
                );

        return node.kind === "artifact" ? (
          <ArtifactNode
            key={node.id}
            artifact={node}
            direction={direction}
            nodeRadius={nodeSizing.artifactRadius}
            sphereRef={sphereRef}
            selected={selectedArtifactId === node.id}
            meshEngaged={
              meshEngagementCurrent &&
            selectedArtifactId === node.id &&
              meshEngagedNodeId === node.id
            }
            reservoirFrame={reservoirFrame}
            zoomLevel={zoomLevel}
            selectionActive={
              selectedNodeId !== null ||
              reconstitutionSinking ||
              layoutTransitionSink ||
              layoutTransitionEmerging ||
              emergingChildren
            }
            hovered={hoveredArtifactId === node.id}
            isDragging={isDragging}
            selectedPressActive={
              selectedPressActive && selectedArtifactId === node.id
            }
            surfaced={surfaced}
            continuationCueEnabled={continuationCueEnabled}
            interactionRevisionRef={interactionRevisionRef}
            diagnosticsRef={diagnosticsRef}
            opening={nodeOpening}
            openingSelected={
              openingActive && openingArtifact?.id === node.id
            }
            openingElapsedRef={nodeOpeningElapsedRef}
            openingReactionDelay={nodeOpeningReactionDelay}
            openingReducedMotion={openingReducedMotion}
            restoring={nodeRestoring}
            restorationProgressRef={nodeRestorationProgressRef}
            emerging={emergingChildren}
            emergenceProgressRef={emergenceProgressRef}
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            onHoverChange={onArtifactHoverChange}
          />
        ) : (
          <CollectionNode
            key={node.id}
            collection={node}
            direction={direction}
            nodeRadius={nodeSizing.collectionRadius}
            diagnosticsRef={diagnosticsRef}
            labelsSuppressed={
              selectedNodeId !== null ||
              reconstitutionSinking ||
              layoutTransitionSink ||
              layoutTransitionEmerging ||
              emergingChildren
            }
            interactionEnabled={interactionEnabled && surfaced}
            isDragging={isDragging}
            selected={selectedCollectionId === node.id}
            meshEngaged={
              meshEngagementCurrent &&
              selectedCollectionId === node.id &&
              meshEngagedNodeId === node.id
            }
            selectedPressActive={
              selectedPressActive && selectedCollectionId === node.id
            }
            selectionRetractionStarted={selectedMeshRetractionStarted}
            surfaced={surfaced}
            filterVisible={filterVisible}
            continuationCueEnabled={continuationCueEnabled}
            opening={nodeOpening}
            openingElapsedRef={nodeOpeningElapsedRef}
            openingReactionDelay={nodeOpeningReactionDelay}
            openingReducedMotion={openingReducedMotion}
            restoring={nodeRestoring}
            restorationProgressRef={nodeRestorationProgressRef}
            emerging={emergingChildren}
            emergenceProgressRef={emergenceProgressRef}
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            sphereRef={sphereRef}
            reservoirFrame={reservoirFrame}
            zoomLevel={zoomLevel}
          />
        );
        })}
      </group>
    </group>
  );
}
