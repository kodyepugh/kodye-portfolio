import type { ReservoirInspectableResourceNode } from "@/lib/content/reservoir-adapter";
import { getResourceInspectionSurface } from "@/lib/reservoir/inspection";

export type ReservoirResourceSelectionAction =
  | "select-resource"
  | "open-resource-inspection"
  | "unsupported-resource-inspection";

export function getReservoirResourceSelectionAction(
  node: ReservoirInspectableResourceNode,
  selectedResourceId: string | null,
): ReservoirResourceSelectionAction {
  if (node.id !== selectedResourceId) return "select-resource";
  return getResourceInspectionSurface(node.inspectionKind) === "unsupported"
    ? "unsupported-resource-inspection"
    : "open-resource-inspection";
}
