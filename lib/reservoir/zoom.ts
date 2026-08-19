import * as THREE from "three";
import {
  isReservoirInspectableResourceNode,
  type ReservoirContentNode,
} from "@/lib/content/reservoir-adapter";
import { getReservoirNodeCenterRadius } from "@/lib/reservoir/node";
import {
  RESERVOIR_ZOOM_BASELINE_MAX,
  RESERVOIR_ZOOM_EXTENDED_HARD_MAX,
} from "@/lib/reservoir/frame";

export {
  RESERVOIR_ZOOM_BASELINE_MAX,
  RESERVOIR_ZOOM_EXTENDED_HARD_MAX,
} from "@/lib/reservoir/frame";
import {
  getCameraSpaceDepth,
  getProjectedWorldDiameterPixelsAtDepth,
} from "@/lib/reservoir/projection";

export const RESERVOIR_NODE_INSPECTABLE_TARGET_PX = 24;
export const RESERVOIR_CAMERA_CLEARANCE_MARGIN = 0.16;

export type ReservoirAdaptiveZoom = {
  baselineMaximum: number;
  requiredZoom: number;
  transformSafeMaximum: number;
  absoluteMaximum: number;
  activeMaximum: number;
  targetReachable: boolean;
  smallestNodeKind: "artifact" | "collection" | null;
  smallestNodeWorldDiameter: number;
  projectedNodePixelsAtBaseline: number;
  projectedNodePixelsAtActiveMaximum: number;
};

const SOLVE_ITERATIONS = 24;
const EPSILON = 1e-6;

function getPresentKind(
  nodes: readonly ReservoirContentNode[],
  kind: "artifact" | "collection",
) {
  return nodes.some((node) =>
    kind === "artifact"
      ? isReservoirInspectableResourceNode(node)
      : node.kind === kind,
  );
}

function getWorldPositionAtCanonicalFront(
  reservoirCenter: THREE.Vector3,
  camera: THREE.Camera,
  localNodeCenterRadius: number,
  baseScale: number,
  zoom: number,
  scratchCameraPosition: THREE.Vector3,
  scratchDirection: THREE.Vector3,
  target: THREE.Vector3,
) {
  camera.getWorldPosition(scratchCameraPosition);
  scratchDirection
    .copy(scratchCameraPosition)
    .sub(reservoirCenter)
    .normalize();
  return target
    .copy(reservoirCenter)
    .addScaledVector(scratchDirection, localNodeCenterRadius * baseScale * zoom);
}

export function getReservoirAdaptiveZoom({
  camera,
  viewportHeight,
  reservoirCenter,
  baseScale,
  nodes,
  artifactDiameter,
  collectionDiameter,
  cameraNear,
  baselineMaximum = RESERVOIR_ZOOM_BASELINE_MAX,
  absoluteMaximum = RESERVOIR_ZOOM_EXTENDED_HARD_MAX,
}: {
  camera: THREE.Camera;
  viewportHeight: number;
  reservoirCenter: THREE.Vector3;
  baseScale: number;
  nodes: readonly ReservoirContentNode[];
  artifactDiameter: number;
  collectionDiameter: number;
  cameraNear: number;
  baselineMaximum?: number;
  absoluteMaximum?: number;
}): ReservoirAdaptiveZoom {
  const hasArtifacts = getPresentKind(nodes, "artifact");
  const hasCollections = getPresentKind(nodes, "collection");
  const smallestNodeKind =
    hasArtifacts && hasCollections
      ? artifactDiameter <= collectionDiameter
        ? "artifact"
        : "collection"
      : hasArtifacts
        ? "artifact"
        : hasCollections
          ? "collection"
          : null;

  if (
    smallestNodeKind === null ||
    !Number.isFinite(baseScale) ||
    baseScale <= 0
  ) {
    return {
      baselineMaximum: baselineMaximum,
      requiredZoom: baselineMaximum,
      transformSafeMaximum: baselineMaximum,
      absoluteMaximum,
      activeMaximum: baselineMaximum,
      targetReachable: false,
      smallestNodeKind: null,
      smallestNodeWorldDiameter: 0,
      projectedNodePixelsAtBaseline: 0,
      projectedNodePixelsAtActiveMaximum: 0,
    };
  }

  const smallestDiameter =
    smallestNodeKind === "artifact" ? artifactDiameter : collectionDiameter;
  const smallestRadius = smallestDiameter / 2;
  const largestPresentRadius = Math.max(
    hasArtifacts ? artifactDiameter / 2 : 0,
    hasCollections ? collectionDiameter / 2 : 0,
  );
  const cameraSpaceScratch = new THREE.Vector3();
  const cameraPositionScratch = new THREE.Vector3();
  const directionScratch = new THREE.Vector3();
  const canonicalPositionScratch = new THREE.Vector3();
  const centerDepth = getCameraSpaceDepth(
    camera,
    reservoirCenter,
    cameraSpaceScratch,
  );
  const frontExtent =
    getReservoirNodeCenterRadius(largestPresentRadius) + largestPresentRadius;
  const availableCameraDepth =
    centerDepth - cameraNear - RESERVOIR_CAMERA_CLEARANCE_MARGIN;
  const transformSafeMaximum =
    baseScale * frontExtent > EPSILON
      ? availableCameraDepth / (baseScale * frontExtent)
      : baselineMaximum;
  const effectiveSafetyMaximum = Math.min(
    transformSafeMaximum,
    absoluteMaximum,
  );

  const projectedAtZoom = (zoom: number) => {
    const position = getWorldPositionAtCanonicalFront(
      reservoirCenter,
      camera,
      getReservoirNodeCenterRadius(smallestRadius),
      baseScale,
      zoom,
      cameraPositionScratch,
      directionScratch,
      canonicalPositionScratch,
    );
    return getProjectedWorldDiameterPixelsAtDepth({
      camera,
      viewportHeight,
      worldDiameter: smallestDiameter * baseScale * zoom,
      cameraDepth: getCameraSpaceDepth(camera, position, cameraSpaceScratch),
    });
  };

  const projectedNodePixelsAtBaseline = projectedAtZoom(baselineMaximum);
  const projectedAtSafeMaximum = projectedAtZoom(
    Math.max(baselineMaximum, effectiveSafetyMaximum),
  );
  let requiredZoom = baselineMaximum;
  if (projectedNodePixelsAtBaseline < RESERVOIR_NODE_INSPECTABLE_TARGET_PX) {
    const high = Math.max(baselineMaximum, effectiveSafetyMaximum);
    if (projectedAtSafeMaximum < RESERVOIR_NODE_INSPECTABLE_TARGET_PX) {
      requiredZoom = high;
    } else {
      let low = baselineMaximum;
      let upper = high;
      for (let iteration = 0; iteration < SOLVE_ITERATIONS; iteration += 1) {
        const middle = (low + upper) / 2;
        if (projectedAtZoom(middle) >= RESERVOIR_NODE_INSPECTABLE_TARGET_PX) {
          upper = middle;
        } else {
          low = middle;
        }
      }
      requiredZoom = upper;
    }
  }

  const desiredMaximum = Math.max(baselineMaximum, requiredZoom);
  const activeMaximum = Math.min(
    desiredMaximum,
    effectiveSafetyMaximum,
    absoluteMaximum,
  );
  const projectedNodePixelsAtActiveMaximum = projectedAtZoom(activeMaximum);

  return {
    baselineMaximum,
    requiredZoom,
    transformSafeMaximum,
    absoluteMaximum,
    activeMaximum,
    targetReachable:
      projectedNodePixelsAtActiveMaximum >=
      RESERVOIR_NODE_INSPECTABLE_TARGET_PX - 0.01,
    smallestNodeKind,
    smallestNodeWorldDiameter: smallestDiameter,
    projectedNodePixelsAtBaseline,
    projectedNodePixelsAtActiveMaximum,
  };
}
