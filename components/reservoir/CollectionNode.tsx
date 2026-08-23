import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import type { ReservoirFrame } from "@/lib/reservoir/frame";
import {
  RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
} from "@/lib/reservoir/opening";
import {
  RESERVOIR_GRID_DETAIL,
} from "@/lib/reservoir/geometry";
import type { ReservoirDirection } from "@/lib/reservoir/layout";
import {
  getCollectionNodeTransitionOffset,
  getCollectionNodeTransitionProgress,
} from "@/lib/reservoir/collection-entry";
import type { CollectionNodeTransitionPhase } from "@/lib/reservoir/collection-entry";
import {
  getReservoirNodeOpeningReaction,
  getEmbeddedCollectionNodeQuaternion,
  getReservoirNodePlacement,
  getReservoirNodeRestorationOffset,
  moveToward,
  RESERVOIR_NODE_HOVER_EMISSIVE_INTENSITY,
  RESERVOIR_NODE_HOVER_TRANSITION_DURATION,
  RESERVOIR_NODE_HOVER_WHITE_MIX,
  RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY,
} from "@/lib/reservoir/node";
import {
  advanceReservoirNodeSelection,
  addSelectedNodeSurfaceGradient,
  createReservoirNodeSelectionState,
  RESERVOIR_NODE_CONTINUATION_RING_INNER_RADIUS_RATIO,
  RESERVOIR_NODE_CONTINUATION_RING_OUTER_RADIUS_RATIO,
  RESERVOIR_NODE_REDUCED_MOTION_WHITE_MIX,
  RESERVOIR_NODE_SELECTED_HOVER_EMISSIVE_INTENSITY,
  RESERVOIR_NODE_SELECTED_HOVER_WHITE_MIX,
} from "@/lib/reservoir/selection";
import type {
  ReservoirCollectionActivationUniforms,
  ReservoirSelectedSurfaceUniforms,
} from "@/lib/reservoir/selection";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import {
  RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY,
  type ReservoirNodePointerVisibilityResolver,
  type ReservoirPointerCandidateSource,
} from "@/lib/reservoir/pointer";
import { ReservoirNodeLabel } from "./ArtifactLabel";
import { CollectionSphere } from "./CollectionSphere";
import { useReservoirNodeHover } from "./useReservoirNodeHover";

type CollectionNodeProps = {
  collection: Extract<ReservoirContentNode, { kind: "collection" }>;
  direction: ReservoirDirection;
  nodeRadius: number;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  labelsSuppressed: boolean;
  interactionEnabled: boolean;
  isDragging: boolean;
  meshEngaged: boolean;
  selected: boolean;
  selectedPressActive: boolean;
  selectionRetractionStarted?: boolean;
  surfaced: boolean;
  filterVisible: boolean;
  continuationCueEnabled: boolean;
  opening: boolean;
  openingElapsedRef: MutableRefObject<number>;
  openingReactionDelay: number;
  openingReducedMotion: boolean;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  emerging?: boolean;
  emergenceProgressRef?: MutableRefObject<number>;
  emergenceOrder?: number;
  emergenceChildCount?: number;
  collectionTransitionPhase?: CollectionNodeTransitionPhase | null;
  collectionTransitionProgressRef?: MutableRefObject<number>;
  collectionTransitionOrder?: number;
  collectionTransitionChildCount?: number;
  sphereRef: RefObject<THREE.Group | null>;
  reservoirFrame: ReservoirFrame;
  renderedZoomRef: MutableRefObject<number>;
  resolvePointerVisibility: ReservoirNodePointerVisibilityResolver;
};

export const COLLECTION_GRID_DETAIL = 1;
export const COLLECTION_SURFACE_DETAIL = 3;
export function CollectionNode({
  collection,
  direction,
  nodeRadius,
  diagnosticsRef,
  labelsSuppressed,
  interactionEnabled,
  isDragging,
  meshEngaged,
  selected,
  selectedPressActive,
  selectionRetractionStarted = false,
  surfaced,
  filterVisible,
  continuationCueEnabled,
  opening,
  openingElapsedRef,
  openingReactionDelay,
  openingReducedMotion,
  restoring,
  restorationProgressRef,
  emerging = false,
  emergenceProgressRef,
  emergenceOrder = 0,
  emergenceChildCount = 1,
  collectionTransitionPhase = null,
  collectionTransitionProgressRef,
  collectionTransitionOrder = 0,
  collectionTransitionChildCount = 1,
  sphereRef,
  reservoirFrame,
  renderedZoomRef,
  resolvePointerVisibility,
}: CollectionNodeProps) {
  const nodeRef = useRef<THREE.Group | null>(null);
  const visualNodeRef = useRef<THREE.Group | null>(null);
  const orbMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const gridMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const resolvedGridMaterialRef =
    useRef<THREE.LineBasicMaterial | null>(null);
  const continuationRingRef = useRef<THREE.Mesh | null>(null);
  const continuationRingMaterialRef =
    useRef<THREE.MeshBasicMaterial | null>(null);
  const [hovered, setHovered] = useState(false);
  const effectiveHovered = interactionEnabled && hovered;
  const updateHover = useCallback((_: string, nextHovered: boolean) => {
    setHovered(nextHovered);
  }, []);
  const { beginHover, clearHover, endHover } = useReservoirNodeHover(
    collection.id,
    updateHover,
  );
  const labelContent = useMemo(
    () => ({
      accentColor: collection.mediumColor,
      eyebrow: collection.mediumLabel,
      title: collection.title,
    }),
    [collection.mediumColor, collection.mediumLabel, collection.title],
  );
  const placement = useMemo(
    () =>
      getReservoirNodePlacement(
        direction,
        nodeRadius,
      ),
    [direction, nodeRadius],
  );
  const embeddedQuaternion = useMemo(
    () =>
      placement
        ? getEmbeddedCollectionNodeQuaternion(placement.normal)
        : null,
    [placement],
  );
  const selectedContactDirection = useMemo(
    () =>
      placement && embeddedQuaternion
        ? placement.normal
            .clone()
            .negate()
            .applyQuaternion(embeddedQuaternion.clone().invert())
        : new THREE.Vector3(0, -1, 0),
    [embeddedQuaternion, placement],
  );
  const restingColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.dormantCollection),
    [],
  );
  const hoverColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.inspection),
    [],
  );
  const hoverProgress = useRef(hovered ? 1 : 0);
  const initialFilterRadialOffset = surfaced
    ? 0
    : nodeRadius * RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER;
  const filterRadialOffset = useRef(initialFilterRadialOffset);
  const lastRenderedRadialOffset = useRef(initialFilterRadialOffset);
  const collectionDepartureStartOffset = useRef(initialFilterRadialOffset);
  const previousCollectionTransitionPhase = useRef<
    CollectionNodeTransitionPhase | null
  >(null);
  const selectionState = useRef(
    createReservoirNodeSelectionState({
      meshEngaged,
      nodeRadius,
      selected,
    }),
  );
  const selectedSurfaceUniforms = useRef<ReservoirSelectedSurfaceUniforms>({
    nodeContactDirection: {
      value: selectedContactDirection.clone(),
    },
    nodeSelectedWhite: {
      value: new THREE.Color(RESERVOIR_THEME.inspection),
    },
    nodeSelectedReveal: {
      value: selected && meshEngaged ? 1 : 0,
    },
  });
  const activationUniforms = useRef<ReservoirCollectionActivationUniforms>({
    nodeActiveColor: {
      value: new THREE.Color(RESERVOIR_THEME.sphere),
    },
    nodeActivationProgress: { value: 0 },
  });
  const configureSurfaceMaterial = useCallback(
    (
      shader: Parameters<
        THREE.MeshStandardMaterial["onBeforeCompile"]
      >[0],
    ) => {
      addSelectedNodeSurfaceGradient(
        shader,
        selectedSurfaceUniforms.current,
        0.012,
        activationUniforms.current,
      );
    },
    [],
  );
  const getSurfaceProgramCacheKey = useCallback(
    () => "reservoir-collection-selected-white-activation-v2",
    [],
  );

  useEffect(() => {
    selectedSurfaceUniforms.current.nodeContactDirection.value
      .copy(selectedContactDirection);
  }, [selectedContactDirection]);

  useEffect(() => {
    selectionState.current = createReservoirNodeSelectionState({
      meshEngaged,
      nodeRadius,
      selected,
    });
  }, [meshEngaged, nodeRadius, selected]);

  useEffect(() => {
    filterRadialOffset.current = surfaced
      ? 0
      : nodeRadius * RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER;
  }, [nodeRadius, surfaced]);

  useLayoutEffect(() => {
    const visualNode = visualNodeRef.current;
    if (
      !visualNode ||
      !placement ||
      collectionTransitionPhase !== "arrival" ||
      !collectionTransitionProgressRef
    ) {
      return;
    }

    visualNode.position.copy(placement.normal).multiplyScalar(
      getCollectionNodeTransitionOffset({
        nodeRadius,
        progress: getCollectionNodeTransitionProgress(
          collectionTransitionProgressRef.current,
          "arrival",
          collectionTransitionOrder,
          collectionTransitionChildCount,
        ),
        phase: "arrival",
        settledOffset: 0,
        reducedMotion: openingReducedMotion,
      }),
    );
  }, [
    collectionTransitionChildCount,
    collectionTransitionOrder,
    collectionTransitionPhase,
    collectionTransitionProgressRef,
    nodeRadius,
    openingReducedMotion,
    placement,
  ]);

  useEffect(() => {
    if (!surfaced || !interactionEnabled) {
      clearHover();
    }
  }, [clearHover, interactionEnabled, surfaced]);

  function updatePointerHover(
    event: ThreeEvent<PointerEvent>,
    target: string,
    source: ReservoirPointerCandidateSource,
  ) {
    if (
      !surfaced ||
      !interactionEnabled ||
      !resolvePointerVisibility({
        distance: event.distance,
        id: collection.id,
        kind: "collection",
        ray: event.ray,
        source,
      })
    ) {
      clearHover();
      return;
    }

    beginHover(target);
  }

  useFrame((_, delta) => {
    const visualNode = visualNodeRef.current;
    const material = orbMaterialRef.current;
    if (!visualNode || !material || !placement) return;
    const filterTarget = surfaced
      ? 0
      : nodeRadius *
        RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER;
    filterRadialOffset.current = THREE.MathUtils.damp(
      filterRadialOffset.current,
      filterTarget,
      openingReducedMotion ? 24 : 8,
      delta,
    );

    const selectionPresentationActive =
      selected && !selectionRetractionStarted;
    const selectionFrame = advanceReservoirNodeSelection(
      selectionState.current,
      {
        continuationCueEnabled,
        delta,
        hovered: effectiveHovered,
        isDragging,
        meshEngaged,
        nodeRadius,
        reducedMotion: openingReducedMotion,
        selected: selectionPresentationActive,
        selectedPressActive,
      },
    );
    selectedSurfaceUniforms.current.nodeSelectedReveal.value =
      selectionFrame.selectedReveal;
    const greyProgress = 0;
    const activeGridProgress = 0;
    activationUniforms.current.nodeActivationProgress.value = greyProgress;
    const gridMaterial = gridMaterialRef.current;
    if (gridMaterial) {
      gridMaterial.uniforms.selectedReveal.value =
        selectionFrame.selectedReveal;
    }

    const hoverTarget =
      effectiveHovered &&
      !opening &&
      !restoring &&
      !selectionState.current.releaseActive
        ? 1
        : 0;
    hoverProgress.current = moveToward(
      hoverProgress.current,
      hoverTarget,
      delta / RESERVOIR_NODE_HOVER_TRANSITION_DURATION,
    );
    const hoverWhiteMix = Math.min(
      hoverProgress.current *
      (selected
        ? RESERVOIR_NODE_SELECTED_HOVER_WHITE_MIX
        : RESERVOIR_NODE_HOVER_WHITE_MIX) +
        selectionFrame.continuationWhiteMix,
      1,
    );
    material.color
      .copy(restingColor)
      .lerp(hoverColor, hoverWhiteMix);
    material.emissive
      .copy(restingColor)
      .lerp(hoverColor, hoverWhiteMix);
    material.emissiveIntensity = THREE.MathUtils.lerp(
      RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY,
      selected
        ? RESERVOIR_NODE_SELECTED_HOVER_EMISSIVE_INTENSITY
        : RESERVOIR_NODE_HOVER_EMISSIVE_INTENSITY,
      Math.max(
        hoverProgress.current,
        selectionFrame.continuationWhiteMix /
          RESERVOIR_NODE_REDUCED_MOTION_WHITE_MIX,
      ),
    );
    if (gridMaterial) {
      gridMaterial.uniforms.baseOpacity.value = THREE.MathUtils.lerp(
        0.34,
        selected ? 0.42 : 0.34,
        hoverProgress.current,
      ) * (1 - activeGridProgress);
    }
    if (resolvedGridMaterialRef.current) {
      resolvedGridMaterialRef.current.opacity = 0.34 * activeGridProgress;
    }

    let openingReactionProgress = 0;
    const continuationRing = continuationRingRef.current;
    const continuationRingMaterial = continuationRingMaterialRef.current;
    if (continuationRing && continuationRingMaterial) {
      const ringVisible = selectionFrame.ringVisible && !opening && !restoring;
      continuationRing.visible = ringVisible;
      continuationRing.position
        .copy(placement.normal)
        .multiplyScalar(selectionFrame.ringRadialOffset);
      continuationRing.scale.setScalar(selectionFrame.ringScale);
      continuationRingMaterial.opacity = ringVisible
        ? selectionFrame.ringOpacity
        : 0;
    }

    let renderedRadialOffset =
      selectionFrame.radialOffset +
      selectionFrame.continuationOffset +
      filterRadialOffset.current;
    if (collectionTransitionPhase && collectionTransitionProgressRef) {
      if (
        collectionTransitionPhase === "departure" &&
        previousCollectionTransitionPhase.current !== "departure"
      ) {
        // Preserve the selected node's exact presented offset on the first exit frame.
        collectionDepartureStartOffset.current = lastRenderedRadialOffset.current;
      }
      const transitionProgress = getCollectionNodeTransitionProgress(
        collectionTransitionProgressRef.current,
        collectionTransitionPhase,
        collectionTransitionOrder,
        collectionTransitionChildCount,
      );
      renderedRadialOffset = getCollectionNodeTransitionOffset({
        nodeRadius,
        progress: transitionProgress,
        phase: collectionTransitionPhase,
        startOffset: collectionDepartureStartOffset.current,
        settledOffset: 0,
        reducedMotion: openingReducedMotion,
      });
      openingReactionProgress = transitionProgress;
    } else if (emerging && emergenceProgressRef) {
      const emergenceProgress = getCollectionNodeTransitionProgress(
        emergenceProgressRef.current,
        "arrival",
        emergenceOrder,
        emergenceChildCount,
      );
      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius,
        progress: emergenceProgress,
        restoredOffset: 0,
        selected: false,
      });
      openingReactionProgress = 1 - emergenceProgress;
    }
    if (opening && !collectionTransitionPhase) {
      const reaction = getReservoirNodeOpeningReaction({
        elapsed: openingElapsedRef.current,
        openingReactionDelay,
        nodeRadius,
        reducedMotion: openingReducedMotion,
        selected: false,
        startOffset: filterRadialOffset.current,
      });
      renderedRadialOffset = reaction.radialOffset;
      openingReactionProgress = reaction.progress;
    }
    if (restoring && !collectionTransitionPhase) {
      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius,
        progress: restorationProgressRef.current,
        restoredOffset: surfaced ? 0 : filterTarget,
        selected: false,
      });
      openingReactionProgress = 1 - restorationProgressRef.current;
    }

    visualNode.position
      .copy(placement.normal)
      .multiplyScalar(renderedRadialOffset);
    visualNode.userData.currentRadialOffset = renderedRadialOffset;
    visualNode.userData.openingReactionProgress = openingReactionProgress;
    visualNode.userData.filterSurfaced = surfaced;
    lastRenderedRadialOffset.current = renderedRadialOffset;
    previousCollectionTransitionPhase.current = collectionTransitionPhase;

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.collectionHovered = String(
        effectiveHovered,
      );
      diagnosticsRef.current.dataset.collectionHoverProgress =
        hoverProgress.current.toFixed(6);
      diagnosticsRef.current.dataset.collectionNodeRadialOffset =
        renderedRadialOffset.toFixed(6);
      diagnosticsRef.current.dataset.collectionOpeningReactionProgress =
        openingReactionProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionGridDetail = String(
        COLLECTION_GRID_DETAIL,
      );
      diagnosticsRef.current.dataset.collectionSurfaceDetail = String(
        COLLECTION_SURFACE_DETAIL,
      );
      diagnosticsRef.current.dataset.selectedCollectionRevealProgress =
        selectionFrame.selectedReveal.toFixed(6);
      diagnosticsRef.current.dataset.selectedCollectionGridProgress =
        (
          gridMaterial?.uniforms.selectedReveal.value ??
          selectionFrame.selectedReveal
        ).toFixed(6);
      diagnosticsRef.current.dataset.selectedCollectionRadialOffset =
        selectionFrame.radialOffset.toFixed(6);
      diagnosticsRef.current.dataset.selectedCollectionHoverProgress =
        (selected && effectiveHovered ? hoverProgress.current : 0).toFixed(6);
      if (selected) {
        diagnosticsRef.current.dataset.selectedCollectionSettled = String(
          selectionFrame.selectionSettled,
        );
      }
      diagnosticsRef.current.dataset.collectionContinuationCueActive =
        String(selectionFrame.continuationCueActive);
      diagnosticsRef.current.dataset.collectionContinuationCueCount = String(
        selectionFrame.continuationCueCount,
      );
      diagnosticsRef.current.dataset.collectionContinuationCueOffset =
        selectionFrame.continuationOffset.toFixed(6);
      diagnosticsRef.current.dataset.collectionContinuationRingOpacity =
        (continuationRingMaterial?.opacity ?? 0).toFixed(6);
      diagnosticsRef.current.dataset.collectionEntryConfirmationAllowed =
        "false";
      diagnosticsRef.current.dataset.selectedCollectionRetractionStarted =
        String(selectionRetractionStarted);
      if (selected) {
        diagnosticsRef.current.dataset.collectionActivationState =
          "dormant";
        diagnosticsRef.current.dataset.collectionGreyActivationProgress =
          greyProgress.toFixed(6);
        diagnosticsRef.current.dataset.collectionActiveGridProgress =
          activeGridProgress.toFixed(6);
      }
      diagnosticsRef.current.dataset.collectionResolvedGridDetail = String(
        RESERVOIR_GRID_DETAIL,
      );
    }
  });

  if (!placement) return null;

  const dormantInteractive = surfaced && interactionEnabled;

  return (
    <group
      ref={nodeRef}
      position={placement.position}
    >
      <mesh
        ref={continuationRingRef}
        visible={false}
        quaternion={placement.ringQuaternion}
        renderOrder={RESERVOIR_RENDER_ORDER.artifactNode}
      >
        <ringGeometry
          args={[
            nodeRadius *
              RESERVOIR_NODE_CONTINUATION_RING_INNER_RADIUS_RATIO,
            nodeRadius *
              RESERVOIR_NODE_CONTINUATION_RING_OUTER_RADIUS_RATIO,
            40,
          ]}
        />
        <meshBasicMaterial
          ref={continuationRingMaterialRef}
          color={RESERVOIR_THEME.inspection}
          transparent
          opacity={0}
          depthTest
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group
        ref={visualNodeRef}
        quaternion={embeddedQuaternion ?? undefined}
      >
        <CollectionSphere
          collection={collection}
          state="dormant"
          radius={nodeRadius}
          surfaceDetail={COLLECTION_SURFACE_DETAIL}
          gridDetail={COLLECTION_GRID_DETAIL}
          surfaceScale={1.012}
          gridArcSegments={4}
          surfaceMaterialRef={orbMaterialRef}
          dormantGridMaterialRef={gridMaterialRef}
          resolvedGridDetail={RESERVOIR_GRID_DETAIL}
          resolvedGridMaterialRef={resolvedGridMaterialRef}
          dormantGridContactDirection={selectedContactDirection}
          surfaceUserData={{
            collectionId: collection.id,
            [RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY]: "visible-mesh",
          }}
          surfaceOnBeforeCompile={configureSurfaceMaterial}
          surfaceProgramCacheKey={getSurfaceProgramCacheKey}
          onPointerEnter={(event) =>
            updatePointerHover(event, "orb", "visible-mesh")
          }
          onPointerMove={(event) =>
            updatePointerHover(event, "orb", "visible-mesh")
          }
          onPointerLeave={() => endHover("orb")}
        />
        {dormantInteractive ? (
          <mesh
            userData={{
              collectionId: collection.id,
              [RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY]: "hit-area",
            }}
            onPointerEnter={(event) =>
              updatePointerHover(event, "orb-hit-area", "hit-area")
            }
            onPointerMove={(event) =>
              updatePointerHover(event, "orb-hit-area", "hit-area")
            }
            onPointerLeave={() => endHover("orb-hit-area")}
          >
            <sphereGeometry args={[nodeRadius * 1.22, 12, 10]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              depthWrite={false}
              colorWrite={false}
            />
          </mesh>
        ) : null}
      </group>
      {filterVisible ? <ReservoirNodeLabel
        content={labelContent}
        nodeRef={nodeRef}
        sphereRef={sphereRef}
        reservoirFrame={reservoirFrame}
        renderedZoomRef={renderedZoomRef}
        diagnosticsRef={diagnosticsRef}
        nodeRadius={nodeRadius}
        suppressed={labelsSuppressed || !surfaced}
        hovered={effectiveHovered}
        userData={{ collectionId: collection.id }}
        onPointerEnter={() => interactionEnabled && beginHover("label")}
        onPointerLeave={() => endHover("label")}
      /> : null}
    </group>
  );
}
