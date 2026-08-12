import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  RESERVOIR_LABEL_RADIAL_OFFSET,
  reservoirVertices,
  RESERVOIR_NODE_RADIUS,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import {
  RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER,
  RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER,
  RESERVOIR_OPENING_TIMING,
  RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER,
} from "@/lib/reservoir/opening";
import type { ReservoirArtifact } from "@/types/reservoir";
import { ArtifactLabel } from "./ArtifactLabel";

type ArtifactNodeProps = {
  artifact: ReservoirArtifact;
  selected: boolean;
  meshEngaged: boolean;
  selectionActive: boolean;
  hovered: boolean;
  isDragging: boolean;
  selectedPressActive: boolean;
  continuationCueEnabled: boolean;
  interactionRevisionRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  opening: boolean;
  openingSelected: boolean;
  openingElapsedRef: MutableRefObject<number>;
  openingReactionDelay: number;
  openingReducedMotion: boolean;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  sphereRef: RefObject<THREE.Group | null>;
  onHoverChange: (artifactId: string, hovered: boolean) => void;
};

const HOVER_EXIT_GRACE_MS = 140;
const ORB_HOVER_TRANSITION_DURATION = 0.16;
const ORB_HOVER_WHITE_MIX = 0.045;
const ORB_SELECTED_HOVER_WHITE_MIX = 0.16;
const ORB_SELECTED_REVEAL_DURATION = 0.18;
const ORB_SELECTED_RETREAT_DURATION = 0.2;
const ORB_RESTING_RADIAL_OFFSET = 0;
const ORB_SELECTED_RADIAL_OFFSET = -RESERVOIR_NODE_RADIUS * 0.16;
const ORB_PRESS_RADIAL_OFFSET = -RESERVOIR_NODE_RADIUS * 0.38;
export const ORB_MESH_ENGAGEMENT_DELAY_MS = 75;
const ORB_PRESS_DOWN_DURATION = ORB_MESH_ENGAGEMENT_DELAY_MS / 1000;
const ORB_POP_DURATION = 0.125;
const ORB_RELEASE_AFTER_RETRACTION_DELAY = 0.055;
const ORB_RELEASE_DURATION = 0.2;
const ORB_RESTING_EMISSIVE_INTENSITY = 0.06;
const ORB_HOVER_EMISSIVE_INTENSITY = 0.085;
const ORB_SELECTED_HOVER_EMISSIVE_INTENSITY = 0.145;
const ORB_SELECTED_WHITE_GAIN = 0.04;
const ORB_CONTINUATION_FIRST_IDLE_DURATION = 1.6;
const ORB_CONTINUATION_REPEAT_IDLE_DURATIONS = [3.2, 4.0, 3.6] as const;
const ORB_CONTINUATION_DURATION = 0.88;
const ORB_CONTINUATION_BOUNCE_DISTANCE = RESERVOIR_NODE_RADIUS * 0.42;
const ORB_CONTINUATION_RING_SURFACE_OFFSET = RESERVOIR_NODE_RADIUS * -0.01;
const ORB_CONTINUATION_RING_TRAVEL_DISTANCE = RESERVOIR_NODE_RADIUS * 0.78;
const ORB_CONTINUATION_RING_MAX_OPACITY = 0.44;
const ORB_CONTINUATION_RING_START_SCALE = 0.92;
const ORB_CONTINUATION_RING_END_SCALE = 1.56;
const ORB_CONTINUATION_WHITE_MIX = 0.02;
const ORB_REDUCED_MOTION_WHITE_MIX = 0.045;

type OrbShader = Parameters<
  THREE.MeshStandardMaterial["onBeforeCompile"]
>[0];

type OrbShaderUniforms = {
  orbContactDirection: { value: THREE.Vector3 };
  orbSelectedWhite: { value: THREE.Color };
  orbSelectedReveal: { value: number };
};

function moveToward(current: number, target: number, maximumDelta: number) {
  if (current < target) return Math.min(current + maximumDelta, target);
  return Math.max(current - maximumDelta, target);
}

function easeInCubic(progress: number) {
  return progress * progress * progress;
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function getContinuationEnvelope(progress: number) {
  return Math.sin(Math.PI * progress);
}

function getContinuationBounceOffset(progress: number) {
  if (progress < 0.25) {
    return easeOutCubic(progress / 0.25);
  }
  if (progress < 0.5) {
    return THREE.MathUtils.lerp(
      1,
      -0.2,
      easeInCubic((progress - 0.25) / 0.25),
    );
  }
  if (progress < 0.72) {
    return THREE.MathUtils.lerp(
      -0.2,
      0.24,
      easeOutCubic((progress - 0.5) / 0.22),
    );
  }

  return THREE.MathUtils.lerp(
    0.24,
    0,
    easeOutCubic((progress - 0.72) / 0.28),
  );
}

function addSelectedOrbGradient(
  shader: OrbShader,
  uniforms: OrbShaderUniforms,
) {
  shader.uniforms.orbContactDirection = uniforms.orbContactDirection;
  shader.uniforms.orbSelectedWhite = uniforms.orbSelectedWhite;
  shader.uniforms.orbSelectedReveal = uniforms.orbSelectedReveal;
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vOrbLocalPosition;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vOrbLocalPosition = position;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform vec3 orbContactDirection;
      uniform vec3 orbSelectedWhite;
      uniform float orbSelectedReveal;
      varying vec3 vOrbLocalPosition;`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float orbContactAlignment = dot(
        normalize(vOrbLocalPosition),
        normalize(orbContactDirection)
      );
      float orbBottomUpGradient = pow(
        smoothstep(-1.0, 1.0, orbContactAlignment),
        1.35
      );
      float orbRevealThreshold = 1.0 - orbSelectedReveal;
      float orbRevealMask = smoothstep(
        orbRevealThreshold - 0.12,
        orbRevealThreshold + 0.02,
        orbBottomUpGradient
      ) * smoothstep(0.0, 0.08, orbSelectedReveal);
      float orbSelectedWhiteMix =
        orbBottomUpGradient * orbRevealMask * ${ORB_SELECTED_WHITE_GAIN.toFixed(2)};
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        orbSelectedWhite,
        orbSelectedWhiteMix
      );`,
    );
}

export function ArtifactNode({
  artifact,
  selected,
  meshEngaged,
  selectionActive,
  hovered,
  isDragging,
  selectedPressActive,
  continuationCueEnabled,
  interactionRevisionRef,
  diagnosticsRef,
  opening,
  openingSelected,
  openingElapsedRef,
  openingReactionDelay,
  openingReducedMotion,
  restoring,
  restorationProgressRef,
  sphereRef,
  onHoverChange,
}: ArtifactNodeProps) {
  const nodeRef = useRef<THREE.Group | null>(null);
  const visualOrbRef = useRef<THREE.Mesh | null>(null);
  const orbMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const continuationRingRef = useRef<THREE.Mesh | null>(null);
  const continuationRingMaterialRef =
    useRef<THREE.MeshBasicMaterial | null>(null);
  const hoverExitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTargets = useRef(new Set<string>());
  const vertex = reservoirVertices[artifact.vertexId];
  const artifactColor = useMemo(
    () => new THREE.Color(artifact.color),
    [artifact.color],
  );
  const hoverColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.inspection),
    [],
  );
  const hoverProgress = useRef(!selected && hovered ? 1 : 0);
  const selectedRevealProgress = useRef(
    selected && meshEngaged ? 1 : 0,
  );
  const radialOffset = useRef(
    selected
      ? ORB_SELECTED_RADIAL_OFFSET
      : ORB_RESTING_RADIAL_OFFSET,
  );
  const previousSelected = useRef(selected);
  const previousMeshEngaged = useRef(meshEngaged);
  const pressElapsed = useRef(0);
  const pressStartOffset = useRef(ORB_RESTING_RADIAL_OFFSET);
  const pressActive = useRef(false);
  const popElapsed = useRef(0);
  const popStartOffset = useRef(ORB_PRESS_RADIAL_OFFSET);
  const popActive = useRef(false);
  const releaseDelayElapsed = useRef(0);
  const releaseDelayActive = useRef(false);
  const releaseElapsed = useRef(0);
  const releaseStartOffset = useRef(ORB_SELECTED_RADIAL_OFFSET);
  const releaseActive = useRef(false);
  const continuationIdleElapsed = useRef(0);
  const continuationCueElapsed = useRef(0);
  const continuationCueActive = useRef(false);
  const continuationCueCount = useRef(0);
  const continuationNextIdleDuration = useRef(
    ORB_CONTINUATION_FIRST_IDLE_DURATION,
  );
  const previousInteractionRevision = useRef(-1);
  const reducedMotion = useRef(false);
  const orbShaderUniforms = useRef<OrbShaderUniforms>({
    orbContactDirection: {
      value: vertex
        ? vertex.clone().normalize().negate()
        : new THREE.Vector3(0, -1, 0),
    },
    orbSelectedWhite: {
      value: new THREE.Color(RESERVOIR_THEME.inspection),
    },
    orbSelectedReveal: {
      value: selected && meshEngaged ? 1 : 0,
    },
  });
  const configureOrbMaterial = useCallback((shader: OrbShader) => {
    addSelectedOrbGradient(shader, orbShaderUniforms.current);
  }, []);
  const getOrbProgramCacheKey = useCallback(
    () => "reservoir-orb-white-reveal-gradient-v3",
    [],
  );

  useEffect(
    () => () => {
      if (hoverExitTimeout.current) clearTimeout(hoverExitTimeout.current);
      hoverTargets.current.clear();
    },
    [],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotion.current = mediaQuery.matches;
    };

    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  function beginHover(target: string) {
    hoverTargets.current.add(target);
    if (hoverExitTimeout.current) {
      clearTimeout(hoverExitTimeout.current);
      hoverExitTimeout.current = null;
    }
    onHoverChange(artifact.id, true);
  }

  function endHover(target: string) {
    hoverTargets.current.delete(target);
    if (hoverTargets.current.size > 0) return;
    if (hoverExitTimeout.current) clearTimeout(hoverExitTimeout.current);
    hoverExitTimeout.current = setTimeout(() => {
      hoverExitTimeout.current = null;
      if (hoverTargets.current.size > 0) return;
      onHoverChange(artifact.id, false);
    }, HOVER_EXIT_GRACE_MS);
  }

  const placement = useMemo(() => {
    if (!vertex) return null;

    const normal = vertex.clone().normalize();
    const position = normal
      .clone()
      .multiplyScalar(
        RESERVOIR_RADIUS + RESERVOIR_NODE_RADIUS * 0.04,
      );
    const labelPosition = normal
      .clone()
      .multiplyScalar(RESERVOIR_LABEL_RADIAL_OFFSET);
    const hoverBridgePosition = labelPosition.clone().multiplyScalar(0.52);
    const ringQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal,
    );

    return {
      normal,
      position,
      labelPosition,
      hoverBridgePosition,
      ringQuaternion,
    };
  }, [vertex]);

  useFrame((_, delta) => {
    const visualOrb = visualOrbRef.current;
    const material = orbMaterialRef.current;
    if (!visualOrb || !material || !placement) return;

    const continuationRing = continuationRingRef.current;
    const continuationRingMaterial = continuationRingMaterialRef.current;

    if (previousSelected.current !== selected) {
      previousSelected.current = selected;
      continuationIdleElapsed.current = 0;
      continuationCueElapsed.current = 0;
      continuationCueActive.current = false;
      continuationCueCount.current = 0;
      continuationNextIdleDuration.current =
        ORB_CONTINUATION_FIRST_IDLE_DURATION;
      if (selected) {
        pressElapsed.current = 0;
        pressStartOffset.current = radialOffset.current;
        pressActive.current = true;
        popActive.current = false;
        releaseDelayActive.current = false;
        releaseActive.current = false;
      } else {
        pressActive.current = false;
        popActive.current = false;
        releaseDelayElapsed.current = 0;
        releaseDelayActive.current = true;
        releaseActive.current = false;
      }
    }

    if (previousMeshEngaged.current !== meshEngaged) {
      previousMeshEngaged.current = meshEngaged;
      if (selected && meshEngaged) {
        popElapsed.current = 0;
        popStartOffset.current = radialOffset.current;
        popActive.current = true;
        pressActive.current = false;
      }
    }

    if (releaseDelayActive.current) {
      releaseDelayElapsed.current += delta;
      if (
        releaseDelayElapsed.current >=
        ORB_RELEASE_AFTER_RETRACTION_DELAY
      ) {
        releaseDelayActive.current = false;
        releaseElapsed.current = 0;
        releaseStartOffset.current = radialOffset.current;
        releaseActive.current = true;
      }
    }

    const hoverTarget =
      !releaseDelayActive.current &&
      !releaseActive.current &&
      hovered
        ? 1
        : 0;
    hoverProgress.current = moveToward(
      hoverProgress.current,
      hoverTarget,
      delta / ORB_HOVER_TRANSITION_DURATION,
    );
    const selectedRevealTarget = selected
      ? meshEngaged
        ? 1
        : 0
      : releaseDelayActive.current
        ? selectedRevealProgress.current
        : 0;
    selectedRevealProgress.current = moveToward(
      selectedRevealProgress.current,
      selectedRevealTarget,
      delta /
        (selectedRevealTarget > selectedRevealProgress.current
          ? ORB_SELECTED_REVEAL_DURATION
          : ORB_SELECTED_RETREAT_DURATION),
    );
    orbShaderUniforms.current.orbSelectedReveal.value =
      selectedRevealProgress.current;

    if (pressActive.current) {
      pressElapsed.current += delta;
      const elapsed = pressElapsed.current;
      if (elapsed <= ORB_PRESS_DOWN_DURATION) {
        const progress = Math.min(elapsed / ORB_PRESS_DOWN_DURATION, 1);
        radialOffset.current = THREE.MathUtils.lerp(
          pressStartOffset.current,
          ORB_PRESS_RADIAL_OFFSET,
          easeInCubic(progress),
        );
      } else {
        radialOffset.current = ORB_PRESS_RADIAL_OFFSET;
        pressActive.current = false;
      }
    } else if (popActive.current) {
      popElapsed.current += delta;
      const progress = Math.min(popElapsed.current / ORB_POP_DURATION, 1);
      radialOffset.current = THREE.MathUtils.lerp(
        popStartOffset.current,
        ORB_SELECTED_RADIAL_OFFSET,
        easeOutCubic(progress),
      );
      if (progress === 1) popActive.current = false;
    } else if (releaseDelayActive.current) {
      // Hold the current physical state until mesh retraction is underway.
    } else if (releaseActive.current) {
      releaseElapsed.current += delta;
      const progress = Math.min(
        releaseElapsed.current / ORB_RELEASE_DURATION,
        1,
      );
      radialOffset.current = THREE.MathUtils.lerp(
        releaseStartOffset.current,
        ORB_RESTING_RADIAL_OFFSET,
        easeOutCubic(progress),
      );
      if (progress === 1) releaseActive.current = false;
    } else {
      radialOffset.current = selected
        ? meshEngaged
          ? ORB_SELECTED_RADIAL_OFFSET
          : ORB_PRESS_RADIAL_OFFSET
        : ORB_RESTING_RADIAL_OFFSET;
    }

    const interactionChanged =
      previousInteractionRevision.current !== interactionRevisionRef.current;
    if (interactionChanged) {
      previousInteractionRevision.current = interactionRevisionRef.current;
    }

    const selectionSettled =
      selected &&
      meshEngaged &&
      selectedRevealProgress.current >= 1 &&
      !pressActive.current &&
      !popActive.current &&
      !releaseDelayActive.current &&
      !releaseActive.current;
    const continuationBlocked =
      !continuationCueEnabled ||
      !selectionSettled ||
      selectedPressActive ||
      (hovered && !isDragging);
    let continuationOffset = 0;
    let continuationWhiteMix = 0;

    if (continuationBlocked) {
      continuationIdleElapsed.current = 0;
      continuationCueElapsed.current = 0;
      continuationCueActive.current = false;
    } else if (continuationCueActive.current) {
      continuationCueElapsed.current += delta;
      const progress = Math.min(
        continuationCueElapsed.current / ORB_CONTINUATION_DURATION,
        1,
      );
      const envelope = getContinuationEnvelope(progress);

      if (reducedMotion.current) {
        continuationWhiteMix = envelope * ORB_REDUCED_MOTION_WHITE_MIX;
      } else {
        continuationOffset =
          getContinuationBounceOffset(progress) *
          ORB_CONTINUATION_BOUNCE_DISTANCE;
        continuationWhiteMix = envelope * ORB_CONTINUATION_WHITE_MIX;

        if (continuationRing && continuationRingMaterial) {
          const travelProgress = easeOutCubic(progress);
          continuationRing.visible = true;
          continuationRing.position
            .copy(placement.normal)
            .multiplyScalar(
              ORB_CONTINUATION_RING_SURFACE_OFFSET +
                travelProgress * ORB_CONTINUATION_RING_TRAVEL_DISTANCE,
            );
          continuationRing.scale.setScalar(
            THREE.MathUtils.lerp(
              ORB_CONTINUATION_RING_START_SCALE,
              ORB_CONTINUATION_RING_END_SCALE,
              travelProgress,
            ),
          );
          continuationRingMaterial.opacity =
            envelope * ORB_CONTINUATION_RING_MAX_OPACITY;
        }
      }

      if (progress === 1) {
        continuationCueActive.current = false;
        continuationCueElapsed.current = 0;
        continuationCueCount.current += 1;
        continuationNextIdleDuration.current =
          ORB_CONTINUATION_REPEAT_IDLE_DURATIONS[
            (continuationCueCount.current - 1) %
              ORB_CONTINUATION_REPEAT_IDLE_DURATIONS.length
          ];
      }
    } else {
      continuationIdleElapsed.current += delta;
      if (
        continuationIdleElapsed.current >=
        continuationNextIdleDuration.current
      ) {
        continuationIdleElapsed.current = 0;
        continuationCueElapsed.current = 0;
        continuationCueActive.current = true;
      }
    }

    if (
      continuationRing &&
      continuationRingMaterial &&
      (!continuationCueActive.current || reducedMotion.current)
    ) {
      continuationRing.visible = false;
      continuationRingMaterial.opacity = 0;
    }

    let renderedRadialOffset = radialOffset.current + continuationOffset;
    let openingReactionProgress = 0;

    if (opening) {
      const reactionDuration = openingReducedMotion
        ? RESERVOIR_OPENING_TIMING.reducedMotionNodeReactionDuration
        : openingSelected
          ? RESERVOIR_OPENING_TIMING.selectedEmbedDuration
          : RESERVOIR_OPENING_TIMING.nodeReactionDuration;
      openingReactionProgress = THREE.MathUtils.clamp(
        (openingElapsedRef.current - openingReactionDelay) / reactionDuration,
        0,
        1,
      );
      const startOffset = openingSelected
        ? ORB_SELECTED_RADIAL_OFFSET
        : ORB_RESTING_RADIAL_OFFSET;
      const targetOffset =
        RESERVOIR_NODE_RADIUS *
        (openingSelected
          ? RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER
          : RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER);

      if (openingReducedMotion) {
        renderedRadialOffset = THREE.MathUtils.lerp(
          startOffset,
          targetOffset,
          easeOutCubic(openingReactionProgress),
        );
      } else if (openingSelected) {
        renderedRadialOffset = THREE.MathUtils.lerp(
          startOffset,
          targetOffset,
          easeOutCubic(openingReactionProgress),
        );
      } else {
        const perkEnd = 0.24;
        const perkOffset =
          RESERVOIR_NODE_RADIUS * RESERVOIR_NODE_PERK_OFFSET_MULTIPLIER;

        if (openingReactionProgress <= perkEnd) {
          renderedRadialOffset = THREE.MathUtils.lerp(
            startOffset,
            startOffset + perkOffset,
            easeOutCubic(openingReactionProgress / perkEnd),
          );
        } else {
          renderedRadialOffset = THREE.MathUtils.lerp(
            startOffset + perkOffset,
            targetOffset,
            easeInCubic(
              (openingReactionProgress - perkEnd) / (1 - perkEnd),
            ),
          );
        }
      }
    }

    if (restoring) {
      const restorationProgress = restorationProgressRef.current;
      const openingOffset =
        RESERVOIR_NODE_RADIUS *
        (openingSelected
          ? RESERVOIR_EMBEDDED_NODE_OFFSET_MULTIPLIER
          : RESERVOIR_RECESSED_NODE_OFFSET_MULTIPLIER);
      const restoredOffset = openingSelected
        ? ORB_SELECTED_RADIAL_OFFSET
        : ORB_RESTING_RADIAL_OFFSET;

      renderedRadialOffset = THREE.MathUtils.lerp(
        openingOffset,
        restoredOffset,
        restorationProgress,
      );
      openingReactionProgress = 1 - restorationProgress;
    }

    visualOrb.position
      .copy(placement.normal)
      .multiplyScalar(renderedRadialOffset);
    visualOrb.userData.currentRadialOffset = renderedRadialOffset;
    visualOrb.userData.openingReactionProgress = openingReactionProgress;
    const hoverWhiteMix = selected
      ? ORB_SELECTED_HOVER_WHITE_MIX
      : ORB_HOVER_WHITE_MIX;
    const totalWhiteMix = Math.min(
      hoverProgress.current * hoverWhiteMix + continuationWhiteMix,
      1,
    );
    if (selected && diagnosticsRef.current) {
      diagnosticsRef.current.dataset.continuationCueActive = String(
        continuationCueActive.current,
      );
      diagnosticsRef.current.dataset.continuationCueCount = String(
        continuationCueCount.current,
      );
      diagnosticsRef.current.dataset.continuationCueOffset =
        continuationOffset.toFixed(6);
      diagnosticsRef.current.dataset.continuationRingOpacity = (
        continuationRingMaterial?.opacity ?? 0
      ).toFixed(6);
      diagnosticsRef.current.dataset.continuationWhiteMix =
        continuationWhiteMix.toFixed(6);
      diagnosticsRef.current.dataset.continuationReducedMotion = String(
        reducedMotion.current,
      );
      diagnosticsRef.current.dataset.selectedHoverProgress =
        hoverProgress.current.toFixed(6);
      diagnosticsRef.current.dataset.selectedNodeRadialOffset = (
        renderedRadialOffset
      ).toFixed(6);
      diagnosticsRef.current.dataset.selectedOpeningReactionProgress =
        openingReactionProgress.toFixed(6);
      diagnosticsRef.current.dataset.continuationTraversalAllowed = "true";
    }
    material.color
      .copy(artifactColor)
      .lerp(hoverColor, totalWhiteMix);
    material.emissive
      .copy(artifactColor)
      .lerp(hoverColor, totalWhiteMix);
    material.emissiveIntensity = THREE.MathUtils.lerp(
      ORB_RESTING_EMISSIVE_INTENSITY,
      selected
        ? ORB_SELECTED_HOVER_EMISSIVE_INTENSITY
        : ORB_HOVER_EMISSIVE_INTENSITY,
      Math.max(
        hoverProgress.current,
        continuationWhiteMix / ORB_REDUCED_MOTION_WHITE_MIX,
      ),
    );
  });

  if (!placement) return null;

  return (
    <group ref={nodeRef} position={placement.position}>
      <mesh
        ref={continuationRingRef}
        visible={false}
        quaternion={placement.ringQuaternion}
        renderOrder={RESERVOIR_RENDER_ORDER.artifactNode}
      >
        <ringGeometry
          args={[
            RESERVOIR_NODE_RADIUS * 1.08,
            RESERVOIR_NODE_RADIUS * 1.18,
            40,
          ]}
        />
        <meshBasicMaterial
          ref={continuationRingMaterialRef}
          color={RESERVOIR_THEME.inspection}
          transparent
          opacity={0}
          depthTest
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        ref={visualOrbRef}
        userData={{ artifactId: artifact.id }}
        renderOrder={RESERVOIR_RENDER_ORDER.artifactNode}
        onPointerEnter={() => beginHover("orb")}
        onPointerLeave={() => endHover("orb")}
      >
        <sphereGeometry args={[RESERVOIR_NODE_RADIUS, 18, 14]} />
        <meshStandardMaterial
          ref={orbMaterialRef}
          color={artifact.color}
          emissive={artifact.color}
          emissiveIntensity={ORB_RESTING_EMISSIVE_INTENSITY}
          roughness={0.82}
          onBeforeCompile={configureOrbMaterial}
          customProgramCacheKey={getOrbProgramCacheKey}
        />
      </mesh>
      <mesh
        userData={{ artifactId: artifact.id }}
        onPointerEnter={() => beginHover("orb-hit-area")}
        onPointerLeave={() => endHover("orb-hit-area")}
      >
        <sphereGeometry args={[RESERVOIR_NODE_RADIUS * 2.15, 12, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
      <mesh
        position={placement.hoverBridgePosition}
        onPointerEnter={() => beginHover("label-bridge")}
        onPointerLeave={() => endHover("label-bridge")}
      >
        <sphereGeometry args={[RESERVOIR_NODE_RADIUS * 2.8, 12, 10]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
      <ArtifactLabel
        artifact={artifact}
        nodeRef={nodeRef}
        sphereRef={sphereRef}
        position={placement.labelPosition}
        selectionActive={selectionActive}
        hovered={hovered}
        onPointerEnter={() => beginHover("label")}
        onPointerLeave={() => endHover("label")}
      />
    </group>
  );
}
