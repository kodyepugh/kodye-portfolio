import type { ReservoirInspectableResourceNode } from "@/lib/content/reservoir-adapter";

export type ReservoirResourceSelectionAction =
  | "select-resource"
  | "open-artifact"
  | "resource-inspection-deferred";

export function getReservoirResourceSelectionAction(
  node: ReservoirInspectableResourceNode,
  selectedResourceId: string | null,
): ReservoirResourceSelectionAction {
  if (node.id !== selectedResourceId) return "select-resource";
  return node.isArtifact
    ? "open-artifact"
    : "resource-inspection-deferred";
}
