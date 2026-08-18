import assert from "node:assert/strict";
import * as THREE from "three";
import {
  clampLabelCenterToSafeBounds,
  getLabelRectangleSupportDistance,
  RESERVOIR_LABEL_CANDIDATE_ANGLES,
  RESERVOIR_LABEL_MIN_OUTWARD_DOT,
  rotateScreenDirection,
} from "../lib/reservoir/label-geometry.ts";
import { getReservoirLabelLevel } from "../lib/reservoir/label.ts";

const rectCenter = { x: 20, y: 170 };
const correctedCenter = new THREE.Vector2();

assert.equal(getLabelRectangleSupportDistance(1, 0, 40, 26), 40);
assert.equal(getLabelRectangleSupportDistance(0, 1, 40, 26), 26);
assert.equal(
  Math.round(getLabelRectangleSupportDistance(Math.SQRT1_2, Math.SQRT1_2, 40, 26)),
  37,
);
assert.equal(
  Math.round(getLabelRectangleSupportDistance(0.999, 0.0447, 40, 26)),
  40,
);

const outward = new THREE.Vector2(1, 0);
const candidate = new THREE.Vector2();
const acceptedAngles = [];
for (const angle of RESERVOIR_LABEL_CANDIDATE_ANGLES) {
  rotateScreenDirection(outward, angle, candidate);
  if (candidate.dot(outward) > RESERVOIR_LABEL_MIN_OUTWARD_DOT) {
    acceptedAngles.push(angle);
  }
}
assert.deepEqual(acceptedAngles, [0, 35, -35, 70, -70]);

clampLabelCenterToSafeBounds(
  rectCenter,
  80,
  52,
  20,
  180,
  20,
  180,
  correctedCenter,
);
assert.deepEqual(correctedCenter.toArray(), [60, 154]);

const resolve = (currentLevel, projectedNodePixels, inspectionActive, suppressed = false) =>
  getReservoirLabelLevel({
    currentLevel,
    projectedNodePixels,
    inspectionActive,
    frontFacing: true,
    suppressed,
  });

assert.equal(resolve("hidden", 50, false), "persistent");
assert.equal(resolve("hidden", 38, false), "persistent");
assert.equal(resolve("persistent", 32, false), "persistent");
assert.equal(resolve("hidden", 29, false), "hidden");
assert.equal(resolve("hidden", 15, true), "inspection");
assert.equal(resolve("hidden", 15, false), "hidden");
assert.equal(resolve("inspection", 10, true), "inspection");
assert.equal(resolve("inspection", 8, true), "hidden");
assert.equal(resolve("persistent", 50, false, true), "hidden");

console.log("label geometry validation passed");
