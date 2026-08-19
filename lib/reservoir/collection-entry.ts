import * as THREE from "three";
import {
  RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER,
  RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
} from "@/lib/reservoir/opening";

export type CollectionReconstitutionPhase =
  | "idle"
  | "deactivating"
  | "reactivating";

export type CollectionNodeTransitionPhase = "departure" | "arrival";

export const COLLECTION_RECONSTITUTION_TIMING = {
  duration: 1.72,
  reducedMotionDuration: 0.52,
  handoff: 0.5,
  nodeStagger: 0.24,
  destinationNodesSettled: 1,
} as const;

const COLLECTION_RECONSTITUTION_HANDOFF_LEAD = 0.06;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const normalized = clamp01(value);
  return normalized * normalized * (3 - 2 * normalized);
}

function easeInCubic(progress: number) {
  return progress * progress * progress;
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function getCollectionTwinkleEnvelope(progress: number) {
  const settledStart = 0.82;
  if (progress < settledStart) return 1;
  return 1 - smoothstep01((progress - settledStart) / (1 - settledStart));
}

function getCollectionReactivationProgress(progress: number) {
  return smoothstep01(
    (progress - COLLECTION_RECONSTITUTION_TIMING.handoff +
      COLLECTION_RECONSTITUTION_HANDOFF_LEAD) /
      (1 -
        COLLECTION_RECONSTITUTION_TIMING.handoff +
        COLLECTION_RECONSTITUTION_HANDOFF_LEAD),
  );
}

export function getCollectionReconstitutionDuration(reducedMotion: boolean) {
  return reducedMotion
    ? COLLECTION_RECONSTITUTION_TIMING.reducedMotionDuration
    : COLLECTION_RECONSTITUTION_TIMING.duration;
}

export function getCollectionReconstitutionFrame(progress: number) {
  const normalized = clamp01(progress);
  const handoff = COLLECTION_RECONSTITUTION_TIMING.handoff;
  const deactivationProgress = smoothstep01(normalized / handoff);
  const reactivationProgress = getCollectionReactivationProgress(normalized);
  const twinkleEnvelope = getCollectionTwinkleEnvelope(normalized);

  return {
    progress: normalized,
    deactivationProgress,
    reactivationProgress,
    emergenceProgress: reactivationProgress,
    destinationNodesSettled:
      normalized >= COLLECTION_RECONSTITUTION_TIMING.destinationNodesSettled,
    twinkleEnvelope,
    // The color drain and return are exact mirrors around the semantic handoff.
    neutrality: normalized <= handoff
      ? deactivationProgress
      : 1 - reactivationProgress,
  };
}

export function getCollectionNodeTransitionProgress(
  progress: number,
  phase: CollectionNodeTransitionPhase,
  order: number,
  childCount: number,
) {
  const handoff = COLLECTION_RECONSTITUTION_TIMING.handoff;
  const phaseProgress = phase === "departure"
    ? clamp01(progress / handoff)
    : getCollectionReactivationProgress(progress);
  const stagger = childCount > 1
    ? (Math.min(Math.max(order, 0), childCount - 1) / (childCount - 1)) *
      COLLECTION_RECONSTITUTION_TIMING.nodeStagger
    : 0;

  return clamp01(
    (phaseProgress - stagger) /
      Math.max(1 - COLLECTION_RECONSTITUTION_TIMING.nodeStagger, Number.EPSILON),
  );
}

type CollectionNodeTransitionOffsetOptions = {
  nodeRadius: number;
  progress: number;
  phase: CollectionNodeTransitionPhase;
  startOffset?: number;
  settledOffset?: number;
  reducedMotion: boolean;
};

function getCollectionDepartureOffset({
  nodeRadius,
  progress,
  startOffset = 0,
  reducedMotion,
}: Omit<CollectionNodeTransitionOffsetOptions, "phase" | "settledOffset">) {
  const normalized = clamp01(progress);
  const submergedOffset =
    nodeRadius * RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER;

  if (reducedMotion) {
    return THREE.MathUtils.lerp(startOffset, submergedOffset, easeOutCubic(normalized));
  }

  const perkEnd = 0.24;
  const perkOffset = nodeRadius * RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER;
  return normalized <= perkEnd
    ? THREE.MathUtils.lerp(
        startOffset,
        startOffset + perkOffset,
        easeOutCubic(normalized / perkEnd),
      )
    : THREE.MathUtils.lerp(
        startOffset + perkOffset,
        submergedOffset,
        easeInCubic((normalized - perkEnd) / (1 - perkEnd)),
      );
}

export function getCollectionNodeTransitionOffset({
  nodeRadius,
  progress,
  phase,
  startOffset = 0,
  settledOffset = 0,
  reducedMotion,
}: CollectionNodeTransitionOffsetOptions) {
  if (phase === "departure") {
    return getCollectionDepartureOffset({
      nodeRadius,
      progress,
      startOffset,
      reducedMotion,
    });
  }

  // Arrival is the exact temporal inverse of departure, including its perk.
  return getCollectionDepartureOffset({
    nodeRadius,
    progress: 1 - clamp01(progress),
    startOffset: settledOffset,
    reducedMotion,
  });
}

export function getCollectionChildEmergenceProgress(
  progress: number,
  order: number,
  childCount: number,
) {
  return getCollectionNodeTransitionProgress(
    progress,
    "arrival",
    order,
    childCount,
  );
}
