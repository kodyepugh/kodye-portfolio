# Digital Reservoir — L2 Bellabeat Manual Ingestion Manifest

**Status:** Manual ingestion review complete / implementation pending  
**Target branch:** `feat/l2-bellabeat-ingestion`  
**Source repository:** `kodyepugh/bellabeat-wellness-analysis`  
**Source branch:** `main`  
**Source tree reviewed:** `30543d0a0d7a9a377279d59be7ccf107ab42e472`  
**Ontology authority:** `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`

---

## 1. Ingestion Decision

Bellabeat should remain **one persistent Artifact**, not a Collection, for the L2 portfolio release.

The Artifact is the independently curated professional object. Its supporting analytical documents, figures, notebook, repository, and source references remain Resources unless later promoted to Artifact status because persistent Collection membership becomes useful.

The Bellabeat Artifact keeps its existing persistent memberships:

- `collection-work`
- `collection-data-analytics`

Supporting Resources receive no Collection membership by default.

---

## 2. Primary Artifact

**Existing ID:** `artifact-bellabeat-wellness-analysis`  
**Recommended title:** `Bellabeat Wellness-Behavior Analysis`  
**Recommended subtitle:** `From Public Fitbit Files to Testable App Strategy`  
**Type:** `case-study`  
**Category:** `Data / Analytics`  
**Date:** `August 2026`  
**Medium:** `Data analysis`  
**Format:** `Case study`  
**Featured:** `true`  
**Published:** `true`

### Interpretation boundary that must remain visible

The case materials describe 30 consenting Fitbit users, while the analytical files contain 35 export/session identifiers and no authoritative session-to-user mapping. Public language must therefore preserve session-level terminology and must not present the 35 identifiers as 35 verified people or as representative Bellabeat customers.

---

## 3. Artifact Presentation Layers

### Atmospheric / selected preview

Use the approved portfolio-card layer as the editorial source for the selected-state preview. The preview should communicate, concisely:

- historical Fitbit data analyzed with Excel, BigQuery, and Standard SQL;
- controlled session-level interpretation;
- 1,935 observed session-days;
- movement variability and the 84.9% light-activity share;
- three product directions: personal progress, approachable movement, and customer-controlled timing;
- historical / non-causal interpretation boundary.

Do not copy implementation provenance or lengthy methodology into the atmosphere.

### Artifact-window body

Use the approved recruiter-summary layer as the primary editorial source for the Reservoir reading experience.

Recommended section structure:

1. Project Overview
2. Business Objective
3. From Source Files to BigQuery
4. Analytical Approach
5. Three Core Findings
6. Recommendations
7. Limitations and Next Steps
8. Supporting Evidence / Resources

The artifact window should remain recruiter-readable. Do not inline the entire comprehensive technical appendix into the primary reading flow.

### Comprehensive report

Treat the comprehensive portfolio case study as a **supporting Resource**, not as a second Artifact and not as a separate Collection member.

Its HTML and Markdown forms are representations of one logical supporting Resource, not separate Resources.

---

## 4. Public Supporting Resources — Materialize Now

The following Resources have sufficient independent inspection value to be addressable through Bellabeat while remaining non-members of Collections.

### A. Comprehensive report

**Logical Resource:** Bellabeat Comprehensive Case Study  
**Primary source representation:** `reports/portfolio/bellabeat_portfolio_case_study.html`  
**Supporting representation:** `reports/portfolio/bellabeat_portfolio_case_study.md`  
**Role:** `supporting-report`

### B. Approved figures

Materialize the ten standalone-approved PNGs as individual image Resources. They may be queried directly without becoming Artifacts.

1. `01_daily_steps_distribution.png` — Daily steps distribution
2. `02_daily_steps_trend.png` — Daily steps trend
3. `03_activity_intensity_composition.png` — Activity intensity composition
4. `04_sleep_activity_within_session.png` — Sleep/activity within sessions
5. `05_within_between_relationships.png` — Within/between relationships
6. `06_segmentation_stability.png` — Segmentation stability
7. `07_recording_feature_presence.png` — Recording feature presence
8. `08_session_activity_heatmap.png` — Session-by-date activity heatmap
9. `09_weekend_sleep_differences.png` — Weekend sleep differences
10. `10_heart_rate_appendix_coverage.png` — Heart-rate appendix coverage

For the primary artifact-window narrative, prefer the five figures already selected for the recruiter summary as the initial inline set:

- daily steps distribution;
- activity intensity composition;
- session activity heatmap;
- segmentation stability;
- recording feature presence.

The remaining figures can remain accessible from the supporting-resource interface and/or appear where the final artifact layout makes them useful.

The canonical figure bytes, meaning, labels, and analytical claims must not be modified during website ingestion without reopening analytical validation.

### C. Analytical methodology

**Logical Resource:** Bellabeat Methodology Appendix  
**Source:** `reports/analysis/methodology_appendix.md`  
**Role:** `methodology`

### D. Identifier / population audit

**Logical Resource:** Bellabeat Identifier Population Audit  
**Source:** `reports/analysis/identifier_population_audit.md`  
**Role:** `validation-evidence`

### E. Analytical decision record

**Logical Resource:** Bellabeat Analysis Decision Memo  
**Source:** `reports/analysis/analysis_decision_memo.md`  
**Role:** `decision-record`

### F. Recommendations evidence

**Logical Resource:** Bellabeat Marketing Recommendations  
**Source:** `reports/analysis/marketing_recommendations.md`  
**Role:** `recommendation-evidence`

### G. Final validation

**Logical Resource:** Bellabeat Final Validation Report  
**Source:** `reports/analysis/final_validation_report.md`  
**Role:** `validation-evidence`

### H. Executed notebook

**Logical Resource:** Fitbit Identifier Revision Audit Notebook  
**Source:** `notebooks/fitbit_identifier_revision_audit.ipynb`  
**Role:** `reproducibility`

### I. GitHub repository

**Logical Resource:** Bellabeat Wellness Analysis Repository  
**Source:** public GitHub repository `kodyepugh/bellabeat-wellness-analysis`  
**Role:** `reproducibility-repository`

---

## 5. Source Relationships — Record, But Do Not Promote by Default

The public Fitbit CSV collection is described by the validated Bellabeat materials as distributed through Kaggle and attributed there to a Zenodo source.

Create source relationships only after exact public URLs are confirmed from an approved source. Do not invent or infer URLs during ingestion.

The protected BigQuery source dataset and local preserved originals are provenance / analytical infrastructure. They should not be copied into the public portfolio repository merely to make them queryable.

---

## 6. Existing Publication Files That Should NOT Become Separate Resources

The following are editorial or packaging variants of other logical objects and should not create duplicate Resource identities:

- `reports/portfolio/bellabeat_portfolio_card.md` — editorial source for atmospheric / card copy;
- `reports/portfolio/bellabeat_recruiter_summary.md` and `.html` — editorial source / representations for the primary Artifact reading layer;
- `reports/portfolio/portfolio_artifact.json` — portable packaging representation;
- `reports/portfolio/bellabeat_recruiter_summary_artifact.json` — portable packaging representation;
- `reports/analysis/report_artifact.json` — analytical portable packaging representation;
- HTML and Markdown variants of the same comprehensive report — one logical Resource with multiple representations.

Representation count must not create semantic-object count.

---

## 7. Repository Material to Keep Below the Current Curatorial Floor

Do not materialize the following individually in the Digital Reservoir during L2:

- raw evidence CSVs under `reports/analysis/data/`;
- SQL files under `sql/`;
- pipeline scripts under `scripts/`;
- config files;
- execution JSON logs;
- inventory JSON / CSV records;
- QA JSON records;
- idempotency records;
- table profiles;
- tests;
- `.gitkeep`, `.DS_Store`, or other repository-maintenance files.

These remain accessible through the supporting GitHub Repository Resource and preserve reproducibility without flooding the Reservoir with implementation-level granularity.

They may be promoted later if a specific file earns independent curatorial value.

---

## 8. Future Artifact Promotion Candidates

Do **not** promote these during the initial L2 Bellabeat cut, but preserve their identity so promotion remains possible:

- Bellabeat Methodology Appendix;
- Bellabeat Analysis Decision Memo / a future curated Analytical Decision Register;
- Fitbit Identifier Revision Audit Notebook / a future Reproducibility Study;
- an individual approved figure if it becomes useful across multiple collections or projects;
- the source dataset if a future Research / Dataset collection makes persistent membership valuable.

Promotion grants Collection-membership eligibility. It does not require duplicating or replacing the underlying Resource.

---

## 9. Current Website-Registry Gap Exposed by Ingestion

The current registry can store `Artifact`, `Collection`, `Membership`, `Asset`, and `SourceRecord`, but it does not yet express the new v0.7 ontology completely.

Before the full Bellabeat ingestion can be implemented cleanly, the L2 branch needs the minimum practical support for:

1. a query-addressable Resource identity broader than the current media-focused `Asset` type;
2. an Artifact → Resource support relationship with role/order/publication metadata;
3. Resource representations so one logical Resource may have HTML/Markdown or other variants without duplication;
4. a supporting-resources surface in the Artifact window;
5. direct Resource queries that create a temporary Query Reservoir without granting Collection membership;
6. a Resource inspection treatment appropriate to its kind (image, document, external link/repository, notebook, etc.);
7. richer case-study rendering sufficient for approved inline figures and structured recruiter-facing content.

This should be implemented as the smallest L2-enabling extension. Do not build a production ingestion/admin system, database, deduplication engine, or generalized semantic retrieval layer.

---

## 10. Source Authority for Construction

When constructing Bellabeat, preserve the source-authority hierarchy already established in the Bellabeat repository:

1. `reports/analysis/wellness_behavior_analysis.md` — statistics, findings, interpretations, caveats;
2. `reports/analysis/methodology_appendix.md` — grains, definitions, eligibility, transformations, sensitivities, lineage;
3. `reports/analysis/identifier_population_audit.md` — 30-consenter / 35-identifier disclosure and session terminology;
4. `reports/analysis/analysis_decision_memo.md` — inclusion, exclusion, terminology, clustering retirement;
5. `reports/analysis/feature_inclusion_exclusion_matrix.csv` — feature readiness and scope;
6. `reports/analysis/marketing_recommendations.md` — recommendation content, telemetry prerequisites, experiments, guardrails;
7. `reports/analysis/final_validation_report.md` and related QA outputs — release status;
8. official case-study guide — business scenario and required deliverables, not analytical evidence;
9. historical working documents — chronology/context only where consistent with validated sources.

If sources conflict, validated analytical sources control. Website adaptation may shorten, reorder, or visually recompose material, but must not silently change locked statistics, definitions, findings, figures, caveats, or recommendations.

---

## 11. L2 Bellabeat Definition of Done

Bellabeat ingestion is complete when:

- the placeholder Bellabeat record is replaced with approved content;
- date/title/subtitle/metadata match the August 2026 portfolio package;
- Work and Data / Analytics memberships remain intact;
- the recruiter-readable artifact body is implemented;
- approved inline figures render correctly;
- the comprehensive report and selected technical evidence exist as supporting Resources;
- supporting Resources have no Collection membership unless explicitly promoted;
- direct Resource queries preserve Query Reservoir Back/Home semantics;
- duplicate publication representations do not create duplicate Resources;
- non-public/internal repository files are not unnecessarily copied into the portfolio repo;
- the interpretation boundary remains visible and accurate;
- source authority is preserved;
- content validation, TypeScript, lint, production build, and interactive QA pass.
