import {
  RESERVOIR_COLLECTION_NODE_RADIUS,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import type { ReservoirLayout } from "@/lib/reservoir/layout";

export type ReservoirNodeKind = "artifact" | "collection";

export const RESERVOIR_NODE_SIZING_REFERENCE_POPULATION = 24;
export const RESERVOIR_NODE_CLEARANCE_RATIO = 0.6;

export const RESERVOIR_NODE_SPARSE_MAX_POPULATION = 2;
export const RESERVOIR_NODE_SPARSE_MAX_SCALE = 7;
export const RESERVOIR_NODE_SPARSE_SHOULDER_POPULATION = 6;
export const RESERVOIR_NODE_SPARSE_SHOULDER_SCALE = 5.5;

export const RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER =
  RESERVOIR_NODE_RADIUS * 2;
export const RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER =
  RESERVOIR_COLLECTION_NODE_RADIUS * 2;

export const RESERVOIR_ARTIFACT_NODE_MAX_SCALE =
  RESERVOIR_NODE_SPARSE_MAX_SCALE;
export const RESERVOIR_COLLECTION_NODE_MAX_SCALE =
  RESERVOIR_NODE_SPARSE_MAX_SCALE;

type ReservoirNodeSizingTargets = {
  populationCount: number;
  rawScale: number;
  densityProgress: number;
  artifactReferenceDiameter: number;
  artifactScale: number;
  collectionReferenceDiameter: number;
  collectionScale: number;
  desiredArtifactDiameter: number;
  desiredCollectionDiameter: number;
};

export type ReservoirNodeSizingSnapshot = ReservoirNodeSizingTargets & {
  layoutSafetyScale: number;
  minimumAngularSeparation: number;
  minimumSurfaceDistance: number;
  maximumSafeDiameter: number;
  artifactDiameter: number;
  artifactRadius: number;
  collectionDiameter: number;
  collectionRadius: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function smoothstep01(value: number) {
  const normalized = clamp01(value);
  return normalized * normalized * (3 - 2 * normalized);
}

export function getReservoirNodePopulationScale(totalNodeCount: number) {
  const populationCount = Math.max(1, totalNodeCount);

  if (populationCount <= RESERVOIR_NODE_SPARSE_MAX_POPULATION) {
    return RESERVOIR_NODE_SPARSE_MAX_SCALE;
  }

  if (populationCount <= RESERVOIR_NODE_SPARSE_SHOULDER_POPULATION) {
    const progress = smoothstep01(
      (populationCount - RESERVOIR_NODE_SPARSE_MAX_POPULATION) /
        (RESERVOIR_NODE_SPARSE_SHOULDER_POPULATION -
          RESERVOIR_NODE_SPARSE_MAX_POPULATION),
    );
    return lerp(
      RESERVOIR_NODE_SPARSE_MAX_SCALE,
      RESERVOIR_NODE_SPARSE_SHOULDER_SCALE,
      progress,
    );
  }

  if (populationCount <= RESERVOIR_NODE_SIZING_REFERENCE_POPULATION) {
    const progress = smoothstep01(
      Math.log(
        populationCount / RESERVOIR_NODE_SPARSE_SHOULDER_POPULATION,
      ) /
        Math.log(
          RESERVOIR_NODE_SIZING_REFERENCE_POPULATION /
            RESERVOIR_NODE_SPARSE_SHOULDER_POPULATION,
        ),
    );
    return lerp(RESERVOIR_NODE_SPARSE_SHOULDER_SCALE, 1, progress);
  }

  return Math.sqrt(RESERVOIR_NODE_SIZING_REFERENCE_POPULATION / populationCount);
}

export function getReservoirNodeDensityProgress(totalNodeCount: number) {
  const populationScale = getReservoirNodePopulationScale(totalNodeCount);
  return 1 - clamp01(populationScale / RESERVOIR_NODE_SPARSE_MAX_SCALE);
}

export function getReservoirNodeSizingTargets(
  totalNodeCount: number,
): ReservoirNodeSizingTargets {
  const populationCount = Math.max(1, totalNodeCount);
  const rawScale = getReservoirNodePopulationScale(populationCount);

  return {
    populationCount: totalNodeCount,
    rawScale,
    densityProgress: getReservoirNodeDensityProgress(populationCount),
    artifactReferenceDiameter: RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER,
    artifactScale: rawScale,
    collectionReferenceDiameter:
      RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER,
    collectionScale: rawScale,
    desiredArtifactDiameter:
      RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER * rawScale,
    desiredCollectionDiameter:
      RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER * rawScale,
  };
}

function dotDirection(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
) {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

function getReservoirPairCenterDistance(
  angularSeparation: number,
  firstDiameter: number,
  secondDiameter: number,
  layoutScale: number,
) {
  const firstCenterRadius =
    RESERVOIR_RADIUS + firstDiameter * layoutScale * 0.02;
  const secondCenterRadius =
    RESERVOIR_RADIUS + secondDiameter * layoutScale * 0.02;
  const cosine = Math.cos(angularSeparation);
  const centerDistanceSquared =
    firstCenterRadius * firstCenterRadius +
    secondCenterRadius * secondCenterRadius -
    2 * firstCenterRadius * secondCenterRadius * cosine;

  return Math.sqrt(Math.max(0, centerDistanceSquared));
}

function isReservoirPairSafe(
  angularSeparation: number,
  firstDiameter: number,
  secondDiameter: number,
  layoutScale: number,
) {
  const firstRadius = (firstDiameter * layoutScale) / 2;
  const secondRadius = (secondDiameter * layoutScale) / 2;
  const availableDistance =
    getReservoirPairCenterDistance(
      angularSeparation,
      firstDiameter,
      secondDiameter,
      layoutScale,
    ) * RESERVOIR_NODE_CLEARANCE_RATIO;

  return availableDistance >= firstRadius + secondRadius;
}

function getReservoirPairMaximumSafeScale(
  angularSeparation: number,
  firstDiameter: number,
  secondDiameter: number,
) {
  if (!Number.isFinite(angularSeparation) || angularSeparation <= 0) {
    return 0;
  }

  if (isReservoirPairSafe(angularSeparation, firstDiameter, secondDiameter, 1)) {
    return 1;
  }

  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (
      isReservoirPairSafe(
        angularSeparation,
        firstDiameter,
        secondDiameter,
        midpoint,
      )
    ) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return lower;
}

export function getReservoirLayoutMaximumSafeScale(
  layout: ReservoirLayout,
  nodeDiameters: ReadonlyMap<string, number>,
) {
  const directions = [...layout.entries()];
  if (directions.length < 2) return 1;

  let maximumSafeScale = 1;
  for (let firstIndex = 0; firstIndex < directions.length; firstIndex += 1) {
    const [firstNodeId, firstDirection] = directions[firstIndex];
    const firstDiameter = nodeDiameters.get(firstNodeId);
    if (firstDiameter === undefined) {
      throw new Error(`Missing reservoir node diameter: ${firstNodeId}`);
    }

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < directions.length;
      secondIndex += 1
    ) {
      const [secondNodeId, secondDirection] = directions[secondIndex];
      const secondDiameter = nodeDiameters.get(secondNodeId);
      if (secondDiameter === undefined) {
        throw new Error(`Missing reservoir node diameter: ${secondNodeId}`);
      }

      const angularSeparation = Math.acos(
        Math.max(-1, Math.min(1, dotDirection(firstDirection, secondDirection))),
      );
      maximumSafeScale = Math.min(
        maximumSafeScale,
        getReservoirPairMaximumSafeScale(
          angularSeparation,
          firstDiameter,
          secondDiameter,
        ),
      );
    }
  }

  return clamp01(maximumSafeScale);
}

export function getReservoirLayoutMinimumAngularSeparation(
  layout: ReservoirLayout,
) {
  const directions = [...layout.values()];
  if (directions.length < 2) return Math.PI;

  let minimumAngularSeparation = Math.PI;
  for (let firstIndex = 0; firstIndex < directions.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < directions.length;
      secondIndex += 1
    ) {
      const angularSeparation = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            dotDirection(directions[firstIndex], directions[secondIndex]),
          ),
        ),
      );
      minimumAngularSeparation = Math.min(
        minimumAngularSeparation,
        angularSeparation,
      );
    }
  }

  return minimumAngularSeparation;
}

export function getReservoirLayoutMinimumSurfaceDistance(
  layout: ReservoirLayout,
) {
  const minimumAngularSeparation = getReservoirLayoutMinimumAngularSeparation(
    layout,
  );
  return 2 * Math.sin(minimumAngularSeparation / 2) * RESERVOIR_RADIUS;
}

export function getReservoirLayoutMaximumSafeDiameter(
  layout: ReservoirLayout,
) {
  const minimumAngularSeparation = getReservoirLayoutMinimumAngularSeparation(
    layout,
  );

  if (
    !Number.isFinite(minimumAngularSeparation) ||
    minimumAngularSeparation <= 0
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const chordScale =
    2 * Math.sin(minimumAngularSeparation / 2) * RESERVOIR_NODE_CLEARANCE_RATIO;
  const denominator = 1 - chordScale * 0.02;
  if (denominator <= Number.EPSILON) return Number.POSITIVE_INFINITY;

  return (chordScale * RESERVOIR_RADIUS) / denominator;
}

export function getReservoirNodeSizingSnapshot(
  layout: ReservoirLayout,
  totalNodeCount: number,
  nodeDiameters: ReadonlyMap<string, number>,
): ReservoirNodeSizingSnapshot {
  const targets = getReservoirNodeSizingTargets(totalNodeCount);
  const minimumAngularSeparation = getReservoirLayoutMinimumAngularSeparation(
    layout,
  );
  const minimumSurfaceDistance =
    getReservoirLayoutMinimumSurfaceDistance(layout);
  const layoutSafetyScale = getReservoirLayoutMaximumSafeScale(
    layout,
    nodeDiameters,
  );
  if (!Number.isFinite(layoutSafetyScale) || layoutSafetyScale <= 0) {
    throw new Error("Invalid reservoir layout safety scale.");
  }

  const resolvedScale = targets.rawScale * layoutSafetyScale;
  const artifactDiameter =
    RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER * resolvedScale;
  const collectionDiameter =
    RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER * resolvedScale;

  return {
    ...targets,
    artifactScale: resolvedScale,
    collectionScale: resolvedScale,
    desiredArtifactDiameter: targets.desiredArtifactDiameter,
    desiredCollectionDiameter: targets.desiredCollectionDiameter,
    layoutSafetyScale,
    minimumAngularSeparation,
    minimumSurfaceDistance,
    maximumSafeDiameter: getReservoirLayoutMaximumSafeDiameter(layout),
    artifactDiameter,
    artifactRadius: artifactDiameter / 2,
    collectionDiameter,
    collectionRadius: collectionDiameter / 2,
  };
}
