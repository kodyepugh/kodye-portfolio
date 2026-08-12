import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  createReservoirGridGeometry,
  findNearestReservoirGridVertexId,
  getReservoirGridInspectionEdgePoints,
  getReservoirGridInspectionFacePoints,
  getReservoirGridSelectionMask,
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import {
  RESERVOIR_FACE_GRADIENT_VERTEX_SHADER,
  RESERVOIR_CURSOR_GLOW_GAIN,
  RESERVOIR_GLOW_BORDER_OPACITIES,
  RESERVOIR_GLOW_FACE_INTENSITY_LEVELS,
  RESERVOIR_GLOW_FRAGMENT_SHADER,
  RESERVOIR_GLOW_PROPAGATION_WIDTH,
  RESERVOIR_GLOW_SPOKE_DISTANCES,
  RESERVOIR_GLOW_SPOKE_INTENSITIES,
  RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER,
} from "@/lib/reservoir/glow";
import type { ReservoirGridInspection } from "@/types/reservoir";

const INSPECTION_FADE_OUT_DAMPING = 9;
const OUTGOING_REGION_MAX_STRENGTH = 0.28;
const INSPECTION_FACE_BAND_COUNT = 3;
const INSPECTION_SPOKE_BAND_COUNT = 2;
const MAX_INSPECTION_EDGE_POINTS = 48;
const MAX_INSPECTION_FACE_POINTS = 48;

type SphereGridProps = {
  inspectionRef: MutableRefObject<ReservoirGridInspection>;
  selectedArtifactVertexIds: readonly number[];
  sphereRef: RefObject<THREE.Group | null>;
  recessionProgressRef: MutableRefObject<number>;
};

type InspectionSlot = {
  strength: number;
  vertexId: number | null;
};

function createInspectionGeometry(
  maximumPointCount: number,
  gradientAttributeName?: "innerWeight" | "intensityLevel",
) {
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(
    new Float32Array(maximumPointCount * 3),
    3,
  );
  positions.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  if (gradientAttributeName) {
    const gradientValues = new THREE.BufferAttribute(
      new Float32Array(maximumPointCount),
      1,
    );
    gradientValues.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(gradientAttributeName, gradientValues);
  }
  geometry.setDrawRange(0, 0);
  return geometry;
}

function updateInspectionGeometry(
  geometry: THREE.BufferGeometry,
  points: THREE.Vector3[],
  maximumPointCount: number,
  gradientAttributeName?: "innerWeight" | "intensityLevel",
  gradientValues?: number[],
) {
  const positionAttribute = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const pointCount = Math.min(points.length, maximumPointCount);

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const point = points[pointIndex];
    positionAttribute.setXYZ(pointIndex, point.x, point.y, point.z);
  }

  if (gradientAttributeName && gradientValues) {
    const gradientAttribute = geometry.getAttribute(
      gradientAttributeName,
    ) as THREE.BufferAttribute;
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      gradientAttribute.setX(pointIndex, gradientValues[pointIndex] ?? 0);
    }
    gradientAttribute.needsUpdate = true;
  }

  geometry.setDrawRange(0, pointCount);
  positionAttribute.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function createInspectionBandGeometries(
  categoryCount: number,
  maximumPointCount: number,
  gradientAttributeName?: "innerWeight" | "intensityLevel",
) {
  return Array.from({ length: categoryCount }, () => [
    createInspectionGeometry(maximumPointCount, gradientAttributeName),
    createInspectionGeometry(maximumPointCount, gradientAttributeName),
  ]);
}

function createBandSlotRefs<T>(categoryCount: number) {
  return Array.from({ length: categoryCount }, () => [
    null,
    null,
  ]) as Array<Array<T | null>>;
}

export function SphereGrid({
  inspectionRef,
  selectedArtifactVertexIds,
  sphereRef,
  recessionProgressRef,
}: SphereGridProps) {
  const baseGeometry = useMemo(() => {
    const surface = createReservoirGridGeometry();
    const edges = new THREE.EdgesGeometry(surface, 1);
    const edgePositions = edges.getAttribute("position");
    const points: THREE.Vector3[] = [];

    for (let index = 0; index < edgePositions.count; index += 2) {
      const start = new THREE.Vector3()
        .fromBufferAttribute(edgePositions, index)
        .normalize();
      const end = new THREE.Vector3()
        .fromBufferAttribute(edgePositions, index + 1)
        .normalize();

      points.push(
        start.clone().multiplyScalar(RESERVOIR_RADIUS * 1.0015),
        end.clone().multiplyScalar(RESERVOIR_RADIUS * 1.0015),
      );
    }

    surface.dispose();
    edges.dispose();

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  const inspectionSpokeGeometries = useMemo(
    () =>
      createInspectionBandGeometries(
        INSPECTION_SPOKE_BAND_COUNT,
        MAX_INSPECTION_EDGE_POINTS,
        "innerWeight",
      ),
    [],
  );
  const inspectionBorderGeometries = useMemo(
    () =>
      createInspectionBandGeometries(
        INSPECTION_FACE_BAND_COUNT,
        MAX_INSPECTION_EDGE_POINTS,
      ),
    [],
  );
  const inspectionFaceGeometries = useMemo(
    () =>
      createInspectionBandGeometries(
        INSPECTION_FACE_BAND_COUNT,
        MAX_INSPECTION_FACE_POINTS,
        "intensityLevel",
      ),
    [],
  );
  const inspectionSpokeLines = useRef(
    createBandSlotRefs<THREE.LineSegments>(INSPECTION_SPOKE_BAND_COUNT),
  );
  const inspectionBorderLines = useRef(
    createBandSlotRefs<THREE.LineSegments>(INSPECTION_FACE_BAND_COUNT),
  );
  const inspectionBorderMaterials = useRef(
    createBandSlotRefs<THREE.LineBasicMaterial>(
      INSPECTION_FACE_BAND_COUNT,
    ),
  );
  const inspectionFaceMeshes = useRef(
    createBandSlotRefs<THREE.Mesh>(INSPECTION_FACE_BAND_COUNT),
  );
  const inspectionFaceMaterials = useRef(
    createBandSlotRefs<THREE.ShaderMaterial>(
      INSPECTION_FACE_BAND_COUNT,
    ),
  );
  const inspectionSpokeMaterials = useRef(
    createBandSlotRefs<THREE.ShaderMaterial>(
      INSPECTION_SPOKE_BAND_COUNT,
    ),
  );
  const inspectionFaceUniforms = useMemo(
    () =>
      Array.from({ length: INSPECTION_FACE_BAND_COUNT }, () =>
        Array.from({ length: 2 }, () => ({
          glowColor: {
            value: new THREE.Color(RESERVOIR_THEME.inspection),
          },
          glowStrength: { value: 0 },
          propagationProgress: { value: 1 },
          propagationWidth: {
            value: RESERVOIR_GLOW_PROPAGATION_WIDTH,
          },
          intensityLevels: {
            value: new THREE.Vector4(
              ...RESERVOIR_GLOW_FACE_INTENSITY_LEVELS,
            ),
          },
        })),
      ),
    [],
  );
  const inspectionSpokeUniforms = useMemo(
    () =>
      RESERVOIR_GLOW_SPOKE_INTENSITIES.map(([inner, outer], bandIndex) =>
        Array.from({ length: 2 }, () => ({
          glowColor: {
            value: new THREE.Color(RESERVOIR_THEME.inspection),
          },
          glowStrength: { value: 0 },
          innerIntensity: { value: inner },
          innerDistance: {
            value: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][0],
          },
          outerIntensity: { value: outer },
          outerDistance: {
            value: RESERVOIR_GLOW_SPOKE_DISTANCES[bandIndex][1],
          },
          propagationProgress: { value: 1 },
          propagationWidth: {
            value: RESERVOIR_GLOW_PROPAGATION_WIDTH,
          },
        })),
      ),
    [],
  );
  const inspectionSlots = useRef<[InspectionSlot, InspectionSlot]>([
    { strength: 0, vertexId: null },
    { strength: 0, vertexId: null },
  ]);
  const activeSlot = useRef(0);
  const desiredVertexId = useRef<number | null>(null);
  const observedInspectionRevision = useRef(-1);
  const baseGridMaterial = useRef<THREE.LineBasicMaterial | null>(null);
  const renderedSelectionSignature = useRef("");
  const localInspectionPoint = useMemo(() => new THREE.Vector3(), []);
  const selectionMask = useMemo(
    () => {
      if (selectedArtifactVertexIds.length === 0) return null;
      const faceIds = new Set<number>();
      const edgeKeys = new Set<string>();
      for (const vertexId of selectedArtifactVertexIds) {
        const mask = getReservoirGridSelectionMask(vertexId);
        if (!mask) continue;
        for (const faceId of mask.faceIds) faceIds.add(faceId);
        for (const edgeKey of mask.edgeKeys) edgeKeys.add(edgeKey);
      }
      return { edgeKeys, faceIds };
    },
    [selectedArtifactVertexIds],
  );
  const selectionSignature = selectedArtifactVertexIds.join(",");

  useEffect(
    () => () => {
      baseGeometry.dispose();
      for (const band of inspectionSpokeGeometries) {
        for (const geometry of band) geometry.dispose();
      }
      for (const band of inspectionBorderGeometries) {
        for (const geometry of band) geometry.dispose();
      }
      for (const band of inspectionFaceGeometries) {
        for (const geometry of band) geometry.dispose();
      }
    },
    [
      baseGeometry,
      inspectionBorderGeometries,
      inspectionFaceGeometries,
      inspectionSpokeGeometries,
    ],
  );

  useFrame((_, delta) => {
    if (baseGridMaterial.current) {
      baseGridMaterial.current.opacity = THREE.MathUtils.lerp(
        0.34,
        0.1,
        recessionProgressRef.current,
      );
    }
    const inspection = inspectionRef.current;
    const sphere = sphereRef.current;
    let nextVertexId = desiredVertexId.current;

    if (!inspection.active) {
      nextVertexId = null;
      observedInspectionRevision.current = inspection.revision;
    } else if (
      sphere &&
      inspection.revision !== observedInspectionRevision.current
    ) {
      sphere.updateWorldMatrix(true, false);
      localInspectionPoint.copy(inspection.worldPoint);
      sphere.worldToLocal(localInspectionPoint);
      nextVertexId = findNearestReservoirGridVertexId(
        localInspectionPoint,
      );
      observedInspectionRevision.current = inspection.revision;
    }

    const selectionChanged =
      selectionSignature !== renderedSelectionSignature.current;

    if (selectionChanged) {
      renderedSelectionSignature.current = selectionSignature;
      for (const slot of inspectionSlots.current) slot.strength = 0;
    }

    if (
      nextVertexId !== desiredVertexId.current ||
      (selectionChanged && nextVertexId !== null)
    ) {
      if (!selectionChanged) {
        const outgoingSlot = inspectionSlots.current[activeSlot.current];
        outgoingSlot.strength = Math.min(
          outgoingSlot.strength,
          OUTGOING_REGION_MAX_STRENGTH,
        );
      }

      desiredVertexId.current = nextVertexId;

      if (nextVertexId !== null) {
        const nextSlot = activeSlot.current === 0 ? 1 : 0;
        const facePoints = getReservoirGridInspectionFacePoints(
          nextVertexId,
          selectionMask?.faceIds,
        );
        const edgePoints = getReservoirGridInspectionEdgePoints(
          nextVertexId,
          selectionMask?.edgeKeys,
        );

        for (
          let spokeIndex = 0;
          spokeIndex < INSPECTION_SPOKE_BAND_COUNT;
          spokeIndex += 1
        ) {
          updateInspectionGeometry(
            inspectionSpokeGeometries[spokeIndex][nextSlot],
            edgePoints.spokes[spokeIndex].points,
            MAX_INSPECTION_EDGE_POINTS,
            "innerWeight",
            edgePoints.spokes[spokeIndex].attributeValues,
          );
        }
        for (
          let bandIndex = 0;
          bandIndex < INSPECTION_FACE_BAND_COUNT;
          bandIndex += 1
        ) {
          updateInspectionGeometry(
            inspectionBorderGeometries[bandIndex][nextSlot],
            edgePoints.borders[bandIndex],
            MAX_INSPECTION_EDGE_POINTS,
          );
          updateInspectionGeometry(
            inspectionFaceGeometries[bandIndex][nextSlot],
            facePoints[bandIndex].points,
            MAX_INSPECTION_FACE_POINTS,
            "intensityLevel",
            facePoints[bandIndex].attributeValues,
          );
        }
        inspectionSlots.current[nextSlot].vertexId = nextVertexId;
        inspectionSlots.current[nextSlot].strength = 1;
        activeSlot.current = nextSlot;
      }
    }

    for (let index = 0; index < inspectionSlots.current.length; index += 1) {
      const slot = inspectionSlots.current[index];

      const isDesiredSlot =
        nextVertexId !== null &&
        index === activeSlot.current &&
        slot.vertexId === nextVertexId;
      if (isDesiredSlot) {
        slot.strength = 1;
      } else {
        slot.strength = THREE.MathUtils.damp(
          slot.strength,
          0,
          INSPECTION_FADE_OUT_DAMPING,
          delta,
        );
      }

      const visible = slot.strength > 0.005;
      for (
        let spokeIndex = 0;
        spokeIndex < INSPECTION_SPOKE_BAND_COUNT;
        spokeIndex += 1
      ) {
        const spokeMaterial =
          inspectionSpokeMaterials.current[spokeIndex][index];
        const spokeLines = inspectionSpokeLines.current[spokeIndex][index];
        if (!spokeMaterial || !spokeLines) continue;

        spokeMaterial.uniforms.glowStrength.value =
          slot.strength * RESERVOIR_CURSOR_GLOW_GAIN;
        spokeLines.visible = visible;
      }
      for (
        let bandIndex = 0;
        bandIndex < INSPECTION_FACE_BAND_COUNT;
        bandIndex += 1
      ) {
        const faceMaterial =
          inspectionFaceMaterials.current[bandIndex][index];
        const borderMaterial =
          inspectionBorderMaterials.current[bandIndex][index];
        const faceMesh = inspectionFaceMeshes.current[bandIndex][index];
        const borderLines = inspectionBorderLines.current[bandIndex][index];
        if (
          !faceMaterial ||
          !borderMaterial ||
          !faceMesh ||
          !borderLines
        ) {
          continue;
        }

        faceMaterial.uniforms.glowStrength.value =
          slot.strength * RESERVOIR_CURSOR_GLOW_GAIN;
        borderMaterial.opacity =
          slot.strength *
          RESERVOIR_CURSOR_GLOW_GAIN *
          RESERVOIR_GLOW_BORDER_OPACITIES[bandIndex];
        faceMesh.visible = visible;
        borderLines.visible = visible;
      }
    }
  });

  return (
    <>
      <lineSegments
        geometry={baseGeometry}
        renderOrder={RESERVOIR_RENDER_ORDER.baseGrid}
      >
        <lineBasicMaterial
          ref={baseGridMaterial}
          color={RESERVOIR_THEME.grid}
          transparent
          opacity={0.34}
        />
      </lineSegments>
      {inspectionFaceGeometries.flatMap((slotGeometries, bandIndex) =>
        slotGeometries.map((geometry, slotIndex) => (
          <mesh
            key={`face-${bandIndex}-${slotIndex}`}
            ref={(mesh) => {
              inspectionFaceMeshes.current[bandIndex][slotIndex] = mesh;
            }}
            geometry={geometry}
            renderOrder={RESERVOIR_RENDER_ORDER.cursorFaceGlow}
            frustumCulled={false}
            visible={false}
          >
            <shaderMaterial
              ref={(material) => {
                inspectionFaceMaterials.current[bandIndex][slotIndex] =
                  material;
              }}
              uniforms={inspectionFaceUniforms[bandIndex][slotIndex]}
              vertexShader={RESERVOIR_FACE_GRADIENT_VERTEX_SHADER}
              fragmentShader={RESERVOIR_GLOW_FRAGMENT_SHADER}
              transparent
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
      {inspectionSpokeGeometries.flatMap((slotGeometries, bandIndex) =>
        slotGeometries.map((geometry, slotIndex) => (
          <lineSegments
            key={`spoke-${bandIndex}-${slotIndex}`}
            ref={(lines) => {
              inspectionSpokeLines.current[bandIndex][slotIndex] = lines;
            }}
            geometry={geometry}
            renderOrder={RESERVOIR_RENDER_ORDER.cursorEdgeGlow}
            frustumCulled={false}
            visible={false}
          >
            <shaderMaterial
              ref={(material) => {
                inspectionSpokeMaterials.current[bandIndex][slotIndex] =
                  material;
              }}
              uniforms={inspectionSpokeUniforms[bandIndex][slotIndex]}
              vertexShader={RESERVOIR_SPOKE_GRADIENT_VERTEX_SHADER}
              fragmentShader={RESERVOIR_GLOW_FRAGMENT_SHADER}
              transparent
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        )),
      )}
      {inspectionBorderGeometries.flatMap((slotGeometries, bandIndex) =>
        slotGeometries.map((geometry, slotIndex) => (
          <lineSegments
            key={`border-${bandIndex}-${slotIndex}`}
            ref={(lines) => {
              inspectionBorderLines.current[bandIndex][slotIndex] = lines;
            }}
            geometry={geometry}
            renderOrder={RESERVOIR_RENDER_ORDER.cursorEdgeGlow}
            frustumCulled={false}
            visible={false}
          >
            <lineBasicMaterial
              ref={(material) => {
                inspectionBorderMaterials.current[bandIndex][slotIndex] =
                  material;
              }}
              color={RESERVOIR_THEME.inspection}
              transparent
              opacity={0}
              depthTest
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        )),
      )}
    </>
  );
}
