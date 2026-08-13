import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import {
  createReservoirGridLineGeometry,
  createReservoirSurfaceGeometry,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import { RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY } from "@/lib/reservoir/node";
import {
  RESERVOIR_SELECTED_GRID_FRAGMENT_SHADER,
  RESERVOIR_SELECTED_GRID_VERTEX_SHADER,
} from "@/lib/reservoir/selection";
import type { ReservoirSelectedGridUniforms } from "@/lib/reservoir/selection";
import type { ReservoirCollection } from "@/types/reservoir";

export type CollectionRenderState = "active" | "dormant";

type CollectionSphereProps = {
  collection: ReservoirCollection;
  state: CollectionRenderState;
  radius: number;
  surfaceDetail: number;
  gridDetail: number;
  surfaceScale?: number;
  surfaceVisible?: boolean;
  gridArcSegments?: number;
  surfaceRef?: RefObject<THREE.Mesh | null>;
  surfaceMaterialRef?: RefObject<THREE.MeshStandardMaterial | null>;
  gridMaterialRef?: RefObject<THREE.LineBasicMaterial | null>;
  dormantGridMaterialRef?: RefObject<THREE.ShaderMaterial | null>;
  resolvedGridDetail?: number;
  resolvedGridMaterialRef?: RefObject<THREE.LineBasicMaterial | null>;
  dormantGridContactDirection?: THREE.Vector3;
  surfaceUserData?: Record<string, unknown>;
  surfaceOnBeforeCompile?: THREE.MeshStandardMaterial["onBeforeCompile"];
  surfaceProgramCacheKey?: () => string;
  onPointerEnter?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (event: ThreeEvent<PointerEvent>) => void;
};

export function CollectionSphere({
  collection,
  state,
  radius,
  surfaceDetail,
  gridDetail,
  surfaceScale = 1.0015,
  surfaceVisible = true,
  gridArcSegments = 1,
  surfaceRef,
  surfaceMaterialRef,
  gridMaterialRef,
  dormantGridMaterialRef,
  resolvedGridDetail,
  resolvedGridMaterialRef,
  dormantGridContactDirection,
  surfaceUserData,
  surfaceOnBeforeCompile,
  surfaceProgramCacheKey,
  onPointerEnter,
  onPointerLeave,
}: CollectionSphereProps) {
  const active = state === "active";
  const surfaceGeometry = useMemo(
    () => createReservoirSurfaceGeometry(radius, surfaceDetail),
    [radius, surfaceDetail],
  );
  const gridGeometry = useMemo(
    () =>
      createReservoirGridLineGeometry(
        radius,
        gridDetail,
        surfaceScale,
        gridArcSegments,
      ),
    [gridArcSegments, gridDetail, radius, surfaceScale],
  );
  const dormantGridUniforms = useMemo<ReservoirSelectedGridUniforms>(
    () => ({
      baseColor: { value: new THREE.Color(RESERVOIR_THEME.grid) },
      selectedColor: {
        value: new THREE.Color(RESERVOIR_THEME.inspection),
      },
      contactDirection: {
        value:
          dormantGridContactDirection?.clone() ??
          new THREE.Vector3(0, -1, 0),
      },
      baseOpacity: { value: 0.34 },
      selectedReveal: { value: 0 },
    }),
    [dormantGridContactDirection],
  );
  const resolvedGridGeometry = useMemo(
    () =>
      resolvedGridDetail === undefined
        ? null
        : createReservoirGridLineGeometry(
            radius,
            resolvedGridDetail,
            1.0015,
            1,
          ),
    [radius, resolvedGridDetail],
  );

  useEffect(
    () => () => {
      surfaceGeometry.dispose();
      gridGeometry.dispose();
      resolvedGridGeometry?.dispose();
    },
    [gridGeometry, resolvedGridGeometry, surfaceGeometry],
  );

  return (
    <group
      userData={{
        collectionId: collection.id,
        collectionRenderState: state,
      }}
    >
      {surfaceVisible ? <mesh
        ref={surfaceRef}
        geometry={surfaceGeometry}
        renderOrder={
          active
            ? RESERVOIR_RENDER_ORDER.surface
            : RESERVOIR_RENDER_ORDER.collectionNode
        }
        userData={surfaceUserData}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <meshStandardMaterial
          ref={surfaceMaterialRef}
          color={
            active
              ? RESERVOIR_THEME.sphere
              : RESERVOIR_THEME.dormantCollection
          }
          emissive={RESERVOIR_THEME.dormantCollection}
          emissiveIntensity={
            active ? 0 : RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY
          }
          roughness={active ? 0.96 : 0.82}
          metalness={0}
          polygonOffset={active}
          polygonOffsetFactor={active ? 1 : 0}
          polygonOffsetUnits={active ? 1 : 0}
          onBeforeCompile={surfaceOnBeforeCompile}
          customProgramCacheKey={surfaceProgramCacheKey}
        />
      </mesh> : null}
      <lineSegments
        geometry={gridGeometry}
        renderOrder={
          active
            ? RESERVOIR_RENDER_ORDER.baseGrid
            : RESERVOIR_RENDER_ORDER.collectionGrid
        }
      >
        {active ? (
          <lineBasicMaterial
            ref={gridMaterialRef}
            color={RESERVOIR_THEME.grid}
            transparent
            opacity={0.34}
          />
        ) : (
          <shaderMaterial
            ref={dormantGridMaterialRef}
            uniforms={dormantGridUniforms}
            vertexShader={RESERVOIR_SELECTED_GRID_VERTEX_SHADER}
            fragmentShader={RESERVOIR_SELECTED_GRID_FRAGMENT_SHADER}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        )}
      </lineSegments>
      {resolvedGridGeometry ? (
        <lineSegments
          geometry={resolvedGridGeometry}
          renderOrder={RESERVOIR_RENDER_ORDER.baseGrid}
        >
          <lineBasicMaterial
            ref={resolvedGridMaterialRef}
            color={RESERVOIR_THEME.grid}
            transparent
            opacity={0}
          />
        </lineSegments>
      ) : null}
    </group>
  );
}
