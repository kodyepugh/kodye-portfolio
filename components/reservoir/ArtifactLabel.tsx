import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import { getProjectedWorldDiameterPixels } from "@/lib/reservoir/projection";
import { getReservoirLabelLevel } from "@/lib/reservoir/label";
import type { ReservoirLabelLevel } from "@/lib/reservoir/label";
import type { ReservoirFrame } from "@/lib/reservoir/frame";
import { RESERVOIR_RENDER_ORDER } from "@/lib/reservoir/theme";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";

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
const LABEL_HORIZON_CLEARANCE_START = 0.34;
const LABEL_MAX_HORIZON_CLEARANCE = 0.085;
const LABEL_CLEARANCE_DAMPING = 10;
const LABEL_FADE_DAMPING = 10;
const LABEL_REFERENCE_DISTANCE = 10;
const LABEL_WORLD_UNITS_PER_PIXEL = 0.00135;
const LABEL_NODE_CLEARANCE = 0.012;
const LABEL_ANCHOR_DAMPING = 12;
const LABEL_BRIDGE_RADIUS_MULTIPLIER = 2.8;
const CAROUSEL_HOVER_DWELL_SECONDS = 0.7;
const MARQUEE_SPEED = 105;
const MARQUEE_COPY_GAP = 48;

export type ReservoirNodeLabelContent = {
  accentColor: string;
  eyebrow: string;
  title: string;
};

type ReservoirNodeLabelProps = {
  content: ReservoirNodeLabelContent;
  nodeRef: RefObject<THREE.Group | null>;
  sphereRef: RefObject<THREE.Group | null>;
  reservoirFrame: ReservoirFrame;
  zoomLevel: number;
  nodeRadius: number;
  suppressed: boolean;
  hovered: boolean;
  userData?: Record<string, unknown>;
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

type LabelCanvas = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  titleWidth: number;
  titleClipWidth: number;
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

export function ReservoirNodeLabel({
  content,
  nodeRef,
  sphereRef,
  reservoirFrame,
  zoomLevel,
  nodeRadius,
  suppressed,
  hovered,
  userData,
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
  const clearanceRef = useRef(0);
  const currentLevelRef = useRef<ReservoirLabelLevel>("hidden");
  const fallbackScreenDirectionRef = useRef(
    new THREE.Vector2(1, -0.6).normalize(),
  );
  const worldNode = useRef(new THREE.Vector3());
  const worldCenter = useRef(new THREE.Vector3());
  const worldAnchor = useRef(new THREE.Vector3());
  const worldBridgeAnchor = useRef(new THREE.Vector3());
  const worldScale = useRef(new THREE.Vector3(1, 1, 1));
  const screenNode = useRef(new THREE.Vector2());
  const screenCenter = useRef(new THREE.Vector2());
  const targetScreen = useRef(new THREE.Vector2());
  const screenNdc = useRef(new THREE.Vector2());
  const anchorDirection = useRef(new THREE.Vector2());
  const surfaceNormal = useRef(new THREE.Vector3());
  const referenceViewDirection = useRef(new THREE.Vector3());
  const cameraForward = useRef(new THREE.Vector3());
  const screenRaycaster = useRef(new THREE.Raycaster());
  const anchorPlane = useRef(new THREE.Plane());
  const bridgeLocal = useRef(new THREE.Vector3());
  const localAnchor = useRef(new THREE.Vector3());
  const localBridgeAnchor = useRef(new THREE.Vector3());
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
    const contentWidth = Math.min(
      measuredContentWidth,
      MAX_LABEL_CONTENT_WIDTH,
    );
    canvas.width = Math.ceil(
      contentWidth + LABEL_HORIZONTAL_PADDING * 2,
    );
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
    camera.getWorldDirection(referenceViewDirection.current);
    camera.getWorldDirection(cameraForward.current);

    const facing = surfaceNormal.current.dot(referenceViewDirection.current);
    const isFrontFacing = facing > LABEL_FRONT_FACING_THRESHOLD;
    const projectedNodePixels = getProjectedWorldDiameterPixels({
      camera,
      viewportHeight: size.height,
      worldDiameter: nodeRadius * 2 * worldScale.current.x,
      worldPosition: worldNode.current,
    });
    const labelLevel = getReservoirLabelLevel({
      currentLevel: currentLevelRef.current,
      projectedNodePixels,
      suppressed,
      zoomLevel,
    });
    currentLevelRef.current = labelLevel;
    const eligible = isFrontFacing && labelLevel !== "hidden";
    const targetOpacity = eligible ? 1 : 0;
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      targetOpacity,
      LABEL_FADE_DAMPING,
      delta,
    );
    sprite.visible = material.opacity > 0.01 || targetOpacity > 0;
    bridge.visible = eligible;
    bridgeMaterial.opacity = material.opacity;

    const horizonProximity =
      1 -
      THREE.MathUtils.smoothstep(
        facing,
        LABEL_FRONT_FACING_THRESHOLD,
        LABEL_HORIZON_CLEARANCE_START,
      );
    const targetClearance = isFrontFacing
      ? horizonProximity * LABEL_MAX_HORIZON_CLEARANCE
      : 0;
    clearanceRef.current = THREE.MathUtils.damp(
      clearanceRef.current,
      targetClearance,
      LABEL_CLEARANCE_DAMPING,
      delta,
    );

    const projectedNode = worldNode.current.clone().project(camera);
    screenNode.current.set(
      ((projectedNode.x + 1) / 2) * size.width,
      ((1 - projectedNode.y) / 2) * size.height,
    );
    screenCenter.current.set(
      reservoirFrame.centerScreenX,
      reservoirFrame.centerScreenY,
    );
    anchorDirection.current
      .copy(screenNode.current)
      .sub(screenCenter.current);
    if (anchorDirection.current.lengthSq() < 1) {
      anchorDirection.current.copy(fallbackScreenDirectionRef.current);
    } else {
      anchorDirection.current.normalize();
      fallbackScreenDirectionRef.current.copy(anchorDirection.current);
    }

    const gapPixels = clamp(
      projectedNodePixels * (labelLevel === "persistent" ? 0.68 : 0.58) + 18,
      20,
      120,
    );
    targetScreen.current
      .copy(screenNode.current)
      .addScaledVector(anchorDirection.current, gapPixels);
    const safeLeft = reservoirFrame.safeZones.left + 24;
    const safeRight = size.width - reservoirFrame.safeZones.right - 24;
    const safeTop = reservoirFrame.safeZones.top + 20;
    const safeBottom = size.height - reservoirFrame.safeZones.bottom - 20;
    if (safeLeft <= safeRight) {
      targetScreen.current.x = clamp(
        targetScreen.current.x,
        safeLeft,
        safeRight,
      );
    } else {
      targetScreen.current.x = reservoirFrame.centerScreenX;
    }
    if (safeTop <= safeBottom) {
      targetScreen.current.y = clamp(
        targetScreen.current.y,
        safeTop,
        safeBottom,
      );
    } else {
      targetScreen.current.y = reservoirFrame.centerScreenY;
    }

    const ndcX = (targetScreen.current.x / size.width) * 2 - 1;
    const ndcY = -(targetScreen.current.y / size.height) * 2 + 1;
    screenNdc.current.set(ndcX, ndcY);
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

    localAnchor.current.copy(worldAnchor.current);
    node.worldToLocal(localAnchor.current);
    labelGroup.position.lerp(
      localAnchor.current,
      1 - Math.exp(-LABEL_ANCHOR_DAMPING * delta),
    );

    worldBridgeAnchor.current
      .copy(worldNode.current)
      .lerp(worldAnchor.current, 0.5);
    localBridgeAnchor.current.copy(worldBridgeAnchor.current);
    node.worldToLocal(localBridgeAnchor.current);
    bridgeLocal.current
      .copy(localBridgeAnchor.current)
      .sub(labelGroup.position);
    bridge.position.copy(bridgeLocal.current);

    const distance = camera.position.distanceTo(worldNode.current);
    const distanceCompensation = THREE.MathUtils.clamp(
      Math.sqrt(distance / LABEL_REFERENCE_DISTANCE),
      0.43,
      1.08,
    );
    const labelWorldHeight =
      LABEL_CANVAS_HEIGHT *
      LABEL_WORLD_UNITS_PER_PIXEL *
      distanceCompensation;
    sprite.scale.set(
      labelCanvas.canvas.width *
        LABEL_WORLD_UNITS_PER_PIXEL *
        distanceCompensation,
      labelWorldHeight,
      1,
    );
    const frontFacingProgress = THREE.MathUtils.smoothstep(
      facing,
      LABEL_HORIZON_CLEARANCE_START,
      0.82,
    );
    const frontFacingCenterY =
      0.5 - (nodeRadius + LABEL_NODE_CLEARANCE) / labelWorldHeight;
    sprite.center.set(
      0.5,
      THREE.MathUtils.lerp(
        0.5,
        frontFacingCenterY,
        frontFacingProgress,
      ),
    );

    const titleOverflows =
      labelCanvas.titleWidth > labelCanvas.titleClipWidth;
    if (hovered && titleOverflows) {
      elapsedRef.current += delta;
      const travelDistance =
        labelCanvas.titleWidth + MARQUEE_COPY_GAP;
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
        <sphereGeometry args={[nodeRadius * LABEL_BRIDGE_RADIUS_MULTIPLIER, 12, 10]} />
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
