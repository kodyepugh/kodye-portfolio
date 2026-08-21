import type { ResourceSupportRelationship } from "../../types/content";
import { ARTIFACT_IDS } from "./artifacts";

export const resourceSupportRelations = [
  ["resource-bellabeat-comprehensive-case-study", "supporting-report"],
  ["resource-bellabeat-methodology-appendix", "methodology"],
  ["resource-bellabeat-identifier-population-audit", "validation-evidence"],
  ["resource-bellabeat-analysis-decision-memo", "decision-record"],
  ["resource-bellabeat-marketing-recommendations", "recommendation-evidence"],
  ["resource-bellabeat-final-validation-report", "validation-evidence"],
  ["resource-fitbit-identifier-revision-audit-notebook", "reproducibility"],
  ["resource-bellabeat-wellness-analysis-repository", "reproducibility-repository"],
  ["resource-bellabeat-daily-steps-distribution", "supporting-figure"],
  ["resource-bellabeat-daily-steps-trend", "supporting-figure"],
  ["resource-bellabeat-activity-intensity-composition", "supporting-figure"],
  ["resource-bellabeat-sleep-activity-within-session", "supporting-figure"],
  ["resource-bellabeat-within-between-relationships", "supporting-figure"],
  ["resource-bellabeat-segmentation-stability", "supporting-figure"],
  ["resource-bellabeat-recording-feature-presence", "supporting-figure"],
  ["resource-bellabeat-session-activity-heatmap", "supporting-figure"],
  ["resource-bellabeat-weekend-sleep-differences", "supporting-figure"],
  ["resource-bellabeat-heart-rate-appendix-coverage", "supporting-figure"],
].map(([targetResourceId, role], index) => ({
  id: "support-bellabeat-" + String(index + 1).padStart(2, "0"),
  sourceResourceId: ARTIFACT_IDS.bellabeat,
  targetResourceId,
  relationshipType: "supporting" as const,
  order: index + 1,
  published: true,
  role,
})) satisfies readonly ResourceSupportRelationship[];
