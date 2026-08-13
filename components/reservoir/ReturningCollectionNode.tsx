import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  COLLECTION_RETURN_PHASES,
  getCollectionEntryPhase,
} from "@/lib/reservoir/collection-entry";
import {
  RESERVOIR_GRID_DETAIL,
  RESERVOIR_SURFACE_DETAIL,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY,
} from "@/lib/reservoir/node";
import { RESERVOIR_THEME } from "@/lib/reservoir/theme";
import type { EmbeddedReservoirCollection } from "@/types/reservoir";
import {
  COLLECTION_GRID_DETAIL,
  COLLECTION_SURFACE_DETAIL,
} from "./CollectionNode";
import { CollectionSphere } from "./CollectionSphere";

type ReturningCollectionNodeProps = {
  collection: EmbeddedReservoirCollection;
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  endPosition: THREE.Vector3;
  endQuaternion: THREE.Quaternion;
  progressRef: MutableRefObject<number>;
  radius: number;
  startPosition: THREE.Vector3;
  startQuaternion: THREE.Quaternion;
};

export function ReturningCollectionNode({
  collection,
  diagnosticsRef,
  endPosition,
  endQuaternion,
  progressRef,
  radius,
  startPosition,
  startQuaternion,
}: ReturningCollectionNodeProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const surfaceMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const activeGridMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const dormantGridMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const activeColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.sphere),
    [],
  );
  const dormantColor = useMemo(
    () => new THREE.Color(RESERVOIR_THEME.dormantCollection),
    [],
  );
  const renderedQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const progress = progressRef.current;
    const greyDrain = getCollectionEntryPhase(
      progress,
      COLLECTION_RETURN_PHASES.childGreyDrain,
    );
    const gridDormancy = getCollectionEntryPhase(
      progress,
      COLLECTION_RETURN_PHASES.childGridDormancy,
    );
    const embeddingProgress = getCollectionEntryPhase(
      progress,
      COLLECTION_RETURN_PHASES.childEmbedding,
    );

    if (groupRef.current) {
      groupRef.current.position
        .copy(startPosition)
        .lerp(endPosition, embeddingProgress);
      renderedQuaternion
        .copy(startQuaternion)
        .slerp(endQuaternion, embeddingProgress)
        .normalize();
      groupRef.current.quaternion.copy(renderedQuaternion);
      groupRef.current.scale.setScalar(1);
    }
    if (surfaceMaterialRef.current) {
      surfaceMaterialRef.current.color
        .copy(activeColor)
        .lerp(dormantColor, greyDrain);
      surfaceMaterialRef.current.emissive.copy(dormantColor);
      surfaceMaterialRef.current.emissiveIntensity =
        RESERVOIR_NODE_RESTING_EMISSIVE_INTENSITY * greyDrain;
    }
    if (activeGridMaterialRef.current) {
      activeGridMaterialRef.current.opacity = 0.34 * (1 - gridDormancy);
    }
    if (dormantGridMaterialRef.current) {
      dormantGridMaterialRef.current.uniforms.baseOpacity.value =
        0.34 * gridDormancy;
    }

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.collectionGreyActivationProgress =
        (1 - greyDrain).toFixed(6);
      diagnosticsRef.current.dataset.collectionActiveGridProgress =
        (1 - gridDormancy).toFixed(6);
      diagnosticsRef.current.dataset.returningCollectionRadius =
        radius.toFixed(6);
      diagnosticsRef.current.dataset.returningCollectionWorldScale =
        "fixed";
      diagnosticsRef.current.dataset.returningCollectionPosition =
        groupRef.current?.position
          .toArray()
          .map((value) => value.toFixed(6))
          .join(",") ?? "";
    }
  });

  return (
    <group
      ref={groupRef}
      position={startPosition}
      quaternion={startQuaternion}
      userData={{
        collectionId: collection.id,
        collectionRenderState: "returning",
      }}
    >
      <CollectionSphere
        collection={collection}
        state="active"
        radius={radius}
        surfaceDetail={RESERVOIR_SURFACE_DETAIL}
        gridDetail={RESERVOIR_GRID_DETAIL}
        surfaceMaterialRef={surfaceMaterialRef}
        gridMaterialRef={activeGridMaterialRef}
      />
      <CollectionSphere
        collection={collection}
        state="dormant"
        radius={radius}
        surfaceDetail={COLLECTION_SURFACE_DETAIL}
        gridDetail={COLLECTION_GRID_DETAIL}
        surfaceScale={1.012}
        surfaceVisible={false}
        dormantGridMaterialRef={dormantGridMaterialRef}
      />
    </group>
  );
}
