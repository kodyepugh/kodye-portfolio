import type { SourceRecord } from "../../types/content";
import { ARTIFACT_IDS, RESOURCE_IDS } from "./artifacts";
import { ASSET_IDS } from "./assets";

const BELLABEAT_SUPPORT_SOURCES = [
  [
    "resource-bellabeat-comprehensive-case-study",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/portfolio/bellabeat_portfolio_case_study.html",
    "Comprehensive case study",
  ],
  [
    "resource-bellabeat-methodology-appendix",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/methodology_appendix.md",
    "Methodology appendix",
  ],
  [
    "resource-bellabeat-identifier-population-audit",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/identifier_population_audit.md",
    "Identifier population audit",
  ],
  [
    "resource-bellabeat-analysis-decision-memo",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/analysis_decision_memo.md",
    "Analysis decision memo",
  ],
  [
    "resource-bellabeat-marketing-recommendations",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/marketing_recommendations.md",
    "Marketing recommendations",
  ],
  [
    "resource-bellabeat-final-validation-report",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/final_validation_report.md",
    "Final validation report",
  ],
  [
    "resource-fitbit-identifier-revision-audit-notebook",
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/notebooks/fitbit_identifier_revision_audit.ipynb",
    "Identifier revision audit notebook",
  ],
] as const;

const BELLABEAT_FIGURE_SOURCES = [
  ["resource-bellabeat-daily-steps-distribution", "01_daily_steps_distribution.png"],
  ["resource-bellabeat-daily-steps-trend", "02_daily_steps_trend.png"],
  ["resource-bellabeat-activity-intensity-composition", "03_activity_intensity_composition.png"],
  ["resource-bellabeat-sleep-activity-within-session", "04_sleep_activity_within_session.png"],
  ["resource-bellabeat-within-between-relationships", "05_within_between_relationships.png"],
  ["resource-bellabeat-segmentation-stability", "06_segmentation_stability.png"],
  ["resource-bellabeat-recording-feature-presence", "07_recording_feature_presence.png"],
  ["resource-bellabeat-session-activity-heatmap", "08_session_activity_heatmap.png"],
  ["resource-bellabeat-weekend-sleep-differences", "09_weekend_sleep_differences.png"],
  ["resource-bellabeat-heart-rate-appendix-coverage", "10_heart_rate_appendix_coverage.png"],
] as const;

export const sourceRecords = [
  {
    id: "source-bellabeat-prototype-record",
    resourceId: ARTIFACT_IDS.bellabeat,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing Digital Reservoir prototype record",
  },
  {
    id: "source-resume-prototype-record",
    resourceId: ARTIFACT_IDS.resume,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing direct-feature prototype record",
  },
  {
    id: "source-about-prototype-record",
    resourceId: ARTIFACT_IDS.about,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing direct-feature prototype record",
  },
  {
    id: "source-reservoir-study-project-record",
    resourceId: ARTIFACT_IDS.reservoirStudy,
    sourceType: "local-file",
    originalPath: "docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md",
    sourceLabel: "Digital Reservoir implementation brief",
  },
  {
    id: "source-brand-symbol-artifact-record",
    resourceId: ARTIFACT_IDS.brandSymbol,
    sourceType: "manual",
    sourceLabel: "Existing public identity artifact",
  },
  {
    id: "source-brand-symbol-file",
    assetId: ASSET_IDS.brandSymbol,
    sourceType: "local-file",
    originalPath: "public/brand/kodyepugh-symbol.svg",
    sourceLabel: "Public brand asset",
  },
  {
    id: "source-bellabeat-repository",
    resourceId: RESOURCE_IDS.bellabeatRepository,
    sourceType: "external-url",
    externalUrl: "https://github.com/kodyepugh/bellabeat-wellness-analysis",
    sourceLabel: "GitHub repository",
  },
  ...BELLABEAT_SUPPORT_SOURCES.map(([resourceId, externalUrl, sourceLabel], index) => ({
    id: "source-bellabeat-support-" + String(index + 1).padStart(2, "0"),
    resourceId,
    sourceType: "external-url" as const,
    externalUrl,
    sourceLabel,
  })),
  ...BELLABEAT_FIGURE_SOURCES.flatMap(([resourceId, filename], index) => {
  const externalUrl =
    "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports/analysis/figures/" +
    filename;
  return [
    {
      id: "source-bellabeat-figure-resource-" + String(index + 1).padStart(2, "0"),
      resourceId,
      sourceType: "external-url" as const,
      externalUrl,
      sourceLabel: "Approved Bellabeat figure Resource",
    },
    {
      id: "source-bellabeat-figure-asset-" + String(index + 1).padStart(2, "0"),
      assetId: "asset-" + resourceId.replace("resource-", ""),
      sourceType: "external-url" as const,
      externalUrl,
      sourceLabel: "Approved Bellabeat figure Asset",
    },
  ];
  }),
] satisfies readonly SourceRecord[];
