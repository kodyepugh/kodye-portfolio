export type ReservoirLabelLevel = "hidden" | "inspection" | "persistent";

export const RESERVOIR_LABEL_LEVEL = {
  inspection: {
    nodePixels: {
      enter: 12,
      exit: 9,
    },
    zoom: {
      enter: 1.15,
      exit: 1.08,
    },
  },
  persistent: {
    nodePixels: {
      enter: 36,
      exit: 30,
    },
    zoom: {
      enter: 1.4,
      exit: 1.26,
    },
  },
} as const;

type ReservoirLabelLevelInput = {
  currentLevel: ReservoirLabelLevel;
  projectedNodePixels: number;
  renderedZoom: number;
  inspectionActive: boolean;
  frontFacing: boolean;
  suppressed: boolean;
};

function meetsInspectionThreshold(
  projectedNodePixels: number,
  zoomLevel: number,
) {
  return (
    projectedNodePixels >= RESERVOIR_LABEL_LEVEL.inspection.nodePixels.enter &&
    zoomLevel >= RESERVOIR_LABEL_LEVEL.inspection.zoom.enter
  );
}

function remainsInspectionThreshold(
  projectedNodePixels: number,
  zoomLevel: number,
) {
  return (
    projectedNodePixels >= RESERVOIR_LABEL_LEVEL.inspection.nodePixels.exit &&
    zoomLevel >= RESERVOIR_LABEL_LEVEL.inspection.zoom.exit
  );
}

function meetsPersistentThreshold(
  projectedNodePixels: number,
  zoomLevel: number,
) {
  return (
    projectedNodePixels >= RESERVOIR_LABEL_LEVEL.persistent.nodePixels.enter &&
    zoomLevel >= RESERVOIR_LABEL_LEVEL.persistent.zoom.enter
  );
}

function remainsPersistentThreshold(
  projectedNodePixels: number,
  zoomLevel: number,
) {
  return (
    projectedNodePixels >= RESERVOIR_LABEL_LEVEL.persistent.nodePixels.exit &&
    zoomLevel >= RESERVOIR_LABEL_LEVEL.persistent.zoom.exit
  );
}

/**
 * Resolves the label's visibility level using projected node size and zoom
 * hysteresis so labels remain stable during wheel and pinch gestures.
 */
export function getReservoirLabelLevel({
  currentLevel,
  projectedNodePixels,
  renderedZoom,
  inspectionActive,
  frontFacing,
  suppressed,
}: ReservoirLabelLevelInput): ReservoirLabelLevel {
  if (
    suppressed ||
    !frontFacing ||
    !Number.isFinite(projectedNodePixels) ||
    projectedNodePixels <= 0 ||
    !Number.isFinite(renderedZoom)
  ) {
    return "hidden";
  }

  if (
    currentLevel === "persistent" &&
    remainsPersistentThreshold(projectedNodePixels, renderedZoom)
  ) {
    return "persistent";
  }

  if (meetsPersistentThreshold(projectedNodePixels, renderedZoom)) {
    return "persistent";
  }

  if (
    inspectionActive &&
    (currentLevel === "inspection" || currentLevel === "persistent") &&
    remainsInspectionThreshold(projectedNodePixels, renderedZoom)
  ) {
    return "inspection";
  }

  if (
    inspectionActive &&
    meetsInspectionThreshold(projectedNodePixels, renderedZoom)
  ) {
    return "inspection";
  }

  return "hidden";
}
