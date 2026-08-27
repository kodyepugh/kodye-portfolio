import type { ResourceSupportRelationship } from "../../types/content";
import { ARTIFACT_IDS, RESOURCE_IDS } from "./artifacts";

const COMPREHENSIVE_CASE_STUDY_ID =
  "resource-bellabeat-comprehensive-case-study";
const IDENTIFIER_AUDIT_ID = "resource-bellabeat-identifier-population-audit";
const DECISION_MEMO_ID = "resource-bellabeat-analysis-decision-memo";
const FINAL_VALIDATION_ID = "resource-bellabeat-final-validation-report";
const NOTEBOOK_ID = "resource-fitbit-identifier-revision-audit-notebook";

const figureResourceIds = [
  "resource-bellabeat-daily-steps-distribution",
  "resource-bellabeat-daily-steps-trend",
  "resource-bellabeat-activity-intensity-composition",
  "resource-bellabeat-sleep-activity-within-session",
  "resource-bellabeat-within-between-relationships",
  "resource-bellabeat-segmentation-stability",
  "resource-bellabeat-recording-feature-presence",
  "resource-bellabeat-session-activity-heatmap",
  "resource-bellabeat-weekend-sleep-differences",
  "resource-bellabeat-heart-rate-appendix-coverage",
] as const;

const primarySupportTargets = [
  [COMPREHENSIVE_CASE_STUDY_ID, "supporting-report"],
  ["resource-bellabeat-methodology-appendix", "methodology"],
  [IDENTIFIER_AUDIT_ID, "validation-evidence"],
  [DECISION_MEMO_ID, "decision-record"],
  ["resource-bellabeat-marketing-recommendations", "recommendation-evidence"],
  [FINAL_VALIDATION_ID, "validation-evidence"],
  [NOTEBOOK_ID, "reproducibility"],
  [RESOURCE_IDS.bellabeatRepository, "reproducibility-repository"],
  ...figureResourceIds.map((resourceId) => [resourceId, "supporting-figure"] as const),
] as const;

const comprehensiveSupportTargets = [
  ["resource-bellabeat-methodology-appendix", "methodology"],
  [IDENTIFIER_AUDIT_ID, "validation-evidence"],
  [DECISION_MEMO_ID, "decision-record"],
  ["resource-bellabeat-marketing-recommendations", "recommendation-evidence"],
  [FINAL_VALIDATION_ID, "validation-evidence"],
  [RESOURCE_IDS.bellabeatRepository, "reproducibility-repository"],
  ...figureResourceIds.map((resourceId) => [resourceId, "supporting-figure"] as const),
] as const;

function relationship(
  id: string,
  sourceResourceId: string,
  targetResourceId: string,
  role: string,
  order: number,
): ResourceSupportRelationship {
  return {
    id,
    sourceResourceId,
    targetResourceId,
    relationshipType: "supporting",
    order,
    published: true,
    role,
  };
}

export const resourceSupportRelations = [
  relationship(
    "support-resume-bellabeat",
    ARTIFACT_IDS.resume,
    ARTIFACT_IDS.bellabeat,
    "supporting-project",
    1,
  ),
  ...primarySupportTargets.map(([targetResourceId, role], index) =>
    relationship(
      "support-bellabeat-" + String(index + 1).padStart(2, "0"),
      ARTIFACT_IDS.bellabeat,
      targetResourceId,
      role,
      index + 1,
    ),
  ),
  ...comprehensiveSupportTargets.map(([targetResourceId, role], index) =>
    relationship(
      "support-bellabeat-comprehensive-" +
        String(index + 1).padStart(2, "0"),
      COMPREHENSIVE_CASE_STUDY_ID,
      targetResourceId,
      role,
      index + 1,
    ),
  ),
  relationship(
    "support-bellabeat-identifier-audit-notebook",
    IDENTIFIER_AUDIT_ID,
    NOTEBOOK_ID,
    "reproducibility",
    1,
  ),
  relationship(
    "support-bellabeat-decision-memo-identifier-audit",
    DECISION_MEMO_ID,
    IDENTIFIER_AUDIT_ID,
    "validation-evidence",
    1,
  ),
  relationship(
    "support-bellabeat-notebook-repository",
    NOTEBOOK_ID,
    RESOURCE_IDS.bellabeatRepository,
    "reproducibility-repository",
    1,
  ),
  relationship(
    "support-bellabeat-notebook-final-validation",
    NOTEBOOK_ID,
    FINAL_VALIDATION_ID,
    "validation-evidence",
    2,
  ),
  ...figureResourceIds.map((sourceResourceId, index) =>
    relationship(
      "support-bellabeat-figure-validation-" +
        String(index + 1).padStart(2, "0"),
      sourceResourceId,
      FINAL_VALIDATION_ID,
      "validation-evidence",
      1,
    ),
  ),
] satisfies readonly ResourceSupportRelationship[];
