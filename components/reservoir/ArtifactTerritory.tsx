import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
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
  RESERVOIR_TERRITORY_EDGE_VERTEX_SHADER,
} from "@/lib/reservoir/glow";
import { RESERVOIR_RENDER_ORDER } from "@/lib/reservoir/theme";
import {
  getSecondSelectionTopologyFrame,
  mapRadialTopologyExpansion,
} from "@/lib/reservoir/second-selection";
import type { SecondSelectionTopologyMode } from "@/lib/reservoir/second-selection";
import type { ReservoirNode } from "@/types/reservoir";

type ReservoirNodeTerritoryProps = {
  active: boolean;
  selected: boolean;
  color: string;
  node: ReservoirNode;
  onRetractionComplete: (nodeId: string) => void;
  secondSelectionMode: SecondSelectionTopologyMode | null;
  secondSelectionElapsedRef: MutableRefObject<number>;
  openingReducedMotion: boolean;
  restoring: boolean;
  restorationProgressRef: MutableRefObject<number>;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
};

export function ReservoirNodeTerritory({
  active,
  selected,
  color,
  node,
  onRetractionComplete,
  secondSelectionMode,
  secondSelectionElapsedRef,
  openingReducedMotion,
  restoring,
  restorationProgressRef,
  diagnosticsRef,
}: ReservoirNodeTerritoryProps) {
  const territory = useMemo(
    () => createArtifactTerritoryGeometry(node.vertexId),
    [node.vertexId],
  );
  const faceMaterials = useRef<Array<THREE.ShaderMaterial | null>>(
    Array.from({ length: 4 }, () => null),
  );
  const spokeMaterials = useRef<Array<THREE.ShaderMaterial | null>>(
    [null, null],
  );
  const borderMaterials = useRef<Array<THREE.LineBasicMaterial | null>>(
    [null, null, null],
  );
  const expandedEdgeMaterials = useRef<Array<THREE.ShaderMaterial | null>>(
    [null],
  );
  const faceUniforms = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        glowColor: { value: new THREE.Color(color) },
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
        expandedTopologyBlend: { value: 0 },
      })),
    [color],
  );
  const spokeUniforms = useMemo(
    () =>
      RESERVOIR_GLOW_SPOKE_INTENSITIES.slice(0, 2).map(
        ([inner, outer], bandIndex) => ({
          glowColor: { value: new THREE.Color(color) },
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
    [color],
  );
  const expandedEdgeUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color(color) },
      glowStrength: { value: RESERVOIR_SELECTED_GLOW_GAIN },
      propagationProgress: { value: 0 },
      propagationWidth: { value: RESERVOIR_GLOW_PROPAGATION_WIDTH },
      expandedTopologyBlend: { value: 1 },
    }),
    [color],
  );
  const selectionProgress = useRef(0);
  const retractionReported = useRef(false);
  const observedSecondSelectionMode = useRef<SecondSelectionTopologyMode | null>(
    null,
  );
  const peakActiveFaceCount = useRef(0);

  function setTerritoryPresentation({
    progress,
    strength,
    expandedBlend,
  }: {
    progress: number;
    strength: number;
    expandedBlend: number;
  }) {
    for (const material of faceMaterials.current) {
      if (!material) continue;
      material.uniforms.glowStrength.value =
        RESERVOIR_SELECTED_GLOW_GAIN * strength;
      material.uniforms.propagationProgress.value = progress;
      material.uniforms.expandedTopologyBlend.value = expandedBlend;
    }
    for (const material of spokeMaterials.current) {
      if (!material) continue;
      material.uniforms.glowStrength.value =
        RESERVOIR_SELECTED_GLOW_GAIN * strength * (1 - expandedBlend);
      material.uniforms.propagationProgress.value = progress;
    }
    for (let index = 0; index < borderMaterials.current.length; index += 1) {
      const material = borderMaterials.current[index];
      if (!material) continue;
      const distance = RESERVOIR_GLOW_BORDER_DISTANCES[index];
      const propagationMask = THREE.MathUtils.smoothstep(
        progress,
        distance,
        distance + RESERVOIR_GLOW_PROPAGATION_WIDTH,
      );
      material.opacity =
        RESERVOIR_SELECTED_GLOW_GAIN *
        RESERVOIR_GLOW_BORDER_OPACITIES[index] *
        propagationMask *
        strength *
        (1 - expandedBlend);
    }
    for (const material of expandedEdgeMaterials.current) {
      if (!material) continue;
      material.uniforms.glowStrength.value =
        RESERVOIR_SELECTED_GLOW_GAIN * strength * expandedBlend;
      material.uniforms.propagationProgress.value = 1;
    }
  }

  function updateExpandedTopology(
    cells: NonNullable<typeof territory>["faceCells"],
    geometries: THREE.BufferGeometry[],
    assignments: ReturnType<typeof mapRadialTopologyExpansion>,
    verticesPerCell: number,
  ) {
    const assignmentsById = new Map(
      assignments.map((assignment) => [assignment.id, assignment]),
    );
    for (const geometry of geometries) {
      const weights = geometry.getAttribute(
        "expandedWeight",
      ) as THREE.BufferAttribute;
      const intensities = geometry.getAttribute(
        "expandedIntensity",
      ) as THREE.BufferAttribute;
      for (let index = 0; index < weights.count; index += 1) {
        weights.setX(index, 0);
        intensities.setX(index, 0);
      }
      weights.needsUpdate = true;
      intensities.needsUpdate = true;
    }
    for (const cell of cells) {
      const assignment = assignmentsById.get(cell.id);
      if (!assignment) continue;
      const geometry = geometries[cell.geometryIndex];
      const weights = geometry.getAttribute(
        "expandedWeight",
      ) as THREE.BufferAttribute;
      const intensities = geometry.getAttribute(
        "expandedIntensity",
      ) as THREE.BufferAttribute;
      for (let offset = 0; offset < verticesPerCell; offset += 1) {
        weights.setX(cell.vertexOffset + offset, 1);
        intensities.setX(
          cell.vertexOffset + offset,
          assignment.intensities[offset] ?? 0,
        );
      }
      weights.needsUpdate = true;
      intensities.needsUpdate = true;
    }
  }

  useEffect(
    () => () => {
      for (const geometry of territory?.faceBands ?? []) geometry.dispose();
      for (const geometry of territory?.spokeBands ?? []) geometry.dispose();
      for (const geometry of territory?.borderBands ?? []) geometry.dispose();
      for (const geometry of territory?.expandedEdgeBands ?? []) {
        geometry.dispose();
      }
    },
    [territory],
  );

  useFrame((_, delta) => {
    if (secondSelectionMode) {
      const frame = getSecondSelectionTopologyFrame({
        elapsed: secondSelectionElapsedRef.current,
        mode: secondSelectionMode,
        reducedMotion: openingReducedMotion,
      });
      selectionProgress.current = frame.propagationProgress;
      const artifactExpansion = secondSelectionMode === "artifact-open";
      const faceAssignments =
        territory && artifactExpansion
          ? mapRadialTopologyExpansion({
              cells: territory.faceCells,
              expansion: frame.expansion,
            })
          : [];
      const edgeAssignments =
        territory && artifactExpansion
          ? mapRadialTopologyExpansion({
              cells: territory.edgeCells,
              expansion: frame.expansion,
            })
          : [];
      if (territory && artifactExpansion) {
        updateExpandedTopology(
          territory.faceCells,
          territory.faceBands,
          faceAssignments,
          3,
        );
        updateExpandedTopology(
          territory.edgeCells,
          territory.expandedEdgeBands,
          edgeAssignments,
          2,
        );
      }
      setTerritoryPresentation({
        progress: frame.propagationProgress,
        strength: frame.strength,
        expandedBlend: artifactExpansion ? frame.expandedBlend : 0,
      });

      if (diagnosticsRef.current && territory) {
        if (observedSecondSelectionMode.current !== secondSelectionMode) {
          observedSecondSelectionMode.current = secondSelectionMode;
          peakActiveFaceCount.current = 0;
        }
        const canonicalFaceCells = territory.faceCells.filter(
          (cell) => cell.canonical,
        );
        const topologyVisible =
          frame.strength > 0.001 && frame.propagationProgress > 0.001;
        const activeFaceIds = !topologyVisible
          ? []
          : artifactExpansion && frame.expandedBlend >= 0.01
            ? faceAssignments.map((assignment) => assignment.id)
            : canonicalFaceCells.map((cell) => cell.id);
        const activeEdgeIds = !topologyVisible
          ? []
          : artifactExpansion && frame.expandedBlend >= 0.01
            ? edgeAssignments.map((assignment) => assignment.id)
            : territory.edgeCells
                .filter((cell) => cell.canonical)
                .map((cell) => cell.id);
        const startFaceCount = canonicalFaceCells.length;
        peakActiveFaceCount.current = Math.max(
          peakActiveFaceCount.current,
          activeFaceIds.length,
        );
        diagnosticsRef.current.dataset.secondSelectionTopologyMode =
          secondSelectionMode;
        diagnosticsRef.current.dataset.secondSelectionTopologyPhase =
          frame.phase;
        diagnosticsRef.current.dataset.secondSelectionTopologyProgress =
          frame.progress.toFixed(6);
        diagnosticsRef.current.dataset.secondSelectionTopologyExpansion =
          frame.expansion.toFixed(6);
        diagnosticsRef.current.dataset.secondSelectionTopologyStrength =
          frame.strength.toFixed(6);
        diagnosticsRef.current.dataset.secondSelectionTopologyPropagation =
          frame.propagationProgress.toFixed(6);
        diagnosticsRef.current.dataset.secondSelectionTopologyActiveFaceCount =
          String(activeFaceIds.length);
        diagnosticsRef.current.dataset.secondSelectionTopologyActiveFaceIds =
          activeFaceIds.join(",");
        diagnosticsRef.current.dataset.secondSelectionTopologyActiveEdgeCount =
          String(activeEdgeIds.length);
        diagnosticsRef.current.dataset.secondSelectionTopologyActiveEdgeIds =
          activeEdgeIds.join(",");
        diagnosticsRef.current.dataset.secondSelectionTopologyStartFaceCount =
          String(startFaceCount);
        diagnosticsRef.current.dataset.secondSelectionTopologyPeakFaceCount =
          String(peakActiveFaceCount.current);
        diagnosticsRef.current.dataset.secondSelectionTopologyEndFaceCount =
          frame.phase === "resolved"
            ? String(activeFaceIds.length)
            : "";
      }
      return;
    }

    observedSecondSelectionMode.current = null;

    if (restoring && selected && node.kind === "artifact") {
      const restorationProgress = restorationProgressRef.current;
      selectionProgress.current = restorationProgress;
      retractionReported.current = false;
      setTerritoryPresentation({
        progress: restorationProgress,
        strength: 1,
        expandedBlend: 0,
      });
      if (diagnosticsRef.current) {
        diagnosticsRef.current.dataset.selectedTopologyRestorationProgress =
          restorationProgress.toFixed(6);
      }
      return;
    }

    const targetProgress = active ? 1 : 0;
    const currentProgress = selectionProgress.current;
    setTerritoryPresentation({
      progress: currentProgress,
      strength: 1,
      expandedBlend: 0,
    });
    if (currentProgress === targetProgress) {
      if (!active && !selected && !retractionReported.current) {
        retractionReported.current = true;
        onRetractionComplete(node.id);
      }
      return;
    }

    const progressStep = delta / RESERVOIR_SELECTION_TRANSITION_DURATION;
    const nextProgress = active
      ? Math.min(currentProgress + progressStep, 1)
      : Math.max(currentProgress - progressStep, 0);
    selectionProgress.current = nextProgress;
    setTerritoryPresentation({
      progress: nextProgress,
      strength: 1,
      expandedBlend: 0,
    });

    if (active) {
      retractionReported.current = false;
    } else if (nextProgress === 0 && !retractionReported.current) {
      retractionReported.current = true;
      onRetractionComplete(node.id);
    }
  });

  if (!territory) return null;

  return (
    <group
      userData={{
        nodeId: node.id,
        nodeKind: node.kind,
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
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}
      {territory.expandedEdgeBands.map((geometry, bandIndex) => (
        <lineSegments
          key={`expanded-edge-${bandIndex}`}
          geometry={geometry}
          renderOrder={RESERVOIR_RENDER_ORDER.selectedEdgeGlow}
        >
          <shaderMaterial
            ref={(material) => {
              expandedEdgeMaterials.current[bandIndex] = material;
            }}
            uniforms={expandedEdgeUniforms}
            vertexShader={RESERVOIR_TERRITORY_EDGE_VERTEX_SHADER}
            fragmentShader={RESERVOIR_GLOW_FRAGMENT_SHADER}
            transparent
            depthTest
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}
