import type { Resource } from "../../types/content";

const REPORT_BASE_URL =
  "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports";

type FigureDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string;
  filename: string;
  alt: string;
};

const figureDefinitions: readonly FigureDefinition[] = [
  {
    id: "resource-bellabeat-daily-steps-distribution",
    slug: "bellabeat-daily-steps-distribution",
    title: "Daily Steps Distribution",
    description:
      "Distribution of daily steps across 1,935 observed session-days.",
    filename: "01_daily_steps_distribution.png",
    alt: "Histogram of 1,935 observed session-days showing a right-skewed daily-step distribution, with labeled pooled mean 7,200, median 6,835, and equal-session mean 6,857.",
  },
  {
    id: "resource-bellabeat-daily-steps-trend",
    slug: "bellabeat-daily-steps-trend",
    title: "Daily Steps Trend",
    description: "Observed daily-step movement across the source periods.",
    filename: "02_daily_steps_trend.png",
    alt: "Trend of observed daily steps across the March-May source period, preserving the session-level analytical grain.",
  },
  {
    id: "resource-bellabeat-activity-intensity-composition",
    slug: "bellabeat-activity-intensity-composition",
    title: "Activity Intensity Composition",
    description:
      "Composition of recorded light, fairly active, and very active minutes.",
    filename: "03_activity_intensity_composition.png",
    alt: "Horizontal bars showing mean recorded light, fairly active, and very active minutes per observed session-day, with light activity at 185.5 minutes and 84.9% of active minutes.",
  },
  {
    id: "resource-bellabeat-sleep-activity-within-session",
    slug: "bellabeat-sleep-activity-within-session",
    title: "Sleep Activity Within Sessions",
    description:
      "Within-session relationship between recorded sleep and activity.",
    filename: "04_sleep_activity_within_session.png",
    alt: "Within-session comparison of recorded sleep and activity, shown with selective coverage and bounded non-causal interpretation.",
  },
  {
    id: "resource-bellabeat-within-between-relationships",
    slug: "bellabeat-within-between-relationships",
    title: "Within / Between Relationships",
    description: "Comparison of within-session and between-session relationships.",
    filename: "05_within_between_relationships.png",
    alt: "Comparison of within-session and between-session relationships, keeping session-level interpretation separate from pooled differences.",
  },
  {
    id: "resource-bellabeat-segmentation-stability",
    slug: "bellabeat-segmentation-stability",
    title: "Segmentation Stability",
    description:
      "Stability checks for the retired fixed session-profile taxonomy.",
    filename: "06_segmentation_stability.png",
    alt: "Horizontal bars showing original, reduced-feature, and MET-added silhouette values plus adjusted Rand index stability values, including original-versus-reduced ARI 0.084 and minimum leave-one-session ARI 0.034.",
  },
  {
    id: "resource-bellabeat-recording-feature-presence",
    slug: "bellabeat-recording-feature-presence",
    title: "Recording Feature Presence",
    description:
      "Feature coverage across activity, sleep, heart rate, and weight session identifiers.",
    filename: "07_recording_feature_presence.png",
    alt: "Three-panel chart showing activity recording completeness, feature data present for activity, sleep, heart rate, and weight session identifiers, and the increasingly selective weight-record cadence thresholds.",
  },
  {
    id: "resource-bellabeat-session-activity-heatmap",
    slug: "bellabeat-session-activity-heatmap",
    title: "Session Activity Heatmap",
    description:
      "Standardized daily trajectories and missing dates by neutral session label.",
    filename: "08_session_activity_heatmap.png",
    alt: "Heatmap with neutral session labels S01-S35 across March-May dates, showing within-session standardized daily steps and gray missing dates distinct from observed low or zero-step days.",
  },
  {
    id: "resource-bellabeat-weekend-sleep-differences",
    slug: "bellabeat-weekend-sleep-differences",
    title: "Weekend Sleep Differences",
    description:
      "Paired weekend and weekday sleep differences with selective coverage.",
    filename: "09_weekend_sleep_differences.png",
    alt: "Paired weekend and weekday sleep differences across eligible session identifiers, presented as a descriptive sensitivity with selective sleep coverage.",
  },
  {
    id: "resource-bellabeat-heart-rate-appendix-coverage",
    slug: "bellabeat-heart-rate-appendix-coverage",
    title: "Heart Rate Appendix Coverage",
    description:
      "Bounded non-medical heart-rate coverage included in the appendix.",
    filename: "10_heart_rate_appendix_coverage.png",
    alt: "Heart-rate coverage summary for the bounded, non-medical appendix, with selective session coverage and no physiological population claim.",
  },
];

const figureResources = figureDefinitions.map(
  (figure) =>
    ({
      objectType: "resource",
      id: figure.id,
      slug: figure.slug,
      title: figure.title,
      description: figure.description,
      type: "image",
      inspectionKind: "image",
      isArtifact: false,
      category: "Data / Analytics",
      categoryColor: "#28758c",
      published: true,
      representations: [
        {
          id:
            "representation-bellabeat-" +
            figure.slug.replace("bellabeat-", ""),
          kind: "asset",
          assetId: "asset-" + figure.id.replace("resource-", ""),
          label: "Approved PNG figure",
          order: 1,
          published: true,
        },
      ],
      content: {
        kind: "media",
        status: "ready",
        assetId: "asset-" + figure.id.replace("resource-", ""),
        caption: figure.description,
      },
    }) satisfies Resource,
);

function documentResource(
  id: string,
  slug: string,
  title: string,
  subtitle: string,
  reportPath: string,
  localFilename: string,
): Resource {
  const url = REPORT_BASE_URL + "/" + reportPath;
  return {
    objectType: "resource",
    id,
    slug,
    title,
    subtitle,
    type: "document",
    inspectionKind: "structured-document",
    isArtifact: false,
    category: "Data / Analytics",
    categoryColor: "#28758c",
    published: true,
    representations: [
      {
        id: "representation-" + slug,
        kind: "external",
        url,
        label: title + " (Markdown)",
        sourceLabel: "Bellabeat analysis repository",
        order: 1,
        published: true,
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      markdownSource: {
        path: `/bellabeat/documents/${localFilename}`,
      },
    },
  };
}

const comprehensiveFigureResourceIds = Object.fromEntries(
  figureDefinitions.map((figure) => [figure.filename, figure.id]),
);

const supportingDocumentResources: readonly Resource[] = [
  {
    objectType: "resource",
    id: "resource-bellabeat-comprehensive-case-study",
    slug: "bellabeat-comprehensive-case-study",
    title: "Bellabeat Comprehensive Case Study",
    subtitle: "The fully sourced analytical report",
    description:
      "The comprehensive portfolio report with all ten approved figures, metric definitions, lineage, QA evidence, and recommendation measurement plan.",
    type: "document",
    inspectionKind: "structured-document",
    isArtifact: false,
    category: "Data / Analytics",
    categoryColor: "#28758c",
    published: true,
    representations: [
      {
        id: "representation-bellabeat-comprehensive-case-study-html",
        kind: "external",
        url: REPORT_BASE_URL + "/portfolio/bellabeat_portfolio_case_study.html",
        label: "Comprehensive case study (HTML)",
        sourceLabel: "Bellabeat analysis repository",
        order: 1,
        published: true,
      },
      {
        id: "representation-bellabeat-comprehensive-case-study-markdown",
        kind: "external",
        url: REPORT_BASE_URL + "/portfolio/bellabeat_portfolio_case_study.md",
        label: "Comprehensive case study (Markdown)",
        sourceLabel: "Bellabeat analysis repository",
        order: 2,
        published: true,
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      markdownSource: {
        path: "/bellabeat/documents/bellabeat_portfolio_case_study.md",
        figureResourceIds: comprehensiveFigureResourceIds,
      },
    },
  },
  documentResource(
    "resource-bellabeat-methodology-appendix",
    "bellabeat-methodology-appendix",
    "Bellabeat Methodology Appendix",
    "Grains, definitions, transformations, and lineage",
    "analysis/methodology_appendix.md",
    "methodology_appendix.md",
  ),
  documentResource(
    "resource-bellabeat-identifier-population-audit",
    "bellabeat-identifier-population-audit",
    "Bellabeat Identifier Population Audit",
    "30 consenters, 35 export/session identifiers",
    "analysis/identifier_population_audit.md",
    "identifier_population_audit.md",
  ),
  documentResource(
    "resource-bellabeat-analysis-decision-memo",
    "bellabeat-analysis-decision-memo",
    "Bellabeat Analysis Decision Memo",
    "Inclusion, exclusion, terminology, and clustering decisions",
    "analysis/analysis_decision_memo.md",
    "analysis_decision_memo.md",
  ),
  documentResource(
    "resource-bellabeat-marketing-recommendations",
    "bellabeat-marketing-recommendations",
    "Bellabeat Marketing Recommendations",
    "Product hypotheses, measures, and guardrails",
    "analysis/marketing_recommendations.md",
    "marketing_recommendations.md",
  ),
  documentResource(
    "resource-bellabeat-final-validation-report",
    "bellabeat-final-validation-report",
    "Bellabeat Final Validation Report",
    "Release validation and analytical QA status",
    "analysis/final_validation_report.md",
    "final_validation_report.md",
  ),
  {
    objectType: "resource",
    id: "resource-fitbit-identifier-revision-audit-notebook",
    slug: "fitbit-identifier-revision-audit-notebook",
    title: "Fitbit Identifier Revision Audit Notebook",
    subtitle: "Executed reproducibility notebook",
    type: "notebook",
    inspectionKind: "notebook-code",
    isArtifact: false,
    category: "Data / Analytics",
    categoryColor: "#28758c",
    published: true,
    representations: [
      {
        id: "representation-fitbit-identifier-revision-audit-notebook",
        kind: "external",
        url: "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/notebooks/fitbit_identifier_revision_audit.ipynb",
        label: "Identifier revision audit notebook",
        sourceLabel: "Bellabeat analysis repository",
        order: 1,
        published: true,
      },
    ],
  },
];

export const bellabeatSupportingResources = [
  ...supportingDocumentResources,
  ...figureResources,
] satisfies readonly Resource[];

export const BELLABEAT_FIGURE_ALT_TEXT = new Map(
  figureDefinitions.map((figure) => [figure.id, figure.alt] as const),
);
