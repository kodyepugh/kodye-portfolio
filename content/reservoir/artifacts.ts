import type {
  PreparedArtifactContent,
  ReservoirArtifact,
} from "@/types/reservoir";
import {
  findReservoirGridVertexId,
  getReservoirGridNeighborIds,
  getReservoirPlacementNeighborIds,
  reservoirVertices,
} from "@/lib/reservoir/geometry";
import {
  activeCollectionId,
  embeddedReservoirCollections,
} from "@/content/reservoir/collections";

// Offline maximum-minimum sample from the canonical detail-3 vertex set.
// Eligible vertices occupy the initial upper-front cap after the fixed base
// rotation (normalized y >= 0.4 and z >= 0.15). Five-vertex samples are ranked
// by their minimum angular separation; the maximum-minimum sample wins, with
// the lexicographically smallest vertex-ID set as the deterministic tie-breaker.
export const reservoirArtifacts = [
  {
    kind: "artifact",
    id: "artifact-01",
    collectionId: activeCollectionId,
    type: "Field Note",
    title: "Low Tide",
    subtitle: "Observations from the exposed shoreline",
    date: "2025",
    context: "Field Studies / Water",
    medium: "Text and photographs",
    color: "#b9573f",
    vertexId: 34,
  },
  {
    kind: "artifact",
    id: "artifact-02",
    collectionId: activeCollectionId,
    type: "Case Study",
    title: "Bellabeat Wellness Analysis",
    subtitle: "Patterns in everyday activity and rest",
    date: "2024",
    context: "Data / Wellness",
    medium: "Data analysis",
    color: "#28758c",
    vertexId: 64,
  },
  {
    kind: "artifact",
    id: "artifact-03",
    collectionId: activeCollectionId,
    type: "Moving Image",
    title: "The Distance Between Memory and the Shape of a Place",
    subtitle: "A study in landscape, recall, and distance",
    date: "2023",
    context: "Memory / Place",
    medium: "Single-channel video",
    color: "#6e5890",
    vertexId: 96,
  },
  {
    kind: "artifact",
    id: "artifact-04",
    collectionId: activeCollectionId,
    type: "Web Experiment",
    title: "A Small Interface for Things That Refuse to Be Categorized",
    subtitle: "A navigational study in unstable taxonomies",
    date: "2025",
    context: "Interfaces / Classification",
    medium: "Interactive website",
    color: "#3d8062",
    vertexId: 114,
  },
  {
    kind: "artifact",
    id: "artifact-05",
    collectionId: activeCollectionId,
    type: "Photo Essay",
    title: "After the Last Train",
    subtitle: "Night studies from the end of the line",
    date: "2022–2024",
    context: "Transit / Nocturnes",
    medium: "Digital photography",
    color: "#a77a24",
    vertexId: 134,
  },
  {
    kind: "artifact",
    id: "work-artifact-01",
    collectionId: "collection-work",
    type: "Prototype",
    title: "Reservoir Interface Study",
    subtitle: "A spatial navigation prototype",
    date: "2026",
    context: "Interaction / Systems",
    medium: "WebGL prototype",
    color: "#b9573f",
    vertexId: 34,
  },
  {
    kind: "artifact",
    id: "work-artifact-02",
    collectionId: "collection-work",
    type: "Case Study",
    title: "Signals in Motion",
    subtitle: "A concise study of ordered visual transitions",
    date: "2025",
    context: "Motion / Interface",
    medium: "Interactive study",
    color: "#28758c",
    vertexId: 96,
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
  const activeCanonicalArtifacts = reservoirArtifacts.filter(
    (artifact) => artifact.collectionId === activeCollectionId,
  );
  const activeChildCollections = embeddedReservoirCollections.filter(
    (collection) => collection.parentCollectionId === activeCollectionId,
  );
  const activeCanonicalNodes = [
    ...activeCanonicalArtifacts,
    ...activeChildCollections,
  ];
  const occupiedPlacementVertexIds = new Set(
    activeCanonicalNodes.map((node) => node.vertexId),
  );
  const occupiedGridVertexIds = new Set(
    activeCanonicalNodes
      .map((node) => findReservoirGridVertexId(node.vertexId))
      .filter((vertexId) => vertexId !== null),
  );
  const temporaryVertexIds: number[] = [];
  const temporaryNodeCount =
    DENSITY_TEST_NODE_COUNT - activeCanonicalArtifacts.length;
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
      kind: "artifact",
      id: `density-artifact-${String(index + 1).padStart(2, "0")}`,
      collectionId: activeCollectionId,
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

export const activeReservoirArtifacts = (
  reservoirDensityTestMode
    ? [...reservoirArtifacts, ...densityTestArtifacts]
    : reservoirArtifacts
).filter((artifact) => artifact.collectionId === activeCollectionId);

export function getReservoirArtifacts(collectionId: string) {
  const artifacts =
    reservoirDensityTestMode && collectionId === activeCollectionId
      ? [...reservoirArtifacts, ...densityTestArtifacts]
      : reservoirArtifacts;

  return artifacts.filter(
    (artifact) => artifact.collectionId === collectionId,
  );
}

export function prepareReservoirArtifactContent(
  artifact: ReservoirArtifact,
): PreparedArtifactContent {
  const details = [
    { label: "Date", value: artifact.date },
    { label: "Context", value: artifact.context },
    { label: "Medium", value: artifact.medium },
  ].filter(
    (detail): detail is { label: string; value: string } =>
      Boolean(detail.value),
  );

  return {
    artifactId: artifact.id,
    type: artifact.type,
    title: artifact.title,
    subtitle: artifact.subtitle,
    details,
    placeholderBody:
      artifact.subtitle ??
      `A prototype ${artifact.type.toLowerCase()} from the Digital Reservoir.`,
  };
}

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
