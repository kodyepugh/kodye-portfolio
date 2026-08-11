import type { Vector3 } from "three";

export type ReservoirArtifact = {
  id: string;
  type: string;
  title: string;
  color: string;
  vertexId: number;
};

export type ReservoirGridInspection = {
  active: boolean;
  revision: number;
  worldPoint: Vector3;
};
