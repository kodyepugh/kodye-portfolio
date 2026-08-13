export type CollectionPresentationState =
  | "active"
  | "transitioning-out"
  | "transitioning-in"
  | "hidden-ancestor";

export const COLLECTION_ENTRY_PHASES = {
  parentGreyDrain: [0.12, 0.82],
  destinationGreyFill: [0.2, 0.88],
  destinationGridResolve: [0.45, 0.9],
} as const;

export const COLLECTION_RETURN_PHASES = {
  parentReveal: [0.08, 0.42],
  childGreyDrain: [0.14, 0.72],
  parentGreyFill: [0.18, 0.78],
  childGridDormancy: [0.34, 0.82],
  childEmbedding: [0.12, 0.86],
  parentChildrenRestore: [0.7, 1],
} as const;

export function getCollectionEntryPhase(
  progress: number,
  [start, end]: readonly [number, number],
) {
  const normalized = Math.min(Math.max((progress - start) / (end - start), 0), 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function getCollectionChildEmergenceProgress(
  progress: number,
  order: number,
  childCount: number,
) {
  const maximumDelay = childCount > 1 ? 0.34 : 0;
  const delay =
    childCount > 1 ? (order / (childCount - 1)) * maximumDelay : 0;
  const normalized = Math.min(
    Math.max((progress - delay) / (1 - maximumDelay), 0),
    1,
  );

  return 1 - (1 - normalized) ** 3;
}
