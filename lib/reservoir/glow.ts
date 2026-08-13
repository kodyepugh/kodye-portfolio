import * as THREE from "three";

export const RESERVOIR_GLOW_FACE_INTENSITY_LEVELS = [
  0.34,
  0.19,
  0.09,
  0,
] as const;
export const RESERVOIR_GLOW_SPOKE_INTENSITIES = [
  [0.92, 0.72],
  [0.56, 0.4],
  [0.28, 0.14],
] as const;
export const RESERVOIR_GLOW_BORDER_OPACITIES = [
  0.64,
  0.35,
  0,
  0,
] as const;
export const RESERVOIR_CURSOR_GLOW_GAIN = 0.32;
export const RESERVOIR_SELECTED_GLOW_GAIN = 1.5;
export const RESERVOIR_SELECTION_TRANSITION_DURATION = 0.36;
export const RESERVOIR_GLOW_PROPAGATION_WIDTH = 0.22;
export const RESERVOIR_GLOW_SPOKE_DISTANCES = [
  [0, 1 / 3],
  [1 / 3, 2 / 3],
  [1, 4 / 3],
] as const;
export const RESERVOIR_GLOW_BORDER_DISTANCES = [
  1 / 3,
  2 / 3,
  1,
  4 / 3,
] as const;

export const RESERVOIR_GLOW_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  varying float glowAlpha;

  void main() {
    gl_FragColor = vec4(glowColor, glowAlpha);
  }
`;

export const RESERVOIR_FACE_GRADIENT_VERTEX_SHADER = `
  attribute float intensityLevel;
  attribute float expandedWeight;
  attribute float expandedIntensity;
  uniform float glowStrength;
  uniform float propagationProgress;
  uniform float propagationWidth;
  uniform float expandedTopologyBlend;
  uniform vec4 intensityLevels;
  varying float glowAlpha;

  void main() {
    float intensity = intensityLevels.x;
    if (intensityLevel > 3.5) {
      intensity = intensityLevels.w;
    } else if (intensityLevel > 2.5) {
      intensity = intensityLevels.w;
    } else if (intensityLevel > 1.5) {
      intensity = intensityLevels.z;
    } else if (intensityLevel > 0.5) {
      intensity = intensityLevels.y;
    }
    float distanceFromCenter = intensityLevel / 3.0;
    float propagationMask = smoothstep(
      distanceFromCenter,
      distanceFromCenter + propagationWidth,
      propagationProgress
    );
    float selectedAlpha = intensity * propagationMask;
    float expandedAlpha = expandedIntensity * expandedWeight;
    glowAlpha = glowStrength * mix(
      selectedAlpha,
      expandedAlpha,
      expandedTopologyBlend
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER = `
  attribute float innerWeight;
  uniform float glowStrength;
  uniform float innerIntensity;
  uniform float innerDistance;
  uniform float outerIntensity;
  uniform float outerDistance;
  uniform float propagationProgress;
  uniform float propagationWidth;
  varying float glowAlpha;

  void main() {
    float intensity = mix(
      outerIntensity,
      innerIntensity,
      innerWeight
    );
    float distanceFromCenter = mix(
      outerDistance,
      innerDistance,
      innerWeight
    );
    float propagationMask = smoothstep(
      distanceFromCenter,
      distanceFromCenter + propagationWidth,
      propagationProgress
    );
    glowAlpha = glowStrength * intensity * propagationMask;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RESERVOIR_TERRITORY_EDGE_VERTEX_SHADER = `
  attribute float baseIntensity;
  attribute float baseDistance;
  attribute float expandedWeight;
  attribute float expandedIntensity;
  uniform float glowStrength;
  uniform float propagationProgress;
  uniform float propagationWidth;
  uniform float expandedTopologyBlend;
  varying float glowAlpha;

  void main() {
    float propagationMask = smoothstep(
      baseDistance,
      baseDistance + propagationWidth,
      propagationProgress
    );
    float selectedAlpha = baseIntensity * propagationMask;
    float expandedAlpha = expandedIntensity * expandedWeight;
    glowAlpha = glowStrength * mix(
      selectedAlpha,
      expandedAlpha,
      expandedTopologyBlend
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function createFaceGradientMaterial(
  color: THREE.ColorRepresentation,
  intensityLevels: readonly [number, number, number, number],
  strength = 0,
  propagationProgress = 1,
) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      glowStrength: { value: strength },
      propagationProgress: { value: propagationProgress },
      propagationWidth: { value: RESERVOIR_GLOW_PROPAGATION_WIDTH },
      intensityLevels: {
        value: new THREE.Vector4(...intensityLevels),
      },
      expandedTopologyBlend: { value: 0 },
    },
    vertexShader: RESERVOIR_FACE_GRADIENT_VERTEX_SHADER,
    fragmentShader: RESERVOIR_GLOW_FRAGMENT_SHADER,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  material.toneMapped = false;
  return material;
}

export function createSpokeGradientMaterial(
  color: THREE.ColorRepresentation,
  innerIntensity: number,
  outerIntensity: number,
  strength = 0,
  innerDistance = 0,
  outerDistance = 1,
  propagationProgress = 1,
) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      glowStrength: { value: strength },
      innerIntensity: { value: innerIntensity },
      innerDistance: { value: innerDistance },
      outerIntensity: { value: outerIntensity },
      outerDistance: { value: outerDistance },
      propagationProgress: { value: propagationProgress },
      propagationWidth: { value: RESERVOIR_GLOW_PROPAGATION_WIDTH },
    },
    vertexShader: RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER,
    fragmentShader: RESERVOIR_GLOW_FRAGMENT_SHADER,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  material.toneMapped = false;
  return material;
}
