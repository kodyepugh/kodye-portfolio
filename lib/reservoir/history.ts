import type { ReservoirContext } from "@/types/reservoir";
import type { InspectionReturnFrame } from "./inspection-return";

export const MAX_VISIBLE_PRIOR_RESERVOIRS = 5;

export type ReservoirHistoryFrame = {
  id: string;
  context: ReservoirContext;
  label: string;
  inspectionReturn?: InspectionReturnFrame;
};

export type VisibleReservoirHistory = {
  frames: ReservoirHistoryFrame[];
  hasHiddenHistory: boolean;
};

export function getQueryReservoirHistoryLabel(
  resultTitles: readonly string[],
  explicitLabel?: string | null,
) {
  const semanticLabel = explicitLabel?.trim();
  if (semanticLabel) return semanticLabel;
  if (resultTitles.length === 1 && resultTitles[0]?.trim()) {
    return resultTitles[0].trim();
  }
  return `Query · ${resultTitles.length} results`;
}

export function appendReservoirHistoryFrame(
  history: readonly ReservoirHistoryFrame[],
  frame: ReservoirHistoryFrame,
) {
  return [...history, frame];
}

export function setInspectionReturnForReservoirVisit(
  history: readonly ReservoirHistoryFrame[],
  visitId: string,
  inspectionReturn: InspectionReturnFrame | null,
) {
  const currentFrame = history.at(-1);
  if (!currentFrame || currentFrame.id !== visitId) return [...history];

  return history.map((frame, index) =>
    index === history.length - 1
      ? inspectionReturn
        ? { ...frame, inspectionReturn }
        : { id: frame.id, context: frame.context, label: frame.label }
      : frame,
  );
}

export function getPreviousReservoirHistoryFrame(
  history: readonly ReservoirHistoryFrame[],
) {
  return history.at(-2) ?? null;
}

export function truncateReservoirHistoryAtVisit(
  history: readonly ReservoirHistoryFrame[],
  visitId: string,
) {
  const targetIndex = history.findIndex((frame) => frame.id === visitId);
  if (targetIndex < 0 || targetIndex >= history.length - 1) return null;
  return history.slice(0, targetIndex + 1);
}

export function resetReservoirHistory(
  history: readonly ReservoirHistoryFrame[],
) {
  return history.length > 0 ? [history[0]] : [];
}

export function getVisibleReservoirHistory(
  history: readonly ReservoirHistoryFrame[],
  rootCollectionId: string,
  maximumVisible = MAX_VISIBLE_PRIOR_RESERVOIRS,
): VisibleReservoirHistory {
  const priorNonHomeFrames = history.slice(0, -1).filter(
    (frame) =>
      !(
        frame.context.kind === "collection" &&
        frame.context.collectionId === rootCollectionId
      ),
  );
  const boundedMaximum = Math.max(0, Math.floor(maximumVisible));

  return {
    frames:
      boundedMaximum === 0
        ? []
        : priorNonHomeFrames.slice(-boundedMaximum),
    hasHiddenHistory: priorNonHomeFrames.length > boundedMaximum,
  };
}
