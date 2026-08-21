export type InspectionReturnFrame = {
  resourceId: string;
  scrollY: number;
  postContentProgress: number;
};

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
