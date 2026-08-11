import type { ReservoirArtifact } from "@/types/reservoir";

// Offline maximum-minimum sample from the canonical detail-3 vertex set.
// Eligible vertices occupy the initial upper-front cap after the fixed base
// rotation (normalized y >= 0.4 and z >= 0.15). Five-vertex samples are ranked
// by their minimum angular separation; the maximum-minimum sample wins, with
// the lexicographically smallest vertex-ID set as the deterministic tie-breaker.
export const reservoirArtifacts = [
  { id: "artifact-01", title: "Artifact 01", vertexId: 34 },
  { id: "artifact-02", title: "Artifact 02", vertexId: 64 },
  { id: "artifact-03", title: "Artifact 03", vertexId: 96 },
  { id: "artifact-04", title: "Artifact 04", vertexId: 114 },
  { id: "artifact-05", title: "Artifact 05", vertexId: 134 },
] satisfies ReservoirArtifact[];
