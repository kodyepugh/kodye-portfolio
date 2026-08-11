import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createArtifactTerritoryGeometry } from "@/lib/reservoir/geometry";
import {
  RESERVOIR_FACE_GRADIENT_VERTEX_SHADER,
  RESERVOIR_GLOW_BORDER_DISTANCES,
  RESERVOIR_GLOW_BORDER_OPACITIES,
  RESERVOIR_GLOW_FACE_INTENSITY_LEVELS,
  RESERVOIR_GLOW_FRAGMENT_SHADER,
  RESERVOIR_GLOW_PROPAGATION_WIDTH,
  RESERVOIR_GLOW_SPOKE_DISTANCES,
  RESERVOIR_GLOW_SPOKE_INTENSITIES,
  RESERVOIR_SELECTED_GLOW_GAIN,
  RESERVOIR_SELECTION_TRANSITION_DURATION,
  RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER,
} from "@/lib/reservoir/glow";
import { RESERVOIR_RENDER_ORDER } from "@/lib/reservoir/theme";
import type { ReservoirArtifact } from "@/types/reservoir";

type ArtifactTerritoryProps = {
  active: boolean;
  selected: boolean;
  artifact: ReservoirArtifact;
  onRetractionComplete: (artifactId: string) => void;
};

export function ArtifactTerritory({
  active,
  selected,
  artifact,
  onRetractionComplete,
}: ArtifactTerritoryProps) {
  const territory = useMemo(
    () => createArtifactTerritoryGeometry(artifact.vertexId),
    [artifact.vertexId],
  );
  const faceMaterials = useRef<Array<THREE.ShaderMaterial | null>>([
    null,
    null,
    null,
  ]);
  const spokeMaterials = useRef<Array<THREE.ShaderMaterial | null>>([
    null,
    null,
  ]);
  const faceUniforms = useMemo(
    () =>
      Array.from({ length: 3 }, () => ({
        glowColor: { value: new THREE.Color(artifact.color) },
        glowStrength: { value: RESERVOIR_SELECTED_GLOW_GAIN },
        intensityLevels: {
          value: new THREE.Vector4(
            ...RESERVOIR_GLOW_FACE_INTENSITY_LEVELS,
          ),
        },
        propagationProgress: { value: 0 },
        propagationWidth: {
          value: RESERVOIR_GLOW_PROPAGATION_WIDTH,
        },
      })),
    [artifact.color],
  );
  const spokeUniforms = useMemo(
    () =>
      RESERVOIR_GLOW_SPOKE_INTENSITIES.map(
        ([inner, outer], bandIndex) => ({
          glowColor: { value: new THREE.Color(artifact.color) },
          glowStrength: { value: RESERVOIR_SELECTED_GLOW_GAIN },
          innerDistance: {
            value: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][0],
          },
          innerIntensity: { value: inner },
          outerDistance: {
            value: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][1],
          },
          outerIntensity: { value: outer },
          propagationProgress: { value: 0 },
          propagationWidth: {
            value: RESERVOIR_GLOW_PROPAGATION_WIDTH,
          },
        }),
      ),
    [artifact.color],
  );
  const borderMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([
    null,
    null,
    null,
  ]);
  const selectionProgress = useRef(0);
  const retractionReported = useRef(false);

  useEffect(
    () => () => {
      for (const geometry of territory?.faceBands ?? []) geometry.dispose();
      for (const geometry of territory?.spokeBands ?? []) geometry.dispose();
      for (const geometry of territory?.borderBands ?? []) geometry.dispose();
    },
    [territory],
  );

  useFrame((_, delta) => {
    const targetProgress = active ? 1 : 0;
    const currentProgress = selectionProgress.current;
    if (currentProgress === targetProgress) {
      if (!active && !selected && !retractionReported.current) {
        retractionReported.current = true;
        onRetractionComplete(artifact.id);
      }
      return;
    }

    const progressStep = delta / RESERVOIR_SELECTION_TRANSITION_DURATION;
    const nextProgress = active
      ? Math.min(currentProgress + progressStep, 1)
      : Math.max(currentProgress - progressStep, 0);
    selectionProgress.current = nextProgress;
    for (const material of faceMaterials.current) {
      if (!material) continue;
      material.uniforms.propagationProgress.value = nextProgress;
    }
    for (const material of spokeMaterials.current) {
      if (!material) continue;
      material.uniforms.propagationProgress.value = nextProgress;
    }
    for (
      let bandIndex = 0;
      bandIndex < borderMaterials.current.length;
      bandIndex += 1
    ) {
      const material = borderMaterials.current[bandIndex];
      if (!material) continue;
      const distance = RESERVOIR_GLOW_BORDER_DISTANCES[bandIndex];
      const propagationMask = THREE.MathUtils.smoothstep(
        nextProgress,
        distance,
        distance + RESERVOIR_GLOW_PROPAGATION_WIDTH,
      );
      material.opacity =
        RESERVOIR_SELECTED_GLOW_GAIN *
        RESERVOIR_GLOW_BORDER_OPACITIES[bandIndex] *
        propagationMask;
    }

    if (active) {
      retractionReported.current = false;
    } else if (nextProgress === 0 && !retractionReported.current) {
      retractionReported.current = true;
      onRetractionComplete(artifact.id);
    }
  });

  if (!territory) return null;

  return (
    <group
      userData={{
        artifactId: artifact.id,
        faceBandCounts: territory.faceCounts.join(","),
        spokeCounts: territory.spokeCounts.join(","),
        borderCounts: territory.borderCounts.join(","),
      }}
    >
      {territory.faceBands.map((geometry, bandIndex) => (
        <mesh
          key={`selected-face-${bandIndex}`}
          geometry={geometry}
          renderOrder={RESERVOIR_RENDER_ORDER.selectedFaceGlow}
        >
          <shaderMaterial
            ref={(material) => {
              faceMaterials.current[bandIndex] = material;
            }}
            uniforms={faceUniforms[bandIndex]}
            vertexShader={RESERVOIR_FACE_GRADIENT_VERTEX_SHADER}
            fragmentShader={RESERVOIR_GLOW_FRAGMENT_SHADER}
            transparent
            depthTest
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      {territory.spokeBands.map((geometry, bandIndex) => (
        <lineSegments
          key={`selected-spoke-${bandIndex}`}
          geometry={geometry}
          renderOrder={RESERVOIR_RENDER_ORDER.selectedEdgeGlow}
        >
          <shaderMaterial
            ref={(material) => {
              spokeMaterials.current[bandIndex] = material;
            }}
            uniforms={spokeUniforms[bandIndex]}
            vertexShader={RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER}
            fragmentShader={RESERVOIR_GLOW_FRAGMENT_SHADER}
            transparent
            depthTest
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}
      {territory.borderBands.map((geometry, bandIndex) => (
        <lineSegments
          key={`selected-border-${bandIndex}`}
          geometry={geometry}
          renderOrder={RESERVOIR_RENDER_ORDER.selectedEdgeGlow}
        >
          <lineBasicMaterial
            ref={(material) => {
              borderMaterials.current[bandIndex] = material;
            }}
            color={artifact.color}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}
