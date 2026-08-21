import type { Resource } from "../../types/content";

const REPORT_BASE_URL =
  "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/reports";

function documentBlocks(
  resourceId: string,
  title: string,
  paragraphs: readonly string[],
) {
  return [
    {
      kind: "heading" as const,
      id: `${resourceId}-heading`,
      level: 2 as const,
      text: title,
    },
    ...paragraphs.map((text, index) => ({
      kind: "paragraph" as const,
      id: `${resourceId}-paragraph-${index + 1}`,
      text,
    })),
  ];
}

const figureResources = [
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
    description: "Composition of recorded light, fairly active, and very active minutes.",
    filename: "03_activity_intensity_composition.png",
    alt: "Horizontal bars showing mean recorded light, fairly active, and very active minutes per observed session-day, with light activity at 185.5 minutes and 84.9% of active minutes.",
  },
  {
    id: "resource-bellabeat-sleep-activity-within-session",
    slug: "bellabeat-sleep-activity-within-session",
    title: "Sleep Activity Within Sessions",
    description: "Within-session relationship between recorded sleep and activity.",
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
    description: "Stability checks for the retired fixed session-profile taxonomy.",
    filename: "06_segmentation_stability.png",
    alt: "Horizontal bars showing original, reduced-feature, and MET-added silhouette values plus adjusted Rand index stability values, including original-versus-reduced ARI 0.084 and minimum leave-one-session ARI 0.034.",
  },
  {
    id: "resource-bellabeat-recording-feature-presence",
    slug: "bellabeat-recording-feature-presence",
    title: "Recording Feature Presence",
    description: "Feature coverage across activity, sleep, heart rate, and weight session identifiers.",
    filename: "07_recording_feature_presence.png",
    alt: "Three-panel chart showing activity recording completeness, feature data present for activity, sleep, heart rate, and weight session identifiers, and the increasingly selective weight-record cadence thresholds.",
  },
  {
    id: "resource-bellabeat-session-activity-heatmap",
    slug: "bellabeat-session-activity-heatmap",
    title: "Session Activity Heatmap",
    description: "Standardized daily trajectories and missing dates by neutral session label.",
    filename: "08_session_activity_heatmap.png",
    alt: "Heatmap with neutral session labels S01-S35 across March-May dates, showing within-session standardized daily steps and gray missing dates distinct from observed low or zero-step days.",
  },
  {
    id: "resource-bellabeat-weekend-sleep-differences",
    slug: "bellabeat-weekend-sleep-differences",
    title: "Weekend Sleep Differences",
    description: "Paired weekend and weekday sleep differences with selective coverage.",
    filename: "09_weekend_sleep_differences.png",
    alt: "Paired weekend and weekday sleep differences across eligible session identifiers, presented as a descriptive sensitivity with selective sleep coverage.",
  },
  {
    id: "resource-bellabeat-heart-rate-appendix-coverage",
    slug: "bellabeat-heart-rate-appendix-coverage",
    title: "Heart Rate Appendix Coverage",
    description: "Bounded non-medical heart-rate coverage included in the appendix.",
    filename: "10_heart_rate_appendix_coverage.png",
    alt: "Heart-rate coverage summary for the bounded, non-medical appendix, with selective session coverage and no physiological population claim.",
  },
].map((figure) => ({
  id: figure.id,
  slug: figure.slug,
  title: figure.title,
  description: figure.description,
  alt: figure.alt,
  type: "image" as const,
  category: "Data / Analytics",
  categoryColor: "#28758c",
  published: true,
  isArtifact: false,
  inspectionKind: "image" as const,
  representations: [
    {
      id: `representation-${figure.id.replace("resource-", "")}`,
      kind: "asset" as const,
      assetId: `asset-${figure.id.replace("resource-", "")}`,
      filename: figure.filename,
      mimeType: "image/png",
      label: "Approved PNG figure",
    },
  ],
  content: {
    kind: "media" as const,
    status: "ready" as const,
    assetId: `asset-${figure.id.replace("resource-", "")}`,
    caption: figure.description,
  },
}));

export const resources = [
  {
    id: "resource-bellabeat-comprehensive-case-study",
    slug: "bellabeat-comprehensive-case-study",
    title: "Bellabeat Comprehensive Case Study",
    subtitle: "The fully sourced analytical report",
    description:
      "The comprehensive portfolio report with all ten approved figures, metric definitions, lineage, QA evidence, and recommendation measurement plan.",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "external-link",
    representations: [
      {
        id: "representation-bellabeat-comprehensive-case-study-html",
        kind: "html",
        url: `${REPORT_BASE_URL}/portfolio/bellabeat_portfolio_case_study.html`,
        label: "Comprehensive case study (HTML)",
      },
      {
        id: "representation-bellabeat-comprehensive-case-study-markdown",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/portfolio/bellabeat_portfolio_case_study.md`,
        label: "Comprehensive case study (Markdown)",
      },
    ],
    content: {
      kind: "external-link",
      status: "ready",
      url: `${REPORT_BASE_URL}/portfolio/bellabeat_portfolio_case_study.html`,
      label: "Open comprehensive case study",
    },
  },
  {
    id: "resource-bellabeat-methodology-appendix",
    slug: "bellabeat-methodology-appendix",
    title: "Bellabeat Methodology Appendix",
    subtitle: "Grains, definitions, transformations, and lineage",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "structured-document",
    representations: [
      {
        id: "representation-bellabeat-methodology-appendix",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/analysis/methodology_appendix.md`,
        label: "Methodology appendix (Markdown)",
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      blocks: documentBlocks(
        "resource-bellabeat-methodology-appendix",
        "Bellabeat Methodology Appendix",
        [
          "This appendix defines the analytical grains, eligibility rules, transformations, sensitivity checks, and lineage used in the Bellabeat wellness-behavior analysis.",
          "The first-column identifier is treated as an export/session key. The case describes 30 consenters, while the analytical files contain 35 identifiers and no authoritative session-to-user mapping.",
          "Activity, sleep, and heart-rate tables were validated before joining. Complete activity days contain exactly 1,440 minute rows and are used as a sensitivity rather than a main-story filter. Recorded zero-step days remain distinct from missing dates.",
        ],
      ),
    },
  },
  {
    id: "resource-bellabeat-identifier-population-audit",
    slug: "bellabeat-identifier-population-audit",
    title: "Bellabeat Identifier Population Audit",
    subtitle: "30 consenters, 35 export/session identifiers",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "structured-document",
    representations: [
      {
        id: "representation-bellabeat-identifier-population-audit",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/analysis/identifier_population_audit.md`,
        label: "Identifier population audit (Markdown)",
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      blocks: documentBlocks(
        "resource-bellabeat-identifier-population-audit",
        "Bellabeat Identifier Population Audit",
        [
          "The Bellabeat case materials state that 30 Fitbit users consented to provide tracker data. The analytical files contain 35 unique export/session identifiers.",
          "Because one Fitbit user may generate multiple export sessions and no authoritative session-to-user mapping is available, this analysis treats identifiers as session profiles rather than verified unique people.",
          "Public findings therefore use session, session-day, session-hour, feature-log, and timestamp terminology and do not present 35 identifiers as 35 verified people.",
        ],
      ),
    },
  },
  {
    id: "resource-bellabeat-analysis-decision-memo",
    slug: "bellabeat-analysis-decision-memo",
    title: "Bellabeat Analysis Decision Memo",
    subtitle: "Inclusion, exclusion, terminology, and clustering decisions",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "structured-document",
    representations: [
      {
        id: "representation-bellabeat-analysis-decision-memo",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/analysis/analysis_decision_memo.md`,
        label: "Analysis decision memo (Markdown)",
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      blocks: documentBlocks(
        "resource-bellabeat-analysis-decision-memo",
        "Bellabeat Analysis Decision Memo",
        [
          "The analysis uses session-level terminology throughout and keeps the historical, observational, and non-causal boundary visible.",
          "Activity relationships remain the strongest evidence. Sleep and feature results are narrower because coverage is selective, and heart rate remains bounded to a non-medical appendix.",
          "The original fixed segmentation is withdrawn because feature reduction changes assignments sharply and leave-one-session stability is low. Continuous personal-baseline rules are more defensible than fixed session-profile identities.",
        ],
      ),
    },
  },
  {
    id: "resource-bellabeat-marketing-recommendations",
    slug: "bellabeat-marketing-recommendations",
    title: "Bellabeat Marketing Recommendations",
    subtitle: "Product hypotheses, measures, and guardrails",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "structured-document",
    representations: [
      {
        id: "representation-bellabeat-marketing-recommendations",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/analysis/marketing_recommendations.md`,
        label: "Marketing recommendations (Markdown)",
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      blocks: documentBlocks(
        "resource-bellabeat-marketing-recommendations",
        "Bellabeat Marketing Recommendations",
        [
          "Test rolling personal-baseline feedback with customer-adjustable next steps. Measure qualified return, baseline-card engagement, and change from the customer's pre-period.",
          "Test short, accessible movement options such as a walk, stretch, or movement break. Measure content completion, incremental active minutes, and retained engagement.",
          "Test customer-selected timing against fixed and consented adaptive timing. Protect quiet hours, frequency limits, and opt-out control.",
          "Sleep feedback should remain optional and descriptive. Production recovery or re-engagement automation requires app, sync, device, delivery, enrollment, and preference telemetry.",
        ],
      ),
    },
  },
  {
    id: "resource-bellabeat-final-validation-report",
    slug: "bellabeat-final-validation-report",
    title: "Bellabeat Final Validation Report",
    subtitle: "Release validation and analytical QA status",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "structured-document",
    representations: [
      {
        id: "representation-bellabeat-final-validation-report",
        kind: "markdown",
        url: `${REPORT_BASE_URL}/analysis/final_validation_report.md`,
        label: "Final validation report (Markdown)",
      },
    ],
    content: {
      kind: "structured-document",
      status: "ready",
      blocks: documentBlocks(
        "resource-bellabeat-final-validation-report",
        "Bellabeat Final Validation Report",
        [
          "The final analytical pipeline passed all 25 required validation checks covering row counts, key uniqueness, nulls, valid ranges, and reconciliation.",
          "The validated release preserves the distinction between source quality and analytical correctness. Correct implementation does not imply representativeness, current relevance, or causal product impact.",
          "Next steps are current consent and identifier validation, first-party event instrumentation, personal baselines, a small telemetry QA cohort, and customer-level experiments with preregistered outcomes and guardrails.",
        ],
      ),
    },
  },
  {
    id: "resource-fitbit-identifier-revision-audit-notebook",
    slug: "fitbit-identifier-revision-audit-notebook",
    title: "Fitbit Identifier Revision Audit Notebook",
    subtitle: "Executed reproducibility notebook",
    type: "document",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "notebook-code",
    representations: [
      {
        id: "representation-fitbit-identifier-revision-audit-notebook",
        kind: "notebook",
        url: "https://github.com/kodyepugh/bellabeat-wellness-analysis/blob/main/notebooks/fitbit_identifier_revision_audit.ipynb",
        label: "Identifier revision audit notebook",
      },
    ],
    content: {
      kind: "document",
      status: "ready",
      note: "Executed notebook supporting the identifier revision audit and reproducibility trail. Open the original notebook representation for the code and outputs.",
    },
  },
  {
    id: "resource-bellabeat-wellness-analysis-repository",
    slug: "bellabeat-wellness-analysis-repository",
    title: "Bellabeat Wellness Analysis Repository",
    subtitle: "Public source, reports, figures, and reproducibility materials",
    description:
      "The public GitHub repository containing the approved Bellabeat reports, figures, notebook, and analytical supporting material.",
    type: "link",
    category: "Data / Analytics",
    published: true,
    isArtifact: false,
    inspectionKind: "external-link",
    representations: [
      {
        id: "representation-bellabeat-wellness-analysis-repository",
        kind: "external-url",
        url: "https://github.com/kodyepugh/bellabeat-wellness-analysis",
        label: "GitHub repository",
      },
    ],
    content: {
      kind: "external-link",
      status: "ready",
      url: "https://github.com/kodyepugh/bellabeat-wellness-analysis",
      label: "Open Bellabeat Wellness Analysis on GitHub",
    },
  },
  ...figureResources,
] satisfies readonly Resource[];

export const BELLABEAT_FIGURE_ALT_TEXT = new Map(
  figureResources.map((figure) => [figure.id, figure.alt] as const),
);
