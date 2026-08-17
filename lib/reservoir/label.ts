export const RESERVOIR_LABEL_ZOOM = {
  enter: 1.4,
  exit: 1.26,
} as const;

/**
 * Maintains a small hysteresis band so continuous wheel or trackpad input does
 * not repeatedly toggle label eligibility around one zoom value.
 */
export function getReservoirLabelsVisible(
  zoomLevel: number,
  currentlyVisible: boolean,
) {
  return currentlyVisible
    ? zoomLevel > RESERVOIR_LABEL_ZOOM.exit
    : zoomLevel >= RESERVOIR_LABEL_ZOOM.enter;
}
