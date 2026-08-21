export type ExploreLens = "work" | "self" | "world" | "inquiry";
export type ActiveExploreFilter = "all" | "collections" | ExploreLens;
export type DirectArtifactId = "about" | "resume" | "contact";

export type ReservoirContext =
  | {
      kind: "collection";
      collectionId: string;
    }
  | {
      kind: "query";
      resultIds: string[];
      returnContext: ReservoirContext;
      label?: string;
    };

export type ReservoirArtifact = {
  kind: "artifact";
  id: string;
  canonicalArtifactId?: string;
  collectionId: string;
  directArtifactId?: DirectArtifactId;
  exploreLenses: readonly ExploreLens[];
  type: string;
  title: string;
  subtitle?: string;
  date?: string;
  context?: string;
  medium?: string;
  color: string;
};

export type ReservoirCollection = {
  kind: "collection";
  id: string;
  exploreLenses?: readonly ExploreLens[];
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  date?: string;
  contentSummary?: string;
};

export type EmbeddedReservoirCollection = ReservoirCollection & {
  parentCollectionId: string;
};

export type ReservoirNode = ReservoirArtifact | EmbeddedReservoirCollection;

export type PreparedArtifactContent = {
  artifactId: string;
  type: string;
  title: string;
  subtitle?: string;
  details: Array<{ label: string; value: string }>;
  placeholderBody: string;
};
