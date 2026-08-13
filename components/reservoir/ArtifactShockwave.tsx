import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import { createReservoirShockwaveGeometry } from "@/lib/reservoir/geometry";
import {
  getShockwaveDuration,
  getShockwaveStart,
  RESERVOIR_SHOCKWAVE_GRAPH_WIDTH,
  RESERVOIR_SHOCKWAVE_RANGE_GAIN,
} from "@/lib/reservoir/opening";
import { RESERVOIR_RENDER_ORDER } from "@/lib/reservoir/theme";
import type { ReservoirArtifact } from "@/types/reservoir";

type ArtifactShockwaveProps = {
  artifact: ReservoirArtifact;
  elapsedRef: MutableRefObject<number>;
  maximumArtifactDistance: number;
  reducedMotion: boolean;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
};

const SHOCKWAVE_EDGE_OPACITY = 0.88;
const SHOCKWAVE_FACE_OPACITY = 0.14;

const SHOCKWAVE_VERTEX_SHADER = `
  attribute float surfaceDistance;
  varying float vSurfaceDistance;

  void main() {
    vSurfaceDistance = surfaceDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHOCKWAVE_FRAGMENT_SHADER = `
  uniform vec3 waveColor;
  uniform float waveFront;
  uniform float waveWidth;
  uniform float waveOpacity;
  varying float vSurfaceDistance;

  void main() {
    float distanceFromFront = abs(vSurfaceDistance - waveFront);
    float band = 1.0 - smoothstep(waveWidth * 0.35, waveWidth, distanceFromFront);
    float leadingGate = smoothstep(-0.25, 0.35, waveFront);
    float alpha = band * leadingGate * waveOpacity;
    if (alpha <= 0.002) discard;
    gl_FragColor = vec4(waveColor, alpha);
  }
`;

export function ArtifactShockwave({
  artifact,
  elapsedRef,
  maximumArtifactDistance,
  reducedMotion,
  diagnosticsRef,
}: ArtifactShockwaveProps) {
  const geometry = useMemo(
    () => createReservoirShockwaveGeometry(artifact.vertexId),
    [artifact.vertexId],
  );
  const faceMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const edgeMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const waveRange = Math.min(
    geometry?.maximumGraphDistance ?? maximumArtifactDistance,
    Math.max(
      maximumArtifactDistance * RESERVOIR_SHOCKWAVE_RANGE_GAIN,
      1,
    ),
  );
  const faceUniforms = useMemo(
    () => ({
      waveColor: { value: new THREE.Color(artifact.color) },
      waveFront: { value: -RESERVOIR_SHOCKWAVE_GRAPH_WIDTH },
      waveWidth: { value: RESERVOIR_SHOCKWAVE_GRAPH_WIDTH },
      waveOpacity: { value: 0 },
    }),
    [artifact.color],
  );
  const edgeUniforms = useMemo(
    () => ({
      waveColor: { value: new THREE.Color(artifact.color) },
      waveFront: { value: -RESERVOIR_SHOCKWAVE_GRAPH_WIDTH },
      waveWidth: { value: RESERVOIR_SHOCKWAVE_GRAPH_WIDTH },
      waveOpacity: { value: 0 },
    }),
    [artifact.color],
  );

  useEffect(
    () => () => {
      geometry?.faceGeometry.dispose();
      geometry?.edgeGeometry.dispose();
    },
    [geometry],
  );

  useFrame(() => {
    const faceMaterial = faceMaterialRef.current;
    const edgeMaterial = edgeMaterialRef.current;
    if (!faceMaterial || !edgeMaterial) return;

    const duration = getShockwaveDuration(reducedMotion);
    const progress = THREE.MathUtils.clamp(
      (elapsedRef.current - getShockwaveStart(reducedMotion)) /
        duration,
      0,
      1,
    );
    const waveFront = THREE.MathUtils.lerp(
      -RESERVOIR_SHOCKWAVE_GRAPH_WIDTH,
      waveRange + RESERVOIR_SHOCKWAVE_GRAPH_WIDTH,
      1 - (1 - progress) ** 2,
    );
    const fade =
      progress < 0.78 ? 1 : 1 - THREE.MathUtils.smoothstep(progress, 0.78, 1);

    faceMaterial.uniforms.waveFront.value = waveFront;
    edgeMaterial.uniforms.waveFront.value = waveFront;
    faceMaterial.uniforms.waveOpacity.value = fade * SHOCKWAVE_FACE_OPACITY;
    edgeMaterial.uniforms.waveOpacity.value = fade * SHOCKWAVE_EDGE_OPACITY;

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.shockwaveProgress = progress.toFixed(6);
      diagnosticsRef.current.dataset.shockwaveFront = waveFront.toFixed(6);
      diagnosticsRef.current.dataset.shockwaveRange = waveRange.toFixed(6);
      diagnosticsRef.current.dataset.shockwaveColor = artifact.color;
    }
  });

  if (!geometry) return null;

  return (
    <group userData={{ shockwaveSourceArtifactId: artifact.id }}>
      <mesh
        geometry={geometry.faceGeometry}
        renderOrder={RESERVOIR_RENDER_ORDER.selectedFaceGlow}
        frustumCulled={false}
      >
        <shaderMaterial
          ref={faceMaterialRef}
          uniforms={faceUniforms}
          vertexShader={SHOCKWAVE_VERTEX_SHADER}
          fragmentShader={SHOCKWAVE_FRAGMENT_SHADER}
          transparent
          depthTest
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <lineSegments
        geometry={geometry.edgeGeometry}
        renderOrder={RESERVOIR_RENDER_ORDER.selectedEdgeGlow}
        frustumCulled={false}
      >
        <shaderMaterial
          ref={edgeMaterialRef}
          uniforms={edgeUniforms}
          vertexShader={SHOCKWAVE_VERTEX_SHADER}
          fragmentShader={SHOCKWAVE_FRAGMENT_SHADER}
          transparent
          depthTest
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
