export type InspectionImageSequenceItem = {
  id: string;
  order: number;
};

export type InspectionImageGestureMode = "swipe" | "pan";

export const INSPECTION_IMAGE_MIN_ZOOM = 1;
export const INSPECTION_IMAGE_MAX_ZOOM = 5;

export function sortInspectionImageSequence<T extends InspectionImageSequenceItem>(
  items: Iterable<T>,
) {
  return [...items].sort(
    (first, second) => first.order - second.order || first.id.localeCompare(second.id),
  );
}

export function getInspectionImageSequenceIndex(
  items: readonly InspectionImageSequenceItem[],
  id: string,
) {
  return items.findIndex((item) => item.id === id);
}

export function getInspectionImageSequenceId(
  items: readonly InspectionImageSequenceItem[],
  currentIndex: number,
  delta: number,
) {
  const nextIndex = currentIndex + delta;
  return items[nextIndex]?.id ?? null;
}

export function clampInspectionImageZoom(value: number) {
  return Math.min(
    Math.max(value, INSPECTION_IMAGE_MIN_ZOOM),
    INSPECTION_IMAGE_MAX_ZOOM,
  );
}

export function getInspectionImageGestureMode(
  zoom: number,
  fitZoom = INSPECTION_IMAGE_MIN_ZOOM,
): InspectionImageGestureMode {
  return zoom > fitZoom ? "pan" : "swipe";
}
