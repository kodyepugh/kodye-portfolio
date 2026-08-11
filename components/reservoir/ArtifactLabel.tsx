import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import type { ReservoirArtifact } from "@/types/reservoir";

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
const CAROUSEL_HOVER_DWELL_SECONDS = 0.7;
const MARQUEE_SPEED = 105;
const MARQUEE_COPY_GAP = 48;

type ArtifactLabelProps = {
  artifact: ReservoirArtifact;
  nodeRef: RefObject<THREE.Group | null>;
  sphereRef: RefObject<THREE.Group | null>;
  position: THREE.Vector3;
  selected: boolean;
  selectionActive: boolean;
  hovered: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

type LabelCanvas = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  titleWidth: number;
  titleClipWidth: number;
};

function drawLabel(
  labelCanvas: LabelCanvas,
  artifact: ReservoirArtifact,
  titleOffset: number,
  repeatTitle: boolean,
) {
  const { canvas, context, texture, titleWidth, titleClipWidth } = labelCanvas;
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = artifact.color;
  context.fillRect(LABEL_HORIZONTAL_PADDING, 22, LABEL_ACCENT_WIDTH, 5);

  context.font = "600 23px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = RESERVOIR_THEME.labelMuted;
  context.textBaseline = "alphabetic";
  context.fillText(
    artifact.type.toUpperCase(),
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
    artifact.title,
    LABEL_HORIZONTAL_PADDING - titleOffset,
    LABEL_TITLE_Y,
  );

  if (repeatTitle) {
    context.fillText(
      artifact.title,
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

export function ArtifactLabel({
  artifact,
  nodeRef,
  sphereRef,
  position,
  selected,
  selectionActive,
  hovered,
  onPointerEnter,
  onPointerLeave,
}: ArtifactLabelProps) {
  const spriteRef = useRef<THREE.Sprite | null>(null);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);
  const labelCanvasRef = useRef<LabelCanvas | null>(null);
  const elapsedRef = useRef(0);
  const lastOffsetRef = useRef(Number.NaN);
  const clearanceRef = useRef(0);
  const worldNode = useRef(new THREE.Vector3());
  const worldCenter = useRef(new THREE.Vector3());
  const referenceViewDirection = useRef(new THREE.Vector3());
  const surfaceNormal = useRef(new THREE.Vector3());
  const localRadialDirection = useMemo(
    () => position.clone().normalize(),
    [position],
  );

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = MAX_LABEL_WIDTH;
    canvas.height = LABEL_CANVAS_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = "540 38px ui-monospace, SFMono-Regular, Menlo, monospace";
    const titleWidth = context.measureText(artifact.title).width;
    context.font = "600 23px ui-monospace, SFMono-Regular, Menlo, monospace";
    const typeWidth = context.measureText(artifact.type.toUpperCase()).width;
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
    drawLabel(labelCanvas, artifact, 0, false);
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
  }, [artifact]);

  useFrame(({ camera }, delta) => {
    const sprite = spriteRef.current;
    const material = materialRef.current;
    const node = nodeRef.current;
    const sphere = sphereRef.current;
    const labelCanvas = labelCanvasRef.current;
    if (!sprite || !material || !node || !sphere || !labelCanvas) return;

    node.getWorldPosition(worldNode.current);
    sphere.getWorldPosition(worldCenter.current);
    surfaceNormal.current
      .copy(worldNode.current)
      .sub(worldCenter.current)
      .normalize();
    camera.getWorldDirection(referenceViewDirection.current).negate();

    const facing = surfaceNormal.current.dot(referenceViewDirection.current);
    const isFrontFacing = facing > LABEL_FRONT_FACING_THRESHOLD;
    const eligible =
      isFrontFacing && (!selectionActive || selected);
    const targetOpacity = eligible ? 1 : 0;
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      targetOpacity,
      LABEL_FADE_DAMPING,
      delta,
    );
    sprite.visible = material.opacity > 0.01 || targetOpacity > 0;

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
    sprite.position
      .copy(position)
      .addScaledVector(localRadialDirection, clearanceRef.current);

    const distance = camera.position.distanceTo(worldNode.current);
    const distanceCompensation = THREE.MathUtils.clamp(
      Math.sqrt(distance / LABEL_REFERENCE_DISTANCE),
      0.43,
      1.08,
    );
    sprite.scale.set(
      labelCanvas.canvas.width *
        LABEL_WORLD_UNITS_PER_PIXEL *
        distanceCompensation,
      LABEL_CANVAS_HEIGHT *
        LABEL_WORLD_UNITS_PER_PIXEL *
        distanceCompensation,
      1,
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
        drawLabel(labelCanvas, artifact, titleOffset, true);
        lastOffsetRef.current = titleOffset;
      }
    } else if (elapsedRef.current !== 0 || lastOffsetRef.current !== 0) {
      elapsedRef.current = 0;
      lastOffsetRef.current = 0;
      drawLabel(labelCanvas, artifact, 0, false);
    }
  });

  return (
    <sprite
      ref={spriteRef}
      position={position}
      renderOrder={RESERVOIR_RENDER_ORDER.artifactLabel}
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
  );
}
