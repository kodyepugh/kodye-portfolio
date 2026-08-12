import type { Vector3 } from "three";

export type ReservoirArtifact = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  date?: string;
  context?: string;
  medium?: string;
  color: string;
  vertexId: number;
};

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
