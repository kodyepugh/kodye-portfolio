import type * as THREE from "three";

export type ReservoirPointerCandidateSource = "visible-mesh" | "hit-area";

export type ReservoirPointerCandidate = {
  distance: number;
  id: string;
  kind: "artifact" | "collection";
  source: ReservoirPointerCandidateSource;
};

export type ReservoirPointerResolution = {
  accepted: boolean;
  candidate: ReservoirPointerCandidate | null;
  candidateOccluded: boolean;
  surfaceDistance: number | null;
  tolerance: number;
};

export type ReservoirNodePointerVisibilityRequest =
  ReservoirPointerCandidate & {
    ray: THREE.Ray;
  };

export type ReservoirNodePointerVisibilityResolver = (
  request: ReservoirNodePointerVisibilityRequest,
) => boolean;

export const RESERVOIR_POINTER_CANDIDATE_SOURCE_KEY =
  "reservoirPointerCandidateSource";

const RESERVOIR_POINTER_DISTANCE_RELATIVE_TOLERANCE = 1e-7;

function getReservoirPointerDistanceTolerance(
  candidateDistance: number,
  surfaceDistance: number | null,
) {
  const distanceScale = Math.max(
    1,
    Math.abs(candidateDistance),
    surfaceDistance === null ? 0 : Math.abs(surfaceDistance),
  );
  return distanceScale * RESERVOIR_POINTER_DISTANCE_RELATIVE_TOLERANCE;
}

function getReservoirPointerCandidatePriority(
  candidate: ReservoirPointerCandidate,
) {
  return candidate.source === "visible-mesh" ? 0 : 1;
}

export function resolveReservoirNodePointerCandidate({
  candidates,
  surfaceDistance,
}: {
  candidates: readonly ReservoirPointerCandidate[];
  surfaceDistance: number | null;
}): ReservoirPointerResolution {
  if (
    surfaceDistance !== null &&
    (!Number.isFinite(surfaceDistance) || surfaceDistance < 0)
  ) {
    throw new Error("Reservoir pointer surface distance must be finite.");
  }

  const orderedCandidates = [...candidates].sort((first, second) => {
    const sourcePriority =
      getReservoirPointerCandidatePriority(first) -
      getReservoirPointerCandidatePriority(second);
    return sourcePriority || first.distance - second.distance;
  });

  for (const candidate of orderedCandidates) {
    if (
      !candidate.id ||
      !Number.isFinite(candidate.distance) ||
      candidate.distance < 0
    ) {
      throw new Error(
        "Reservoir pointer candidate must be finite and identified.",
      );
    }

    const tolerance = getReservoirPointerDistanceTolerance(
      candidate.distance,
      surfaceDistance,
    );
    if (
      surfaceDistance === null ||
      candidate.distance <= surfaceDistance + tolerance
    ) {
      return {
        accepted: true,
        candidate,
        candidateOccluded: false,
        surfaceDistance,
        tolerance,
      };
    }
  }

  const candidate = orderedCandidates[0] ?? null;
  return {
    accepted: false,
    candidate,
    candidateOccluded: candidate !== null && surfaceDistance !== null,
    surfaceDistance,
    tolerance:
      candidate === null
        ? 0
        : getReservoirPointerDistanceTolerance(
            candidate.distance,
            surfaceDistance,
          ),
  };
}
