import {
  activeReservoirArtifacts,
  getReservoirArtifacts,
} from "@/content/reservoir/artifacts";
import {
  activeCollectionId,
  activeReservoirChildCollections,
  getReservoirChildCollections,
} from "@/content/reservoir/collections";
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

function getDuplicateNodeIds(nodes: readonly ReservoirNode[]) {
  const seenNodeIds = new Set<string>();
  const duplicateNodeIds = new Set<string>();

  for (const node of nodes) {
    if (seenNodeIds.has(node.id)) {
      duplicateNodeIds.add(node.id);
    }
    seenNodeIds.add(node.id);
  }

  return [...duplicateNodeIds].sort((a, b) => a.localeCompare(b));
}

export function getReservoirNodeDiagnostics(collectionId: string) {
  const nodes = getReservoirNodes(collectionId);
  const collections = getReservoirChildCollections(collectionId);

  return {
    nodeCount: nodes.length,
    nodeIds: nodes.map((node) => node.id),
    collectionCount: collections.length,
    collectionIds: collections.map((collection) => collection.id),
    duplicateNodeIds: getDuplicateNodeIds(nodes),
  };
}

export const reservoirNodeDiagnostics =
  getReservoirNodeDiagnostics(activeCollectionId);
