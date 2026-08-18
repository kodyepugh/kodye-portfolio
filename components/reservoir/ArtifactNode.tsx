import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import type { ReservoirFrame } from "@/lib/reservoir/frame";
import {
  RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
} from "@/lib/reservoir/opening";
import type { ReservoirDirection } from "@/lib/reservoir/layout";
import { getCollectionChildEmergenceProgress } from "@/lib/reservoir/collection-entry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
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
  RESERVOIR_NODE_CONTINUATION_RING_END_SCALE,
  RESERVOIR_NODE_CONTINUATION_RING_MAX_OPACITY,
  RESERVOIR_NODE_CONTINUATION_RING_START_SCALE,
  RESERVOIR_NODE_CONTINUATION_RING_TRAVEL_RATIO,
  RESERVOIR_NODE_MESH_ENGAGEMENT_DELAY_MS,
  RESERVOIR_NODE_SELECTED_HOVER_EMISSIVE_INTENSITY,
  RESERVOIR_NODE_SELECTED_HOVER_WHITE_MIX,
  RESERVOIR_NODE_SELECTED_RADIAL_RATIO,
  RESERVOIR_NODE_REDUCED_MOTION_WHITE_MIX,
} from "@/lib/reservoir/selection";
import type { ReservoirSelectedSurfaceUniforms } from "@/lib/reservoir/selection";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import { ArtifactLabel } from "./ArtifactLabel";
import { useReservoirNodeHover } from "./useReservoirNodeHover";

type ArtifactNodeProps = {
  artifact: Extract<ReservoirContentNode, { kind: "artifact" }>;
  direction: ReservoirDirection;
  nodeRadius: number;
  selected: boolean;
  meshEngaged: boolean;
  selectionActive: boolean;
  hovered: boolean;
  isDragging: boolean;
  selectedPressActive: boolean;
  surfaced: boolean;
  continuationCueEnabled: boolean;
  interactionRevisionRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  opening: boolean;
  openingSelected: boolean;
  openingElapsedRef: MutableRefObject<number>;
  openingReactionDelay: number;
  openingReducedMotion: boolean;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  emerging?: boolean;
  emergenceProgressRef?: MutableRefObject<number>;
  emergenceOrder?: number;
  emergenceChildCount?: number;
  sphereRef: RefObject<THREE.Group | null>;
  reservoirFrame: ReservoirFrame;
  renderedZoomRef: MutableRefObject<number>;
  onHoverChange: (artifactId: string, hovered: boolean) => void;
};

const ORB_RESTING_RADIAL_OFFSET = 0;
export const ORB_MESH_ENGAGEMENT_DELAY_MS =
  RESERVOIR_NODE_MESH_ENGAGEMENT_DELAY_MS;

export function ArtifactNode({
  artifact,
  direction,
  nodeRadius,
  selected,
  meshEngaged,
  selectionActive,
  hovered,
  isDragging,
  selectedPressActive,
  surfaced,
  continuationCueEnabled,
  interactionRevisionRef,
  diagnosticsRef,
  opening,
  openingSelected,
  openingElapsedRef,
  openingReactionDelay,
  openingReducedMotion,
  restoring,
  restorationProgressRef,
  emerging = false,
  emergenceProgressRef,
  emergenceOrder = 0,
  emergenceChildCount = 1,
  sphereRef,
  reservoirFrame,
  renderedZoomRef,
  onHoverChange,
}: ArtifactNodeProps) {
  const nodeRef = useRef<THREE.Group | null>(null);
  const visualOrbRef = useRef<THREE.Mesh | null>(null);
  const orbMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const continuationRingRef = useRef<THREE.Mesh | null>(null);
  const continuationRingMaterialRef =
    useRef<THREE.MeshBasicMaterial | null>(null);
  const { beginHover, endHover } = useReservoirNodeHover(
    artifact.id,
    onHoverChange,
  );
  const placement = useMemo(
    () => getReservoirNodePlacement(direction, nodeRadius),
    [direction, nodeRadius],
  );
  const artifactColor = useMemo(
    () => new THREE.Color(artifact.categoryColor ?? RESERVOIR_THEME.inspection),
    [artifact.categoryColor],
  );
  const hoverColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.inspection),
    [],
  );
  const hoverProgress = useRef(!selected && hovered ? 1 : 0);
  const selectionState = useRef(
    createReservoirNodeSelectionState({
      meshEngaged,
      nodeRadius,
      selected,
    }),
  );
  const previousInteractionRevision = useRef(-1);
  const filterRadialOffset = useRef(
    surfaced
      ? 0
      : nodeRadius *
          RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
  );
  const orbSelectedRadialOffset =
    nodeRadius * RESERVOIR_NODE_SELECTED_RADIAL_RATIO;
  const orbShaderUniforms = useRef<ReservoirSelectedSurfaceUniforms>({
    nodeContactDirection: {
      value: placement.normal.clone().negate(),
    },
    nodeSelectedWhite: {
      value: new THREE.Color(RESERVOIR_THEME.inspection),
    },
    nodeSelectedReveal: {
      value: selected && meshEngaged ? 1 : 0,
    },
  });
  const configureOrbMaterial = useCallback(
    (
      shader: Parameters<
        THREE.MeshStandardMaterial["onBeforeCompile"]
      >[0],
    ) => {
      addSelectedNodeSurfaceGradient(shader, orbShaderUniforms.current);
    },
    [],
  );
  const getOrbProgramCacheKey = useCallback(
    () => "reservoir-orb-white-reveal-gradient-v3",
    [],
  );

  useEffect(() => {
    orbShaderUniforms.current.nodeContactDirection.value
      .copy(placement.normal)
      .negate();
  }, [placement]);

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

  useFrame((_, delta) => {
    const visualOrb = visualOrbRef.current;
    const material = orbMaterialRef.current;
    if (!visualOrb || !material || !placement) return;

    const continuationRing = continuationRingRef.current;
    const continuationRingMaterial = continuationRingMaterialRef.current;
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

    const selectionFrame = advanceReservoirNodeSelection(
      selectionState.current,
      {
        continuationCueEnabled,
        delta,
        hovered,
        isDragging,
        meshEngaged,
        nodeRadius,
        reducedMotion: openingReducedMotion,
        selected,
        selectedPressActive,
      },
    );
    const hoverTarget =
      !selectionState.current.releaseDelayActive &&
      !selectionState.current.releaseActive &&
      hovered
        ? 1
        : 0;
    hoverProgress.current = moveToward(
      hoverProgress.current,
      hoverTarget,
      delta / RESERVOIR_NODE_HOVER_TRANSITION_DURATION,
    );
    orbShaderUniforms.current.nodeSelectedReveal.value =
      selectionFrame.selectedReveal;

    const interactionChanged =
      previousInteractionRevision.current !== interactionRevisionRef.current;
    if (interactionChanged) {
      previousInteractionRevision.current = interactionRevisionRef.current;
    }

    let openingReactionProgress = 0;
    if (continuationRing && continuationRingMaterial) {
      const shockwaveActive = opening && (openingSelected || selected);
      const shockwaveProgress = shockwaveActive
        ? openingReactionProgress
        : 0;
      const ringVisible =
        (selectionFrame.ringVisible && !opening && !restoring) ||
        shockwaveActive;
      continuationRing.visible = ringVisible;
      continuationRing.position
        .copy(placement.normal)
        .multiplyScalar(
          shockwaveActive
            ? THREE.MathUtils.lerp(
                selectionFrame.ringRadialOffset,
                selectionFrame.ringRadialOffset +
                  nodeRadius * RESERVOIR_NODE_CONTINUATION_RING_TRAVEL_RATIO,
                shockwaveProgress,
              )
            : selectionFrame.ringRadialOffset,
        );
      continuationRing.scale.setScalar(
        shockwaveActive
          ? THREE.MathUtils.lerp(
              RESERVOIR_NODE_CONTINUATION_RING_START_SCALE,
              RESERVOIR_NODE_CONTINUATION_RING_END_SCALE * 1.18,
              shockwaveProgress,
            )
          : selectionFrame.ringScale,
      );
      continuationRingMaterial.opacity = ringVisible
        ? shockwaveActive
          ? Math.sin(Math.PI * shockwaveProgress) *
            RESERVOIR_NODE_CONTINUATION_RING_MAX_OPACITY
          : selectionFrame.ringOpacity
        : 0;
    }

    let renderedRadialOffset =
      selectionFrame.radialOffset +
      selectionFrame.continuationOffset +
      filterRadialOffset.current;

    if (emerging && emergenceProgressRef) {
      const emergenceProgress = getCollectionChildEmergenceProgress(
        emergenceProgressRef.current,
        emergenceOrder,
        emergenceChildCount,
      );
      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius,
        progress: emergenceProgress,
        restoredOffset: ORB_RESTING_RADIAL_OFFSET,
        selected: false,
      });
      openingReactionProgress = 1 - emergenceProgress;
    }

    if (opening) {
      const startOffset = openingSelected
        ? orbSelectedRadialOffset
        : filterRadialOffset.current;
      const reaction = getReservoirNodeOpeningReaction({
        elapsed: openingElapsedRef.current,
        openingReactionDelay,
        nodeRadius,
        reducedMotion: openingReducedMotion,
        selected: openingSelected,
        startOffset,
      });
      renderedRadialOffset = reaction.radialOffset;
      openingReactionProgress = reaction.progress;
    }

    if (restoring) {
      const restorationProgress = restorationProgressRef.current;
      const restoredOffset = openingSelected
        ? orbSelectedRadialOffset
        : filterTarget;

      renderedRadialOffset = getReservoirNodeRestorationOffset({
        nodeRadius,
        progress: restorationProgress,
        restoredOffset,
        selected: openingSelected,
      });
      openingReactionProgress = 1 - restorationProgress;
    }

    visualOrb.position
      .copy(placement.normal)
      .multiplyScalar(renderedRadialOffset);
    visualOrb.userData.currentRadialOffset = renderedRadialOffset;
    visualOrb.userData.openingReactionProgress = openingReactionProgress;
    visualOrb.userData.filterSurfaced = surfaced;
    const hoverWhiteMix = selected
      ? RESERVOIR_NODE_SELECTED_HOVER_WHITE_MIX
      : RESERVOIR_NODE_HOVER_WHITE_MIX;
    const totalWhiteMix = Math.min(
      hoverProgress.current * hoverWhiteMix +
        selectionFrame.continuationWhiteMix,
      1,
    );
    if (selected && diagnosticsRef.current) {
      diagnosticsRef.current.dataset.continuationCueActive = String(
        selectionFrame.continuationCueActive,
      );
      diagnosticsRef.current.dataset.continuationCueCount = String(
        selectionFrame.continuationCueCount,
      );
      diagnosticsRef.current.dataset.continuationCueOffset =
        selectionFrame.continuationOffset.toFixed(6);
      diagnosticsRef.current.dataset.continuationRingOpacity = (
        continuationRingMaterial?.opacity ?? 0
      ).toFixed(6);
      diagnosticsRef.current.dataset.continuationWhiteMix =
        selectionFrame.continuationWhiteMix.toFixed(6);
      diagnosticsRef.current.dataset.continuationReducedMotion = String(
        openingReducedMotion,
      );
      diagnosticsRef.current.dataset.selectedHoverProgress =
        hoverProgress.current.toFixed(6);
      diagnosticsRef.current.dataset.selectedNodeRadialOffset = (
        renderedRadialOffset
      ).toFixed(6);
      diagnosticsRef.current.dataset.selectedOpeningReactionProgress =
        openingReactionProgress.toFixed(6);
      diagnosticsRef.current.dataset.continuationTraversalAllowed = "true";
    }
    material.color
      .copy(artifactColor)
      .lerp(hoverColor, totalWhiteMix);
    material.emissive
      .copy(artifactColor)
      .lerp(hoverColor, totalWhiteMix);
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
  });

  if (!placement) return null;

  return (
    <group ref={nodeRef} position={placement.position}>
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
      <mesh
        ref={visualOrbRef}
        userData={{ artifactId: artifact.id }}
        renderOrder={RESERVOIR_RENDER_ORDER.artifactNode}
        onPointerEnter={() => surfaced && beginHover("orb")}
        onPointerLeave={() => endHover("orb")}
      >
        <sphereGeometry args={[nodeRadius, 18, 14]} />
        <meshStandardMaterial
          ref={orbMaterialRef}
          color={artifact.categoryColor ?? RESERVOIR_THEME.inspection}
          emissive={artifact.categoryColor ?? RESERVOIR_THEME.inspection}
          emissiveIntensity={RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY}
          roughness={0.82}
          onBeforeCompile={configureOrbMaterial}
          customProgramCacheKey={getOrbProgramCacheKey}
        />
      </mesh>
      <mesh
        userData={{ artifactId: artifact.id }}
        onPointerEnter={() => surfaced && beginHover("orb-hit-area")}
        onPointerLeave={() => endHover("orb-hit-area")}
      >
        <sphereGeometry args={[nodeRadius * 2.15, 12, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
      <ArtifactLabel
        artifact={artifact}
        nodeRef={nodeRef}
        sphereRef={sphereRef}
        reservoirFrame={reservoirFrame}
        renderedZoomRef={renderedZoomRef}
        diagnosticsRef={diagnosticsRef}
        selectionActive={selectionActive || !surfaced}
        hovered={hovered}
        nodeRadius={nodeRadius}
        onPointerEnter={() => surfaced && beginHover("label")}
        onPointerLeave={() => endHover("label")}
      />
    </group>
  );
}
