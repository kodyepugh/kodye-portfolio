import type { Vector3 } from "three";

export type ReservoirArtifact = {
  kind: "artifact";
  id: string;
  collectionId: string;
  type: string;
  title: string;
  subtitle?: string;
  date?: string;
  context?: string;
  medium?: string;
  color: string;
  vertexId: number;
};

export type ReservoirCollection = {
  kind: "collection";
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  date?: string;
  contentSummary?: string;
};

export type EmbeddedReservoirCollection = ReservoirCollection & {
  parentCollectionId: string;
  vertexId: number;
};

export type ReservoirNode = ReservoirArtifact | EmbeddedReservoirCollection;

export type ReservoirGridInspection = {
  active: boolean;
  revision: number;
  worldPoint: Vector3;
};

export type PreparedArtifactContent = {
  artifactId: string;
  type: string;
  title: string;
  subtitle?: string;
  details: Array<{ label: string; value: string }>;
  placeholderBody: string;
};
