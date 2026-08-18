import * as THREE from "three";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";

export const RESERVOIR_SURFACE_MATERIAL = {
  name: "smooth-digital-base",
  detail: 7,
  roughness: 0.96,
} as const;

export const RESERVOIR_SURFACE_PULSE = {
  color: RESERVOIR_THEME.inspection,
  diffuseMix: 0.08,
  emissiveBoost: 0.04,
  viewExponent: 1.9,
} as const;

export const RESERVOIR_SURFACE_PATTERN = {
  detail: 25,
  facingFloor: 0.05,
  facingPower: 0.72,
  lineOpacity: 0.145,
  opacityVariation: 0.16,
  surfaceScale: 1.00155,
} as const;

type ReservoirSurfacePulseShader = Parameters<
  THREE.MeshStandardMaterial["onBeforeCompile"]
>[0];

export type ReservoirSurfacePulseUniforms = {
  layoutTransitionPulse: { value: number };
  layoutTransitionPulseColor: { value: THREE.Color };
};

export type ReservoirSurfaceSelectionUniforms = {
  selectedNodeDirection: { value: THREE.Vector3 };
  selectedNodeColor: { value: THREE.Color };
  selectedGlowReveal: { value: number };
  selectedShockwaveProgress: { value: number };
  selectedShockwaveActive: { value: number };
};

const RESERVOIR_SURFACE_SELECTION = {
  glowAngularFalloff: 0.58,
  glowEmissiveBoost: 0.11,
  glowDiffuseMix: 0.075,
  shockwaveAngularWidth: 0.14,
  shockwaveDiffuseMix: 0.12,
  shockwaveEmissiveBoost: 0.18,
  shockwaveTravelRadians: Math.PI * 0.98,
} as const;

export function addReservoirSurfacePulse(
  shader: ReservoirSurfacePulseShader,
  uniforms: ReservoirSurfacePulseUniforms,
) {
  shader.uniforms.layoutTransitionPulse = uniforms.layoutTransitionPulse;
  shader.uniforms.layoutTransitionPulseColor =
    uniforms.layoutTransitionPulseColor;

  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vReservoirSurfaceLocalPosition = position;`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform float layoutTransitionPulse;
      uniform vec3 layoutTransitionPulseColor;
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float reservoirPulse = clamp(layoutTransitionPulse, 0.0, 1.0);
      float reservoirPulseFacing = max(
        dot(
          normalize(vReservoirSurfaceLocalPosition),
          normalize(-vViewPosition)
        ),
        0.0
      );
      float reservoirPulseVolume = mix(
        0.24,
        1.0,
        pow(reservoirPulseFacing, ${RESERVOIR_SURFACE_PULSE.viewExponent.toFixed(2)})
      );
      float reservoirPulseMix =
        reservoirPulse * reservoirPulseVolume;
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        layoutTransitionPulseColor,
        reservoirPulseMix * ${RESERVOIR_SURFACE_PULSE.diffuseMix.toFixed(3)}
      );
      totalEmissiveRadiance +=
        layoutTransitionPulseColor *
        reservoirPulseMix *
        ${RESERVOIR_SURFACE_PULSE.emissiveBoost.toFixed(3)};`,
    );
}

type ReservoirSurfaceSelectionShader = Parameters<
  THREE.MeshStandardMaterial["onBeforeCompile"]
>[0];

export function addReservoirSurfaceSelectionEffect(
  shader: ReservoirSurfaceSelectionShader,
  uniforms: ReservoirSurfaceSelectionUniforms,
) {
  shader.uniforms.selectedNodeDirection = uniforms.selectedNodeDirection;
  shader.uniforms.selectedNodeColor = uniforms.selectedNodeColor;
  shader.uniforms.selectedGlowReveal = uniforms.selectedGlowReveal;
  shader.uniforms.selectedShockwaveProgress =
    uniforms.selectedShockwaveProgress;
  shader.uniforms.selectedShockwaveActive = uniforms.selectedShockwaveActive;

  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vReservoirSurfaceLocalPosition = position;`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform vec3 selectedNodeDirection;
      uniform vec3 selectedNodeColor;
      uniform float selectedGlowReveal;
      uniform float selectedShockwaveProgress;
      uniform float selectedShockwaveActive;
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      vec3 reservoirSurfaceNormal = normalize(vReservoirSurfaceLocalPosition);
      float selectedNodeAlignment = dot(
        reservoirSurfaceNormal,
        normalize(selectedNodeDirection)
      );
      float selectedAngularDistance = acos(clamp(selectedNodeAlignment, -1.0, 1.0));
      float selectedGlowMask = pow(
        1.0 - smoothstep(0.0, ${RESERVOIR_SURFACE_SELECTION.glowAngularFalloff.toFixed(2)}, selectedAngularDistance),
        1.4
      ) * smoothstep(0.0, 0.08, selectedGlowReveal);
      float selectedShockwaveRadius =
        clamp(selectedShockwaveProgress, 0.0, 1.0) *
        ${RESERVOIR_SURFACE_SELECTION.shockwaveTravelRadians.toFixed(2)};
      float selectedShockwaveMask = selectedShockwaveActive *
        (1.0 - smoothstep(
          0.0,
          ${RESERVOIR_SURFACE_SELECTION.shockwaveAngularWidth.toFixed(2)},
          abs(selectedAngularDistance - selectedShockwaveRadius)
        )) *
        (1.0 - clamp(selectedShockwaveProgress, 0.0, 1.0));
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        selectedNodeColor,
        min(
          selectedGlowMask * ${RESERVOIR_SURFACE_SELECTION.glowDiffuseMix.toFixed(3)} +
          selectedShockwaveMask * ${RESERVOIR_SURFACE_SELECTION.shockwaveDiffuseMix.toFixed(3)},
          0.35
        )
      );
      totalEmissiveRadiance +=
        selectedNodeColor *
        (
          selectedGlowMask * ${RESERVOIR_SURFACE_SELECTION.glowEmissiveBoost.toFixed(3)} +
          selectedShockwaveMask * ${RESERVOIR_SURFACE_SELECTION.shockwaveEmissiveBoost.toFixed(3)}
      );`,
    );
}

export function addReservoirSurfacePulseAndSelectionEffect(
  shader: ReservoirSurfacePulseShader,
  pulseUniforms: ReservoirSurfacePulseUniforms,
  selectionUniforms: ReservoirSurfaceSelectionUniforms,
) {
  shader.uniforms.layoutTransitionPulse = pulseUniforms.layoutTransitionPulse;
  shader.uniforms.layoutTransitionPulseColor =
    pulseUniforms.layoutTransitionPulseColor;
  shader.uniforms.selectedNodeDirection =
    selectionUniforms.selectedNodeDirection;
  shader.uniforms.selectedNodeColor = selectionUniforms.selectedNodeColor;
  shader.uniforms.selectedGlowReveal = selectionUniforms.selectedGlowReveal;
  shader.uniforms.selectedShockwaveProgress =
    selectionUniforms.selectedShockwaveProgress;
  shader.uniforms.selectedShockwaveActive =
    selectionUniforms.selectedShockwaveActive;

  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      `#include <common>
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vReservoirSurfaceLocalPosition = position;`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      `#include <common>
      uniform float layoutTransitionPulse;
      uniform vec3 layoutTransitionPulseColor;
      uniform vec3 selectedNodeDirection;
      uniform vec3 selectedNodeColor;
      uniform float selectedGlowReveal;
      uniform float selectedShockwaveProgress;
      uniform float selectedShockwaveActive;
      varying vec3 vReservoirSurfaceLocalPosition;`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float reservoirPulse = clamp(layoutTransitionPulse, 0.0, 1.0);
      float reservoirPulseFacing = max(
        dot(
          normalize(vReservoirSurfaceLocalPosition),
          normalize(-vViewPosition)
        ),
        0.0
      );
      float reservoirPulseVolume = mix(
        0.24,
        1.0,
        pow(reservoirPulseFacing, ${RESERVOIR_SURFACE_PULSE.viewExponent.toFixed(2)})
      );
      float reservoirPulseMix =
        reservoirPulse * reservoirPulseVolume;
      vec3 reservoirSurfaceNormal = normalize(vReservoirSurfaceLocalPosition);
      float selectedNodeAlignment = dot(
        reservoirSurfaceNormal,
        normalize(selectedNodeDirection)
      );
      float selectedAngularDistance = acos(clamp(selectedNodeAlignment, -1.0, 1.0));
      float selectedGlowMask = pow(
        1.0 - smoothstep(0.0, ${RESERVOIR_SURFACE_SELECTION.glowAngularFalloff.toFixed(2)}, selectedAngularDistance),
        1.4
      ) * smoothstep(0.0, 0.08, selectedGlowReveal);
      float selectedShockwaveRadius =
        clamp(selectedShockwaveProgress, 0.0, 1.0) *
        ${RESERVOIR_SURFACE_SELECTION.shockwaveTravelRadians.toFixed(2)};
      float selectedShockwaveMask = selectedShockwaveActive *
        (1.0 - smoothstep(
          0.0,
          ${RESERVOIR_SURFACE_SELECTION.shockwaveAngularWidth.toFixed(2)},
          abs(selectedAngularDistance - selectedShockwaveRadius)
        )) *
        (1.0 - clamp(selectedShockwaveProgress, 0.0, 1.0));
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        layoutTransitionPulseColor,
        reservoirPulseMix * ${RESERVOIR_SURFACE_PULSE.diffuseMix.toFixed(3)}
      );
      diffuseColor.rgb = mix(
        diffuseColor.rgb,
        selectedNodeColor,
        min(
          selectedGlowMask * ${RESERVOIR_SURFACE_SELECTION.glowDiffuseMix.toFixed(3)} +
          selectedShockwaveMask * ${RESERVOIR_SURFACE_SELECTION.shockwaveDiffuseMix.toFixed(3)},
          0.35
        )
      );
      totalEmissiveRadiance +=
        layoutTransitionPulseColor *
        reservoirPulseMix *
        ${RESERVOIR_SURFACE_PULSE.emissiveBoost.toFixed(3)};
      totalEmissiveRadiance +=
        selectedNodeColor *
        (
          selectedGlowMask * ${RESERVOIR_SURFACE_SELECTION.glowEmissiveBoost.toFixed(3)} +
          selectedShockwaveMask * ${RESERVOIR_SURFACE_SELECTION.shockwaveEmissiveBoost.toFixed(3)}
        );`,
    );
}
