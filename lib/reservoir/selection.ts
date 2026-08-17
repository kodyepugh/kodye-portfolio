import * as THREE from "three";

export const RESERVOIR_NODE_MESH_ENGAGEMENT_DELAY_MS = 75;
export const RESERVOIR_NODE_PRESS_DOWN_DURATION =
  RESERVOIR_NODE_MESH_ENGAGEMENT_DELAY_MS / 1000;
export const RESERVOIR_NODE_POP_DURATION = 0.125;
export const RESERVOIR_NODE_RELEASE_DELAY = 0.055;
export const RESERVOIR_NODE_RELEASE_DURATION = 0.2;
export const RESERVOIR_NODE_SELECTED_REVEAL_DURATION = 0.18;
export const RESERVOIR_NODE_SELECTED_RETREAT_DURATION = 0.2;
export const RESERVOIR_NODE_SELECTED_RADIAL_RATIO = -0.16;
export const RESERVOIR_NODE_PRESS_RADIAL_RATIO = -0.38;
export const RESERVOIR_NODE_SELECTED_HOVER_WHITE_MIX = 0.16;
export const RESERVOIR_NODE_SELECTED_HOVER_EMISSIVE_INTENSITY = 0.145;
export const RESERVOIR_NODE_SELECTED_WHITE_GAIN = 0.04;
export const RESERVOIR_NODE_CONTINUATION_FIRST_IDLE_DURATION = 1.6;
export const RESERVOIR_NODE_CONTINUATION_REPEAT_IDLE_DURATIONS = [
  3.2,
  4.0,
  3.6,
] as const;
export const RESERVOIR_NODE_CONTINUATION_DURATION = 0.88;
export const RESERVOIR_NODE_CONTINUATION_BOUNCE_RATIO = 0.42;
export const RESERVOIR_NODE_CONTINUATION_RING_SURFACE_RATIO = -0.01;
export const RESERVOIR_NODE_CONTINUATION_RING_TRAVEL_RATIO = 0.78;
export const RESERVOIR_NODE_CONTINUATION_RING_MAX_OPACITY = 0.44;
export const RESERVOIR_NODE_CONTINUATION_RING_START_SCALE = 0.92;
export const RESERVOIR_NODE_CONTINUATION_RING_END_SCALE = 1.56;
export const RESERVOIR_NODE_CONTINUATION_RING_INNER_RADIUS_RATIO = 1.08;
export const RESERVOIR_NODE_CONTINUATION_RING_OUTER_RADIUS_RATIO = 1.18;
export const RESERVOIR_NODE_CONTINUATION_WHITE_MIX = 0.02;
export const RESERVOIR_NODE_REDUCED_MOTION_WHITE_MIX = 0.045;

export type ReservoirNodeSelectionState = {
  continuationCueActive: boolean;
  continuationCueCount: number;
  continuationCueElapsed: number;
  continuationIdleElapsed: number;
  continuationNextIdleDuration: number;
  popActive: boolean;
  popElapsed: number;
  popStartOffset: number;
  pressActive: boolean;
  pressElapsed: number;
  pressStartOffset: number;
  previousMeshEngaged: boolean;
  previousSelected: boolean;
  radialOffset: number;
  releaseActive: boolean;
  releaseDelayActive: boolean;
  releaseDelayElapsed: number;
  releaseElapsed: number;
  releaseStartOffset: number;
  selectedReveal: number;
};

export type ReservoirNodeSelectionFrame = {
  continuationCueActive: boolean;
  continuationCueCount: number;
  continuationOffset: number;
  continuationWhiteMix: number;
  radialOffset: number;
  ringOpacity: number;
  ringRadialOffset: number;
  ringScale: number;
  ringVisible: boolean;
  selectedReveal: number;
  selectionSettled: boolean;
};

type AdvanceReservoirNodeSelectionOptions = {
  continuationCueEnabled: boolean;
  delta: number;
  hovered: boolean;
  isDragging: boolean;
  meshEngaged: boolean;
  nodeRadius: number;
  reducedMotion: boolean;
  selected: boolean;
  selectedPressActive: boolean;
};

type SelectedSurfaceShader = Parameters<
  THREE.MeshStandardMaterial["onBeforeCompile"]
>[0];

export type ReservoirSelectedSurfaceUniforms = {
  nodeContactDirection: { value: THREE.Vector3 };
  nodeSelectedWhite: { value: THREE.Color };
  nodeSelectedReveal: { value: number };
};

export type ReservoirCollectionActivationUniforms = {
  nodeActiveColor: { value: THREE.Color };
  nodeActivationProgress: { value: number };
};

export type ReservoirSelectedGridUniforms = {
  baseColor: { value: THREE.Color };
  selectedColor: { value: THREE.Color };
  contactDirection: { value: THREE.Vector3 };
  baseOpacity: { value: number };
  selectedReveal: { value: number };
};

export function easeInCubic(progress: number) {
  return progress * progress * progress;
}

export function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function moveToward(current: number, target: number, step: number) {
  if (current < target) return Math.min(current + step, target);
  if (current > target) return Math.max(current - step, target);
  return current;
}

function getContinuationEnvelope(progress: number) {
  return Math.sin(Math.PI * progress);
}

function getContinuationBounceOffset(progress: number) {
  if (progress < 0.25) return easeOutCubic(progress / 0.25);
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

export function createReservoirNodeSelectionState({
  meshEngaged,
  nodeRadius,
  selected,
}: Pick<
  AdvanceReservoirNodeSelectionOptions,
  "meshEngaged" | "nodeRadius" | "selected"
>): ReservoirNodeSelectionState {
  const selectedOffset = nodeRadius * RESERVOIR_NODE_SELECTED_RADIAL_RATIO;
  return {
    continuationCueActive: false,
    continuationCueCount: 0,
    continuationCueElapsed: 0,
    continuationIdleElapsed: 0,
    continuationNextIdleDuration:
      RESERVOIR_NODE_CONTINUATION_FIRST_IDLE_DURATION,
    popActive: false,
    popElapsed: 0,
    popStartOffset: nodeRadius * RESERVOIR_NODE_PRESS_RADIAL_RATIO,
    pressActive: false,
    pressElapsed: 0,
    pressStartOffset: 0,
    previousMeshEngaged: meshEngaged,
    previousSelected: selected,
    radialOffset: selected ? selectedOffset : 0,
    releaseActive: false,
    releaseDelayActive: false,
    releaseDelayElapsed: 0,
    releaseElapsed: 0,
    releaseStartOffset: selectedOffset,
    selectedReveal: selected && meshEngaged ? 1 : 0,
  };
}

export function advanceReservoirNodeSelection(
  state: ReservoirNodeSelectionState,
  {
    continuationCueEnabled,
    delta,
    hovered,
    isDragging,
    meshEngaged,
    nodeRadius,
    reducedMotion,
    selected,
    selectedPressActive,
  }: AdvanceReservoirNodeSelectionOptions,
): ReservoirNodeSelectionFrame {
  const restingOffset = 0;
  const selectedOffset = nodeRadius * RESERVOIR_NODE_SELECTED_RADIAL_RATIO;
  const pressOffset = nodeRadius * RESERVOIR_NODE_PRESS_RADIAL_RATIO;

  if (state.previousSelected !== selected) {
    state.previousSelected = selected;
    state.continuationIdleElapsed = 0;
    state.continuationCueElapsed = 0;
    state.continuationCueActive = false;
    state.continuationCueCount = 0;
    state.continuationNextIdleDuration =
      RESERVOIR_NODE_CONTINUATION_FIRST_IDLE_DURATION;
    if (selected) {
      state.pressElapsed = 0;
      state.pressStartOffset = state.radialOffset;
      state.pressActive = true;
      state.popActive = false;
      state.releaseDelayActive = false;
      state.releaseActive = false;
    } else {
      state.pressActive = false;
      state.popActive = false;
      state.releaseDelayElapsed = 0;
      state.releaseDelayActive = true;
      state.releaseActive = false;
    }
  }

  if (state.previousMeshEngaged !== meshEngaged) {
    state.previousMeshEngaged = meshEngaged;
    if (selected && meshEngaged) {
      state.popElapsed = 0;
      state.popStartOffset = state.radialOffset;
      state.popActive = true;
      state.pressActive = false;
    }
  }

  if (state.releaseDelayActive) {
    state.releaseDelayElapsed += delta;
    if (state.releaseDelayElapsed >= RESERVOIR_NODE_RELEASE_DELAY) {
      state.releaseDelayActive = false;
      state.releaseElapsed = 0;
      state.releaseStartOffset = state.radialOffset;
      state.releaseActive = true;
    }
  }

  const selectedRevealTarget = selected
    ? meshEngaged
      ? 1
      : 0
    : state.releaseDelayActive
      ? state.selectedReveal
      : 0;
  state.selectedReveal = moveToward(
    state.selectedReveal,
    selectedRevealTarget,
    delta /
      (selectedRevealTarget > state.selectedReveal
        ? RESERVOIR_NODE_SELECTED_REVEAL_DURATION
        : RESERVOIR_NODE_SELECTED_RETREAT_DURATION),
  );

  if (state.pressActive) {
    state.pressElapsed += delta;
    if (state.pressElapsed <= RESERVOIR_NODE_PRESS_DOWN_DURATION) {
      const progress = Math.min(
        state.pressElapsed / RESERVOIR_NODE_PRESS_DOWN_DURATION,
        1,
      );
      state.radialOffset = THREE.MathUtils.lerp(
        state.pressStartOffset,
        pressOffset,
        easeInCubic(progress),
      );
    } else {
      state.radialOffset = pressOffset;
      state.pressActive = false;
    }
  } else if (state.popActive) {
    state.popElapsed += delta;
    const progress = Math.min(
      state.popElapsed / RESERVOIR_NODE_POP_DURATION,
      1,
    );
    state.radialOffset = THREE.MathUtils.lerp(
      state.popStartOffset,
      selectedOffset,
      easeOutCubic(progress),
    );
    if (progress === 1) state.popActive = false;
  } else if (state.releaseDelayActive) {
    // Hold physical depth until the selected-node release transition begins.
  } else if (state.releaseActive) {
    state.releaseElapsed += delta;
    const progress = Math.min(
      state.releaseElapsed / RESERVOIR_NODE_RELEASE_DURATION,
      1,
    );
    state.radialOffset = THREE.MathUtils.lerp(
      state.releaseStartOffset,
      restingOffset,
      easeOutCubic(progress),
    );
    if (progress === 1) state.releaseActive = false;
  } else {
    state.radialOffset = selected
      ? meshEngaged
        ? selectedOffset
        : pressOffset
      : restingOffset;
  }

  const selectionSettled =
    selected &&
    meshEngaged &&
    state.selectedReveal >= 1 &&
    !state.pressActive &&
    !state.popActive &&
    !state.releaseDelayActive &&
    !state.releaseActive;
  const continuationBlocked =
    !continuationCueEnabled ||
    !selectionSettled ||
    selectedPressActive ||
    (hovered && !isDragging);
  let continuationOffset = 0;
  let continuationWhiteMix = 0;
  let ringOpacity = 0;
  let ringRadialOffset = nodeRadius * RESERVOIR_NODE_CONTINUATION_RING_SURFACE_RATIO;
  let ringScale = RESERVOIR_NODE_CONTINUATION_RING_START_SCALE;
  let ringVisible = false;

  if (continuationBlocked) {
    state.continuationIdleElapsed = 0;
    state.continuationCueElapsed = 0;
    state.continuationCueActive = false;
  } else if (state.continuationCueActive) {
    state.continuationCueElapsed += delta;
    const progress = Math.min(
      state.continuationCueElapsed / RESERVOIR_NODE_CONTINUATION_DURATION,
      1,
    );
    const envelope = getContinuationEnvelope(progress);
    if (reducedMotion) {
      continuationWhiteMix =
        envelope * RESERVOIR_NODE_REDUCED_MOTION_WHITE_MIX;
    } else {
      continuationOffset =
        getContinuationBounceOffset(progress) *
        nodeRadius *
        RESERVOIR_NODE_CONTINUATION_BOUNCE_RATIO;
      continuationWhiteMix =
        envelope * RESERVOIR_NODE_CONTINUATION_WHITE_MIX;
      const travelProgress = easeOutCubic(progress);
      ringVisible = true;
      ringRadialOffset =
        nodeRadius *
        (RESERVOIR_NODE_CONTINUATION_RING_SURFACE_RATIO +
          travelProgress * RESERVOIR_NODE_CONTINUATION_RING_TRAVEL_RATIO);
      ringScale = THREE.MathUtils.lerp(
        RESERVOIR_NODE_CONTINUATION_RING_START_SCALE,
        RESERVOIR_NODE_CONTINUATION_RING_END_SCALE,
        travelProgress,
      );
      ringOpacity =
        envelope * RESERVOIR_NODE_CONTINUATION_RING_MAX_OPACITY;
    }
    if (progress === 1) {
      state.continuationCueActive = false;
      state.continuationCueElapsed = 0;
      state.continuationCueCount += 1;
      state.continuationNextIdleDuration =
        RESERVOIR_NODE_CONTINUATION_REPEAT_IDLE_DURATIONS[
          (state.continuationCueCount - 1) %
            RESERVOIR_NODE_CONTINUATION_REPEAT_IDLE_DURATIONS.length
        ];
    }
  } else {
    state.continuationIdleElapsed += delta;
    if (
      state.continuationIdleElapsed >= state.continuationNextIdleDuration
    ) {
      state.continuationIdleElapsed = 0;
      state.continuationCueElapsed = 0;
      state.continuationCueActive = true;
    }
  }

  return {
    continuationCueActive: state.continuationCueActive,
    continuationCueCount: state.continuationCueCount,
    continuationOffset,
    continuationWhiteMix,
    radialOffset: state.radialOffset,
    ringOpacity,
    ringRadialOffset,
    ringScale,
    ringVisible,
    selectedReveal: state.selectedReveal,
    selectionSettled,
  };
}

export function addSelectedNodeSurfaceGradient(
  shader: SelectedSurfaceShader,
  uniforms: ReservoirSelectedSurfaceUniforms,
  whiteGain = RESERVOIR_NODE_SELECTED_WHITE_GAIN,
  activationUniforms?: ReservoirCollectionActivationUniforms,
) {
  shader.uniforms.nodeContactDirection = uniforms.nodeContactDirection;
  shader.uniforms.nodeSelectedWhite = uniforms.nodeSelectedWhite;
  shader.uniforms.nodeSelectedReveal = uniforms.nodeSelectedReveal;
  if (activationUniforms) {
    shader.uniforms.nodeActiveColor = activationUniforms.nodeActiveColor;
    shader.uniforms.nodeActivationProgress =
      activationUniforms.nodeActivationProgress;
  }
  const activationDeclarations = activationUniforms
    ? `
      uniform vec3 nodeActiveColor;
      uniform float nodeActivationProgress;`
    : "";
  const activationFragment = activationUniforms
    ? `
      float nodeActivationCoordinate = (nodeContactAlignment + 1.0) * 0.5;
      float nodeActivationThreshold =
        1.0 - nodeActivationProgress * 1.1;
      float nodeActivationMask = smoothstep(
        nodeActivationThreshold - 0.12,
        nodeActivationThreshold + 0.02,
        nodeActivationCoordinate
      ) * smoothstep(0.0, 0.04, nodeActivationProgress);
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        nodeActiveColor,
        nodeActivationMask
      );`
    : "";
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vNodeLocalPosition;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vNodeLocalPosition = position;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform vec3 nodeContactDirection;
      uniform vec3 nodeSelectedWhite;
      uniform float nodeSelectedReveal;
      ${activationDeclarations}
      varying vec3 vNodeLocalPosition;`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float nodeContactAlignment = dot(
        normalize(vNodeLocalPosition),
        normalize(nodeContactDirection)
      );
      float nodeBottomUpGradient = pow(
        smoothstep(-1.0, 1.0, nodeContactAlignment),
        1.35
      );
      float nodeRevealThreshold = 1.0 - nodeSelectedReveal;
      float nodeRevealMask = smoothstep(
        nodeRevealThreshold - 0.12,
        nodeRevealThreshold + 0.02,
        nodeBottomUpGradient
      ) * smoothstep(0.0, 0.08, nodeSelectedReveal);
      float nodeSelectedWhiteMix =
        nodeBottomUpGradient * nodeRevealMask * ${whiteGain.toFixed(3)};
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        nodeSelectedWhite,
        nodeSelectedWhiteMix
      );
      ${activationFragment}`,
    );
}

export const RESERVOIR_SELECTED_GRID_VERTEX_SHADER = `
  varying vec3 vGridLocalPosition;

  void main() {
    vGridLocalPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RESERVOIR_SELECTED_GRID_FRAGMENT_SHADER = `
  uniform vec3 baseColor;
  uniform vec3 selectedColor;
  uniform vec3 contactDirection;
  uniform float baseOpacity;
  uniform float selectedReveal;
  varying vec3 vGridLocalPosition;

  void main() {
    float alignment = dot(
      normalize(vGridLocalPosition),
      normalize(contactDirection)
    );
    float gradient = pow(smoothstep(-1.0, 1.0, alignment), 1.35);
    float threshold = 1.0 - selectedReveal;
    float revealMask = smoothstep(
      threshold - 0.12,
      threshold + 0.02,
      gradient
    ) * smoothstep(0.0, 0.08, selectedReveal);
    float emphasis = gradient * revealMask;
    float persistentEmphasis = selectedReveal * 0.16;
    float colorEmphasis = min(
      persistentEmphasis + emphasis * 0.44,
      0.62
    );
    vec3 color = mix(baseColor, selectedColor, colorEmphasis);
    gl_FragColor = vec4(
      color,
      baseOpacity + persistentEmphasis * 0.35 + emphasis * 0.22
    );
  }
`;
