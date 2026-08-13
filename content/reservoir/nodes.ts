import {
  activeReservoirArtifacts,
  getReservoirArtifacts,
} from "@/content/reservoir/artifacts";
import {
  activeCollectionId,
  activeReservoirChildCollections,
  getReservoirChildCollections,
} from "@/content/reservoir/collections";
import {
  findReservoirGridVertexId,
  getReservoirPlacementNeighborIds,
} from "@/lib/reservoir/geometry";
import type { ReservoirNode } from "@/types/reservoir";

export const activeReservoirNodes = [
  ...activeReservoirArtifacts,
  ...activeReservoirChildCollections,
] satisfies ReservoirNode[];

export function getReservoirNodes(collectionId: string) {
  return [
    ...getReservoirArtifacts(collectionId),
    ...getReservoirChildCollections(collectionId),
  ] satisfies ReservoirNode[];
}

function getDuplicateVertexIds(nodes: readonly ReservoirNode[]) {
  const seenVertexIds = new Set<number>();
  const duplicateVertexIds = new Set<number>();

  for (const node of nodes) {
    if (seenVertexIds.has(node.vertexId)) {
      duplicateVertexIds.add(node.vertexId);
    }
    seenVertexIds.add(node.vertexId);
  }

  return [...duplicateVertexIds].sort((a, b) => a - b);
}

function getAdjacentNodePairs(nodes: readonly ReservoirNode[]) {
  const nodeByVertexId = new Map(
    nodes.map((node) => [node.vertexId, node] as const),
  );
  const pairs = new Set<string>();

  for (const node of nodes) {
    for (const neighborId of getReservoirPlacementNeighborIds(
      node.vertexId,
    )) {
      const neighbor = nodeByVertexId.get(neighborId);
      if (!neighbor) continue;
      pairs.add(
        [node.id, neighbor.id].sort((a, b) => a.localeCompare(b)).join(":"),
      );
    }
  }

  return [...pairs].sort((a, b) => a.localeCompare(b));
}

export function getReservoirNodeDiagnostics(collectionId: string) {
  const nodes = getReservoirNodes(collectionId);
  const collections = getReservoirChildCollections(collectionId);

  return {
    nodeCount: nodes.length,
    collectionCount: collections.length,
    collectionIds: collections.map((collection) => collection.id),
    collectionVertexIds: collections.map(
      (collection) => collection.vertexId,
    ),
    collectionGridVertexIds: collections.map((collection) =>
      findReservoirGridVertexId(collection.vertexId),
    ),
    duplicateVertexIds: getDuplicateVertexIds(nodes),
    adjacentNodePairs: getAdjacentNodePairs(nodes),
  };
}

export const reservoirNodeDiagnostics =
  getReservoirNodeDiagnostics(activeCollectionId);
