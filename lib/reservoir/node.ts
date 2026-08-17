import * as THREE from "three";
import {
  RESERVOIR_LABEL_RADIAL_OFFSET,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  normalizeReservoirDirection,
  type ReservoirDirection,
} from "@/lib/reservoir/layout";
import {
  RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER,
  RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER,
  RESERVOIR_OPENING_TIMING,
  RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
} from "@/lib/reservoir/opening";

export const RESERVOIR_NODE_HOVER_TRANSITION_DURATION = 0.16;
export const RESERVOIR_NODE_HOVER_WHITE_MIX = 0.045;
export const RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY = 0.06;
export const RESERVOIR_NODE_HOVER_EMISSIVE_INTENSITY = 0.085;

const EMBEDDED_FRAME_EPSILON = 0.000001;
const EMBEDDED_FRAME_POLE_THRESHOLD = 0.08;
const COLLECTION_LOCAL_NORTH = new THREE.Vector3(0, 1, 0);
const COLLECTION_LOCAL_TANGENT = new THREE.Vector3(0, 0, 1);
const RESERVOIR_LABEL_RADIAL_OFFSET_MULTIPLIER =
  RESERVOIR_LABEL_RADIAL_OFFSET / RESERVOIR_NODE_RADIUS;

/**
 * Builds the collection node's intrinsic frame in reservoir-local space.
 * Local +Y is the sphere's north axis. Local +Z follows the reservoir's
 * projected north tangent, with the same deterministic pole reference used by
 * the reservoir surface-frame convention.
 */
export function getEmbeddedCollectionNodeQuaternion(
  outwardNormal: THREE.Vector3,
) {
  if (
    !outwardNormal.toArray().every(Number.isFinite) ||
    outwardNormal.lengthSq() < EMBEDDED_FRAME_EPSILON
  ) {
    return null;
  }

  const normal = outwardNormal.clone().normalize();
  let tangent = COLLECTION_LOCAL_NORTH.clone().addScaledVector(
    normal,
    -COLLECTION_LOCAL_NORTH.dot(normal),
  );

  if (tangent.length() < EMBEDDED_FRAME_POLE_THRESHOLD) {
    tangent = COLLECTION_LOCAL_TANGENT.clone().addScaledVector(
      normal,
      -COLLECTION_LOCAL_TANGENT.dot(normal),
    );
  }
  if (tangent.lengthSq() < EMBEDDED_FRAME_EPSILON) {
    tangent.set(1, 0, 0).addScaledVector(normal, -normal.x);
  }
  if (tangent.lengthSq() < EMBEDDED_FRAME_EPSILON) return null;

  tangent.normalize();
  const binormal = normal.clone().cross(tangent).normalize();
  if (binormal.lengthSq() < EMBEDDED_FRAME_EPSILON) return null;
  tangent.copy(binormal).cross(normal).normalize();

  const basis = new THREE.Matrix4().makeBasis(
    binormal,
    normal,
    tangent,
  );
  const quaternion = new THREE.Quaternion()
    .setFromRotationMatrix(basis)
    .normalize();

  // q and -q represent the same rotation. Canonicalizing the sign makes the
  // stored endpoint deterministic as well as the represented orientation.
  if (quaternion.w < 0) {
    quaternion.set(
      -quaternion.x,
      -quaternion.y,
      -quaternion.z,
      -quaternion.w,
    );
  }

  return quaternion;
}

export function moveToward(
  current: number,
  target: number,
  maximumDelta: number,
) {
  if (current < target) return Math.min(current + maximumDelta, target);
  return Math.max(current - maximumDelta, target);
}

function easeInCubic(progress: number) {
  return progress * progress * progress;
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export function getReservoirNodePlacement(
  direction: ReservoirDirection,
  nodeRadius: number,
) {
  const normalizedDirection = normalizeReservoirDirection(direction);
  const normal = new THREE.Vector3(...normalizedDirection);
  const labelPosition = normal
    .clone()
    .multiplyScalar(nodeRadius * RESERVOIR_LABEL_RADIAL_OFFSET_MULTIPLIER);

  return {
    normal,
    position: normal
      .clone()
      .multiplyScalar(RESERVOIR_RADIUS + nodeRadius * 0.04),
    labelPosition,
    hoverBridgePosition: labelPosition.clone().multiplyScalar(0.52),
    ringQuaternion: new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    ),
  };
}

type OpeningReactionOptions = {
  elapsed: number;
  openingReactionDelay: number;
  nodeRadius: number;
  reducedMotion: boolean;
  selected: boolean;
  startOffset: number;
};

export function getReservoirNodeOpeningReaction({
  elapsed,
  openingReactionDelay,
  nodeRadius,
  reducedMotion,
  selected,
  startOffset,
}: OpeningReactionOptions) {
  const reactionDuration = reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionNodeReactionDuration
    : selected
      ? RESERVOIR_OPENING_TIMING.selectedEmbedDuration
      : RESERVOIR_OPENING_TIMING.nodeReactionDuration;
  const progress = THREE.MathUtils.clamp(
    (elapsed - openingReactionDelay) / reactionDuration,
    0,
    1,
  );
  const targetOffset =
    nodeRadius *
    (selected
      ? RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER
      : RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER);

  if (reducedMotion || selected) {
    return {
      progress,
      radialOffset: THREE.MathUtils.lerp(
        startOffset,
        targetOffset,
        easeOutCubic(progress),
      ),
    };
  }

  const perkEnd = 0.24;
  const perkOffset = nodeRadius * RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER;
  return {
    progress,
    radialOffset:
      progress <= perkEnd
        ? THREE.MathUtils.lerp(
            startOffset,
            startOffset + perkOffset,
            easeOutCubic(progress / perkEnd),
          )
        : THREE.MathUtils.lerp(
            startOffset + perkOffset,
            targetOffset,
            easeInCubic((progress - perkEnd) / (1 - perkEnd)),
          ),
  };
}

type RestorationOffsetOptions = {
  nodeRadius: number;
  progress: number;
  restoredOffset: number;
  selected: boolean;
};

export function getReservoirNodeRestorationOffset({
  nodeRadius,
  progress,
  restoredOffset,
  selected,
}: RestorationOffsetOptions) {
  const openingOffset =
    nodeRadius *
    (selected
      ? RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER
      : RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER);

  return THREE.MathUtils.lerp(openingOffset, restoredOffset, progress);
}
