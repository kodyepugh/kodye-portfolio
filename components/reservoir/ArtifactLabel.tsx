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
import type { ReservoirFrame } from "@/lib/reservoir/frame";
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
const LABEL_FRONT_FACING_THRESHOLD = 0.06;
const LABEL_TARGET_HEIGHT_PIXELS = 52;
const LABEL_CENTER_DEAD_ZONE_PIXELS = 14;
const LABEL_MIN_GAP_PIXELS = 12;
const LABEL_MAX_GAP_PIXELS = 34;
const LABEL_GAP_RADIUS_FACTOR = 0.22;
const LABEL_PLACEMENT_SWITCH_MARGIN = 10;
const LABEL_FADE_DAMPING = 10;
const LABEL_ANCHOR_DAMPING = 16;
const LABEL_BRIDGE_WIDTH_PIXELS = 10;
const CAROUSEL_HOVER_DWELL_SECONDS = 0.7;
const MARQUEE_SPEED = 105;
const MARQUEE_COPY_GAP = 48;

type LabelPlacementSide = "outward" | "inward";

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
  score: number;
};

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

function evaluateCandidate(
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
  candidate: LabelCandidate,
) {
  const supportRadius =
    Math.abs(directionX) * labelWidthPixels * 0.5 +
    Math.abs(directionY) * labelHeightPixels * 0.5;
  const centerX =
    nodeX + directionX * (nodeRadiusPixels + gapPixels + supportRadius);
  const centerY =
    nodeY + directionY * (nodeRadiusPixels + gapPixels + supportRadius);
  const left = centerX - labelWidthPixels * 0.5;
  const right = centerX + labelWidthPixels * 0.5;
  const top = centerY - labelHeightPixels * 0.5;
  const bottom = centerY + labelHeightPixels * 0.5;
  const overflow =
    Math.max(0, safeLeft - left) +
    Math.max(0, right - safeRight) +
    Math.max(0, safeTop - top) +
    Math.max(0, bottom - safeBottom);

  candidate.directionX = directionX;
  candidate.directionY = directionY;
  candidate.centerX = centerX;
  candidate.centerY = centerY;
  candidate.supportRadius = supportRadius;
  candidate.left = left;
  candidate.right = right;
  candidate.top = top;
  candidate.bottom = bottom;
  candidate.overflow = overflow;
  candidate.score = overflow;
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
  const placementSideRef = useRef<LabelPlacementSide>("outward");
  const outwardDirectionRef = useRef(new THREE.Vector2(0, -1));
  const outwardCandidateRef = useRef({} as LabelCandidate);
  const inwardCandidateRef = useRef({} as LabelCandidate);
  const worldNode = useRef(new THREE.Vector3());
  const worldCenter = useRef(new THREE.Vector3());
  const worldAnchor = useRef(new THREE.Vector3());
  const worldLabelEdge = useRef(new THREE.Vector3());
  const worldBridgeStart = useRef(new THREE.Vector3());
  const worldScale = useRef(new THREE.Vector3(1, 1, 1));
  const cameraSpacePosition = useRef(new THREE.Vector3());
  const projectedNodePosition = useRef(new THREE.Vector3());
  const screenNode = useRef(new THREE.Vector2());
  const viewportCenter = useRef(new THREE.Vector2());
  const screenNdc = useRef(new THREE.Vector2());
  const screenEdgeNdc = useRef(new THREE.Vector2());
  const anchorDirection = useRef(new THREE.Vector2());
  const surfaceNormal = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const screenRaycaster = useRef(new THREE.Raycaster());
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
    node.getWorldScale(worldScale.current);
    surfaceNormal.current
      .copy(worldNode.current)
      .sub(worldCenter.current)
      .normalize();
    camera.getWorldDirection(cameraForward.current);

    const facing = getReservoirFrontFacingScore(
      surfaceNormal.current,
      cameraForward.current,
    );
    const projectedNodePixels = getProjectedWorldDiameterPixels({
      camera,
      viewportHeight: size.height,
      worldDiameter: nodeRadius * 2 * worldScale.current.x,
      worldPosition: worldNode.current,
      scratchCameraSpacePosition: cameraSpacePosition.current,
    });
    const renderedZoom = renderedZoomRef.current;
    const frontFacing = facing > LABEL_FRONT_FACING_THRESHOLD;
    const labelLevel = getReservoirLabelLevel({
      currentLevel: currentLevelRef.current,
      projectedNodePixels,
      inspectionActive: hovered,
      frontFacing,
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
    viewportCenter.current.set(size.width / 2, size.height / 2);
    anchorDirection.current
      .copy(screenNode.current)
      .sub(viewportCenter.current);
    if (
      anchorDirection.current.lengthSq() <
      LABEL_CENTER_DEAD_ZONE_PIXELS * LABEL_CENTER_DEAD_ZONE_PIXELS
    ) {
      anchorDirection.current.copy(outwardDirectionRef.current);
    } else {
      anchorDirection.current.normalize();
      outwardDirectionRef.current.copy(anchorDirection.current);
    }

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
    const direction = outwardDirectionRef.current;
    evaluateCandidate(
      direction.x,
      direction.y,
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
      outwardCandidateRef.current,
    );
    evaluateCandidate(
      -direction.x,
      -direction.y,
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
      inwardCandidateRef.current,
    );

    const currentCandidate =
      placementSideRef.current === "outward"
        ? outwardCandidateRef.current
        : inwardCandidateRef.current;
    const alternativeCandidate =
      placementSideRef.current === "outward"
        ? inwardCandidateRef.current
        : outwardCandidateRef.current;
    if (
      alternativeCandidate.score + LABEL_PLACEMENT_SWITCH_MARGIN <
      currentCandidate.score
    ) {
      placementSideRef.current =
        placementSideRef.current === "outward" ? "inward" : "outward";
    }
    const selectedCandidate =
      placementSideRef.current === "outward"
        ? outwardCandidateRef.current
        : inwardCandidateRef.current;

    const cameraDepth = getCameraSpaceDepth(
      camera,
      worldNode.current,
      cameraSpacePosition.current,
    );
    const labelWorldHeight = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight: size.height,
      projectedPixels: labelHeightPixels,
      cameraDepth,
    });
    const labelWorldWidth = getWorldDiameterForProjectedPixelsAtDepth({
      camera,
      viewportHeight: size.height,
      projectedPixels: labelWidthPixels,
      cameraDepth,
    });
    const parentScale = Math.max(worldScale.current.x, 0.0001);
    sprite.scale.set(
      labelWorldWidth / parentScale,
      labelWorldHeight / parentScale,
      1,
    );
    sprite.center.set(0.5, 0.5);

    const ndcX = (selectedCandidate.centerX / size.width) * 2 - 1;
    const ndcY = -(selectedCandidate.centerY / size.height) * 2 + 1;
    const edgeX =
      selectedCandidate.centerX -
      selectedCandidate.directionX * selectedCandidate.supportRadius;
    const edgeY =
      selectedCandidate.centerY -
      selectedCandidate.directionY * selectedCandidate.supportRadius;
    screenNdc.current.set(ndcX, ndcY);
    screenEdgeNdc.current.set(
      (edgeX / size.width) * 2 - 1,
      -(edgeY / size.height) * 2 + 1,
    );
    anchorPlane.current.setFromNormalAndCoplanarPoint(
      cameraForward.current,
      worldNode.current,
    );
    screenRaycaster.current.setFromCamera(screenNdc.current, camera);
    if (
      !screenRaycaster.current.ray.intersectPlane(
        anchorPlane.current,
        worldAnchor.current,
      )
    ) {
      worldAnchor.current.copy(worldNode.current);
    }
    screenRaycaster.current.setFromCamera(screenEdgeNdc.current, camera);
    if (
      !screenRaycaster.current.ray.intersectPlane(
        anchorPlane.current,
        worldLabelEdge.current,
      )
    ) {
      worldLabelEdge.current.copy(worldAnchor.current);
    }

    localAnchor.current.copy(worldAnchor.current);
    node.worldToLocal(localAnchor.current);
    labelGroup.position.lerp(
      localAnchor.current,
      1 - Math.exp(-LABEL_ANCHOR_DAMPING * delta),
    );

    worldBridgeStart.current
      .copy(worldNode.current)
      .addScaledVector(surfaceNormal.current, nodeRadius * parentScale);
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
        cameraDepth,
      });
      bridge.scale.set(
        bridgeWorldWidth / parentScale,
        bridgeLength,
        bridgeWorldWidth / parentScale,
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
      diagnosticsRef.current.dataset.labelPlacementSide = placementSideRef.current;
      diagnosticsRef.current.dataset.labelEdgeCorrected = "true";
      diagnosticsRef.current.dataset.labelRectangle = [
        selectedCandidate.left,
        selectedCandidate.top,
        selectedCandidate.right,
        selectedCandidate.bottom,
      ].map((value) => value.toFixed(2)).join(",");
      diagnosticsRef.current.dataset.labelBridgeActive = String(bridge.visible);
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
          depthTest
          depthWrite={false}
          alphaTest={0.02}
          toneMapped={false}
        />
      </sprite>
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
    </group>
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
