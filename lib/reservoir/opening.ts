export const RESERVOIR_OPENING_TIMING = {
  totalDuration: 3.1,
  reducedMotionDuration: 0.72,
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
const RESERVOIR_REACTION_WAVE_ANGULAR_PADDING = 1.25;
const RESERVOIR_REACTION_WAVE_RANGE_GAIN = 1.12;

export function getOpeningDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionDuration
    : RESERVOIR_OPENING_TIMING.totalDuration;
}

export function getShockwaveDuration(reducedMotion: boolean) {
  return reducedMotion
    ? RESERVOIR_OPENING_TIMING.reducedMotionShockwaveDuration
    : RESERVOIR_OPENING_TIMING.shockwaveDuration;
}

export function getShockwaveStart(reducedMotion: boolean) {
  return reducedMotion ? 0.025 : 0.1;
}

export function getNodeReactionArrival(
  angularDistance: number,
  maximumAngularDistance: number,
  reducedMotion: boolean,
  waveStart: number = RESERVOIR_OPENING_TIMING.shockwaveStart,
) {
  if (reducedMotion) return waveStart;

  if (angularDistance === 0) {
    return waveStart;
  }

  const waveRange = Math.max(
    maximumAngularDistance * RESERVOIR_REACTION_WAVE_RANGE_GAIN,
    1,
  );
  const normalizedWaveFront = Math.min(
    Math.max(
      (angularDistance + RESERVOIR_REACTION_WAVE_ANGULAR_PADDING) /
        (waveRange + RESERVOIR_REACTION_WAVE_ANGULAR_PADDING * 2),
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
