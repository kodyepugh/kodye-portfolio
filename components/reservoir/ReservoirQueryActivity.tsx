import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import {
  RESERVOIR_RADIUS,
} from "@/lib/reservoir/geometry";
import {
  RESERVOIR_RENDER_ORDER,
  RESERVOIR_THEME,
} from "@/lib/reservoir/theme";
import {
  COLLECTION_RECONSTITUTION_TIMING,
  getCollectionReconstitutionFrame,
} from "@/lib/reservoir/collection-entry";

const QUERY_ACTIVITY_DURATION = 0.92;
const QUERY_ACTIVITY_REDUCED_MOTION_DURATION = 0.16;
const EMPTY_QUERY_ACTIVITY_DURATION = 0.62;
const EMPTY_QUERY_ACTIVITY_REDUCED_MOTION_DURATION = 0.2;
const EMPTY_QUERY_EMISSIVE_INTENSITY = 0.028;
const EMPTY_QUERY_RED = new THREE.Color("#b33a40");
const EMPTY_QUERY_BASE_EMISSIVE = new THREE.Color(
  RESERVOIR_THEME.dormantCollection,
);
const QUERY_TWINKLE_COUNT = 180;

const QUERY_TWINKLE_VERTEX_SHADER = /* glsl */ `
  attribute float twinkleStart;
  attribute float twinkleDuration;
  attribute float twinkleIntensity;
  attribute float twinkleCandidate;

  varying float vTwinkleStart;
  varying float vTwinkleDuration;
  varying float vTwinkleIntensity;
  varying float vTwinkleCandidate;

  void main() {
    vTwinkleStart = twinkleStart;
    vTwinkleDuration = twinkleDuration;
    vTwinkleIntensity = twinkleIntensity;
    vTwinkleCandidate = twinkleCandidate;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float distanceScale = 3.2 / max(-mvPosition.z, 1.0);
    gl_PointSize = clamp(
      (1.05 + twinkleIntensity * 1.9) * distanceScale * 2.0,
      1.0,
      4.8
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
    float alpha =
      activity * activityEnvelope * vTwinkleIntensity * pointHalo * 0.24;
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

function createQueryTwinkleGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(QUERY_TWINKLE_COUNT * 3);
  const starts = new Float32Array(QUERY_TWINKLE_COUNT);
  const durations = new Float32Array(QUERY_TWINKLE_COUNT);
  const intensities = new Float32Array(QUERY_TWINKLE_COUNT);
  const candidates = new Float32Array(QUERY_TWINKLE_COUNT);
  const radius = RESERVOIR_RADIUS * 1.0018;

  for (let twinkleIndex = 0; twinkleIndex < QUERY_TWINKLE_COUNT; twinkleIndex += 1) {
    const u = seededUnit(twinkleIndex * 4 + 1);
    const v = seededUnit(twinkleIndex * 4 + 2);
    const theta = u * Math.PI * 2;
    const z = v * 2 - 1;
    const sinTheta = Math.sqrt(Math.max(0, 1 - z * z));

    positions[twinkleIndex * 3] = Math.cos(theta) * sinTheta * radius;
    positions[twinkleIndex * 3 + 1] = z * radius;
    positions[twinkleIndex * 3 + 2] = Math.sin(theta) * sinTheta * radius;

    starts[twinkleIndex] = seededUnit(twinkleIndex * 4 + 3);
    durations[twinkleIndex] = 0.08 + seededUnit(twinkleIndex * 4 + 4) * 0.12;
    intensities[twinkleIndex] = 0.34 + seededUnit(twinkleIndex * 4 + 5) * 0.66;
    candidates[twinkleIndex] = seededUnit(twinkleIndex * 4 + 6);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "twinkleStart",
    new THREE.BufferAttribute(starts, 1),
  );
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

  return { geometry, twinkleCount: QUERY_TWINKLE_COUNT };
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
      diagnosticsRef.current.dataset.queryFacePool = "surface-twinkle-points";
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
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={QUERY_TWINKLE_VERTEX_SHADER}
        fragmentShader={QUERY_TWINKLE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
