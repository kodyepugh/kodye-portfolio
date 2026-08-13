import type {
  EmbeddedReservoirCollection,
  ReservoirCollection,
} from "@/types/reservoir";

export const ROOT_COLLECTION_ID = "home";
export const activeCollectionId = ROOT_COLLECTION_ID;

export const rootReservoirCollection = {
  kind: "collection",
  id: ROOT_COLLECTION_ID,
  title: "Home",
} satisfies ReservoirCollection;

// The collection shares the canonical placement-vertex architecture used by
// artifacts. Placement vertex 104 maps exactly to detail-15 grid vertex 2117.
export const embeddedReservoirCollections = [
  {
    kind: "collection",
    id: "collection-work",
    title: "WORK",
    subtitle: "Selected projects and ongoing studies",
    category: "Practice",
    contentSummary: "Artifacts and collections",
    parentCollectionId: ROOT_COLLECTION_ID,
    vertexId: 104,
  },
  {
    kind: "collection",
    id: "collection-work-studies",
    title: "STUDIES",
    subtitle: "Smaller investigations within the work archive",
    category: "Research",
    contentSummary: "Dormant nested collection",
    parentCollectionId: "collection-work",
    vertexId: 114,
  },
] satisfies EmbeddedReservoirCollection[];

export const reservoirCollections: readonly ReservoirCollection[] = [
  rootReservoirCollection,
  ...embeddedReservoirCollections,
];

export const activeReservoirCollection =
  reservoirCollections.find(
    (collection) => collection.id === activeCollectionId,
  ) ?? rootReservoirCollection;

export const activeReservoirChildCollections =
  getReservoirChildCollections(activeCollectionId);

export function getReservoirCollection(collectionId: string) {
  return (
    reservoirCollections.find(
      (collection) => collection.id === collectionId,
    ) ?? null
  );
}

export function getReservoirChildCollections(collectionId: string) {
  return embeddedReservoirCollections.filter(
    (collection) => collection.parentCollectionId === collectionId,
  );
}
