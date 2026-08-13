import { getArtifactSecondSelectionImpactStart } from "@/lib/reservoir/second-selection";

export const RESERVOIR_OPENING_TIMING = {
  totalDuration: 3.1,
  reducedMotionDuration: 0.72,
  cameraDelay: 0.55,
  reducedMotionCameraDelay: 0.08,
  shockwaveStart: 0.04,
  shockwaveDuration: 1.72,
  reducedMotionShockwaveDuration: 0.24,
  nodeReactionDuration: 0.72,
  reducedMotionNodeReactionDuration: 0.28,
  selectedEmbedDuration: 1.08,
  sphereDarkenStart: 0.04,
  sphereDarkenEnd: 1.76,
} as const;

export const RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER = -2.35;
export const RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER = -0.62;
export const RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER = 0.42;
export const RESERVOIR_SHOCKWAVE_GRAPH_WIDTH = 1.25;
export const RESERVOIR_SHOCKWAVE_RANGE_GAIN = 1.12;

export function getOpeningDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionDuration
    : RESERVOIR_OPENING_TIMING.totalDuration;
}

export function getOpeningCameraDelay(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionCameraDelay
    : RESERVOIR_OPENING_TIMING.cameraDelay;
}

export function getShockwaveDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionShockwaveDuration
    : RESERVOIR_OPENING_TIMING.shockwaveDuration;
}

export function getShockwaveStart(reducedMotion: boolean) {
  return getArtifactSecondSelectionImpactStart(reducedMotion);
}

export function getNodeReactionArrival(
  graphDistance: number,
  maximumArtifactDistance: number,
  reducedMotion: boolean,
  waveStart: number = RESERVOIR_OPENING_TIMING.shockwaveStart,
) {
  if (reducedMotion) return waveStart;

  if (graphDistance === 0) {
    return waveStart;
  }

  const waveRange = Math.max(
    maximumArtifactDistance * RESERVOIR_SHOCKWAVE_RANGE_GAIN,
    1,
  );
  const normalizedWaveFront = Math.min(
    Math.max(
      (graphDistance + RESERVOIR_SHOCKWAVE_GRAPH_WIDTH) /
        (waveRange + RESERVOIR_SHOCKWAVE_GRAPH_WIDTH * 2),
      0,
    ),
    1,
  );
  const waveProgress = 1 - Math.sqrt(1 - normalizedWaveFront);

  return (
    waveStart +
    waveProgress * RESERVOIR_OPENING_TIMING.shockwaveDuration
  );
}

export function getSphereRecessionProgress(
  elapsed: number,
  reducedMotion: boolean,
) {
  if (reducedMotion) {
    return Math.min(
      elapsed / RESERVOIR_OPENING_TIMING.reducedMotionDuration,
      1,
    );
  }

  return Math.min(
    Math.max(
      (elapsed - RESERVOIR_OPENING_TIMING.sphereDarkenStart) /
        (RESERVOIR_OPENING_TIMING.sphereDarkenEnd -
          RESERVOIR_OPENING_TIMING.sphereDarkenStart),
      0,
    ),
    1,
  );
}
