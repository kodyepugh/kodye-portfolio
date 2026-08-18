import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  RESERVOIR_RADIUS,
  createReservoirGridLineGeometry,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import {
  COLLECTION_RECONSTITUTION_TIMING,
  getCollectionReconstitutionFrame,
} from "@/lib/reservoir/collection-entry";
import { RESERVOIR_SURFACE_PATTERN } from "@/lib/reservoir/surface-material";

const QUERY_ACTIVITY_DURATION = 0.92;
const QUERY_ACTIVITY_REDUCED_MOTION_DURATION = 0.16;
const EMPTY_QUERY_ACTIVITY_DURATION = 0.62;
const EMPTY_QUERY_ACTIVITY_REDUCED_MOTION_DURATION = 0.2;
const EMPTY_QUERY_EMISSIVE_INTENSITY = 0.028;
const EMPTY_QUERY_RED = new THREE.Color("#b33a40");
const EMPTY_QUERY_BASE_EMISSIVE = new THREE.Color(
  RESERVOIR_THEME.dormantCollection,
);
const QUERY_TWINKLE_QUANTIZATION = 10000;
const QUERY_TWINKLE_SAMPLE_THRESHOLD = 0.22;
const QUERY_TWINKLE_MIN_COUNT = 240;

const QUERY_TWINKLE_VERTEX_SHADER = /* glsl */ `
  attribute float twinkleStart;
  attribute float twinkleDuration;
  attribute float twinkleIntensity;
  attribute float twinkleCandidate;

  varying float vTwinkleStart;
  varying float vTwinkleDuration;
  varying float vTwinkleIntensity;
  varying float vTwinkleCandidate;
  varying float vTwinkleFacing;

  void main() {
    vTwinkleStart = twinkleStart;
    vTwinkleDuration = twinkleDuration;
    vTwinkleIntensity = twinkleIntensity;
    vTwinkleCandidate = twinkleCandidate;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 localNormal = normalize(position);
    vec3 viewDirection = normalize(-mvPosition.xyz);
    vTwinkleFacing = max(dot(localNormal, viewDirection), 0.0);
    float distanceScale = 3.2 / max(-mvPosition.z, 1.0);
    gl_PointSize = clamp(
      (1.15 + twinkleIntensity * 2.15) * distanceScale * 2.0,
      1.1,
      4.4
    );
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const QUERY_TWINKLE_FRAGMENT_SHADER = /* glsl */ `
  uniform float queryProgress;
  uniform float querySeed;
  uniform float reducedMotion;
  uniform float sustainedActivity;
  uniform float twinkleEnvelope;

  varying float vTwinkleStart;
  varying float vTwinkleDuration;
  varying float vTwinkleIntensity;
  varying float vTwinkleCandidate;
  varying float vTwinkleFacing;

  void main() {
    vec2 pointOffset = gl_PointCoord - vec2(0.5);
    float pointHalo = 1.0 - smoothstep(0.0, 0.5, length(pointOffset));
    float seededStart = fract(vTwinkleStart + querySeed * 0.173) * 0.70;
    float seededCandidate = fract(
      vTwinkleCandidate + querySeed * 0.317
    );
    float candidate = step(0.58, seededCandidate);
    float elapsed = queryProgress - seededStart;
    float rise = smoothstep(0.0, vTwinkleDuration * 0.26, elapsed);
    float fall = 1.0 - smoothstep(
      vTwinkleDuration * 0.44,
      vTwinkleDuration,
      elapsed
    );
    float twinkle = rise * fall * candidate;
    float reducedEmphasis =
      sin(queryProgress * 3.14159265) * candidate * 0.48;
    float queryActivity = mix(
      twinkle,
      reducedEmphasis,
      step(0.5, reducedMotion)
    );
    float sustainedCandidate = step(0.48, seededCandidate);
    float sustainedPhase = fract(
      queryProgress * (1.9 + vTwinkleDuration * 3.6) + seededStart
    );
    float sustainedRise = smoothstep(0.0, 0.12, sustainedPhase);
    float sustainedFall = 1.0 - smoothstep(0.34, 0.78, sustainedPhase);
    float sustainedTwinkle =
      sustainedRise * sustainedFall * sustainedCandidate;
    float sustainedReducedEmphasis =
      (0.16 + 0.22 * pow(sin(sustainedPhase * 3.14159265), 2.0)) *
      sustainedCandidate;
    float sustainedQueryActivity = mix(
      sustainedTwinkle,
      sustainedReducedEmphasis,
      step(0.5, reducedMotion)
    );
    float activity = mix(
      queryActivity,
      sustainedQueryActivity,
      step(0.5, sustainedActivity)
    );
    float activityEnvelope = mix(
      1.0,
      twinkleEnvelope,
      step(0.5, sustainedActivity)
    );
    float facingEnvelope = smoothstep(0.0, 0.36, vTwinkleFacing);
    float alpha =
      activity *
      activityEnvelope *
      facingEnvelope *
      vTwinkleIntensity *
      pointHalo *
      0.36;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(vec3(1.0), alpha);
  }
`;

type ReservoirQueryActivityProps = {
  diagnosticsRef: RefObject<HTMLDivElement | null>;
  mode: ReservoirQueryActivityMode | null;
  onComplete: () => void;
  reducedMotion: boolean;
  revision: number | null;
  surfaceMaterialRef: RefObject<THREE.MeshStandardMaterial | null>;
  externalProgressRef?: MutableRefObject<number>;
};

export type ReservoirQueryActivityMode = "success" | "empty";

function seededUnit(value: number) {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function hashQuantizedTwinklePosition(
  quantizedX: number,
  quantizedY: number,
  quantizedZ: number,
) {
  let hash = quantizedX | 0;
  hash = Math.imul(hash ^ (quantizedY | 0), 0x45d9f3b);
  hash = Math.imul(hash ^ (quantizedZ | 0), 0x45d9f3b);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function createQueryTwinkleGeometry() {
  const source = createReservoirGridLineGeometry(
    RESERVOIR_RADIUS * 1.0018,
    RESERVOIR_SURFACE_PATTERN.detail,
    RESERVOIR_SURFACE_PATTERN.surfaceScale,
  );
  const positions = source.getAttribute("position");
  const deduped = new Map<
    string,
    {
      key: string;
      position: THREE.Vector3;
      seed: number;
    }
  >();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const quantizedX = Math.round(x * QUERY_TWINKLE_QUANTIZATION);
    const quantizedY = Math.round(y * QUERY_TWINKLE_QUANTIZATION);
    const quantizedZ = Math.round(z * QUERY_TWINKLE_QUANTIZATION);
    const key = `${quantizedX}:${quantizedY}:${quantizedZ}`;
    if (deduped.has(key)) continue;

    deduped.set(key, {
      key,
      position: new THREE.Vector3(x, y, z),
      seed: hashQuantizedTwinklePosition(
        quantizedX,
        quantizedY,
        quantizedZ,
      ),
    });
  }

  const sampled = [...deduped.values()]
    .filter((entry) => seededUnit(entry.seed) < QUERY_TWINKLE_SAMPLE_THRESHOLD)
    .sort((first, second) => first.seed - second.seed);
  const sampledKeys = new Set(sampled.map((entry) => entry.key));

  if (sampled.length < QUERY_TWINKLE_MIN_COUNT) {
    for (const entry of [...deduped.values()].sort(
      (first, second) => first.seed - second.seed,
    )) {
      if (sampled.length >= QUERY_TWINKLE_MIN_COUNT) break;
      if (sampledKeys.has(entry.key)) continue;
      sampled.push(entry);
      sampledKeys.add(entry.key);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const pointCount = sampled.length;
  const pointPositions = new Float32Array(pointCount * 3);
  const starts = new Float32Array(pointCount);
  const durations = new Float32Array(pointCount);
  const intensities = new Float32Array(pointCount);
  const candidates = new Float32Array(pointCount);

  for (let index = 0; index < pointCount; index += 1) {
    const point = sampled[index];
    pointPositions[index * 3] = point.position.x;
    pointPositions[index * 3 + 1] = point.position.y;
    pointPositions[index * 3 + 2] = point.position.z;
    starts[index] = seededUnit(point.seed ^ 0x9e3779b9);
    durations[index] = 0.05 + seededUnit(point.seed ^ 0x3c6ef372) * 0.1;
    intensities[index] = 0.5 + seededUnit(point.seed ^ 0x1b873593) * 0.5;
    candidates[index] = seededUnit(point.seed ^ 0x85ebca6b);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
  geometry.setAttribute("twinkleStart", new THREE.BufferAttribute(starts, 1));
  geometry.setAttribute(
    "twinkleDuration",
    new THREE.BufferAttribute(durations, 1),
  );
  geometry.setAttribute(
    "twinkleIntensity",
    new THREE.BufferAttribute(intensities, 1),
  );
  geometry.setAttribute(
    "twinkleCandidate",
    new THREE.BufferAttribute(candidates, 1),
  );

  source.dispose();

  return { geometry, twinkleCount: pointCount };
}

export function ReservoirQueryActivity({
  diagnosticsRef,
  mode,
  onComplete,
  reducedMotion,
  revision,
  surfaceMaterialRef,
  externalProgressRef,
}: ReservoirQueryActivityProps) {
  const preparedGeometry = useMemo(() => createQueryTwinkleGeometry(), []);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(true);
  const activeRevisionRef = useRef<number | null>(null);
  const activeModeRef = useRef<ReservoirQueryActivityMode | null>(null);
  const uniforms = useMemo(
    () => ({
      queryProgress: { value: 0 },
      querySeed: { value: 0 },
      reducedMotion: { value: 0 },
      sustainedActivity: { value: 0 },
      twinkleEnvelope: { value: 1 },
    }),
    [],
  );

  const resetEmptyQueryPresentation = useCallback(() => {
    const surfaceMaterial = surfaceMaterialRef.current;
    if (surfaceMaterial) {
      surfaceMaterial.emissive.copy(EMPTY_QUERY_BASE_EMISSIVE);
      surfaceMaterial.emissiveIntensity = 0;
    }
  }, [surfaceMaterialRef]);

  useEffect(() => {
    if (revision === null || mode === null) {
      completedRef.current = true;
      activeRevisionRef.current = null;
      activeModeRef.current = null;
      if (materialRef.current) {
        materialRef.current.uniforms.queryProgress.value = 0;
        materialRef.current.uniforms.sustainedActivity.value = 0;
        materialRef.current.uniforms.twinkleEnvelope.value = 1;
        materialRef.current.visible = false;
      }
      if (diagnosticsRef.current) {
        diagnosticsRef.current.dataset.queryMeshActive = "false";
        diagnosticsRef.current.dataset.queryWhiteTwinkleActive = "false";
        diagnosticsRef.current.dataset.queryWhiteTwinkleEnvelope = "0.000000";
        diagnosticsRef.current.dataset.queryWhiteTwinkleLifecycle = "inactive";
      }
      resetEmptyQueryPresentation();
      return;
    }

    elapsedRef.current = 0;
    completedRef.current = false;
    activeRevisionRef.current = revision;
    activeModeRef.current = mode;
    resetEmptyQueryPresentation();
    if (materialRef.current) {
      materialRef.current.uniforms.queryProgress.value = 0;
      materialRef.current.uniforms.querySeed.value = revision;
      materialRef.current.uniforms.reducedMotion.value = reducedMotion ? 1 : 0;
      materialRef.current.uniforms.sustainedActivity.value =
        externalProgressRef ? 1 : 0;
      materialRef.current.uniforms.twinkleEnvelope.value = 1;
      materialRef.current.visible = mode === "success";
    }
  }, [
    diagnosticsRef,
    externalProgressRef,
    mode,
    reducedMotion,
    resetEmptyQueryPresentation,
    revision,
  ]);

  useEffect(() => () => {
    preparedGeometry.geometry.dispose();
    resetEmptyQueryPresentation();
  }, [preparedGeometry, resetEmptyQueryPresentation]);

  useFrame((_, delta) => {
    if (completedRef.current || activeRevisionRef.current === null) return;
    const activeMode = activeModeRef.current;
    if (!activeMode) return;
    const duration = activeMode === "empty"
      ? reducedMotion
        ? EMPTY_QUERY_ACTIVITY_REDUCED_MOTION_DURATION
        : EMPTY_QUERY_ACTIVITY_DURATION
      : reducedMotion
        ? QUERY_ACTIVITY_REDUCED_MOTION_DURATION
        : QUERY_ACTIVITY_DURATION;
    if (!externalProgressRef) {
      elapsedRef.current = Math.min(elapsedRef.current + delta, duration);
    }
    const progress = externalProgressRef
      ? Math.min(externalProgressRef.current, 1)
      : elapsedRef.current / duration;
    const collectionFrame = externalProgressRef
      ? getCollectionReconstitutionFrame(progress)
      : null;
    const twinkleEnvelope = collectionFrame?.twinkleEnvelope ?? 1;
    if (activeMode === "success" && materialRef.current) {
      materialRef.current.uniforms.queryProgress.value = progress;
      materialRef.current.uniforms.twinkleEnvelope.value = twinkleEnvelope;
      materialRef.current.visible = twinkleEnvelope > 0.001;
    }

    const emptyEnvelope = reducedMotion
      ? progress < 0.32
        ? 1
        : 1 - THREE.MathUtils.smoothstep(progress, 0.32, 1)
      : Math.sin(Math.PI * progress) ** 2;
    if (activeMode === "empty") {
      const surfaceMaterial = surfaceMaterialRef.current;
      if (surfaceMaterial) {
        surfaceMaterial.emissive.copy(EMPTY_QUERY_RED);
        surfaceMaterial.emissiveIntensity =
          EMPTY_QUERY_EMISSIVE_INTENSITY * emptyEnvelope;
      }
    }

    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.queryMeshActive = "true";
      diagnosticsRef.current.dataset.queryMeshMode = activeMode;
      diagnosticsRef.current.dataset.queryMeshProgress = progress.toFixed(6);
      diagnosticsRef.current.dataset.queryMeshRevision = String(
        activeRevisionRef.current,
      );
      diagnosticsRef.current.dataset.queryFacePool =
        "topology-vertex-twinkles";
      diagnosticsRef.current.dataset.queryFaceCount = String(
        preparedGeometry.twinkleCount,
      );
      diagnosticsRef.current.dataset.queryWhiteTwinkleActive = String(
        activeMode === "success" && progress < 1,
      );
      diagnosticsRef.current.dataset.queryWhiteTwinkleEnvelope =
        activeMode === "success" ? twinkleEnvelope.toFixed(6) : "0.000000";
      diagnosticsRef.current.dataset.queryWhiteTwinkleLifecycle =
        externalProgressRef
          ? progress < COLLECTION_RECONSTITUTION_TIMING.handoff
            ? "deactivating"
            : progress < COLLECTION_RECONSTITUTION_TIMING.destinationNodesSettled
              ? "destination-emerging"
              : progress < 1
                ? "settled-fading"
                : "complete"
          : activeMode === "success"
            ? "explore"
            : "inactive";
      diagnosticsRef.current.dataset.emptyQueryPulseActive = String(
        activeMode === "empty",
      );
      diagnosticsRef.current.dataset.emptyQueryPulseProgress =
        activeMode === "empty" ? progress.toFixed(6) : "0.000000";
      diagnosticsRef.current.dataset.emptyQueryPulseEnvelope =
        activeMode === "empty" ? emptyEnvelope.toFixed(6) : "0.000000";
      diagnosticsRef.current.dataset.emptyQueryPulseSurface =
        activeMode === "empty" ? "existing-surface" : "";
    }

    if (progress < 1) return;
    if (externalProgressRef) {
      if (materialRef.current) materialRef.current.visible = false;
      if (diagnosticsRef.current) {
        diagnosticsRef.current.dataset.queryMeshActive = "false";
        diagnosticsRef.current.dataset.queryMeshProgress = "1.000000";
        diagnosticsRef.current.dataset.queryWhiteTwinkleActive = "false";
        diagnosticsRef.current.dataset.queryWhiteTwinkleEnvelope = "0.000000";
        diagnosticsRef.current.dataset.queryWhiteTwinkleLifecycle = "complete";
      }
      return;
    }
    completedRef.current = true;
    activeRevisionRef.current = null;
    activeModeRef.current = null;
    if (materialRef.current) materialRef.current.visible = false;
    resetEmptyQueryPresentation();
    if (diagnosticsRef.current) {
      diagnosticsRef.current.dataset.queryMeshActive = "false";
      diagnosticsRef.current.dataset.queryMeshProgress = "1.000000";
      diagnosticsRef.current.dataset.queryWhiteTwinkleActive = "false";
      diagnosticsRef.current.dataset.emptyQueryPulseActive = "false";
      diagnosticsRef.current.dataset.emptyQueryPulseEnvelope = "0.000000";
    }
    onComplete();
  });

  return (
    <points
      geometry={preparedGeometry.geometry}
      renderOrder={RESERVOIR_RENDER_ORDER.cursorFaceGlow}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={QUERY_TWINKLE_VERTEX_SHADER}
        fragmentShader={QUERY_TWINKLE_FRAGMENT_SHADER}
        transparent
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
