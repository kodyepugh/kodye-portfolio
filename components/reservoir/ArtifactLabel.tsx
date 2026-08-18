import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import {
  getCameraSpaceDepth,
  getProjectedWorldDiameterPixels,
  getReservoirFrontFacingScore,
  getWorldDiameterForProjectedPixelsAtDepth,
} from "@/lib/reservoir/projection";
import {
  getReservoirLabelLevel,
  type ReservoirLabelLevel,
} from "@/lib/reservoir/label";
import {
  clampLabelCenterToSafeBounds,
  getLabelRectangleSupportDistance,
  getLabelScreenRect,
  RESERVOIR_LABEL_CANDIDATE_ANGLES,
  RESERVOIR_LABEL_MIN_OUTWARD_DOT,
  rotateScreenDirection,
} from "@/lib/reservoir/label-geometry";
import type { ReservoirFrame } from "@/lib/reservoir/frame";
import { RESERVOIR_RADIUS } from "@/lib/reservoir/geometry";
import { RESERVOIR_RENDER_ORDER, RESERVOIR_THEME } from "@/lib/reservoir/theme";

export const RESERVOIR_NODE_HOVER_TRANSITION_DURATION = 0.16;
export const RESERVOIR_NODE_HOVER_WHITE_MIX = 0.045;
export const RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY = 0.06;
export const RESERVOIR_NODE_HOVER_EMISSIVE_INTENSITY = 0.085;

const LABEL_CANVAS_HEIGHT = 200;
const LABEL_HORIZONTAL_PADDING = 30;
const MAX_LABEL_WIDTH = 720;
const MAX_LABEL_CONTENT_WIDTH =
  MAX_LABEL_WIDTH - LABEL_HORIZONTAL_PADDING * 2;
const LABEL_ACCENT_WIDTH = 34;
const LABEL_TYPE_Y = 58;
const LABEL_TITLE_Y = 126;
const LABEL_TARGET_HEIGHT_PIXELS = 52;
const LABEL_CENTER_DEAD_ZONE_PIXELS = 14;
const LABEL_MIN_GAP_PIXELS = 12;
const LABEL_MAX_GAP_PIXELS = 34;
const LABEL_GAP_RADIUS_FACTOR = 0.22;
const LABEL_PLACEMENT_SWITCH_MARGIN = 10;
const LABEL_SURFACE_DIRECTION_WEIGHT = 0.7;
const LABEL_VIEWPORT_DIRECTION_WEIGHT = 0.3;
const LABEL_SURFACE_REFERENCE_RADIUS_FACTOR = 0.15;
const LABEL_SURFACE_CLEARANCE_PIXELS = 8;
const LABEL_OUTWARD_EPSILON = 1e-6;
const LABEL_FADE_DAMPING = 10;
const LABEL_ANCHOR_DAMPING = 16;
const LABEL_BRIDGE_WIDTH_PIXELS = 10;
const CAROUSEL_HOVER_DWELL_SECONDS = 0.7;
const MARQUEE_SPEED = 105;
const MARQUEE_COPY_GAP = 48;

type ReservoirNodeLabelContent = {
  accentColor: string;
  eyebrow: string;
  title: string;
};

type LabelCanvas = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  titleWidth: number;
  titleClipWidth: number;
};

type LabelCandidate = {
  angle: number;
  directionX: number;
  directionY: number;
  centerX: number;
  centerY: number;
  supportRadius: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  overflow: number;
  outwardDot: number;
  valid: boolean;
  score: number;
};

type LabelAnchorSource = "visible-surface" | "surface-safe-plane";

type ReservoirNodeLabelProps = {
  content: ReservoirNodeLabelContent;
  nodeRef: RefObject<THREE.Group | null>;
  sphereRef: RefObject<THREE.Group | null>;
  reservoirFrame: ReservoirFrame;
  renderedZoomRef: MutableRefObject<number>;
  nodeRadius: number;
  suppressed: boolean;
  hovered: boolean;
  userData?: Record<string, unknown>;
  diagnosticsRef?: RefObject<HTMLDivElement | null>;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

type ArtifactLabelProps = Omit<
  ReservoirNodeLabelProps,
  "content" | "suppressed" | "userData"
> & {
  artifact: Extract<ReservoirContentNode, { kind: "artifact" }>;
  selectionActive: boolean;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function drawLabel(
  labelCanvas: LabelCanvas,
  content: ReservoirNodeLabelContent,
  titleOffset: number,
  repeatTitle: boolean,
) {
  const { canvas, context, texture, titleWidth, titleClipWidth } = labelCanvas;
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = content.accentColor;
  context.fillRect(LABEL_HORIZONTAL_PADDING, 22, LABEL_ACCENT_WIDTH, 5);

  context.font = "600 23px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = RESERVOIR_THEME.labelMuted;
  context.textBaseline = "alphabetic";
  context.fillText(
    content.eyebrow.toUpperCase(),
    LABEL_HORIZONTAL_PADDING,
    LABEL_TYPE_Y,
  );

  context.save();
  context.beginPath();
  context.rect(
    LABEL_HORIZONTAL_PADDING,
    LABEL_TYPE_Y + 18,
    titleClipWidth,
    72,
  );
  context.clip();
  context.font = "540 38px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = RESERVOIR_THEME.label;
  context.fillText(
    content.title,
    LABEL_HORIZONTAL_PADDING - titleOffset,
    LABEL_TITLE_Y,
  );

  if (repeatTitle) {
    context.fillText(
      content.title,
      LABEL_HORIZONTAL_PADDING -
        titleOffset +
        titleWidth +
        MARQUEE_COPY_GAP,
      LABEL_TITLE_Y,
    );
  }

  context.restore();
  texture.needsUpdate = true;
}

function createLabelCandidate(angle: number): LabelCandidate {
  return {
    angle,
    directionX: 0,
    directionY: 0,
    centerX: 0,
    centerY: 0,
    supportRadius: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 0,
    outwardDot: 0,
    valid: false,
    score: Number.POSITIVE_INFINITY,
  };
}

function copyLabelCandidate(target: LabelCandidate, source: LabelCandidate) {
  target.angle = source.angle;
  target.directionX = source.directionX;
  target.directionY = source.directionY;
  target.centerX = source.centerX;
  target.centerY = source.centerY;
  target.supportRadius = source.supportRadius;
  target.left = source.left;
  target.right = source.right;
  target.top = source.top;
  target.bottom = source.bottom;
  target.overflow = source.overflow;
  target.outwardDot = source.outwardDot;
  target.valid = source.valid;
  target.score = source.score;
}

function getUniformWorldScale(scale: THREE.Vector3) {
  const scaleX = Math.abs(scale.x);
  const scaleY = Math.abs(scale.y);
  const scaleZ = Math.abs(scale.z);
  if (
    !Number.isFinite(scaleX) ||
    !Number.isFinite(scaleY) ||
    !Number.isFinite(scaleZ) ||
    scaleX <= LABEL_OUTWARD_EPSILON ||
    scaleY <= LABEL_OUTWARD_EPSILON ||
    scaleZ <= LABEL_OUTWARD_EPSILON
  ) {
    return null;
  }
  return Math.max(scaleX, scaleY, scaleZ);
}

function getPositiveRaySphereHitDistance(
  ray: THREE.Ray,
  sphere: THREE.Sphere,
  target: THREE.Vector3,
) {
  const hit = ray.intersectSphere(sphere, target);
  if (!hit) return null;
  const distance = hit.distanceTo(ray.origin);
  return Number.isFinite(distance) && distance >= 0 ? distance : null;
}

function evaluateCandidate(
  angle: number,
  directionX: number,
  directionY: number,
  nodeX: number,
  nodeY: number,
  nodeRadiusPixels: number,
  gapPixels: number,
  labelWidthPixels: number,
  labelHeightPixels: number,
  safeLeft: number,
  safeRight: number,
  safeTop: number,
  safeBottom: number,
  surfaceOutwardDirection: THREE.Vector2,
  candidate: LabelCandidate,
) {
  const supportRadius = getLabelRectangleSupportDistance(
    directionX,
    directionY,
    labelWidthPixels * 0.5,
    labelHeightPixels * 0.5,
  );
  const centerX =
    nodeX + directionX * (nodeRadiusPixels + gapPixels + supportRadius);
  const centerY =
    nodeY + directionY * (nodeRadiusPixels + gapPixels + supportRadius);
  const rect = getLabelScreenRect(
    centerX,
    centerY,
    labelWidthPixels,
    labelHeightPixels,
    candidate,
  );
  const overflow =
    Math.max(0, safeLeft - rect.left) +
    Math.max(0, rect.right - safeRight) +
    Math.max(0, safeTop - rect.top) +
    Math.max(0, rect.bottom - safeBottom);
  const outwardDot =
    directionX * surfaceOutwardDirection.x +
    directionY * surfaceOutwardDirection.y;
  const valid = outwardDot > RESERVOIR_LABEL_MIN_OUTWARD_DOT;

  candidate.angle = angle;
  candidate.directionX = directionX;
  candidate.directionY = directionY;
  candidate.centerX = centerX;
  candidate.centerY = centerY;
  candidate.supportRadius = supportRadius;
  candidate.left = rect.left;
  candidate.right = rect.right;
  candidate.top = rect.top;
  candidate.bottom = rect.bottom;
  candidate.overflow = overflow;
  candidate.outwardDot = outwardDot;
  candidate.valid = valid;
  candidate.score = valid
    ? (overflow > 0 ? 100000 + overflow * 10 : 0) +
      Math.abs(angle) +
      (1 - outwardDot) * 12
    : Number.POSITIVE_INFINITY;
}

function projectScreenPointToSurfaceSafeAnchor(
  screenNdc: THREE.Vector2,
  camera: THREE.Camera,
  viewportHeight: number,
  screenRaycaster: THREE.Raycaster,
  screenRay: THREE.Ray,
  reservoirSphere: THREE.Sphere,
  childSphere: THREE.Sphere,
  reservoirHit: THREE.Vector3,
  childHit: THREE.Vector3,
  cameraForward: THREE.Vector3,
  cameraSpacePosition: THREE.Vector3,
  surfaceSafeOrigin: THREE.Vector3,
  anchorPlane: THREE.Plane,
  target: THREE.Vector3,
): LabelAnchorSource {
  screenRaycaster.setFromCamera(screenNdc, camera);
  screenRay.copy(screenRaycaster.ray);

  const reservoirDistance = getPositiveRaySphereHitDistance(
    screenRay,
    reservoirSphere,
    reservoirHit,
  );
  const childDistance = getPositiveRaySphereHitDistance(
    screenRay,
    childSphere,
    childHit,
  );
  const nearestDistance =
    reservoirDistance === null
      ? childDistance
      : childDistance === null
        ? reservoirDistance
        : Math.min(reservoirDistance, childDistance);

  if (nearestDistance !== null) {
    const nearestHit =
      childDistance !== null && childDistance <= nearestDistance
        ? childHit
        : reservoirHit;
    target.copy(nearestHit);
    const cameraDepth = getCameraSpaceDepth(
      camera,
      target,
      cameraSpacePosition,
    );
    const clearance = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight,
      projectedPixels: LABEL_SURFACE_CLEARANCE_PIXELS,
      cameraDepth,
    });
    if (Number.isFinite(clearance) && clearance > 0) {
      target.addScaledVector(screenRay.direction, -clearance);
    }
    return "visible-surface";
  }

  anchorPlane.setFromNormalAndCoplanarPoint(
    cameraForward,
    surfaceSafeOrigin,
  );
  if (!screenRay.intersectPlane(anchorPlane, target)) {
    target.copy(surfaceSafeOrigin);
  }
  return "surface-safe-plane";
}

export function ReservoirNodeLabel({
  content,
  nodeRef,
  sphereRef,
  reservoirFrame,
  renderedZoomRef,
  nodeRadius,
  suppressed,
  hovered,
  userData,
  diagnosticsRef,
  onPointerEnter,
  onPointerLeave,
}: ReservoirNodeLabelProps) {
  const labelGroupRef = useRef<THREE.Group | null>(null);
  const spriteRef = useRef<THREE.Sprite | null>(null);
  const bridgeRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);
  const bridgeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const labelCanvasRef = useRef<LabelCanvas | null>(null);
  const elapsedRef = useRef(0);
  const lastOffsetRef = useRef(Number.NaN);
  const currentLevelRef = useRef<ReservoirLabelLevel>("hidden");
  const placementCandidateIndexRef = useRef(0);
  const candidateRefs = useRef(
    RESERVOIR_LABEL_CANDIDATE_ANGLES.map(createLabelCandidate),
  );
  const selectedCandidateRef = useRef(createLabelCandidate(0));
  const worldNode = useRef(new THREE.Vector3());
  const worldCenter = useRef(new THREE.Vector3());
  const worldAnchor = useRef(new THREE.Vector3());
  const worldLabelEdge = useRef(new THREE.Vector3());
  const worldBridgeStart = useRef(new THREE.Vector3());
  const worldCameraPosition = useRef(new THREE.Vector3());
  const worldSurfaceProbe = useRef(new THREE.Vector3());
  const surfaceSafeOrigin = useRef(new THREE.Vector3());
  const nodeWorldScale = useRef(new THREE.Vector3());
  const reservoirWorldScale = useRef(new THREE.Vector3());
  const cameraSpacePosition = useRef(new THREE.Vector3());
  const projectedNodePosition = useRef(new THREE.Vector3());
  const projectedSurfaceProbe = useRef(new THREE.Vector3());
  const visibilityDirection = useRef(new THREE.Vector3());
  const screenNode = useRef(new THREE.Vector2());
  const screenSurfaceProbe = useRef(new THREE.Vector2());
  const viewportCenter = useRef(new THREE.Vector2());
  const surfaceOutwardDirection = useRef(new THREE.Vector2(0, -1));
  const viewportOutwardDirection = useRef(new THREE.Vector2(0, -1));
  const preferredDirection = useRef(new THREE.Vector2(0, -1));
  const candidateDirection = useRef(new THREE.Vector2());
  const finalCenter = useRef(new THREE.Vector2());
  const finalDirection = useRef(new THREE.Vector2());
  const correctedCenter = useRef(new THREE.Vector2());
  const screenNdc = useRef(new THREE.Vector2());
  const screenNodeEdgeNdc = useRef(new THREE.Vector2());
  const screenEdgeNdc = useRef(new THREE.Vector2());
  const surfaceNormal = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const screenRaycaster = useRef(new THREE.Raycaster());
  const screenRay = useRef(new THREE.Ray());
  const reservoirSphere = useRef(new THREE.Sphere());
  const childSphere = useRef(new THREE.Sphere());
  const reservoirHit = useRef(new THREE.Vector3());
  const childHit = useRef(new THREE.Vector3());
  const anchorPlane = useRef(new THREE.Plane());
  const localAnchor = useRef(new THREE.Vector3());
  const localBridgeStart = useRef(new THREE.Vector3());
  const localLabelEdge = useRef(new THREE.Vector3());
  const localBridgeDirection = useRef(new THREE.Vector3());
  const bridgeMidpoint = useRef(new THREE.Vector3());
  const bridgeAxis = useRef(new THREE.Vector3(0, 1, 0));
  const bridgeQuaternion = useRef(new THREE.Quaternion());

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = MAX_LABEL_WIDTH;
    canvas.height = LABEL_CANVAS_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = "540 38px ui-monospace, SFMono-Regular, Menlo, monospace";
    const titleWidth = context.measureText(content.title).width;
    context.font = "600 23px ui-monospace, SFMono-Regular, Menlo, monospace";
    const typeWidth = context.measureText(content.eyebrow.toUpperCase()).width;
    const measuredContentWidth = Math.max(
      titleWidth,
      typeWidth,
      LABEL_ACCENT_WIDTH,
    );
    const contentWidth = Math.min(measuredContentWidth, MAX_LABEL_CONTENT_WIDTH);
    canvas.width = Math.ceil(contentWidth + LABEL_HORIZONTAL_PADDING * 2);
    canvas.height = LABEL_CANVAS_HEIGHT;

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;
    canvasTexture.generateMipmaps = false;
    const labelCanvas = {
      canvas,
      context,
      texture: canvasTexture,
      titleWidth,
      titleClipWidth: canvas.width - LABEL_HORIZONTAL_PADDING * 2,
    };
    labelCanvasRef.current = labelCanvas;
    drawLabel(labelCanvas, content, 0, false);
    const material = materialRef.current;
    if (material) {
      material.map = canvasTexture;
      material.needsUpdate = true;
    }

    return () => {
      labelCanvasRef.current = null;
      if (material) {
        material.map = null;
        material.needsUpdate = true;
      }
      canvasTexture.dispose();
    };
  }, [content]);

  useFrame(({ camera, size }, delta) => {
    const labelGroup = labelGroupRef.current;
    const sprite = spriteRef.current;
    const bridge = bridgeRef.current;
    const bridgeMaterial = bridgeMaterialRef.current;
    const material = materialRef.current;
    const node = nodeRef.current;
    const sphere = sphereRef.current;
    const labelCanvas = labelCanvasRef.current;
    if (
      !labelGroup ||
      !sprite ||
      !bridge ||
      !bridgeMaterial ||
      !material ||
      !node ||
      !sphere ||
      !labelCanvas
    ) {
      return;
    }

    node.getWorldPosition(worldNode.current);
    sphere.getWorldPosition(worldCenter.current);
    node.getWorldScale(nodeWorldScale.current);
    sphere.getWorldScale(reservoirWorldScale.current);
    const childScale = getUniformWorldScale(nodeWorldScale.current);
    const reservoirScale = getUniformWorldScale(reservoirWorldScale.current);
    if (childScale === null || reservoirScale === null) {
      currentLevelRef.current = "hidden";
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        0,
        LABEL_FADE_DAMPING,
        delta,
      );
      sprite.visible = material.opacity > 0.01;
      bridge.visible = sprite.visible;
      bridgeMaterial.opacity = material.opacity;
      return;
    }

    const childWorldRadius = nodeRadius * childScale;
    const reservoirWorldRadius = RESERVOIR_RADIUS * reservoirScale;
    if (
      !Number.isFinite(childWorldRadius) ||
      childWorldRadius <= LABEL_OUTWARD_EPSILON ||
      !Number.isFinite(reservoirWorldRadius) ||
      reservoirWorldRadius <= LABEL_OUTWARD_EPSILON
    ) {
      return;
    }

    surfaceNormal.current
      .copy(worldNode.current)
      .sub(worldCenter.current);
    if (surfaceNormal.current.lengthSq() <= LABEL_OUTWARD_EPSILON) return;
    surfaceNormal.current.normalize();
    camera.getWorldDirection(cameraForward.current);
    camera.getWorldPosition(worldCameraPosition.current);

    reservoirSphere.current.set(worldCenter.current, reservoirWorldRadius);
    childSphere.current.set(worldNode.current, childWorldRadius);

    visibilityDirection.current
      .copy(worldNode.current)
      .sub(worldCameraPosition.current);
    if (visibilityDirection.current.lengthSq() <= LABEL_OUTWARD_EPSILON) return;
    visibilityDirection.current.normalize();
    screenRay.current.set(
      worldCameraPosition.current,
      visibilityDirection.current,
    );
    const childHitDistance = getPositiveRaySphereHitDistance(
      screenRay.current,
      childSphere.current,
      childHit.current,
    );
    const reservoirHitDistance = getPositiveRaySphereHitDistance(
      screenRay.current,
      reservoirSphere.current,
      reservoirHit.current,
    );
    const childVisible =
      childHitDistance !== null &&
      (reservoirHitDistance === null ||
        childHitDistance <= reservoirHitDistance + 0.001);

    const facing = getReservoirFrontFacingScore(
      surfaceNormal.current,
      cameraForward.current,
    );
    const projectedNodePixels = getProjectedWorldDiameterPixels({
      camera,
      viewportHeight: size.height,
      worldDiameter: childWorldRadius * 2,
      worldPosition: worldNode.current,
      scratchCameraSpacePosition: cameraSpacePosition.current,
    });
    const renderedZoom = renderedZoomRef.current;
    const labelLevel = getReservoirLabelLevel({
      currentLevel: currentLevelRef.current,
      projectedNodePixels,
      inspectionActive: hovered,
      frontFacing: childVisible,
      suppressed,
    });
    currentLevelRef.current = labelLevel;
    const eligible = labelLevel !== "hidden";
    const targetOpacity = eligible ? 1 : 0;
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      targetOpacity,
      LABEL_FADE_DAMPING,
      delta,
    );
    sprite.visible = material.opacity > 0.01 || targetOpacity > 0;
    bridge.visible = eligible || material.opacity > 0.01;
    bridgeMaterial.opacity = material.opacity;

    const projectedNode = projectedNodePosition.current
      .copy(worldNode.current)
      .project(camera);
    screenNode.current.set(
      ((projectedNode.x + 1) / 2) * size.width,
      ((1 - projectedNode.y) / 2) * size.height,
    );

    worldSurfaceProbe.current
      .copy(worldNode.current)
      .addScaledVector(
        surfaceNormal.current,
        Math.max(
          childWorldRadius,
          reservoirWorldRadius * LABEL_SURFACE_REFERENCE_RADIUS_FACTOR,
        ),
      );
    const projectedSurfaceProbePosition = projectedSurfaceProbe.current
      .copy(worldSurfaceProbe.current)
      .project(camera);
    screenSurfaceProbe.current.set(
      ((projectedSurfaceProbePosition.x + 1) / 2) * size.width,
      ((1 - projectedSurfaceProbePosition.y) / 2) * size.height,
    );
    const surfaceDirectionX =
      screenSurfaceProbe.current.x - screenNode.current.x;
    const surfaceDirectionY =
      screenSurfaceProbe.current.y - screenNode.current.y;
    if (
      surfaceDirectionX * surfaceDirectionX +
        surfaceDirectionY * surfaceDirectionY >
      LABEL_OUTWARD_EPSILON
    ) {
      surfaceOutwardDirection.current.set(
        surfaceDirectionX,
        surfaceDirectionY,
      ).normalize();
    }

    viewportCenter.current.set(size.width / 2, size.height / 2);
    const viewportDirectionX = screenNode.current.x - viewportCenter.current.x;
    const viewportDirectionY = screenNode.current.y - viewportCenter.current.y;
    if (
      viewportDirectionX * viewportDirectionX +
        viewportDirectionY * viewportDirectionY >=
      LABEL_CENTER_DEAD_ZONE_PIXELS * LABEL_CENTER_DEAD_ZONE_PIXELS
    ) {
      viewportOutwardDirection.current.set(
        viewportDirectionX,
        viewportDirectionY,
      ).normalize();
    }
    preferredDirection.current
      .copy(surfaceOutwardDirection.current)
      .multiplyScalar(LABEL_SURFACE_DIRECTION_WEIGHT)
      .addScaledVector(
        viewportOutwardDirection.current,
        LABEL_VIEWPORT_DIRECTION_WEIGHT,
      );
    if (preferredDirection.current.lengthSq() <= LABEL_OUTWARD_EPSILON) {
      preferredDirection.current.copy(surfaceOutwardDirection.current);
    }
    preferredDirection.current.normalize();

    const labelHeightPixels = LABEL_TARGET_HEIGHT_PIXELS;
    const labelWidthPixels =
      labelHeightPixels * (labelCanvas.canvas.width / labelCanvas.canvas.height);
    const nodeRadiusPixels = projectedNodePixels * 0.5;
    const gapPixels = clamp(
      LABEL_MIN_GAP_PIXELS + nodeRadiusPixels * LABEL_GAP_RADIUS_FACTOR,
      LABEL_MIN_GAP_PIXELS,
      LABEL_MAX_GAP_PIXELS,
    );
    const safeLeft = reservoirFrame.safeZones.left + 12;
    const safeRight = size.width - reservoirFrame.safeZones.right - 12;
    const safeTop = reservoirFrame.safeZones.top + 12;
    const safeBottom = size.height - reservoirFrame.safeZones.bottom - 12;

    let bestIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 0; index < candidateRefs.current.length; index += 1) {
      const candidate = candidateRefs.current[index];
      rotateScreenDirection(
        preferredDirection.current,
        candidate.angle,
        candidateDirection.current,
      );
      evaluateCandidate(
        candidate.angle,
        candidateDirection.current.x,
        candidateDirection.current.y,
        screenNode.current.x,
        screenNode.current.y,
        nodeRadiusPixels,
        gapPixels,
        labelWidthPixels,
        labelHeightPixels,
        safeLeft,
        safeRight,
        safeTop,
        safeBottom,
        surfaceOutwardDirection.current,
        candidate,
      );
      if (candidate.valid && candidate.score < bestScore) {
        bestIndex = index;
        bestScore = candidate.score;
      }
    }
    if (bestIndex < 0) return;

    const currentCandidate = candidateRefs.current[placementCandidateIndexRef.current];
    const selectedIndex =
      currentCandidate.valid &&
      currentCandidate.score <= bestScore + LABEL_PLACEMENT_SWITCH_MARGIN
        ? placementCandidateIndexRef.current
        : bestIndex;
    placementCandidateIndexRef.current = selectedIndex;
    const selectedCandidate = selectedCandidateRef.current;
    copyLabelCandidate(selectedCandidate, candidateRefs.current[selectedIndex]);

    finalCenter.current.set(selectedCandidate.centerX, selectedCandidate.centerY);
    clampLabelCenterToSafeBounds(
      finalCenter.current,
      labelWidthPixels,
      labelHeightPixels,
      safeLeft,
      safeRight,
      safeTop,
      safeBottom,
      correctedCenter.current,
    );
    const safeBoundCorrected =
      correctedCenter.current.distanceToSquared(finalCenter.current) >
      LABEL_OUTWARD_EPSILON;
    if (safeBoundCorrected) {
      finalDirection.current
        .copy(correctedCenter.current)
        .sub(screenNode.current);
      const correctedDistance = finalDirection.current.length();
      const correctedOutwardDot =
        correctedDistance > LABEL_OUTWARD_EPSILON
          ? finalDirection.current
              .multiplyScalar(1 / correctedDistance)
              .dot(surfaceOutwardDirection.current)
          : -1;
      if (correctedOutwardDot > RESERVOIR_LABEL_MIN_OUTWARD_DOT) {
        finalCenter.current.copy(correctedCenter.current);
      } else {
        finalDirection.current.set(
          selectedCandidate.directionX,
          selectedCandidate.directionY,
        );
      }
    } else {
      finalDirection.current.set(
        selectedCandidate.directionX,
        selectedCandidate.directionY,
      );
    }
    if (finalDirection.current.lengthSq() <= LABEL_OUTWARD_EPSILON) return;
    finalDirection.current.normalize();
    const finalOutwardDot = finalDirection.current.dot(
      surfaceOutwardDirection.current,
    );
    if (finalOutwardDot <= RESERVOIR_LABEL_MIN_OUTWARD_DOT) return;

    const finalSupportRadius = getLabelRectangleSupportDistance(
      finalDirection.current.x,
      finalDirection.current.y,
      labelWidthPixels * 0.5,
      labelHeightPixels * 0.5,
    );
    getLabelScreenRect(
      finalCenter.current.x,
      finalCenter.current.y,
      labelWidthPixels,
      labelHeightPixels,
      selectedCandidate,
    );
    selectedCandidate.centerX = finalCenter.current.x;
    selectedCandidate.centerY = finalCenter.current.y;
    selectedCandidate.directionX = finalDirection.current.x;
    selectedCandidate.directionY = finalDirection.current.y;
    selectedCandidate.supportRadius = finalSupportRadius;
    selectedCandidate.outwardDot = finalOutwardDot;

    const cameraDepth = getCameraSpaceDepth(
      camera,
      worldNode.current,
      cameraSpacePosition.current,
    );
    const safeWorldClearance = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight: size.height,
      projectedPixels: LABEL_SURFACE_CLEARANCE_PIXELS,
      cameraDepth,
    });
    const resolvedSafeWorldClearance =
      Number.isFinite(safeWorldClearance) && safeWorldClearance > 0
        ? safeWorldClearance
        : childWorldRadius * 0.05;
    surfaceSafeOrigin.current
      .copy(worldNode.current)
      .addScaledVector(
        surfaceNormal.current,
        childWorldRadius + resolvedSafeWorldClearance,
      );

    screenNdc.current.set(
      (finalCenter.current.x / size.width) * 2 - 1,
      -(finalCenter.current.y / size.height) * 2 + 1,
    );
    const nodeEdgeX =
      screenNode.current.x +
      finalDirection.current.x * nodeRadiusPixels;
    const nodeEdgeY =
      screenNode.current.y +
      finalDirection.current.y * nodeRadiusPixels;
    screenNodeEdgeNdc.current.set(
      (nodeEdgeX / size.width) * 2 - 1,
      -(nodeEdgeY / size.height) * 2 + 1,
    );
    const labelEdgeX =
      finalCenter.current.x -
      finalDirection.current.x * finalSupportRadius;
    const labelEdgeY =
      finalCenter.current.y -
      finalDirection.current.y * finalSupportRadius;
    screenEdgeNdc.current.set(
      (labelEdgeX / size.width) * 2 - 1,
      -(labelEdgeY / size.height) * 2 + 1,
    );

    const anchorSource = projectScreenPointToSurfaceSafeAnchor(
      screenNdc.current,
      camera,
      size.height,
      screenRaycaster.current,
      screenRay.current,
      reservoirSphere.current,
      childSphere.current,
      reservoirHit.current,
      childHit.current,
      cameraForward.current,
      cameraSpacePosition.current,
      surfaceSafeOrigin.current,
      anchorPlane.current,
      worldAnchor.current,
    );
    projectScreenPointToSurfaceSafeAnchor(
      screenNodeEdgeNdc.current,
      camera,
      size.height,
      screenRaycaster.current,
      screenRay.current,
      reservoirSphere.current,
      childSphere.current,
      reservoirHit.current,
      childHit.current,
      cameraForward.current,
      cameraSpacePosition.current,
      surfaceSafeOrigin.current,
      anchorPlane.current,
      worldBridgeStart.current,
    );
    projectScreenPointToSurfaceSafeAnchor(
      screenEdgeNdc.current,
      camera,
      size.height,
      screenRaycaster.current,
      screenRay.current,
      reservoirSphere.current,
      childSphere.current,
      reservoirHit.current,
      childHit.current,
      cameraForward.current,
      cameraSpacePosition.current,
      surfaceSafeOrigin.current,
      anchorPlane.current,
      worldLabelEdge.current,
    );

    localAnchor.current.copy(worldAnchor.current);
    node.worldToLocal(localAnchor.current);
    labelGroup.position.lerp(
      localAnchor.current,
      1 - Math.exp(-LABEL_ANCHOR_DAMPING * delta),
    );

    const labelCameraDepth = getCameraSpaceDepth(
      camera,
      worldAnchor.current,
      cameraSpacePosition.current,
    );
    const labelWorldHeight = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight: size.height,
      projectedPixels: labelHeightPixels,
      cameraDepth: labelCameraDepth,
    });
    const labelWorldWidth = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight: size.height,
      projectedPixels: labelWidthPixels,
      cameraDepth: labelCameraDepth,
    });
    sprite.scale.set(
      labelWorldWidth / childScale,
      labelWorldHeight / childScale,
      1,
    );
    sprite.center.set(0.5, 0.5);

    localBridgeStart.current.copy(worldBridgeStart.current);
    localLabelEdge.current.copy(worldLabelEdge.current);
    node.worldToLocal(localBridgeStart.current);
    node.worldToLocal(localLabelEdge.current);
    localBridgeDirection.current
      .copy(localLabelEdge.current)
      .sub(localBridgeStart.current);
    const bridgeLength = localBridgeDirection.current.length();
    if (bridgeLength > 0.0001) {
      bridgeMidpoint.current
        .copy(localBridgeStart.current)
        .add(localLabelEdge.current)
        .multiplyScalar(0.5);
      bridge.position.copy(bridgeMidpoint.current);
      bridgeQuaternion.current.setFromUnitVectors(
        bridgeAxis.current,
        localBridgeDirection.current.normalize(),
      );
      bridge.quaternion.copy(bridgeQuaternion.current);
      const bridgeWorldWidth = getWorldDiameterForProjectedPixelsAtDepth({
        camera,
        viewportHeight: size.height,
        projectedPixels: LABEL_BRIDGE_WIDTH_PIXELS,
        cameraDepth: labelCameraDepth,
      });
      bridge.scale.set(
        bridgeWorldWidth / childScale,
        bridgeLength,
        bridgeWorldWidth / childScale,
      );
    }

    if (diagnosticsRef?.current && hovered) {
      const nodeId =
        typeof userData?.artifactId === "string"
          ? userData.artifactId
          : typeof userData?.collectionId === "string"
            ? userData.collectionId
            : "";
      diagnosticsRef.current.dataset.labelNodeId = nodeId;
      diagnosticsRef.current.dataset.labelLevel = labelLevel;
      diagnosticsRef.current.dataset.labelFrontFacingScore = facing.toFixed(6);
      diagnosticsRef.current.dataset.labelProjectedNodePx = projectedNodePixels.toFixed(3);
      diagnosticsRef.current.dataset.labelRenderedZoom = renderedZoom.toFixed(6);
      diagnosticsRef.current.dataset.labelChildVisible = String(childVisible);
      diagnosticsRef.current.dataset.labelChildHitDistance =
        childHitDistance?.toFixed(6) ?? "none";
      diagnosticsRef.current.dataset.labelReservoirHitDistance =
        reservoirHitDistance?.toFixed(6) ?? "none";
      diagnosticsRef.current.dataset.labelSurfaceOutwardScreenDirection = `${surfaceOutwardDirection.current.x.toFixed(4)},${surfaceOutwardDirection.current.y.toFixed(4)}`;
      diagnosticsRef.current.dataset.labelViewportOutwardDirection = `${viewportOutwardDirection.current.x.toFixed(4)},${viewportOutwardDirection.current.y.toFixed(4)}`;
      diagnosticsRef.current.dataset.labelFinalDirection = `${finalDirection.current.x.toFixed(4)},${finalDirection.current.y.toFixed(4)}`;
      diagnosticsRef.current.dataset.labelFinalOutwardDot = finalOutwardDot.toFixed(6);
      diagnosticsRef.current.dataset.labelCandidateAngle = selectedCandidate.angle.toFixed(1);
      diagnosticsRef.current.dataset.labelSafeBoundCorrected = String(safeBoundCorrected);
      diagnosticsRef.current.dataset.labelRectangle = [
        selectedCandidate.left,
        selectedCandidate.top,
        selectedCandidate.right,
        selectedCandidate.bottom,
      ].map((value) => value.toFixed(2)).join(",");
      diagnosticsRef.current.dataset.labelAnchorSource = anchorSource;
      diagnosticsRef.current.dataset.labelBridgeActive = String(
        bridge.visible,
      );
      diagnosticsRef.current.dataset.labelBridgeLength = bridgeLength.toFixed(6);
    }

    const titleOverflows = labelCanvas.titleWidth > labelCanvas.titleClipWidth;
    if (hovered && titleOverflows) {
      elapsedRef.current += delta;
      const travelDistance = labelCanvas.titleWidth + MARQUEE_COPY_GAP;
      const titleOffset =
        elapsedRef.current <= CAROUSEL_HOVER_DWELL_SECONDS
          ? 0
          : ((elapsedRef.current - CAROUSEL_HOVER_DWELL_SECONDS) *
              MARQUEE_SPEED) % travelDistance;
      if (Math.abs(titleOffset - lastOffsetRef.current) >= 0.5) {
        drawLabel(labelCanvas, content, titleOffset, true);
        lastOffsetRef.current = titleOffset;
      }
    } else if (elapsedRef.current !== 0 || lastOffsetRef.current !== 0) {
      elapsedRef.current = 0;
      lastOffsetRef.current = 0;
      drawLabel(labelCanvas, content, 0, false);
    }
  });

  return (
    <>
      <group ref={labelGroupRef}>
      <sprite
        ref={spriteRef}
        position={[0, 0, 0]}
        renderOrder={RESERVOIR_RENDER_ORDER.artifactLabel}
        userData={userData}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <spriteMaterial
          ref={materialRef}
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
          alphaTest={0.02}
          toneMapped={false}
        />
      </sprite>
      </group>
      <mesh
        ref={bridgeRef}
        position={[0, 0, 0]}
        visible={false}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <cylinderGeometry args={[1, 1, 1, 8, 1, false]} />
        <meshBasicMaterial
          ref={bridgeMaterialRef}
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </>
  );
}

export function ArtifactLabel({
  artifact,
  selectionActive,
  ...labelProps
}: ArtifactLabelProps) {
  const content = useMemo(
    () => ({
      accentColor: artifact.categoryColor ?? RESERVOIR_THEME.inspection,
      eyebrow: artifact.typeLabel,
      title: artifact.title,
    }),
    [artifact],
  );

  return (
    <ReservoirNodeLabel
      {...labelProps}
      content={content}
      nodeRadius={labelProps.nodeRadius}
      suppressed={selectionActive}
      userData={{ artifactId: artifact.id }}
    />
  );
}
