import { ROOT_COLLECTION_ID } from "@/content/digital-reservoir/collections";
import type { ReservoirContext } from "@/types/reservoir";

export function canNavigateBackFromQueryContext(
  context: Extract<ReservoirContext, { kind: "query" }>,
) {
  if (context.returnContext.kind === "query") return true;
  return context.returnContext.collectionId !== ROOT_COLLECTION_ID;
}

export function shouldShowBackNavigationForQueryContext(
  context: Extract<ReservoirContext, { kind: "query" }>,
  hasInspectionReturnFrame: boolean,
) {
  return (
    canNavigateBackFromQueryContext(context) || hasInspectionReturnFrame
  );
}
