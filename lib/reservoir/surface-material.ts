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
