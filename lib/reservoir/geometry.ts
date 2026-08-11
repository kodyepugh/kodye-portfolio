import * as THREE from "three";

export const RESERVOIR_RADIUS = 3.2;
export const RESERVOIR_SURFACE_DETAIL = 7;
export const RESERVOIR_GRID_DETAIL = 15;
export const RESERVOIR_PLACEMENT_DETAIL = 3;
export const RESERVOIR_NODE_RADIUS = 0.052;
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
  faceBands: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];
  spokeBands: [THREE.BufferGeometry, THREE.BufferGeometry];
  borderBands: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];
  faceCounts: [number, number, number];
  spokeCounts: [number, number];
  borderCounts: [number, number, number];
};

export type ReservoirGradientPointBand = {
  attributeValues: number[];
  points: THREE.Vector3[];
};

export type ReservoirGridSelectionMask = {
  faceIds: ReadonlySet<number>;
  edgeKeys: ReadonlySet<string>;
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

export function createReservoirSurfaceGeometry() {
  return new THREE.IcosahedronGeometry(
    RESERVOIR_RADIUS,
    RESERVOIR_SURFACE_DETAIL,
  );
}

export function createReservoirGridGeometry() {
  return new THREE.IcosahedronGeometry(
    RESERVOIR_RADIUS,
    RESERVOIR_GRID_DETAIL,
  );
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

  const faceBands = neighborhood.faceBands.map((faceIds) => {
    const points: THREE.Vector3[] = [];
    const intensityLevels: number[] = [];
    for (const faceId of faceIds) {
      for (const vertexId of topology.faces[faceId]) {
        points.push(
          topology.vertices[vertexId]
            .clone()
            .normalize()
            .multiplyScalar(faceRadius),
        );
        intensityLevels.push(
          neighborhood.vertexLevels.get(vertexId) ?? 3,
        );
      }
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute(
      "intensityLevel",
      new THREE.Float32BufferAttribute(intensityLevels, 1),
    );
    return geometry;
  }) as [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];

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
  }) as [THREE.BufferGeometry, THREE.BufferGeometry];

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
  }) as [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];

  return {
    faceBands,
    spokeBands,
    borderBands,
    faceCounts: neighborhood.faceBands.map((band) => band.length) as [
      number,
      number,
      number,
    ],
    spokeCounts: neighborhood.spokeBands.map((band) => band.length) as [
      number,
      number,
    ],
    borderCounts: neighborhood.borderBands.map((band) => band.length) as [
      number,
      number,
      number,
    ],
  };
}
