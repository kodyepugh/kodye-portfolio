import * as THREE from "three";

const PROJECTED_DIAMETER_EPSILON = 1e-6;

type ProjectedWorldDiameterPixelsInput = {
  camera: THREE.Camera;
  viewportHeight: number;
  worldDiameter: number;
  worldPosition: THREE.Vector3;
  scratchCameraSpacePosition: THREE.Vector3;
};

export type ProjectedDiameterAtDepthInput = {
  camera: THREE.Camera;
  viewportHeight: number;
  worldDiameter: number;
  cameraDepth: number;
};

export function getCameraSpaceDepth(
  camera: THREE.Camera,
  worldPosition: THREE.Vector3,
  scratchCameraSpacePosition: THREE.Vector3,
) {
  scratchCameraSpacePosition
    .copy(worldPosition)
    .applyMatrix4(camera.matrixWorldInverse);
  return -scratchCameraSpacePosition.z;
}

export function getProjectedWorldDiameterPixelsAtDepth({
  camera,
  viewportHeight,
  worldDiameter,
  cameraDepth,
}: ProjectedDiameterAtDepthInput) {
  if (
    !Number.isFinite(worldDiameter) ||
    worldDiameter <= 0 ||
    !Number.isFinite(cameraDepth) ||
    cameraDepth <= PROJECTED_DIAMETER_EPSILON
  ) {
    return 0;
  }

  if (camera instanceof THREE.OrthographicCamera) {
    const visibleHeight = camera.top - camera.bottom;
    if (visibleHeight <= PROJECTED_DIAMETER_EPSILON) return 0;

    return (
      (worldDiameter * viewportHeight * Math.max(camera.zoom, PROJECTED_DIAMETER_EPSILON)) /
      visibleHeight
    );
  }

  const focalLengthPixels =
    (viewportHeight * camera.projectionMatrix.elements[5]) / 2;
  if (
    !Number.isFinite(focalLengthPixels) ||
    focalLengthPixels <= PROJECTED_DIAMETER_EPSILON
  ) {
    return 0;
  }

  return (worldDiameter * focalLengthPixels) / cameraDepth;
}

export function getWorldDiameterForProjectedPixelsAtDepth({
  camera,
  viewportHeight,
  projectedPixels,
  cameraDepth,
}: {
  camera: THREE.Camera;
  viewportHeight: number;
  projectedPixels: number;
  cameraDepth: number;
}) {
  if (
    !Number.isFinite(projectedPixels) ||
    projectedPixels <= 0 ||
    !Number.isFinite(cameraDepth) ||
    cameraDepth <= PROJECTED_DIAMETER_EPSILON
  ) {
    return 0;
  }

  if (camera instanceof THREE.OrthographicCamera) {
    const visibleHeight = camera.top - camera.bottom;
    if (visibleHeight <= PROJECTED_DIAMETER_EPSILON) return 0;
    return (
      (projectedPixels * visibleHeight) /
      (viewportHeight * Math.max(camera.zoom, PROJECTED_DIAMETER_EPSILON))
    );
  }

  const focalLengthPixels =
    (viewportHeight * camera.projectionMatrix.elements[5]) / 2;
  if (
    !Number.isFinite(focalLengthPixels) ||
    focalLengthPixels <= PROJECTED_DIAMETER_EPSILON
  ) {
    return 0;
  }
  return (projectedPixels * cameraDepth) / focalLengthPixels;
}

/** Positive values mean the surface normal points toward the viewer. */
export function getReservoirFrontFacingScore(
  surfaceNormal: THREE.Vector3,
  cameraForward: THREE.Vector3,
) {
  return -surfaceNormal.dot(cameraForward);
}

/**
 * Projects a world-space diameter into screen pixels at the given world
 * position. The helper keeps the math centralized so zoom ceilings and label
 * thresholds use the same projection model.
 */
export function getProjectedWorldDiameterPixels({
  camera,
  viewportHeight,
  worldDiameter,
  worldPosition,
  scratchCameraSpacePosition,
}: ProjectedWorldDiameterPixelsInput) {
  return getProjectedWorldDiameterPixelsAtDepth({
    camera,
    viewportHeight,
    worldDiameter,
    cameraDepth: getCameraSpaceDepth(
      camera,
      worldPosition,
      scratchCameraSpacePosition,
    ),
  });
}
