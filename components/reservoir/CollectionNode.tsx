import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  RESERVOIR_COLLECTION_NODE_RADIUS,
  RESERVOIR_GRID_DETAIL,
} from "@/lib/reservoir/geometry";
import {
  COLLECTION_ENTRY_PHASES,
  COLLECTION_RETURN_PHASES,
  getCollectionChildEmergenceProgress,
  getCollectionEntryPhase,
} from "@/lib/reservoir/collection-entry";
import {
  getReservoirNodeOpeningReaction,
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
  RESERVOIR_NODE_SELECTED_RADIAL_RATIO,
} from "@/lib/reservoir/selection";
import type {
  ReservoirCollectionActivationUniforms,
  ReservoirSelectedSurfaceUniforms,
} from "@/lib/reservoir/selection";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import type { EmbeddedReservoirCollection } from "@/types/reservoir";
import { ReservoirNodeLabel } from "./ArtifactLabel";
import { CollectionSphere } from "./CollectionSphere";
import { useReservoirNodeHover } from "./useReservoirNodeHover";

type CollectionNodeProps = {
  activationState: "dormant" | "activating" | "active" | "deactivating";
  activationProgressRef: MutableRefObject<number>;
  activeSurfaceRef?: RefObject<THREE.Mesh | null>;
  collection: EmbeddedReservoirCollection;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  labelsSuppressed: boolean;
  interactionEnabled: boolean;
  isDragging: boolean;
  meshEngaged: boolean;
  selected: boolean;
  selectedPressActive: boolean;
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
  returnProgressRef?: MutableRefObject<number>;
  sphereRef: RefObject<THREE.Group | null>;
};

export const COLLECTION_GRID_DETAIL = 1;
export const COLLECTION_SURFACE_DETAIL = 3;
export function CollectionNode({
  activationState,
  activationProgressRef,
  activeSurfaceRef,
  collection,
  diagnosticsRef,
  labelsSuppressed,
  interactionEnabled,
  isDragging,
  meshEngaged,
  selected,
  selectedPressActive,
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
  returnProgressRef,
  sphereRef,
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
  const active = activationState === "active";
  const activationTarget =
    activationState === "active" || activationState === "activating";
  const updateHover = useCallback((_: string, nextHovered: boolean) => {
    setHovered(nextHovered);
  }, []);
  const { beginHover, endHover } = useReservoirNodeHover(
    collection.id,
    updateHover,
  );
  const labelContent = useMemo(
    () => ({
      accentColor: RESERVOIR_THEME.dormantCollection,
      eyebrow: "Collection",
      title: collection.title,
    }),
    [collection.title],
  );
  const placement = useMemo(
    () =>
      getReservoirNodePlacement(
        collection.vertexId,
        RESERVOIR_COLLECTION_NODE_RADIUS,
      ),
    [collection.vertexId],
  );
  const selectedContactDirection = useMemo(
    () =>
      placement
        ? placement.normal.clone().negate()
        : new THREE.Vector3(0, -1, 0),
    [placement],
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
  const selectionState = useRef(
    createReservoirNodeSelectionState({
      meshEngaged,
      nodeRadius: RESERVOIR_COLLECTION_NODE_RADIUS,
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
    nodeActivationProgress: { value: active ? 1 : 0 },
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

  useFrame((_, delta) => {
    const visualNode = visualNodeRef.current;
    const material = orbMaterialRef.current;
    if (!visualNode || !material || !placement) return;

    const selectionPresentationActive =
      selected && activationState === "dormant";
    const selectionFrame = advanceReservoirNodeSelection(
      selectionState.current,
      {
        continuationCueEnabled,
        delta,
        hovered: effectiveHovered,
        isDragging,
        meshEngaged,
        nodeRadius: RESERVOIR_COLLECTION_NODE_RADIUS,
        reducedMotion: openingReducedMotion,
        selected: selectionPresentationActive,
        selectedPressActive,
      },
    );
    selectedSurfaceUniforms.current.nodeSelectedReveal.value =
      selectionFrame.selectedReveal;
    const entryProgress = activationTarget ? activationProgressRef.current : 0;
    const returnProgress = returnProgressRef?.current ?? 0;
    const greyProgress =
      activationState === "active"
        ? 1
        : activationState === "deactivating"
          ? 1 -
            getCollectionEntryPhase(
              returnProgress,
              COLLECTION_RETURN_PHASES.childGreyDrain,
            )
          : getCollectionEntryPhase(
              entryProgress,
              COLLECTION_ENTRY_PHASES.destinationGreyFill,
            );
    const activeGridProgress =
      activationState === "active"
        ? 1
        : activationState === "deactivating"
          ? 1 -
            getCollectionEntryPhase(
              returnProgress,
              COLLECTION_RETURN_PHASES.childGridDormancy,
            )
          : getCollectionEntryPhase(
              entryProgress,
              COLLECTION_ENTRY_PHASES.destinationGridResolve,
            );
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

    const continuationRing = continuationRingRef.current;
    const continuationRingMaterial = continuationRingMaterialRef.current;
    if (continuationRing && continuationRingMaterial) {
      const ringVisible =
        selectionFrame.ringVisible && !opening && !restoring;
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
      selectionFrame.radialOffset + selectionFrame.continuationOffset;
    if (activationTarget) {
      renderedRadialOffset =
        RESERVOIR_COLLECTION_NODE_RADIUS *
        RESERVOIR_NODE_SELECTED_RADIAL_RATIO;
    }
    if (activationState === "deactivating") {
      renderedRadialOffset = 0;
    }
    let openingReactionProgress = 0;
    if (emerging && emergenceProgressRef) {
      const emergenceProgress = getCollectionChildEmergenceProgress(
        emergenceProgressRef.current,
        emergenceOrder,
        emergenceChildCount,
      );
      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius: RESERVOIR_COLLECTION_NODE_RADIUS,
        progress: emergenceProgress,
        restoredOffset: 0,
        selected: false,
      });
      openingReactionProgress = 1 - emergenceProgress;
    }
    if (opening) {
      const reaction = getReservoirNodeOpeningReaction({
        elapsed: openingElapsedRef.current,
        openingReactionDelay,
        nodeRadius: RESERVOIR_COLLECTION_NODE_RADIUS,
        reducedMotion: openingReducedMotion,
        selected: false,
        startOffset: 0,
      });
      renderedRadialOffset = reaction.radialOffset;
      openingReactionProgress = reaction.progress;
    }
    if (restoring) {
      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius: RESERVOIR_COLLECTION_NODE_RADIUS,
        progress: restorationProgressRef.current,
        restoredOffset: 0,
        selected: false,
      });
      openingReactionProgress = 1 - restorationProgressRef.current;
    }

    visualNode.position
      .copy(placement.normal)
      .multiplyScalar(renderedRadialOffset);
    visualNode.userData.currentRadialOffset = renderedRadialOffset;
    visualNode.userData.openingReactionProgress = openingReactionProgress;

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
      diagnosticsRef.current.dataset.selectedCollectionSettled = String(
        selected && selectionFrame.selectionSettled,
      );
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
      diagnosticsRef.current.dataset.collectionActivationState =
        activationState;
      diagnosticsRef.current.dataset.collectionGreyActivationProgress =
        greyProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionActiveGridProgress =
        activeGridProgress.toFixed(6);
      diagnosticsRef.current.dataset.collectionResolvedGridDetail = String(
        RESERVOIR_GRID_DETAIL,
      );
    }
  });

  if (!placement) return null;

  const dormantInteractive = activationState === "dormant";

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
            RESERVOIR_COLLECTION_NODE_RADIUS *
              RESERVOIR_NODE_CONTINUATION_RING_INNER_RADIUS_RATIO,
            RESERVOIR_COLLECTION_NODE_RADIUS *
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
      <group ref={visualNodeRef}>
        <CollectionSphere
          collection={collection}
          state="dormant"
          radius={RESERVOIR_COLLECTION_NODE_RADIUS}
          surfaceDetail={COLLECTION_SURFACE_DETAIL}
          gridDetail={COLLECTION_GRID_DETAIL}
          surfaceScale={1.012}
          gridArcSegments={4}
          surfaceRef={active ? activeSurfaceRef : undefined}
          surfaceMaterialRef={orbMaterialRef}
          dormantGridMaterialRef={gridMaterialRef}
          resolvedGridDetail={RESERVOIR_GRID_DETAIL}
          resolvedGridMaterialRef={resolvedGridMaterialRef}
          dormantGridContactDirection={selectedContactDirection}
          surfaceUserData={{ collectionId: collection.id }}
          surfaceOnBeforeCompile={configureSurfaceMaterial}
          surfaceProgramCacheKey={getSurfaceProgramCacheKey}
          onPointerEnter={() => beginHover("orb")}
          onPointerLeave={() => endHover("orb")}
        />
      </group>
      {dormantInteractive ? <mesh
        userData={{ collectionId: collection.id }}
        onPointerEnter={() => beginHover("orb-hit-area")}
        onPointerLeave={() => endHover("orb-hit-area")}
      >
        <sphereGeometry
          args={[RESERVOIR_COLLECTION_NODE_RADIUS * 2.15, 12, 10]}
        />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh> : null}
      {dormantInteractive ? <mesh
        position={placement.hoverBridgePosition}
        onPointerEnter={() => beginHover("label-bridge")}
        onPointerLeave={() => endHover("label-bridge")}
      >
        <sphereGeometry
          args={[RESERVOIR_COLLECTION_NODE_RADIUS * 2.8, 12, 10]}
        />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh> : null}
      {dormantInteractive ? <ReservoirNodeLabel
        content={labelContent}
        nodeRef={nodeRef}
        sphereRef={sphereRef}
        position={placement.labelPosition}
        nodeRadius={RESERVOIR_COLLECTION_NODE_RADIUS}
        suppressed={labelsSuppressed}
        hovered={effectiveHovered}
        userData={{ collectionId: collection.id }}
        onPointerEnter={() => beginHover("label")}
        onPointerLeave={() => endHover("label")}
      /> : null}
    </group>
  );
}
