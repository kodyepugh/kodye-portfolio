import {
  RESERVOIR_COLLECTION_NODE_RADIUS,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import type { ReservoirLayout } from "@/lib/reservoir/layout";

export type ReservoirNodeKind = "artifact" | "collection";

export const RESERVOIR_NODE_SIZING_REFERENCE_POPULATION = 24;
export const RESERVOIR_NODE_CLEARANCE_RATIO = 0.6;

export const RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER =
  RESERVOIR_NODE_RADIUS * 2;
export const RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER =
  RESERVOIR_COLLECTION_NODE_RADIUS * 2;

export const RESERVOIR_ARTIFACT_NODE_MAX_SCALE = 3;
export const RESERVOIR_ARTIFACT_NODE_MIN_SCALE = 0.25;
export const RESERVOIR_COLLECTION_NODE_MAX_SCALE = 2.5;
export const RESERVOIR_COLLECTION_NODE_MIN_SCALE = 0.25;

type ReservoirNodeSizingTargets = {
  populationCount: number;
  rawScale: number;
  populationProgress: number;
  artifactReferenceDiameter: number;
  artifactScale: number;
  collectionReferenceDiameter: number;
  collectionScale: number;
  desiredArtifactDiameter: number;
  desiredCollectionDiameter: number;
};

export type ReservoirNodeSizingSnapshot = ReservoirNodeSizingTargets & {
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

function inverseLerp(minimum: number, maximum: number, value: number) {
  const denominator = maximum - minimum;
  if (Math.abs(denominator) < Number.EPSILON) return 0;
  return (value - minimum) / denominator;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getReservoirNodePopulationProgress(totalNodeCount: number) {
  const { populationProgress } = getReservoirNodeSizingTargets(totalNodeCount);
  return populationProgress;
}

export function getReservoirNodeSizingTargets(
  totalNodeCount: number,
): ReservoirNodeSizingTargets {
  const populationCount = Math.max(1, totalNodeCount);
  const rawScale = Math.sqrt(
    RESERVOIR_NODE_SIZING_REFERENCE_POPULATION / populationCount,
  );
  const artifactScale = clamp(
    rawScale,
    RESERVOIR_ARTIFACT_NODE_MIN_SCALE,
    RESERVOIR_ARTIFACT_NODE_MAX_SCALE,
  );
  const collectionScale = clamp(
    rawScale,
    RESERVOIR_COLLECTION_NODE_MIN_SCALE,
    RESERVOIR_COLLECTION_NODE_MAX_SCALE,
  );

  return {
    populationCount: totalNodeCount,
    rawScale,
    populationProgress: clamp01(
      inverseLerp(
        RESERVOIR_ARTIFACT_NODE_MIN_SCALE,
        RESERVOIR_ARTIFACT_NODE_MAX_SCALE,
        artifactScale,
      ),
    ),
    artifactReferenceDiameter: RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER,
    artifactScale,
    collectionReferenceDiameter:
      RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER,
    collectionScale,
    desiredArtifactDiameter:
      RESERVOIR_ARTIFACT_NODE_REFERENCE_DIAMETER * artifactScale,
    desiredCollectionDiameter:
      RESERVOIR_COLLECTION_NODE_REFERENCE_DIAMETER * collectionScale,
  };
}

function dotDirection(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
) {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
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
): ReservoirNodeSizingSnapshot {
  const targets = getReservoirNodeSizingTargets(totalNodeCount);
  const minimumAngularSeparation = getReservoirLayoutMinimumAngularSeparation(
    layout,
  );
  const minimumSurfaceDistance =
    getReservoirLayoutMinimumSurfaceDistance(layout);
  const maximumSafeDiameter = getReservoirLayoutMaximumSafeDiameter(layout);
  const artifactDiameter = Math.min(
    targets.desiredArtifactDiameter,
    maximumSafeDiameter,
  );
  const collectionDiameter = Math.min(
    targets.desiredCollectionDiameter,
    maximumSafeDiameter,
  );

  return {
    ...targets,
    minimumAngularSeparation,
    minimumSurfaceDistance,
    maximumSafeDiameter,
    artifactDiameter,
    artifactRadius: artifactDiameter / 2,
    collectionDiameter,
    collectionRadius: collectionDiameter / 2,
  };
}
