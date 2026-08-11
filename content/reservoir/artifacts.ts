import type { ReservoirArtifact } from "@/types/reservoir";
import {
  findReservoirGridVertexId,
  getReservoirGridNeighborIds,
  getReservoirPlacementNeighborIds,
  reservoirVertices,
} from "@/lib/reservoir/geometry";

// Offline maximum-minimum sample from the canonical detail-3 vertex set.
// Eligible vertices occupy the initial upper-front cap after the fixed base
// rotation (normalized y >= 0.4 and z >= 0.15). Five-vertex samples are ranked
// by their minimum angular separation; the maximum-minimum sample wins, with
// the lexicographically smallest vertex-ID set as the deterministic tie-breaker.
export const reservoirArtifacts = [
  {
    id: "artifact-01",
    type: "Field Note",
    title: "Low Tide",
    color: "#b9573f",
    vertexId: 34,
  },
  {
    id: "artifact-02",
    type: "Case Study",
    title: "Bellabeat Wellness Analysis",
    color: "#28758c",
    vertexId: 64,
  },
  {
    id: "artifact-03",
    type: "Moving Image",
    title: "The Distance Between Memory and the Shape of a Place",
    color: "#6e5890",
    vertexId: 96,
  },
  {
    id: "artifact-04",
    type: "Web Experiment",
    title: "A Small Interface for Things That Refuse to Be Categorized",
    color: "#3d8062",
    vertexId: 114,
  },
  {
    id: "artifact-05",
    type: "Photo Essay",
    title: "After the Last Train",
    color: "#a77a24",
    vertexId: 134,
  },
] satisfies ReservoirArtifact[];

const FORCE_DENSITY_TEST_MODE = false;
const DENSITY_TEST_NODE_COUNT = 24;

const DENSITY_CLUSTER_ANCHORS = [
  [-0.62, 0.74, 0.26],
  [0.62, 0.74, 0.26],
  [0, 0.72, -0.69],
  [-0.58, -0.55, 0.6],
  [0.62, -0.5, -0.6],
] as const;

const DENSITY_TEST_TITLES = [
  "Still",
  "A Field Study at Dusk",
  "Notes on Repeated Motion and Quietly Changing Ground",
  "An Index of Small Signals Collected Between One Shoreline and the Next",
  "Trace",
  "Weather Systems for an Empty Room",
  "Observations from the Long Route Through a Landscape That Would Not Hold Still",
  "Drift",
  "Temporary Structures for Remembering Water",
  "A Working Archive of Peripheral Light, Interrupted Paths, and Other Minor Events",
  "Fold",
  "Instructions for Listening to Distance",
  "The Shape Left Behind When a Familiar Sequence Is Rearranged Without Warning",
  "Wake",
  "Material Notes from the Edge of the Frame",
  "A Catalogue of Nearly Invisible Boundaries and the Movements That Cross Them",
  "Signal",
  "Studies for a Room with No Fixed Center",
  "Fragments Gathered While the Horizon Continued Moving Beyond the Available View",
] as const;

const DENSITY_TEST_TYPES = [
  "Field Note",
  "Case Study",
  "Moving Image",
  "Web Experiment",
  "Photo Essay",
] as const;

const DENSITY_TEST_COLORS = [
  "#b9573f",
  "#28758c",
  "#6e5890",
  "#3d8062",
  "#a77a24",
  "#c76845",
  "#347e8f",
] as const;

export const reservoirDensityTestMode =
  process.env.NODE_ENV === "development" &&
  (FORCE_DENSITY_TEST_MODE ||
    process.env.NEXT_PUBLIC_RESERVOIR_DENSITY_TEST === "1");

function directionScore(
  vertexId: number,
  anchor: readonly [number, number, number],
) {
  const vertex = reservoirVertices[vertexId];
  const anchorLength = Math.hypot(...anchor);

  return (
    (vertex.x * anchor[0] +
      vertex.y * anchor[1] +
      vertex.z * anchor[2]) /
    (vertex.length() * anchorLength)
  );
}

function isPlacementAvailable(
  vertexId: number,
  occupiedPlacementVertexIds: ReadonlySet<number>,
  occupiedGridVertexIds: ReadonlySet<number>,
) {
  if (occupiedPlacementVertexIds.has(vertexId)) return false;
  const gridVertexId = findReservoirGridVertexId(vertexId);
  if (gridVertexId === null || occupiedGridVertexIds.has(gridVertexId)) {
    return false;
  }

  return (
    getReservoirPlacementNeighborIds(vertexId).every(
      (neighborId) => !occupiedPlacementVertexIds.has(neighborId),
    ) &&
    getReservoirGridNeighborIds(gridVertexId).every(
      (neighborId) => !occupiedGridVertexIds.has(neighborId),
    )
  );
}

function getDensityTestVertexIds() {
  const occupiedPlacementVertexIds = new Set(
    reservoirArtifacts.map((artifact) => artifact.vertexId),
  );
  const occupiedGridVertexIds = new Set(
    reservoirArtifacts
      .map((artifact) => findReservoirGridVertexId(artifact.vertexId))
      .filter((vertexId) => vertexId !== null),
  );
  const temporaryVertexIds: number[] = [];
  const temporaryNodeCount =
    DENSITY_TEST_NODE_COUNT - reservoirArtifacts.length;
  const nodesPerCluster = [4, 4, 4, 4, 3];

  for (
    let anchorIndex = 0;
    anchorIndex < DENSITY_CLUSTER_ANCHORS.length;
    anchorIndex += 1
  ) {
    const candidates = reservoirVertices
      .map((_, vertexId) => vertexId)
      .sort(
        (a, b) =>
          directionScore(b, DENSITY_CLUSTER_ANCHORS[anchorIndex]) -
            directionScore(a, DENSITY_CLUSTER_ANCHORS[anchorIndex]) ||
          a - b,
      );
    let addedToCluster = 0;

    for (const vertexId of candidates) {
      if (
        !isPlacementAvailable(
          vertexId,
          occupiedPlacementVertexIds,
          occupiedGridVertexIds,
        )
      ) {
        continue;
      }

      occupiedPlacementVertexIds.add(vertexId);
      occupiedGridVertexIds.add(
        findReservoirGridVertexId(vertexId) as number,
      );
      temporaryVertexIds.push(vertexId);
      addedToCluster += 1;

      if (addedToCluster === nodesPerCluster[anchorIndex]) break;
    }
  }

  for (
    let vertexId = 0;
    temporaryVertexIds.length < temporaryNodeCount &&
    vertexId < reservoirVertices.length;
    vertexId += 1
  ) {
    if (
      !isPlacementAvailable(
        vertexId,
        occupiedPlacementVertexIds,
        occupiedGridVertexIds,
      )
    ) {
      continue;
    }

    occupiedPlacementVertexIds.add(vertexId);
    occupiedGridVertexIds.add(
      findReservoirGridVertexId(vertexId) as number,
    );
    temporaryVertexIds.push(vertexId);
  }

  if (temporaryVertexIds.length !== temporaryNodeCount) {
    throw new Error(
      `Unable to place ${temporaryNodeCount} density-test artifacts without adjacency.`,
    );
  }

  return temporaryVertexIds;
}

function createDensityTestArtifacts() {
  return getDensityTestVertexIds().map(
    (vertexId, index): ReservoirArtifact => ({
      id: `density-artifact-${String(index + 1).padStart(2, "0")}`,
      type: DENSITY_TEST_TYPES[index % DENSITY_TEST_TYPES.length],
      title: DENSITY_TEST_TITLES[index],
      color: DENSITY_TEST_COLORS[index % DENSITY_TEST_COLORS.length],
      vertexId,
    }),
  );
}

function getAdjacentArtifactPairs(artifacts: readonly ReservoirArtifact[]) {
  const artifactByGridVertexId = new Map(
    artifacts
      .map(
        (artifact) =>
          [
            findReservoirGridVertexId(artifact.vertexId),
            artifact,
          ] as const,
      )
      .filter(([gridVertexId]) => gridVertexId !== null),
  );
  const pairs: string[] = [];

  for (const artifact of artifacts) {
    const gridVertexId = findReservoirGridVertexId(artifact.vertexId);
    if (gridVertexId === null) continue;

    for (const neighborId of getReservoirGridNeighborIds(gridVertexId)) {
      const neighbor = artifactByGridVertexId.get(neighborId);
      if (neighbor && artifact.id < neighbor.id) {
        pairs.push(`${artifact.id}:${neighbor.id}`);
      }
    }
  }

  return pairs;
}

const densityTestArtifacts = reservoirDensityTestMode
  ? createDensityTestArtifacts()
  : [];

export const activeReservoirArtifacts = reservoirDensityTestMode
  ? [...reservoirArtifacts, ...densityTestArtifacts]
  : reservoirArtifacts;

export const reservoirDensityTestDiagnostics = {
  enabled: reservoirDensityTestMode,
  artifactCount: activeReservoirArtifacts.length,
  temporaryArtifactCount: densityTestArtifacts.length,
  artifactVertexIds: activeReservoirArtifacts.map(
    (artifact) => artifact.vertexId,
  ),
  adjacentArtifactPairs: reservoirDensityTestMode
    ? getAdjacentArtifactPairs(activeReservoirArtifacts)
    : [],
};
