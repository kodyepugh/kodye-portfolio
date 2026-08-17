import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { createReservoirGridLineGeometry } from "@/lib/reservoir/geometry";
import { RESERVOIR_SURFACE_PATTERN } from "@/lib/reservoir/surface-material";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";

const RESERVOIR_PATTERN_VERTEX_SHADER = /* glsl */ `
  attribute float lineVariation;
  uniform float facingFloor;
  uniform float facingPower;
  varying float vLineVisibility;

  void main() {
    vec3 viewNormal = normalize(normalMatrix * normalize(position));
    float facing = max(dot(viewNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float facingVisibility = mix(
      facingFloor,
      1.0,
      pow(facing, facingPower)
    );
    vec3 viewLightDirection = normalize(vec3(-0.42, 0.56, 0.72));
    float lighting = 0.56 + 0.44 * max(
      dot(viewNormal, viewLightDirection),
      0.0
    );
    vLineVisibility = facingVisibility * lighting * lineVariation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RESERVOIR_PATTERN_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 lineColor;
  uniform float lineOpacity;
  varying float vLineVisibility;

  void main() {
    float alpha = lineOpacity * vLineVisibility;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(lineColor, alpha);
  }
`;

type ReservoirSurfacePatternProps = {
  materialRef: RefObject<THREE.ShaderMaterial | null>;
  radius: number;
};

function getLineVariation(index: number) {
  let value = Math.imul(index + 1, 1_597_334_677);
  value = Math.imul(value ^ (value >>> 15), 2_246_822_519);
  return ((value ^ (value >>> 13)) >>> 0) / 4_294_967_296;
}

export function ReservoirSurfacePattern({
  materialRef,
  radius,
}: ReservoirSurfacePatternProps) {
  const geometry = useMemo(() => {
    const patternGeometry = createReservoirGridLineGeometry(
      radius,
      RESERVOIR_SURFACE_PATTERN.detail,
      RESERVOIR_SURFACE_PATTERN.surfaceScale,
    );
    const positions = patternGeometry.getAttribute("position");
    const variations = new Float32Array(positions.count);

    for (let index = 0; index < positions.count; index += 1) {
      const edgeIndex = Math.floor(index / 2);
      const centeredVariation = getLineVariation(edgeIndex) * 2 - 1;
      variations[index] =
        1 + centeredVariation * RESERVOIR_SURFACE_PATTERN.opacityVariation;
    }

    patternGeometry.setAttribute(
      "lineVariation",
      new THREE.BufferAttribute(variations, 1),
    );
    return patternGeometry;
  }, [radius]);
  const uniforms = useMemo(
    () => ({
      facingFloor: { value: RESERVOIR_SURFACE_PATTERN.facingFloor },
      facingPower: { value: RESERVOIR_SURFACE_PATTERN.facingPower },
      lineColor: { value: new THREE.Color(RESERVOIR_THEME.grid) },
      lineOpacity: { value: RESERVOIR_SURFACE_PATTERN.lineOpacity },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments
      geometry={geometry}
      renderOrder={RESERVOIR_RENDER_ORDER.baseGrid}
      userData={{ presentationOnly: true, surfacePattern: "dense" }}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={RESERVOIR_PATTERN_VERTEX_SHADER}
        fragmentShader={RESERVOIR_PATTERN_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}
