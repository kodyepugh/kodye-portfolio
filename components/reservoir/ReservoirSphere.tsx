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
import {
  RESERVOIR_BASE_ROTATION,
  RESERVOIR_GRID_DETAIL,
  RESERVOIR_RADIUS,
  RESERVOIR_SURFACE_DETAIL,
  getReservoirPlacementGraphDistance,
  reservoirVertices,
} from "@/lib/reservoir/geometry";
import {
  COLLECTION_ENTRY_PHASES,
  COLLECTION_RETURN_PHASES,
  getCollectionEntryPhase,
} from "@/lib/reservoir/collection-entry";
import type { CollectionPresentationState } from "@/lib/reservoir/collection-entry";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import type {
  ReservoirArtifact,
  ReservoirCollection,
  ReservoirGridInspection,
  ReservoirNode,
} from "@/types/reservoir";
import {
  getNodeReactionArrival,
  getShockwaveStart,
  getSphereRecessionProgress,
} from "@/lib/reservoir/opening";
import {
  ArtifactNode,
  ORB_MESH_ENGAGEMENT_DELAY_MS,
} from "./ArtifactNode";
import { ReservoirNodeTerritory } from "./ArtifactTerritory";
import { ArtifactShockwave } from "./ArtifactShockwave";
import { CollectionNode } from "./CollectionNode";
import { CollectionSphere } from "./CollectionSphere";
import { SphereGrid } from "./SphereGrid";

const COLLECTION_ENTRY_NODE_REACTION_DELAY_SCALE = 0.28;
const COLLECTION_RETURN_NODE_REACTION_STAGGER = 0.035;
const COLLECTION_RETURN_NODE_REDUCED_MOTION_STAGGER = 0.008;

type ReservoirSphereProps = {
  activeCollection: ReservoirCollection;
  activeNodes: readonly ReservoirNode[];
  activeCollectionId: string;
  collectionEntryElapsedRef: MutableRefObject<number>;
  collectionEntryProgressRef: MutableRefObject<number>;
  collectionEntryTargetId: string | null;
  collectionReturnProgressRef: MutableRefObject<number>;
  collectionReturnNodeProgressRef: MutableRefObject<number>;
  collectionReturnDirection?: THREE.Vector3 | null;
  returningCollectionId: string | null;
  collectionPresentationState: CollectionPresentationState;
  surfaceRef?: RefObject<THREE.Mesh | null>;
  selectedArtifactId: string | null;
  selectedCollectionId: string | null;
  hoveredArtifactId: string | null;
  interactionEnabled: boolean;
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
  emergingChildren: boolean;
  emergenceProgressRef: MutableRefObject<number>;
  hideReservoirSurface?: boolean;
  reverseRecession?: boolean;
  onArtifactHoverChange: (artifactId: string, hovered: boolean) => void;
};

export function ReservoirSphere({
  activeCollection,
  activeNodes,
  activeCollectionId,
  collectionEntryElapsedRef,
  collectionEntryProgressRef,
  collectionEntryTargetId,
  collectionReturnProgressRef,
  collectionReturnNodeProgressRef,
  collectionReturnDirection = null,
  returningCollectionId,
  collectionPresentationState,
  surfaceRef,
  selectedArtifactId,
  selectedCollectionId,
  hoveredArtifactId,
  interactionEnabled,
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
  emergingChildren,
  emergenceProgressRef,
  hideReservoirSurface = false,
  reverseRecession = false,
  onArtifactHoverChange,
}: ReservoirSphereProps) {
  const sphereRef = useRef<THREE.Group | null>(null);
  const childNodesRef = useRef<THREE.Group | null>(null);
  const sphereMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sphereGridMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const parentTransferUniforms = useRef({
    parentTransferDirection: { value: new THREE.Vector3(0, 0, 1) },
    parentTransferProgress: { value: 0 },
    parentTransferDarkColor: {
      value: new THREE.Color(RESERVOIR_THEME.environment),
    },
  });
  const configureParentSurfaceMaterial = useCallback(
    (shader: Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0]) => {
      shader.uniforms.parentTransferDirection =
        parentTransferUniforms.current.parentTransferDirection;
      shader.uniforms.parentTransferProgress =
        parentTransferUniforms.current.parentTransferProgress;
      shader.uniforms.parentTransferDarkColor =
        parentTransferUniforms.current.parentTransferDarkColor;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          varying vec3 vParentTransferPosition;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vParentTransferPosition = position;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec3 parentTransferDirection;
          uniform float parentTransferProgress;
          uniform vec3 parentTransferDarkColor;
          varying vec3 vParentTransferPosition;`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float parentTransferCoordinate = (
            dot(
              normalize(vParentTransferPosition),
              normalize(parentTransferDirection)
            ) + 1.0
          ) * 0.5;
          float parentTransferFront = parentTransferProgress * 1.2 - 0.1;
          float parentDrainedMask = 1.0 - smoothstep(
            parentTransferFront - 0.12,
            parentTransferFront + 0.04,
            parentTransferCoordinate
          );
          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            parentTransferDarkColor,
            parentDrainedMask * 0.96
          );`,
        );
    },
    [],
  );
  const getParentSurfaceProgramCacheKey = useCallback(
    () => "reservoir-parent-directional-transfer-v1",
    [],
  );
  const sphereColor = useMemo(() => new THREE.Color(RESERVOIR_THEME.sphere), []);
  const recessedSphereColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.sphereRecessed),
    [],
  );
  const meshEngagementTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const parentHidden =
    collectionPresentationState === "hidden-ancestor";
  const parentTransitioning =
    collectionPresentationState === "transitioning-out";
  const parentReturning =
    collectionPresentationState === "transitioning-in";
  const selectedNodeId = selectedArtifactId ?? selectedCollectionId;
  const topologySelectedNodeId = parentTransitioning
    ? null
    : selectedNodeId;
  const collectionEntryTarget = activeNodes.find(
    (node) => node.id === collectionEntryTargetId,
  );
  const collectionEntryTargetDirection = collectionEntryTarget
    ? reservoirVertices[collectionEntryTarget.vertexId]?.clone().normalize()
    : null;
  const [meshEngagedNodeId, setMeshEngagedNodeId] = useState<
    string | null
  >(null);
  const [trackedMeshSelectionNodeId, setTrackedMeshSelectionNodeId] =
    useState(topologySelectedNodeId);
  if (trackedMeshSelectionNodeId !== topologySelectedNodeId) {
    setTrackedMeshSelectionNodeId(topologySelectedNodeId);
    setMeshEngagedNodeId(null);
  }
  const meshEngagementCurrent =
    trackedMeshSelectionNodeId === topologySelectedNodeId;
  const [territoryNodeIds, setTerritoryNodeIds] = useState<
    string[]
  >(topologySelectedNodeId ? [topologySelectedNodeId] : []);
  const [trackedTerritoryNodeId, setTrackedTerritoryNodeId] = useState(
    topologySelectedNodeId,
  );
  if (trackedTerritoryNodeId !== topologySelectedNodeId) {
    setTrackedTerritoryNodeId(topologySelectedNodeId);
    if (
      topologySelectedNodeId &&
      !territoryNodeIds.includes(topologySelectedNodeId)
    ) {
      setTerritoryNodeIds([...territoryNodeIds, topologySelectedNodeId]);
    }
  }
  const territoryNodes = territoryNodeIds
    .map((nodeId) =>
      activeNodes.find((node) => node.id === nodeId),
    )
    .filter((node) => node !== undefined);
  const collectionEntryReactionDistances = useMemo(() => {
    const distances = new Map<string, number>();
    if (!collectionEntryTarget) return distances;

    for (const node of activeNodes) {
      distances.set(
        node.id,
        getReservoirPlacementGraphDistance(
          collectionEntryTarget.vertexId,
          node.vertexId,
        ) ?? 0,
      );
    }
    return distances;
  }, [activeNodes, collectionEntryTarget]);
  const maximumCollectionEntryReactionDistance = Math.max(
    0,
    ...collectionEntryReactionDistances.values(),
  );
  const removeRetractedTerritory = useCallback((nodeId: string) => {
    setTerritoryNodeIds((currentIds) =>
      currentIds.filter((currentId) => currentId !== nodeId),
    );
  }, []);

  useEffect(() => {
    if (meshEngagementTimeout.current) {
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    }
    if (!topologySelectedNodeId) return;

    meshEngagementTimeout.current = setTimeout(() => {
      meshEngagementTimeout.current = null;
      setMeshEngagedNodeId(topologySelectedNodeId);
    }, ORB_MESH_ENGAGEMENT_DELAY_MS);

    return () => {
      if (!meshEngagementTimeout.current) return;
      clearTimeout(meshEngagementTimeout.current);
      meshEngagementTimeout.current = null;
    };
  }, [topologySelectedNodeId]);

  useFrame(() => {
    if (parentReturning && collectionReturnDirection) {
      parentTransferUniforms.current.parentTransferDirection.value.copy(
        collectionReturnDirection,
      );
    } else if (collectionEntryTargetDirection) {
      parentTransferUniforms.current.parentTransferDirection.value.copy(
        collectionEntryTargetDirection,
      );
    }
    const openingProgress = restoring
      ? 1 - restorationProgressRef.current
      : openingActive
        ? getSphereRecessionProgress(
            openingElapsedRef.current,
            openingReducedMotion,
          )
        : 0;
    const parentGreyFillProgress = parentReturning
      ? getCollectionEntryPhase(
          collectionReturnProgressRef.current,
          COLLECTION_RETURN_PHASES.parentGreyFill,
        )
      : 1;
    const parentTransferProgress = parentTransitioning
      ? getCollectionEntryPhase(
          collectionEntryProgressRef.current,
          COLLECTION_ENTRY_PHASES.parentGreyDrain,
        )
      : parentReturning
        ? 1 - parentGreyFillProgress
        : parentHidden
          ? 1
          : 0;
    parentTransferUniforms.current.parentTransferProgress.value =
      parentTransferProgress;
    sphereMaterialRef.current?.color
      .copy(sphereColor)
      .lerp(recessedSphereColor, openingProgress);
    if (sphereGridMaterialRef.current) {
      sphereGridMaterialRef.current.opacity =
        THREE.MathUtils.lerp(0.34, 0.1, openingProgress) *
        (1 - parentTransferProgress);
    }
    if (childNodesRef.current) {
      childNodesRef.current.visible =
        !parentReturning || collectionReturnNodeProgressRef.current > 0.001;
    }

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.sphereRecessionProgress =
        openingProgress.toFixed(6);
      diagnosticsRef.current.dataset.parentGreyDrainProgress =
        parentTransferProgress.toFixed(6);
      diagnosticsRef.current.dataset.parentGreyFillProgress =
        parentGreyFillProgress.toFixed(6);
      diagnosticsRef.current.dataset.parentPresentationState =
        collectionPresentationState;
    }
  });

  return (
    <group ref={sphereRef} rotation={RESERVOIR_BASE_ROTATION}>
      {!parentHidden && !hideReservoirSurface ? <CollectionSphere
        collection={activeCollection}
        state="active"
        radius={RESERVOIR_RADIUS}
        surfaceDetail={RESERVOIR_SURFACE_DETAIL}
        gridDetail={RESERVOIR_GRID_DETAIL}
        surfaceRef={surfaceRef}
        surfaceMaterialRef={sphereMaterialRef}
        gridMaterialRef={sphereGridMaterialRef}
        surfaceOnBeforeCompile={configureParentSurfaceMaterial}
        surfaceProgramCacheKey={getParentSurfaceProgramCacheKey}
      /> : null}
      {!parentHidden && !hideReservoirSurface ? territoryNodes.map((node) => (
        <ReservoirNodeTerritory
          key={`${node.id}-territory`}
          active={
            meshEngagementCurrent &&
            node.id === topologySelectedNodeId &&
            node.id === meshEngagedNodeId
          }
          selected={node.id === topologySelectedNodeId}
          color={
            node.kind === "artifact"
              ? node.color
              : RESERVOIR_THEME.inspection
          }
          node={node}
          onRetractionComplete={removeRetractedTerritory}
          secondSelectionMode={
            openingActive &&
            node.kind === "artifact" &&
            node.id === openingArtifact?.id
              ? "artifact-open"
              : parentTransitioning &&
                  node.kind === "collection" &&
                  node.id === collectionEntryTargetId
                ? "collection-retract"
                : null
          }
          secondSelectionElapsedRef={
            parentTransitioning && node.id === collectionEntryTargetId
              ? collectionEntryElapsedRef
              : openingElapsedRef
          }
          openingReducedMotion={openingReducedMotion}
          restoring={restoring}
          restorationProgressRef={restorationProgressRef}
          diagnosticsRef={diagnosticsRef}
        />
      )) : null}
      {!parentHidden && !hideReservoirSurface ? <SphereGrid
        inspectionRef={gridInspectionRef}
        selectedNodeVertexIds={territoryNodes.map(
          (node) => node.vertexId,
        )}
        sphereRef={sphereRef}
      /> : null}
      {!parentHidden && !hideReservoirSurface && shockwaveActive && openingArtifact ? (
        <ArtifactShockwave
          artifact={openingArtifact}
          elapsedRef={openingElapsedRef}
          maximumArtifactDistance={maximumOpeningReactionDistance}
          reducedMotion={openingReducedMotion}
          diagnosticsRef={diagnosticsRef}
        />
      ) : null}
      <group ref={childNodesRef}>{activeNodes.map((node, nodeIndex) => {
        const destination = node.id === collectionEntryTargetId;
        const returningChild =
          parentReturning && node.id === returningCollectionId;
        if (parentHidden && !destination) return null;
        if (returningChild) return null;
        const entrySinking = parentTransitioning && !destination;
        const entryReactionDelay = reverseRecession
          ? getShockwaveStart(openingReducedMotion) *
              COLLECTION_ENTRY_NODE_REACTION_DELAY_SCALE +
            nodeIndex *
              (openingReducedMotion
                ? COLLECTION_RETURN_NODE_REDUCED_MOTION_STAGGER
                : COLLECTION_RETURN_NODE_REACTION_STAGGER)
          : getNodeReactionArrival(
              collectionEntryReactionDistances.get(node.id) ?? 0,
              maximumCollectionEntryReactionDistance,
              openingReducedMotion,
            ) * COLLECTION_ENTRY_NODE_REACTION_DELAY_SCALE;

        return node.kind === "artifact" ? (
          <ArtifactNode
            key={node.id}
            artifact={node}
            sphereRef={sphereRef}
            selected={selectedArtifactId === node.id}
            meshEngaged={
              meshEngagementCurrent &&
              selectedArtifactId === node.id &&
              meshEngagedNodeId === node.id
            }
            selectionActive={selectedNodeId !== null || entrySinking}
            hovered={hoveredArtifactId === node.id}
            isDragging={isDragging}
            selectedPressActive={
              selectedPressActive && selectedArtifactId === node.id
            }
            continuationCueEnabled={continuationCueEnabled}
            interactionRevisionRef={interactionRevisionRef}
            diagnosticsRef={diagnosticsRef}
            opening={openingActive || entrySinking}
            openingSelected={
              openingActive && openingArtifact?.id === node.id
            }
            openingElapsedRef={
              entrySinking ? collectionEntryElapsedRef : openingElapsedRef
            }
            openingReactionDelay={
              openingActive && openingArtifact?.id === node.id
                ? 0
                : entrySinking
                ? entryReactionDelay
                : getNodeReactionArrival(
                    openingReactionDistances.get(node.id) ?? 0,
                    maximumOpeningReactionDistance,
                    openingReducedMotion,
                    getShockwaveStart(openingReducedMotion),
                  )
            }
            openingReducedMotion={openingReducedMotion}
            restoring={restoring}
            restorationProgressRef={restorationProgressRef}
            emerging={emergingChildren || parentReturning}
            emergenceProgressRef={
              parentReturning
                ? collectionReturnNodeProgressRef
                : emergenceProgressRef
            }
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            onHoverChange={onArtifactHoverChange}
          />
        ) : (
          <CollectionNode
            key={node.id}
            activationState={
              destination
                ? activeCollectionId === node.id
                  ? "active"
                  : parentTransitioning
                    ? "activating"
                    : "dormant"
                : "dormant"
            }
            activationProgressRef={collectionEntryProgressRef}
            activeSurfaceRef={surfaceRef}
            collection={node}
            diagnosticsRef={diagnosticsRef}
            labelsSuppressed={selectedNodeId !== null || entrySinking}
            interactionEnabled={interactionEnabled}
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
            continuationCueEnabled={continuationCueEnabled}
            opening={openingActive || entrySinking}
            openingElapsedRef={
              entrySinking ? collectionEntryElapsedRef : openingElapsedRef
            }
            openingReactionDelay={
              entrySinking
                ? entryReactionDelay
                : getNodeReactionArrival(
                    openingReactionDistances.get(node.id) ?? 0,
                    maximumOpeningReactionDistance,
                    openingReducedMotion,
                    getShockwaveStart(openingReducedMotion),
                  )
            }
            openingReducedMotion={openingReducedMotion}
            restoring={restoring}
            restorationProgressRef={restorationProgressRef}
            emerging={
              emergingChildren || parentReturning
            }
            emergenceProgressRef={
              parentReturning
                ? collectionReturnNodeProgressRef
                : emergenceProgressRef
            }
            emergenceOrder={nodeIndex}
            emergenceChildCount={activeNodes.length}
            sphereRef={sphereRef}
          />
        );
      })}</group>
    </group>
  );
}
