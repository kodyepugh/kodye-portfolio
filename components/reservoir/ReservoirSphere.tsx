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
import type { ReservoirNodePointerVisibilityResolver } from "@/lib/reservoir/pointer";
import {
  RESERVOIR_SURFACE_MATERIAL,
  RESERVOIR_SURFACE_PATTERN,
  RESERVOIR_SURFACE_PULSE,
  addReservoirSurfacePulseAndSelectionEffect,
  type ReservoirSurfaceSelectionUniforms,
  type ReservoirSurfacePulseUniforms,
} from "@/lib/reservoir/surface-material";
import {
  getCollectionReconstitutionFrame,
  getCollectionNodeTransitionProgress,
} from "@/lib/reservoir/collection-entry";
import type { CollectionReconstitutionPhase } from "@/lib/reservoir/collection-entry";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import type { Collection } from "@/types/content";
import type { Resource } from "@/types/content";
import {
  getReservoirNodeSizingFamily,
  isReservoirInspectableResourceNode,
  type ReservoirContentNode,
} from "@/lib/content/reservoir-adapter";
import {
  getNodeReactionArrival,
  getShockwaveStart,
  getShockwaveDuration,
  getSphereRecessionProgress,
} from "@/lib/reservoir/opening";
import { getNodeSelectionHighlightColor } from "@/lib/reservoir/selection";
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
  queryReservoirTransitionPhase?: CollectionReconstitutionPhase;
  queryReservoirTransitionProgressRef?: MutableRefObject<number>;
  layoutModeTransitionElapsedRef: MutableRefObject<number>;
  layoutModeTransitionProgressRef: MutableRefObject<number>;
  layoutModeTransitionPulseRef: MutableRefObject<number>;
  selectedMeshRetractionStarted: boolean;
  collectionActivityRevision?: number | null;
  surfaceRef?: RefObject<THREE.Mesh | null>;
  selectedResourceId: string | null;
  selectedCollectionId: string | null;
  hoveredResourceId: string | null;
  interactionEnabled: boolean;
  isDragging: boolean;
  reservoirFrame: ReservoirFrame;
  renderedZoomRef: MutableRefObject<number>;
  selectedPressActive: boolean;
  surfacedNodeIds?: ReadonlySet<string>;
  filterVisibleNodeIds?: ReadonlySet<string>;
  locatingResourceId?: string | null;
  continuationCueEnabled: boolean;
  interactionRevisionRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  openingActive: boolean;
  openingResource: Resource | null;
  openingElapsedRef: MutableRefObject<number>;
  openingReducedMotion: boolean;
  openingReactionDistances: ReadonlyMap<string, number>;
  maximumInspectionReactionDistance: number;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  emergingChildren: boolean;
  onResourceHoverChange: (resourceId: string, hovered: boolean) => void;
  resolvePointerVisibility: ReservoirNodePointerVisibilityResolver;
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
  queryReservoirTransitionPhase = "idle",
  queryReservoirTransitionProgressRef,
  layoutModeTransitionElapsedRef,
  layoutModeTransitionProgressRef,
  layoutModeTransitionPulseRef,
  selectedMeshRetractionStarted,
  collectionActivityRevision = null,
  surfaceRef,
  selectedResourceId,
  selectedCollectionId,
  hoveredResourceId,
  interactionEnabled,
  isDragging,
  reservoirFrame,
  renderedZoomRef,
  selectedPressActive,
  surfacedNodeIds,
  filterVisibleNodeIds,
  locatingResourceId = null,
  continuationCueEnabled,
  interactionRevisionRef,
  diagnosticsRef,
  openingActive,
  openingResource,
  openingElapsedRef,
  openingReducedMotion,
  openingReactionDistances,
  maximumInspectionReactionDistance,
  restoring,
  restorationProgressRef,
  emergingChildren,
  onResourceHoverChange,
  resolvePointerVisibility,
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
  const surfaceSelectionUniforms = useRef<ReservoirSurfaceSelectionUniforms>({
    selectedNodeDirection: {
      value: new THREE.Vector3(0, 1, 0),
    },
    selectedNodeColor: {
      value: new THREE.Color(RESERVOIR_THEME.inspection),
    },
    selectedNodeAngularRadius: { value: 0 },
    selectedGlowRadiusProgress: { value: 0 },
    selectedGlowVisibility: { value: 0 },
    selectedShockwaveProgress: { value: 0 },
    selectedShockwaveActive: { value: 0 },
  });
  const surfaceSelectionPresentationRef = useRef({
    selectedNodeId: null as string | null,
    selectedNodeAngularRadius: 0,
    selectedGlowRadiusProgress: 0,
    selectedGlowVisibility: 0,
    selectedNodeDirection: new THREE.Vector3(0, 1, 0),
    selectedNodeColor: new THREE.Color(RESERVOIR_THEME.inspection),
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
  const reservoirExchangePhase =
    collectionReconstitutionPhase !== "idle"
      ? collectionReconstitutionPhase
      : queryReservoirTransitionPhase;
  const reservoirExchangeProgressRef =
    collectionReconstitutionPhase !== "idle"
      ? collectionReconstitutionProgressRef
      : queryReservoirTransitionProgressRef ??
        collectionReconstitutionProgressRef;
  const reservoirExchangeActive = reservoirExchangePhase !== "idle";
  const reservoirExchangeDeactivating =
    reservoirExchangePhase === "deactivating";
  const reservoirExchangeReactivating =
    reservoirExchangePhase === "reactivating";
  const layoutModeSwitchSinking =
    layoutModeTransitionState === "sinking";
  const layoutModeSwitchEmerging =
    layoutModeTransitionState === "emerging";
  const layoutModeSwitchHidden =
    layoutModeTransitionState === "orienting";
  const selectedNodeId = selectedResourceId ?? selectedCollectionId;
  const selectedNode = useMemo(
    () =>
      selectedNodeId
        ? activeNodes.find((node) => node.id === selectedNodeId) ?? null
        : null,
    [activeNodes, selectedNodeId],
  );
  const selectedNodeDirection = useMemo(() => {
    if (!selectedNodeId) return new THREE.Vector3(0, 1, 0);
    const direction = layout.get(selectedNodeId);
    return direction
      ? new THREE.Vector3(direction[0], direction[1], direction[2]).normalize()
      : new THREE.Vector3(0, 1, 0);
  }, [layout, selectedNodeId]);
  const selectedNodeColor = useMemo(
    () =>
      selectedNode
        ? getNodeSelectionHighlightColor(selectedNode)
        : new THREE.Color(RESERVOIR_THEME.inspection),
    [selectedNode],
  );
  const selectedNodeRadius = useMemo(() => {
    if (!selectedNode) return 0;
    return getReservoirNodeSizingFamily(selectedNode) === "inspectable-resource"
      ? nodeSizing.artifactRadius
      : nodeSizing.collectionRadius;
  }, [nodeSizing.artifactRadius, nodeSizing.collectionRadius, selectedNode]);
  const selectedNodeAngularRadius = useMemo(() => {
    if (selectedNodeRadius <= 0) return 0;
    return Math.asin(Math.min(selectedNodeRadius / RESERVOIR_RADIUS, 0.999999));
  }, [selectedNodeRadius]);
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
      addReservoirSurfacePulseAndSelectionEffect(
        shader,
        surfacePulseUniforms.current,
        surfaceSelectionUniforms.current,
      );
    },
    [],
  );

  const getSurfacePulseProgramCacheKey = useCallback(
    () => "reservoir-surface-pulse-selection-v2",
    [],
  );

  useEffect(() => {
    if (!selectedNode || !selectedNodeId) return;
    const presentation = surfaceSelectionPresentationRef.current;
    presentation.selectedNodeId = selectedNodeId;
    presentation.selectedNodeDirection.copy(selectedNodeDirection);
    presentation.selectedNodeColor.copy(selectedNodeColor);
    presentation.selectedNodeAngularRadius = selectedNodeAngularRadius;
    presentation.selectedGlowVisibility = 1;
  }, [
    selectedNode,
    selectedNodeAngularRadius,
    selectedNodeColor,
    selectedNodeDirection,
    selectedNodeId,
  ]);

  useFrame((_, delta) => {
    const openingProgress = restoring
      ? 1 - restorationProgressRef.current
      : openingActive
        ? getSphereRecessionProgress(
            openingElapsedRef.current,
            openingReducedMotion,
          )
        : 0;
    const reconstitutionFrame = getCollectionReconstitutionFrame(
      reservoirExchangeProgressRef.current,
    );
    const layoutTransitionPulse = layoutModeTransitionPulseRef.current;
    const neutrality = reservoirExchangeActive
      ? reconstitutionFrame.neutrality
      : 0;
    const selectionPresentation =
      surfaceSelectionPresentationRef.current;
    const selectionRetreatActive =
      selectedMeshRetractionStarted ||
      (openingActive && openingResource?.id === selectedResourceId);
    const selectedCollectionIndex = selectedCollectionId
      ? activeNodes.findIndex((node) => node.id === selectedCollectionId)
      : -1;
    const collectionHighlightRetreat =
      selectedMeshRetractionStarted &&
      reservoirExchangeDeactivating &&
      selectedNode?.kind === "collection" &&
      selectedCollectionIndex >= 0;
    if (selectedNodeId && selectedNode) {
      selectionPresentation.selectedNodeId = selectedNodeId;
      selectionPresentation.selectedNodeDirection.copy(selectedNodeDirection);
      selectionPresentation.selectedNodeColor.copy(selectedNodeColor);
      selectionPresentation.selectedNodeAngularRadius =
        selectedNodeAngularRadius;
    }
    const collectionHighlightProgress = collectionHighlightRetreat
      ? getCollectionNodeTransitionProgress(
          reservoirExchangeProgressRef.current,
          "departure",
          selectedCollectionIndex,
          activeNodes.length,
        )
      : 0;
    const selectedGlowRadiusTarget =
      selectionRetreatActive || !selectedNode ? 0 : 1;
    if (collectionHighlightRetreat) {
      // Share the selected node's finite sink progress; never let semantics revive it.
      selectionPresentation.selectedGlowRadiusProgress =
        1 - collectionHighlightProgress;
      selectionPresentation.selectedGlowVisibility =
        collectionHighlightProgress < 1 ? 1 : 0;
    } else {
      selectionPresentation.selectedGlowRadiusProgress = THREE.MathUtils.damp(
        selectionPresentation.selectedGlowRadiusProgress,
        selectedGlowRadiusTarget,
        14,
        delta,
      );
      selectionPresentation.selectedGlowVisibility = selectedNodeId
        ? 1
        : selectionRetreatActive ||
            selectionPresentation.selectedGlowRadiusProgress > 0.0001
          ? 1
          : 0;
    }
    if (
      selectionPresentation.selectedGlowRadiusProgress <= 0.0001 &&
      selectedGlowRadiusTarget === 0 &&
      !selectedNodeId
    ) {
      selectionPresentation.selectedNodeId = null;
      selectionPresentation.selectedNodeAngularRadius = 0;
      selectionPresentation.selectedNodeDirection.set(0, 1, 0);
      selectionPresentation.selectedNodeColor.set(RESERVOIR_THEME.inspection);
      selectionPresentation.selectedGlowVisibility = 0;
    }
    sphereMaterialRef.current?.color
      .copy(sphereColor)
      .lerp(recessedSphereColor, openingProgress)
      .lerp(neutralSphereColor, neutrality);
    surfaceSelectionUniforms.current.selectedNodeDirection.value.copy(
      selectionPresentation.selectedNodeDirection,
    );
    surfaceSelectionUniforms.current.selectedNodeColor.value.copy(
      selectionPresentation.selectedNodeColor,
    );
    surfaceSelectionUniforms.current.selectedNodeAngularRadius.value =
      selectionPresentation.selectedNodeAngularRadius;
    surfaceSelectionUniforms.current.selectedGlowRadiusProgress.value =
      selectionPresentation.selectedGlowRadiusProgress;
    surfaceSelectionUniforms.current.selectedGlowVisibility.value =
      selectionPresentation.selectedGlowVisibility;
    surfaceSelectionUniforms.current.selectedShockwaveProgress.value =
      openingActive && openingResource?.id === selectedResourceId
        ? Math.min(
            Math.max(
              (openingElapsedRef.current -
                getShockwaveStart(openingReducedMotion)) /
                getShockwaveDuration(openingReducedMotion),
              0,
            ),
            1,
          )
        : 0;
    surfaceSelectionUniforms.current.selectedShockwaveActive.value =
      openingActive && openingResource?.id === selectedResourceId ? 1 : 0;
    const patternMaterial = surfacePatternMaterialRef.current;
    if (patternMaterial) {
      patternMaterial.uniforms.lineOpacity.value =
        RESERVOIR_SURFACE_PATTERN.lineOpacity;
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
        reservoirExchangePhase;
      diagnosticsRef.current.dataset.layoutModeTransitionPulse =
        layoutTransitionPulse.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedGlowReveal =
        surfaceSelectionUniforms.current.selectedGlowRadiusProgress.value.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedGlowRadiusProgress =
        surfaceSelectionUniforms.current.selectedGlowRadiusProgress.value.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedGlowVisibility =
        surfaceSelectionUniforms.current.selectedGlowVisibility.value.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedNodeAngularRadius =
        surfaceSelectionUniforms.current.selectedNodeAngularRadius.value.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedShockwaveProgress =
        surfaceSelectionUniforms.current.selectedShockwaveProgress.value.toFixed(6);
      diagnosticsRef.current.dataset.surfaceSelectedCollectionSinkProgress =
        collectionHighlightProgress.toFixed(6);
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
              : queryReservoirTransitionPhase !== "idle"
                ? queryReservoirTransitionProgressRef
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
          (node.kind !== "collection" && node.id === locatingResourceId) ||
          (node.kind !== "collection" && node.id === openingResource?.id);
        const reconstitutionSinking = reservoirExchangeDeactivating;
        const collectionNodeTransitionPhase = reservoirExchangeDeactivating
          ? "departure"
          : reservoirExchangeReactivating
            ? "arrival"
            : null;
        const layoutTransitionSink = layoutModeSwitchSinking;
        const layoutTransitionEmerging = layoutModeSwitchEmerging;
        const nodeOpening = openingActive || layoutTransitionSink;
        const nodeRestoring = restoring || layoutTransitionEmerging;
        const nodeOpeningElapsedRef = layoutTransitionSink
          ? layoutModeTransitionElapsedRef
          : openingElapsedRef;
        const nodeRestorationProgressRef = layoutTransitionEmerging
          ? layoutModeTransitionProgressRef
          : restorationProgressRef;
        const nodeOpeningReactionDelay = layoutTransitionSink
          ? 0
          : openingActive && openingResource?.id === node.id
            ? 0
            : getNodeReactionArrival(
                  openingReactionDistances.get(node.id) ?? 0,
                  maximumInspectionReactionDistance,
                  openingReducedMotion,
                  getShockwaveStart(openingReducedMotion),
                );

        return isReservoirInspectableResourceNode(node) ? (
          <ArtifactNode
            key={node.id}
            artifact={node}
            direction={direction}
            nodeRadius={nodeSizing.artifactRadius}
            sphereRef={sphereRef}
            selected={selectedResourceId === node.id}
            meshEngaged={
              meshEngagementCurrent &&
            selectedResourceId === node.id &&
              meshEngagedNodeId === node.id
            }
            reservoirFrame={reservoirFrame}
            renderedZoomRef={renderedZoomRef}
            selectionActive={
              selectedNodeId !== null ||
              reconstitutionSinking ||
              layoutTransitionSink ||
              layoutTransitionEmerging ||
              reservoirExchangeReactivating ||
              emergingChildren
            }
            hovered={hoveredResourceId === node.id}
            isDragging={isDragging}
            selectedPressActive={
              selectedPressActive && selectedResourceId === node.id
            }
            surfaced={surfaced}
            interactionEnabled={interactionEnabled && surfaced}
            continuationCueEnabled={
              continuationCueEnabled && node.kind === "artifact"
            }
            interactionRevisionRef={interactionRevisionRef}
            diagnosticsRef={diagnosticsRef}
            opening={nodeOpening}
            openingSelected={
              openingActive && openingResource?.id === node.id
            }
            openingElapsedRef={nodeOpeningElapsedRef}
            openingReactionDelay={nodeOpeningReactionDelay}
            openingReducedMotion={openingReducedMotion}
            restoring={nodeRestoring}
            restorationProgressRef={nodeRestorationProgressRef}
            emerging={reservoirExchangeReactivating}
            emergenceProgressRef={reservoirExchangeProgressRef}
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            collectionTransitionPhase={collectionNodeTransitionPhase}
            collectionTransitionProgressRef={reservoirExchangeProgressRef}
            collectionTransitionOrder={nodeIndex}
            collectionTransitionChildCount={activeNodes.length}
            onHoverChange={onResourceHoverChange}
            resolvePointerVisibility={resolvePointerVisibility}
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
              reservoirExchangeReactivating ||
              emergingChildren
            }
            interactionEnabled={interactionEnabled && surfaced}
            resolvePointerVisibility={resolvePointerVisibility}
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
            emerging={reservoirExchangeReactivating}
            emergenceProgressRef={reservoirExchangeProgressRef}
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            collectionTransitionPhase={collectionNodeTransitionPhase}
            collectionTransitionProgressRef={reservoirExchangeProgressRef}
            collectionTransitionOrder={nodeIndex}
            collectionTransitionChildCount={activeNodes.length}
            sphereRef={sphereRef}
            reservoirFrame={reservoirFrame}
            renderedZoomRef={renderedZoomRef}
          />
        );
        })}
      </group>
    </group>
  );
}
