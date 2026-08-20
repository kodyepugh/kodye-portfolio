export type InspectionReturnFrame = {
  resourceId: string;
  scrollY: number;
  postContentProgress: number;
};

export type CollectionHistoryFrame = {
  collectionId: string;
  inspectionReturn?: InspectionReturnFrame;
};

export function getCollectionInspectionReturnFrame(
  history: readonly CollectionHistoryFrame[],
) {
  return history.at(-1)?.inspectionReturn ?? null;
}

export type InspectionReturnFrameStore = Map<string, InspectionReturnFrame>;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getFiniteNonNegativeValue(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

export function createInspectionReturnFrame(
  resourceId: string,
  scrollY: number,
  postContentProgress: number,
): InspectionReturnFrame {
  return {
    resourceId,
    scrollY: getFiniteNonNegativeValue(scrollY),
    postContentProgress: Number.isFinite(postContentProgress)
      ? clamp(postContentProgress, 0, 1)
      : 0,
  };
}

export function associateInspectionReturnFrame(
  store: InspectionReturnFrameStore,
  queryContextKey: string,
  frame: InspectionReturnFrame,
) {
  store.set(queryContextKey, frame);
}

export function getInspectionReturnFrame(
  store: InspectionReturnFrameStore,
  queryContextKey: string,
) {
  return store.get(queryContextKey) ?? null;
}

export function consumeInspectionReturnFrame(
  store: InspectionReturnFrameStore,
  queryContextKey: string,
) {
  const frame = getInspectionReturnFrame(store, queryContextKey);
  if (frame) store.delete(queryContextKey);
  return frame;
}

export function discardInspectionReturnFrame(
  store: InspectionReturnFrameStore,
  queryContextKey: string,
) {
  return store.delete(queryContextKey);
}

export function getInspectionReturnScrollY(
  frame: InspectionReturnFrame,
  maximumScrollY: number,
) {
  return clamp(
    frame.scrollY,
    0,
    getFiniteNonNegativeValue(maximumScrollY),
  );
}

export function getInspectionReturnPostContentOffset(
  frame: InspectionReturnFrame,
  totalRevealDistance: number,
) {
  const boundedRevealDistance = getFiniteNonNegativeValue(totalRevealDistance);
  return clamp(
    frame.postContentProgress * boundedRevealDistance,
    0,
    boundedRevealDistance,
  );
}
