export type InspectionReturnFrame = {
  resourceId: string;
  scrollY: number;
  postContentProgress: number;
};

export type InspectionReadingRestorationResult = {
  targetFrame: InspectionReturnFrame;
  appliedFrame: InspectionReturnFrame;
};

export type InspectionViewportRect = Pick<
  DOMRectReadOnly,
  "top" | "right" | "bottom" | "left"
>;

const INSPECTION_RETURN_SCROLL_TOLERANCE_PX = 1;
const INSPECTION_RETURN_PROGRESS_TOLERANCE = 0.001;

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

export function getBoundedInspectionReturnFrame(
  frame: InspectionReturnFrame,
  maximumScrollY: number,
  totalRevealDistance: number,
) {
  const boundedRevealDistance = getFiniteNonNegativeValue(totalRevealDistance);
  const postContentOffset = getInspectionReturnPostContentOffset(
    frame,
    boundedRevealDistance,
  );
  return createInspectionReturnFrame(
    frame.resourceId,
    getInspectionReturnScrollY(frame, maximumScrollY),
    boundedRevealDistance > 0
      ? postContentOffset / boundedRevealDistance
      : 0,
  );
}

export function isInspectionCloseControlVisibleInViewport(
  rect: InspectionViewportRect,
  viewportWidth: number,
  viewportHeight: number,
) {
  return (
    viewportWidth > 0 &&
    viewportHeight > 0 &&
    rect.bottom > 0 &&
    rect.top < viewportHeight &&
    rect.right > 0 &&
    rect.left < viewportWidth
  );
}

export function areInspectionReturnFramesPracticallyEquivalent(
  intended: InspectionReturnFrame,
  restored: InspectionReturnFrame,
) {
  return (
    intended.resourceId === restored.resourceId &&
    Math.abs(intended.scrollY - restored.scrollY) <=
      INSPECTION_RETURN_SCROLL_TOLERANCE_PX &&
    Math.abs(
      intended.postContentProgress - restored.postContentProgress,
    ) <= INSPECTION_RETURN_PROGRESS_TOLERANCE
  );
}
