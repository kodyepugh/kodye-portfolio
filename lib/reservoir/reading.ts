export const RESERVOIR_READING_TIMING = {
  windowDeployDuration: 0.68,
  reducedMotionWindowDeployDuration: 0.16,
  windowRetractDuration: 0.52,
  reducedMotionWindowRetractDuration: 0.14,
  reservoirRestoreDuration: 1.12,
  reducedMotionReservoirRestoreDuration: 0.32,
} as const;

export function getInspectionWindowDeployDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_READING_TIMING.reducedMotionWindowDeployDuration
    : RESERVOIR_READING_TIMING.windowDeployDuration;
}

export function getInspectionWindowRetractDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_READING_TIMING.reducedMotionWindowRetractDuration
    : RESERVOIR_READING_TIMING.windowRetractDuration;
}

/** Compatibility aliases for the previous ArtifactWindow API. */
export const getArtifactWindowDeployDuration = getInspectionWindowDeployDuration;
export const getArtifactWindowRetractDuration =
  getInspectionWindowRetractDuration;

export function getReservoirRestoreDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_READING_TIMING.reducedMotionReservoirRestoreDuration
    : RESERVOIR_READING_TIMING.reservoirRestoreDuration;
}

export function getReservoirRestoreProgress(
  elapsed: number,
  reducedMotion: boolean,
) {
  const duration = getReservoirRestoreDuration(reducedMotion);
  const progress = Math.min(Math.max(elapsed / duration, 0), 1);

  return 1 - (1 - progress) ** 3;
}
