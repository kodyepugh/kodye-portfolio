import type { Asset } from "../../types/content";
import { BELLABEAT_FIGURE_ALT_TEXT } from "./resources";

export const ASSET_IDS = {
  brandSymbol: "asset-kodyepugh-symbol",
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
  [ASSET_IDS.bellabeatDailyStepsDistribution, "01_daily_steps_distribution.png", "resource-bellabeat-daily-steps-distribution"],
  [ASSET_IDS.bellabeatDailyStepsTrend, "02_daily_steps_trend.png", "resource-bellabeat-daily-steps-trend"],
  [ASSET_IDS.bellabeatActivityIntensityComposition, "03_activity_intensity_composition.png", "resource-bellabeat-activity-intensity-composition"],
  [ASSET_IDS.bellabeatSleepActivityWithinSession, "04_sleep_activity_within_session.png", "resource-bellabeat-sleep-activity-within-session"],
  [ASSET_IDS.bellabeatWithinBetweenRelationships, "05_within_between_relationships.png", "resource-bellabeat-within-between-relationships"],
  [ASSET_IDS.bellabeatSegmentationStability, "06_segmentation_stability.png", "resource-bellabeat-segmentation-stability"],
  [ASSET_IDS.bellabeatRecordingFeaturePresence, "07_recording_feature_presence.png", "resource-bellabeat-recording-feature-presence"],
  [ASSET_IDS.bellabeatSessionActivityHeatmap, "08_session_activity_heatmap.png", "resource-bellabeat-session-activity-heatmap"],
  [ASSET_IDS.bellabeatWeekendSleepDifferences, "09_weekend_sleep_differences.png", "resource-bellabeat-weekend-sleep-differences"],
  [ASSET_IDS.bellabeatHeartRateAppendixCoverage, "10_heart_rate_appendix_coverage.png", "resource-bellabeat-heart-rate-appendix-coverage"],
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
  ...BELLABEAT_FIGURES.map(([id, filename, resourceId]) => ({
    id,
    kind: "image" as const,
    src: `/bellabeat/figures/${filename}`,
    filename,
    mimeType: "image/png",
    alt: BELLABEAT_FIGURE_ALT_TEXT.get(resourceId),
  })),
] satisfies readonly Asset[];
