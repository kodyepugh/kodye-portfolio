import * as THREE from "three";

const PROJECTED_DIAMETER_EPSILON = 1e-6;

type ProjectedWorldDiameterPixelsInput = {
  camera: THREE.Camera;
  viewportHeight: number;
  worldDiameter: number;
  worldPosition: THREE.Vector3;
};

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
}: ProjectedWorldDiameterPixelsInput) {
  if (!Number.isFinite(worldDiameter) || worldDiameter <= 0) {
    return 0;
  }

  camera.updateMatrixWorld();
  const cameraSpacePosition = worldPosition
    .clone()
    .applyMatrix4(camera.matrixWorldInverse);
  const depth = -cameraSpacePosition.z;
  if (!Number.isFinite(depth) || depth <= PROJECTED_DIAMETER_EPSILON) {
    return 0;
  }

  if (camera instanceof THREE.OrthographicCamera) {
    const orthographicCamera = camera as THREE.OrthographicCamera;
    const visibleHeight = orthographicCamera.top - orthographicCamera.bottom;
    if (visibleHeight <= PROJECTED_DIAMETER_EPSILON) {
      return 0;
    }

    return (
      (worldDiameter * viewportHeight) /
      visibleHeight /
      Math.max(orthographicCamera.zoom, PROJECTED_DIAMETER_EPSILON)
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

  return (worldDiameter * focalLengthPixels) / depth;
}
