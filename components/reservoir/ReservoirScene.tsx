"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ReactNode,
  MutableRefObject,
  PointerEvent,
  WheelEvent,
} from "react";
import * as THREE from "three";
import { ROOT_COLLECTION_ID } from "@/content/digital-reservoir/collections";
import {
  getReservoirContentNodes,
  getReservoirContentNodeBySemanticId,
  getReservoirContentNodesBySemanticIds,
  getReservoirNodeSizingFamily,
  isReservoirInspectableResourceNode,
  type ReservoirContentNode,
} from "@/lib/content/reservoir-adapter";
import {
  getArtifactById,
  getCollectionById,
  getResourceByAddress,
  getResourceById,
} from "@/lib/content/selectors";
import {
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  generateReservoirInitialComposition,
  generateReservoirLayout,
  getReservoirDirectionAngularDistance,
  getReservoirFocusedCapRadius,
  getReservoirLayoutSphericalCentroid,
  getReservoirLayoutDiagnostics,
  isReservoirDirectionWithinAngularTolerance,
  RESERVOIR_FOCUSED_LAYOUT_CENTROID_TOLERANCE_DEGREES,
} from "@/lib/reservoir/layout";
import type {
  ReservoirInitialComposition,
  ReservoirLayoutMode,
  ReservoirLayout,
  ReservoirDirection,
} from "@/lib/reservoir/layout";
import {
  getReservoirNodeSizingSnapshot,
  getReservoirNodeSizingTargets,
  RESERVOIR_NODE_SIZING_REFERENCE_POPULATION,
} from "@/lib/reservoir/node-sizing";
import {
  RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY,
  resolveReservoirNodePointerCandidate,
  type ReservoirNodePointerVisibilityResolver,
  type ReservoirPointerCandidate,
  type ReservoirPointerCandidateSource,
  type ReservoirPointerResolution,
} from "@/lib/reservoir/pointer";
import { RESERVOIR_LABEL_LEVEL } from "@/lib/reservoir/label";
import {
  getCollectionReconstitutionDuration,
  getCollectionReconstitutionFrame,
} from "@/lib/reservoir/collection-entry";
import type { CollectionReconstitutionPhase } from "@/lib/reservoir/collection-entry";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import { getOpeningDuration } from "@/lib/reservoir/opening";
import {
  clampReservoirZoom,
  getReservoirFrame,
  getReservoirWorldTransform,
  RESERVOIR_ZOOM_DEFAULT,
  RESERVOIR_ZOOM_MAX,
  RESERVOIR_ZOOM_MIN,
} from "@/lib/reservoir/frame";
import {
  getReservoirAdaptiveZoom,
  RESERVOIR_NODE_INSPECTABLE_TARGET_PX,
  RESERVOIR_ZOOM_BASELINE_MAX,
  RESERVOIR_ZOOM_EXTENDED_HARD_MAX,
  type ReservoirAdaptiveZoom,
} from "@/lib/reservoir/zoom";
import {
  getInspectionWindowRetractDuration,
  getReservoirRestoreDuration,
  getReservoirRestoreProgress,
} from "@/lib/reservoir/reading";
import {
  canRequestInspectionSupportNavigation,
  type InspectionWindowPhase,
} from "@/lib/reservoir/inspection-support";
import { getReservoirResourceSelectionAction } from "@/lib/reservoir/resource-selection";
import { canInspectResource } from "@/lib/reservoir/inspection";
import type {
  ActiveExploreFilter,
  DirectArtifactId,
} from "@/types/reservoir";
import type { ReservoirContext } from "@/types/reservoir";
import type { Collection } from "@/types/content";
import { AtmosphereContent } from "./AtmosphereContent";
import { InspectionWindow } from "./InspectionWindow";
import { ReservoirLayoutModeSwitch } from "../navigation/ReservoirLayoutModeSwitch";
import { ReservoirSphere } from "./ReservoirSphere";
import { CollectionNavigation } from "../navigation/CollectionNavigation";
import {
  ReservoirMenu,
  type ReservoirMenuState,
} from "../navigation/ReservoirMenu";
import {
  ReservoirFooter,
  type ReservoirFooterState,
} from "../navigation/ReservoirFooter";

const CAMERA_FOV = 34;
const CAMERA_NEAR = 0.08;
const CAMERA_DISTANCE = 10;
const RESERVOIR_ZOOM_DAMPING = 10;
const RESERVOIR_WHEEL_ZOOM_RATE = 0.0017;
const RESERVOIR_PINCH_ZOOM_RATE = 0.0045;
const MAX_WHEEL_DELTA = 120;
const DRAG_SENSITIVITY = 0.0042;
const NODE_CLICK_MAX_TRAVEL = 6;
const FOOTER_TRIGGER_OVERSCAN = 28;
const LAYOUT_MODE_SWITCH_DURATION = 0.62;

type ReservoirLayoutTransitionState =
  | "idle"
  | "sinking"
  | "orienting"
  | "emerging";

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  maxTravelSquared: number;
  hoverCancelled: boolean;
};
type PickedReservoirNode =
  | { kind: "artifact" | "resource"; id: string }
  | { kind: "collection"; id: string };
type ReservoirTransitionState =
  | "idle"
  | "locatingResource"
  | "reconstitutingCollection"
  | "openingResource"
  | "deployingInspection"
  | "readingInspection"
  | "closingInspection"
  | "restoringInspection";

type QuaternionTuple = [number, number, number, number];

type QueryReconciliation = {
  entering: ReadonlySet<string>;
  leaving: ReadonlySet<string>;
  staying: ReadonlySet<string>;
  target: ReadonlySet<string>;
};

type QueryActivityMode = "success" | "empty";

type ReservoirLayoutPlacementPolicy =
  | "normal"
  | "canonical-focal-single-result";

type QueryPlacementDiagnostics = {
  policy: ReservoirLayoutPlacementPolicy;
  resultCount: number;
  canonicalFocalDirection: ReservoirDirection | null;
  canonicalFocalErrorDegrees: number;
};

const SEMANTIC_EXPLORE_LENSES = new Map<string, readonly ActiveExploreFilter[]>([
  [ROOT_COLLECTION_ID, ["collections", "inquiry"]],
  ["collection-work", ["work", "inquiry"]],
  ["collection-data-analytics", ["work", "inquiry"]],
  ["collection-web", ["work"]],
  ["collection-film-creative", ["world"]],
  ["collection-about-self", ["self", "inquiry"]],
  ["artifact-bellabeat-wellness-analysis", ["work", "inquiry"]],
  ["artifact-resume", ["work", "self"]],
  ["artifact-about", ["self", "inquiry"]],
  ["artifact-reservoir-interface-study", ["work", "inquiry"]],
  ["artifact-kodyepugh-symbol", ["self", "world"]],
]);

const DIRECT_ARTIFACT_TARGETS = new Map<Exclude<DirectArtifactId, "contact">, string>([
  ["about", "artifact-about"],
  ["resume", "artifact-resume"],
]);

type QueryReservoirSelectionSnapshot = {
  hoveredResourceId: string | null;
  selectedResourceId: string | null;
  selectedCollectionId: string | null;
  selectedPressActive: boolean;
};

function getReservoirContextCollectionId(context: ReservoirContext) {
  if (context.kind === "collection") return context.collectionId;
  return getReservoirContextCollectionId(context.returnContext);
}

function getReservoirContextSeed(context: ReservoirContext) {
  return context.kind === "collection"
    ? context.collectionId
    : `query:${context.resultIds.join(",")}|return=${getReservoirContextKey(context.returnContext)}`;
}

function getReservoirContextKey(context: ReservoirContext): string {
  if (context.kind === "collection") {
    return `collection:${context.collectionId}`;
  }

  return `query:${context.resultIds.join(",")}|return=${getReservoirContextKey(context.returnContext)}`;
}

function getReservoirContextNodes(context: ReservoirContext) {
  return context.kind === "collection"
    ? getReservoirContentNodes(context.collectionId)
    : getReservoirContentNodesBySemanticIds(context.resultIds);
}

function getReservoirLayoutPlacementPolicy(
  context: ReservoirContext,
): ReservoirLayoutPlacementPolicy {
  return context.kind === "query" && context.resultIds.length === 1
    ? "canonical-focal-single-result"
    : "normal";
}

function canNavigateBackFromQueryContext(
  context: Extract<ReservoirContext, { kind: "query" }>,
) {
  if (context.returnContext.kind === "query") return true;
  return context.returnContext.collectionId !== ROOT_COLLECTION_ID;
}

function getExploreNodeIds(
  nodes: readonly ReservoirContentNode[],
  filter: ActiveExploreFilter,
) {
  return new Set(
    nodes
      .filter((node) => {
        if (filter === "all") return true;
        if (filter === "collections") return node.kind === "collection";
        return SEMANTIC_EXPLORE_LENSES.get(node.id)?.includes(filter) ?? false;
      })
      .map((node) => node.id),
  );
}

function getReservoirNodeDiagnostics(nodes: readonly ReservoirContentNode[]) {
  const seen = new Set<string>();
  const duplicateNodeIds = new Set<string>();
  const collectionIds: string[] = [];

  for (const node of nodes) {
    if (seen.has(node.id)) {
      duplicateNodeIds.add(node.id);
    }
    seen.add(node.id);
    if (node.kind === "collection") collectionIds.push(node.id);
  }

  return {
    nodeCount: nodes.length,
    nodeIds: nodes.map((node) => node.id),
    collectionCount: collectionIds.length,
    collectionIds,
    duplicateNodeIds: [...duplicateNodeIds].sort((a, b) =>
      a.localeCompare(b),
    ),
  };
}

function getReservoirNodeDiameters(
  nodes: readonly ReservoirContentNode[],
  artifactDiameter: number,
  collectionDiameter: number,
) {
  const diameters = new Map<string, number>();
  for (const node of nodes) {
    diameters.set(
      node.id,
      getReservoirNodeSizingFamily(node) === "inspectable-resource"
        ? artifactDiameter
        : collectionDiameter,
    );
  }
  return diameters;
}

type PreservedReservoirState = {
  resourceId: string;
  sphereQuaternion: QuaternionTuple;
  zoomLevel: number;
};

type CollectionHistoryFrame = {
  collectionId: string;
};

type CollectionNavigationState = {
  activeCollectionId: string;
  destinationCollectionId: string | null;
  transitionPhase: CollectionReconstitutionPhase;
};

type PendingCollectionResolution = {
  history: CollectionHistoryFrame[];
  spatialSelectionId: string | null;
};

type CollectionTransitionPoseSnapshot = {
  sphereQuaternion: QuaternionTuple;
  zoomLevel: number;
};

type RotationDiagnostics = {
  euler: [number, number, number];
  quaternion: [number, number, number, number];
};

type ReservoirLayoutState = {
  contextKey: string;
  mode: ReservoirLayoutMode;
  directions: ReservoirLayout;
  nodeSizing: ReturnType<typeof getReservoirNodeSizingSnapshot>;
  focusedDirection: ReservoirDirection | null;
  placementPolicy: ReservoirLayoutPlacementPolicy;
  queryPlacementDiagnostics: QueryPlacementDiagnostics | null;
};

type ReservoirTransitionPlan = {
  kind: "layout-mode" | "collection" | "query";
  source: ReservoirLayoutState;
  destination: ReservoirLayoutState;
};

type ReservoirLayoutOwnership = {
  activeLayout: ReservoirLayoutState;
  transitionPlan: ReservoirTransitionPlan | null;
};

type LayoutModeFocalDiagnostics = {
  reservoirWorldPosition: ReservoirDirection;
  reservoirWorldQuaternion: [number, number, number, number];
  frontWorld: ReservoirDirection;
  upTangentWorld: ReservoirDirection;
  targetWorld: ReservoirDirection;
  targetLocal: ReservoirDirection;
  frontLocal: ReservoirDirection;
  upTangentLocal: ReservoirDirection;
  roundTripWorld: ReservoirDirection;
  roundTripAngleDegrees: number;
  roundTripFrontDot: number;
  roundTripUpDot: number;
  focusedLayoutCentroidLocal: ReservoirDirection | null;
  focusedLayoutCentroidWorld: ReservoirDirection | null;
  focusedLayoutCentroidErrorDegrees: number;
  focusedLayoutCentroidWorldErrorDegrees: number;
  focusedLayoutCentroidFrontAngleDegrees: number;
  focusedLayoutCentroidFrontDot: number;
  focusedLayoutCentroidUpDot: number;
  focusedLayoutCentroidAssertionsPassed: boolean;
  assertionsPassed: boolean;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function getRotationDiagnostics(
  quaternion: THREE.Quaternion,
): RotationDiagnostics {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");

  return {
    euler: [euler.x, euler.y, euler.z],
    quaternion: quaternion.toArray(),
  };
}

function getLayoutModeSwitchDuration(reducedMotion: boolean) {
  return reducedMotion ? 0.16 : LAYOUT_MODE_SWITCH_DURATION;
}

function getLayoutModeTransitionPulse(
  transitionState: ReservoirLayoutTransitionState,
  progress: number,
  reducedMotion: boolean,
) {
  const peakPulse = reducedMotion ? 0.56 : 1;
  const easedProgress = smoothstep(clamp(progress, 0, 1));

  if (transitionState === "idle") return 0;
  if (transitionState === "sinking") return peakPulse * easedProgress;
  if (transitionState === "orienting") return peakPulse;
  if (transitionState === "emerging") {
    return peakPulse * (1 - easedProgress);
  }

  return 0;
}

function toQuaternionTuple(quaternion: THREE.Quaternion): QuaternionTuple {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

function toDirectionTuple(direction: THREE.Vector3): ReservoirDirection {
  return [direction.x, direction.y, direction.z];
}

function formatDirectionTuple(direction: ReservoirDirection, precision = 6) {
  return direction.map((value) => value.toFixed(precision)).join(",");
}

function recordReservoirPointerDiagnostics(
  element: HTMLDivElement | null,
  resolution: ReservoirPointerResolution,
) {
  if (!element) return;

  element.dataset.pointerCandidateNodeId = resolution.candidate?.id ?? "";
  element.dataset.pointerCandidateSource = resolution.candidate?.source ?? "";
  element.dataset.pointerCandidateDistance =
    resolution.candidate?.distance.toFixed(9) ?? "";
  element.dataset.pointerReservoirSurfaceDistance =
    resolution.surfaceDistance?.toFixed(9) ?? "";
  element.dataset.pointerReservoirSurfaceHit = String(
    resolution.surfaceDistance !== null,
  );
  element.dataset.pointerCandidateOccluded = String(
    resolution.candidateOccluded,
  );
  element.dataset.pointerCandidateAccepted = String(resolution.accepted);
  element.dataset.pointerDistanceTolerance = resolution.tolerance.toFixed(9);
}

function getRuntimeFocalDiagnostics(
  surface: THREE.Object3D,
  camera: THREE.Camera,
): LayoutModeFocalDiagnostics {
  surface.updateWorldMatrix(true, false);
  camera.updateWorldMatrix(true, false);

  const reservoirWorldPosition = surface.getWorldPosition(
    new THREE.Vector3(),
  );
  const reservoirWorldQuaternion = surface.getWorldQuaternion(
    new THREE.Quaternion(),
  );
  const cameraWorldPosition = camera.getWorldPosition(new THREE.Vector3());
  const cameraWorldQuaternion = camera.getWorldQuaternion(
    new THREE.Quaternion(),
  );
  const frontWorld = cameraWorldPosition
    .sub(reservoirWorldPosition)
    .normalize();
  const cameraUpWorld = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(cameraWorldQuaternion)
    .normalize();
  const upTangentWorld = cameraUpWorld
    .addScaledVector(frontWorld, -cameraUpWorld.dot(frontWorld))
    .normalize();
  const targetWorld = frontWorld
    .clone()
    .multiplyScalar(Math.cos(Math.PI / 12))
    .add(
      upTangentWorld
        .clone()
        .multiplyScalar(Math.sin(Math.PI / 12)),
    )
    .normalize();
  const inverseReservoirWorldQuaternion = reservoirWorldQuaternion
    .clone()
    .invert();
  const targetLocal = targetWorld
    .clone()
    .applyQuaternion(inverseReservoirWorldQuaternion)
    .normalize();
  const frontLocal = frontWorld
    .clone()
    .applyQuaternion(inverseReservoirWorldQuaternion)
    .normalize();
  const upTangentLocal = upTangentWorld
    .clone()
    .applyQuaternion(inverseReservoirWorldQuaternion)
    .normalize();
  const roundTripWorld = targetLocal
    .clone()
    .applyQuaternion(reservoirWorldQuaternion)
    .normalize();
  const roundTripAngleDegrees = THREE.MathUtils.radToDeg(
    roundTripWorld.angleTo(frontWorld),
  );
  const roundTripFrontDot = roundTripWorld.dot(frontWorld);
  const roundTripUpDot = roundTripWorld.dot(upTangentWorld);

  return {
    reservoirWorldPosition: reservoirWorldPosition.toArray() as [
      number,
      number,
      number,
    ],
    reservoirWorldQuaternion: reservoirWorldQuaternion.toArray() as [
      number,
      number,
      number,
      number,
    ],
    frontWorld: toDirectionTuple(frontWorld),
    upTangentWorld: toDirectionTuple(upTangentWorld),
    targetWorld: toDirectionTuple(targetWorld),
    targetLocal: toDirectionTuple(targetLocal),
    frontLocal: toDirectionTuple(frontLocal),
    upTangentLocal: toDirectionTuple(upTangentLocal),
    roundTripWorld: toDirectionTuple(roundTripWorld),
    roundTripAngleDegrees,
    roundTripFrontDot,
    roundTripUpDot,
    focusedLayoutCentroidLocal: null,
    focusedLayoutCentroidWorld: null,
    focusedLayoutCentroidErrorDegrees: 0,
    focusedLayoutCentroidWorldErrorDegrees: 0,
    focusedLayoutCentroidFrontAngleDegrees: 0,
    focusedLayoutCentroidFrontDot: 0,
    focusedLayoutCentroidUpDot: 0,
    focusedLayoutCentroidAssertionsPassed: true,
    assertionsPassed:
      Math.abs(roundTripAngleDegrees - 15) < 0.05 &&
      roundTripFrontDot > 0 &&
      roundTripUpDot > 0,
  };
}

function addFocusedLayoutFocalDiagnostics(
  focalDiagnostics: LayoutModeFocalDiagnostics,
  layout: ReservoirLayout,
): LayoutModeFocalDiagnostics {
  const focusedLayoutCentroidLocal = getReservoirLayoutSphericalCentroid(
    layout,
  );
  if (!focusedLayoutCentroidLocal) {
    return {
      ...focalDiagnostics,
      focusedLayoutCentroidLocal: null,
      focusedLayoutCentroidWorld: null,
      focusedLayoutCentroidErrorDegrees: 0,
      focusedLayoutCentroidWorldErrorDegrees: 0,
      focusedLayoutCentroidFrontAngleDegrees: 0,
      focusedLayoutCentroidFrontDot: 0,
      focusedLayoutCentroidUpDot: 0,
      focusedLayoutCentroidAssertionsPassed: true,
    };
  }

  const reservoirWorldQuaternion = new THREE.Quaternion().fromArray(
    focalDiagnostics.reservoirWorldQuaternion,
  );
  const focusedLayoutCentroidWorld = toDirectionTuple(
    new THREE.Vector3(...focusedLayoutCentroidLocal)
      .applyQuaternion(reservoirWorldQuaternion)
      .normalize(),
  );
  const focusedLayoutCentroidErrorDegrees = THREE.MathUtils.radToDeg(
    getReservoirDirectionAngularDistance(
      focusedLayoutCentroidLocal,
      focalDiagnostics.targetLocal,
    ),
  );
  const focusedLayoutCentroidWorldErrorDegrees = THREE.MathUtils.radToDeg(
    getReservoirDirectionAngularDistance(
      focusedLayoutCentroidWorld,
      focalDiagnostics.targetWorld,
    ),
  );
  const focusedLayoutCentroidFrontAngleDegrees = THREE.MathUtils.radToDeg(
    getReservoirDirectionAngularDistance(
      focusedLayoutCentroidWorld,
      focalDiagnostics.frontWorld,
    ),
  );
  const focusedLayoutCentroidFrontDot = focusedLayoutCentroidWorld.reduce(
    (sum, value, index) => sum + value * focalDiagnostics.frontWorld[index],
    0,
  );
  const focusedLayoutCentroidUpDot = focusedLayoutCentroidWorld.reduce(
    (sum, value, index) =>
      sum + value * focalDiagnostics.upTangentWorld[index],
    0,
  );
  const focusedLayoutCentroidAssertionsPassed =
    isReservoirDirectionWithinAngularTolerance(
      focusedLayoutCentroidLocal,
      focalDiagnostics.targetLocal,
      RESERVOIR_FOCUSED_LAYOUT_CENTROID_TOLERANCE_DEGREES,
    ) &&
    isReservoirDirectionWithinAngularTolerance(
      focusedLayoutCentroidWorld,
      focalDiagnostics.targetWorld,
      RESERVOIR_FOCUSED_LAYOUT_CENTROID_TOLERANCE_DEGREES,
    ) &&
    Math.abs(focusedLayoutCentroidFrontAngleDegrees - 15) < 0.05 &&
    focusedLayoutCentroidFrontDot > 0 &&
    focusedLayoutCentroidUpDot > 0;

  return {
    ...focalDiagnostics,
    focusedLayoutCentroidLocal,
    focusedLayoutCentroidWorld,
    focusedLayoutCentroidErrorDegrees,
    focusedLayoutCentroidWorldErrorDegrees,
    focusedLayoutCentroidFrontAngleDegrees,
    focusedLayoutCentroidFrontDot,
    focusedLayoutCentroidUpDot,
    focusedLayoutCentroidAssertionsPassed,
    assertionsPassed:
      focalDiagnostics.assertionsPassed && focusedLayoutCentroidAssertionsPassed,
  };
}

type PreparedReservoirLayoutState = {
  layoutState: ReservoirLayoutState;
  nodes: readonly ReservoirContentNode[];
  focalDiagnostics: LayoutModeFocalDiagnostics | null;
  queryPlacementDiagnostics: QueryPlacementDiagnostics | null;
};

function prepareReservoirLayoutState({
  context,
  mode,
  surface,
  camera,
}: {
  context: ReservoirContext;
  mode: ReservoirLayoutMode;
  surface: THREE.Object3D | null;
  camera: THREE.Camera | null;
}): PreparedReservoirLayoutState | null {
  const nodes = getReservoirContextNodes(context);
  const nodeSizingTargets = getReservoirNodeSizingTargets(nodes.length);
  const placementPolicy = getReservoirLayoutPlacementPolicy(context);
  const nodeDiameters = getReservoirNodeDiameters(
    nodes,
    nodeSizingTargets.desiredArtifactDiameter,
    nodeSizingTargets.desiredCollectionDiameter,
  );

  let focusedDirection: ReservoirDirection | null = null;
  let focalDiagnostics: LayoutModeFocalDiagnostics | null = null;
  let queryPlacementDiagnostics: QueryPlacementDiagnostics | null = null;
  const canonicalSingleResultPlacement =
    context.kind === "query" &&
    context.resultIds.length === 1 &&
    placementPolicy === "canonical-focal-single-result";
  if (mode === "focused" || canonicalSingleResultPlacement) {
    if (!surface || !camera) return null;
    focalDiagnostics = getRuntimeFocalDiagnostics(surface, camera);
    focusedDirection =
      mode === "focused" ? focalDiagnostics.targetLocal : null;
    if (canonicalSingleResultPlacement) {
      queryPlacementDiagnostics = {
        policy: placementPolicy,
        resultCount: nodes.length,
        canonicalFocalDirection: focalDiagnostics.targetLocal,
        canonicalFocalErrorDegrees: 0,
      };
    }
  }

  const directions = generateReservoirLayout(nodes, {
    seed: getReservoirContextSeed(context),
    mode:
      canonicalSingleResultPlacement || mode === "focused"
        ? "focused"
        : mode,
    focusedDirection: canonicalSingleResultPlacement
      ? focalDiagnostics?.targetLocal ?? undefined
      : mode === "focused"
        ? focusedDirection ?? undefined
        : undefined,
    minimumNodeDiameter:
      mode === "focused"
        ? Math.max(
            nodeSizingTargets.desiredArtifactDiameter,
            nodeSizingTargets.desiredCollectionDiameter,
          )
        : undefined,
    nodeDiameters: mode === "focused" ? nodeDiameters : undefined,
  });
  if (focalDiagnostics) {
    focalDiagnostics = addFocusedLayoutFocalDiagnostics(
      focalDiagnostics,
      directions,
    );
    if (queryPlacementDiagnostics) {
      const firstDirection = directions.values().next().value as
        | ReservoirDirection
        | undefined;
      queryPlacementDiagnostics = {
        ...queryPlacementDiagnostics,
        canonicalFocalErrorDegrees: firstDirection
          ? THREE.MathUtils.radToDeg(
              getReservoirDirectionAngularDistance(
                firstDirection,
                queryPlacementDiagnostics.canonicalFocalDirection ?? [
                  0, 1, 0,
                ],
              ),
            )
          : 0,
      };
    }
  }

  return {
    layoutState: {
      contextKey: getReservoirContextKey(context),
      mode,
      directions,
      nodeSizing: getReservoirNodeSizingSnapshot(
        directions,
        nodes.length,
        nodeDiameters,
      ),
      focusedDirection,
      placementPolicy,
      queryPlacementDiagnostics,
    },
    nodes,
    focalDiagnostics,
    queryPlacementDiagnostics,
  };
}

function captureReservoirLayoutState(
  layoutState: ReservoirLayoutState,
): ReservoirLayoutState {
  return {
    ...layoutState,
    directions: new Map(layoutState.directions),
  };
}

type ReservoirTransformProps = {
  baseScale: number;
  centerWorldY: number;
  children: ReactNode;
  diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  transformRef: MutableRefObject<THREE.Group | null>;
  zoomLevel: number;
  renderedZoomRef: MutableRefObject<number>;
  renderedScaleRef: MutableRefObject<number>;
};

function ReservoirTransform({
  baseScale,
  centerWorldY,
  children,
  diagnosticsRef,
  reducedMotion,
  transformRef,
  zoomLevel,
  renderedZoomRef,
  renderedScaleRef,
}: ReservoirTransformProps) {
  useLayoutEffect(() => {
    const transform = transformRef.current;
    if (!transform) return;
    const renderedScale = baseScale * renderedZoomRef.current;
    renderedScaleRef.current = renderedScale;
    transform.position.set(0, centerWorldY, 0);
    transform.scale.setScalar(renderedScale);
    transform.updateMatrixWorld();
  }, [baseScale, centerWorldY, renderedScaleRef, renderedZoomRef, transformRef]);

  useFrame((_, delta) => {
    const transform = transformRef.current;
    if (!transform) return;

    const interpolation = reducedMotion
      ? 1
      : 1 - Math.exp(-RESERVOIR_ZOOM_DAMPING * delta);
    renderedZoomRef.current = THREE.MathUtils.lerp(
      renderedZoomRef.current,
      zoomLevel,
      interpolation,
    );
    if (Math.abs(renderedZoomRef.current - zoomLevel) < 0.0001) {
      renderedZoomRef.current = zoomLevel;
    }

    const renderedScale = baseScale * renderedZoomRef.current;
    renderedScaleRef.current = renderedScale;
    transform.position.set(0, centerWorldY, 0);
    transform.scale.setScalar(renderedScale);
    transform.updateMatrixWorld();

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.renderedZoomLevel =
        renderedZoomRef.current.toFixed(6);
      diagnosticsRef.current.dataset.renderedReservoirScale =
        renderedScale.toFixed(6);
    }
  });

  return <group ref={transformRef}>{children}</group>;
}

function ReservoirCameraBridge({
  cameraRef,
  sceneRef,
  onReady,
}: {
  cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  sceneRef: MutableRefObject<THREE.Scene | null>;
  onReady: () => void;
}) {
  const { camera, scene } = useThree();

  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
    sceneRef.current = scene;
    onReady();
  }, [camera, cameraRef, onReady, scene, sceneRef]);

  return null;
}

type ReservoirOrientationProps = {
  children: ReactNode;
  composition: ReservoirInitialComposition;
  diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
  layoutMode: ReservoirLayoutMode;
  layoutModeTransitionState: ReservoirLayoutTransitionState;
  onOrientationApplied: (diagnostics: RotationDiagnostics) => void;
  rotationRef: MutableRefObject<THREE.Group | null>;
};

function ReservoirOrientation({
  children,
  composition,
  diagnosticsRef,
  layoutMode,
  layoutModeTransitionState,
  onOrientationApplied,
  rotationRef,
}: ReservoirOrientationProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const initialOrientationAppliedRef = useRef(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    if (
      initialOrientationAppliedRef.current ||
      layoutModeTransitionState !== "idle" ||
      layoutMode === "focused"
    ) {
      rotationRef.current = group;
      return;
    }

    group.quaternion.set(...composition.quaternion).normalize();
    group.updateMatrixWorld();
    rotationRef.current = group;
    initialOrientationAppliedRef.current = true;
    const diagnostics = getRotationDiagnostics(group.quaternion);
    onOrientationApplied(diagnostics);

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.initialOrientationLayoutMode =
        layoutMode;
      diagnosticsRef.current.dataset.initialOrientationSource = "generated";
      diagnosticsRef.current.dataset.initialOrientationQuaternion =
        composition.quaternion
          .map((value) => value.toFixed(6))
          .join(",");
      diagnosticsRef.current.dataset.initialOrientationCandidateCount = String(
        composition.candidateCount,
      );
      diagnosticsRef.current.dataset.initialOrientationVisibleNodeCount = String(
        composition.visibleNodeCount,
      );
      diagnosticsRef.current.dataset.initialOrientationTargetVisibleNodeCount =
        String(composition.targetVisibleNodeCount);
      diagnosticsRef.current.dataset.initialOrientationSilhouetteNodeCount =
        String(composition.silhouetteNodeCount);
      diagnosticsRef.current.dataset.initialOrientationProjectedMinimumSeparation =
        composition.projectedMinimumSeparation.toFixed(6);
      diagnosticsRef.current.dataset.renderedRotation =
        `${diagnostics.euler[0].toFixed(3)},` +
        diagnostics.euler[1].toFixed(3);
      diagnosticsRef.current.dataset.renderedQuaternion = diagnostics.quaternion
        .map((value) => value.toFixed(6))
        .join(",");
    }
  }, [
    composition,
    diagnosticsRef,
    layoutMode,
    layoutModeTransitionState,
    onOrientationApplied,
    rotationRef,
  ]);

  return (
    <group
      ref={(group) => {
        groupRef.current = group;
        rotationRef.current = group;
      }}
    >
      {children}
    </group>
  );
}

export function ReservoirScene() {
  const [rotationDiagnostics, setRotationDiagnostics] =
    useState<RotationDiagnostics>({
      euler: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
    });
  const [zoomLevel, setZoomLevel] = useState(RESERVOIR_ZOOM_DEFAULT);
  const [viewportFrame, setViewportFrame] = useState({
    width: 1600,
    height: 1000,
    controlPlaneHeight: 120,
  });
  const [, setCameraRevision] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeExploreFilter, setActiveExploreFilter] =
    useState<ActiveExploreFilter>("all");
  const [menuState, setMenuState] =
    useState<ReservoirMenuState>("closed");
  const [footerState, setFooterState] =
    useState<ReservoirFooterState>("closed");
  const [queryActivityRevision, setQueryActivityRevision] = useState<
    number | null
  >(null);
  const [queryActivityMode, setQueryActivityMode] =
    useState<QueryActivityMode | null>(null);
  const [rejectedExploreFilter, setRejectedExploreFilter] =
    useState<ActiveExploreFilter | null>(null);
  const [layoutMode, setLayoutMode] =
    useState<ReservoirLayoutMode>("distributed");
  const [renderedLayoutMode, setRenderedLayoutMode] =
    useState<ReservoirLayoutMode>("distributed");
  const [layoutModeTransitionState, setLayoutModeTransitionState] =
    useState<ReservoirLayoutTransitionState>("idle");
  const [layoutModeFocalDiagnostics, setLayoutModeFocalDiagnostics] =
    useState<LayoutModeFocalDiagnostics | null>(null);
  const [layoutOwnership, setLayoutOwnership] =
    useState<ReservoirLayoutOwnership>(() => {
      const initialContext: ReservoirContext = {
        kind: "collection",
        collectionId: ROOT_COLLECTION_ID,
      };
      const preparedLayout = prepareReservoirLayoutState({
        context: initialContext,
        mode: "distributed",
        surface: null,
        camera: null,
      });
      if (!preparedLayout) {
        throw new Error("Unable to prepare the initial reservoir layout.");
      }

      return {
        activeLayout: preparedLayout.layoutState,
        transitionPlan: null,
      };
    });
  const [queryVisibleNodeIds, setQueryVisibleNodeIds] = useState<
    ReadonlySet<string>
  >(
    () =>
      new Set(
        getReservoirContentNodes(ROOT_COLLECTION_ID).map((node) => node.id),
      ),
  );
  const [queryReconciliation, setQueryReconciliation] =
    useState<QueryReconciliation | null>(null);
  const queryReconciliationRef = useRef<QueryReconciliation | null>(null);
  const [queryReservoirContext, setQueryReservoirContext] =
    useState<ReservoirContext | null>(null);
  const [queryReservoirTransitionContext, setQueryReservoirTransitionContext] =
    useState<ReservoirContext | null>(null);
  const [queryReservoirTransitionPhase, setQueryReservoirTransitionPhase] =
    useState<CollectionReconstitutionPhase>("idle");
  const [locatingResourceId, setLocatingResourceId] = useState<string | null>(
    null,
  );
  const [selectedPressActive, setSelectedPressActive] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [collectionNavigation, setCollectionNavigation] =
    useState<CollectionNavigationState>({
      activeCollectionId: ROOT_COLLECTION_ID,
      destinationCollectionId: null,
      transitionPhase: "idle",
    });
  const [collectionHistory, setCollectionHistory] = useState<
    CollectionHistoryFrame[]
  >([{ collectionId: ROOT_COLLECTION_ID }]);
  const [selectedSpatialDestinationId, setSelectedSpatialDestinationId] =
    useState<string | null>(null);
  const [collectionActivityRevision, setCollectionActivityRevision] =
    useState<number | null>(null);
  const [hoveredResourceId, setHoveredResourceId] = useState<string | null>(
    null,
  );
  const [transitionState, setTransitionState] =
    useState<ReservoirTransitionState>("idle");
  const [inspectedResourceId, setInspectedResourceId] = useState<string | null>(
    null,
  );
  const [preservedReservoirState, setPreservedReservoirState] =
    useState<PreservedReservoirState | null>(null);
  const [inspectionFooterReached, setInspectionFooterReached] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [atmosphereBottom, setAtmosphereBottom] = useState(0);
  const interaction = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLElement | null>(null);
  const drag = useRef<DragState | null>(null);
  const queryRevisionRef = useRef(0);
  const activeExploreFilterRef = useRef(activeExploreFilter);
  const hoveredResourceIdRef = useRef(hoveredResourceId);
  const selectedResourceIdRef = useRef(selectedResourceId);
  const selectedCollectionIdRef = useRef(selectedCollectionId);
  const selectedPressActiveRef = useRef(selectedPressActive);
  const layoutModeTransitionProgressRef = useRef(0);
  const layoutModeTransitionElapsedRef = useRef(0);
  const layoutModeViewResetProgressRef = useRef(0);
  const layoutModeTransitionPulseRef = useRef(0);
  const layoutModeResetStartZoomRef = useRef(RESERVOIR_ZOOM_DEFAULT);
  const layoutModeResetTargetZoomRef = useRef(RESERVOIR_ZOOM_DEFAULT);
  const queryReservoirTransitionProgressRef = useRef(0);
  const queryReservoirTransitionPhaseRef =
    useRef<CollectionReconstitutionPhase>("idle");
  const reservoirExploreFilterByContextKeyRef = useRef(
    new Map<string, ActiveExploreFilter>(),
  );
  const queryReservoirSnapshotByContextKeyRef = useRef(
    new Map<string, QueryReservoirSelectionSnapshot>(),
  );
  const restoreReservoirFilterForContext = useCallback(
    (context: ReservoirContext) => {
      const contextKey = getReservoirContextKey(context);
      const restoredFilter =
        reservoirExploreFilterByContextKeyRef.current.get(contextKey) ?? "all";
      reservoirExploreFilterByContextKeyRef.current.set(
        contextKey,
        restoredFilter,
      );
      setActiveExploreFilter(restoredFilter);
      setQueryVisibleNodeIds(
        getExploreNodeIds(getReservoirContextNodes(context), restoredFilter),
      );
      return restoredFilter;
    },
    [],
  );
  const reservoirTransformRef = useRef<THREE.Group | null>(null);
  const sphereRotationRef = useRef<THREE.Group | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const activeTouchPointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  );
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchActiveRef = useRef(false);
  const zoomLevelRef = useRef(RESERVOIR_ZOOM_DEFAULT);
  const renderedZoomRef = useRef(RESERVOIR_ZOOM_DEFAULT);
  const zoomMaximumRef = useRef(RESERVOIR_ZOOM_MAX);
  const renderedScaleRef = useRef(1);
  const interactionRevisionRef = useRef(0);
  const openingElapsedRef = useRef(0);
  const collectionReconstitutionProgressRef = useRef(0);
  const collectionEmergenceProgressRef = useRef(1);
  const pendingCollectionResolutionRef =
    useRef<PendingCollectionResolution | null>(null);
  const collectionTransitionPoseSnapshotRef =
    useRef<CollectionTransitionPoseSnapshot | null>(null);
  const restorationElapsedRef = useRef(0);
  const restorationProgressRef = useRef(0);
  const inspectionRecoveryStartTimeRef = useRef<number | null>(null);
  const inspectionRecoveryHandoffCommittedRef = useRef(false);
  const pendingInspectionNavigationTargetRef = useRef<string | null>(null);
  const requestDirectResourceRef = useRef<
    (resourceAddress: string) => boolean
  >(() => false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const surfaceRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerVisibilityRaycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const cameraWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const cameraUp = useMemo(() => new THREE.Vector3(), []);
  const horizontalDragQuaternion = useMemo(
    () => new THREE.Quaternion(),
    [],
  );
  const verticalDragQuaternion = useMemo(
    () => new THREE.Quaternion(),
    [],
  );
  const dragDeltaQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const handleCameraReady = useCallback(() => {
    setCameraRevision((revision) => revision + 1);
  }, []);
  const resolvePointerVisibility = useCallback<
    ReservoirNodePointerVisibilityResolver
  >(
    ({ ray, ...candidate }) => {
      const surface = surfaceRef.current;
      if (!surface) return false;

      surface.updateWorldMatrix(true, false);
      pointerVisibilityRaycaster.ray.copy(ray);
      pointerVisibilityRaycaster.near = 0;
      pointerVisibilityRaycaster.far = Number.POSITIVE_INFINITY;
      const surfaceDistance =
        pointerVisibilityRaycaster.intersectObject(surface, false)[0]
          ?.distance ?? null;
      const resolution = resolveReservoirNodePointerCandidate({
        candidates: [candidate],
        surfaceDistance,
      });
      recordReservoirPointerDiagnostics(interaction.current, resolution);
      return resolution.accepted;
    },
    [pointerVisibilityRaycaster],
  );

  function beginReservoirTransitionPlan(plan: ReservoirTransitionPlan) {
    if (layoutOwnership.transitionPlan) return false;

    const nextOwnership = {
      ...layoutOwnership,
      transitionPlan: plan,
    };
    setLayoutOwnership(nextOwnership);
    return true;
  }

  const promoteReservoirTransitionDestination = useCallback(
    (kind: ReservoirTransitionPlan["kind"]) => {
      setLayoutOwnership((currentOwnership) => {
        const plan = currentOwnership.transitionPlan;
        if (!plan || plan.kind !== kind) return currentOwnership;

        return {
          activeLayout: plan.destination,
          transitionPlan: null,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const element = interaction.current;
    if (!element) return;

    const initialQuaternion =
      sphereRotationRef.current?.quaternion ?? new THREE.Quaternion();
    const initialDiagnostics = getRotationDiagnostics(initialQuaternion);
    setRotationDiagnostics(initialDiagnostics);
    element.dataset.renderedRotation =
      `${initialDiagnostics.euler[0].toFixed(3)},` +
      initialDiagnostics.euler[1].toFixed(3);
    element.dataset.renderedQuaternion = initialDiagnostics.quaternion
      .map((value) => value.toFixed(6))
      .join(",");

    const controlPlane = document.querySelector<HTMLElement>(
      ".reservoir-control-panel",
    );
    const updateViewportFrame = () => {
      const { width, height } = element.getBoundingClientRect();
      const controlPlaneHeight =
        controlPlane?.getBoundingClientRect().height ?? 0;
      if (width <= 0 || height <= 0) return;
      setViewportFrame((currentFrame) => {
        if (
          Math.abs(currentFrame.width - width) < 0.5 &&
          Math.abs(currentFrame.height - height) < 0.5 &&
          Math.abs(currentFrame.controlPlaneHeight - controlPlaneHeight) < 0.5
        ) {
          return currentFrame;
        }
        return { width, height, controlPlaneHeight };
      });
    };
    const observer = new ResizeObserver(updateViewportFrame);
    observer.observe(element);
    if (controlPlane) observer.observe(controlPlane);
    updateViewportFrame();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const study = interaction.current?.closest<HTMLElement>(
      ".reservoir-study",
    );
    if (!study) return;

    function completeStackTransition(event: Event) {
      const transitionEvent = event as globalThis.TransitionEvent;
      if (transitionEvent.target !== study) return;

      if (transitionEvent.propertyName === "--menu-stack-progress") {
        setMenuState((currentState) =>
          currentState === "opening"
            ? "open"
            : currentState === "closing"
              ? "closed"
              : currentState,
        );
      }

      if (transitionEvent.propertyName === "--footer-stack-progress") {
        setFooterState((currentState) =>
          currentState === "opening"
            ? "open"
            : currentState === "closing"
              ? "closed"
              : currentState,
        );
      }
    }

    study.addEventListener("transitionend", completeStackTransition);
    return () =>
      study.removeEventListener("transitionend", completeStackTransition);
  }, []);

  useEffect(() => {
    const atmosphere = atmosphereRef.current;
    if (!atmosphere) return;
    const measuredAtmosphere = atmosphere;

    function updateAtmosphereBottom() {
      const nextBottom =
        measuredAtmosphere.getBoundingClientRect().bottom;
      setAtmosphereBottom((currentBottom) =>
        Math.abs(currentBottom - nextBottom) < 0.5
          ? currentBottom
          : nextBottom,
      );
    }

    updateAtmosphereBottom();
    const observer = new ResizeObserver(updateAtmosphereBottom);
    observer.observe(measuredAtmosphere);
    window.addEventListener("resize", updateAtmosphereBottom);
    measuredAtmosphere.addEventListener(
      "animationend",
      updateAtmosphereBottom,
    );

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateAtmosphereBottom);
      measuredAtmosphere.removeEventListener(
        "animationend",
        updateAtmosphereBottom,
      );
    };
  }, [selectedResourceId, selectedCollectionId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  const reservoirFrame = useMemo(
    () =>
      getReservoirFrame({
        viewportWidth: viewportFrame.width,
        viewportHeight: viewportFrame.height,
        controlPlaneHeight: viewportFrame.controlPlaneHeight,
      }),
    [viewportFrame],
  );
  const { baseScale, centerWorldY } = useMemo(
    () =>
      getReservoirWorldTransform({
        frame: reservoirFrame,
        viewportHeight: viewportFrame.height,
        cameraDistance: CAMERA_DISTANCE,
        cameraFovDegrees: CAMERA_FOV,
        reservoirRadius: RESERVOIR_RADIUS,
      }),
    [reservoirFrame, viewportFrame.height],
  );
  const reservoirCenter = useMemo(
    () => new THREE.Vector3(0, centerWorldY, 0),
    [centerWorldY],
  );
  const collectionReservoirContext = useMemo<ReservoirContext>(
    () => ({
      kind: "collection",
      collectionId: collectionNavigation.activeCollectionId,
    }),
    [collectionNavigation.activeCollectionId],
  );
  const settledReservoirContext =
    queryReservoirContext ?? collectionReservoirContext;
  const renderedReservoirContext = useMemo(() => {
    if (!queryReservoirTransitionContext) return settledReservoirContext;
    if (queryReservoirTransitionPhase === "deactivating") {
      return settledReservoirContext;
    }

    return queryReservoirContext ?? queryReservoirTransitionContext;
  }, [
    queryReservoirContext,
    queryReservoirTransitionContext,
    queryReservoirTransitionPhase,
    settledReservoirContext,
  ]);
  const renderedActiveCollectionId = getReservoirContextCollectionId(
    renderedReservoirContext,
  );
  const renderedReservoirSeed = getReservoirContextSeed(
    renderedReservoirContext,
  );
  const activeCollection = (
    getCollectionById(renderedActiveCollectionId) ??
    getCollectionById(ROOT_COLLECTION_ID)
  ) as Collection;
  const visibleCollectionAncestors = useMemo(
    () =>
      collectionHistory.slice(1, -1).flatMap((frame) => {
        const collection = getCollectionById(frame.collectionId);
        return collection
          ? [{ id: collection.id, title: collection.title }]
          : [];
      }),
    [collectionHistory],
  );
  const activeReservoirNodes = useMemo(
    () => getReservoirContextNodes(renderedReservoirContext),
    [renderedReservoirContext],
  );
  const activeReservoirResources = useMemo(
    () =>
      activeReservoirNodes.filter(
        isReservoirInspectableResourceNode,
      ),
    [activeReservoirNodes],
  );
  const activeReservoirArtifacts = useMemo(
    () => activeReservoirResources.filter((node) => node.isArtifact),
    [activeReservoirResources],
  );
  const activeReservoirNonArtifactResources = useMemo(
    () => activeReservoirResources.filter((node) => !node.isArtifact),
    [activeReservoirResources],
  );
  const activeReservoirChildCollections = useMemo(
    () =>
      activeReservoirNodes.filter(
        (node): node is Extract<ReservoirContentNode, { kind: "collection" }> =>
          node.kind === "collection",
      ),
    [activeReservoirNodes],
  );
  const activeReservoirNodeSizingTargets = getReservoirNodeSizingTargets(
    activeReservoirNodes.length,
  );
  const transitionPlan = layoutOwnership.transitionPlan;
  const activeLayoutSource = transitionPlan
    ? transitionPlan.kind === "layout-mode"
      ? layoutModeTransitionState === "sinking"
        ? "transition-source"
        : "transition-destination"
      : transitionPlan.kind === "collection"
        ? collectionNavigation.transitionPhase === "deactivating"
          ? "transition-source"
          : "transition-destination"
        : queryReservoirTransitionPhase === "deactivating"
          ? "transition-source"
          : "transition-destination"
    : "settled";
  const resolvedLayoutState = useMemo(() => {
    if (!transitionPlan) return layoutOwnership.activeLayout;

    if (transitionPlan.kind === "layout-mode") {
      return layoutModeTransitionState === "sinking"
        ? transitionPlan.source
        : transitionPlan.destination;
    }

    if (transitionPlan.kind === "collection") {
      return collectionNavigation.transitionPhase === "deactivating"
        ? transitionPlan.source
        : transitionPlan.destination;
    }

    return queryReservoirTransitionPhase === "deactivating"
      ? transitionPlan.source
      : transitionPlan.destination;
  }, [
    collectionNavigation.transitionPhase,
    layoutModeTransitionState,
    layoutOwnership.activeLayout,
    queryReservoirTransitionPhase,
    transitionPlan,
  ]);
  const focusedLayoutDirection = resolvedLayoutState.focusedDirection;
  const activeReservoirLayout = resolvedLayoutState.directions;
  const activeNodeSizing = resolvedLayoutState.nodeSizing;
  const activeInitialComposition = useMemo(
    () =>
      generateReservoirInitialComposition(activeReservoirLayout, {
        seed: renderedReservoirSeed,
      }),
    [activeReservoirLayout, renderedReservoirSeed],
  );
  const activeReservoirLayoutDiagnostics = useMemo(
    () => getReservoirLayoutDiagnostics(activeReservoirLayout),
    [activeReservoirLayout],
  );
  const adaptiveZoomCamera = useMemo(() => {
    if (cameraRef.current) return cameraRef.current;
    const fallbackCamera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      viewportFrame.width / Math.max(viewportFrame.height, 1),
      CAMERA_NEAR,
      40,
    );
    fallbackCamera.position.set(0, 0, CAMERA_DISTANCE);
    fallbackCamera.lookAt(0, 0, 0);
    fallbackCamera.updateProjectionMatrix();
    fallbackCamera.updateMatrixWorld();
    return fallbackCamera;
  }, [viewportFrame.height, viewportFrame.width]);
  const focusedLayoutCapRadius = useMemo(
    () => getReservoirFocusedCapRadius(activeReservoirNodes.length),
    [activeReservoirNodes.length],
  );
  const focusedLayoutFocalDirection = focusedLayoutDirection;
  const activeAdaptiveZoom = useMemo<ReservoirAdaptiveZoom>(() => {
    const camera = adaptiveZoomCamera;
    if (!camera) {
      return {
        baselineMaximum: RESERVOIR_ZOOM_BASELINE_MAX,
        requiredZoom: RESERVOIR_ZOOM_BASELINE_MAX,
        transformSafeMaximum: RESERVOIR_ZOOM_BASELINE_MAX,
        absoluteMaximum: RESERVOIR_ZOOM_EXTENDED_HARD_MAX,
        activeMaximum: RESERVOIR_ZOOM_BASELINE_MAX,
        targetReachable: false,
        smallestNodeKind: null,
        smallestNodeWorldDiameter: 0,
        projectedNodePixelsAtBaseline: 0,
        projectedNodePixelsAtActiveMaximum: 0,
      };
    }

    return getReservoirAdaptiveZoom({
      camera,
      viewportHeight: viewportFrame.height,
      reservoirCenter,
      baseScale,
      nodes: activeReservoirNodes,
      artifactDiameter: activeNodeSizing.artifactDiameter,
      collectionDiameter: activeNodeSizing.collectionDiameter,
      cameraNear: CAMERA_NEAR,
    });
  }, [
    activeNodeSizing.artifactDiameter,
    activeNodeSizing.collectionDiameter,
    activeReservoirNodes,
    baseScale,
    adaptiveZoomCamera,
    reservoirCenter,
    viewportFrame.height,
  ]);
  const reservoirZoomMaximum = activeAdaptiveZoom.activeMaximum;
  zoomMaximumRef.current = reservoirZoomMaximum;
  function getAdaptiveZoomForSnapshot(
    nodes: readonly ReservoirContentNode[],
    nodeSizing: ReturnType<typeof getReservoirNodeSizingSnapshot>,
  ) {
    return getReservoirAdaptiveZoom({
      camera: adaptiveZoomCamera,
      viewportHeight: viewportFrame.height,
      reservoirCenter,
      baseScale,
      nodes,
      artifactDiameter: nodeSizing.artifactDiameter,
      collectionDiameter: nodeSizing.collectionDiameter,
      cameraNear: CAMERA_NEAR,
    });
  }
  const setReservoirZoom = useCallback(
    (nextZoomLevel: number) => {
      const boundedZoomLevel = clampReservoirZoom(
        nextZoomLevel,
        zoomMaximumRef.current,
      );
      zoomLevelRef.current = boundedZoomLevel;
      setZoomLevel(boundedZoomLevel);
      if (interaction.current) {
        interaction.current.dataset.zoomLevel = boundedZoomLevel.toFixed(6);
      }
    },
    [],
  );

  useEffect(() => {
    if (zoomLevelRef.current > reservoirZoomMaximum) {
      setReservoirZoom(reservoirZoomMaximum);
    }
  }, [reservoirZoomMaximum, setReservoirZoom]);

  const surfacedNodeIds = useMemo(() => {
    if (queryReservoirContext || queryReservoirTransitionContext) {
      return queryVisibleNodeIds;
    }
    return getExploreNodeIds(activeReservoirNodes, activeExploreFilter);
  }, [
    activeExploreFilter,
    activeReservoirNodes,
    queryVisibleNodeIds,
    queryReservoirContext,
    queryReservoirTransitionContext,
  ]);
  const surfacedNodeIdsRef = useRef(surfacedNodeIds);
  useEffect(() => {
    surfacedNodeIdsRef.current = surfacedNodeIds;
  }, [surfacedNodeIds]);
  useEffect(() => {
    activeExploreFilterRef.current = activeExploreFilter;
  }, [activeExploreFilter]);
  useEffect(() => {
    hoveredResourceIdRef.current = hoveredResourceId;
  }, [hoveredResourceId]);
  useEffect(() => {
    selectedResourceIdRef.current = selectedResourceId;
  }, [selectedResourceId]);
  useEffect(() => {
    selectedCollectionIdRef.current = selectedCollectionId;
  }, [selectedCollectionId]);
  useEffect(() => {
    selectedPressActiveRef.current = selectedPressActive;
  }, [selectedPressActive]);
  useEffect(() => {
    queryReconciliationRef.current = queryReconciliation;
  }, [queryReconciliation]);
  const reservoirNodeDiagnostics = useMemo(
    () => getReservoirNodeDiagnostics(activeReservoirNodes),
    [activeReservoirNodes],
  );
  const selectedResource = selectedResourceId
    ? (getResourceById(selectedResourceId) ?? null)
    : null;
  const selectedCollection = selectedCollectionId
    ? (getCollectionById(selectedCollectionId) ?? null)
    : null;
  const openingResource = inspectedResourceId
    ? (getResourceById(inspectedResourceId) ?? null)
    : null;
  const inspectionReactionDistances = useMemo(() => {
    const distances = new Map<string, number>();
    if (!openingResource) return distances;
    const openingDirection = activeReservoirLayout.get(openingResource.id);
    if (!openingDirection) return distances;

    for (const node of activeReservoirNodes) {
      const direction = activeReservoirLayout.get(node.id);
      if (!direction) continue;
      distances.set(
        node.id,
        getReservoirDirectionAngularDistance(openingDirection, direction),
      );
    }
    return distances;
  }, [activeReservoirLayout, activeReservoirNodes, openingResource]);
  const maximumInspectionReactionDistance = Math.max(
    0,
    ...inspectionReactionDistances.values(),
  );
  const openingActive = [
    "openingResource",
    "deployingInspection",
    "readingInspection",
  ].includes(transitionState);
  const restoring = [
    "closingInspection",
    "restoringInspection",
  ].includes(transitionState);
  const inspectionWindowPhase =
    transitionState === "deployingInspection"
      ? "deploying"
      : transitionState === "readingInspection"
        ? "reading"
        : transitionState === "closingInspection"
          ? "closing"
          : null;
  const collectionContextTransition =
    transitionState === "reconstitutingCollection" ||
    queryReservoirTransitionPhase !== "idle";
  const queryTransitionActive = queryActivityRevision !== null;
  const menuActive = menuState !== "closed";
  const footerVisible = footerState !== "closed";
  const footerTransitionActive =
    footerState === "opening" || footerState === "closing";
  const layoutModeTransitionActive =
    layoutModeTransitionState !== "idle";
  const inputLocked =
    transitionState !== "idle" ||
    layoutModeTransitionActive ||
    menuActive ||
    queryTransitionActive ||
    footerTransitionActive;
  const layoutModeControlDisabled =
    inputLocked || collectionNavigation.transitionPhase !== "idle";
  const secondaryControlsDimmed =
    collectionContextTransition || layoutModeTransitionActive;
  const navigationContext =
    queryReservoirContext ?? queryReservoirTransitionContext;
  const showHomeNavigation =
    navigationContext?.kind === "query" || collectionHistory.length > 1;
  const showBackNavigation =
    navigationContext?.kind === "query"
      ? canNavigateBackFromQueryContext(navigationContext)
      : collectionHistory.length >= 3;

  useEffect(() => {
    if (
      transitionState !== "openingResource" ||
      !preservedReservoirState
    ) {
      return;
    }

    const duration = getOpeningDuration(reducedMotion);
    const startTime = performance.now();
    let animationFrameId = 0;

    function updateOpeningTimeline(now: number) {
      const elapsed = Math.min((now - startTime) / 1000, duration);
      openingElapsedRef.current = elapsed;

      if (interaction.current) {
        interaction.current.dataset.openingElapsed = elapsed.toFixed(6);
        interaction.current.dataset.openingProgress = (
          elapsed / duration
        ).toFixed(6);
      }

      if (elapsed >= duration) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        setTransitionState("deployingInspection");
        return;
      }

      animationFrameId = requestAnimationFrame(updateOpeningTimeline);
    }

    animationFrameId = requestAnimationFrame(updateOpeningTimeline);
    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, reducedMotion, setReservoirZoom, transitionState]);
  useEffect(() => {
    const requestedDestinationCollectionId =
      collectionNavigation.destinationCollectionId;
    if (
      transitionState !== "reconstitutingCollection" ||
      !requestedDestinationCollectionId
    ) {
      return;
    }
    const destinationCollectionId = requestedDestinationCollectionId;

    const duration = getCollectionReconstitutionDuration(reducedMotion);
    const startTime = performance.now();
    let handoffCommitted = false;
    let animationFrameId = 0;

    function updateCollectionReconstitution(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(duration, Number.EPSILON),
        0,
        1,
      );
      const frame = getCollectionReconstitutionFrame(progress);
      collectionReconstitutionProgressRef.current = progress;
      collectionEmergenceProgressRef.current = frame.emergenceProgress;

      if (!handoffCommitted && progress >= 0.5) {
        handoffCommitted = true;
        const resolution = pendingCollectionResolutionRef.current;
        setQueryReservoirContext(null);
        setQueryReservoirTransitionContext(null);
        restoreReservoirFilterForContext({
          kind: "collection",
          collectionId: destinationCollectionId,
        });
        setQueryReconciliation(null);
        setQueryActivityRevision(null);
        setQueryActivityMode(null);
        setRejectedExploreFilter(null);
        if (resolution) setCollectionHistory(resolution.history);
        setSelectedResourceId(null);
        setSelectedCollectionId(null);
        setCollectionNavigation({
          activeCollectionId: destinationCollectionId,
          destinationCollectionId,
          transitionPhase: "reactivating",
        });
      }

      if (interaction.current) {
        interaction.current.dataset.collectionReconstitutionProgress =
          progress.toFixed(6);
        interaction.current.dataset.collectionDeactivationProgress =
          frame.deactivationProgress.toFixed(6);
        interaction.current.dataset.collectionReactivationProgress =
          frame.reactivationProgress.toFixed(6);
        interaction.current.dataset.collectionChildEmergenceProgress =
          frame.emergenceProgress.toFixed(6);
        interaction.current.dataset.collectionDestinationNodesSettled =
          String(frame.destinationNodesSettled);
        interaction.current.dataset.collectionTwinkleEnvelope =
          frame.twinkleEnvelope.toFixed(6);
        interaction.current.dataset.collectionNeutralHandoffCommitted =
          String(handoffCommitted);
        interaction.current.dataset.collectionCameraWrites = "none";
        interaction.current.dataset.collectionOrientationWrites =
          "preserve-current-quaternion";
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(
          updateCollectionReconstitution,
        );
        return;
      }

      const snapshot = collectionTransitionPoseSnapshotRef.current;
      const sphereQuaternion = sphereRotationRef.current?.quaternion;
      if (interaction.current && snapshot && sphereQuaternion) {
        interaction.current.dataset.collectionSphereQuaternionError =
          sphereQuaternion
            .angleTo(new THREE.Quaternion(...snapshot.sphereQuaternion))
            .toFixed(9);
        interaction.current.dataset.collectionZoomLevelError = Math.abs(
          zoomLevelRef.current - snapshot.zoomLevel,
        ).toFixed(9);
      }

      collectionReconstitutionProgressRef.current = 1;
      collectionEmergenceProgressRef.current = 1;
      pendingCollectionResolutionRef.current = null;
      collectionTransitionPoseSnapshotRef.current = null;
      promoteReservoirTransitionDestination("collection");
      setSelectedSpatialDestinationId(null);
      setCollectionActivityRevision(null);
      setCollectionNavigation({
        activeCollectionId: destinationCollectionId,
        destinationCollectionId: null,
        transitionPhase: "idle",
      });
      setTransitionState("idle");
    }

    animationFrameId = requestAnimationFrame(updateCollectionReconstitution);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    collectionNavigation.destinationCollectionId,
    promoteReservoirTransitionDestination,
    reducedMotion,
    restoreReservoirFilterForContext,
    transitionState,
  ]);

  useEffect(() => {
    queryReservoirTransitionPhaseRef.current =
      queryReservoirTransitionPhase;
  }, [queryReservoirTransitionPhase]);

  function persistReservoirPresentationForCurrentContext() {
    const currentContext = queryReservoirContext ?? collectionReservoirContext;
    const contextKey = getReservoirContextKey(currentContext);

    reservoirExploreFilterByContextKeyRef.current.set(
      contextKey,
      activeExploreFilterRef.current,
    );
    if (currentContext.kind !== "query") {
      return;
    }

    queryReservoirSnapshotByContextKeyRef.current.set(contextKey, {
      hoveredResourceId: hoveredResourceIdRef.current,
      selectedResourceId: selectedResourceIdRef.current,
      selectedCollectionId: selectedCollectionIdRef.current,
      selectedPressActive: selectedPressActiveRef.current,
    });
  }

  const restoreQueryReservoirSnapshotForContext = useCallback(
    (context: ReservoirContext) => {
      if (context.kind !== "query") return;

      const snapshot = queryReservoirSnapshotByContextKeyRef.current.get(
        getReservoirContextKey(context),
      );
      if (!snapshot) return false;

      setHoveredResourceId(snapshot.hoveredResourceId);
      setSelectedResourceId(snapshot.selectedResourceId);
      setSelectedCollectionId(snapshot.selectedCollectionId);
      setSelectedPressActive(snapshot.selectedPressActive);
      return true;
    },
    [],
  );

  const settleQueryReservoirContext = useCallback((context: ReservoirContext) => {
    setQueryReservoirContext(context.kind === "query" ? context : null);
    setQueryReservoirTransitionContext(null);
    restoreReservoirFilterForContext(context);
    setQueryReconciliation(null);
    setQueryActivityRevision(null);
    setQueryActivityMode(null);
    setRejectedExploreFilter(null);
  }, [restoreReservoirFilterForContext]);

  const completeQueryTransition = useCallback(() => {
    const transitionContext = queryReservoirTransitionContext;
    if (transitionContext) {
      promoteReservoirTransitionDestination("query");
      settleQueryReservoirContext(transitionContext);
      if (transitionContext.kind === "query") {
        const singleResultNode =
          transitionContext.resultIds.length === 1
            ? getReservoirContentNodeBySemanticId(
                transitionContext.resultIds[0],
              )
            : null;
        setSelectedResourceId(
          singleResultNode?.kind !== "collection"
            ? singleResultNode?.id ?? null
            : null,
        );
        setSelectedCollectionId(
          singleResultNode?.kind === "collection"
            ? singleResultNode.id
            : null,
        );
        setSelectedPressActive(false);
        setHoveredResourceId(null);
        setLocatingResourceId(null);
        restoreQueryReservoirSnapshotForContext(transitionContext);
      }
      setQueryReservoirTransitionPhase("idle");
      queryReservoirTransitionProgressRef.current = 0;
    } else if (queryActivityMode === "success") {
      setQueryVisibleNodeIds(
        new Set(
          queryReconciliationRef.current?.target ??
            surfacedNodeIdsRef.current,
        ),
      );
    }
    setQueryReconciliation(null);
    setQueryActivityRevision(null);
    setQueryActivityMode(null);
    setRejectedExploreFilter(null);
    setLocatingResourceId(null);
    if (transitionContext === null) {
      setQueryReservoirTransitionPhase("idle");
      queryReservoirTransitionProgressRef.current = 0;
    }
  }, [
    promoteReservoirTransitionDestination,
    queryActivityMode,
    queryReservoirTransitionContext,
    settleQueryReservoirContext,
    restoreQueryReservoirSnapshotForContext,
  ]);

  useEffect(() => {
    if (
      queryReservoirTransitionPhaseRef.current !== "deactivating" ||
      !queryReservoirTransitionContext
    ) {
      return;
    }

    const duration = getCollectionReconstitutionDuration(reducedMotion);
    const startTime = performance.now();
    let handoffCommitted = false;
    let animationFrameId = 0;

    function updateQueryReconstitution(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(duration, Number.EPSILON),
        0,
        1,
      );
      const frame = getCollectionReconstitutionFrame(progress);
      queryReservoirTransitionProgressRef.current = progress;

      if (!handoffCommitted && progress >= 0.5) {
        handoffCommitted = true;
        const destinationContext = queryReservoirTransitionContext;
        if (!destinationContext) {
          return;
        }
        setQueryReservoirContext(destinationContext);
        setQueryReservoirTransitionPhase("reactivating");
        restoreReservoirFilterForContext(destinationContext);
      }

      if (interaction.current) {
        interaction.current.dataset.queryReservoirTransitionPhase =
          handoffCommitted ? "reactivating" : "deactivating";
        interaction.current.dataset.queryReservoirTransitionProgress =
          progress.toFixed(6);
        interaction.current.dataset.queryReservoirTransitionHandoffCommitted =
          String(handoffCommitted);
        interaction.current.dataset.queryReservoirTransitionTwinkleEnvelope =
          frame.twinkleEnvelope.toFixed(6);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateQueryReconstitution);
        return;
      }

      queryReservoirTransitionProgressRef.current = 1;
      completeQueryTransition();
      if (interaction.current) {
        interaction.current.dataset.queryReservoirTransitionPhase = "idle";
        interaction.current.dataset.queryReservoirTransitionProgress = "1.000000";
        interaction.current.dataset.queryReservoirTransitionHandoffCommitted =
          String(handoffCommitted);
        interaction.current.dataset.queryReservoirTransitionTwinkleEnvelope =
          frame.twinkleEnvelope.toFixed(6);
      }
    }

    animationFrameId = requestAnimationFrame(updateQueryReconstitution);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    completeQueryTransition,
    queryReservoirTransitionContext,
    reducedMotion,
    restoreReservoirFilterForContext,
  ]);

  useEffect(() => {
    if (layoutModeTransitionState !== "sinking") {
      return;
    }

    const duration = getLayoutModeSwitchDuration(reducedMotion);
    const startTime = performance.now();
    let animationFrameId = 0;

    function updateSinking(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(duration, Number.EPSILON),
        0,
        1,
      );
      layoutModeTransitionProgressRef.current = progress;
      layoutModeTransitionElapsedRef.current = duration * progress;
      layoutModeTransitionPulseRef.current = getLayoutModeTransitionPulse(
        "sinking",
        progress,
        reducedMotion,
      );

      if (interaction.current) {
        interaction.current.dataset.layoutModeTransitionPhase = "sinking";
        interaction.current.dataset.layoutModeTransitionProgress =
          progress.toFixed(6);
        interaction.current.dataset.layoutModeTransitionPulse =
          layoutModeTransitionPulseRef.current.toFixed(6);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateSinking);
        return;
      }

      layoutModeTransitionProgressRef.current = 0;
      layoutModeTransitionElapsedRef.current = 0;
      layoutModeTransitionPulseRef.current = getLayoutModeTransitionPulse(
        "orienting",
        0,
        reducedMotion,
      );
      renderedZoomRef.current = layoutModeResetTargetZoomRef.current;
      setReservoirZoom(layoutModeResetTargetZoomRef.current);
      setRenderedLayoutMode(layoutMode);
      setLayoutModeTransitionState("orienting");
    }

    animationFrameId = requestAnimationFrame(updateSinking);
    return () => cancelAnimationFrame(animationFrameId);
  }, [layoutMode, layoutModeTransitionState, reducedMotion, setReservoirZoom]);

  useEffect(() => {
    if (layoutModeTransitionState !== "orienting") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLayoutModeTransitionState("emerging");
    }, 0);

    if (interaction.current) {
      interaction.current.dataset.layoutModeTransitionPhase = "orienting";
      interaction.current.dataset.layoutModeTransitionProgress = "0.000000";
      interaction.current.dataset.layoutModeTransitionPulse =
        layoutModeTransitionPulseRef.current.toFixed(6);
    }

    return () => window.clearTimeout(timeoutId);
  }, [layoutModeTransitionState, reducedMotion, setReservoirZoom]);

  useEffect(() => {
    if (layoutModeTransitionState !== "emerging") {
      return;
    }

    const duration = getLayoutModeSwitchDuration(reducedMotion);
    const startTime = performance.now();
    let animationFrameId = 0;

    function updateEmerging(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(duration, Number.EPSILON),
        0,
        1,
      );
      layoutModeTransitionProgressRef.current = progress;
      layoutModeTransitionPulseRef.current = getLayoutModeTransitionPulse(
        "emerging",
        progress,
        reducedMotion,
      );

      if (interaction.current) {
        interaction.current.dataset.layoutModeTransitionPhase = "emerging";
        interaction.current.dataset.layoutModeTransitionProgress =
          progress.toFixed(6);
        interaction.current.dataset.layoutModeTransitionPulse =
          layoutModeTransitionPulseRef.current.toFixed(6);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateEmerging);
        return;
      }

      layoutModeTransitionProgressRef.current = 0;
      layoutModeTransitionElapsedRef.current = 0;
      layoutModeTransitionPulseRef.current = 0;
      promoteReservoirTransitionDestination("layout-mode");
      setLayoutModeTransitionState("idle");
      if (interaction.current) {
        interaction.current.dataset.layoutModeTransitionPhase = "idle";
        interaction.current.dataset.layoutModeTransitionProgress = "0.000000";
        interaction.current.dataset.layoutModeTransitionPulse = "0.000000";
      }
    }

    animationFrameId = requestAnimationFrame(updateEmerging);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    layoutModeTransitionState,
    promoteReservoirTransitionDestination,
    reducedMotion,
  ]);

  useEffect(() => {
    if (!layoutModeTransitionActive) {
      return;
    }

    const sinkDuration = getLayoutModeSwitchDuration(reducedMotion);
    const totalDuration = sinkDuration;
    const startTime = performance.now();
    const startZoom = layoutModeResetStartZoomRef.current;
    const targetZoom = layoutModeResetTargetZoomRef.current;
    let animationFrameId = 0;

    function updateLayoutModeViewReset(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(totalDuration, Number.EPSILON),
        0,
        1,
      );
      const easedProgress = smoothstep(progress);
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

      layoutModeViewResetProgressRef.current = progress;

      renderedZoomRef.current = currentZoom;
      setReservoirZoom(currentZoom);

      if (interaction.current) {
        interaction.current.dataset.layoutModeViewResetProgress =
          progress.toFixed(6);
        interaction.current.dataset.layoutModeViewResetZoom =
          currentZoom.toFixed(6);
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateLayoutModeViewReset);
        return;
      }

      layoutModeViewResetProgressRef.current = 1;
      renderedZoomRef.current = targetZoom;
      setReservoirZoom(targetZoom);
      if (interaction.current) {
        interaction.current.dataset.layoutModeViewResetProgress = "1.000000";
        interaction.current.dataset.layoutModeViewResetZoom =
          targetZoom.toFixed(6);
      }
    }

    animationFrameId = requestAnimationFrame(updateLayoutModeViewReset);
    return () => cancelAnimationFrame(animationFrameId);
  }, [layoutModeTransitionActive, reducedMotion, setReservoirZoom]);

  useLayoutEffect(() => {
    const readingMode = [
      "deployingInspection",
      "readingInspection",
      "closingInspection",
    ].includes(transitionState);
    const scrollEnabled = transitionState === "readingInspection";
    const deploying = transitionState === "deployingInspection";
    const scrollRoots = [document.documentElement, document.body];

    for (const root of scrollRoots) {
      root.classList.toggle("artifact-reading-mode", readingMode);
      root.classList.toggle("artifact-scroll-enabled", scrollEnabled);
      root.classList.toggle("artifact-deploying-mode", deploying);
    }

    return () => {
      for (const root of scrollRoots) {
        root.classList.remove("artifact-reading-mode");
        root.classList.remove("artifact-scroll-enabled");
        root.classList.remove("artifact-deploying-mode");
      }
    };
  }, [transitionState]);

  const completeInspectionDeployment = useCallback(() => {
    setTransitionState((currentState) =>
      currentState === "deployingInspection"
        ? "readingInspection"
        : currentState,
    );
  }, []);

  const requestInspectionClose = useCallback(() => {
    setInspectionFooterReached(false);
    inspectionRecoveryStartTimeRef.current = performance.now();
    inspectionRecoveryHandoffCommittedRef.current = false;
    restorationElapsedRef.current = 0;
    restorationProgressRef.current = 0;
    if (interaction.current) {
      interaction.current.dataset.inspectionExitIntent = pendingInspectionNavigationTargetRef.current
        ? "support-resource-navigation"
        : "close";
      interaction.current.dataset.inspectionExitTarget =
        pendingInspectionNavigationTargetRef.current ?? "";
    }
    setTransitionState((currentState) =>
      currentState === "readingInspection"
        ? "closingInspection"
        : currentState,
    );
  }, []);

  const requestInspectionNavigation = useCallback(
    (resourceId: string) => {
      const inspectionWindowPhase: InspectionWindowPhase =
        transitionState === "readingInspection"
          ? "reading"
          : transitionState === "deployingInspection"
            ? "deploying"
            : "closing";
      if (
        !canRequestInspectionSupportNavigation(
          inspectionWindowPhase,
          pendingInspectionNavigationTargetRef.current,
        )
      ) {
        return;
      }
      pendingInspectionNavigationTargetRef.current = resourceId;
      if (interaction.current) {
        interaction.current.dataset.inspectionExitIntent =
          "support-resource-navigation";
        interaction.current.dataset.inspectionExitTarget = resourceId;
      }
      requestInspectionClose();
    },
    [requestInspectionClose, transitionState],
  );

  useEffect(() => {
    if (
      !["closingInspection", "restoringInspection"].includes(
        transitionState,
      ) ||
      preservedReservoirState
    ) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      pendingInspectionNavigationTargetRef.current = null;
      inspectionRecoveryStartTimeRef.current = null;
      inspectionRecoveryHandoffCommittedRef.current = false;
      restorationElapsedRef.current = 0;
      restorationProgressRef.current = 1;
      setInspectionFooterReached(false);
      setInspectedResourceId(null);
      setTransitionState("idle");
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, transitionState]);

  useEffect(() => {
    if (
      transitionState !== "closingInspection" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const retractDuration = getInspectionWindowRetractDuration(reducedMotion);
    const restorationDuration = getReservoirRestoreDuration(reducedMotion);
    const startTime =
      inspectionRecoveryStartTimeRef.current ?? performance.now();
    if (inspectionRecoveryStartTimeRef.current === null) {
      inspectionRecoveryStartTimeRef.current = startTime;
    }
    const expectedSphereQuaternion = new THREE.Quaternion(
      ...snapshot.sphereQuaternion,
    );
    let animationFrameId = 0;

    function updateClosingRecovery(now: number) {
      const elapsed = (now - startTime) / 1000;
      const retractProgress = Math.min(
        Math.max(elapsed / Math.max(retractDuration, Number.EPSILON), 0),
        1,
      );
      restorationElapsedRef.current = Math.min(elapsed, restorationDuration);
      restorationProgressRef.current = getReservoirRestoreProgress(
        elapsed,
        reducedMotion,
      );

      const renderedSphere = sphereRotationRef.current;
      let sphereQuaternionError = renderedSphere
        ? renderedSphere.quaternion.angleTo(expectedSphereQuaternion)
        : Number.POSITIVE_INFINITY;
      let zoomLevelError = Math.abs(
        zoomLevelRef.current - snapshot.zoomLevel,
      );
      const poseMismatch =
        sphereQuaternionError >= 0.00001 || zoomLevelError >= 0.00001;
      if (poseMismatch) {
        if (renderedSphere && sphereQuaternionError >= 0.00001) {
          renderedSphere.quaternion.slerp(
            expectedSphereQuaternion,
            restorationProgressRef.current,
          );
          renderedSphere.updateMatrixWorld();
          sphereQuaternionError = renderedSphere.quaternion.angleTo(
            expectedSphereQuaternion,
          );
        }
        if (zoomLevelError >= 0.00001) {
          setReservoirZoom(
            THREE.MathUtils.lerp(
              zoomLevelRef.current,
              snapshot.zoomLevel,
              restorationProgressRef.current,
            ),
          );
          zoomLevelError = Math.abs(
            zoomLevelRef.current - snapshot.zoomLevel,
          );
        }
      }
      const fallbackUsed = false;
      const supportNavigationTarget =
        pendingInspectionNavigationTargetRef.current ?? null;
      const supportHandoffReady =
        supportNavigationTarget !== null && retractProgress >= 1;

      if (interaction.current) {
        interaction.current.dataset.inspectionCloseRetractDuration =
          retractDuration.toFixed(6);
        interaction.current.dataset.inspectionCloseRetractElapsed = Math.min(
          elapsed,
          retractDuration,
        ).toFixed(6);
        interaction.current.dataset.inspectionCloseRetractProgress =
          retractProgress.toFixed(6);
        interaction.current.dataset.restorationNominalDuration =
          restorationDuration.toFixed(6);
        interaction.current.dataset.restorationElapsed =
          restorationElapsedRef.current.toFixed(6);
        interaction.current.dataset.restorationProgress =
          restorationProgressRef.current.toFixed(6);
        interaction.current.dataset.restorationSphereQuaternionError =
          sphereQuaternionError.toFixed(9);
        interaction.current.dataset.restorationZoomLevelError =
          zoomLevelError.toFixed(9);
        interaction.current.dataset.restorationEndpointReached = String(
          restorationProgressRef.current >= 1,
        );
        interaction.current.dataset.inspectionRecoveryPoseInvariant = String(
          !poseMismatch,
        );
        interaction.current.dataset.inspectionRecoveryPoseCorrection = String(
          poseMismatch,
        );
        interaction.current.dataset.restorationFallbackUsed = String(
          fallbackUsed,
        );
        interaction.current.dataset.supportQueryHandoffReady = String(
          supportHandoffReady,
        );
        interaction.current.dataset.supportQueryHandoffCommitted = String(
          inspectionRecoveryHandoffCommittedRef.current,
        );
      }

      if (supportHandoffReady && supportNavigationTarget) {
        inspectionRecoveryHandoffCommittedRef.current = true;
        if (interaction.current) {
          interaction.current.dataset.supportQueryHandoffCommitted = "true";
        }
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        const started = requestDirectResourceRef.current(
          supportNavigationTarget,
        );
        if (started) {
          inspectionRecoveryStartTimeRef.current = null;
          restorationElapsedRef.current = 0;
          restorationProgressRef.current = 0;
          setPreservedReservoirState(null);
          setInspectedResourceId(null);
          return;
        }
        inspectionRecoveryHandoffCommittedRef.current = false;
        restorationElapsedRef.current = 0;
        restorationProgressRef.current = 0;
        setTransitionState("restoringInspection");
        return;
      }

      if (retractProgress < 1) {
        animationFrameId = requestAnimationFrame(updateClosingRecovery);
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (restorationProgressRef.current >= 1) {
        restorationProgressRef.current = 1;
        if (renderedSphere) {
          renderedSphere.quaternion.copy(expectedSphereQuaternion);
        }
        setReservoirZoom(snapshot.zoomLevel);
        setInspectedResourceId(null);
        inspectionRecoveryStartTimeRef.current = null;
        setTransitionState("idle");
        return;
      }

      setTransitionState("restoringInspection");
    }

    animationFrameId = requestAnimationFrame(updateClosingRecovery);
    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, reducedMotion, setReservoirZoom, transitionState]);

  useEffect(() => {
    if (
      transitionState !== "restoringInspection" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const duration = getReservoirRestoreDuration(reducedMotion);
    const startTime =
      inspectionRecoveryStartTimeRef.current ?? performance.now();
    if (inspectionRecoveryStartTimeRef.current === null) {
      inspectionRecoveryStartTimeRef.current = startTime;
    }
    const expectedSphereQuaternion = new THREE.Quaternion(
      ...snapshot.sphereQuaternion,
    );
    let animationFrameId = 0;

    function updateRestoration(now: number) {
      const elapsed = (now - startTime) / 1000;
      restorationElapsedRef.current = Math.min(elapsed, duration);
      restorationProgressRef.current = getReservoirRestoreProgress(
        elapsed,
        reducedMotion,
      );

      const renderedSphere = sphereRotationRef.current;
      let sphereQuaternionError = renderedSphere
        ? renderedSphere.quaternion.angleTo(expectedSphereQuaternion)
        : Number.POSITIVE_INFINITY;
      let zoomLevelError = Math.abs(
        zoomLevelRef.current - snapshot.zoomLevel,
      );
      const poseMismatch =
        sphereQuaternionError >= 0.00001 || zoomLevelError >= 0.00001;
      if (poseMismatch) {
        if (renderedSphere && sphereQuaternionError >= 0.00001) {
          renderedSphere.quaternion.slerp(
            expectedSphereQuaternion,
            restorationProgressRef.current,
          );
          renderedSphere.updateMatrixWorld();
          sphereQuaternionError = renderedSphere.quaternion.angleTo(
            expectedSphereQuaternion,
          );
        }
        if (zoomLevelError >= 0.00001) {
          setReservoirZoom(
            THREE.MathUtils.lerp(
              zoomLevelRef.current,
              snapshot.zoomLevel,
              restorationProgressRef.current,
            ),
          );
          zoomLevelError = Math.abs(
            zoomLevelRef.current - snapshot.zoomLevel,
          );
        }
      }

      if (interaction.current) {
        interaction.current.dataset.restorationProgress =
          restorationProgressRef.current.toFixed(6);
        interaction.current.dataset.restorationSphereQuaternionError =
          sphereQuaternionError.toFixed(9);
        interaction.current.dataset.restorationZoomLevelError =
          zoomLevelError.toFixed(9);
        interaction.current.dataset.inspectionRecoveryPoseInvariant = String(
          !poseMismatch,
        );
      }

      if (elapsed >= duration) {
        restorationProgressRef.current = 1;
        if (renderedSphere) {
          renderedSphere.quaternion.copy(expectedSphereQuaternion);
        }
        setReservoirZoom(snapshot.zoomLevel);
        setInspectedResourceId(null);
        inspectionRecoveryStartTimeRef.current = null;
        setTransitionState("idle");
        return;
      }

      animationFrameId = requestAnimationFrame(updateRestoration);
    }

    animationFrameId = requestAnimationFrame(updateRestoration);
    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, reducedMotion, setReservoirZoom, transitionState]);

  function getPinchDistance() {
    const touches = [...activeTouchPointersRef.current.values()];
    if (touches.length < 2) return null;
    return Math.hypot(
      touches[0].x - touches[1].x,
      touches[0].y - touches[1].y,
    );
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (inputLocked || event.button !== 0) {
      return;
    }

    if (event.pointerType === "touch") {
      activeTouchPointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      const pinchDistance = getPinchDistance();
      if (pinchDistance !== null) {
        pinchActiveRef.current = true;
        pinchDistanceRef.current = pinchDistance;
        drag.current = null;
        setIsDragging(false);
        setSelectedPressActive(false);
        return;
      }
    } else if (!event.isPrimary) {
      return;
    }

    const renderedQuaternion = sphereRotationRef.current?.quaternion;
    if (renderedQuaternion) {
      setRotationDiagnostics(getRotationDiagnostics(renderedQuaternion));
    }

    pointer.current = { x: event.clientX, y: event.clientY };
    setSelectedPressActive(
      (() => {
        const pickedNode = pickReservoirNode(event.clientX, event.clientY);
        return Boolean(
          pickedNode &&
            ((pickedNode.kind !== "collection" &&
              pickedNode.id === selectedResourceId) ||
              (pickedNode.kind === "collection" &&
                pickedNode.id === selectedCollectionId)),
        );
      })(),
    );
    interactionRevisionRef.current += 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      maxTravelSquared: 0,
      hoverCancelled: false,
    };
    setIsDragging(true);
  }

  function updatePointer(event: PointerEvent<HTMLDivElement>) {
    pointer.current = { x: event.clientX, y: event.clientY };
    if (inputLocked) {
      return;
    }
    interactionRevisionRef.current += 1;

    if (
      event.pointerType === "touch" &&
      activeTouchPointersRef.current.has(event.pointerId)
    ) {
      activeTouchPointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      const pinchDistance = getPinchDistance();
      if (pinchDistance !== null) {
        event.preventDefault();
        const previousDistance = pinchDistanceRef.current;
        pinchDistanceRef.current = pinchDistance;
        if (previousDistance !== null) {
          setReservoirZoom(
            zoomLevelRef.current +
              (pinchDistance - previousDistance) *
                RESERVOIR_PINCH_ZOOM_RATE,
          );
        }
        return;
      }
    }

    const origin = drag.current;
    const rotationGroup = sphereRotationRef.current;
    const activeCamera = cameraRef.current;
    if (
      !origin ||
      origin.pointerId !== event.pointerId ||
      !rotationGroup ||
      !activeCamera
    ) {
      return;
    }

    const pointerDeltaX = event.clientX - origin.x;
    const pointerDeltaY = event.clientY - origin.y;
    const totalTravelX = event.clientX - origin.startX;
    const totalTravelY = event.clientY - origin.startY;
    origin.maxTravelSquared = Math.max(
      origin.maxTravelSquared,
      totalTravelX ** 2 + totalTravelY ** 2,
    );
    if (
      !origin.hoverCancelled &&
      origin.maxTravelSquared > NODE_CLICK_MAX_TRAVEL ** 2
    ) {
      origin.hoverCancelled = true;
      setHoveredResourceId(null);
      setSelectedPressActive(false);
    }
    const dragSensitivity = DRAG_SENSITIVITY;

    activeCamera.updateMatrixWorld();
    activeCamera.getWorldQuaternion(cameraWorldQuaternion);
    cameraRight
      .set(1, 0, 0)
      .applyQuaternion(cameraWorldQuaternion)
      .normalize();
    cameraUp
      .set(0, 1, 0)
      .applyQuaternion(cameraWorldQuaternion)
      .normalize();
    horizontalDragQuaternion.setFromAxisAngle(
      cameraUp,
      pointerDeltaX * dragSensitivity,
    );
    verticalDragQuaternion.setFromAxisAngle(
      cameraRight,
      pointerDeltaY * dragSensitivity,
    );
    dragDeltaQuaternion
      .copy(horizontalDragQuaternion)
      .multiply(verticalDragQuaternion);

    origin.x = event.clientX;
    origin.y = event.clientY;
    rotationGroup.quaternion.premultiply(dragDeltaQuaternion).normalize();
    const diagnostics = getRotationDiagnostics(rotationGroup.quaternion);
    setRotationDiagnostics(diagnostics);

    if (interaction.current) {
      interaction.current.dataset.renderedRotation =
        `${diagnostics.euler[0].toFixed(3)},${diagnostics.euler[1].toFixed(3)}`;
      interaction.current.dataset.renderedQuaternion = diagnostics.quaternion
        .map((value) => value.toFixed(6))
        .join(",");
      interaction.current.dataset.lastDragSensitivity =
        dragSensitivity.toFixed(7);
    }
  }

  function pickReservoirNode(
    clientX: number,
    clientY: number,
  ): PickedReservoirNode | null {
    const element = interaction.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const surface = surfaceRef.current;
    if (!element || !camera || !scene || !surface) return null;

    const bounds = element.getBoundingClientRect();
    pointerNdc.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointerNdc, camera);

    const surfaceDistance =
      raycaster.intersectObject(surface, false)[0]?.distance ?? null;
    const candidates = raycaster
      .intersectObjects(scene.children, true)
      .flatMap<ReservoirPointerCandidate>((hit) => {
        const resourceId = hit.object.userData.resourceId;
        const collectionId = hit.object.userData.collectionId;
        const reservoirNodeKind = hit.object.userData.reservoirNodeKind;
        const source = hit.object.userData[
          RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY
        ];
        const kind =
          typeof resourceId === "string" &&
          (reservoirNodeKind === "artifact" || reservoirNodeKind === "resource")
            ? reservoirNodeKind
            : typeof collectionId === "string"
              ? "collection"
              : null;
        const id = kind === "collection" ? collectionId : resourceId;

        if (
          kind === null ||
          typeof id !== "string" ||
          !surfacedNodeIds.has(id) ||
          (source !== "visible-mesh" && source !== "hit-area")
        ) {
          return [];
        }

        return [{
          distance: hit.distance,
          id,
          kind,
          source: source as ReservoirPointerCandidateSource,
        }];
      });
    const resolution = resolveReservoirNodePointerCandidate({
      candidates,
      surfaceDistance,
    });
    recordReservoirPointerDiagnostics(interaction.current, resolution);

    return resolution.candidate && resolution.accepted
      ? { kind: resolution.candidate.kind, id: resolution.candidate.id }
      : null;
  }

  function capturePreservedReservoirState(
    resourceId: string,
  ): PreservedReservoirState | null {
    const sphere = sphereRotationRef.current;
    if (!sphere) return null;

    return {
      resourceId,
      sphereQuaternion: toQuaternionTuple(sphere.quaternion),
      zoomLevel: zoomLevelRef.current,
    };
  }

  function recordLayoutFocalDiagnostics(
    focalDiagnostics: LayoutModeFocalDiagnostics,
  ) {
    setLayoutModeFocalDiagnostics(focalDiagnostics);
    if (!interaction.current) return;

    interaction.current.dataset.layoutModeFocalAssertions = String(
      focalDiagnostics.assertionsPassed,
    );
    interaction.current.dataset.layoutModeReservoirWorldPosition =
      focalDiagnostics.reservoirWorldPosition
        .map((value) => value.toFixed(6))
        .join(",");
    interaction.current.dataset.layoutModeReservoirWorldQuaternion =
      focalDiagnostics.reservoirWorldQuaternion
        .map((value) => value.toFixed(6))
        .join(",");
    interaction.current.dataset.layoutModeFrontWorld = formatDirectionTuple(
      focalDiagnostics.frontWorld,
    );
    interaction.current.dataset.layoutModeUpTangentWorld =
      formatDirectionTuple(focalDiagnostics.upTangentWorld);
    interaction.current.dataset.layoutModeTargetWorld = formatDirectionTuple(
      focalDiagnostics.targetWorld,
    );
    interaction.current.dataset.layoutModeTargetLocal = formatDirectionTuple(
      focalDiagnostics.targetLocal,
    );
    interaction.current.dataset.layoutModeRoundTripWorld = formatDirectionTuple(
      focalDiagnostics.roundTripWorld,
    );
    interaction.current.dataset.layoutModeRoundTripAngleDegrees =
      focalDiagnostics.roundTripAngleDegrees.toFixed(6);
    interaction.current.dataset.layoutModeRoundTripFrontDot =
      focalDiagnostics.roundTripFrontDot.toFixed(6);
    interaction.current.dataset.layoutModeRoundTripUpDot =
      focalDiagnostics.roundTripUpDot.toFixed(6);
  }

  function requestLayoutMode(nextLayoutMode: ReservoirLayoutMode) {
    if (
      nextLayoutMode === layoutMode ||
      layoutModeTransitionActive ||
      inspectionWindowPhase !== null ||
      collectionNavigation.transitionPhase !== "idle" ||
      menuActive ||
      queryTransitionActive ||
      footerTransitionActive
    ) {
      return;
    }

    const preparedDestination = prepareReservoirLayoutState({
      context: settledReservoirContext,
      mode: nextLayoutMode,
      surface: surfaceRef.current,
      camera: cameraRef.current,
    });
    if (!preparedDestination) return;
    if (preparedDestination.focalDiagnostics) {
      recordLayoutFocalDiagnostics(preparedDestination.focalDiagnostics);
    }
    if (
      !beginReservoirTransitionPlan({
        kind: "layout-mode",
        source: captureReservoirLayoutState(
          layoutOwnership.activeLayout,
        ),
        destination: preparedDestination.layoutState,
      })
    ) {
      return;
    }

    layoutModeResetStartZoomRef.current = zoomLevelRef.current;
    layoutModeResetTargetZoomRef.current = clampReservoirZoom(
      RESERVOIR_ZOOM_DEFAULT,
      getAdaptiveZoomForSnapshot(
        preparedDestination.nodes,
        preparedDestination.layoutState.nodeSizing,
      ).activeMaximum,
    );
    layoutModeViewResetProgressRef.current = 0;
    layoutModeTransitionPulseRef.current = 0;
    setHoveredResourceId(null);
    setSelectedResourceId(null);
    setSelectedCollectionId(null);
    setSelectedPressActive(false);
    setTransitionState("idle");
    layoutModeTransitionProgressRef.current = 0;
    layoutModeTransitionElapsedRef.current = 0;
    setLayoutMode(nextLayoutMode);
    setLayoutModeTransitionState("sinking");
    if (interaction.current) {
      interaction.current.dataset.layoutModeTransitionPhase = "sinking";
      interaction.current.dataset.layoutModeTransitionProgress = "0.000000";
      interaction.current.dataset.layoutModeTransitionPulse = "0.000000";
      interaction.current.dataset.layoutModeViewResetProgress = "0.000000";
      interaction.current.dataset.layoutModeViewResetTargetZoom =
        RESERVOIR_ZOOM_DEFAULT.toFixed(6);
    }
  }

  function beginResourceInspection(
    resourceId: string,
    allowLocatedTransition = false,
  ) {
    if (
      transitionState !== "idle" &&
      !(allowLocatedTransition && transitionState === "locatingResource")
    ) {
      return;
    }

    const resource = getResourceById(resourceId);
    const preservedState = capturePreservedReservoirState(resourceId);
    if (
      !resource ||
      resource.published !== true ||
      !canInspectResource(resource) ||
      !preservedState
    ) {
      return;
    }

    pendingInspectionNavigationTargetRef.current = null;
    openingElapsedRef.current = 0;
    inspectionRecoveryStartTimeRef.current = null;
    inspectionRecoveryHandoffCommittedRef.current = false;
    restorationElapsedRef.current = 0;
    restorationProgressRef.current = 0;
    setInspectedResourceId(resourceId);
    setPreservedReservoirState(preservedState);
    setInspectionFooterReached(false);
    setHoveredResourceId(null);
    setSelectedPressActive(false);
    setTransitionState("openingResource");
    if (interaction.current) {
      interaction.current.dataset.inspectionExitIntent = "close";
      interaction.current.dataset.inspectionExitTarget = "";
    }
  }

  function requestCollection(
    destinationCollectionId: string,
    allowDuringMenuOpen = false,
  ) {
    const destinationContext: ReservoirContext = {
      kind: "collection",
      collectionId: destinationCollectionId,
    };
    if (
      (!allowDuringMenuOpen && inputLocked) ||
      getReservoirContextKey(destinationContext) ===
        layoutOwnership.activeLayout.contextKey ||
      getCollectionById(destinationCollectionId)?.published !== true
    ) {
      return;
    }

    const resolution = pendingCollectionResolutionRef.current;
    if (!resolution) return;

    const preparedDestination = prepareReservoirLayoutState({
      context: destinationContext,
      mode: layoutOwnership.activeLayout.mode,
      surface: surfaceRef.current,
      camera: cameraRef.current,
    });
    if (!preparedDestination) return;
    if (preparedDestination.focalDiagnostics) {
      recordLayoutFocalDiagnostics(preparedDestination.focalDiagnostics);
    }
    if (
      !beginReservoirTransitionPlan({
        kind: "collection",
        source: captureReservoirLayoutState(
          layoutOwnership.activeLayout,
        ),
        destination: preparedDestination.layoutState,
      })
    ) {
      return;
    }

    persistReservoirPresentationForCurrentContext();
    const destinationAdaptiveZoom = getAdaptiveZoomForSnapshot(
      preparedDestination.nodes,
      preparedDestination.layoutState.nodeSizing,
    );
    const destinationZoom = clampReservoirZoom(
      zoomLevelRef.current,
      destinationAdaptiveZoom.activeMaximum,
    );

    zoomLevelRef.current = destinationZoom;
    setZoomLevel(destinationZoom);
    collectionTransitionPoseSnapshotRef.current = {
      sphereQuaternion: sphereRotationRef.current
        ? toQuaternionTuple(sphereRotationRef.current.quaternion)
        : [0, 0, 0, 1],
      zoomLevel: destinationZoom,
    };
    collectionReconstitutionProgressRef.current = 0;
    collectionEmergenceProgressRef.current = 0;
    queryRevisionRef.current += 1;
    setCollectionActivityRevision(queryRevisionRef.current);
    setSelectedSpatialDestinationId(resolution.spatialSelectionId);
    setHoveredResourceId(null);
    setSelectedResourceId(null);
    if (!resolution.spatialSelectionId) setSelectedCollectionId(null);
    setSelectedPressActive(false);
    setCollectionNavigation({
      activeCollectionId: collectionNavigation.activeCollectionId,
      destinationCollectionId,
      transitionPhase: "deactivating",
    });
    setTransitionState("reconstitutingCollection");

    if (interaction.current) {
      interaction.current.dataset.collectionRequestedDestination =
        destinationCollectionId;
      interaction.current.dataset.collectionRequestModel =
        "active-destination";
      interaction.current.dataset.collectionTransitionGeometry =
        "fixed-reservoir";
      interaction.current.dataset.collectionDepthAffectsGeometry = "false";
    }
  }

  function requestAncestorCollection(targetCollectionId: string) {
    if (inputLocked || collectionHistory.length <= 1) return;
    const targetHistoryIndex = collectionHistory.findIndex(
      (frame) => frame.collectionId === targetCollectionId,
    );
    if (
      targetHistoryIndex < 0 ||
      targetHistoryIndex >= collectionHistory.length - 1
    ) {
      return;
    }

    pendingCollectionResolutionRef.current = {
      history: collectionHistory.slice(0, targetHistoryIndex + 1),
      spatialSelectionId: null,
    };
    persistReservoirPresentationForCurrentContext();
    requestCollection(targetCollectionId);
  }

  function beginCollectionEntry(collectionId: string) {
    if (
      inputLocked ||
      selectedCollectionId !== collectionId ||
      interaction.current?.dataset.selectedCollectionSettled !== "true" ||
      !activeReservoirNodes.some(
        (node) => node.kind === "collection" && node.id === collectionId,
      )
    ) {
      return;
    }

    pendingCollectionResolutionRef.current = {
      history: [...collectionHistory, { collectionId }],
      spatialSelectionId: collectionId,
    };
    requestCollection(collectionId);
  }


  function endDrag(
    event: PointerEvent<HTMLDivElement>,
    allowSelection = true,
  ) {
    if (event.pointerType === "touch") {
      activeTouchPointersRef.current.delete(event.pointerId);
      if (activeTouchPointersRef.current.size < 2) {
        pinchDistanceRef.current = null;
      }
      if (pinchActiveRef.current) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.current = null;
        setIsDragging(false);
        setSelectedPressActive(false);
        if (activeTouchPointersRef.current.size === 0) {
          pinchActiveRef.current = false;
        }
        return;
      }
    }
    if (drag.current?.pointerId !== event.pointerId) return;

    const completedDrag = drag.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setIsDragging(false);
    setSelectedPressActive(false);
    interactionRevisionRef.current += 1;
    if (
      allowSelection &&
      completedDrag.maxTravelSquared <= NODE_CLICK_MAX_TRAVEL ** 2
    ) {
      const pickedNode = pickReservoirNode(event.clientX, event.clientY);
      if (pickedNode?.kind === "collection") {
        if (pickedNode.id === selectedCollectionId) {
          beginCollectionEntry(pickedNode.id);
        } else {
          if (interaction.current) {
            interaction.current.dataset.selectedCollectionSettled = "false";
          }
          setTransitionState("idle");
          setSelectedResourceId(null);
          setSelectedCollectionId(pickedNode.id);
        }
      } else if (pickedNode) {
        const resourceNode = activeReservoirResources.find(
          (node) => node.id === pickedNode.id,
        );
        if (!resourceNode) return;
        const selectionAction = getReservoirResourceSelectionAction(
          resourceNode,
          selectedResourceId,
        );
        if (selectionAction === "open-resource-inspection") {
          beginResourceInspection(resourceNode.id);
        } else if (selectionAction === "unsupported-resource-inspection") {
          if (interaction.current) {
            interaction.current.dataset.resourceInspectionUnsupported =
              resourceNode.id;
            interaction.current.dataset.resourceInspectionUnsupportedKind =
              resourceNode.inspectionKind;
          }
        } else {
          setTransitionState("idle");
          setSelectedCollectionId(null);
          setSelectedResourceId(resourceNode.id);
        }
      } else {
        setTransitionState("idle");
        setSelectedResourceId(null);
        setSelectedCollectionId(null);
      }
    }
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      activeTouchPointersRef.current.delete(event.pointerId);
      if (activeTouchPointersRef.current.size < 2) {
        pinchDistanceRef.current = null;
      }
      if (activeTouchPointersRef.current.size === 0) {
        pinchActiveRef.current = false;
      }
    }
    if (drag.current?.pointerId !== event.pointerId) return;

    drag.current = null;
    setIsDragging(false);
    setSelectedPressActive(false);
  }

  function clearPointer() {
    if (!drag.current) pointer.current = null;
    interactionRevisionRef.current += 1;
  }

  function getNormalizedWheelDelta(
    event: Pick<WheelEvent<HTMLElement>, "currentTarget" | "deltaMode" | "deltaY">,
  ) {
    const deltaScale =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? event.currentTarget.clientHeight
          : 1;
    return clamp(
      event.deltaY * deltaScale,
      -MAX_WHEEL_DELTA,
      MAX_WHEEL_DELTA,
    );
  }

  function isFooterTriggerVicinity(clientY: number) {
    const panel = document.querySelector<HTMLElement>(
      ".reservoir-control-panel",
    );
    const menu = document.querySelector<HTMLElement>(
      ".reservoir-menu-reveal",
    );
    const panelTop = panel?.getBoundingClientRect().top ?? window.innerHeight;
    const menuTop = menuActive
      ? menu?.getBoundingClientRect().top ?? panelTop
      : panelTop;
    return clientY >= Math.min(panelTop, menuTop) - FOOTER_TRIGGER_OVERSCAN;
  }

  function consumeFooterWheel(
    event: WheelEvent<HTMLElement>,
    fromBottomInterface: boolean,
  ) {
    const normalizedDelta = getNormalizedWheelDelta(event);

    if (footerTransitionActive) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }

    if (footerVisible) {
      event.preventDefault();
      event.stopPropagation();
      if (normalizedDelta < 0 && footerState === "open") {
        setFooterState("closing");
      }
      return true;
    }

    const eligible =
      fromBottomInterface || isFooterTriggerVicinity(event.clientY);
    if (normalizedDelta > 0 && eligible) {
      event.preventDefault();
      event.stopPropagation();
      setFooterState("opening");
      return true;
    }

    return false;
  }

  function handleBottomInterfaceWheel(event: WheelEvent<HTMLElement>) {
    consumeFooterWheel(event, true);
  }

  function handleMenuOutsideWheel(event: WheelEvent<HTMLElement>) {
    consumeFooterWheel(event, false);
  }

  function updateReservoirZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (consumeFooterWheel(event, false)) return;
    if (inputLocked) return;
    interactionRevisionRef.current += 1;
    const normalizedDelta = getNormalizedWheelDelta(event);
    setReservoirZoom(
      zoomLevelRef.current +
        normalizedDelta * RESERVOIR_WHEEL_ZOOM_RATE,
    );
  }

  function updateResourceHover(resourceId: string, hovered: boolean) {
    if (inputLocked || !surfacedNodeIds.has(resourceId)) return;
    setHoveredResourceId((currentResourceId) => {
      if (hovered) return resourceId;
      return currentResourceId === resourceId ? null : currentResourceId;
    });
  }

  function openReservoirMenu() {
    if (
      transitionState !== "idle" ||
      menuState !== "closed" ||
      footerTransitionActive
    ) {
      return;
    }

    setHoveredResourceId(null);
    setSelectedPressActive(false);
    setMenuState("opening");
  }

  function closeReservoirMenu() {
    if (menuState !== "opening" && menuState !== "open") return;
    setMenuState("closing");
  }

  function selectExploreFilter(filter: ActiveExploreFilter) {
    if (
      menuState !== "open" ||
      queryActivityRevision !== null ||
      filter === activeExploreFilter
    ) {
      return;
    }

    const targetVisibleIds = getExploreNodeIds(activeReservoirNodes, filter);
    const currentVisibleIds = new Set(
      queryReservoirContext?.kind === "query"
        ? queryVisibleNodeIds
        : getExploreNodeIds(activeReservoirNodes, activeExploreFilter),
    );
    const leaving = new Set(
      [...currentVisibleIds].filter((id) => !targetVisibleIds.has(id)),
    );
    const staying = new Set(
      [...currentVisibleIds].filter((id) => targetVisibleIds.has(id)),
    );
    const entering = new Set(
      [...targetVisibleIds].filter((id) => !currentVisibleIds.has(id)),
    );

    if (targetVisibleIds.size === 0) {
      queryRevisionRef.current += 1;
      setQueryReconciliation(null);
      setQueryActivityMode("empty");
      setRejectedExploreFilter(filter);
      setQueryActivityRevision(queryRevisionRef.current);
      return;
    }

    queryRevisionRef.current += 1;
    setQueryVisibleNodeIds(targetVisibleIds);
    setQueryReconciliation({
      entering,
      leaving,
      staying,
      target: targetVisibleIds,
    });
    setQueryActivityMode("success");
    setRejectedExploreFilter(null);
    setQueryActivityRevision(queryRevisionRef.current);
    setActiveExploreFilter(filter);
    setHoveredResourceId((currentHoveredResourceId) =>
      currentHoveredResourceId &&
      targetVisibleIds.has(currentHoveredResourceId)
        ? currentHoveredResourceId
        : null,
    );
    const selectedNodeId = selectedResourceId ?? selectedCollectionId;
    const preserveSelection =
      selectedNodeId !== null && targetVisibleIds.has(selectedNodeId);
    if (!preserveSelection) {
      setSelectedResourceId(null);
      setSelectedCollectionId(null);
      setSelectedPressActive(false);
    }
  }

  function requestQueryReservoirContext(
    destinationContext: ReservoirContext,
  ) {
    if (
      queryActivityRevision !== null ||
      layoutOwnership.transitionPlan
    ) {
      return false;
    }

    const sourceContext = queryReservoirContext ?? collectionReservoirContext;
    const sourceVisibleIds =
      sourceContext.kind === "query"
        ? new Set(queryVisibleNodeIds)
        : getExploreNodeIds(
            getReservoirContextNodes(sourceContext),
            activeExploreFilter,
          );
    const preparedDestination = prepareReservoirLayoutState({
      context: destinationContext,
      mode: layoutOwnership.activeLayout.mode,
      surface: surfaceRef.current,
      camera: cameraRef.current,
    });
    if (!preparedDestination) return false;
    if (
      preparedDestination.focalDiagnostics &&
      preparedDestination.layoutState.mode === "focused"
    ) {
      recordLayoutFocalDiagnostics(preparedDestination.focalDiagnostics);
    }
    if (
      !beginReservoirTransitionPlan({
        kind: "query",
        source: captureReservoirLayoutState(
          layoutOwnership.activeLayout,
        ),
        destination: preparedDestination.layoutState,
      })
    ) {
      return false;
    }

    persistReservoirPresentationForCurrentContext();
    const destinationAdaptiveZoom = getAdaptiveZoomForSnapshot(
      preparedDestination.nodes,
      preparedDestination.layoutState.nodeSizing,
    );
    const destinationZoom = clampReservoirZoom(
      zoomLevelRef.current,
      destinationAdaptiveZoom.activeMaximum,
    );
    zoomLevelRef.current = destinationZoom;
    setZoomLevel(destinationZoom);
    queryReservoirTransitionProgressRef.current = 0;
    setQueryReservoirTransitionPhase("deactivating");

    const targetVisibleIds = new Set(
      preparedDestination.nodes.map((node) => node.id),
    );
    queryRevisionRef.current += 1;
    setQueryReservoirTransitionContext(destinationContext);
    setQueryVisibleNodeIds(sourceVisibleIds);
    setQueryReconciliation({
      entering: new Set(
        [...targetVisibleIds].filter((id) => !sourceVisibleIds.has(id)),
      ),
      leaving: new Set(
        [...sourceVisibleIds].filter((id) => !targetVisibleIds.has(id)),
      ),
      staying: new Set(
        [...sourceVisibleIds].filter((id) => targetVisibleIds.has(id)),
      ),
      target: targetVisibleIds,
    });
    setQueryActivityMode("success");
    setRejectedExploreFilter(null);
    setQueryActivityRevision(queryRevisionRef.current);
    return true;
  }

  function requestDirectResource(resourceAddress: string) {
    const resource = getResourceByAddress(resourceAddress);
    if (!resource || resource.published !== true) {
      if (interaction.current) {
        interaction.current.dataset.directResourceRequest = resourceAddress;
        interaction.current.dataset.directResourceRequestResult = resource
          ? "rejected-unpublished"
          : "rejected-unknown";
      }
      return false;
    }

    pendingInspectionNavigationTargetRef.current = null;
    const returnContext = queryReservoirContext ?? collectionReservoirContext;
    const targetContext: ReservoirContext = {
      kind: "query",
      resultIds: [resource.id],
      returnContext,
    };
    if (!requestQueryReservoirContext(targetContext)) return false;

    setSelectedCollectionId(null);
    setSelectedResourceId(null);
    setHoveredResourceId(null);
    setSelectedPressActive(false);
    setLocatingResourceId(resource.id);
    inspectionRecoveryStartTimeRef.current = null;
    inspectionRecoveryHandoffCommittedRef.current = false;
    restorationElapsedRef.current = 0;
    restorationProgressRef.current = 0;
    setTransitionState("idle");
    pendingCollectionResolutionRef.current = null;
    if (interaction.current) {
      interaction.current.dataset.inspectionExitIntent = "";
      interaction.current.dataset.inspectionExitTarget = "";
      interaction.current.dataset.directResourceRequest = resourceAddress;
      interaction.current.dataset.directResourceRequestResult = "accepted";
      interaction.current.dataset.directResourceResolvedId = resource.id;
      interaction.current.dataset.directResourceArtifactStatus = String(
        resource.isArtifact,
      );
    }
    return true;
  }
  requestDirectResourceRef.current = requestDirectResource;

  function selectDirectArtifact(directArtifactId: DirectArtifactId) {
    if (menuState !== "open" || queryActivityRevision !== null) return;
    if (directArtifactId === "contact") {
      if (interaction.current) {
        interaction.current.dataset.directContactAction = "ui-only";
      }
      setHoveredResourceId(null);
      setSelectedResourceId(null);
      setSelectedCollectionId(null);
      setSelectedPressActive(false);
      setTransitionState("idle");
      setMenuState("closing");
      return;
    }

    const resourceAddress = DIRECT_ARTIFACT_TARGETS.get(directArtifactId);
    if (!resourceAddress || !requestDirectResource(resourceAddress)) return;
    setMenuState("closing");
  }

  return (
    <>
      <div
        className="reservoir-control-panel"
        aria-hidden="true"
        data-menu-state={menuState}
        data-footer-state={footerState}
      />
      <div
        className="reservoir-control-state"
        aria-hidden="true"
        data-secondary-dimmed={secondaryControlsDimmed}
      />
      <ReservoirMenu
        activeFilter={activeExploreFilter}
        controlsLocked={queryTransitionActive || collectionContextTransition}
        state={menuState}
        onClose={closeReservoirMenu}
        onDirectSelect={selectDirectArtifact}
        onFilterSelect={selectExploreFilter}
        onOpen={openReservoirMenu}
        onInterfaceWheel={handleBottomInterfaceWheel}
        onOutsideWheel={handleMenuOutsideWheel}
      />
      <ReservoirFooter
        state={footerState}
        onInterfaceWheel={handleBottomInterfaceWheel}
      />
      <AtmosphereContent
        containerRef={atmosphereRef}
        activeCollection={activeCollection}
        selectedResource={selectedResource}
        selectedCollection={selectedCollection}
      />
      <CollectionNavigation
        ancestors={visibleCollectionAncestors}
        depth={collectionHistory.length - 1}
        disabled={inputLocked}
        showHome={showHomeNavigation}
        showBack={showBackNavigation}
        onAncestorSelect={requestAncestorCollection}
        onBack={() => {
          if (queryReservoirContext?.kind === "query") {
            if (queryReservoirContext.returnContext.kind === "collection") {
              pendingCollectionResolutionRef.current = {
                history: collectionHistory,
                spatialSelectionId: null,
              };
              requestCollection(
                queryReservoirContext.returnContext.collectionId,
              );
            } else {
              requestQueryReservoirContext(queryReservoirContext.returnContext);
            }
            return;
          }
          const previousCollectionId = collectionHistory.at(-2)?.collectionId;
          if (previousCollectionId) {
            requestAncestorCollection(previousCollectionId);
          }
        }}
        onHome={() => {
          const homeCollectionId = collectionHistory[0]?.collectionId;
          if (homeCollectionId && queryReservoirContext) {
            pendingCollectionResolutionRef.current = {
              history: [{ collectionId: homeCollectionId }],
              spatialSelectionId: null,
            };
            requestCollection(homeCollectionId);
          } else if (homeCollectionId) {
            requestAncestorCollection(homeCollectionId);
          }
        }}
      />
      <ReservoirLayoutModeSwitch
        disabled={layoutModeControlDisabled}
        mode={layoutMode}
        onChange={requestLayoutMode}
      />
      <section className="sr-only" aria-label="Reservoir objects">
        <h1>{activeCollection.title} collection</h1>
        <p>
          An interactive reservoir containing {activeReservoirArtifacts.length}{" "}
          {activeReservoirArtifacts.length === 1 ? "artifact" : "artifacts"},{" "}
          {activeReservoirNonArtifactResources.length}{" "}
          {activeReservoirNonArtifactResources.length === 1
            ? "resource"
            : "resources"}, and {activeReservoirChildCollections.length} dormant{" "}
          {activeReservoirChildCollections.length === 1
            ? "collection"
            : "collections"}.
        </p>
        <ul>
          {activeReservoirArtifacts.map((artifact) => (
            <li key={artifact.id}>
              Artifact {artifact.type}: {artifact.title}
            </li>
          ))}
          {activeReservoirNonArtifactResources.map((resource) => (
            <li key={resource.id}>
              Resource {resource.type}: {resource.title}
            </li>
          ))}
          {activeReservoirChildCollections.map((collection) => (
            <li key={collection.id}>Collection: {collection.title}</li>
          ))}
        </ul>
      </section>
      <div
      ref={interaction}
      className="reservoir-interaction"
      aria-hidden={inspectionWindowPhase !== null}
      data-dragging={isDragging}
      data-aspect-ratio={(viewportFrame.width / viewportFrame.height).toFixed(3)}
      data-camera-model="stable-reference"
      data-zoom-model="reservoir-scale"
      data-zoom-level={zoomLevel.toFixed(6)}
      data-zoom-min={RESERVOIR_ZOOM_MIN.toFixed(3)}
      data-zoom-max={reservoirZoomMaximum.toFixed(3)}
      data-zoom-baseline-max={activeAdaptiveZoom.baselineMaximum.toFixed(3)}
      data-zoom-hard-max={activeAdaptiveZoom.absoluteMaximum.toFixed(3)}
      data-zoom-transform-safe-max={activeAdaptiveZoom.transformSafeMaximum.toFixed(3)}
      data-zoom-required-for-inspectability={activeAdaptiveZoom.requiredZoom.toFixed(3)}
      data-zoom-active-max={activeAdaptiveZoom.activeMaximum.toFixed(3)}
      data-zoom-inspectable-target-px={RESERVOIR_NODE_INSPECTABLE_TARGET_PX.toFixed(3)}
      data-zoom-target-reachable={String(activeAdaptiveZoom.targetReachable)}
      data-zoom-smallest-node-kind={activeAdaptiveZoom.smallestNodeKind ?? ""}
      data-zoom-smallest-node-world-diameter={activeAdaptiveZoom.smallestNodeWorldDiameter.toFixed(6)}
      data-zoom-smallest-node-px-at-baseline={activeAdaptiveZoom.projectedNodePixelsAtBaseline.toFixed(3)}
      data-zoom-smallest-node-px-at-active-max={activeAdaptiveZoom.projectedNodePixelsAtActiveMaximum.toFixed(3)}
      data-label-model="adaptive-projective"
      data-label-level-inspection-node-enter={RESERVOIR_LABEL_LEVEL.inspection.nodePixels.enter.toFixed(3)}
      data-label-level-inspection-node-exit={RESERVOIR_LABEL_LEVEL.inspection.nodePixels.exit.toFixed(3)}
      data-label-level-persistent-node-enter={RESERVOIR_LABEL_LEVEL.persistent.nodePixels.enter.toFixed(3)}
      data-label-level-persistent-node-exit={RESERVOIR_LABEL_LEVEL.persistent.nodePixels.exit.toFixed(3)}
      data-label-level-hysteresis="true"
      data-label-far-hover-reveal="false"
      data-reservoir-base-scale={baseScale.toFixed(6)}
      data-reservoir-safe-zones={[
        reservoirFrame.safeZones.top,
        reservoirFrame.safeZones.right,
        reservoirFrame.safeZones.bottom,
        reservoirFrame.safeZones.left,
      ].map((value) => value.toFixed(3)).join(",")}
      data-reservoir-usable-frame={[
        reservoirFrame.usableWidth,
        reservoirFrame.usableHeight,
      ].map((value) => value.toFixed(3)).join(",")}
      data-reservoir-center-screen={[
        reservoirFrame.centerScreenX,
        reservoirFrame.centerScreenY,
      ].map((value) => value.toFixed(3)).join(",")}
      data-node-layout-mode={renderedLayoutMode}
      data-node-layout-model={
        renderedLayoutMode === "focused"
          ? "continuous-sphere-cap"
          : "continuous-sphere-fibonacci"
      }
      data-node-layout-seed={renderedReservoirSeed}
      data-node-layout-count={activeReservoirLayout.size}
      data-node-layout-directions={activeReservoirLayoutDiagnostics.entries
        .map(([nodeId, direction]) =>
          `${nodeId}:${direction.map((value) => value.toFixed(9)).join("/")}`,
        )
        .join(",")}
      data-node-layout-invalid-direction-ids={
        activeReservoirLayoutDiagnostics.invalidDirectionIds.join(",")
      }
      data-node-layout-min-direction-length={
        activeReservoirLayoutDiagnostics.minimumDirectionLength.toFixed(9)
      }
      data-node-layout-max-direction-length={
        activeReservoirLayoutDiagnostics.maximumDirectionLength.toFixed(9)
      }
      data-node-layout-minimum-angular-separation={
        activeReservoirLayoutDiagnostics.minimumAngularSeparation.toFixed(9)
      }
      data-node-layout-target-angular-separation={
        activeReservoirLayoutDiagnostics.minimumAngularSeparationTarget.toFixed(
          9,
        )
      }
      data-node-layout-cap-angular-radius={
        renderedLayoutMode === "focused"
          ? focusedLayoutCapRadius.toFixed(9)
          : ""
      }
      data-node-layout-focal-direction={
        renderedLayoutMode === "focused"
          ? focusedLayoutFocalDirection
            ? focusedLayoutFocalDirection
                .map((value) => value.toFixed(6))
                .join("/")
            : ""
          : ""
      }
      data-node-layout-strategy={
        renderedLayoutMode === "focused"
          ? "population-aware-seeded-cap-maximin"
          : "population-aware-seeded-maximin"
      }
      data-query-placement-policy={
        resolvedLayoutState.placementPolicy ===
        "canonical-focal-single-result"
          ? "canonical-focal"
          : "normal"
      }
      data-query-result-count={
        resolvedLayoutState.queryPlacementDiagnostics
          ? String(resolvedLayoutState.queryPlacementDiagnostics.resultCount)
          : ""
      }
      data-query-canonical-focal-direction={
        resolvedLayoutState.queryPlacementDiagnostics?.canonicalFocalDirection
          ? resolvedLayoutState.queryPlacementDiagnostics.canonicalFocalDirection
              .map((value) => value.toFixed(6))
              .join("/")
          : ""
      }
      data-query-canonical-focal-error-degrees={
        resolvedLayoutState.queryPlacementDiagnostics
          ? resolvedLayoutState.queryPlacementDiagnostics.canonicalFocalErrorDegrees.toFixed(
              6,
            )
          : ""
      }
      data-layout-mode-view-reset-progress={layoutModeViewResetProgressRef.current.toFixed(
        6,
      )}
      data-layout-mode-view-reset-target-zoom={layoutModeResetTargetZoomRef.current.toFixed(
        6,
      )}
      data-layout-mode-focal-assertions={
        layoutModeFocalDiagnostics?.assertionsPassed ?? false
      }
      data-layout-mode-focal-front-world={
        layoutModeFocalDiagnostics
          ? formatDirectionTuple(layoutModeFocalDiagnostics.frontWorld)
          : ""
      }
      data-layout-mode-focal-up-tangent-world={
        layoutModeFocalDiagnostics
          ? formatDirectionTuple(layoutModeFocalDiagnostics.upTangentWorld)
          : ""
      }
      data-layout-mode-focal-target-world={
        layoutModeFocalDiagnostics
          ? formatDirectionTuple(layoutModeFocalDiagnostics.targetWorld)
          : ""
      }
      data-layout-mode-focal-target-local={
        layoutModeFocalDiagnostics
          ? formatDirectionTuple(layoutModeFocalDiagnostics.targetLocal)
          : ""
      }
      data-layout-mode-focal-round-trip-world={
        layoutModeFocalDiagnostics
          ? formatDirectionTuple(layoutModeFocalDiagnostics.roundTripWorld)
          : ""
      }
      data-layout-mode-focal-round-trip-angle-degrees={
        layoutModeFocalDiagnostics?.roundTripAngleDegrees.toFixed(6) ?? ""
      }
      data-layout-mode-focal-round-trip-front-dot={
        layoutModeFocalDiagnostics?.roundTripFrontDot.toFixed(6) ?? ""
      }
      data-layout-mode-focal-round-trip-up-dot={
        layoutModeFocalDiagnostics?.roundTripUpDot.toFixed(6) ?? ""
      }
      data-layout-mode-focused-layout-centroid-error-degrees={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidErrorDegrees.toFixed(
          6,
        ) ?? ""
      }
      data-layout-mode-focused-layout-centroid-world-error-degrees={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidWorldErrorDegrees.toFixed(
          6,
        ) ?? ""
      }
      data-layout-mode-focused-layout-centroid-front-angle-degrees={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidFrontAngleDegrees.toFixed(
          6,
        ) ?? ""
      }
      data-layout-mode-focused-layout-centroid-front-dot={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidFrontDot.toFixed(6) ??
        ""
      }
      data-layout-mode-focused-layout-centroid-up-dot={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidUpDot.toFixed(6) ?? ""
      }
      data-layout-mode-focused-layout-centroid-assertions={
        layoutModeFocalDiagnostics?.focusedLayoutCentroidAssertionsPassed ??
        false
      }
      data-node-sizing-reference-population={
        RESERVOIR_NODE_SIZING_REFERENCE_POPULATION
      }
      data-node-sizing-raw-scale={
        activeReservoirNodeSizingTargets.rawScale.toFixed(6)
      }
      data-node-sizing-artifact-reference-diameter={
        activeReservoirNodeSizingTargets.artifactReferenceDiameter.toFixed(6)
      }
      data-node-sizing-artifact-scale={
        activeReservoirNodeSizingTargets.artifactScale.toFixed(6)
      }
      data-node-sizing-artifact-desired-diameter={
        activeReservoirNodeSizingTargets.desiredArtifactDiameter.toFixed(6)
      }
      data-node-sizing-collection-reference-diameter={
        activeReservoirNodeSizingTargets.collectionReferenceDiameter.toFixed(6)
      }
      data-node-sizing-collection-scale={
        activeReservoirNodeSizingTargets.collectionScale.toFixed(6)
      }
      data-node-sizing-collection-desired-diameter={
        activeReservoirNodeSizingTargets.desiredCollectionDiameter.toFixed(6)
      }
      data-node-radius={activeNodeSizing.artifactRadius.toFixed(6)}
      data-node-diameter={activeNodeSizing.artifactDiameter.toFixed(6)}
      data-collection-node-radius={activeNodeSizing.collectionRadius.toFixed(6)}
      data-collection-node-diameter={activeNodeSizing.collectionDiameter.toFixed(6)}
      data-node-sizing-population-count={activeNodeSizing.populationCount}
      data-node-sizing-density-progress={activeNodeSizing.densityProgress.toFixed(6)}
      data-node-sizing-layout-safety-scale={activeNodeSizing.layoutSafetyScale.toFixed(6)}
      data-node-sizing-minimum-angular-separation={activeNodeSizing.minimumAngularSeparation.toFixed(9)}
      data-node-sizing-minimum-surface-distance={activeNodeSizing.minimumSurfaceDistance.toFixed(9)}
      data-node-sizing-maximum-safe-diameter={activeNodeSizing.maximumSafeDiameter.toFixed(9)}
      data-active-layout-source={activeLayoutSource}
      data-active-layout-context-key={layoutOwnership.activeLayout.contextKey}
      data-rendered-layout-context-key={resolvedLayoutState.contextKey}
      data-transition-plan-active={transitionPlan !== null}
      data-transition-kind={transitionPlan?.kind ?? ""}
      data-transition-source-context-key={
        transitionPlan?.source.contextKey ?? ""
      }
      data-transition-destination-context-key={
        transitionPlan?.destination.contextKey ?? ""
      }
      data-active-collection-id={collectionNavigation.activeCollectionId}
      data-rendered-active-collection-id={renderedActiveCollectionId}
      data-destination-collection-id={
        collectionNavigation.destinationCollectionId ?? ""
      }
      data-collection-transition-phase={
        collectionNavigation.transitionPhase
      }
      data-collection-transition-model="active-destination"
      data-collection-reservoir-count="1"
      data-collection-camera-choreography="none"
      data-collection-orientation-choreography="preserve-current-quaternion"
      data-collection-history={collectionHistory
        .map((frame) => frame.collectionId)
        .join(",")}
      data-collection-depth={collectionHistory.length - 1}
      data-selected-spatial-destination={
        selectedSpatialDestinationId ?? ""
      }
      data-collection-entry-retraction-started={
        collectionNavigation.transitionPhase === "deactivating" &&
        selectedSpatialDestinationId !== null
      }
      data-collection-reconstitution-progress={collectionReconstitutionProgressRef.current.toFixed(
        6,
      )}
      data-collection-child-emergence-progress={collectionEmergenceProgressRef.current.toFixed(
        6,
      )}
      data-collection-child-count={activeReservoirNodes.length}
      data-active-collection-render-state="active"
      data-embedded-collection-render-state="dormant"
      data-reservoir-node-count={reservoirNodeDiagnostics.nodeCount}
      data-collection-count={reservoirNodeDiagnostics.collectionCount}
      data-collection-ids={reservoirNodeDiagnostics.collectionIds.join(",")}
      data-reservoir-node-ids={reservoirNodeDiagnostics.nodeIds.join(",")}
      data-duplicate-node-ids={
        reservoirNodeDiagnostics.duplicateNodeIds.join(",")
      }
      data-density-test-mode="false"
      data-resource-count={activeReservoirResources.length}
      data-non-artifact-resource-count={activeReservoirNonArtifactResources.length}
      data-resource-ids={activeReservoirResources.map((resource) => resource.id).join(",")}
      data-query-result-node-kinds={activeReservoirNodes.map((node) => `${node.id}:${node.kind}`).join(",")}
      data-artifact-count={activeReservoirArtifacts.length}
      data-temporary-artifact-count={0}
      data-artifact-ids={activeReservoirArtifacts.map((artifact) => artifact.id).join(",")}
      data-selected-resource={selectedResourceId ?? ""}
      data-selected-artifact={selectedResource?.isArtifact ? selectedResource.id : ""}
      data-selected-collection={selectedCollectionId ?? ""}
      data-selected-node-kind={
        selectedResource
          ? selectedResource.isArtifact
            ? "artifact"
            : "resource"
          : selectedCollectionId
            ? "collection"
            : ""
      }
      data-selected-node-id={selectedResourceId ?? selectedCollectionId ?? ""}
      data-transition-state={transitionState}
      data-layout-mode={layoutMode}
      data-rendered-layout-mode={renderedLayoutMode}
      data-layout-switch-state={layoutModeTransitionState}
      data-layout-switch-target={layoutMode}
      data-layout-switch-progress={layoutModeTransitionProgressRef.current.toFixed(
        6,
      )}
      data-menu-state={menuState}
      data-footer-state={footerState}
      data-footer-visible={footerVisible}
      data-footer-transition-active={footerTransitionActive}
      data-active-explore-filter={activeExploreFilter}
      data-query-reservoir-transition-phase={queryReservoirTransitionPhase}
      data-query-reservoir-transition-progress={
        queryReservoirTransitionProgressRef.current.toFixed(6)
      }
      data-query-transition-active={queryTransitionActive}
      data-query-activity-revision={queryActivityRevision ?? ""}
      data-query-activity-mode={queryActivityMode ?? ""}
      data-query-rejected-filter={rejectedExploreFilter ?? ""}
      data-query-preserved-filter={
        rejectedExploreFilter ? activeExploreFilter : ""
      }
      data-query-meaningful-result-policy="semantic-object-address"
      data-query-membership-required="false"
      data-surfaced-node-ids={[...surfacedNodeIds].join(",")}
      data-query-visible-node-ids={[...queryVisibleNodeIds].join(",")}
      data-query-leaving-node-ids={[
        ...(queryReconciliation?.leaving ?? []),
      ].join(",")}
      data-query-staying-node-ids={[
        ...(queryReconciliation?.staying ?? []),
      ].join(",")}
      data-query-entering-node-ids={[
        ...(queryReconciliation?.entering ?? []),
      ].join(",")}
      data-locating-resource={locatingResourceId ?? ""}
      data-locating-artifact={
        locatingResourceId && getArtifactById(locatingResourceId)
          ? locatingResourceId
          : ""
      }
      data-inspected-resource={inspectedResourceId ?? ""}
      data-resource-inspection-kind={openingResource?.inspectionKind ?? ""}
      data-inspection-phase={inspectionWindowPhase ?? ""}
      data-inspected-artifact-status={openingResource?.isArtifact ?? ""}
      data-opening-artifact={openingResource?.isArtifact ? openingResource.id : ""}
      data-opening-complete={
        transitionState !== "idle" && transitionState !== "openingResource"
      }
      data-input-locked={inputLocked}
      data-content-open={inspectionWindowPhase !== null}
      data-atmosphere-bottom={atmosphereBottom.toFixed(3)}
      data-artifact-window-atmosphere-gap="clamp(24px, 3.2vw, 48px)"
      data-reading-mode={transitionState === "readingInspection"}
      data-inspection-footer-reached={inspectionFooterReached}
      data-artifact-footer-reached={inspectionFooterReached}
      data-restoring={restoring}
      data-resource-content-ready={openingResource !== null}
      data-prepared-content-resource={openingResource?.id ?? ""}
      data-artifact-content-ready={openingResource?.isArtifact === true}
      data-prepared-content-artifact={openingResource?.isArtifact ? openingResource.id : ""}
      data-prepared-content-title={openingResource?.title ?? ""}
      data-opening-reaction-order={[...inspectionReactionDistances.entries()]
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
        .map(([artifactId, distance]) => `${artifactId}:${distance}`)
        .join(",")}
      data-preopen-sphere-quaternion={
        preservedReservoirState?.sphereQuaternion.join(",") ?? ""
      }
      data-preopen-zoom-level={
        preservedReservoirState?.zoomLevel.toFixed(6) ?? ""
      }
      data-hovered-resource={hoveredResourceId ?? ""}
      data-hovered-artifact={
        hoveredResourceId && getArtifactById(hoveredResourceId)
          ? hoveredResourceId
          : ""
      }
      data-node-click-max-travel={NODE_CLICK_MAX_TRAVEL}
      data-drag-sensitivity={DRAG_SENSITIVITY.toFixed(7)}
      data-camera-position={`0,0,${CAMERA_DISTANCE.toFixed(3)}`}
      data-camera-target="0,0,0"
      data-rotation={`${rotationDiagnostics.euler[0].toFixed(3)},${rotationDiagnostics.euler[1].toFixed(3)}`}
      data-rotation-euler={rotationDiagnostics.euler
        .map((value) => value.toFixed(6))
        .join(",")}
      data-rotation-quaternion={rotationDiagnostics.quaternion
        .map((value) => value.toFixed(6))
        .join(",")}
      data-sphere-position={`0,${centerWorldY.toFixed(6)},0`}
      onPointerDown={beginDrag}
      onPointerMove={updatePointer}
      onPointerLeave={clearPointer}
      onPointerUp={endDrag}
      onPointerCancel={(event) => endDrag(event, false)}
      onLostPointerCapture={handleLostPointerCapture}
      onWheel={updateReservoirZoom}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [0, 0, CAMERA_DISTANCE],
          fov: CAMERA_FOV,
          near: CAMERA_NEAR,
          far: 40,
        }}
        onCreated={({ camera, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          sceneRef.current = scene;
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        scene={{ background: undefined }}
      >
        <ReservoirCameraBridge
          cameraRef={cameraRef}
          sceneRef={sceneRef}
          onReady={handleCameraReady}
        />
        <color attach="background" args={[RESERVOIR_THEME.environment]} />
        <ambientLight intensity={1.35} />
        <directionalLight position={[-4, 5, 7]} intensity={2.25} />
        <directionalLight position={[5, -3, 4]} intensity={0.45} />
        <ReservoirTransform
          baseScale={baseScale}
          centerWorldY={centerWorldY}
          diagnosticsRef={interaction}
          reducedMotion={reducedMotion}
          transformRef={reservoirTransformRef}
          zoomLevel={zoomLevel}
          renderedZoomRef={renderedZoomRef}
          renderedScaleRef={renderedScaleRef}
        >
          <ReservoirOrientation
            composition={activeInitialComposition}
            diagnosticsRef={interaction}
            layoutMode={renderedLayoutMode}
            layoutModeTransitionState={layoutModeTransitionState}
            onOrientationApplied={setRotationDiagnostics}
            rotationRef={sphereRotationRef}
          >
            <ReservoirSphere
              activeCollection={activeCollection}
              activeNodes={activeReservoirNodes}
              layout={activeReservoirLayout}
              nodeSizing={activeNodeSizing}
              layoutModeTransitionState={layoutModeTransitionState}
              collectionReconstitutionPhase={
                collectionNavigation.transitionPhase
              }
              collectionReconstitutionProgressRef={
                collectionReconstitutionProgressRef
              }
              queryReservoirTransitionPhase={
                queryReservoirTransitionPhase
              }
              queryReservoirTransitionProgressRef={
                queryReservoirTransitionProgressRef
              }
              layoutModeTransitionElapsedRef={
                layoutModeTransitionElapsedRef
              }
              layoutModeTransitionProgressRef={
                layoutModeTransitionProgressRef
              }
              layoutModeTransitionPulseRef={layoutModeTransitionPulseRef}
              selectedMeshRetractionStarted={
                collectionNavigation.transitionPhase === "deactivating" &&
                selectedSpatialDestinationId !== null
              }
              collectionActivityRevision={collectionActivityRevision}
              surfaceRef={surfaceRef}
              selectedResourceId={selectedResourceId}
              selectedCollectionId={selectedCollectionId}
              hoveredResourceId={hoveredResourceId}
              interactionEnabled={!inputLocked}
              resolvePointerVisibility={resolvePointerVisibility}
              isDragging={isDragging}
              reservoirFrame={reservoirFrame}
              renderedZoomRef={renderedZoomRef}
              selectedPressActive={selectedPressActive}
              surfacedNodeIds={surfacedNodeIds}
              filterVisibleNodeIds={queryVisibleNodeIds}
              locatingResourceId={locatingResourceId}
              continuationCueEnabled={!inputLocked}
              interactionRevisionRef={interactionRevisionRef}
              diagnosticsRef={interaction}
              openingActive={openingActive}
              openingResource={openingResource}
              openingElapsedRef={openingElapsedRef}
              openingReducedMotion={reducedMotion}
              openingReactionDistances={inspectionReactionDistances}
              maximumInspectionReactionDistance={
                maximumInspectionReactionDistance
              }
              restoring={restoring}
              restorationProgressRef={restorationProgressRef}
              emergingChildren={
                collectionNavigation.transitionPhase === "reactivating"
              }
              onResourceHoverChange={updateResourceHover}
              queryActivityRevision={queryActivityRevision}
              queryActivityMode={queryActivityMode}
              onQueryActivityComplete={completeQueryTransition}
            />
          </ReservoirOrientation>
        </ReservoirTransform>
      </Canvas>
      </div>
      {inspectionWindowPhase && openingResource ? (
        <InspectionWindow
          atmosphereBottom={atmosphereBottom}
          exitIntent={
            pendingInspectionNavigationTargetRef.current
              ? "support-resource-navigation"
              : "close"
          }
          resource={openingResource}
          phase={inspectionWindowPhase}
          reducedMotion={reducedMotion}
          onDeployComplete={completeInspectionDeployment}
          onClose={requestInspectionClose}
          onFooterReachedChange={setInspectionFooterReached}
          onNavigateToResource={requestInspectionNavigation}
        />
      ) : null}
    </>
  );
}
