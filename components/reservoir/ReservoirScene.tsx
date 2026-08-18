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
  getReservoirContentNodesBySemanticIds,
  type ReservoirContentNode,
} from "@/lib/content/reservoir-adapter";
import {
  getArtifactById,
  getCollectionById,
} from "@/lib/content/selectors";
import {
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  generateReservoirInitialComposition,
  generateReservoirLayout,
  getReservoirDirectionAngularDistance,
  getReservoirFocusedCapRadius,
  getReservoirLayoutDiagnostics,
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
  getArtifactWindowRetractDuration,
  getReservoirRestoreDuration,
  getReservoirRestoreProgress,
} from "@/lib/reservoir/reading";
import type {
  ActiveExploreFilter,
  DirectArtifactId,
} from "@/types/reservoir";
import type { ReservoirContext } from "@/types/reservoir";
import type { Collection } from "@/types/content";
import { AtmosphereContent } from "./AtmosphereContent";
import { ArtifactWindow } from "./ArtifactWindow";
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
const NODE_VISIBLE_SURFACE_EPSILON = 0.003;
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
  | { kind: "artifact"; id: string }
  | { kind: "collection"; id: string };
type ReservoirTransitionState =
  | "idle"
  | "locatingArtifact"
  | "reconstitutingCollection"
  | "openingArtifact"
  | "deployingArtifact"
  | "readingArtifact"
  | "closingArtifact"
  | "restoringArtifact";

type QuaternionTuple = [number, number, number, number];

type QueryReconciliation = {
  entering: ReadonlySet<string>;
  leaving: ReadonlySet<string>;
  staying: ReadonlySet<string>;
  target: ReadonlySet<string>;
};

type QueryActivityMode = "success" | "empty";

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
  activeExploreFilter: ActiveExploreFilter;
  hoveredArtifactId: string | null;
  selectedArtifactId: string | null;
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
    : `query:${context.resultIds.join(",")}`;
}

function getReservoirContextNodes(context: ReservoirContext) {
  return context.kind === "collection"
    ? getReservoirContentNodes(context.collectionId)
    : getReservoirContentNodesBySemanticIds(context.resultIds);
}

function mergeReservoirNodeSets(
  sourceNodes: readonly ReservoirContentNode[],
  destinationNodes: readonly ReservoirContentNode[],
) {
  const merged = new Map<string, ReservoirContentNode>();
  for (const node of sourceNodes) merged.set(node.id, node);
  for (const node of destinationNodes) merged.set(node.id, node);
  return [...merged.values()];
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
      node.kind === "artifact" ? artifactDiameter : collectionDiameter,
    );
  }
  return diameters;
}

type PreservedReservoirState = {
  artifactId: string;
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
  zoomLevel: number;
};

type RotationDiagnostics = {
  euler: [number, number, number];
  quaternion: [number, number, number, number];
};

type RenderedLayoutSnapshot = {
  collectionId: string;
  mode: ReservoirLayoutMode;
  directions: ReservoirLayout;
  quaternion: QuaternionTuple;
  nodeSizing: ReturnType<typeof getReservoirNodeSizingSnapshot>;
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
    assertionsPassed:
      Math.abs(roundTripAngleDegrees - 15) < 0.05 &&
      roundTripFrontDot > 0 &&
      roundTripUpDot > 0,
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
  collectionId: string;
  composition: ReservoirInitialComposition;
  diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
  layoutMode: ReservoirLayoutMode;
  layoutModeTransitionState: ReservoirLayoutTransitionState;
  onOrientationApplied: (diagnostics: RotationDiagnostics) => void;
  orientationStoreRef: MutableRefObject<Map<string, QuaternionTuple>>;
  rotationRef: MutableRefObject<THREE.Group | null>;
};

function ReservoirOrientation({
  children,
  collectionId,
  composition,
  diagnosticsRef,
  layoutMode,
  layoutModeTransitionState,
  onOrientationApplied,
  orientationStoreRef,
  rotationRef,
}: ReservoirOrientationProps) {
  const groupRef = useRef<THREE.Group | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    if (layoutModeTransitionState !== "idle") {
      rotationRef.current = group;
      return;
    }

    if (layoutMode === "focused") {
      rotationRef.current = group;
      return;
    }

    const preservedOrientation =
      orientationStoreRef.current.get(collectionId);
    const orientation =
      preservedOrientation ??
      ([...composition.quaternion] as QuaternionTuple);
    group.quaternion.set(...orientation).normalize();
    group.updateMatrixWorld();
    rotationRef.current = group;
    orientationStoreRef.current.set(
      collectionId,
      toQuaternionTuple(group.quaternion),
    );
    const diagnostics = getRotationDiagnostics(group.quaternion);
    onOrientationApplied(diagnostics);

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.initialOrientationCollectionId =
        collectionId;
      diagnosticsRef.current.dataset.initialOrientationLayoutMode =
        layoutMode;
      diagnosticsRef.current.dataset.initialOrientationSource =
        preservedOrientation ? "preserved" : "generated";
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
    collectionId,
    composition,
    diagnosticsRef,
    layoutMode,
    layoutModeTransitionState,
    onOrientationApplied,
    orientationStoreRef,
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
  const [queryReservoirContext, setQueryReservoirContext] =
    useState<ReservoirContext | null>(null);
  const [queryReservoirTransitionContext, setQueryReservoirTransitionContext] =
    useState<ReservoirContext | null>(null);
  const [locatingArtifactId, setLocatingArtifactId] = useState<string | null>(
    null,
  );
  const [selectedPressActive, setSelectedPressActive] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
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
  const [hoveredArtifactId, setHoveredArtifactId] = useState<string | null>(
    null,
  );
  const [transitionState, setTransitionState] =
    useState<ReservoirTransitionState>("idle");
  const [openingArtifactId, setOpeningArtifactId] = useState<string | null>(
    null,
  );
  const [preservedReservoirState, setPreservedReservoirState] =
    useState<PreservedReservoirState | null>(null);
  const [artifactFooterReached, setArtifactFooterReached] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [atmosphereBottom, setAtmosphereBottom] = useState(0);
  const interaction = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLElement | null>(null);
  const drag = useRef<DragState | null>(null);
  const queryRevisionRef = useRef(0);
  const layoutModeTransitionProgressRef = useRef(0);
  const layoutModeTransitionElapsedRef = useRef(0);
  const layoutModeViewResetProgressRef = useRef(0);
  const layoutModeTransitionPulseRef = useRef(0);
  const layoutModeTransitionFocusedDirectionRef = useRef<
    ReservoirDirection | null
  >(null);
  const layoutModeSourceSnapshotRef = useRef<RenderedLayoutSnapshot | null>(
    null,
  );
  const layoutModeDestinationSnapshotRef =
    useRef<RenderedLayoutSnapshot | null>(null);
  const layoutModeResetStartZoomRef = useRef(RESERVOIR_ZOOM_DEFAULT);
  const layoutModeResetTargetZoomRef = useRef(RESERVOIR_ZOOM_DEFAULT);
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
  const collectionReconstitutionElapsedRef = useRef(0);
  const collectionEmergenceProgressRef = useRef(1);
  const queryReservoirSnapshotRef =
    useRef<QueryReservoirSelectionSnapshot | null>(null);
  const pendingCollectionResolutionRef =
    useRef<PendingCollectionResolution | null>(null);
  const collectionTransitionPoseSnapshotRef =
    useRef<CollectionTransitionPoseSnapshot | null>(null);
  const collectionTransitionSourceSnapshotRef =
    useRef<RenderedLayoutSnapshot | null>(null);
  const collectionTransitionDestinationSnapshotRef =
    useRef<RenderedLayoutSnapshot | null>(null);
  const collectionOrientationRef = useRef(
    new Map<string, QuaternionTuple>(),
  );
  const restorationElapsedRef = useRef(0);
  const restorationProgressRef = useRef(0);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const surfaceRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
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
  }, [selectedArtifactId, selectedCollectionId]);

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
  const renderedReservoirContext =
    queryReservoirTransitionContext ?? settledReservoirContext;
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
    () =>
      queryReservoirTransitionContext
        ? mergeReservoirNodeSets(
            getReservoirContextNodes(settledReservoirContext),
            getReservoirContextNodes(queryReservoirTransitionContext),
          )
        : getReservoirContextNodes(settledReservoirContext),
    [queryReservoirTransitionContext, settledReservoirContext],
  );
  const activeReservoirArtifacts = useMemo(
    () =>
      activeReservoirNodes.filter(
        (node): node is Extract<ReservoirContentNode, { kind: "artifact" }> =>
          node.kind === "artifact",
      ),
    [activeReservoirNodes],
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
  const {
    desiredArtifactDiameter: activeReservoirDesiredArtifactDiameter,
    desiredCollectionDiameter: activeReservoirDesiredCollectionDiameter,
  } = activeReservoirNodeSizingTargets;
  const activeReservoirNodeDiameters = useMemo(
    () =>
      getReservoirNodeDiameters(
        activeReservoirNodes,
        activeReservoirDesiredArtifactDiameter,
        activeReservoirDesiredCollectionDiameter,
      ),
    [
      activeReservoirNodes,
      activeReservoirDesiredArtifactDiameter,
      activeReservoirDesiredCollectionDiameter,
    ],
  );
  const focusedLayoutDirection =
    layoutModeTransitionFocusedDirectionRef.current;
  const layoutModeSourceSnapshot = layoutModeSourceSnapshotRef.current;
  const layoutModeDestinationSnapshot =
    layoutModeDestinationSnapshotRef.current;
  const collectionTransitionSourceSnapshot =
    collectionTransitionSourceSnapshotRef.current;
  const collectionTransitionDestinationSnapshot =
    collectionTransitionDestinationSnapshotRef.current;
  const activeReservoirLayoutSnapshot = useMemo(
    () => {
      if (
        layoutModeTransitionState !== "idle" &&
        layoutModeSourceSnapshot?.collectionId === renderedActiveCollectionId &&
        layoutModeSourceSnapshot.mode === renderedLayoutMode
      ) {
        return layoutModeSourceSnapshot;
      }

      if (
        layoutModeDestinationSnapshot?.collectionId ===
          renderedActiveCollectionId &&
        layoutModeDestinationSnapshot.mode === renderedLayoutMode
      ) {
        return layoutModeDestinationSnapshot;
      }

      if (
        collectionTransitionSourceSnapshot?.collectionId ===
          renderedActiveCollectionId &&
        collectionNavigation.transitionPhase === "deactivating"
      ) {
        return collectionTransitionSourceSnapshot;
      }

      if (
        collectionTransitionDestinationSnapshot?.collectionId ===
        renderedActiveCollectionId
      ) {
        return collectionTransitionDestinationSnapshot;
      }

      const directions = generateReservoirLayout(activeReservoirNodes, {
        seed: renderedReservoirSeed,
        mode: renderedLayoutMode,
        focusedDirection:
          renderedLayoutMode === "focused"
            ? focusedLayoutDirection ?? undefined
            : undefined,
        minimumNodeDiameter:
          renderedLayoutMode === "focused"
            ? Math.max(
                activeReservoirDesiredArtifactDiameter,
                activeReservoirDesiredCollectionDiameter,
              )
            : undefined,
        nodeDiameters:
          renderedLayoutMode === "focused"
            ? activeReservoirNodeDiameters
            : undefined,
      });
      return {
        collectionId: renderedActiveCollectionId,
        mode: renderedLayoutMode,
        directions,
        quaternion: ([0, 0, 0, 1] as QuaternionTuple),
        nodeSizing: getReservoirNodeSizingSnapshot(
          directions,
          activeReservoirNodes.length,
          activeReservoirNodeDiameters,
        ),
      };
    },
    [
      activeReservoirNodes,
      activeReservoirDesiredArtifactDiameter,
      activeReservoirDesiredCollectionDiameter,
      activeReservoirNodeDiameters,
      collectionNavigation.transitionPhase,
      collectionTransitionDestinationSnapshot,
      collectionTransitionSourceSnapshot,
      focusedLayoutDirection,
      layoutModeDestinationSnapshot,
      layoutModeSourceSnapshot,
      layoutModeTransitionState,
      renderedReservoirSeed,
      renderedActiveCollectionId,
      renderedLayoutMode,
    ],
  );
  const activeReservoirLayout = activeReservoirLayoutSnapshot.directions;
  const activeNodeSizing = activeReservoirLayoutSnapshot.nodeSizing;
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
      return new Set(activeReservoirNodes.map((node) => node.id));
    }
    return getExploreNodeIds(activeReservoirNodes, activeExploreFilter);
  }, [
    activeExploreFilter,
    activeReservoirNodes,
    queryReservoirContext,
    queryReservoirTransitionContext,
  ]);
  const reservoirNodeDiagnostics = useMemo(
    () => getReservoirNodeDiagnostics(activeReservoirNodes),
    [activeReservoirNodes],
  );
  const selectedArtifact = selectedArtifactId
    ? (getArtifactById(selectedArtifactId) ?? null)
    : null;
  const selectedCollection = selectedCollectionId
    ? (getCollectionById(selectedCollectionId) ?? null)
    : null;
  const openingArtifact = openingArtifactId
    ? (getArtifactById(openingArtifactId) ?? null)
    : null;
  const openingReactionDistances = useMemo(() => {
    const distances = new Map<string, number>();
    if (!openingArtifact) return distances;
    const openingDirection = activeReservoirLayout.get(openingArtifact.id);
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
  }, [activeReservoirLayout, activeReservoirNodes, openingArtifact]);
  const maximumOpeningReactionDistance = Math.max(
    0,
    ...openingReactionDistances.values(),
  );
  const openingActive = [
    "openingArtifact",
    "deployingArtifact",
    "readingArtifact",
    "closingArtifact",
  ].includes(transitionState);
  const restoring = transitionState === "restoringArtifact";
  const artifactWindowPhase =
    transitionState === "deployingArtifact"
      ? "deploying"
      : transitionState === "readingArtifact"
        ? "reading"
        : transitionState === "closingArtifact"
          ? "closing"
          : null;
  const collectionContextTransition =
    transitionState === "reconstitutingCollection";
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

  useEffect(() => {
    if (
      transitionState !== "openingArtifact" ||
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
        setTransitionState("deployingArtifact");
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
    const openingDuration = getOpeningDuration(reducedMotion);
    const startTime = performance.now();
    let handoffCommitted = false;
    let reactivationReported = false;
    let animationFrameId = 0;

    function updateCollectionReconstitution(now: number) {
      const progress = clamp(
        (now - startTime) / 1000 / Math.max(duration, Number.EPSILON),
        0,
        1,
      );
      const frame = getCollectionReconstitutionFrame(progress);
      collectionReconstitutionProgressRef.current = progress;
      collectionReconstitutionElapsedRef.current =
        openingDuration * frame.deactivationProgress;
      collectionEmergenceProgressRef.current = frame.emergenceProgress;

      if (!handoffCommitted && progress >= 0.5) {
        handoffCommitted = true;
        const resolution = pendingCollectionResolutionRef.current;
        setQueryVisibleNodeIds(
          new Set(
            getReservoirContentNodes(destinationCollectionId).map(
              (node) => node.id,
            ),
          ),
        );
        setQueryReconciliation(null);
        setQueryActivityRevision(null);
        setQueryActivityMode(null);
        setRejectedExploreFilter(null);
        setActiveExploreFilter("all");
        if (resolution) setCollectionHistory(resolution.history);
        setSelectedArtifactId(null);
        setSelectedCollectionId(null);
        setCollectionNavigation({
          activeCollectionId: destinationCollectionId,
          destinationCollectionId,
          transitionPhase: "handoff",
        });
      } else if (
        handoffCommitted &&
        !reactivationReported &&
        progress > 0.5
      ) {
        reactivationReported = true;
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
          "initial-or-preserved-at-handoff";
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
        const expectedOrientation = collectionOrientationRef.current.get(
          destinationCollectionId,
        );
        interaction.current.dataset.collectionSphereQuaternionError =
          expectedOrientation
            ? sphereQuaternion
                .angleTo(new THREE.Quaternion(...expectedOrientation))
                .toFixed(9)
            : "0.000000000";
        interaction.current.dataset.collectionZoomLevelError = Math.abs(
          zoomLevelRef.current - snapshot.zoomLevel,
        ).toFixed(9);
      }

      collectionReconstitutionProgressRef.current = 1;
      collectionReconstitutionElapsedRef.current = 0;
      collectionEmergenceProgressRef.current = 1;
      pendingCollectionResolutionRef.current = null;
      collectionTransitionPoseSnapshotRef.current = null;
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
    reducedMotion,
    transitionState,
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
      setLayoutModeTransitionState("idle");
      if (interaction.current) {
        interaction.current.dataset.layoutModeTransitionPhase = "idle";
        interaction.current.dataset.layoutModeTransitionProgress = "0.000000";
        interaction.current.dataset.layoutModeTransitionPulse = "0.000000";
      }
    }

    animationFrameId = requestAnimationFrame(updateEmerging);
    return () => cancelAnimationFrame(animationFrameId);
  }, [layoutModeTransitionState, reducedMotion]);

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
      "deployingArtifact",
      "readingArtifact",
      "closingArtifact",
    ].includes(transitionState);
    const scrollEnabled = transitionState === "readingArtifact";
    const deploying = transitionState === "deployingArtifact";
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

  const completeArtifactDeployment = useCallback(() => {
    setTransitionState((currentState) =>
      currentState === "deployingArtifact"
        ? "readingArtifact"
        : currentState,
    );
  }, []);

  const requestArtifactClose = useCallback(() => {
    setArtifactFooterReached(false);
    setTransitionState((currentState) =>
      currentState === "readingArtifact"
        ? "closingArtifact"
        : currentState,
    );
  }, []);

  useEffect(() => {
    if (
      transitionState !== "closingArtifact" ||
      !preservedReservoirState
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      restorationElapsedRef.current = 0;
      restorationProgressRef.current = 0;
      setTransitionState("restoringArtifact");
    }, getArtifactWindowRetractDuration(reducedMotion) * 1000);

    return () => window.clearTimeout(timeoutId);
  }, [preservedReservoirState, reducedMotion, setReservoirZoom, transitionState]);

  useEffect(() => {
    if (
      transitionState !== "restoringArtifact" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const duration = getReservoirRestoreDuration(reducedMotion);
    const startTime = performance.now();
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
      const sphereQuaternionError = renderedSphere
        ? renderedSphere.quaternion.angleTo(expectedSphereQuaternion)
        : Number.POSITIVE_INFINITY;
      const zoomLevelError = Math.abs(
        zoomLevelRef.current - snapshot.zoomLevel,
      );
      const endpointReached =
        sphereQuaternionError < 0.00001 && zoomLevelError < 0.00001;

      if (interaction.current) {
        interaction.current.dataset.restorationProgress =
          restorationProgressRef.current.toFixed(6);
        interaction.current.dataset.restorationSphereQuaternionError =
          sphereQuaternionError.toFixed(9);
        interaction.current.dataset.restorationZoomLevelError =
          zoomLevelError.toFixed(9);
      }

      if (elapsed >= duration && (endpointReached || elapsed >= duration + 1)) {
        restorationProgressRef.current = 1;
        if (renderedSphere) {
          renderedSphere.quaternion.copy(expectedSphereQuaternion);
        }
        setReservoirZoom(snapshot.zoomLevel);
        setOpeningArtifactId(null);
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
            ((pickedNode.kind === "artifact" &&
              pickedNode.id === selectedArtifactId) ||
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
      setHoveredArtifactId(null);
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
    if (surfaceDistance === null) return null;
    const nodeHit = raycaster
      .intersectObjects(scene.children, true)
      .find((hit) => {
        const artifactId = hit.object.userData.artifactId;
        const collectionId = hit.object.userData.collectionId;

        const nodeId =
          typeof artifactId === "string" ? artifactId : collectionId;
        return (
          typeof nodeId === "string" &&
          surfacedNodeIds.has(nodeId) &&
          hit.distance < surfaceDistance - NODE_VISIBLE_SURFACE_EPSILON
        );
      });
    const artifactId = nodeHit?.object.userData.artifactId;
    if (typeof artifactId === "string") {
      return { kind: "artifact", id: artifactId };
    }
    const collectionId = nodeHit?.object.userData.collectionId;
    if (typeof collectionId === "string") {
      return { kind: "collection", id: collectionId };
    }
    return null;
  }

  function capturePreservedReservoirState(
    artifactId: string,
  ): PreservedReservoirState | null {
    const sphere = sphereRotationRef.current;
    if (!sphere) return null;

    return {
      artifactId,
      sphereQuaternion: toQuaternionTuple(sphere.quaternion),
      zoomLevel: zoomLevelRef.current,
    };
  }

  function preserveDistributedOrientation(collectionId: string) {
    if (renderedLayoutMode !== "distributed") return;
    const sphere = sphereRotationRef.current;
    if (!sphere) return;

    collectionOrientationRef.current.set(
      collectionId,
      toQuaternionTuple(sphere.quaternion),
    );
  }

  function requestLayoutMode(nextLayoutMode: ReservoirLayoutMode) {
    if (
      nextLayoutMode === layoutMode ||
      layoutModeTransitionActive ||
      artifactWindowPhase !== null ||
      collectionNavigation.transitionPhase !== "idle" ||
      menuActive ||
      queryTransitionActive ||
      footerTransitionActive
    ) {
      return;
    }

    const sphere = sphereRotationRef.current;
    const surface = surfaceRef.current;
    const camera = cameraRef.current;
    const currentQuaternion = sphere
      ? toQuaternionTuple(sphere.quaternion)
      : ([0, 0, 0, 1] as QuaternionTuple);

    layoutModeSourceSnapshotRef.current = {
      collectionId: renderedActiveCollectionId,
      mode: renderedLayoutMode,
      directions: new Map(activeReservoirLayout),
      quaternion: currentQuaternion,
      nodeSizing: activeNodeSizing,
    };

    let destinationFocusedDirection =
      layoutModeTransitionFocusedDirectionRef.current;
    if (nextLayoutMode === "focused") {
      if (!surface || !camera) return;
      const focalDiagnostics = getRuntimeFocalDiagnostics(surface, camera);
      setLayoutModeFocalDiagnostics(focalDiagnostics);
      if (interaction.current) {
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
        interaction.current.dataset.layoutModeTargetWorld =
          formatDirectionTuple(focalDiagnostics.targetWorld);
        interaction.current.dataset.layoutModeTargetLocal =
          formatDirectionTuple(focalDiagnostics.targetLocal);
        interaction.current.dataset.layoutModeRoundTripWorld =
          formatDirectionTuple(focalDiagnostics.roundTripWorld);
        interaction.current.dataset.layoutModeRoundTripAngleDegrees =
          focalDiagnostics.roundTripAngleDegrees.toFixed(6);
        interaction.current.dataset.layoutModeRoundTripFrontDot =
          focalDiagnostics.roundTripFrontDot.toFixed(6);
        interaction.current.dataset.layoutModeRoundTripUpDot =
          focalDiagnostics.roundTripUpDot.toFixed(6);
      }
      if (!focalDiagnostics.assertionsPassed) {
        console.error(
          "Reservoir focal-position assertions failed",
          focalDiagnostics,
        );
        layoutModeSourceSnapshotRef.current = null;
        return;
      }
      destinationFocusedDirection = focalDiagnostics.targetLocal;
      layoutModeTransitionFocusedDirectionRef.current =
        destinationFocusedDirection;
    }

    const destinationLayout = generateReservoirLayout(activeReservoirNodes, {
      seed: renderedReservoirSeed,
      mode: nextLayoutMode,
      focusedDirection:
        nextLayoutMode === "focused"
          ? destinationFocusedDirection ?? undefined
          : undefined,
      minimumNodeDiameter:
        nextLayoutMode === "focused"
        ? Math.max(
              activeReservoirDesiredArtifactDiameter,
              activeReservoirDesiredCollectionDiameter,
            )
          : undefined,
      nodeDiameters:
        nextLayoutMode === "focused"
          ? activeReservoirNodeDiameters
          : undefined,
    });
    const destinationNodeSizing = getReservoirNodeSizingSnapshot(
      destinationLayout,
      activeReservoirNodes.length,
      activeReservoirNodeDiameters,
    );
    layoutModeDestinationSnapshotRef.current = {
      collectionId: renderedActiveCollectionId,
      mode: nextLayoutMode,
      directions: destinationLayout,
      quaternion: currentQuaternion,
      nodeSizing: destinationNodeSizing,
    };
    collectionOrientationRef.current.set(
      collectionNavigation.activeCollectionId,
      currentQuaternion,
    );
    layoutModeResetStartZoomRef.current = zoomLevelRef.current;
    layoutModeResetTargetZoomRef.current = clampReservoirZoom(
      RESERVOIR_ZOOM_DEFAULT,
      getAdaptiveZoomForSnapshot(activeReservoirNodes, destinationNodeSizing)
        .activeMaximum,
    );
    layoutModeViewResetProgressRef.current = 0;
    layoutModeTransitionPulseRef.current = 0;
    setHoveredArtifactId(null);
    setSelectedArtifactId(null);
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

  function beginArtifactOpening(
    artifactId: string,
    allowLocatedTransition = false,
  ) {
    if (
      transitionState !== "idle" &&
      !(allowLocatedTransition && transitionState === "locatingArtifact")
    ) {
      return;
    }

    const artifact = getArtifactById(artifactId);
    const preservedState = capturePreservedReservoirState(artifactId);
    if (!artifact || artifact.published !== true || !preservedState) return;

    openingElapsedRef.current = 0;
    setOpeningArtifactId(artifactId);
    setPreservedReservoirState(preservedState);
    setArtifactFooterReached(false);
    setHoveredArtifactId(null);
    setSelectedPressActive(false);
    setTransitionState("openingArtifact");
  }

  function requestCollection(
    destinationCollectionId: string,
    allowDuringMenuOpen = false,
  ) {
    if (
      (!allowDuringMenuOpen && inputLocked) ||
      destinationCollectionId === collectionNavigation.activeCollectionId ||
      getCollectionById(destinationCollectionId)?.published !== true
    ) {
      return;
    }

    const resolution = pendingCollectionResolutionRef.current;
    if (!resolution) return;

    const sphere = sphereRotationRef.current;
    const currentQuaternion = sphere
      ? toQuaternionTuple(sphere.quaternion)
      : ([0, 0, 0, 1] as QuaternionTuple);
    collectionTransitionSourceSnapshotRef.current = {
      collectionId: renderedActiveCollectionId,
      mode: renderedLayoutMode,
      directions: new Map(activeReservoirLayout),
      quaternion: currentQuaternion,
      nodeSizing: activeNodeSizing,
    };
    const destinationNodes = getReservoirContentNodes(destinationCollectionId);
    const destinationNodeSizingTargets = getReservoirNodeSizingTargets(
      destinationNodes.length,
    );
    const destinationNodeDiameters = getReservoirNodeDiameters(
      destinationNodes,
      destinationNodeSizingTargets.desiredArtifactDiameter,
      destinationNodeSizingTargets.desiredCollectionDiameter,
    );
    const destinationLayout = generateReservoirLayout(destinationNodes, {
      seed: destinationCollectionId,
      mode: renderedLayoutMode,
      focusedDirection:
        renderedLayoutMode === "focused"
          ? focusedLayoutDirection ?? undefined
          : undefined,
      minimumNodeDiameter:
        renderedLayoutMode === "focused"
          ? Math.max(
              destinationNodeSizingTargets.desiredArtifactDiameter,
              destinationNodeSizingTargets.desiredCollectionDiameter,
            )
          : undefined,
      nodeDiameters:
        renderedLayoutMode === "focused"
          ? destinationNodeDiameters
          : undefined,
    });
    const destinationNodeSizing = getReservoirNodeSizingSnapshot(
      destinationLayout,
      destinationNodes.length,
      destinationNodeDiameters,
    );
    const destinationAdaptiveZoom = getAdaptiveZoomForSnapshot(
      destinationNodes,
      destinationNodeSizing,
    );
    const destinationZoom = clampReservoirZoom(
      zoomLevelRef.current,
      destinationAdaptiveZoom.activeMaximum,
    );
    zoomLevelRef.current = destinationZoom;
    setZoomLevel(destinationZoom);
    collectionTransitionDestinationSnapshotRef.current = {
      collectionId: destinationCollectionId,
      mode: renderedLayoutMode,
      directions: destinationLayout,
      quaternion: currentQuaternion,
      nodeSizing: destinationNodeSizing,
    };
    collectionOrientationRef.current.set(
      collectionNavigation.activeCollectionId,
      currentQuaternion,
    );
    collectionOrientationRef.current.set(
      destinationCollectionId,
      currentQuaternion,
    );
    collectionTransitionPoseSnapshotRef.current = {
      zoomLevel: destinationZoom,
    };
    collectionReconstitutionProgressRef.current = 0;
    collectionReconstitutionElapsedRef.current = 0;
    collectionEmergenceProgressRef.current = 0;
    queryRevisionRef.current += 1;
    setCollectionActivityRevision(queryRevisionRef.current);
    setSelectedSpatialDestinationId(resolution.spatialSelectionId);
    setHoveredArtifactId(null);
    setSelectedArtifactId(null);
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
    exitQueryReservoirToCollectionContext();
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

    exitQueryReservoirToCollectionContext();
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
    const renderedSphere = sphereRotationRef.current;
    if (renderedSphere) {
      preserveDistributedOrientation(collectionNavigation.activeCollectionId);
    }
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
          setSelectedArtifactId(null);
          setSelectedCollectionId(pickedNode.id);
        }
      } else if (pickedNode?.kind === "artifact") {
        if (pickedNode.id === selectedArtifactId) {
          beginArtifactOpening(pickedNode.id);
        } else {
          setTransitionState("idle");
          setSelectedCollectionId(null);
          setSelectedArtifactId(pickedNode.id);
        }
      } else {
        setTransitionState("idle");
        setSelectedArtifactId(null);
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

  function updateArtifactHover(artifactId: string, hovered: boolean) {
    if (inputLocked || !surfacedNodeIds.has(artifactId)) return;
    setHoveredArtifactId((currentArtifactId) => {
      if (hovered) return artifactId;
      return currentArtifactId === artifactId ? null : currentArtifactId;
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

    setHoveredArtifactId(null);
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
      queryReservoirContext !== null ||
      queryReservoirTransitionContext !== null ||
      filter === activeExploreFilter
    ) {
      return;
    }

    const targetVisibleIds = getExploreNodeIds(activeReservoirNodes, filter);
    const meaningfulResults = activeReservoirNodes.filter(
      (node) => targetVisibleIds.has(node.id),
    );
    if (filter !== "all" && meaningfulResults.length === 0) {
      queryRevisionRef.current += 1;
      setQueryReconciliation(null);
      setQueryActivityMode("empty");
      setRejectedExploreFilter(filter);
      setQueryActivityRevision(queryRevisionRef.current);
      setHoveredArtifactId(null);
      setSelectedArtifactId(null);
      setSelectedCollectionId(null);
      setSelectedPressActive(false);
      return;
    }
    const currentVisibleIds = new Set(queryVisibleNodeIds);
    const leaving = new Set(
      [...currentVisibleIds].filter((id) => !targetVisibleIds.has(id)),
    );
    const staying = new Set(
      [...currentVisibleIds].filter((id) => targetVisibleIds.has(id)),
    );
    const entering = new Set(
      [...targetVisibleIds].filter((id) => !currentVisibleIds.has(id)),
    );

    queryRevisionRef.current += 1;
    setQueryVisibleNodeIds(
      new Set([...currentVisibleIds, ...targetVisibleIds]),
    );
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
    setHoveredArtifactId(null);
    setSelectedArtifactId(null);
    setSelectedCollectionId(null);
    setSelectedPressActive(false);
  }

  function completeQueryTransition() {
    if (queryReservoirTransitionContext) {
      settleQueryReservoirContext(queryReservoirTransitionContext);
    } else if (queryActivityMode === "success") {
      setQueryVisibleNodeIds(
        new Set(queryReconciliation?.target ?? surfacedNodeIds),
      );
    }
    setQueryReconciliation(null);
    setQueryActivityRevision(null);
    setQueryActivityMode(null);
    setRejectedExploreFilter(null);
    setLocatingArtifactId(null);
  }

  function restoreQueryReservoirSnapshot() {
    const snapshot = queryReservoirSnapshotRef.current;
    if (!snapshot) return;

    setActiveExploreFilter(snapshot.activeExploreFilter);
    setHoveredArtifactId(snapshot.hoveredArtifactId);
    setSelectedArtifactId(snapshot.selectedArtifactId);
    setSelectedCollectionId(snapshot.selectedCollectionId);
    setSelectedPressActive(snapshot.selectedPressActive);
  }

  function settleQueryReservoirContext(context: ReservoirContext) {
    if (context.kind === "collection") {
      queryReservoirSnapshotRef.current = null;
    }
    setQueryReservoirContext(
      context.kind === "query" ? context : null,
    );
    setQueryReservoirTransitionContext(null);
    setQueryVisibleNodeIds(
      new Set(
        getReservoirContextNodes(context).map((node) => node.id),
      ),
    );
    setQueryReconciliation(null);
    setQueryActivityRevision(null);
    setQueryActivityMode(null);
    setRejectedExploreFilter(null);
  }

  function exitQueryReservoirToCollectionContext() {
    if (!queryReservoirContext) return;

    restoreQueryReservoirSnapshot();
    settleQueryReservoirContext({
      kind: "collection",
      collectionId: collectionNavigation.activeCollectionId,
    });
  }

  function selectDirectArtifact(directArtifactId: DirectArtifactId) {
    if (menuState !== "open" || queryActivityRevision !== null) return;
    if (directArtifactId === "contact") {
      if (interaction.current) {
        interaction.current.dataset.directContactAction = "ui-only";
      }
      setHoveredArtifactId(null);
      setSelectedArtifactId(null);
      setSelectedCollectionId(null);
      setSelectedPressActive(false);
      setTransitionState("idle");
      setMenuState("closing");
      return;
    }

    const artifactId = DIRECT_ARTIFACT_TARGETS.get(directArtifactId);
    const artifact = artifactId ? getArtifactById(artifactId) : null;
    if (!artifact || artifact.published !== true) return;

    const returnContext = queryReservoirContext ?? collectionReservoirContext;
    const targetContext: ReservoirContext = {
      kind: "query",
      resultIds: [artifact.id],
      returnContext,
    };
    const targetVisibleIds = new Set(
      getReservoirContextNodes(targetContext).map((node) => node.id),
    );
    const currentVisibleIds = new Set(queryVisibleNodeIds);
    const reconciliationTarget = new Set(targetVisibleIds);

    queryRevisionRef.current += 1;
    queryReservoirSnapshotRef.current = {
      activeExploreFilter,
      hoveredArtifactId,
      selectedArtifactId,
      selectedCollectionId,
      selectedPressActive,
    };
    setQueryReservoirTransitionContext(targetContext);
    setQueryVisibleNodeIds(new Set([...currentVisibleIds, ...targetVisibleIds]));
    setQueryReconciliation({
      entering: new Set(
        [...targetVisibleIds].filter((id) => !currentVisibleIds.has(id)),
      ),
      leaving: new Set(
        [...currentVisibleIds].filter((id) => !reconciliationTarget.has(id)),
      ),
      staying: new Set(
        [...currentVisibleIds].filter((id) => reconciliationTarget.has(id)),
      ),
      target: reconciliationTarget,
    });
    setQueryActivityMode("success");
    setRejectedExploreFilter(null);
    setQueryActivityRevision(queryRevisionRef.current);
    setSelectedCollectionId(null);
    setSelectedArtifactId(artifact.id);
    setHoveredArtifactId(null);
    setSelectedPressActive(false);
    setLocatingArtifactId(artifact.id);
    setTransitionState("idle");
    pendingCollectionResolutionRef.current = null;
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
        selectedArtifact={selectedArtifact}
        selectedCollection={selectedCollection}
      />
      <CollectionNavigation
        ancestors={visibleCollectionAncestors}
        depth={collectionHistory.length - 1}
        disabled={inputLocked}
        queryActive={
          queryReservoirContext !== null ||
          queryReservoirTransitionContext !== null
        }
        onAncestorSelect={requestAncestorCollection}
        onBack={() => {
          if (queryReservoirContext?.kind === "query") {
            restoreQueryReservoirSnapshot();
            settleQueryReservoirContext(queryReservoirContext.returnContext);
            return;
          }
          const previousCollectionId = collectionHistory.at(-2)?.collectionId;
          if (previousCollectionId) {
            requestAncestorCollection(previousCollectionId);
          }
        }}
        onHome={() => {
          const homeCollectionId = collectionHistory[0]?.collectionId;
          if (homeCollectionId) {
            requestAncestorCollection(homeCollectionId);
          }
        }}
      />
      <ReservoirLayoutModeSwitch
        disabled={layoutModeControlDisabled}
        mode={layoutMode}
        onChange={requestLayoutMode}
      />
      <section className="sr-only" aria-label="Reservoir artifacts">
        <h1>{activeCollection.title} collection</h1>
        <p>
          An interactive reservoir containing {activeReservoirArtifacts.length}{" "}
          artifacts and {activeReservoirChildCollections.length} dormant{" "}
          {activeReservoirChildCollections.length === 1
            ? "collection"
            : "collections"}.
        </p>
        <ul>
          {activeReservoirArtifacts.map((artifact) => (
            <li key={artifact.id}>
              {artifact.type}: {artifact.title}
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
      aria-hidden={artifactWindowPhase !== null}
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
      data-collection-orientation-choreography="initial-composition-at-handoff"
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
      data-artifact-count={activeReservoirArtifacts.length}
      data-temporary-artifact-count={0}
      data-artifact-ids={activeReservoirArtifacts.map((artifact) => artifact.id).join(",")}
      data-selected-artifact={selectedArtifactId ?? ""}
      data-selected-collection={selectedCollectionId ?? ""}
      data-selected-node-kind={
        selectedArtifactId
          ? "artifact"
          : selectedCollectionId
            ? "collection"
            : ""
      }
      data-selected-node-id={selectedArtifactId ?? selectedCollectionId ?? ""}
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
      data-query-transition-active={queryTransitionActive}
      data-query-activity-revision={queryActivityRevision ?? ""}
      data-query-activity-mode={queryActivityMode ?? ""}
      data-query-rejected-filter={rejectedExploreFilter ?? ""}
      data-query-preserved-filter={
        rejectedExploreFilter ? activeExploreFilter : ""
      }
      data-query-meaningful-result-policy="semantic-membership"
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
      data-locating-artifact={locatingArtifactId ?? ""}
      data-opening-artifact={openingArtifactId ?? ""}
      data-opening-complete={
        transitionState !== "idle" && transitionState !== "openingArtifact"
      }
      data-input-locked={inputLocked}
      data-content-open={artifactWindowPhase !== null}
      data-atmosphere-bottom={atmosphereBottom.toFixed(3)}
      data-artifact-window-atmosphere-gap="clamp(24px, 3.2vw, 48px)"
      data-reading-mode={transitionState === "readingArtifact"}
      data-artifact-footer-reached={artifactFooterReached}
      data-restoring={restoring}
      data-artifact-content-ready={openingArtifact !== null}
      data-prepared-content-artifact={openingArtifact?.id ?? ""}
      data-prepared-content-title={openingArtifact?.title ?? ""}
      data-opening-reaction-order={[...openingReactionDistances.entries()]
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
        .map(([artifactId, distance]) => `${artifactId}:${distance}`)
        .join(",")}
      data-preopen-sphere-quaternion={
        preservedReservoirState?.sphereQuaternion.join(",") ?? ""
      }
      data-preopen-zoom-level={
        preservedReservoirState?.zoomLevel.toFixed(6) ?? ""
      }
      data-hovered-artifact={hoveredArtifactId ?? ""}
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
            collectionId={renderedActiveCollectionId}
            composition={activeInitialComposition}
            diagnosticsRef={interaction}
            layoutMode={renderedLayoutMode}
            layoutModeTransitionState={layoutModeTransitionState}
            onOrientationApplied={setRotationDiagnostics}
            orientationStoreRef={collectionOrientationRef}
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
              collectionReconstitutionElapsedRef={
                collectionReconstitutionElapsedRef
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
              selectedArtifactId={selectedArtifactId}
              selectedCollectionId={selectedCollectionId}
              hoveredArtifactId={hoveredArtifactId}
              interactionEnabled={!inputLocked}
              isDragging={isDragging}
              reservoirFrame={reservoirFrame}
              renderedZoomRef={renderedZoomRef}
              selectedPressActive={selectedPressActive}
              surfacedNodeIds={surfacedNodeIds}
              filterVisibleNodeIds={queryVisibleNodeIds}
              locatingArtifactId={locatingArtifactId}
              continuationCueEnabled={!inputLocked}
              interactionRevisionRef={interactionRevisionRef}
              diagnosticsRef={interaction}
              openingActive={openingActive}
              openingArtifact={openingArtifact}
              openingElapsedRef={openingElapsedRef}
              openingReducedMotion={reducedMotion}
              openingReactionDistances={openingReactionDistances}
              maximumOpeningReactionDistance={
                maximumOpeningReactionDistance
              }
              restoring={restoring}
              restorationProgressRef={restorationProgressRef}
              emergingChildren={
                collectionNavigation.transitionPhase === "handoff" ||
                collectionNavigation.transitionPhase === "reactivating"
              }
              emergenceProgressRef={collectionEmergenceProgressRef}
              onArtifactHoverChange={updateArtifactHover}
              queryActivityRevision={queryActivityRevision}
              queryActivityMode={queryActivityMode}
              onQueryActivityComplete={completeQueryTransition}
            />
          </ReservoirOrientation>
        </ReservoirTransform>
      </Canvas>
      </div>
      {artifactWindowPhase && openingArtifact ? (
        <ArtifactWindow
          atmosphereBottom={atmosphereBottom}
          artifact={openingArtifact}
          phase={artifactWindowPhase}
          reducedMotion={reducedMotion}
          onDeployComplete={completeArtifactDeployment}
          onClose={requestArtifactClose}
          onFooterReachedChange={setArtifactFooterReached}
        />
      ) : null}
    </>
  );
}
