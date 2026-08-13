import * as THREE from "three";
import {
  RESERVOIR_GLOW_BORDER_OPACITIES,
  RESERVOIR_GLOW_FACE_INTENSITY_LEVELS,
  RESERVOIR_GLOW_SPOKE_DISTANCES,
  RESERVOIR_GLOW_SPOKE_INTENSITIES,
} from "@/lib/reservoir/glow";

export const RESERVOIR_RADIUS = 3.2;
export const RESERVOIR_SURFACE_DETAIL = 7;
export const RESERVOIR_GRID_DETAIL = 15;
export const RESERVOIR_PLACEMENT_DETAIL = 3;
export const RESERVOIR_NODE_RADIUS = 0.052;
export const RESERVOIR_COLLECTION_NODE_SCALE = 2;
export const RESERVOIR_COLLECTION_NODE_RADIUS =
  RESERVOIR_NODE_RADIUS * RESERVOIR_COLLECTION_NODE_SCALE;
export const RESERVOIR_LABEL_RADIAL_OFFSET = 0.205;
export const RESERVOIR_BASE_ROTATION = [-0.1, -0.14, 0] as const;
export const RESERVOIR_MIN_ARTIFACT_VERTEX_STEPS = 2;

const POSITION_PRECISION = 5;

type GridFace = readonly [number, number, number];
type GridEdge = readonly [number, number];
type GridSpokeBands = [GridEdge[], GridEdge[]];
type GridBorderBands = [GridEdge[], GridEdge[], GridEdge[]];

type ReservoirGridTopology = {
  vertices: THREE.Vector3[];
  faces: GridFace[];
  neighbors: Array<Set<number>>;
  vertexFaces: number[][];
  edgeFaces: Map<string, number[]>;
};

type GridInspectionNeighborhood = {
  faceBands: [number[], number[], number[]];
  vertexLevels: Map<number, number>;
  spokeBands: GridSpokeBands;
  borderBands: GridBorderBands;
};

export type ArtifactTerritoryGeometry = {
  expandedEdgeBands: THREE.BufferGeometry[];
  faceBands: THREE.BufferGeometry[];
  spokeBands: THREE.BufferGeometry[];
  borderBands: THREE.BufferGeometry[];
  faceCells: ReservoirTopologyCell[];
  edgeCells: ReservoirTopologyCell[];
  faceCounts: number[];
  spokeCounts: number[];
  borderCounts: number[];
};

export type ReservoirTopologyCell = {
  baseIntensities: number[];
  canonical: boolean;
  geometryIndex: number;
  id: string;
  localVertices: Array<{ x: number; y: number }>;
  vertexOffset: number;
};

export type ReservoirGradientPointBand = {
  attributeValues: number[];
  points: THREE.Vector3[];
};

export type ReservoirGridSelectionMask = {
  faceIds: ReadonlySet<number>;
  edgeKeys: ReadonlySet<string>;
};

export type ReservoirShockwaveGeometry = {
  edgeGeometry: THREE.BufferGeometry;
  faceGeometry: THREE.BufferGeometry;
  maximumGraphDistance: number;
};

let cachedGridTopology: ReservoirGridTopology | null = null;
let cachedPlacementNeighbors: Array<Set<number>> | null = null;
const cachedInspectionNeighborhoods = new Map<
  number,
  GridInspectionNeighborhood
>();

const RESERVOIR_INSPECTION_FACE_RADIUS = RESERVOIR_RADIUS * 1.0009;
const RESERVOIR_INSPECTION_EDGE_RADIUS = RESERVOIR_RADIUS * 1.0018;

function getPositionKey(vertex: THREE.Vector3) {
  return vertex
    .toArray()
    .map((coordinate) => coordinate.toFixed(POSITION_PRECISION))
    .join(":");
}

export function createReservoirSurfaceGeometry(
  radius = RESERVOIR_RADIUS,
  detail = RESERVOIR_SURFACE_DETAIL,
) {
  return new THREE.IcosahedronGeometry(radius, detail);
}

export function createReservoirGridGeometry() {
  return new THREE.IcosahedronGeometry(
    RESERVOIR_RADIUS,
    RESERVOIR_GRID_DETAIL,
  );
}

export function createReservoirGridLineGeometry(
  radius: number,
  detail: number,
  surfaceScale = 1.0015,
  arcSegments = 1,
) {
  const surface = new THREE.IcosahedronGeometry(radius, detail);
  const edges = new THREE.EdgesGeometry(surface, 1);
  const edgePositions = edges.getAttribute("position");
  const points: THREE.Vector3[] = [];

  for (let index = 0; index < edgePositions.count; index += 2) {
    const start = new THREE.Vector3()
      .fromBufferAttribute(edgePositions, index)
      .normalize();
    const end = new THREE.Vector3()
      .fromBufferAttribute(edgePositions, index + 1)
      .normalize();

    for (let segment = 0; segment < arcSegments; segment += 1) {
      const startProgress = segment / arcSegments;
      const endProgress = (segment + 1) / arcSegments;
      points.push(
        start
          .clone()
          .lerp(end, startProgress)
          .normalize()
          .multiplyScalar(radius * surfaceScale),
        start
          .clone()
          .lerp(end, endProgress)
          .normalize()
          .multiplyScalar(radius * surfaceScale),
      );
    }
  }

  surface.dispose();
  edges.dispose();

  return new THREE.BufferGeometry().setFromPoints(points);
}

export function getReservoirVertices(
  detail = RESERVOIR_PLACEMENT_DETAIL,
) {
  const geometry = new THREE.IcosahedronGeometry(RESERVOIR_RADIUS, detail);
  const positions = geometry.getAttribute("position");
  const uniqueVertices = new Map<string, THREE.Vector3>();

  for (let index = 0; index < positions.count; index += 1) {
    const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
    const key = getPositionKey(vertex);

    uniqueVertices.set(key, vertex);
  }

  geometry.dispose();

  return Array.from(uniqueVertices.values()).sort(
    (a, b) => a.x - b.x || a.y - b.y || a.z - b.z,
  );
}

export const reservoirVertices = getReservoirVertices();

export function getReservoirPlacementNeighborIds(vertexId: number) {
  if (!cachedPlacementNeighbors) {
    const geometry = new THREE.IcosahedronGeometry(
      RESERVOIR_RADIUS,
      RESERVOIR_PLACEMENT_DETAIL,
    );
    const positions = geometry.getAttribute("position");
    const sortedVertexIds = new Map(
      reservoirVertices.map((vertex, sortedVertexId) => [
        getPositionKey(vertex),
        sortedVertexId,
      ]),
    );
    const neighbors = Array.from(
      { length: reservoirVertices.length },
      () => new Set<number>(),
    );

    for (let index = 0; index < positions.count; index += 3) {
      const faceVertexIds = [0, 1, 2].map((offset) => {
        const vertex = new THREE.Vector3().fromBufferAttribute(
          positions,
          index + offset,
        );
        return sortedVertexIds.get(getPositionKey(vertex));
      });

      if (faceVertexIds.some((id) => id === undefined)) continue;

      for (let faceIndex = 0; faceIndex < 3; faceIndex += 1) {
        const vertexId = faceVertexIds[faceIndex] as number;
        neighbors[vertexId].add(
          faceVertexIds[(faceIndex + 1) % 3] as number,
        );
        neighbors[vertexId].add(
          faceVertexIds[(faceIndex + 2) % 3] as number,
        );
      }
    }

    geometry.dispose();
    cachedPlacementNeighbors = neighbors;
  }

  return [...(cachedPlacementNeighbors[vertexId] ?? [])];
}

function getReservoirGridTopology(): ReservoirGridTopology {
  if (cachedGridTopology) return cachedGridTopology;

  const geometry = createReservoirGridGeometry();
  const positions = geometry.getAttribute("position");
  const vertexIds = new Map<string, number>();
  const vertices: THREE.Vector3[] = [];
  const faces: GridFace[] = [];

  function getVertexId(positionIndex: number) {
    const vertex = new THREE.Vector3().fromBufferAttribute(
      positions,
      positionIndex,
    );
    const key = getPositionKey(vertex);
    const existingId = vertexIds.get(key);

    if (existingId !== undefined) return existingId;

    const vertexId = vertices.length;
    vertexIds.set(key, vertexId);
    vertices.push(vertex);
    return vertexId;
  }

  for (let index = 0; index < positions.count; index += 3) {
    faces.push([
      getVertexId(index),
      getVertexId(index + 1),
      getVertexId(index + 2),
    ]);
  }

  const neighbors = Array.from(
    { length: vertices.length },
    () => new Set<number>(),
  );
  const vertexFaces = Array.from(
    { length: vertices.length },
    () => [] as number[],
  );
  const edgeFaces = new Map<string, number[]>();

  for (let faceId = 0; faceId < faces.length; faceId += 1) {
    const face = faces[faceId];
    for (let index = 0; index < 3; index += 1) {
      const vertexId = face[index];
      neighbors[vertexId].add(face[(index + 1) % 3]);
      neighbors[vertexId].add(face[(index + 2) % 3]);
      vertexFaces[vertexId].push(faceId);

      const edgeKey = getGridEdgeKey(
        vertexId,
        face[(index + 1) % 3],
      );
      const adjacentFaces = edgeFaces.get(edgeKey) ?? [];
      adjacentFaces.push(faceId);
      edgeFaces.set(edgeKey, adjacentFaces);
    }
  }

  geometry.dispose();
  cachedGridTopology = {
    vertices,
    faces,
    neighbors,
    vertexFaces,
    edgeFaces,
  };
  return cachedGridTopology;
}

function getGridEdgeKey(startId: number, endId: number) {
  return startId < endId
    ? `${startId}:${endId}`
    : `${endId}:${startId}`;
}

function getRegionBoundaryEdges(
  topology: ReservoirGridTopology,
  regionFaceIds: ReadonlySet<number>,
) {
  const boundaryEdges = new Map<string, GridEdge>();

  for (const faceId of regionFaceIds) {
    const face = topology.faces[faceId];
    for (let index = 0; index < 3; index += 1) {
      const startId = face[index];
      const endId = face[(index + 1) % 3];
      const edgeKey = getGridEdgeKey(
        startId,
        endId,
      );
      const adjacentFaces = topology.edgeFaces.get(edgeKey) ?? [];
      const regionFaceCount = adjacentFaces.filter((adjacentFaceId) =>
        regionFaceIds.has(adjacentFaceId),
      ).length;

      if (regionFaceCount === 1) {
        boundaryEdges.set(edgeKey, [startId, endId]);
      }
    }
  }

  return [...boundaryEdges.values()];
}

function getFaceRing(
  topology: ReservoirGridTopology,
  regionFaceIds: ReadonlySet<number>,
) {
  const boundaryEdges = getRegionBoundaryEdges(topology, regionFaceIds);

  const ringFaceIds = new Set<number>();
  for (const [startId, endId] of boundaryEdges) {
    const edgeKey = getGridEdgeKey(startId, endId);
    for (const adjacentFaceId of topology.edgeFaces.get(edgeKey) ?? []) {
      if (!regionFaceIds.has(adjacentFaceId)) {
        ringFaceIds.add(adjacentFaceId);
      }
    }
  }

  return [...ringFaceIds];
}

function getOutwardContinuation(
  topology: ReservoirGridTopology,
  startId: number,
  endId: number,
  excludedVertexIds: ReadonlySet<number>,
) {
  const start = topology.vertices[startId].clone().normalize();
  const end = topology.vertices[endId].clone().normalize();
  const incomingDirection = end.clone().sub(start);
  incomingDirection.addScaledVector(
    end,
    -end.dot(incomingDirection),
  );
  if (incomingDirection.lengthSq() === 0) return null;
  incomingDirection.normalize();

  let continuationId: number | null = null;
  let bestAlignment = Number.NEGATIVE_INFINITY;

  for (const candidateId of topology.neighbors[endId]) {
    if (excludedVertexIds.has(candidateId)) continue;

    const candidateDirection = topology.vertices[candidateId]
      .clone()
      .normalize()
      .sub(end);
    candidateDirection.addScaledVector(
      end,
      -end.dot(candidateDirection),
    );
    if (candidateDirection.lengthSq() === 0) continue;
    candidateDirection.normalize();
    const alignment = incomingDirection.dot(candidateDirection);

    if (
      alignment > bestAlignment + Number.EPSILON ||
      (Math.abs(alignment - bestAlignment) <= Number.EPSILON &&
        (continuationId === null || candidateId < continuationId))
    ) {
      bestAlignment = alignment;
      continuationId = candidateId;
    }
  }

  return continuationId;
}

function getVertexLevels(
  topology: ReservoirGridTopology,
  centerVertexId: number,
) {
  const vertexLevels = new Map<number, number>([[centerVertexId, 0]]);
  let frontier = [centerVertexId];

  for (let level = 1; level <= 3; level += 1) {
    const nextFrontier: number[] = [];
    for (const vertexId of frontier) {
      for (const neighborId of topology.neighbors[vertexId]) {
        if (vertexLevels.has(neighborId)) continue;
        vertexLevels.set(neighborId, level);
        nextFrontier.push(neighborId);
      }
    }
    frontier = nextFrontier;
  }

  return vertexLevels;
}

function getGridInspectionNeighborhood(vertexId: number) {
  const cached = cachedInspectionNeighborhoods.get(vertexId);
  if (cached) return cached;

  const topology = getReservoirGridTopology();
  if (!topology.vertices[vertexId]) return null;

  const faceBand1 = [...(topology.vertexFaces[vertexId] ?? [])];
  const faceRegion1 = new Set(faceBand1);
  const faceBand2 = getFaceRing(topology, faceRegion1);
  const faceRegion2 = new Set([...faceBand1, ...faceBand2]);
  const faceBand3 = getFaceRing(topology, faceRegion2);
  const faceRegion3 = new Set([...faceRegion2, ...faceBand3]);
  const centerBoundary = getRegionBoundaryEdges(topology, faceRegion1);
  const middleBoundary = getRegionBoundaryEdges(topology, faceRegion2);
  const outerBoundary = getRegionBoundaryEdges(topology, faceRegion3);

  const edgeBand1: GridEdge[] = [];
  const edgeBand2: GridEdge[] = [];
  const continuationEdgeKeys = new Set<string>();
  const immediateNeighbors = topology.neighbors[vertexId];
  const visitedVertexIds = new Set<number>([vertexId, ...immediateNeighbors]);

  function addEdge(band: GridEdge[], startId: number, endId: number) {
    const key = getGridEdgeKey(startId, endId);
    if (continuationEdgeKeys.has(key)) return;
    continuationEdgeKeys.add(key);
    band.push([startId, endId]);
  }

  for (const neighborId of immediateNeighbors) {
    addEdge(edgeBand1, vertexId, neighborId);
  }

  for (const [startId, endId] of edgeBand1) {
    const continuationId = getOutwardContinuation(
      topology,
      startId,
      endId,
      visitedVertexIds,
    );
    if (continuationId === null) continue;
    addEdge(edgeBand2, endId, continuationId);
  }

  const claimedEdgeKeys = new Set<string>();
  function claimEdges(edges: GridEdge[]) {
    return edges.filter(([startId, endId]) => {
      const edgeKey = getGridEdgeKey(startId, endId);
      if (claimedEdgeKeys.has(edgeKey)) return false;
      claimedEdgeKeys.add(edgeKey);
      return true;
    });
  }

  const centerIncidentEdges = claimEdges(edgeBand1);
  const centerBoundaryEdges = claimEdges(centerBoundary);
  const middleBoundaryEdges = claimEdges(middleBoundary);
  const outerBoundaryEdges = claimEdges(outerBoundary);
  const nearContinuationEdges = claimEdges(edgeBand2);
  const vertexLevels = getVertexLevels(topology, vertexId);
  for (const [startId, endId] of outerBoundaryEdges) {
    vertexLevels.set(startId, 3);
    vertexLevels.set(endId, 3);
  }

  const neighborhood: GridInspectionNeighborhood = {
    faceBands: [faceBand1, faceBand2, faceBand3],
    vertexLevels,
    spokeBands: [
      centerIncidentEdges,
      nearContinuationEdges,
    ],
    borderBands: [
      centerBoundaryEdges,
      middleBoundaryEdges,
      outerBoundaryEdges,
    ],
  };
  cachedInspectionNeighborhoods.set(vertexId, neighborhood);
  return neighborhood;
}

export function findNearestReservoirGridVertexId(
  localSurfacePoint: THREE.Vector3,
) {
  if (
    !localSurfacePoint
      .toArray()
      .every((component) => Number.isFinite(component))
  ) {
    return null;
  }

  const { vertices } = getReservoirGridTopology();
  let nearestId = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let vertexId = 0; vertexId < vertices.length; vertexId += 1) {
    const distance = localSurfacePoint.distanceToSquared(vertices[vertexId]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = vertexId;
    }
  }

  return nearestId;
}

export function getReservoirGridInspectionEdgePoints(
  vertexId: number,
  excludedEdgeKeys?: ReadonlySet<string>,
) {
  const { vertices } = getReservoirGridTopology();
  const neighborhood = getGridInspectionNeighborhood(vertexId);
  if (!neighborhood) {
    return {
      borders: Array.from({ length: 3 }, () => [] as THREE.Vector3[]),
      spokes: Array.from({ length: 3 }, () => ({
        attributeValues: [] as number[],
        points: [] as THREE.Vector3[],
      })),
    };
  }

  const spokes = neighborhood.spokeBands.map((spokeBand) => {
    const points: THREE.Vector3[] = [];
    const attributeValues: number[] = [];

    for (const [startId, endId] of spokeBand) {
      if (excludedEdgeKeys?.has(getGridEdgeKey(startId, endId))) continue;

      points.push(
        vertices[startId]
          .clone()
          .normalize()
          .multiplyScalar(RESERVOIR_INSPECTION_EDGE_RADIUS),
        vertices[endId]
          .clone()
          .normalize()
          .multiplyScalar(RESERVOIR_INSPECTION_EDGE_RADIUS),
      );
      attributeValues.push(1, 0);
    }

    return { attributeValues, points };
  });

  const borders = neighborhood.borderBands.map((borderBand) => {
    const points: THREE.Vector3[] = [];
    for (const [startId, endId] of borderBand) {
      if (excludedEdgeKeys?.has(getGridEdgeKey(startId, endId))) continue;
      points.push(
        vertices[startId]
          .clone()
          .normalize()
          .multiplyScalar(RESERVOIR_INSPECTION_EDGE_RADIUS),
        vertices[endId]
          .clone()
          .normalize()
          .multiplyScalar(RESERVOIR_INSPECTION_EDGE_RADIUS),
      );
    }
    return points;
  });

  return { borders, spokes };
}

export function getReservoirGridInspectionFacePoints(
  vertexId: number,
  excludedFaceIds?: ReadonlySet<number>,
) {
  const topology = getReservoirGridTopology();
  const neighborhood = getGridInspectionNeighborhood(vertexId);
  if (!neighborhood) {
    return Array.from({ length: 3 }, () => ({
      attributeValues: [] as number[],
      points: [] as THREE.Vector3[],
    }));
  }
  const activeNeighborhood = neighborhood;

  function getFacePoints(faceIds: number[]) {
    const points: THREE.Vector3[] = [];
    const attributeValues: number[] = [];

    for (const faceId of faceIds) {
      if (excludedFaceIds?.has(faceId)) continue;

      for (const faceVertexId of topology.faces[faceId]) {
        points.push(
          topology.vertices[faceVertexId]
            .clone()
            .normalize()
            .multiplyScalar(RESERVOIR_INSPECTION_FACE_RADIUS),
        );
        attributeValues.push(
          activeNeighborhood.vertexLevels.get(faceVertexId) ?? 3,
        );
      }
    }

    return { attributeValues, points };
  }

  return activeNeighborhood.faceBands.map(getFacePoints);
}

export function findReservoirGridVertexId(placementVertexId: number) {
  const placementVertex = reservoirVertices[placementVertexId];
  if (!placementVertex) return null;

  const { vertices } = getReservoirGridTopology();
  let nearestId = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let vertexId = 0; vertexId < vertices.length; vertexId += 1) {
    const distance = placementVertex.distanceToSquared(vertices[vertexId]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = vertexId;
    }
  }

  return nearestDistance < 0.000001 ? nearestId : null;
}

export function getReservoirGridNeighborIds(gridVertexId: number) {
  return [...(getReservoirGridTopology().neighbors[gridVertexId] ?? [])];
}

export function getReservoirGridGraphDistances(
  placementVertexId: number,
) {
  const sourceVertexId = findReservoirGridVertexId(placementVertexId);
  const topology = getReservoirGridTopology();
  const distances = new Map<number, number>();
  if (sourceVertexId === null) return distances;

  distances.set(sourceVertexId, 0);
  const queue = [sourceVertexId];

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const vertexId = queue[queueIndex];
    const nextDistance = (distances.get(vertexId) ?? 0) + 1;

    for (const neighborId of topology.neighbors[vertexId]) {
      if (distances.has(neighborId)) continue;
      distances.set(neighborId, nextDistance);
      queue.push(neighborId);
    }
  }

  return distances;
}

export function getReservoirPlacementGraphDistance(
  sourcePlacementVertexId: number,
  targetPlacementVertexId: number,
) {
  const targetVertexId = findReservoirGridVertexId(targetPlacementVertexId);
  if (targetVertexId === null) return null;

  return (
    getReservoirGridGraphDistances(sourcePlacementVertexId).get(
      targetVertexId,
    ) ?? null
  );
}

export function createReservoirShockwaveGeometry(
  placementVertexId: number,
): ReservoirShockwaveGeometry | null {
  const topology = getReservoirGridTopology();
  const distances = getReservoirGridGraphDistances(placementVertexId);
  if (distances.size === 0) return null;

  const facePoints: THREE.Vector3[] = [];
  const faceDistances: number[] = [];
  const edgePoints: THREE.Vector3[] = [];
  const edgeDistances: number[] = [];
  const claimedEdgeKeys = new Set<string>();
  const faceRadius = RESERVOIR_RADIUS * 1.00125;
  const edgeRadius = RESERVOIR_RADIUS * 1.003;

  for (const face of topology.faces) {
    for (const vertexId of face) {
      facePoints.push(
        topology.vertices[vertexId]
          .clone()
          .normalize()
          .multiplyScalar(faceRadius),
      );
      faceDistances.push(distances.get(vertexId) ?? 0);
    }

    for (let index = 0; index < 3; index += 1) {
      const startId = face[index];
      const endId = face[(index + 1) % 3];
      const edgeKey = getGridEdgeKey(startId, endId);
      if (claimedEdgeKeys.has(edgeKey)) continue;
      claimedEdgeKeys.add(edgeKey);

      edgePoints.push(
        topology.vertices[startId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
        topology.vertices[endId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
      );
      edgeDistances.push(
        distances.get(startId) ?? 0,
        distances.get(endId) ?? 0,
      );
    }
  }

  const faceGeometry = new THREE.BufferGeometry().setFromPoints(facePoints);
  faceGeometry.setAttribute(
    "surfaceDistance",
    new THREE.Float32BufferAttribute(faceDistances, 1),
  );
  const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
  edgeGeometry.setAttribute(
    "surfaceDistance",
    new THREE.Float32BufferAttribute(edgeDistances, 1),
  );

  return {
    faceGeometry,
    edgeGeometry,
    maximumGraphDistance: Math.max(...distances.values()),
  };
}

export function getReservoirGridSelectionMask(
  placementVertexId: number,
): ReservoirGridSelectionMask | null {
  const centerVertexId = findReservoirGridVertexId(placementVertexId);
  if (centerVertexId === null) return null;
  const neighborhood = getGridInspectionNeighborhood(centerVertexId);
  if (!neighborhood) return null;

  return {
    faceIds: new Set(neighborhood.faceBands.flat()),
    edgeKeys: new Set(
      [...neighborhood.spokeBands, ...neighborhood.borderBands]
        .flat()
        .map(([startId, endId]) => getGridEdgeKey(startId, endId)),
    ),
  };
}

export function createArtifactTerritoryGeometry(
  placementVertexId: number,
): ArtifactTerritoryGeometry | null {
  const topology = getReservoirGridTopology();
  const centerVertexId = findReservoirGridVertexId(placementVertexId);
  if (centerVertexId === null) return null;
  const neighborhood = getGridInspectionNeighborhood(centerVertexId);
  if (!neighborhood) return null;
  const faceRadius = RESERVOIR_RADIUS * 1.00075;
  const edgeRadius = RESERVOIR_RADIUS * 1.002;
  const centerNormal = topology.vertices[centerVertexId].clone().normalize();
  const tangentReference =
    Math.abs(centerNormal.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
  const tangentOne = tangentReference
    .clone()
    .addScaledVector(
      centerNormal,
      -tangentReference.dot(centerNormal),
    )
    .normalize();
  const tangentTwo = centerNormal
    .clone()
    .cross(tangentOne)
    .normalize();
  const faceRegion3 = new Set(neighborhood.faceBands.flat());
  const faceBand4 = getFaceRing(topology, faceRegion3);
  const faceRegion4 = new Set([...faceRegion3, ...faceBand4]);
  const vertexLevels = new Map(neighborhood.vertexLevels);
  for (const faceId of faceBand4) {
    for (const vertexId of topology.faces[faceId]) {
      if (!vertexLevels.has(vertexId)) vertexLevels.set(vertexId, 4);
    }
  }

  function getLocalCoordinate(surfaceDirection: THREE.Vector3) {
    const direction = surfaceDirection.clone().normalize();
    const normalProjection = THREE.MathUtils.clamp(
      direction.dot(centerNormal),
      -1,
      1,
    );
    const angularDistance = Math.acos(normalProjection);
    const tangentDirection = direction.addScaledVector(
      centerNormal,
      -normalProjection,
    );
    if (tangentDirection.lengthSq() < Number.EPSILON) {
      return { x: 0, y: 0 };
    }
    tangentDirection.normalize().multiplyScalar(angularDistance);
    return {
      x: tangentDirection.dot(tangentOne),
      y: tangentDirection.dot(tangentTwo),
    };
  }

  function getFaceVertexIntensity(level: number) {
    if (level > 3.5) return RESERVOIR_GLOW_FACE_INTENSITY_LEVELS[3];
    if (level > 2.5) return RESERVOIR_GLOW_FACE_INTENSITY_LEVELS[3];
    if (level > 1.5) return RESERVOIR_GLOW_FACE_INTENSITY_LEVELS[2];
    if (level > 0.5) return RESERVOIR_GLOW_FACE_INTENSITY_LEVELS[1];
    return RESERVOIR_GLOW_FACE_INTENSITY_LEVELS[0];
  }

  const faceBands = [...neighborhood.faceBands, faceBand4];
  const faceCells: ReservoirTopologyCell[] = [];
  const edgeCells: ReservoirTopologyCell[] = [];

  const faceGeometries = faceBands.map((faceIds, bandIndex) => {
    const points: THREE.Vector3[] = [];
    const intensityLevels: number[] = [];
    const expandedWeights: number[] = [];
    const expandedIntensities: number[] = [];
    for (const faceId of faceIds) {
      const face = topology.faces[faceId];
      const faceIntensities = face.map((vertexId) =>
        getFaceVertexIntensity(vertexLevels.get(vertexId) ?? 4),
      );
      const localVertices = face.map((vertexId) =>
        getLocalCoordinate(topology.vertices[vertexId]),
      );
      faceCells.push({
        baseIntensities: faceIntensities,
        canonical: bandIndex < 3,
        geometryIndex: bandIndex,
        id: String(faceId),
        localVertices,
        vertexOffset: points.length,
      });
      for (const vertexId of topology.faces[faceId]) {
        points.push(
          topology.vertices[vertexId]
            .clone()
            .normalize()
            .multiplyScalar(faceRadius),
        );
        intensityLevels.push(
          vertexLevels.get(vertexId) ?? 4,
        );
        expandedWeights.push(0);
        expandedIntensities.push(0);
      }
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute(
      "intensityLevel",
      new THREE.Float32BufferAttribute(intensityLevels, 1),
    );
    geometry.setAttribute(
      "expandedWeight",
      new THREE.Float32BufferAttribute(expandedWeights, 1),
    );
    geometry.setAttribute(
      "expandedIntensity",
      new THREE.Float32BufferAttribute(expandedIntensities, 1),
    );
    return geometry;
  });

  type CanonicalEdgeStyle = {
    endId: number;
    endDistance: number;
    endIntensity: number;
    startId: number;
    startDistance: number;
    startIntensity: number;
  };
  const canonicalEdgeStyles = new Map<string, CanonicalEdgeStyle>();
  for (let bandIndex = 0; bandIndex < 2; bandIndex += 1) {
    for (const [startId, endId] of neighborhood.spokeBands[bandIndex]) {
      canonicalEdgeStyles.set(getGridEdgeKey(startId, endId), {
        startId,
        endId,
        startIntensity: RESERVOIR_GLOW_SPOKE_INTENSITIES[bandIndex][0],
        endIntensity: RESERVOIR_GLOW_SPOKE_INTENSITIES[bandIndex][1],
        startDistance: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][0],
        endDistance: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][1],
      });
    }
  }
  for (let bandIndex = 0; bandIndex < 2; bandIndex += 1) {
    for (const [startId, endId] of neighborhood.borderBands[bandIndex]) {
      canonicalEdgeStyles.set(getGridEdgeKey(startId, endId), {
        startId,
        endId,
        startIntensity: RESERVOIR_GLOW_BORDER_OPACITIES[bandIndex],
        endIntensity: RESERVOIR_GLOW_BORDER_OPACITIES[bandIndex],
        startDistance: (bandIndex + 1) / 3,
        endDistance: (bandIndex + 1) / 3,
      });
    }
  }

  const candidateEdges = new Map<string, GridEdge>();
  for (const faceId of faceRegion4) {
    const face = topology.faces[faceId];
    for (let edgeIndex = 0; edgeIndex < face.length; edgeIndex += 1) {
      const startId = face[edgeIndex];
      const endId = face[(edgeIndex + 1) % face.length];
      candidateEdges.set(getGridEdgeKey(startId, endId), [startId, endId]);
    }
  }

  const spokeBands = neighborhood.spokeBands.map((edges) => {
    const points: THREE.Vector3[] = [];
    const innerWeights: number[] = [];
    for (const [startId, endId] of edges) {
      points.push(
        topology.vertices[startId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
        topology.vertices[endId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
      );
      innerWeights.push(1, 0);
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute(
      "innerWeight",
      new THREE.Float32BufferAttribute(innerWeights, 1),
    );
    return geometry;
  });

  const borderBands = neighborhood.borderBands.map((edges) => {
    const points: THREE.Vector3[] = [];
    for (const [startId, endId] of edges) {
      points.push(
        topology.vertices[startId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
        topology.vertices[endId]
          .clone()
          .normalize()
          .multiplyScalar(edgeRadius),
      );
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  });

  const edgePoints: THREE.Vector3[] = [];
  const edgeBaseIntensities: number[] = [];
  const edgeBaseDistances: number[] = [];
  const edgeExpandedWeights: number[] = [];
  const edgeExpandedIntensities: number[] = [];
  for (const [edgeId, [startId, endId]] of candidateEdges) {
    const style = canonicalEdgeStyles.get(edgeId);
    const startLocal = getLocalCoordinate(topology.vertices[startId]);
    const endLocal = getLocalCoordinate(topology.vertices[endId]);
    const candidateUsesCanonicalDirection = style?.startId === startId;
    const startIntensity = candidateUsesCanonicalDirection
      ? style?.startIntensity
      : style?.endIntensity;
    const endIntensity = candidateUsesCanonicalDirection
      ? style?.endIntensity
      : style?.startIntensity;
    const startDistance = candidateUsesCanonicalDirection
      ? style?.startDistance
      : style?.endDistance;
    const endDistance = candidateUsesCanonicalDirection
      ? style?.endDistance
      : style?.startDistance;
    edgePoints.push(
      topology.vertices[startId]
        .clone()
        .normalize()
        .multiplyScalar(edgeRadius),
      topology.vertices[endId]
        .clone()
        .normalize()
        .multiplyScalar(edgeRadius),
    );
    edgeBaseIntensities.push(
      startIntensity ?? 0,
      endIntensity ?? 0,
    );
    edgeBaseDistances.push(
      startDistance ?? 0,
      endDistance ?? 0,
    );
    edgeExpandedWeights.push(0, 0);
    edgeExpandedIntensities.push(0, 0);
    edgeCells.push({
      baseIntensities: [startIntensity ?? 0, endIntensity ?? 0],
      canonical: style !== undefined,
      geometryIndex: 0,
      id: edgeId,
      localVertices: [startLocal, endLocal],
      vertexOffset: edgePoints.length - 2,
    });
  }
  const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
  edgeGeometry.setAttribute(
    "baseIntensity",
    new THREE.Float32BufferAttribute(edgeBaseIntensities, 1),
  );
  edgeGeometry.setAttribute(
    "baseDistance",
    new THREE.Float32BufferAttribute(edgeBaseDistances, 1),
  );
  edgeGeometry.setAttribute(
    "expandedWeight",
    new THREE.Float32BufferAttribute(edgeExpandedWeights, 1),
  );
  edgeGeometry.setAttribute(
    "expandedIntensity",
    new THREE.Float32BufferAttribute(edgeExpandedIntensities, 1),
  );

  return {
    expandedEdgeBands: [edgeGeometry],
    faceBands: faceGeometries,
    spokeBands,
    borderBands,
    faceCells,
    edgeCells,
    faceCounts: faceBands.map((band) => band.length),
    spokeCounts: neighborhood.spokeBands.map((band) => band.length),
    borderCounts: neighborhood.borderBands.map((band) => band.length),
  };
}
