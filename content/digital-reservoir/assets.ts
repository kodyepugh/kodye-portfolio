import type { Asset } from "../../types/content";
import { BELLABEAT_FIGURE_ALT_TEXT } from "./bellabeat-resources";

export const ASSET_IDS = {
  brandSymbol: "asset-kodyepugh-symbol",
  resumePdf: "asset-resume-2026-pdf",
  fitbitIdentifierRevisionAuditNotebook:
    "asset-fitbit-identifier-revision-audit-notebook",
  bellabeatDailyStepsDistribution: "asset-bellabeat-daily-steps-distribution",
  bellabeatDailyStepsTrend: "asset-bellabeat-daily-steps-trend",
  bellabeatActivityIntensityComposition:
    "asset-bellabeat-activity-intensity-composition",
  bellabeatSleepActivityWithinSession:
    "asset-bellabeat-sleep-activity-within-session",
  bellabeatWithinBetweenRelationships:
    "asset-bellabeat-within-between-relationships",
  bellabeatSegmentationStability: "asset-bellabeat-segmentation-stability",
  bellabeatRecordingFeaturePresence:
    "asset-bellabeat-recording-feature-presence",
  bellabeatSessionActivityHeatmap: "asset-bellabeat-session-activity-heatmap",
  bellabeatWeekendSleepDifferences:
    "asset-bellabeat-weekend-sleep-differences",
  bellabeatHeartRateAppendixCoverage:
    "asset-bellabeat-heart-rate-appendix-coverage",
} as const;

const BELLABEAT_FIGURES = [
  [ASSET_IDS.bellabeatDailyStepsDistribution, "01_daily_steps_distribution.png", "resource-bellabeat-daily-steps-distribution", 1975, 1342],
  [ASSET_IDS.bellabeatDailyStepsTrend, "02_daily_steps_trend.png", "resource-bellabeat-daily-steps-trend", 2292, 1589],
  [ASSET_IDS.bellabeatActivityIntensityComposition, "03_activity_intensity_composition.png", "resource-bellabeat-activity-intensity-composition", 1896, 1274],
  [ASSET_IDS.bellabeatSleepActivityWithinSession, "04_sleep_activity_within_session.png", "resource-bellabeat-sleep-activity-within-session", 2404, 1392],
  [ASSET_IDS.bellabeatWithinBetweenRelationships, "05_within_between_relationships.png", "resource-bellabeat-within-between-relationships", 2559, 1528],
  [ASSET_IDS.bellabeatSegmentationStability, "06_segmentation_stability.png", "resource-bellabeat-segmentation-stability", 2597, 1342],
  [ASSET_IDS.bellabeatRecordingFeaturePresence, "07_recording_feature_presence.png", "resource-bellabeat-recording-feature-presence", 3192, 1319],
  [ASSET_IDS.bellabeatSessionActivityHeatmap, "08_session_activity_heatmap.png", "resource-bellabeat-session-activity-heatmap", 2608, 2091],
  [ASSET_IDS.bellabeatWeekendSleepDifferences, "09_weekend_sleep_differences.png", "resource-bellabeat-weekend-sleep-differences", 2113, 1426],
  [ASSET_IDS.bellabeatHeartRateAppendixCoverage, "10_heart_rate_appendix_coverage.png", "resource-bellabeat-heart-rate-appendix-coverage", 2413, 1342],
] as const;

export const assets = [
  {
    id: ASSET_IDS.brandSymbol,
    kind: "image",
    src: "/brand/kodyepugh-symbol.svg",
    filename: "kodyepugh-symbol.svg",
    mimeType: "image/svg+xml",
    width: 1000,
    height: 974,
    alt: "Kodye Pugh symbol and wordmark",
  },
  {
    id: ASSET_IDS.resumePdf,
    kind: "document",
    src: "/resume/Kodye_Pugh_Resume_2026.pdf",
    filename: "Kodye_Pugh_Resume_2026.pdf",
    mimeType: "application/pdf",
  },
  {
    id: ASSET_IDS.fitbitIdentifierRevisionAuditNotebook,
    kind: "document",
    src: "/bellabeat/notebooks/fitbit_identifier_revision_audit.ipynb",
    filename: "fitbit_identifier_revision_audit.ipynb",
    mimeType: "application/x-ipynb+json",
  },
  ...BELLABEAT_FIGURES.map(([id, filename, resourceId, width, height]) => ({
    id,
    kind: "image" as const,
    src: `/bellabeat/figures/${filename}`,
    filename,
    mimeType: "image/png",
    width,
    height,
    alt: BELLABEAT_FIGURE_ALT_TEXT.get(resourceId),
  })),
] satisfies readonly Asset[];
