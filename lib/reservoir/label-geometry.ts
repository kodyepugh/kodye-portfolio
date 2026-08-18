import * as THREE from "three";

export const RESERVOIR_LABEL_CANDIDATE_ANGLES = [
  0,
  35,
  -35,
  70,
  -70,
  90,
  -90,
] as const;

export const RESERVOIR_LABEL_MIN_OUTWARD_DOT = 0.15;
const LABEL_GEOMETRY_EPSILON = 1e-6;

export type LabelScreenRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Returns the ray-to-rectangle distance for a normalized screen direction. */
export function getLabelRectangleSupportDistance(
  directionX: number,
  directionY: number,
  halfWidth: number,
  halfHeight: number,
) {
  const horizontalDistance =
    Math.abs(directionX) > LABEL_GEOMETRY_EPSILON
      ? halfWidth / Math.abs(directionX)
      : Number.POSITIVE_INFINITY;
  const verticalDistance =
    Math.abs(directionY) > LABEL_GEOMETRY_EPSILON
      ? halfHeight / Math.abs(directionY)
      : Number.POSITIVE_INFINITY;

  return Math.min(horizontalDistance, verticalDistance);
}

export function getLabelScreenRect(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  target: LabelScreenRect,
): LabelScreenRect {
  target.left = centerX - width / 2;
  target.right = centerX + width / 2;
  target.top = centerY - height / 2;
  target.bottom = centerY + height / 2;
  return target;
}

export function getOutwardDot(
  directionX: number,
  directionY: number,
  surfaceOutwardDirection: THREE.Vector2,
) {
  return (
    directionX * surfaceOutwardDirection.x +
    directionY * surfaceOutwardDirection.y
  );
}

export function rotateScreenDirection(
  direction: THREE.Vector2,
  angleDegrees: number,
  target: THREE.Vector2,
) {
  const angle = THREE.MathUtils.degToRad(angleDegrees);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return target.set(
    direction.x * cosine - direction.y * sine,
    direction.x * sine + direction.y * cosine,
  );
}

export function clampLabelCenterToSafeBounds(
  center: THREE.Vector2,
  width: number,
  height: number,
  safeLeft: number,
  safeRight: number,
  safeTop: number,
  safeBottom: number,
  target: THREE.Vector2,
) {
  const minimumX = safeLeft + width / 2;
  const maximumX = safeRight - width / 2;
  const minimumY = safeTop + height / 2;
  const maximumY = safeBottom - height / 2;

  target.set(
    minimumX <= maximumX
      ? THREE.MathUtils.clamp(center.x, minimumX, maximumX)
      : (safeLeft + safeRight) / 2,
    minimumY <= maximumY
      ? THREE.MathUtils.clamp(center.y, minimumY, maximumY)
      : (safeTop + safeBottom) / 2,
  );
  return target;
}
