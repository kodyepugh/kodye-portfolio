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

export const embeddedReservoirCollections: EmbeddedReservoirCollection[] = [
  {
    kind: "collection",
    id: "collection-work",
    title: "WORK",
    subtitle: "Selected projects and ongoing studies",
    category: "Practice",
    contentSummary: "Artifacts and collections",
    exploreLenses: ["work", "inquiry"],
    parentCollectionId: ROOT_COLLECTION_ID,
  },
  {
    kind: "collection",
    id: "collection-field-archive",
    title: "FIELD ARCHIVE",
    subtitle: "Observations of place, weather, and public life",
    category: "Field Studies",
    contentSummary: "World and inquiry records",
    exploreLenses: ["world", "inquiry"],
    parentCollectionId: ROOT_COLLECTION_ID,
  },
  {
    kind: "collection",
    id: "collection-work-studies",
    title: "STUDIES",
    subtitle: "Smaller investigations within the work archive",
    category: "Research",
    contentSummary: "Dormant nested collection",
    exploreLenses: ["inquiry", "world"],
    parentCollectionId: "collection-work",
  },
  {
    kind: "collection",
    id: "collection-inquiry-archive",
    title: "INQUIRY ARCHIVE",
    subtitle: "Open questions and unresolved systems",
    category: "Research",
    contentSummary: "Nested inquiry collection",
    exploreLenses: ["inquiry", "self"],
    parentCollectionId: "collection-work-studies",
  },
  ...(process.env.NODE_ENV === "development"
    ? [
        {
          kind: "collection" as const,
          id: "collection-depth-test-four",
          title: "DEPTH TEST 04",
          subtitle: "Development-only recursive navigation fixture",
          category: "QA",
          contentSummary: "Direct ancestor retreat fixture",
          exploreLenses: ["inquiry" as const],
          parentCollectionId: "collection-inquiry-archive",
        },
        {
          kind: "collection" as const,
          id: "collection-depth-test-five",
          title: "DEPTH TEST 05",
          subtitle: "Development-only recursive navigation fixture",
          category: "QA",
          contentSummary: "Depth-independent return fixture",
          exploreLenses: ["inquiry" as const],
          parentCollectionId: "collection-depth-test-four",
        },
      ]
    : []),
];

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
