export type ReservoirLabelLevel = "hidden" | "inspection" | "persistent";

export const RESERVOIR_LABEL_LEVEL = {
  inspection: {
    nodePixels: {
      enter: 12,
      exit: 9,
    },
  },
  persistent: {
    nodePixels: {
      enter: 36,
      exit: 30,
    },
  },
} as const;

type ReservoirLabelLevelInput = {
  currentLevel: ReservoirLabelLevel;
  projectedNodePixels: number;
  inspectionActive: boolean;
  frontFacing: boolean;
  suppressed: boolean;
};

function meetsInspectionThreshold(projectedNodePixels: number) {
  return projectedNodePixels >= RESERVOIR_LABEL_LEVEL.inspection.nodePixels.enter;
}

function remainsInspectionThreshold(projectedNodePixels: number) {
  return projectedNodePixels >= RESERVOIR_LABEL_LEVEL.inspection.nodePixels.exit;
}

function meetsPersistentThreshold(projectedNodePixels: number) {
  return projectedNodePixels >= RESERVOIR_LABEL_LEVEL.persistent.nodePixels.enter;
}

function remainsPersistentThreshold(projectedNodePixels: number) {
  return projectedNodePixels >= RESERVOIR_LABEL_LEVEL.persistent.nodePixels.exit;
}

/**
 * Resolves the label's visibility level using projected node size hysteresis
 * so labels remain stable during wheel and pinch gestures.
 */
export function getReservoirLabelLevel({
  currentLevel,
  projectedNodePixels,
  inspectionActive,
  frontFacing,
  suppressed,
}: ReservoirLabelLevelInput): ReservoirLabelLevel {
  if (
    suppressed ||
    !frontFacing ||
    !Number.isFinite(projectedNodePixels) ||
    projectedNodePixels <= 0
  ) {
    return "hidden";
  }

  if (currentLevel === "persistent" && remainsPersistentThreshold(projectedNodePixels)) {
    return "persistent";
  }

  if (meetsPersistentThreshold(projectedNodePixels)) {
    return "persistent";
  }

  if (
    inspectionActive &&
    (currentLevel === "inspection" || currentLevel === "persistent") &&
    remainsInspectionThreshold(projectedNodePixels)
  ) {
    return "inspection";
  }

  if (inspectionActive && meetsInspectionThreshold(projectedNodePixels)) {
    return "inspection";
  }

  return "hidden";
}
