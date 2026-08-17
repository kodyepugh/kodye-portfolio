export type CollectionReconstitutionPhase =
  | "idle"
  | "deactivating"
  | "handoff"
  | "reactivating";

export const COLLECTION_RECONSTITUTION_TIMING = {
  duration: 1.72,
  reducedMotionDuration: 0.52,
  handoff: 0.5,
  neutralStart: 0.46,
  neutralEnd: 0.54,
  nodeEmergenceStart: 0.53,
  destinationNodesSettled: 0.88,
  reactivationEnd: 0.88,
} as const;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smoothstep01(value: number) {
  const normalized = clamp01(value);
  return normalized * normalized * (3 - 2 * normalized);
}

function getCollectionTwinkleEnvelope(progress: number) {
  const {
    neutralStart,
    neutralEnd,
    destinationNodesSettled,
  } = COLLECTION_RECONSTITUTION_TIMING;
  const neutralEnvelope = 0.58;
  const activeEnvelope = 0.9;

  if (progress < neutralStart) {
    return 1 -
      (1 - neutralEnvelope) * smoothstep01(progress / neutralStart);
  }
  if (progress < neutralEnd) return neutralEnvelope;
  if (progress < destinationNodesSettled) {
    return neutralEnvelope +
      (activeEnvelope - neutralEnvelope) *
        smoothstep01(
          (progress - neutralEnd) /
            (destinationNodesSettled - neutralEnd),
        );
  }
  return activeEnvelope *
    (1 -
      smoothstep01(
        (progress - destinationNodesSettled) /
          (1 - destinationNodesSettled),
      ));
}

export function getCollectionReconstitutionDuration(reducedMotion: boolean) {
  return reducedMotion
    ? COLLECTION_RECONSTITUTION_TIMING.reducedMotionDuration
    : COLLECTION_RECONSTITUTION_TIMING.duration;
}

export function getCollectionReconstitutionFrame(progress: number) {
  const normalized = clamp01(progress);
  const handoff = COLLECTION_RECONSTITUTION_TIMING.handoff;
  const destinationNodesSettled =
    COLLECTION_RECONSTITUTION_TIMING.destinationNodesSettled;
  const deactivationProgress = smoothstep01(normalized / handoff);
  const reactivationProgress = smoothstep01(
    (normalized - handoff) /
      (COLLECTION_RECONSTITUTION_TIMING.reactivationEnd - handoff),
  );
  const emergenceProgress = smoothstep01(
    (normalized - COLLECTION_RECONSTITUTION_TIMING.nodeEmergenceStart) /
      (destinationNodesSettled -
        COLLECTION_RECONSTITUTION_TIMING.nodeEmergenceStart),
  );
  const twinkleEnvelope = getCollectionTwinkleEnvelope(normalized);

  return {
    progress: normalized,
    deactivationProgress,
    reactivationProgress,
    emergenceProgress,
    destinationNodesSettled: normalized >= destinationNodesSettled,
    twinkleEnvelope,
    neutrality: normalized < handoff
      ? deactivationProgress
      : 1 - reactivationProgress,
  };
}

export function getCollectionChildEmergenceProgress(
  progress: number,
  order: number,
  childCount: number,
) {
  const maximumDelay = childCount > 1 ? 0.34 : 0;
  const delay = childCount > 1
    ? (order / (childCount - 1)) * maximumDelay
    : 0;
  const normalized = clamp01(
    (progress - delay) / (1 - maximumDelay),
  );

  return 1 - (1 - normalized) ** 3;
}
