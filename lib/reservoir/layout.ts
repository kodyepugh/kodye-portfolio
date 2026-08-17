import { RESERVOIR_LAYOUT_MODE_VIEW_QUATERNION } from "@/lib/reservoir/geometry";
import {
  getReservoirLayoutMaximumSafeDiameter,
  getReservoirLayoutMaximumSafeScale,
} from "@/lib/reservoir/node-sizing";

export type ReservoirDirection = readonly [number, number, number];

export type ReservoirLayout = ReadonlyMap<string, ReservoirDirection>;

export type ReservoirLayoutMode = "distributed" | "focused";

export type ReservoirQuaternion = readonly [number, number, number, number];

type ReservoirLayoutNode = {
  id: string;
};

type ReservoirLayoutOptions = {
  seed: string;
  mode?: ReservoirLayoutMode;
  viewQuaternion?: ReservoirQuaternion;
  focusedDirection?: ReservoirDirection;
  minimumNodeDiameter?: number;
  nodeDiameters?: ReadonlyMap<string, number>;
};

type ReservoirViewBasis = {
  viewerDirection: ReservoirDirection;
  viewportUpDirection: ReservoirDirection;
};

export type ReservoirInitialComposition = {
  candidateCount: number;
  projectedMinimumSeparation: number;
  quaternion: ReservoirQuaternion;
  silhouetteNodeCount: number;
  targetVisibleNodeCount: number;
  visibleNodeCount: number;
};

const FULL_TURN = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DIRECTION_EPSILON = 1e-12;
const LAYOUT_CANDIDATE_COUNT = 512;
const INITIAL_ORIENTATION_AXIS_COUNT = 48;
const INITIAL_ORIENTATION_ROLL_COUNT = 6;
const INITIAL_VISIBLE_DEPTH = 0.08;
const INITIAL_SILHOUETTE_DEPTH = 0.16;
const MINIMUM_INTERACTION_SEPARATION = 0.22;
const FOCUSED_LAYOUT_CANDIDATE_COUNT = 640;
const FOCUSED_FOREHEAD_ANGLE = Math.PI / 12;
const FOCUSED_LAYOUT_MIN_CAP_RADIUS = 0.18;
const FOCUSED_LAYOUT_MAX_CAP_RADIUS = 0.78;
const FOCUSED_LAYOUT_CAP_STEP = 0.035;

function clampReservoirNumber(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getReservoirPopulationProgress(nodeCount: number) {
  return clampReservoirNumber((nodeCount - 1) / 30, 0, 1);
}

function hashReservoirLayoutSeed(seed: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function getUnitHash(seed: string) {
  return hashReservoirLayoutSeed(seed) / 4294967296;
}

function dotDirection(
  first: ReservoirDirection,
  second: ReservoirDirection,
) {
  return (
    first[0] * second[0] +
    first[1] * second[1] +
    first[2] * second[2]
  );
}

function crossDirection(
  first: ReservoirDirection,
  second: ReservoirDirection,
): ReservoirDirection {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ];
}

function scaleDirection(
  direction: ReservoirDirection,
  scale: number,
): ReservoirDirection {
  return [
    direction[0] * scale,
    direction[1] * scale,
    direction[2] * scale,
  ];
}

function addDirections(
  first: ReservoirDirection,
  second: ReservoirDirection,
): ReservoirDirection {
  return [
    first[0] + second[0],
    first[1] + second[1],
    first[2] + second[2],
  ];
}

function buildDirectionalBasis(axis: ReservoirDirection) {
  const normalizedAxis = normalizeReservoirDirection(axis);
  const reference =
    Math.abs(normalizedAxis[1]) < 0.9
      ? ([0, 1, 0] as const)
      : ([1, 0, 0] as const);
  let right = crossDirection(reference, normalizedAxis);
  if (Math.hypot(...right) < DIRECTION_EPSILON) {
    right = crossDirection([0, 0, 1], normalizedAxis);
  }
  const normalizedRight = normalizeReservoirDirection(right);
  const normalizedUp = normalizeReservoirDirection(
    crossDirection(normalizedAxis, normalizedRight),
  );

  return {
    axis: normalizedAxis,
    right: normalizedRight,
    up: normalizedUp,
  };
}

function invertReservoirQuaternion(
  quaternion: ReservoirQuaternion,
): ReservoirQuaternion {
  return [
    -quaternion[0],
    -quaternion[1],
    -quaternion[2],
    quaternion[3],
  ];
}

function orthogonalizeReservoirDirection(
  direction: ReservoirDirection,
  axis: ReservoirDirection,
) {
  const projection = dotDirection(direction, axis);
  return normalizeReservoirDirection(
    addDirections(direction, scaleDirection(axis, -projection)),
  );
}

export function getReservoirViewBasis(
  viewQuaternion: ReservoirQuaternion,
): ReservoirViewBasis {
  const normalizedViewQuaternion = normalizeReservoirQuaternion(
    viewQuaternion,
  );
  const inverseViewQuaternion = invertReservoirQuaternion(
    normalizedViewQuaternion,
  );
  const viewerDirection = normalizeReservoirDirection(
    applyReservoirQuaternion([0, 0, 1], inverseViewQuaternion),
  );
  const viewportUpDirection = orthogonalizeReservoirDirection(
    normalizeReservoirDirection(
      applyReservoirQuaternion([0, 1, 0], inverseViewQuaternion),
    ),
    viewerDirection,
  );

  return {
    viewerDirection,
    viewportUpDirection,
  };
}

function directionFromCapCoordinates(
  basis: ReturnType<typeof buildDirectionalBasis>,
  capAngle: number,
  azimuth: number,
): ReservoirDirection {
  const sinCap = Math.sin(capAngle);
  const cosCap = Math.cos(capAngle);
  const azimuthCos = Math.cos(azimuth);
  const azimuthSin = Math.sin(azimuth);

  return normalizeReservoirDirection(
    addDirections(
      scaleDirection(basis.axis, cosCap),
      addDirections(
        scaleDirection(basis.right, sinCap * azimuthCos),
        scaleDirection(basis.up, sinCap * azimuthSin),
      ),
    ),
  );
}

export function getReservoirFocalDirection(
  viewQuaternion: ReservoirQuaternion,
) {
  const { viewerDirection, viewportUpDirection } =
    getReservoirViewBasis(viewQuaternion);

  return normalizeReservoirDirection(
    addDirections(
      scaleDirection(viewerDirection, Math.cos(FOCUSED_FOREHEAD_ANGLE)),
      scaleDirection(
        viewportUpDirection,
        Math.sin(FOCUSED_FOREHEAD_ANGLE),
      ),
    ),
  );
}

export function getReservoirFocusedCapRadius(nodeCount: number) {
  if (nodeCount <= 0) return 0;
  if (nodeCount === 1) return 0.2;

  const populationProgress = getReservoirPopulationProgress(nodeCount);
  const compactBase = 0.18 + populationProgress * 0.44;
  const footprintBuffer =
    getReservoirFocusedMinimumAngularSeparationTarget(nodeCount) *
    (0.66 + populationProgress * 0.08);
  const densityPressure = Math.sqrt(nodeCount) * 0.012;

  return clampReservoirNumber(
    Math.max(compactBase, footprintBuffer + densityPressure),
    FOCUSED_LAYOUT_MIN_CAP_RADIUS,
    FOCUSED_LAYOUT_MAX_CAP_RADIUS,
  );
}

function createReservoirFocusedCandidateDirections(
  seed: string,
  count: number,
  capRadius: number,
  nodeCount: number,
  focusedDirection: ReservoirDirection,
) {
  const basis = buildDirectionalBasis(focusedDirection);
  const phase = getUnitHash(`${seed}:focused-phase`) * FULL_TURN;
  const cosCapRadius = Math.cos(capRadius);
  const populationProgress = getReservoirPopulationProgress(nodeCount);
  const radialExponent = 1.08 + (1 - populationProgress) * 0.38;
  const directions: ReservoirDirection[] = [];

  for (let index = 0; index < count; index += 1) {
    const areaProgress = (index + 0.5) / count;
    const capAngle = Math.acos(
      1 -
        Math.pow(areaProgress, radialExponent) *
          (1 - cosCapRadius),
    );
    const azimuth = phase + index * GOLDEN_ANGLE;
    directions.push(directionFromCapCoordinates(basis, capAngle, azimuth));
  }

  return directions;
}

function getReservoirFocusedNodeIdealDirection(
  seed: string,
  nodeId: string,
  capRadius: number,
  nodeCount: number,
  focusedDirection: ReservoirDirection,
) {
  const basis = buildDirectionalBasis(focusedDirection);
  const radialSeed = getUnitHash(`${seed}:${nodeId}:focused-radial`);
  const azimuthSeed = getUnitHash(`${seed}:${nodeId}:focused-azimuth`);
  const populationProgress = getReservoirPopulationProgress(nodeCount);
  const centeredRadial = Math.pow(
    radialSeed,
    1.56 + (1 - populationProgress) * 0.64,
  );
  const capAngle = Math.acos(
    1 - centeredRadial * (1 - Math.cos(capRadius)),
  );
  const azimuth = azimuthSeed * FULL_TURN;

  return directionFromCapCoordinates(basis, capAngle, azimuth);
}

function createReservoirCandidateDirections(seed: string, count: number) {
  const phase = getUnitHash(`${seed}:phase`) * FULL_TURN;
  const directions: ReservoirDirection[] = [];

  for (let index = 0; index < count; index += 1) {
    const vertical = 1 - (2 * (index + 0.5)) / count;
    const horizontalRadius = Math.sqrt(Math.max(0, 1 - vertical ** 2));
    const angle = phase + index * GOLDEN_ANGLE;
    directions.push([
      Math.cos(angle) * horizontalRadius,
      vertical,
      Math.sin(angle) * horizontalRadius,
    ]);
  }

  return directions;
}

function getReservoirNodeIdealDirection(seed: string, nodeId: string) {
  const vertical =
    1 - 2 * getUnitHash(`${seed}:${nodeId}:vertical`);
  const angle = getUnitHash(`${seed}:${nodeId}:angle`) * FULL_TURN;
  const horizontalRadius = Math.sqrt(Math.max(0, 1 - vertical ** 2));
  return normalizeReservoirDirection([
    Math.cos(angle) * horizontalRadius,
    vertical,
    Math.sin(angle) * horizontalRadius,
  ]);
}

function placeReservoirLayoutFromCandidates(
  nodeIds: readonly string[],
  candidates: readonly ReservoirDirection[],
  getIdealDirection: (nodeId: string) => ReservoirDirection,
) {
  const usedCandidateIndices = new Set<number>();
  const placedDirections: ReservoirDirection[] = [];
  const layout = new Map<string, ReservoirDirection>();

  for (const nodeId of nodeIds) {
    const idealDirection = getIdealDirection(nodeId);
    const candidateSeparations = new Float64Array(candidates.length);
    candidateSeparations.fill(Number.NEGATIVE_INFINITY);
    let maximumAvailableSeparation = Number.NEGATIVE_INFINITY;
    let bestCandidateIndex = -1;
    let bestPreference = Number.NEGATIVE_INFINITY;

    for (
      let candidateIndex = 0;
      candidateIndex < candidates.length;
      candidateIndex += 1
    ) {
      if (usedCandidateIndices.has(candidateIndex)) continue;
      const candidate = candidates[candidateIndex];
      let minimumSeparation = Math.PI;

      for (const placedDirection of placedDirections) {
        minimumSeparation = Math.min(
          minimumSeparation,
          Math.acos(
            Math.max(-1, Math.min(1, dotDirection(candidate, placedDirection))),
          ),
        );
      }
      candidateSeparations[candidateIndex] = minimumSeparation;
      maximumAvailableSeparation = Math.max(
        maximumAvailableSeparation,
        minimumSeparation,
      );
    }

    const compositionTolerance =
      getReservoirMinimumAngularSeparationTarget(placedDirections.length + 1) *
      0.015;

    for (
      let candidateIndex = 0;
      candidateIndex < candidates.length;
      candidateIndex += 1
    ) {
      if (
        candidateSeparations[candidateIndex] <
        maximumAvailableSeparation - compositionTolerance
      ) {
        continue;
      }
      const preference = dotDirection(
        candidates[candidateIndex],
        idealDirection,
      );
      if (preference > bestPreference) {
        bestCandidateIndex = candidateIndex;
        bestPreference = preference;
      }
    }

    if (bestCandidateIndex < 0) {
      throw new Error("Unable to place reservoir node in candidate field.");
    }

    const direction = normalizeReservoirDirection(
      candidates[bestCandidateIndex],
    );
    usedCandidateIndices.add(bestCandidateIndex);
    placedDirections.push(direction);
    layout.set(nodeId, direction);
  }

  return new Map(
    [...layout.entries()].sort(([first], [second]) =>
      first.localeCompare(second),
    ),
  );
}

function generateReservoirFocusedLayout(
  nodes: readonly ReservoirLayoutNode[],
  {
    seed,
    viewQuaternion = RESERVOIR_LAYOUT_MODE_VIEW_QUATERNION,
    focusedDirection,
    minimumNodeDiameter,
    nodeDiameters,
  }: ReservoirLayoutOptions,
): ReservoirLayout {
  const orderedNodeIds = nodes
    .map((node) => node.id)
    .sort((first, second) => first.localeCompare(second));
  const duplicateNodeId = orderedNodeIds.find(
    (nodeId, index) => index > 0 && orderedNodeIds[index - 1] === nodeId,
  );

  if (duplicateNodeId) {
    throw new Error(`Duplicate reservoir node ID: ${duplicateNodeId}`);
  }

  let capRadius = getReservoirFocusedCapRadius(orderedNodeIds.length);
  const maxAttempts = Math.ceil(
    (FOCUSED_LAYOUT_MAX_CAP_RADIUS - FOCUSED_LAYOUT_MIN_CAP_RADIUS) /
      FOCUSED_LAYOUT_CAP_STEP,
  ) + 1;
  let bestLayout: ReservoirLayout | null = null;
  let bestLayoutSafetyScale = Number.NEGATIVE_INFINITY;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const focusedSeed = `${seed}:focused:${attempt}`;
    const latchedFocusedDirection =
      focusedDirection ??
      getReservoirFocalDirection(viewQuaternion);
    const candidates = createReservoirFocusedCandidateDirections(
      focusedSeed,
      FOCUSED_LAYOUT_CANDIDATE_COUNT,
      capRadius,
      orderedNodeIds.length,
      latchedFocusedDirection,
    );
    try {
      const layout = placeReservoirLayoutFromCandidates(
        orderedNodeIds,
        candidates,
        (nodeId) =>
          getReservoirFocusedNodeIdealDirection(
            focusedSeed,
            nodeId,
            capRadius,
            orderedNodeIds.length,
            latchedFocusedDirection,
          ),
      );
      const layoutSafetyScale = nodeDiameters
        ? getReservoirLayoutMaximumSafeScale(layout, nodeDiameters)
        : minimumNodeDiameter === undefined
          ? 1
          : Math.min(
              1,
              getReservoirLayoutMaximumSafeDiameter(layout) /
                minimumNodeDiameter,
            );

      if (layoutSafetyScale > bestLayoutSafetyScale) {
        bestLayout = layout;
        bestLayoutSafetyScale = layoutSafetyScale;
      }

      if (layoutSafetyScale >= 1) {
        return layout;
      }
    } catch {
      capRadius = Math.min(
        FOCUSED_LAYOUT_MAX_CAP_RADIUS,
        capRadius + FOCUSED_LAYOUT_CAP_STEP,
      );
      continue;
    }

    capRadius = Math.min(
      FOCUSED_LAYOUT_MAX_CAP_RADIUS,
      capRadius + FOCUSED_LAYOUT_CAP_STEP,
    );
  }

  if (bestLayout) return bestLayout;

  throw new Error("Unable to place reservoir nodes in focused layout.");
}

export function getReservoirMinimumAngularSeparationTarget(nodeCount: number) {
  if (nodeCount <= 1) return Math.PI;

  const populationProgress = Math.min(1, Math.max(0, (nodeCount - 2) / 28));
  const packingFactor = 0.75 - populationProgress * 0.05;
  const equalAreaAngle = Math.sqrt((4 * Math.PI) / nodeCount);
  return Math.min(
    2.5,
    Math.max(
      MINIMUM_INTERACTION_SEPARATION,
      equalAreaAngle * packingFactor,
    ),
  );
}

function getReservoirFocusedMinimumAngularSeparationTarget(nodeCount: number) {
  if (nodeCount <= 1) return Math.PI;

  const populationProgress = getReservoirPopulationProgress(nodeCount);
  const compactBase = 0.2 + Math.sqrt(nodeCount) * 0.03;
  const populationBuffer = 0.02 + populationProgress * 0.04;

  return clampReservoirNumber(
    compactBase + populationBuffer,
    MINIMUM_INTERACTION_SEPARATION,
    0.42,
  );
}

export function normalizeReservoirDirection(
  direction: ReservoirDirection,
): ReservoirDirection {
  const length = Math.hypot(...direction);
  if (!Number.isFinite(length) || length < DIRECTION_EPSILON) {
    throw new Error("Reservoir directions must be finite, non-zero vectors.");
  }

  return [
    direction[0] / length,
    direction[1] / length,
    direction[2] / length,
  ];
}

export function getReservoirDirectionAngularDistance(
  first: ReservoirDirection,
  second: ReservoirDirection,
) {
  const firstDirection = normalizeReservoirDirection(first);
  const secondDirection = normalizeReservoirDirection(second);
  const dot = dotDirection(firstDirection, secondDirection);

  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

function getReservoirMinimumAngularSeparation(layout: ReservoirLayout) {
  const directions = [...layout.values()];
  if (directions.length < 2) return Math.PI;

  let minimumSeparation = Math.PI;
  for (let firstIndex = 0; firstIndex < directions.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < directions.length;
      secondIndex += 1
    ) {
      minimumSeparation = Math.min(
        minimumSeparation,
        getReservoirDirectionAngularDistance(
          directions[firstIndex],
          directions[secondIndex],
        ),
      );
    }
  }
  return minimumSeparation;
}

/**
 * Places stable semantic IDs into a progressive deterministic maximin field.
 * Candidates within a small population-scaled tolerance of the best available
 * separation may favor an ID-seeded ideal direction, keeping the result
 * composed without turning it into a mechanically perfect lattice. Appending a
 * later-sorting ID preserves every existing direction.
 */
export function generateReservoirLayout(
  nodes: readonly ReservoirLayoutNode[],
  {
    seed,
    mode = "distributed",
    viewQuaternion,
    focusedDirection,
    minimumNodeDiameter,
    nodeDiameters,
  }: ReservoirLayoutOptions,
): ReservoirLayout {
  if (mode === "focused") {
    return generateReservoirFocusedLayout(nodes, {
      seed,
      viewQuaternion,
      focusedDirection,
      minimumNodeDiameter,
      nodeDiameters,
    });
  }
  const orderedNodeIds = nodes
    .map((node) => node.id)
    .sort((first, second) => first.localeCompare(second));
  const duplicateNodeId = orderedNodeIds.find(
    (nodeId, index) => index > 0 && orderedNodeIds[index - 1] === nodeId,
  );

  if (duplicateNodeId) {
    throw new Error(`Duplicate reservoir node ID: ${duplicateNodeId}`);
  }

  const candidates = createReservoirCandidateDirections(
    `${seed}:layout`,
    LAYOUT_CANDIDATE_COUNT,
  );
  return placeReservoirLayoutFromCandidates(
    orderedNodeIds,
    candidates,
    (nodeId) => getReservoirNodeIdealDirection(seed, nodeId),
  );
}

function normalizeReservoirQuaternion(
  quaternion: ReservoirQuaternion,
): ReservoirQuaternion {
  const length = Math.hypot(...quaternion);
  if (!Number.isFinite(length) || length < DIRECTION_EPSILON) {
    throw new Error("Reservoir quaternions must be finite and non-zero.");
  }
  const normalized = quaternion.map((coordinate) => coordinate / length) as [
    number,
    number,
    number,
    number,
  ];
  return normalized[3] < 0
    ? normalized.map((coordinate) => -coordinate) as [
        number,
        number,
        number,
        number,
      ]
    : normalized;
}

function multiplyReservoirQuaternions(
  first: ReservoirQuaternion,
  second: ReservoirQuaternion,
): ReservoirQuaternion {
  const [firstX, firstY, firstZ, firstW] = first;
  const [secondX, secondY, secondZ, secondW] = second;
  return normalizeReservoirQuaternion([
    firstW * secondX + firstX * secondW + firstY * secondZ - firstZ * secondY,
    firstW * secondY - firstX * secondZ + firstY * secondW + firstZ * secondX,
    firstW * secondZ + firstX * secondY - firstY * secondX + firstZ * secondW,
    firstW * secondW - firstX * secondX - firstY * secondY - firstZ * secondZ,
  ]);
}

function getDirectionAlignmentQuaternion(
  from: ReservoirDirection,
  to: ReservoirDirection,
): ReservoirQuaternion {
  const normalizedFrom = normalizeReservoirDirection(from);
  const normalizedTo = normalizeReservoirDirection(to);
  const alignment = dotDirection(normalizedFrom, normalizedTo) + 1;

  if (alignment < DIRECTION_EPSILON) {
    const fallbackAxis =
      Math.abs(normalizedFrom[0]) < 0.8
        ? crossDirection(normalizedFrom, [1, 0, 0])
        : crossDirection(normalizedFrom, [0, 1, 0]);
    const axis = normalizeReservoirDirection(fallbackAxis);
    return [axis[0], axis[1], axis[2], 0];
  }

  const cross = crossDirection(normalizedFrom, normalizedTo);
  return normalizeReservoirQuaternion([
    cross[0],
    cross[1],
    cross[2],
    alignment,
  ]);
}

export function applyReservoirQuaternion(
  direction: ReservoirDirection,
  quaternion: ReservoirQuaternion,
): ReservoirDirection {
  const [quaternionX, quaternionY, quaternionZ, quaternionW] =
    normalizeReservoirQuaternion(quaternion);
  const quaternionVector: ReservoirDirection = [
    quaternionX,
    quaternionY,
    quaternionZ,
  ];
  const twiceCross = crossDirection(quaternionVector, direction).map(
    (coordinate) => coordinate * 2,
  ) as [number, number, number];
  const correction = crossDirection(quaternionVector, twiceCross);
  return normalizeReservoirDirection([
    direction[0] +
      quaternionW * twiceCross[0] +
      correction[0],
    direction[1] +
      quaternionW * twiceCross[1] +
      correction[1],
    direction[2] +
      quaternionW * twiceCross[2] +
      correction[2],
  ]);
}

export function getReservoirInitialVisibleNodeTarget(nodeCount: number) {
  if (nodeCount <= 1) return nodeCount;
  const visibleFraction = nodeCount <= 6 ? 0.67 : nodeCount <= 16 ? 0.55 : 0.48;
  return Math.min(
    nodeCount - 1,
    Math.max(1, Math.round(nodeCount * visibleFraction)),
  );
}

function scoreReservoirInitialComposition(
  layout: ReservoirLayout,
  quaternion: ReservoirQuaternion,
) {
  const transformedDirections = [...layout.values()].map((direction) =>
    applyReservoirQuaternion(direction, quaternion),
  );
  const visibleDirections = transformedDirections.filter(
    (direction) => direction[2] > INITIAL_VISIBLE_DEPTH,
  );
  const silhouetteNodeCount = transformedDirections.filter(
    (direction) => Math.abs(direction[2]) <= INITIAL_SILHOUETTE_DEPTH,
  ).length;
  let projectedMinimumSeparation = 2;
  let centroidX = 0;
  let centroidY = 0;
  const occupiedQuadrants = new Set<number>();

  for (let index = 0; index < visibleDirections.length; index += 1) {
    const direction = visibleDirections[index];
    centroidX += direction[0];
    centroidY += direction[1];
    occupiedQuadrants.add(
      (direction[0] >= 0 ? 1 : 0) + (direction[1] >= 0 ? 2 : 0),
    );
    for (
      let comparisonIndex = index + 1;
      comparisonIndex < visibleDirections.length;
      comparisonIndex += 1
    ) {
      const comparison = visibleDirections[comparisonIndex];
      projectedMinimumSeparation = Math.min(
        projectedMinimumSeparation,
        Math.hypot(
          direction[0] - comparison[0],
          direction[1] - comparison[1],
        ),
      );
    }
  }

  if (visibleDirections.length > 0) {
    centroidX /= visibleDirections.length;
    centroidY /= visibleDirections.length;
  } else {
    projectedMinimumSeparation = 0;
  }

  const targetVisibleNodeCount =
    getReservoirInitialVisibleNodeTarget(layout.size);
  const visibleCountError = Math.abs(
    visibleDirections.length - targetVisibleNodeCount,
  );
  const allNodesVisiblePenalty =
    layout.size > 1 && visibleDirections.length === layout.size ? 8 : 0;
  const score =
    -visibleCountError * 10 -
    silhouetteNodeCount * 1.4 -
    allNodesVisiblePenalty +
    projectedMinimumSeparation * 3.2 +
    occupiedQuadrants.size * 0.45 -
    Math.hypot(centroidX, centroidY) * 2.4;

  return {
    projectedMinimumSeparation,
    score,
    silhouetteNodeCount,
    targetVisibleNodeCount,
    visibleNodeCount: visibleDirections.length,
  };
}

/**
 * Scores a finite deterministic set of viewing axes and rolls. The returned
 * quaternion is separate from the reservoir-local layout directions and can
 * therefore be restored or replaced without mutating semantic placement.
 */
export function generateReservoirInitialComposition(
  layout: ReservoirLayout,
  { seed }: ReservoirLayoutOptions,
): ReservoirInitialComposition {
  if (layout.size === 0) {
    return {
      candidateCount: 1,
      projectedMinimumSeparation: 0,
      quaternion: [0, 0, 0, 1],
      silhouetteNodeCount: 0,
      targetVisibleNodeCount: 0,
      visibleNodeCount: 0,
    };
  }

  const viewingAxes = createReservoirCandidateDirections(
    `${seed}:initial-orientation`,
    INITIAL_ORIENTATION_AXIS_COUNT,
  );
  const rollPhase = getUnitHash(`${seed}:initial-roll`) * FULL_TURN;
  let bestComposition: ReservoirInitialComposition | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const viewingAxis of viewingAxes) {
    const alignmentQuaternion = getDirectionAlignmentQuaternion(
      viewingAxis,
      [0, 0, 1],
    );
    for (let rollIndex = 0; rollIndex < INITIAL_ORIENTATION_ROLL_COUNT; rollIndex += 1) {
      const roll =
        rollPhase + (rollIndex / INITIAL_ORIENTATION_ROLL_COUNT) * FULL_TURN;
      const rollQuaternion: ReservoirQuaternion = [
        0,
        0,
        Math.sin(roll / 2),
        Math.cos(roll / 2),
      ];
      const quaternion = multiplyReservoirQuaternions(
        rollQuaternion,
        alignmentQuaternion,
      );
      const scoredComposition = scoreReservoirInitialComposition(
        layout,
        quaternion,
      );

      if (scoredComposition.score > bestScore) {
        bestScore = scoredComposition.score;
        bestComposition = {
          candidateCount:
            INITIAL_ORIENTATION_AXIS_COUNT * INITIAL_ORIENTATION_ROLL_COUNT,
          projectedMinimumSeparation:
            scoredComposition.projectedMinimumSeparation,
          quaternion,
          silhouetteNodeCount: scoredComposition.silhouetteNodeCount,
          targetVisibleNodeCount: scoredComposition.targetVisibleNodeCount,
          visibleNodeCount: scoredComposition.visibleNodeCount,
        };
      }
    }
  }

  if (!bestComposition) {
    throw new Error("Unable to score reservoir initial composition.");
  }
  return bestComposition;
}

export function getReservoirLayoutDiagnostics(layout: ReservoirLayout) {
  const entries = [...layout.entries()].sort(([first], [second]) =>
    first.localeCompare(second),
  );
  const lengths = entries.map(([, direction]) => Math.hypot(...direction));
  const invalidDirectionIds = entries
    .filter(([, direction]) =>
      direction.some((coordinate) => !Number.isFinite(coordinate)),
    )
    .map(([nodeId]) => nodeId);

  return {
    entries,
    invalidDirectionIds,
    minimumAngularSeparation: getReservoirMinimumAngularSeparation(layout),
    minimumAngularSeparationTarget:
      getReservoirMinimumAngularSeparationTarget(layout.size),
    minimumDirectionLength: lengths.length ? Math.min(...lengths) : 0,
    maximumDirectionLength: lengths.length ? Math.max(...lengths) : 0,
  };
}
