export const RESERVOIR_ZOOM_MIN = 0.72;
export const RESERVOIR_ZOOM_MAX = 2.15;
export const RESERVOIR_ZOOM_HARD_CAP = 4;
export const RESERVOIR_ZOOM_BASELINE_MAX = RESERVOIR_ZOOM_MAX;
export const RESERVOIR_ZOOM_EXTENDED_HARD_MAX = RESERVOIR_ZOOM_HARD_CAP;
export const RESERVOIR_ZOOM_DEFAULT = 1;

export type ReservoirSafeZones = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ReservoirFrame = {
  centerScreenX: number;
  centerScreenY: number;
  baseRadiusPixels: number;
  safeZones: ReservoirSafeZones;
  usableWidth: number;
  usableHeight: number;
};

type ReservoirFrameInput = {
  viewportWidth: number;
  viewportHeight: number;
  controlPlaneHeight: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Defines the stable exploration frame independently from changing atmosphere
 * content. The top budget belongs to the atmospheric UI layer; the bottom
 * budget belongs to the persistent control plane.
 */
export function getReservoirFrame({
  viewportWidth,
  viewportHeight,
  controlPlaneHeight,
}: ReservoirFrameInput): ReservoirFrame {
  const width = Math.max(viewportWidth, 1);
  const height = Math.max(viewportHeight, 1);
  const horizontalSafeZone = clamp(width * 0.04, 16, 56);
  const topSafeZone = clamp(height * 0.16, 96, 160);
  const bottomSafeZone = clamp(
    controlPlaneHeight + clamp(height * 0.018, 12, 24),
    88,
    height * 0.42,
  );
  const safeZones = {
    top: topSafeZone,
    right: horizontalSafeZone,
    bottom: bottomSafeZone,
    left: horizontalSafeZone,
  };
  const usableWidth = Math.max(
    1,
    width - safeZones.left - safeZones.right,
  );
  const usableHeight = Math.max(
    1,
    height - safeZones.top - safeZones.bottom,
  );
  const usableTop = safeZones.top;

  return {
    centerScreenX: safeZones.left + usableWidth / 2,
    centerScreenY: usableTop + usableHeight / 2,
    baseRadiusPixels:
      Math.min(usableWidth * 0.46, usableHeight * 0.525),
    safeZones,
    usableWidth,
    usableHeight,
  };
}

export function getReservoirWorldTransform({
  frame,
  viewportHeight,
  cameraDistance,
  cameraFovDegrees,
  reservoirRadius,
}: {
  frame: ReservoirFrame;
  viewportHeight: number;
  cameraDistance: number;
  cameraFovDegrees: number;
  reservoirRadius: number;
}) {
  const height = Math.max(viewportHeight, 1);
  const halfFov = (cameraFovDegrees * Math.PI) / 360;
  const halfWorldHeight = cameraDistance * Math.tan(halfFov);
  const centerNdcY = 1 - (2 * frame.centerScreenY) / height;
  const radiusWorld =
    (frame.baseRadiusPixels / height) * 2 * halfWorldHeight;

  return {
    centerWorldY: centerNdcY * halfWorldHeight,
    baseScale: radiusWorld / reservoirRadius,
  };
}

export function clampReservoirZoom(
  zoomLevel: number,
  maximumZoomLevel = RESERVOIR_ZOOM_MAX,
) {
  return clamp(
    zoomLevel,
    RESERVOIR_ZOOM_MIN,
    Math.min(maximumZoomLevel, RESERVOIR_ZOOM_HARD_CAP),
  );
}
