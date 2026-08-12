"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MutableRefObject, PointerEvent, WheelEvent } from "react";
import * as THREE from "three";
import {
  activeReservoirArtifacts,
  prepareReservoirArtifactContent,
  reservoirDensityTestDiagnostics,
} from "@/content/reservoir/artifacts";
import {
  getReservoirPlacementGraphDistance,
  RESERVOIR_GRID_DETAIL,
  RESERVOIR_MIN_ARTIFACT_VERTEX_STEPS,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import {
  getOpeningCameraDelay,
  getOpeningDuration,
} from "@/lib/reservoir/opening";
import {
  getArtifactWindowRetractDuration,
  getReservoirRestoreDuration,
  getReservoirRestoreProgress,
} from "@/lib/reservoir/reading";
import type {
  PreparedArtifactContent,
  ReservoirGridInspection,
} from "@/types/reservoir";
import { AtmosphereContent } from "./AtmosphereContent";
import { ArtifactWindow } from "./ArtifactWindow";
import { ReservoirSphere } from "./ReservoirSphere";

const CAMERA_FOV = 34;
const CAMERA_DAMPING = 8;
const CAMERA_WHEEL_RATE = 0.0018;
const MAX_WHEEL_DELTA = 100;
const SPHERE_VIEWPORT_WIDTH = 1.045;
const SPHERE_TOP_Y = 0.36;
const OUTER_DRAG_SENSITIVITY = 0.0042;
const INNER_DRAG_SENSITIVITY = OUTER_DRAG_SENSITIVITY * 0.2;
const INSPECTION_DISTANCE = 2;
const ARC_CONTROL_PROGRESS = 0.48;
const ARC_CLEARANCE = RESERVOIR_RADIUS * 0.18;
const MIN_CAMERA_CLEARANCE = 0.24;
const CLEARANCE_SMOOTHING = 0.002;
const PATH_SAFETY_SAMPLE_COUNT = 100;
const FRAME_EPSILON = 0.000001;
const FRAME_POLE_THRESHOLD = 0.08;
const ENDPOINT_SNAP_THRESHOLD = 0.015;
const DIVE_TARGET_UNLOCK_PROGRESS = 0.04;
const NODE_CLICK_MAX_TRAVEL = 6;
const ARTIFACT_WINDOW_ATMOSPHERE_GAP = 16;

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  maxTravelSquared: number;
  hoverCancelled: boolean;
};

type CameraPath = {
  startProgress: number;
  sphereCenter: THREE.Vector3;
  outerPosition: THREE.Vector3;
  controlPosition: THREE.Vector3;
  outerTarget: THREE.Vector3;
  innerPosition: THREE.Vector3;
  innerTarget: THREE.Vector3;
  outerDirection: THREE.Vector3;
  innerDirection: THREE.Vector3;
  outerCenterDistance: number;
  innerCenterDistance: number;
  minimumRawClearance: number;
  requiresClearanceCorrection: boolean;
};

type LocalSurfaceFrame = {
  normal: THREE.Vector3;
  tangentUp: THREE.Vector3;
  tangentRight: THREE.Vector3;
};

type AtmosphericCameraModel = {
  sphereCenter: THREE.Vector3;
  canonicalFrame: LocalSurfaceFrame;
  outerCenterDistance: number;
  outerRadialTilt: number;
  outerViewTilt: number;
  outerCenterViewOffset: number;
  outerFocusDistance: number;
};

type RetreatPath = {
  startProgress: number;
  frame: LocalSurfaceFrame;
  sphereCenter: THREE.Vector3;
  lateralOffset: number;
  startPlaneDistance: number;
  startRadialTilt: number;
  outerPlaneDistance: number;
  outerRadialTilt: number;
  startQuaternion: THREE.Quaternion;
  outerQuaternion: THREE.Quaternion;
  startFocusDistance: number;
  outerFocusDistance: number;
  outerPosition: THREE.Vector3;
  outerTarget: THREE.Vector3;
};

type DiveTarget = {
  point: [number, number, number] | null;
  source: "pointer" | "default";
};

type TravelDirection = "inward" | "outward";
type ReservoirTransitionState =
  | "idle"
  | "openingArtifact"
  | "deployingArtifact"
  | "readingArtifact"
  | "closingArtifact"
  | "restoringArtifact";

type VectorTuple = [number, number, number];
type QuaternionTuple = [number, number, number, number];

type PreservedReservoirState = {
  artifactId: string;
  sphereQuaternion: QuaternionTuple;
  cameraPosition: VectorTuple;
  cameraTarget: VectorTuple;
  cameraQuaternion: QuaternionTuple;
  cameraProgress: number;
  cameraTargetProgress: number;
  travelDirection: TravelDirection;
  diveTarget: DiveTarget;
  diveTargetLocked: boolean;
  inspectionFrame: {
    normal: VectorTuple;
    tangentUp: VectorTuple;
    tangentRight: VectorTuple;
  } | null;
  lastInspectionFrame: {
    normal: VectorTuple;
    tangentUp: VectorTuple;
    tangentRight: VectorTuple;
  } | null;
  diveOrigin: PreservedCameraPose | null;
  retreatOrigin: PreservedCameraPose | null;
};

type PreservedCameraPose = {
  position: VectorTuple;
  target: VectorTuple;
  quaternion: QuaternionTuple;
  progress: number;
};

type CameraPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  quaternion: THREE.Quaternion;
  progress: number;
};

type RotationDiagnostics = {
  euler: [number, number, number];
  quaternion: [number, number, number, number];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function getDragSensitivity(cameraProgress: number) {
  return THREE.MathUtils.lerp(
    OUTER_DRAG_SENSITIVITY,
    INNER_DRAG_SENSITIVITY,
    smoothstep(clamp(cameraProgress, 0, 1)),
  );
}

function getRotationDiagnostics(
  quaternion: THREE.Quaternion,
): RotationDiagnostics {
  const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");

  return {
    euler: [euler.x, euler.y, euler.z],
    quaternion: quaternion.toArray(),
  };
}

function cloneCameraPose(pose: CameraPose): CameraPose {
  return {
    position: pose.position.clone(),
    target: pose.target.clone(),
    quaternion: pose.quaternion.clone(),
    progress: pose.progress,
  };
}

function toVectorTuple(vector: THREE.Vector3): VectorTuple {
  return [vector.x, vector.y, vector.z];
}

function toQuaternionTuple(quaternion: THREE.Quaternion): QuaternionTuple {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

function preserveCameraPose(pose: CameraPose | null): PreservedCameraPose | null {
  if (!pose) return null;

  return {
    position: toVectorTuple(pose.position),
    target: toVectorTuple(pose.target),
    quaternion: toQuaternionTuple(pose.quaternion),
    progress: pose.progress,
  };
}

function restoreCameraPose(pose: PreservedCameraPose | null) {
  if (!pose) return null;

  return {
    position: new THREE.Vector3(...pose.position),
    target: new THREE.Vector3(...pose.target),
    quaternion: new THREE.Quaternion(...pose.quaternion),
    progress: pose.progress,
  };
}

function preserveLocalSurfaceFrame(frame: LocalSurfaceFrame | null) {
  if (!frame) return null;

  return {
    normal: toVectorTuple(frame.normal),
    tangentUp: toVectorTuple(frame.tangentUp),
    tangentRight: toVectorTuple(frame.tangentRight),
  };
}

function restoreLocalSurfaceFrame(
  frame: PreservedReservoirState["inspectionFrame"],
): LocalSurfaceFrame | null {
  if (!frame) return null;

  return {
    normal: new THREE.Vector3(...frame.normal),
    tangentUp: new THREE.Vector3(...frame.tangentUp),
    tangentRight: new THREE.Vector3(...frame.tangentRight),
  };
}

function easeOutQuadratic(value: number) {
  return 1 - (1 - value) ** 2;
}

function quadraticBezier(
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  progress: number,
  result: THREE.Vector3,
) {
  const inverse = 1 - progress;

  return result
    .copy(start)
    .multiplyScalar(inverse * inverse)
    .addScaledVector(control, 2 * inverse * progress)
    .addScaledVector(end, progress * progress);
}

function getInitialCameraDistance(aspectRatio: number) {
  const halfFov = (CAMERA_FOV * Math.PI) / 360;
  const projectedDiameter = aspectRatio * SPHERE_VIEWPORT_WIDTH;
  const depth = RESERVOIR_RADIUS / (projectedDiameter * Math.tan(halfFov));

  return Math.sqrt(RESERVOIR_RADIUS ** 2 + depth ** 2);
}

function getOuterFrame(aspectRatio: number) {
  const halfFov = (CAMERA_FOV * Math.PI) / 360;
  const initialDistance = getInitialCameraDistance(aspectRatio);
  const sphereRadiusInViewport =
    (aspectRatio * SPHERE_VIEWPORT_WIDTH) / 2;
  const sphereCenterY = SPHERE_TOP_Y + sphereRadiusInViewport;
  const verticalDistanceRatio =
    2 * (sphereCenterY - 0.5) * Math.tan(halfFov);
  const cameraDistance =
    initialDistance / Math.sqrt(1 + verticalDistanceRatio ** 2);
  const sphereCenterWorldY = -cameraDistance * verticalDistanceRatio;

  return { cameraDistance, sphereCenterWorldY };
}

function getCameraPath(
  startProgress: number,
  outerPosition: THREE.Vector3,
  outerTarget: THREE.Vector3,
  sphereCenterWorldY: number,
  surfacePoint: THREE.Vector3,
): CameraPath {
  const sphereCenter = new THREE.Vector3(0, sphereCenterWorldY, 0);
  const surfaceNormal = surfacePoint
    .clone()
    .sub(sphereCenter)
    .normalize();
  const innerPosition = surfacePoint
    .clone()
    .addScaledVector(surfaceNormal, INSPECTION_DISTANCE);
  const innerTarget = surfacePoint.clone();
  const controlPosition = outerPosition
    .clone()
    .lerp(innerPosition, ARC_CONTROL_PROGRESS)
    .addScaledVector(surfaceNormal, ARC_CLEARANCE);
  const outerDirection = outerPosition.clone().sub(sphereCenter).normalize();
  const innerDirection = innerPosition.clone().sub(sphereCenter).normalize();
  const samplePosition = new THREE.Vector3();
  let minimumRawClearance = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= PATH_SAFETY_SAMPLE_COUNT; index += 1) {
    const sampleProgress = smoothstep(index / PATH_SAFETY_SAMPLE_COUNT);

    quadraticBezier(
      outerPosition,
      controlPosition,
      innerPosition,
      sampleProgress,
      samplePosition,
    );
    minimumRawClearance = Math.min(
      minimumRawClearance,
      samplePosition.distanceTo(sphereCenter) - RESERVOIR_RADIUS,
    );
  }

  return {
    startProgress,
    sphereCenter,
    outerPosition: outerPosition.clone(),
    controlPosition,
    outerTarget: outerTarget.clone(),
    innerPosition,
    innerTarget,
    outerDirection,
    innerDirection,
    outerCenterDistance: outerPosition.distanceTo(sphereCenter),
    innerCenterDistance: innerPosition.distanceTo(sphereCenter),
    minimumRawClearance,
    requiresClearanceCorrection:
      minimumRawClearance <= MIN_CAMERA_CLEARANCE,
  };
}

function isFiniteVector(vector: THREE.Vector3) {
  return vector
    .toArray()
    .every((component) => Number.isFinite(component));
}

function isValidLocalSurfaceFrame(frame: LocalSurfaceFrame | null) {
  if (!frame) return false;

  return (
    isFiniteVector(frame.normal) &&
    isFiniteVector(frame.tangentUp) &&
    isFiniteVector(frame.tangentRight) &&
    Math.abs(frame.normal.lengthSq() - 1) < 0.0001 &&
    Math.abs(frame.tangentUp.lengthSq() - 1) < 0.0001 &&
    Math.abs(frame.tangentRight.lengthSq() - 1) < 0.0001 &&
    Math.abs(frame.normal.dot(frame.tangentUp)) < 0.0001 &&
    Math.abs(frame.normal.dot(frame.tangentRight)) < 0.0001 &&
    Math.abs(frame.tangentUp.dot(frame.tangentRight)) < 0.0001
  );
}

function getLocalSurfaceFrame(
  normal: THREE.Vector3,
  previousFrame?: LocalSurfaceFrame | null,
): LocalSurfaceFrame | null {
  if (!isFiniteVector(normal) || normal.lengthSq() < FRAME_EPSILON) {
    return null;
  }

  const normalizedSurface = normal.clone().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const upCandidate = worldUp.clone().addScaledVector(
    normalizedSurface,
    -normalizedSurface.y,
  );
  const upCandidateLength = upCandidate.length();
  const previousUpCandidate = previousFrame?.tangentUp
    .clone()
    .addScaledVector(
      normalizedSurface,
      -previousFrame.tangentUp.dot(normalizedSurface),
    );
  let tangentUp: THREE.Vector3;

  if (
    upCandidateLength < FRAME_POLE_THRESHOLD &&
    previousUpCandidate &&
    previousUpCandidate.lengthSq() >= FRAME_EPSILON
  ) {
    tangentUp = previousUpCandidate.normalize();
  } else if (upCandidateLength >= FRAME_EPSILON) {
    tangentUp = upCandidate.normalize();
  } else {
    const fallbackReference = new THREE.Vector3(0, 0, -1);
    tangentUp = fallbackReference.addScaledVector(
      normalizedSurface,
      -fallbackReference.dot(normalizedSurface),
    );

    if (tangentUp.lengthSq() < FRAME_EPSILON) {
      tangentUp
        .set(1, 0, 0)
        .addScaledVector(
          normalizedSurface,
          -normalizedSurface.x,
        );
    }

    if (tangentUp.lengthSq() < FRAME_EPSILON) return null;
    tangentUp.normalize();
  }

  const tangentRight = tangentUp
    .clone()
    .cross(normalizedSurface)
    .normalize();
  if (tangentRight.lengthSq() < FRAME_EPSILON) return null;

  tangentRight.normalize();
  tangentUp.copy(normalizedSurface).cross(tangentRight).normalize();

  if (
    previousFrame &&
    previousUpCandidate &&
    previousUpCandidate.lengthSq() >= FRAME_EPSILON &&
    tangentUp.dot(previousUpCandidate) < 0
  ) {
    tangentUp.negate();
    tangentRight.negate();
  }

  const frame = {
    normal: normalizedSurface,
    tangentUp,
    tangentRight,
  };

  return isValidLocalSurfaceFrame(frame) ? frame : null;
}

function getAtmosphericCameraModel(
  canonicalOuterPosition: THREE.Vector3,
  canonicalOuterTarget: THREE.Vector3,
  sphereCenterWorldY: number,
): AtmosphericCameraModel {
  const sphereCenter = new THREE.Vector3(0, sphereCenterWorldY, 0);
  const viewDirection = canonicalOuterTarget
    .clone()
    .sub(canonicalOuterPosition)
    .normalize();
  const surfacePoint = new THREE.Ray(
    canonicalOuterPosition,
    viewDirection,
  ).intersectSphere(
    new THREE.Sphere(sphereCenter, RESERVOIR_RADIUS),
    new THREE.Vector3(),
  );
  const surfaceNormal = (surfacePoint ?? canonicalOuterPosition)
    .clone()
    .sub(sphereCenter)
    .normalize();
  const frame = getLocalSurfaceFrame(surfaceNormal) ?? {
    normal: new THREE.Vector3(0, 0, 1),
    tangentUp: new THREE.Vector3(0, 1, 0),
    tangentRight: new THREE.Vector3(1, 0, 0),
  };
  const outerDirection = canonicalOuterPosition
    .clone()
    .sub(sphereCenter)
    .normalize();
  const centerDirection = sphereCenter
    .clone()
    .sub(canonicalOuterPosition)
    .normalize();
  const centerScreenUp = new THREE.Vector3(0, 1, 0)
    .addScaledVector(
      centerDirection,
      -centerDirection.y,
    )
    .normalize();

  return {
    sphereCenter,
    canonicalFrame: frame,
    outerCenterDistance: canonicalOuterPosition.distanceTo(sphereCenter),
    outerRadialTilt: Math.atan2(
      outerDirection.dot(frame.tangentUp),
      outerDirection.dot(frame.normal),
    ),
    outerViewTilt: Math.atan2(
      viewDirection.dot(frame.tangentUp),
      viewDirection.dot(frame.normal),
    ),
    outerCenterViewOffset: Math.atan2(
      viewDirection.dot(centerScreenUp),
      viewDirection.dot(centerDirection),
    ),
    outerFocusDistance: canonicalOuterPosition.distanceTo(
      canonicalOuterTarget,
    ),
  };
}

function getRetreatPath(
  startPose: CameraPose,
  frame: LocalSurfaceFrame,
  model: AtmosphericCameraModel,
): RetreatPath {
  const startOffset = startPose.position
    .clone()
    .sub(model.sphereCenter);
  const lateralOffset = startOffset.dot(frame.tangentRight);
  const startNormalDistance = startOffset.dot(frame.normal);
  const startUpDistance = startOffset.dot(frame.tangentUp);
  const startPlaneDistance = Math.hypot(
    startNormalDistance,
    startUpDistance,
  );
  const startRadialTilt = Math.atan2(
    startUpDistance,
    startNormalDistance,
  );
  const outerPlaneDistance = Math.sqrt(
    Math.max(
      model.outerCenterDistance ** 2 - lateralOffset ** 2,
      Number.EPSILON,
    ),
  );
  const outerForward = new THREE.Vector3();
  const outerPosition = model.sphereCenter
    .clone()
    .addScaledVector(frame.tangentRight, lateralOffset)
    .addScaledVector(
      frame.normal,
      Math.cos(model.outerRadialTilt) * outerPlaneDistance,
    )
    .addScaledVector(
      frame.tangentUp,
      Math.sin(model.outerRadialTilt) * outerPlaneDistance,
    );
  const outerCenterDirection = model.sphereCenter
    .clone()
    .sub(outerPosition)
    .normalize();
  const outerScreenUp = new THREE.Vector3(0, 1, 0).addScaledVector(
    outerCenterDirection,
    -outerCenterDirection.y,
  );

  if (outerScreenUp.lengthSq() < FRAME_POLE_THRESHOLD ** 2) {
    outerScreenUp
      .copy(frame.tangentUp)
      .addScaledVector(
        outerCenterDirection,
        -frame.tangentUp.dot(outerCenterDirection),
      );
  }

  if (outerScreenUp.lengthSq() < FRAME_EPSILON) {
    outerScreenUp.set(0, 0, -1).addScaledVector(
      outerCenterDirection,
      outerCenterDirection.z,
    );
  }

  outerScreenUp.normalize();
  outerForward
    .copy(outerCenterDirection)
    .multiplyScalar(Math.cos(model.outerCenterViewOffset))
    .addScaledVector(
      outerScreenUp,
      Math.sin(model.outerCenterViewOffset),
    )
    .normalize();
  const outerTarget = outerPosition
    .clone()
    .addScaledVector(outerForward, model.outerFocusDistance);
  const outerUp = new THREE.Vector3(0, 1, 0).addScaledVector(
    outerForward,
    -outerForward.y,
  );

  if (outerUp.lengthSq() < FRAME_POLE_THRESHOLD ** 2) {
    outerUp
      .copy(frame.tangentUp)
      .addScaledVector(
        outerForward,
        -frame.tangentUp.dot(outerForward),
      );
  }

  if (outerUp.lengthSq() < FRAME_EPSILON) {
    outerUp.set(0, 0, 1).addScaledVector(
      outerForward,
      -outerForward.z,
    );
  }

  outerUp.normalize();
  const outerLookMatrix = new THREE.Matrix4().lookAt(
    outerPosition,
    outerTarget,
    outerUp,
  );
  const outerQuaternion = new THREE.Quaternion()
    .setFromRotationMatrix(outerLookMatrix)
    .normalize();

  return {
    startProgress: Math.max(startPose.progress, Number.EPSILON),
    frame,
    sphereCenter: model.sphereCenter.clone(),
    lateralOffset,
    startPlaneDistance,
    startRadialTilt,
    outerPlaneDistance,
    outerRadialTilt: model.outerRadialTilt,
    startQuaternion: startPose.quaternion.clone().normalize(),
    outerQuaternion,
    startFocusDistance: startPose.position.distanceTo(startPose.target),
    outerFocusDistance: model.outerFocusDistance,
    outerPosition,
    outerTarget,
  };
}

function slerpUnitVectors(
  start: THREE.Vector3,
  end: THREE.Vector3,
  progress: number,
  result: THREE.Vector3,
  axis: THREE.Vector3,
  rotation: THREE.Quaternion,
) {
  const dot = clamp(start.dot(end), -1, 1);

  if (dot > 0.9995) {
    return result.copy(start).lerp(end, progress).normalize();
  }

  axis.copy(start).cross(end);
  if (axis.lengthSq() < FRAME_EPSILON) {
    axis.copy(start).cross(new THREE.Vector3(0, 1, 0));
    if (axis.lengthSq() < FRAME_EPSILON) {
      axis.copy(start).cross(new THREE.Vector3(1, 0, 0));
    }
  }

  axis.normalize();
  rotation.setFromAxisAngle(axis, Math.acos(dot) * progress);
  return result.copy(start).applyQuaternion(rotation).normalize();
}

function enforceCameraClearance(
  position: THREE.Vector3,
  sphereCenter: THREE.Vector3,
  fallbackDirection: THREE.Vector3,
  offset: THREE.Vector3,
) {
  offset.copy(position).sub(sphereCenter);
  const rawDistance = offset.length();
  const minimumCenterDistance =
    RESERVOIR_RADIUS + MIN_CAMERA_CLEARANCE;
  const distanceDelta = rawDistance - minimumCenterDistance;
  const safeDistance =
    minimumCenterDistance +
    0.5 *
      (distanceDelta +
        Math.sqrt(
          distanceDelta ** 2 + CLEARANCE_SMOOTHING ** 2,
        ));

  if (rawDistance < FRAME_EPSILON) {
    offset.copy(fallbackDirection).normalize();
  } else {
    offset.multiplyScalar(1 / rawDistance);
  }

  position.copy(sphereCenter).addScaledVector(offset, safeDistance);
}

type ReservoirCameraProps = {
  inwardPath: CameraPath;
  retreatPath: RetreatPath | null;
  orientationFrame: LocalSurfaceFrame;
  targetProgress: number;
  travelDirection: TravelDirection;
  cameraPoseRef: MutableRefObject<CameraPose | null>;
  diagnosticsRef: MutableRefObject<HTMLDivElement | null>;
};

function ReservoirCamera({
  inwardPath,
  retreatPath,
  orientationFrame,
  targetProgress,
  travelDirection,
  cameraPoseRef,
  diagnosticsRef,
}: ReservoirCameraProps) {
  const currentProgress = useRef(targetProgress);
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const stableUp = useMemo(() => new THREE.Vector3(), []);
  const frameRight = useMemo(() => new THREE.Vector3(), []);
  const frameUp = useMemo(() => new THREE.Vector3(), []);
  const worldUpCandidate = useMemo(() => new THREE.Vector3(), []);
  const clearanceOffset = useMemo(() => new THREE.Vector3(), []);
  const pathDirection = useMemo(() => new THREE.Vector3(), []);
  const slerpAxis = useMemo(() => new THREE.Vector3(), []);
  const slerpRotation = useMemo(() => new THREE.Quaternion(), []);
  const candidateQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame(({ camera }, delta) => {
    const damping = 1 - Math.exp(-CAMERA_DAMPING * delta);
    currentProgress.current = THREE.MathUtils.lerp(
      currentProgress.current,
      targetProgress,
      damping,
    );

    const atInnerEndpoint =
      targetProgress === 1 &&
      currentProgress.current >= 1 - ENDPOINT_SNAP_THRESHOLD;
    const atOuterEndpoint =
      targetProgress === 0 &&
      currentProgress.current <= ENDPOINT_SNAP_THRESHOLD;

    if (
      atInnerEndpoint ||
      atOuterEndpoint ||
      Math.abs(currentProgress.current - targetProgress) < 0.0001
    ) {
      currentProgress.current = targetProgress;
    }

    let orientationFromRetreat = false;

    if (travelDirection === "outward" && retreatPath) {
      const retreatProgress = smoothstep(
        1 -
          clamp(
            currentProgress.current / retreatPath.startProgress,
            0,
            1,
          ),
      );
      const planeDistance = THREE.MathUtils.lerp(
        retreatPath.startPlaneDistance,
        retreatPath.outerPlaneDistance,
        retreatProgress,
      );
      const radialTilt = THREE.MathUtils.lerp(
        retreatPath.startRadialTilt,
        retreatPath.outerRadialTilt,
        retreatProgress,
      );
      const focusDistance = THREE.MathUtils.lerp(
        retreatPath.startFocusDistance,
        retreatPath.outerFocusDistance,
        retreatProgress,
      );

      position
        .copy(retreatPath.sphereCenter)
        .addScaledVector(
          retreatPath.frame.tangentRight,
          retreatPath.lateralOffset,
        )
        .addScaledVector(
          retreatPath.frame.normal,
          Math.cos(radialTilt) * planeDistance,
        )
        .addScaledVector(
          retreatPath.frame.tangentUp,
          Math.sin(radialTilt) * planeDistance,
        );
      candidateQuaternion
        .copy(retreatPath.startQuaternion)
        .slerp(retreatPath.outerQuaternion, retreatProgress)
        .normalize();
      forward
        .set(0, 0, -1)
        .applyQuaternion(candidateQuaternion)
        .normalize();
      target.copy(position).addScaledVector(forward, focusDistance);
      orientationFromRetreat = true;
    } else {
      const inwardProgress = clamp(
        (currentProgress.current - inwardPath.startProgress) /
          Math.max(1 - inwardPath.startProgress, Number.EPSILON),
        0,
        1,
      );
      const positionProgress = smoothstep(inwardProgress);
      const lookProgress = easeOutQuadratic(inwardProgress);

      if (inwardPath.requiresClearanceCorrection) {
        slerpUnitVectors(
          inwardPath.outerDirection,
          inwardPath.innerDirection,
          positionProgress,
          pathDirection,
          slerpAxis,
          slerpRotation,
        );
        position
          .copy(inwardPath.sphereCenter)
          .addScaledVector(
            pathDirection,
            THREE.MathUtils.lerp(
              inwardPath.outerCenterDistance,
              inwardPath.innerCenterDistance,
              positionProgress,
            ),
          );
      } else {
        quadraticBezier(
          inwardPath.outerPosition,
          inwardPath.controlPosition,
          inwardPath.innerPosition,
          positionProgress,
          position,
        );
      }
      target
        .copy(inwardPath.outerTarget)
        .lerp(inwardPath.innerTarget, lookProgress);
    }

    const sphereCenter =
      retreatPath?.sphereCenter ?? inwardPath.sphereCenter;
    enforceCameraClearance(
      position,
      sphereCenter,
      retreatPath?.frame.normal ?? inwardPath.innerDirection,
      clearanceOffset,
    );
    direction.copy(target).sub(position);

    const hasValidPose =
      isFiniteVector(position) &&
      isFiniteVector(target) &&
      position.distanceTo(sphereCenter) - RESERVOIR_RADIUS >
        MIN_CAMERA_CLEARANCE &&
      direction.lengthSq() >= FRAME_EPSILON;

    if (!hasValidPose) {
      position.copy(inwardPath.outerPosition);
      target.copy(inwardPath.outerTarget);
      enforceCameraClearance(
        position,
        inwardPath.sphereCenter,
        inwardPath.outerDirection,
        clearanceOffset,
      );
      direction.copy(target).sub(position);
      orientationFromRetreat = false;
    }

    direction.normalize();
    if (!orientationFromRetreat) {
      frameRight
        .copy(orientationFrame.tangentRight)
        .addScaledVector(
          direction,
          -orientationFrame.tangentRight.dot(direction),
        );

      if (frameRight.lengthSq() < FRAME_EPSILON) {
        frameRight.set(1, 0, 0).addScaledVector(direction, -direction.x);
      }

      if (frameRight.lengthSq() < FRAME_EPSILON) {
        frameRight.set(0, 0, 1).addScaledVector(direction, -direction.z);
      }

      frameRight.normalize();
      frameUp.copy(direction).negate().cross(frameRight).normalize();
      worldUpCandidate
        .set(0, 1, 0)
        .addScaledVector(direction, -direction.y);

      if (worldUpCandidate.lengthSq() >= FRAME_POLE_THRESHOLD ** 2) {
        worldUpCandidate.normalize();
        if (frameUp.dot(worldUpCandidate) < 0) {
          frameRight.negate();
          frameUp.negate();
        }

        const worldUpWeight = smoothstep(
          clamp(
            (Math.sqrt(Math.max(0, 1 - direction.y ** 2)) -
              FRAME_POLE_THRESHOLD) /
              FRAME_POLE_THRESHOLD,
            0,
            1,
          ),
        );
        stableUp
          .copy(frameUp)
          .lerp(worldUpCandidate, worldUpWeight)
          .normalize();
      } else {
        stableUp.copy(frameUp);
      }

      lookMatrix.lookAt(position, target, stableUp);
      candidateQuaternion.setFromRotationMatrix(lookMatrix).normalize();
    }
    const hasValidOrientation =
      candidateQuaternion
        .toArray()
        .every((component) => Number.isFinite(component)) &&
      Math.abs(candidateQuaternion.lengthSq() - 1) < 0.0001;

    if (hasValidOrientation) {
      camera.position.copy(position);
      camera.quaternion.copy(candidateQuaternion);
      camera.updateMatrixWorld();
    }

    if (!cameraPoseRef.current) {
      cameraPoseRef.current = {
        position: new THREE.Vector3(),
        target: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        progress: currentProgress.current,
      };
    }

    if (hasValidOrientation) {
      cameraPoseRef.current.position.copy(position);
      cameraPoseRef.current.target.copy(target);
      cameraPoseRef.current.quaternion.copy(candidateQuaternion);
      cameraPoseRef.current.progress = currentProgress.current;
    }

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.currentCameraPosition = camera.position
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",");
      diagnosticsRef.current.dataset.currentCameraTarget = target
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",");
      diagnosticsRef.current.dataset.currentCameraQuaternion = camera.quaternion
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",");
      diagnosticsRef.current.dataset.currentCameraClearance = (
        camera.position.distanceTo(sphereCenter) - RESERVOIR_RADIUS
      ).toFixed(6);
      diagnosticsRef.current.dataset.renderedCameraProgress =
        currentProgress.current.toFixed(6);
      diagnosticsRef.current.dataset.currentDragSensitivity =
        getDragSensitivity(currentProgress.current).toFixed(7);
      diagnosticsRef.current.dataset.cameraFrameValid = String(
        hasValidPose && hasValidOrientation,
      );
    }
  });

  return null;
}

export function ReservoirScene() {
  const [rotationDiagnostics, setRotationDiagnostics] =
    useState<RotationDiagnostics>({
      euler: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
    });
  const [cameraProgress, setCameraProgress] = useState(0);
  const [travelDirection, setTravelDirection] =
    useState<TravelDirection>("inward");
  const [diveOrigin, setDiveOrigin] = useState<CameraPose | null>(null);
  const [retreatOrigin, setRetreatOrigin] = useState<CameraPose | null>(null);
  const [inspectionFrame, setInspectionFrame] =
    useState<LocalSurfaceFrame | null>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 10);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPressActive, setSelectedPressActive] = useState(false);
  const [diveTarget, setDiveTarget] = useState<DiveTarget>({
    point: null,
    source: "default",
  });
  const [isDiveTargetLocked, setIsDiveTargetLocked] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const [hoveredArtifactId, setHoveredArtifactId] = useState<string | null>(
    null,
  );
  const [transitionState, setTransitionState] =
    useState<ReservoirTransitionState>("idle");
  const [openingArtifactId, setOpeningArtifactId] = useState<string | null>(
    null,
  );
  const [preservedReservoirState, setPreservedReservoirState] =
    useState<PreservedReservoirState | null>(null);
  const [preparedArtifactContent, setPreparedArtifactContent] =
    useState<PreparedArtifactContent | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [atmosphereBottom, setAtmosphereBottom] = useState(0);
  const interaction = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLElement | null>(null);
  const drag = useRef<DragState | null>(null);
  const sphereRotationRef = useRef<THREE.Group | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const gridInspectionRef = useRef<ReservoirGridInspection>({
    active: false,
    revision: 0,
    worldPoint: new THREE.Vector3(),
  });
  const interactionRevisionRef = useRef(0);
  const openingElapsedRef = useRef(0);
  const openingCameraRetreatStartedRef = useRef(false);
  const restorationElapsedRef = useRef(0);
  const restorationProgressRef = useRef(0);
  const cameraProgressRef = useRef(0);
  const travelDirectionRef = useRef<TravelDirection>("inward");
  const cameraPoseRef = useRef<CameraPose | null>(null);
  const lastInspectionFrameRef = useRef<LocalSurfaceFrame | null>(null);
  const diveTargetLockedRef = useRef(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const surfaceRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerNdc = useMemo(() => new THREE.Vector2(), []);
  const cameraWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const cameraUp = useMemo(() => new THREE.Vector3(), []);
  const horizontalDragQuaternion = useMemo(
    () => new THREE.Quaternion(),
    [],
  );
  const verticalDragQuaternion = useMemo(
    () => new THREE.Quaternion(),
    [],
  );
  const dragDeltaQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    const element = interaction.current;
    if (!element) return;

    element.dataset.renderedRotation = "0.000,0.000";
    element.dataset.renderedQuaternion = "0.000000,0.000000,0.000000,1.000000";

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspectRatio(width / height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const atmosphere = atmosphereRef.current;
    if (!atmosphere) return;
    const measuredAtmosphere = atmosphere;

    function updateAtmosphereBottom() {
      const nextBottom =
        measuredAtmosphere.offsetTop +
        measuredAtmosphere.offsetHeight +
        ARTIFACT_WINDOW_ATMOSPHERE_GAP;
      setAtmosphereBottom((currentBottom) =>
        Math.abs(currentBottom - nextBottom) < 0.5
          ? currentBottom
          : nextBottom,
      );
    }

    updateAtmosphereBottom();
    const observer = new ResizeObserver(updateAtmosphereBottom);
    observer.observe(measuredAtmosphere);
    window.addEventListener("resize", updateAtmosphereBottom);
    measuredAtmosphere.addEventListener(
      "animationend",
      updateAtmosphereBottom,
    );

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateAtmosphereBottom);
      measuredAtmosphere.removeEventListener(
        "animationend",
        updateAtmosphereBottom,
      );
    };
  }, [selectedArtifactId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  const { cameraDistance, sphereCenterWorldY } = getOuterFrame(aspectRatio);
  const canonicalOuterPosition = useMemo(
    () => new THREE.Vector3(0, 0, cameraDistance),
    [cameraDistance],
  );
  const canonicalOuterTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const atmosphericCameraModel = useMemo(
    () =>
      getAtmosphericCameraModel(
        canonicalOuterPosition,
        canonicalOuterTarget,
        sphereCenterWorldY,
      ),
    [canonicalOuterPosition, canonicalOuterTarget, sphereCenterWorldY],
  );
  const canonicalSurfacePoint = useMemo(
    () =>
      new THREE.Vector3(
        0,
        sphereCenterWorldY + RESERVOIR_RADIUS,
        0,
      ),
    [sphereCenterWorldY],
  );
  const selectedSurfacePoint = useMemo(
    () =>
      diveTarget.point
        ? new THREE.Vector3(...diveTarget.point)
        : canonicalSurfacePoint.clone(),
    [canonicalSurfacePoint, diveTarget.point],
  );
  const inwardCameraPath = useMemo(
    () =>
      getCameraPath(
        diveOrigin?.progress ?? 0,
        diveOrigin?.position ?? canonicalOuterPosition,
        diveOrigin?.target ?? canonicalOuterTarget,
        sphereCenterWorldY,
        selectedSurfacePoint,
      ),
    [
      canonicalOuterPosition,
      canonicalOuterTarget,
      diveOrigin,
      selectedSurfacePoint,
      sphereCenterWorldY,
    ],
  );
  const retreatCameraPath = useMemo(
    () =>
      retreatOrigin && inspectionFrame
        ? getRetreatPath(
            retreatOrigin,
            inspectionFrame,
            atmosphericCameraModel,
          )
        : null,
    [
      atmosphericCameraModel,
      inspectionFrame,
      retreatOrigin,
    ],
  );
  const activeOuterPosition =
    retreatCameraPath?.outerPosition ?? canonicalOuterPosition;
  const activeOuterTarget =
    retreatCameraPath?.outerTarget ?? canonicalOuterTarget;
  const selectedArtifact =
    activeReservoirArtifacts.find(
      (artifact) => artifact.id === selectedArtifactId,
    ) ?? null;
  const openingArtifact =
    activeReservoirArtifacts.find(
      (artifact) => artifact.id === openingArtifactId,
    ) ?? null;
  const openingReactionDistances = useMemo(() => {
    const distances = new Map<string, number>();
    if (!openingArtifact) return distances;

    for (const artifact of activeReservoirArtifacts) {
      distances.set(
        artifact.id,
        getReservoirPlacementGraphDistance(
          openingArtifact.vertexId,
          artifact.vertexId,
        ) ?? 0,
      );
    }
    return distances;
  }, [openingArtifact]);
  const maximumOpeningReactionDistance = Math.max(
    0,
    ...openingReactionDistances.values(),
  );
  const openingActive = [
    "openingArtifact",
    "deployingArtifact",
    "readingArtifact",
    "closingArtifact",
  ].includes(transitionState);
  const restoring = transitionState === "restoringArtifact";
  const artifactWindowPhase =
    transitionState === "deployingArtifact"
      ? "deploying"
      : transitionState === "readingArtifact"
        ? "reading"
        : transitionState === "closingArtifact"
          ? "closing"
          : null;

  useEffect(() => {
    if (
      transitionState !== "openingArtifact" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const duration = getOpeningDuration(reducedMotion);
    const cameraDelay = getOpeningCameraDelay(reducedMotion);
    const startTime = performance.now();
    let animationFrameId = 0;

    function updateOpeningTimeline(now: number) {
      const elapsed = Math.min((now - startTime) / 1000, duration);
      openingElapsedRef.current = elapsed;

      if (interaction.current) {
        interaction.current.dataset.openingElapsed = elapsed.toFixed(6);
        interaction.current.dataset.openingProgress = (
          elapsed / duration
        ).toFixed(6);
      }

      if (
        elapsed >= cameraDelay &&
        !openingCameraRetreatStartedRef.current
      ) {
        openingCameraRetreatStartedRef.current = true;
        if (snapshot.cameraProgress > 0) {
          setRetreatOrigin({
            position: new THREE.Vector3(...snapshot.cameraPosition),
            target: new THREE.Vector3(...snapshot.cameraTarget),
            quaternion: new THREE.Quaternion(...snapshot.cameraQuaternion),
            progress: snapshot.cameraProgress,
          });
        }
        travelDirectionRef.current = "outward";
        setTravelDirection("outward");
        cameraProgressRef.current = 0;
        setCameraProgress(0);
      }

      if (elapsed >= duration) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        setTransitionState("deployingArtifact");
        return;
      }

      animationFrameId = requestAnimationFrame(updateOpeningTimeline);
    }

    animationFrameId = requestAnimationFrame(updateOpeningTimeline);
    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, reducedMotion, transitionState]);

  useLayoutEffect(() => {
    const readingMode = [
      "deployingArtifact",
      "readingArtifact",
      "closingArtifact",
    ].includes(transitionState);
    const scrollEnabled = transitionState === "readingArtifact";
    const deploying = transitionState === "deployingArtifact";
    const scrollRoots = [document.documentElement, document.body];

    for (const root of scrollRoots) {
      root.classList.toggle("artifact-reading-mode", readingMode);
      root.classList.toggle("artifact-scroll-enabled", scrollEnabled);
      root.classList.toggle("artifact-deploying-mode", deploying);
    }

    return () => {
      for (const root of scrollRoots) {
        root.classList.remove("artifact-reading-mode");
        root.classList.remove("artifact-scroll-enabled");
        root.classList.remove("artifact-deploying-mode");
      }
    };
  }, [transitionState]);

  const completeArtifactDeployment = useCallback(() => {
    setTransitionState((currentState) =>
      currentState === "deployingArtifact"
        ? "readingArtifact"
        : currentState,
    );
  }, []);

  const requestArtifactClose = useCallback(() => {
    setTransitionState((currentState) =>
      currentState === "readingArtifact"
        ? "closingArtifact"
        : currentState,
    );
  }, []);

  useEffect(() => {
    if (
      transitionState !== "closingArtifact" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const timeoutId = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      restorationElapsedRef.current = 0;
      restorationProgressRef.current = 0;

      const restoredInspectionFrame = restoreLocalSurfaceFrame(
        snapshot.inspectionFrame,
      );
      const restoredLastInspectionFrame = restoreLocalSurfaceFrame(
        snapshot.lastInspectionFrame,
      );
      const savedCameraPose: CameraPose = {
        position: new THREE.Vector3(...snapshot.cameraPosition),
        target: new THREE.Vector3(...snapshot.cameraTarget),
        quaternion: new THREE.Quaternion(...snapshot.cameraQuaternion),
        progress: snapshot.cameraProgress,
      };

      setInspectionFrame(restoredInspectionFrame);
      lastInspectionFrameRef.current = restoredLastInspectionFrame;
      setDiveTarget({
        point: snapshot.diveTarget.point
          ? [...snapshot.diveTarget.point]
          : null,
        source: snapshot.diveTarget.source,
      });
      diveTargetLockedRef.current = snapshot.diveTargetLocked;
      setIsDiveTargetLocked(snapshot.diveTargetLocked);
      setDiveOrigin(restoreCameraPose(snapshot.diveOrigin));
      setRetreatOrigin(savedCameraPose);
      travelDirectionRef.current = "outward";
      setTravelDirection("outward");
      cameraProgressRef.current = snapshot.cameraProgress;
      setCameraProgress(snapshot.cameraProgress);

      if (sphereRotationRef.current) {
        sphereRotationRef.current.quaternion
          .set(...snapshot.sphereQuaternion)
          .normalize();
      }

      setTransitionState("restoringArtifact");
    }, getArtifactWindowRetractDuration(reducedMotion) * 1000);

    return () => window.clearTimeout(timeoutId);
  }, [preservedReservoirState, reducedMotion, transitionState]);

  useEffect(() => {
    if (
      transitionState !== "restoringArtifact" ||
      !preservedReservoirState
    ) {
      return;
    }

    const snapshot = preservedReservoirState;
    const duration = getReservoirRestoreDuration(reducedMotion);
    const startTime = performance.now();
    const expectedPosition = new THREE.Vector3(...snapshot.cameraPosition);
    const expectedTarget = new THREE.Vector3(...snapshot.cameraTarget);
    const expectedQuaternion = new THREE.Quaternion(
      ...snapshot.cameraQuaternion,
    );
    const expectedSphereQuaternion = new THREE.Quaternion(
      ...snapshot.sphereQuaternion,
    );
    let animationFrameId = 0;

    function updateRestoration(now: number) {
      const elapsed = (now - startTime) / 1000;
      restorationElapsedRef.current = Math.min(elapsed, duration);
      restorationProgressRef.current = getReservoirRestoreProgress(
        elapsed,
        reducedMotion,
      );

      const renderedPose = cameraPoseRef.current;
      const renderedSphere = sphereRotationRef.current;
      const positionError = renderedPose
        ? renderedPose.position.distanceTo(expectedPosition)
        : Number.POSITIVE_INFINITY;
      const targetError = renderedPose
        ? renderedPose.target.distanceTo(expectedTarget)
        : Number.POSITIVE_INFINITY;
      const quaternionError = renderedPose
        ? renderedPose.quaternion.angleTo(expectedQuaternion)
        : Number.POSITIVE_INFINITY;
      const progressError = renderedPose
        ? Math.abs(renderedPose.progress - snapshot.cameraProgress)
        : Number.POSITIVE_INFINITY;
      const sphereQuaternionError = renderedSphere
        ? renderedSphere.quaternion.angleTo(expectedSphereQuaternion)
        : Number.POSITIVE_INFINITY;
      const endpointReached =
        positionError < 0.00001 &&
        targetError < 0.00001 &&
        quaternionError < 0.00001 &&
        progressError < 0.00001 &&
        sphereQuaternionError < 0.00001;

      if (interaction.current) {
        interaction.current.dataset.restorationProgress =
          restorationProgressRef.current.toFixed(6);
        interaction.current.dataset.restorationPositionError =
          positionError.toFixed(9);
        interaction.current.dataset.restorationTargetError =
          targetError.toFixed(9);
        interaction.current.dataset.restorationQuaternionError =
          quaternionError.toFixed(9);
        interaction.current.dataset.restorationCameraProgressError =
          progressError.toFixed(9);
        interaction.current.dataset.restorationSphereQuaternionError =
          sphereQuaternionError.toFixed(9);
      }

      if (elapsed >= duration && (endpointReached || elapsed >= duration + 1)) {
        restorationProgressRef.current = 1;
        if (renderedSphere) {
          renderedSphere.quaternion.copy(expectedSphereQuaternion);
        }

        setDiveOrigin(restoreCameraPose(snapshot.diveOrigin));
        setRetreatOrigin(restoreCameraPose(snapshot.retreatOrigin));
        travelDirectionRef.current = snapshot.travelDirection;
        setTravelDirection(snapshot.travelDirection);
        cameraProgressRef.current = snapshot.cameraTargetProgress;
        setCameraProgress(snapshot.cameraTargetProgress);
        setOpeningArtifactId(null);
        setPreparedArtifactContent(null);
        setTransitionState("idle");
        return;
      }

      animationFrameId = requestAnimationFrame(updateRestoration);
    }

    animationFrameId = requestAnimationFrame(updateRestoration);
    return () => cancelAnimationFrame(animationFrameId);
  }, [preservedReservoirState, reducedMotion, transitionState]);

  function getSurfaceIntersection(clientX: number, clientY: number) {
    const element = interaction.current;
    const activeCamera = cameraRef.current;
    const surface = surfaceRef.current;

    if (!element || !activeCamera || !surface) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    pointerNdc.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );

    activeCamera.updateMatrixWorld();
    surface.updateWorldMatrix(true, false);
    raycaster.setFromCamera(pointerNdc, activeCamera);

    return raycaster.intersectObject(surface, false)[0]?.point ?? null;
  }

  function updateGridInspection(clientX: number, clientY: number) {
    const intersection = getSurfaceIntersection(clientX, clientY);
    const inspection = gridInspectionRef.current;

    inspection.active = Boolean(intersection);
    if (intersection) inspection.worldPoint.copy(intersection);
    inspection.revision += 1;

    if (interaction.current) {
      interaction.current.dataset.gridInspectionActive = String(
        inspection.active,
      );
      interaction.current.dataset.gridInspectionPoint = intersection
        ? intersection
            .toArray()
            .map((value) => value.toFixed(6))
            .join(",")
        : "";
    }
  }

  function clearGridInspection() {
    const inspection = gridInspectionRef.current;
    if (inspection.active) {
      inspection.active = false;
      inspection.revision += 1;
    }
    if (interaction.current) {
      interaction.current.dataset.gridInspectionActive = "false";
      interaction.current.dataset.gridInspectionPoint = "";
    }
  }

  function captureDiveSurfacePoint() {
    const pointerPosition = pointer.current;
    if (!pointerPosition) return null;

    return getSurfaceIntersection(
      pointerPosition.x,
      pointerPosition.y,
    )?.clone() ?? null;
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (
      transitionState !== "idle" ||
      !event.isPrimary ||
      event.button !== 0
    ) {
      return;
    }

    const renderedQuaternion = sphereRotationRef.current?.quaternion;
    if (renderedQuaternion) {
      setRotationDiagnostics(getRotationDiagnostics(renderedQuaternion));
    }

    pointer.current = { x: event.clientX, y: event.clientY };
    setSelectedPressActive(
      Boolean(
        selectedArtifactId &&
          pickArtifact(event.clientX, event.clientY) === selectedArtifactId,
      ),
    );
    interactionRevisionRef.current += 1;
    clearGridInspection();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      maxTravelSquared: 0,
      hoverCancelled: false,
    };
    setIsDragging(true);
  }

  function updatePointer(event: PointerEvent<HTMLDivElement>) {
    pointer.current = { x: event.clientX, y: event.clientY };
    if (transitionState !== "idle") {
      clearGridInspection();
      return;
    }
    interactionRevisionRef.current += 1;

    const origin = drag.current;
    const rotationGroup = sphereRotationRef.current;
    const activeCamera = cameraRef.current;
    if (!origin) {
      updateGridInspection(event.clientX, event.clientY);
    } else {
      clearGridInspection();
    }
    if (
      !origin ||
      origin.pointerId !== event.pointerId ||
      !rotationGroup ||
      !activeCamera
    ) {
      return;
    }

    const pointerDeltaX = event.clientX - origin.x;
    const pointerDeltaY = event.clientY - origin.y;
    const totalTravelX = event.clientX - origin.startX;
    const totalTravelY = event.clientY - origin.startY;
    origin.maxTravelSquared = Math.max(
      origin.maxTravelSquared,
      totalTravelX ** 2 + totalTravelY ** 2,
    );
    if (
      !origin.hoverCancelled &&
      origin.maxTravelSquared > NODE_CLICK_MAX_TRAVEL ** 2
    ) {
      origin.hoverCancelled = true;
      setHoveredArtifactId(null);
      setSelectedPressActive(false);
    }
    const renderedCameraProgress =
      cameraPoseRef.current?.progress ?? cameraProgressRef.current;
    const dragSensitivity = getDragSensitivity(renderedCameraProgress);

    activeCamera.updateMatrixWorld();
    activeCamera.getWorldQuaternion(cameraWorldQuaternion);
    cameraRight
      .set(1, 0, 0)
      .applyQuaternion(cameraWorldQuaternion)
      .normalize();
    cameraUp
      .set(0, 1, 0)
      .applyQuaternion(cameraWorldQuaternion)
      .normalize();
    horizontalDragQuaternion.setFromAxisAngle(
      cameraUp,
      pointerDeltaX * dragSensitivity,
    );
    verticalDragQuaternion.setFromAxisAngle(
      cameraRight,
      pointerDeltaY * dragSensitivity,
    );
    dragDeltaQuaternion
      .copy(horizontalDragQuaternion)
      .multiply(verticalDragQuaternion);

    origin.x = event.clientX;
    origin.y = event.clientY;
    rotationGroup.quaternion.premultiply(dragDeltaQuaternion).normalize();
    const diagnostics = getRotationDiagnostics(rotationGroup.quaternion);
    setRotationDiagnostics(diagnostics);

    if (interaction.current) {
      interaction.current.dataset.renderedRotation =
        `${diagnostics.euler[0].toFixed(3)},${diagnostics.euler[1].toFixed(3)}`;
      interaction.current.dataset.renderedQuaternion = diagnostics.quaternion
        .map((value) => value.toFixed(6))
        .join(",");
      interaction.current.dataset.lastDragSensitivity =
        dragSensitivity.toFixed(7);
    }
  }

  function pickArtifact(clientX: number, clientY: number) {
    const element = interaction.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const surface = surfaceRef.current;
    if (!element || !camera || !scene || !surface) return null;

    const bounds = element.getBoundingClientRect();
    pointerNdc.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointerNdc, camera);

    const surfaceDistance =
      raycaster.intersectObject(surface, false)[0]?.distance ??
      Number.POSITIVE_INFINITY;
    const artifactHit = raycaster
      .intersectObjects(scene.children, true)
      .find(
        (hit) =>
          typeof hit.object.userData.artifactId === "string" &&
          hit.distance <= surfaceDistance + RESERVOIR_NODE_RADIUS,
      );

    return (
      (artifactHit?.object.userData.artifactId as string | undefined) ?? null
    );
  }

  function capturePreservedReservoirState(
    artifactId: string,
  ): PreservedReservoirState | null {
    const sphere = sphereRotationRef.current;
    const activeCamera = cameraRef.current;
    if (!sphere || !activeCamera) return null;

    const renderedPose = cameraPoseRef.current;
    const cameraPosition =
      renderedPose?.position ?? activeCamera.position;
    const cameraTarget =
      renderedPose?.target ?? canonicalOuterTarget;
    const cameraQuaternion =
      renderedPose?.quaternion ?? activeCamera.quaternion;

    return {
      artifactId,
      sphereQuaternion: toQuaternionTuple(sphere.quaternion),
      cameraPosition: toVectorTuple(cameraPosition),
      cameraTarget: toVectorTuple(cameraTarget),
      cameraQuaternion: toQuaternionTuple(cameraQuaternion),
      cameraProgress:
        renderedPose?.progress ?? cameraProgressRef.current,
      cameraTargetProgress: cameraProgressRef.current,
      travelDirection: travelDirectionRef.current,
      diveTarget: {
        point: diveTarget.point ? [...diveTarget.point] : null,
        source: diveTarget.source,
      },
      diveTargetLocked: diveTargetLockedRef.current,
      inspectionFrame: preserveLocalSurfaceFrame(inspectionFrame),
      lastInspectionFrame: preserveLocalSurfaceFrame(
        lastInspectionFrameRef.current,
      ),
      diveOrigin: preserveCameraPose(diveOrigin),
      retreatOrigin: preserveCameraPose(retreatOrigin),
    };
  }

  function beginArtifactOpening(artifactId: string) {
    if (transitionState !== "idle") return;

    const artifact = activeReservoirArtifacts.find(
      (candidate) => candidate.id === artifactId,
    );
    const preservedState = capturePreservedReservoirState(artifactId);
    if (!artifact || !preservedState) return;

    openingElapsedRef.current = 0;
    openingCameraRetreatStartedRef.current = false;
    setOpeningArtifactId(artifactId);
    setPreservedReservoirState(preservedState);
    setPreparedArtifactContent(prepareReservoirArtifactContent(artifact));
    setHoveredArtifactId(null);
    setSelectedPressActive(false);
    clearGridInspection();
    setTransitionState("openingArtifact");
  }

  function endDrag(
    event: PointerEvent<HTMLDivElement>,
    allowSelection = true,
  ) {
    if (drag.current?.pointerId !== event.pointerId) return;

    const completedDrag = drag.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setIsDragging(false);
    setSelectedPressActive(false);
    interactionRevisionRef.current += 1;
    updateGridInspection(event.clientX, event.clientY);

    if (
      allowSelection &&
      completedDrag.maxTravelSquared <= NODE_CLICK_MAX_TRAVEL ** 2
    ) {
      const pickedArtifactId = pickArtifact(event.clientX, event.clientY);

      if (pickedArtifactId && pickedArtifactId === selectedArtifactId) {
        beginArtifactOpening(pickedArtifactId);
      } else {
        setTransitionState("idle");
        setSelectedArtifactId(pickedArtifactId);
      }
    }
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;

    drag.current = null;
    setIsDragging(false);
    setSelectedPressActive(false);
    clearGridInspection();
  }

  function clearPointer() {
    if (!drag.current) pointer.current = null;
    interactionRevisionRef.current += 1;
    clearGridInspection();
  }

  function updateCameraTravel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (transitionState !== "idle") return;
    pointer.current = { x: event.clientX, y: event.clientY };
    interactionRevisionRef.current += 1;
    clearGridInspection();
    const deltaScale =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? event.currentTarget.clientHeight
          : 1;
    const normalizedDelta = clamp(
      event.deltaY * deltaScale,
      -MAX_WHEEL_DELTA,
      MAX_WHEEL_DELTA,
    );
    const nextProgress = clamp(
      cameraProgressRef.current + normalizedDelta * CAMERA_WHEEL_RATE,
      0,
      1,
    );
    const wasTravelingOutward = travelDirectionRef.current === "outward";

    if (normalizedDelta > 0) {
      if (travelDirectionRef.current !== "inward") {
        travelDirectionRef.current = "inward";
        setTravelDirection("inward");
      }

      if (!diveTargetLockedRef.current) {
        const surfacePoint = captureDiveSurfacePoint();
        const proposedInspectionPoint =
          surfacePoint ?? canonicalSurfacePoint.clone();
        const previousFrame =
          lastInspectionFrameRef.current ??
          atmosphericCameraModel.canonicalFrame;
        const proposedSurfaceNormal = proposedInspectionPoint
          .clone()
          .sub(atmosphericCameraModel.sphereCenter);
        const proposedFrame = getLocalSurfaceFrame(
          proposedSurfaceNormal,
          previousFrame,
        );
        const hasValidProposedFrame =
          Boolean(surfacePoint) && isValidLocalSurfaceFrame(proposedFrame);
        const inspectionPoint = hasValidProposedFrame
          ? proposedInspectionPoint
          : canonicalSurfacePoint.clone();
        const surfaceNormal = inspectionPoint
          .clone()
          .sub(atmosphericCameraModel.sphereCenter)
          .normalize();
        const committedFrame = hasValidProposedFrame
          ? proposedFrame
          : (getLocalSurfaceFrame(surfaceNormal, previousFrame) ??
            atmosphericCameraModel.canonicalFrame);
        const currentPose = cameraPoseRef.current;

        diveTargetLockedRef.current = true;
        setIsDiveTargetLocked(true);
        setInspectionFrame(committedFrame);
        if (hasValidProposedFrame && committedFrame) {
          lastInspectionFrameRef.current = committedFrame;
        }
        setRetreatOrigin(null);
        if (currentPose) {
          setDiveOrigin(cloneCameraPose(currentPose));
        }
        setDiveTarget({
          point: hasValidProposedFrame ? inspectionPoint.toArray() : null,
          source: hasValidProposedFrame ? "pointer" : "default",
        });
      } else if (wasTravelingOutward && cameraPoseRef.current) {
        const currentPose = cameraPoseRef.current;
        setDiveOrigin(cloneCameraPose(currentPose));
      }
    }

    if (normalizedDelta < 0 && cameraProgressRef.current > 0) {
      if (travelDirectionRef.current !== "outward") {
        const currentPose = cameraPoseRef.current;

        if (currentPose) {
          setRetreatOrigin(cloneCameraPose(currentPose));
        }
        travelDirectionRef.current = "outward";
        setTravelDirection("outward");
      }
    }

    if (
      normalizedDelta < 0 &&
      nextProgress <= DIVE_TARGET_UNLOCK_PROGRESS
    ) {
      diveTargetLockedRef.current = false;
      setIsDiveTargetLocked(false);
      setDiveTarget({ point: null, source: "default" });
    }

    cameraProgressRef.current = nextProgress;
    setCameraProgress(nextProgress);
  }

  function updateArtifactHover(artifactId: string, hovered: boolean) {
    if (transitionState !== "idle") return;
    setHoveredArtifactId((currentArtifactId) => {
      if (hovered) return artifactId;
      return currentArtifactId === artifactId ? null : currentArtifactId;
    });
  }

  return (
    <>
      <AtmosphereContent
        containerRef={atmosphereRef}
        selectedArtifact={selectedArtifact}
      />
      <div
      ref={interaction}
      className="reservoir-interaction"
      aria-hidden={artifactWindowPhase !== null}
      data-dragging={isDragging}
      data-aspect-ratio={aspectRatio.toFixed(3)}
      data-camera-progress={cameraProgress.toFixed(3)}
      data-camera-direction={travelDirection}
      data-dive-target={selectedSurfacePoint
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-dive-target-locked={isDiveTargetLocked}
      data-dive-target-source={diveTarget.source}
      data-grid-detail={RESERVOIR_GRID_DETAIL}
      data-min-artifact-vertex-steps={RESERVOIR_MIN_ARTIFACT_VERTEX_STEPS}
      data-node-radius={RESERVOIR_NODE_RADIUS}
      data-density-test-mode={reservoirDensityTestDiagnostics.enabled}
      data-artifact-count={reservoirDensityTestDiagnostics.artifactCount}
      data-temporary-artifact-count={
        reservoirDensityTestDiagnostics.temporaryArtifactCount
      }
      data-artifact-vertex-ids={
        reservoirDensityTestDiagnostics.artifactVertexIds.join(",")
      }
      data-adjacent-artifact-pairs={
        reservoirDensityTestDiagnostics.adjacentArtifactPairs.join(",")
      }
      data-selected-artifact={selectedArtifactId ?? ""}
      data-transition-state={transitionState}
      data-opening-artifact={openingArtifactId ?? ""}
      data-opening-complete={
        transitionState !== "idle" && transitionState !== "openingArtifact"
      }
      data-input-locked={transitionState !== "idle"}
      data-content-open={artifactWindowPhase !== null}
      data-atmosphere-bottom={atmosphereBottom.toFixed(3)}
      data-artifact-window-atmosphere-gap={ARTIFACT_WINDOW_ATMOSPHERE_GAP}
      data-reading-mode={transitionState === "readingArtifact"}
      data-restoring={restoring}
      data-artifact-content-ready={preparedArtifactContent !== null}
      data-prepared-content-artifact={
        preparedArtifactContent?.artifactId ?? ""
      }
      data-prepared-content-title={preparedArtifactContent?.title ?? ""}
      data-opening-reaction-order={[...openingReactionDistances.entries()]
        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
        .map(([artifactId, distance]) => `${artifactId}:${distance}`)
        .join(",")}
      data-preopen-sphere-quaternion={
        preservedReservoirState?.sphereQuaternion.join(",") ?? ""
      }
      data-preopen-camera-position={
        preservedReservoirState?.cameraPosition.join(",") ?? ""
      }
      data-preopen-camera-target={
        preservedReservoirState?.cameraTarget.join(",") ?? ""
      }
      data-preopen-camera-quaternion={
        preservedReservoirState?.cameraQuaternion.join(",") ?? ""
      }
      data-preopen-camera-progress={
        preservedReservoirState?.cameraProgress.toFixed(6) ?? ""
      }
      data-preopen-camera-target-progress={
        preservedReservoirState?.cameraTargetProgress.toFixed(6) ?? ""
      }
      data-hovered-artifact={hoveredArtifactId ?? ""}
      data-node-click-max-travel={NODE_CLICK_MAX_TRAVEL}
      data-outer-drag-sensitivity={OUTER_DRAG_SENSITIVITY.toFixed(7)}
      data-inner-drag-sensitivity={INNER_DRAG_SENSITIVITY.toFixed(7)}
      data-outer-camera-position={activeOuterPosition
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-outer-camera-target={activeOuterTarget
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-outer-center-distance={atmosphericCameraModel.outerCenterDistance.toFixed(
        3,
      )}
      data-outer-surface-distance={(
        atmosphericCameraModel.outerCenterDistance - RESERVOIR_RADIUS
      ).toFixed(3)}
      data-outer-radial-tilt={THREE.MathUtils.radToDeg(
        atmosphericCameraModel.outerRadialTilt,
      ).toFixed(3)}
      data-outer-view-tilt={THREE.MathUtils.radToDeg(
        atmosphericCameraModel.outerViewTilt,
      ).toFixed(3)}
      data-outer-center-view-offset={THREE.MathUtils.radToDeg(
        atmosphericCameraModel.outerCenterViewOffset,
      ).toFixed(3)}
      data-camera-near="0.080"
      data-min-camera-clearance={MIN_CAMERA_CLEARANCE.toFixed(3)}
      data-path-minimum-raw-clearance={inwardCameraPath.minimumRawClearance.toFixed(
        6,
      )}
      data-path-clearance-corrected={
        inwardCameraPath.requiresClearanceCorrection
      }
      data-inspection-frame-valid={isValidLocalSurfaceFrame(
        inspectionFrame ?? atmosphericCameraModel.canonicalFrame,
      )}
      data-retreat-lateral-offset={retreatCameraPath?.lateralOffset.toFixed(6)}
      data-inspection-normal={inspectionFrame?.normal
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",")}
      data-inspection-up={inspectionFrame?.tangentUp
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",")}
      data-inspection-right={inspectionFrame?.tangentRight
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",")}
      data-inward-outer-camera-position={inwardCameraPath.outerPosition
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-inward-outer-camera-target={inwardCameraPath.outerTarget
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-inner-camera-position={inwardCameraPath.innerPosition
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-inner-camera-target={inwardCameraPath.innerTarget
        .toArray()
        .map((value) => value.toFixed(3))
        .join(",")}
      data-rotation={`${rotationDiagnostics.euler[0].toFixed(3)},${rotationDiagnostics.euler[1].toFixed(3)}`}
      data-rotation-euler={rotationDiagnostics.euler
        .map((value) => value.toFixed(6))
        .join(",")}
      data-rotation-quaternion={rotationDiagnostics.quaternion
        .map((value) => value.toFixed(6))
        .join(",")}
      data-sphere-position={`0,${sphereCenterWorldY.toFixed(3)},0`}
      onPointerDown={beginDrag}
      onPointerMove={updatePointer}
      onPointerLeave={clearPointer}
      onPointerUp={endDrag}
      onPointerCancel={(event) => endDrag(event, false)}
      onLostPointerCapture={handleLostPointerCapture}
      onWheel={updateCameraTravel}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [0, 0, cameraDistance],
          fov: CAMERA_FOV,
          near: 0.08,
          far: 40,
        }}
        onCreated={({ camera, scene }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          sceneRef.current = scene;
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        scene={{ background: undefined }}
      >
        <color attach="background" args={[RESERVOIR_THEME.environment]} />
        <ReservoirCamera
          inwardPath={inwardCameraPath}
          retreatPath={retreatCameraPath}
          orientationFrame={
            inspectionFrame ?? atmosphericCameraModel.canonicalFrame
          }
          targetProgress={cameraProgress}
          travelDirection={travelDirection}
          cameraPoseRef={cameraPoseRef}
          diagnosticsRef={interaction}
        />
        <ambientLight intensity={1.35} />
        <directionalLight position={[-4, 5, 7]} intensity={2.25} />
        <directionalLight position={[5, -3, 4]} intensity={0.45} />
        <group position={[0, sphereCenterWorldY, 0]}>
          <group ref={sphereRotationRef}>
            <ReservoirSphere
              surfaceRef={surfaceRef}
              selectedArtifactId={selectedArtifactId}
              hoveredArtifactId={hoveredArtifactId}
              isDragging={isDragging}
              selectedPressActive={selectedPressActive}
              continuationCueEnabled={transitionState === "idle"}
              interactionRevisionRef={interactionRevisionRef}
              diagnosticsRef={interaction}
              openingActive={openingActive}
              shockwaveActive={transitionState === "openingArtifact"}
              openingArtifact={openingArtifact}
              openingElapsedRef={openingElapsedRef}
              openingReducedMotion={reducedMotion}
              openingReactionDistances={openingReactionDistances}
              maximumOpeningReactionDistance={
                maximumOpeningReactionDistance
              }
              restoring={restoring}
              restorationProgressRef={restorationProgressRef}
              gridInspectionRef={gridInspectionRef}
              onArtifactHoverChange={updateArtifactHover}
            />
          </group>
        </group>
      </Canvas>
      </div>
      {artifactWindowPhase && preparedArtifactContent ? (
        <ArtifactWindow
          atmosphereBottom={atmosphereBottom}
          content={preparedArtifactContent}
          phase={artifactWindowPhase}
          reducedMotion={reducedMotion}
          onDeployComplete={completeArtifactDeployment}
          onClose={requestArtifactClose}
        />
      ) : null}
    </>
  );
}
