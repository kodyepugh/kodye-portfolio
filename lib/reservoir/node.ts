import * as THREE from "three";
import {
  reservoirVertices,
  RESERVOIR_LABEL_RADIAL_OFFSET,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
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
  vertexId: number,
  nodeRadius: number,
) {
  const vertex = reservoirVertices[vertexId];
  if (!vertex) return null;

  const normal = vertex.clone().normalize();
  const labelPosition = normal
    .clone()
    .multiplyScalar(RESERVOIR_LABEL_RADIAL_OFFSET);

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
