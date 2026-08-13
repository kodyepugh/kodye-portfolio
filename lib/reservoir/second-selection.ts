export type SecondSelectionTopologyMode =
  | "artifact-open"
  | "collection-retract";

export type SecondSelectionTopologyPhase =
  | "waiting"
  | "expanding"
  | "dissipating"
  | "retracting"
  | "resolved";

export type SecondSelectionTopologyFrame = {
  expansion: number;
  expandedBlend: number;
  phase: SecondSelectionTopologyPhase;
  progress: number;
  propagationProgress: number;
  strength: number;
};

export type RadialTopologyCell = {
  baseIntensities: number[];
  canonical: boolean;
  id: string;
  localVertices: Array<{ x: number; y: number }>;
};

export type RadialTopologyAssignment = {
  id: string;
  intensities: number[];
};

const ARTIFACT_TOPOLOGY_EXPANSION = 1.5;

const SECOND_SELECTION_TIMING = {
  artifact: {
    delay: 0.1,
    duration: 0.9,
    expansionEnd: 0.48,
  },
  collection: {
    duration: 0.52,
  },
  reducedMotion: {
    artifactDelay: 0.025,
    artifactDuration: 0.16,
    artifactExpansion: 1.18,
    collectionDuration: 0.18,
    expansionEnd: 0.42,
  },
} as const;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function smoothstep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function getRadialIntensityProfile(
  canonicalCells: readonly RadialTopologyCell[],
) {
  const samplesByRadius = new Map<
    string,
    { intensities: number[]; radius: number }
  >();
  for (const cell of canonicalCells) {
    for (let index = 0; index < cell.localVertices.length; index += 1) {
      const vertex = cell.localVertices[index];
      const intensity = cell.baseIntensities[index] ?? 0;
      const radius = Math.hypot(vertex.x, vertex.y);
      const key = radius.toFixed(6);
      const sample = samplesByRadius.get(key) ?? {
        intensities: [],
        radius,
      };
      sample.intensities.push(intensity);
      samplesByRadius.set(key, sample);
    }
  }

  const profile = [...samplesByRadius.values()]
    .map(({ intensities, radius }) => ({
      intensity:
        intensities.reduce((total, intensity) => total + intensity, 0) /
        intensities.length,
      radius,
    }))
    .sort((first, second) => first.radius - second.radius);
  for (let index = 1; index < profile.length; index += 1) {
    profile[index].intensity = Math.min(
      profile[index].intensity,
      profile[index - 1].intensity,
    );
  }
  return profile;
}

function sampleRadialIntensity(
  profile: ReturnType<typeof getRadialIntensityProfile>,
  radius: number,
) {
  if (profile.length === 0) return 0;
  if (radius <= profile[0].radius) return profile[0].intensity;
  for (let index = 1; index < profile.length; index += 1) {
    const inner = profile[index - 1];
    const outer = profile[index];
    if (radius > outer.radius) continue;
    const span = Math.max(outer.radius - inner.radius, Number.EPSILON);
    const progress = clamp01((radius - inner.radius) / span);
    return inner.intensity + (outer.intensity - inner.intensity) * progress;
  }
  return 0;
}

export function mapRadialTopologyExpansion({
  cells,
  expansion,
}: {
  cells: readonly RadialTopologyCell[];
  expansion: number;
}): RadialTopologyAssignment[] {
  const canonicalCells = cells.filter((cell) => cell.canonical);
  const profile = getRadialIntensityProfile(canonicalCells);
  const canonicalRadius = Math.max(
    Number.EPSILON,
    ...canonicalCells.flatMap((cell) =>
      cell.localVertices.map((vertex) => Math.hypot(vertex.x, vertex.y)),
    ),
  );
  const expandedRadius = canonicalRadius * Math.max(expansion, 1);
  const boundaryWidth = Math.max(expandedRadius * 0.14, Number.EPSILON);
  const assignments: RadialTopologyAssignment[] = [];

  for (const cell of cells) {
    const intensities = cell.localVertices.map((vertex) => {
      const radius = Math.hypot(vertex.x, vertex.y);
      const boundaryCoverage =
        1 -
        smoothstep(
          clamp01(
            (radius - (expandedRadius - boundaryWidth)) / boundaryWidth,
          ),
        );
      return (
        sampleRadialIntensity(
          profile,
          radius / Math.max(expansion, Number.EPSILON),
        ) * boundaryCoverage
      );
    });
    if (Math.max(...intensities) <= 0.001) continue;
    assignments.push({ id: cell.id, intensities });
  }

  return assignments;
}

export function getArtifactSecondSelectionImpactStart(
  reducedMotion: boolean,
) {
  return reducedMotion
    ? SECOND_SELECTION_TIMING.reducedMotion.artifactDelay
    : SECOND_SELECTION_TIMING.artifact.delay;
}

export function getSecondSelectionTopologyFrame({
  elapsed,
  mode,
  reducedMotion,
}: {
  elapsed: number;
  mode: SecondSelectionTopologyMode;
  reducedMotion: boolean;
}): SecondSelectionTopologyFrame {
  if (mode === "collection-retract") {
    const duration = reducedMotion
      ? SECOND_SELECTION_TIMING.reducedMotion.collectionDuration
      : SECOND_SELECTION_TIMING.collection.duration;
    const progress = clamp01(elapsed / duration);
    return {
      expansion: 1,
      expandedBlend: 0,
      phase: progress >= 1 ? "resolved" : "retracting",
      progress,
      propagationProgress: 1 - smoothstep(progress),
      strength: 1,
    };
  }

  const delay = getArtifactSecondSelectionImpactStart(reducedMotion);
  const duration = reducedMotion
    ? SECOND_SELECTION_TIMING.reducedMotion.artifactDuration
    : SECOND_SELECTION_TIMING.artifact.duration;
  const progress = clamp01((elapsed - delay) / duration);
  const expansionEnd = reducedMotion
    ? SECOND_SELECTION_TIMING.reducedMotion.expansionEnd
    : SECOND_SELECTION_TIMING.artifact.expansionEnd;
  const maximumExpansion = reducedMotion
    ? SECOND_SELECTION_TIMING.reducedMotion.artifactExpansion
    : ARTIFACT_TOPOLOGY_EXPANSION;

  if (elapsed < delay) {
    return {
      expansion: 1,
      expandedBlend: 0,
      phase: "waiting",
      progress: 0,
      propagationProgress: 1,
      strength: 1,
    };
  }

  const expansionProgress = clamp01(progress / expansionEnd);
  const dissipationProgress = clamp01(
    (progress - expansionEnd) / (1 - expansionEnd),
  );
  return {
    expansion:
      1 +
      (maximumExpansion - 1) * easeOutCubic(expansionProgress),
    expandedBlend: smoothstep(clamp01(progress / 0.12)),
    phase:
      progress >= 1
        ? "resolved"
        : progress <= expansionEnd
          ? "expanding"
          : "dissipating",
    progress,
    propagationProgress: progress >= 1 ? 0 : 1,
    strength: 1 - smoothstep(dissipationProgress),
  };
}
