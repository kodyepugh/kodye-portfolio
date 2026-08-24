import type { ReservoirContext } from "@/types/reservoir";
import {
  appendReservoirHistoryFrame,
  truncateReservoirHistoryAtVisit,
  type ReservoirHistoryFrame,
} from "@/lib/reservoir/history";

type ActiveReservoirResourceReuseInput = {
  resourceId: string;
  activeContext: ReservoirContext;
  activeResourceIds: readonly string[];
  requestedCollectionId?: string;
};

export function canReuseActiveReservoirResource({
  resourceId,
  activeContext,
  activeResourceIds,
  requestedCollectionId,
}: ActiveReservoirResourceReuseInput) {
  if (!activeResourceIds.includes(resourceId)) return false;
  if (!requestedCollectionId) return true;

  return (
    activeContext.kind === "collection" &&
    activeContext.collectionId === requestedCollectionId
  );
}

export function resolveContextualResourceHistory(
  history: ReservoirHistoryFrame[],
  collectionId: string,
  createFrame: (context: ReservoirContext) => ReservoirHistoryFrame,
) {
  const existingTargetFrame = [...history]
    .reverse()
    .find(
      (frame) =>
        frame.context.kind === "collection" &&
        frame.context.collectionId === collectionId,
    );
  if (existingTargetFrame) {
    if (existingTargetFrame.id === history.at(-1)?.id) return history;
    return truncateReservoirHistoryAtVisit(history, existingTargetFrame.id);
  }

  return appendReservoirHistoryFrame(
    history,
    createFrame({ kind: "collection", collectionId }),
  );
}
