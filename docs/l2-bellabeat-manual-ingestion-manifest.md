# Digital Reservoir — L2 Bellabeat Manual Ingestion Manifest

**Status:** Manual ingestion review complete / initial website materialization complete; integrated QA pending
**Historical implementation branch:** `feat/l2-bellabeat-ingestion`
**Source repository:** `kodyepugh/bellabeat-wellness-analysis`
**Source branch:** `main`
**Source tree reviewed:** `30543d0a0d7a9a377279d59be7ccf107ab42e472`
**Ontology authority:** `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md` — revision 0.7.1

---

## 1. Ingestion Decision

Bellabeat should remain **one persistent Artifact-status Resource**, not a Collection, for the L2 portfolio release.

The Bellabeat Resource is the independently curated professional object. Its supporting analytical documents, figures, notebook, repository, and source references remain Resources unless later promoted to Artifact status because persistent Collection membership becomes useful.

The Bellabeat Artifact keeps its existing persistent memberships:

- `collection-work`
- `collection-data-analytics`

Supporting Resources receive no Collection membership by default.

Every Collection and every materialized Resource in this ingestion must receive its own stable semantic address. Supporting Resources are not addressable "through Bellabeat"; Bellabeat merely provides one discovery path to their independent addresses.

---

## 2. Primary Bellabeat Object

**Existing ID:** `artifact-bellabeat-wellness-analysis`
**Recommended persistent Resource address:** preserve the existing semantic ID/slug where practical rather than creating a second identity during migration
**Recommended title:** `Bellabeat Wellness-Behavior Analysis`
**Recommended subtitle:** `From Public Fitbit Files to Testable App Strategy`
**Artifact type:** `case-study`
**Inspection kind:** `structured-document`
**Category:** `Data / Analytics`
**Date:** `August 2026`
**Medium:** `Data analysis`
**Format:** `Case study`
**Featured:** `true`
**Published:** `true`

### Interpretation boundary that must remain visible

The case materials describe 30 consenting Fitbit users, while the analytical files contain 35 export/session identifiers and no authoritative session-to-user mapping. Public language must therefore preserve session-level terminology and must not present the 35 identifiers as 35 verified people or as representative Bellabeat customers.

---

## 3. Bellabeat Inspection Surface

Bellabeat should use the common Inspection Window chassis with a **structured-document** primary renderer.

### 3.1 Atmospheric / selected preview

Use the approved portfolio-card layer as the editorial source for the selected-state preview. The preview should communicate, concisely:

- historical Fitbit data analyzed with Excel, BigQuery, and Standard SQL;
- controlled session-level interpretation;
- 1,935 observed session-days;
- movement variability and the 84.9% light-activity share;
- three product directions: personal progress, approachable movement, and customer-controlled timing;
- historical / non-causal interpretation boundary.

Do not copy implementation provenance or lengthy methodology into the atmosphere.

### 3.2 Primary structured-document body

Use the approved recruiter-summary layer as the primary editorial source for the Reservoir reading experience.

Recommended document structure:

1. Project Overview
2. Business Objective
3. From Source Files to BigQuery
4. Analytical Approach
5. Three Core Findings
6. Recommendations
7. Limitations and Next Steps

The final article should be built from reusable structured-document blocks rather than hard-coded Bellabeat sections.

The initial structured block model should be capable of expressing at least:

- headings;
- paragraphs;
- figures;
- lists;
- tables where required;
- links;
- callouts or interpretation-boundary notes;
- supporting-Resource references.

The Artifact window should remain recruiter-readable. Do not inline the entire comprehensive technical appendix into the primary reading flow.

### 3.3 Shared Inspection context

Bellabeat should expose related Resources and Collections through the accepted shared Inspection context tray beneath the primary structured-document content.

The historical side-rail / bubbling-brick concept and later `Resources | Collections` switch are superseded by separate vertical `Resources` and `Collections` regions.

Resource context entries should:

- resolve each supporting Resource's own stable identity/address;
- expose outgoing edges as `Supported by` and incoming edges as `Supports`;
- deduplicate within each direction without collapsing a Resource that legitimately appears in both;
- remain available to every inspected Resource regardless of Artifact status;
- remain secondary to the article;
- preserve canonical Resource-query behavior;
- preserve Inspection return context when the visitor detours from the open Bellabeat Inspection.

Collection context entries should derive from real Collection membership, not from support relationships.

When a Resource has only one published direction, that direction is a static subheading rather than a dead two-option control. Empty Resource or Collection regions are omitted.

On smaller viewports, the same semantic context should remain available without changing the relationship model.

---

## 4. Public Supporting Resources — Materialize Now

The following Resources have sufficient independent inspection value to receive stable semantic identity/addressability now while remaining non-members of Collections.

### A. Comprehensive report

**Logical Resource:** Bellabeat Comprehensive Case Study
**Inspection kind:** `structured-document` for the approved launch presentation; use another renderer only if a later approved representation requires it
**Primary source representation:** `reports/portfolio/bellabeat_portfolio_case_study.html`
**Supporting representation:** `reports/portfolio/bellabeat_portfolio_case_study.md`
**Support role:** `supporting-report`

Its HTML and Markdown forms are representations of one logical Resource, not separate Resources.

### B. Approved figures

Materialize the ten standalone-approved PNGs as individual image Resources. Each receives its own stable Resource address and `image` inspection kind. They may be queried directly without becoming Artifacts.

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

For the primary Bellabeat article, prefer the five figures already selected for the recruiter summary as the initial inline set:

- daily steps distribution;
- activity intensity composition;
- session activity heatmap;
- segmentation stability;
- recording feature presence.

The remaining figures can remain accessible from the supporting-resource interface and/or appear where the final article structure makes them useful.

The canonical figure bytes, meaning, labels, and analytical claims must not be modified during website ingestion without reopening analytical validation.

### C. Analytical methodology

**Logical Resource:** Bellabeat Methodology Appendix
**Inspection kind:** `structured-document`
**Source:** `reports/analysis/methodology_appendix.md`
**Support role:** `methodology`

### D. Identifier / population audit

**Logical Resource:** Bellabeat Identifier Population Audit
**Inspection kind:** `structured-document`
**Source:** `reports/analysis/identifier_population_audit.md`
**Support role:** `validation-evidence`

### E. Analytical decision record

**Logical Resource:** Bellabeat Analysis Decision Memo
**Inspection kind:** `structured-document`
**Source:** `reports/analysis/analysis_decision_memo.md`
**Support role:** `decision-record`

### F. Recommendations evidence

**Logical Resource:** Bellabeat Marketing Recommendations
**Inspection kind:** `structured-document`
**Source:** `reports/analysis/marketing_recommendations.md`
**Support role:** `recommendation-evidence`

### G. Final validation

**Logical Resource:** Bellabeat Final Validation Report
**Inspection kind:** `structured-document`
**Source:** `reports/analysis/final_validation_report.md`
**Support role:** `validation-evidence`

### H. Executed notebook

**Logical Resource:** Fitbit Identifier Revision Audit Notebook
**Inspection kind:** `notebook-code` using the notebook treatment implemented for the current launch material
**Source:** `notebooks/fitbit_identifier_revision_audit.ipynb`
**Support role:** `reproducibility`

### I. GitHub repository

**Logical Resource:** Bellabeat Wellness Analysis Repository
**Inspection kind:** `repository` / `external-link`
**Source:** public GitHub repository `kodyepugh/bellabeat-wellness-analysis`
**Support role:** `reproducibility-repository`

### 4.1 Audited direct Resource graph

The initial 18 edges from Bellabeat to its approved supporting Resources remain canonical. The source audit adds only the following direct relationships among already-materialized Resources; `source → target` means the target supports the source:

- Comprehensive Case Study → Methodology Appendix, Identifier Population Audit, Analysis Decision Memo, Marketing Recommendations, Final Validation Report, and Wellness Analysis Repository;
- Comprehensive Case Study → each of the ten approved figure Resources embedded by the report;
- Identifier Population Audit → Fitbit Identifier Revision Audit Notebook;
- Analysis Decision Memo → Identifier Population Audit;
- Fitbit Identifier Revision Audit Notebook → Wellness Analysis Repository and Final Validation Report;
- each of the ten approved figure Resources → Final Validation Report.

These edges are grounded respectively in the comprehensive report's composition/reproducibility map and figure embeds, the audit's explicit executed-notebook evidence, the decision memo's duplicate/identifier findings, the notebook's repository-local inputs and execution dependencies, and the validation report's explicit notebook-execution and ten-figure hash checks. No edge was reversed, no reciprocal edge was added for presentation, and no new Resource was materialized.

---

## 5. Source Relationships — Record, But Do Not Promote by Default

The public Fitbit CSV collection is described by the validated Bellabeat materials as distributed through Kaggle and attributed there to a Zenodo source.

Create source relationships only after exact public URLs are confirmed from an approved source. Do not invent or infer URLs during ingestion.

If a source target is materialized as a Resource, it receives its own stable semantic address like every other Resource.

The protected BigQuery source dataset and local preserved originals are provenance / analytical infrastructure. They should not be copied into the public portfolio repository merely to make them queryable.

Implementation provenance records may remain implementation records rather than public Resources unless they earn independent inspection value.

---

## 6. Existing Publication Files That Should NOT Become Separate Resources

The following are editorial or packaging variants of other logical objects and should not create duplicate Resource identities:

- `reports/portfolio/bellabeat_portfolio_card.md` — editorial source for atmospheric / card copy;
- `reports/portfolio/bellabeat_recruiter_summary.md` and `.html` — editorial source / representations for the primary Bellabeat Resource reading layer;
- `reports/portfolio/portfolio_artifact.json` — portable packaging representation;
- `reports/portfolio/bellabeat_recruiter_summary_artifact.json` — portable packaging representation;
- `reports/analysis/report_artifact.json` — analytical portable packaging representation;
- HTML and Markdown variants of the same comprehensive report — one logical Resource with multiple representations.

Representation count must not create semantic-object count.

---

## 7. Repository Material to Keep Below the Current Curatorial Resolution

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

These remain accessible through the Bellabeat GitHub Repository Resource and preserve reproducibility without flooding the Reservoir with implementation-level granularity.

They may be materialized as their own Resources later if a specific file earns independent identity/addressability. They may then be promoted further to Artifact status if persistent Collection membership becomes desirable.

---

## 8. Future Artifact Promotion Candidates

Do **not** promote these during the initial L2 Bellabeat cut, but preserve stable Resource identity so promotion remains possible:

- Bellabeat Methodology Appendix;
- Bellabeat Analysis Decision Memo / a future curated Analytical Decision Register;
- Fitbit Identifier Revision Audit Notebook / a future Reproducibility Study;
- an individual approved figure if it becomes useful across multiple Collections or projects;
- the source dataset if a future Research / Dataset Collection makes persistent membership valuable.

Promotion grants Collection-membership eligibility. It does not require duplicating, renaming, or replacing the underlying Resource address.

---

## 9. Direct Addressability Contract for Bellabeat

Every persistent Object participating in Bellabeat must be independently addressable.

### Collections

The existing `Work` and `Data / Analytics` Collections already have stable semantic identities. Their direct addresses resolve to those Collections as persistent Reservoir contexts.

### Bellabeat Artifact-status Resource

Its direct address should resolve through the approved direct-artifact Query Reservoir behavior, preserving canonical focal placement / auto-selection rules and deliberate second-click inspection.

### Supporting Resources

Each materialized supporting Resource receives a stable Resource identity/address independent of Bellabeat.

Selecting a Bellabeat support brick should therefore be equivalent to issuing a direct query for that Resource address:

```text
Bellabeat inspection
→ select support brick
→ retract inspection window
→ direct Resource query
→ temporary Query Reservoir
→ Resource surfaced
→ deliberate inspection
→ renderer selected by inspection kind
```

The query must not grant Artifact status or Collection membership.

---

## 10. Inspection Return Contract

Because support exploration begins inside an open Bellabeat article, Back should restore meaningful reading context rather than merely return to the underlying Data / Analytics Reservoir.

Minimum intended restoration:

- Bellabeat remains the inspected Object;
- Bellabeat inspection window reopens/restores;
- prior article scroll position is restored closely enough to preserve reading continuity;
- Query Reservoir ancestry remains directional;
- no reciprocal return loop is created.

Home remains unchanged: it returns to the root Reservoir and does not need to restore Bellabeat's open inspection window.

---

## 11. Historical Website-Registry Gap Exposed by Ingestion

This section records the historical registry gap that motivated the L2 work. The current implementation status and runtime evidence are maintained in `docs/l2-implementation-status.md`; do not treat the following completed-foundation list as an unimplemented current task.

The Bellabeat ingestion review originally exposed the following minimum website-registry requirements. They are now historical requirements, and `docs/l2-implementation-status.md` controls which are implemented:

1. stable direct semantic addresses for all persistent Collections and Resources;
2. a general Resource identity broader than the current media-focused `Asset` type;
3. Artifact status as the Collection-membership eligibility layer for Resources;
4. an Artifact → Resource support relationship with role/order/publication metadata;
5. Resource representations so one logical Resource may have HTML/Markdown or other variants without duplication;
6. Source as a specialized support/provenance role rather than a mandatory public peer entity;
7. direct Resource queries that create a temporary Query Reservoir without granting membership;
8. a reusable Inspection Window chassis;
9. structured-document rendering from reusable document blocks;
10. image inspection;
11. external-link/repository inspection;
12. the notebook/code treatment required by Bellabeat support material, with unsupported generic file kinds remaining explicit unless later required;
13. the shared Resource/Collection Inspection context tray;
14. minimum inspection-return context for Back;
15. preservation of existing Query Reservoir Home/Back/history/transition behavior.

This should be implemented as the smallest L2-enabling extension.

Do not build a production ingestion/admin system, database, deduplication engine, full search system, unassigned-resource inbox UI, or all future media renderers during Bellabeat.

---

## 12. Future Unassigned-Resource Case

This Bellabeat ingestion intentionally creates Resources only when they have an approved support relationship or explicit public purpose, so no orphaned Resource should be created during this pass.

The architecture should nevertheless preserve the future possibility of a system-generated `Unassigned Resources` query for Resources that have:

```text
Artifact status = false
support relationships = 0
```

That future query provides discoverability without inventing a catch-all Collection.

It is explicitly deferred from the Bellabeat implementation.

---

## 13. Source Authority for Construction

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

## 14. L2 Bellabeat Completion State

### Initial materialization — complete

The current repository line records the initial Bellabeat website materialization as complete.

Completed materialization includes:

- Bellabeat represented as one stable Resource with Artifact status rather than duplicate Resource/Artifact identities;
- current approved title/subtitle/date/metadata;
- Work and Data / Analytics memberships;
- stable semantic addresses for participating Collections and Resources;
- recruiter-readable structured-document content built from reusable blocks;
- approved inline figures;
- independently addressable supporting Resources;
- no default Collection membership for non-Artifact support Resources;
- shared Inspection context for related Resources/Collections;
- separate universal directional Resource context and membership-derived Collection context;
- source-audited direct support relationships among the already-materialized report, evidence, notebook, repository, validation, and figure Resources;
- canonical direct Resource query behavior;
- Resource renderer selection by `inspectionKind`;
- preserved representation identity without duplicate Resources;
- non-public/internal repository detail kept below the current curatorial resolution;
- preserved interpretation boundary and source authority;
- Bellabeat repository Resource and external-link/repository Inspection.

### Integrated launch QA — branch correction pending production retest

Bellabeat should not be considered fully launch-validated until the real production content graph is exercised in-browser.

Verified in the production run for this pass:

- open Bellabeat from intended launch entry points;
- inspect the structured document and figures;
- navigate to supporting Resources and the repository Resource;
- verify Home discards the Inspection return frame and returns to root;
- verify Collection context remains membership-derived;
- verify repository links resolve to the approved external destination;
- verify meaningful reading position is captured at the support detour boundary.

The production run also found that browser Back/Forward restoration could
diverge from the selected URL at multiple engagement points because pathname
lookup was coupled to mutable, branch-truncating Reservoir history. The
branch-local correction gives each settled Reservoir or Inspection state a
typed, path-validated browser entry with stable identity and its own semantic
snapshot. Query and Inspection commits remain separate; selected browser
entries restore without writes; valid owned entries own reload initialization;
latest-wins revisions cancel stale transition continuations; and
close/interface Back reuse only a predecessor verified after browser selection.
Recovery replaces/reloads in place under a bounded guard, practical reading
state is verified against current geometry, and restored-state Back-to-Top
visibility is reconciled after layout changes. The focused localhost matrix
passes support Back/Forward with the existing Query visit, owned Query and
Inspection refresh, same-path snapshots, stale-predecessor fallback,
root-context canonical redirect, bounded geometry/recovery, and restored-state
Back-to-Top behavior. The complete policy and evidence are recorded in
`docs/bellabeat-browser-navigation-transaction-record.md`.

This QA stage remains open until the branch is deployed and production
Back/Forward verification confirms the entry-owned model without duplicate
settled visits. Responsive/accessibility coverage remains later launch work.

The release-preparation roadmap controls when this QA occurs relative to the Portfolio Content Cut and Public Web Layer.
