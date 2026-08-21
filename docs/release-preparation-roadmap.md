# KP Website — Release Preparation Roadmap

**Status:** Current sequencing authority for near-term work
**Updated:** August 21, 2026

## Objective

Prepare the KP Website / Digital Reservoir for a credible public portfolio launch that can be used immediately in job applications.

The launch version should present approved professional work through the Reservoir while remaining understandable and accessible to visitors who do not already understand the spatial interface.

Launch readiness requires four things to be true together:

- the public portfolio contains the right finished professional content;
- important work is reachable through both the Reservoir and practical conventional web paths;
- the Reservoir's real content, navigation, Inspection, responsive, and accessibility behavior is reliable;
- the production deployment, metadata, outbound actions, and direct links are complete and verified.

This roadmap answers **what comes next**.

It does not replace the ontology, interface specification, Codex brief, Bellabeat ingestion manifest, implementation-status record, or accepted closeout documents.

---

## Completed Foundation

The current L2 foundation is implemented and should be treated as stable unless a reproducible regression is found.

Completed foundation includes:

- canonical Collection/Resource identity;
- Artifact as curatorial Resource status rather than a separate semantic object class;
- representations, memberships, support relationships, provenance, and addressability;
- direct Resource Query Reservoir surfacing;
- preserved Query Reservoir closure and return behavior;
- common Resource-oriented Inspection Window;
- structured-document Inspection foundation;
- supporting-Resource navigation;
- minimum Inspection return context;
- shared Resource/Collection Inspection context grammar;
- polished image Inspection;
- external-link/repository Inspection;
- Bellabeat repository Resource and accepted external-link/repository behavior;
- Bellabeat's initial approved Resource/support graph;
- Bellabeat launch document, figures, notebook material, and related supporting-resource structure already recorded as materialized.

Do not reopen these systems merely because later launch work interacts with them.

See `docs/l2-implementation-status.md` for current implementation state and the relevant closeout documents for accepted implementation evidence.

---

# Release Sequence

## 1. Portfolio Content Cut — Launch-Blocking

Finish the public-facing content set before treating the site as release-ready.

The launch portfolio should contain only material that is sufficiently complete to represent the user professionally.

### Required launch content

At minimum, confirm and finalize:

- **Bellabeat** as the flagship analytics case study;
- **Resume** with the current approved resume asset or presentation;
- **About** with concise professional positioning;
- **Digital Reservoir** as a project/product/interface case study;
- the selected web/client work appropriate for the first public portfolio cut.

Current likely client/project candidates include:

- Workforce Development;
- CIF Oakland;
- Oakland Gospel Festival;

but final inclusion remains a user decision.

### Public-content rule

Every published public object must satisfy one of the following:

- it contains approved launch-ready content; or
- it serves an intentional functional role required by the launch experience.

Do not preserve visibly unfinished, empty, placeholder, or development-only public objects solely to create Reservoir density.

If an object is not ready, hide or unpublish it rather than filling it with speculative placeholder content.

### Completion condition

This stage is complete when a recruiter can inspect the major public portfolio objects without encountering unfinished placeholder content or being asked to infer work that has not been presented.

---

## 2. Public Web Layer — Launch-Blocking

Convert the technically mature Reservoir from a prototype presentation into a production professional website.

### Production identity

Replace remaining prototype/study framing with public portfolio identity.

Confirm:

- production page title;
- production description;
- Open Graph/social metadata;
- favicon and appropriate identity assets;
- canonical production-domain configuration;
- removal of visible prototype/debug/study language that is not intentionally part of the Digital Reservoir case study.

The public website should present the Digital Reservoir as the interface of the portfolio, not present the entire site as an unfinished spatial experiment.

### Real outbound actions

Verify working production destinations for:

- LinkedIn;
- GitHub;
- email/contact;
- Resume.

No launch-facing navigation control should remain wired to a development placeholder such as `#` or an unavailable destination.

A complex contact form is not required for the first release.

### Direct addressability

Important professional Resources should be directly reachable without requiring a visitor to manually traverse the Reservoir from root.

At minimum establish practical direct addresses for:

- Bellabeat;
- Resume;
- About;
- Digital Reservoir project/case study.

Direct Resource access should reuse the established semantic Resource and Query Reservoir architecture rather than creating a parallel content system.

Where practical, preserve:

- refresh behavior;
- browser back/forward expectations;
- meaningful return context;
- canonical Resource identity.

The first release does not require a complete public routing architecture for every possible future Resource.

### Completion condition

This stage is complete when the website behaves as a conventional public portfolio where necessary while preserving the Reservoir as its primary interface.

---

## 3. Integrated Reservoir QA — Launch-Blocking

Exercise the actual launch content graph in the browser rather than relying only on synthetic validation.

Bellabeat should be the primary integrated QA path because it currently exercises the richest combination of document, figure, repository, supporting-resource, and return-context behavior.

### Required Bellabeat path

Verify:

- Bellabeat can be surfaced from its intended public entry points;
- its structured document opens correctly;
- figures and document content render correctly;
- supporting Resources are discoverable;
- the repository Resource opens through the external-link/repository Inspection surface;
- supporting-Resource navigation uses canonical Resource identity;
- Back restores the Bellabeat Inspection;
- practical reading position is restored appropriately;
- Home discards Inspection return context and returns to root;
- Collection context remains membership-derived rather than inferred from support relationships;
- external navigation behaves safely and predictably;
- unavailable or invalid external targets resolve gracefully.

### Wider Reservoir regression coverage

Also exercise:

- root navigation;
- Collection traversal;
- Home;
- Back;
- ancestry/path behavior;
- direct Resource queries;
- Query Reservoir transitions;
- Distributed ↔ Focused layout behavior;
- sparse and dense populations;
- zoom and adaptive deep zoom;
- labels near sphere limbs and viewport edges;
- Inspection open/close;
- footer and terminal reveal;
- menu/control behavior;
- Resource/Collection context navigation.

### Completion condition

This stage is complete when the real launch registry proves the established semantic and interaction architecture under actual user-facing content.

---

## 4. Responsive, Accessibility, and Interaction Regression Sweep — Launch-Blocking Where Functional

Validate that the portfolio remains usable outside the development desktop configuration.

This is a release pass, not a redesign milestone.

### Responsive coverage

Test representative:

- large desktop;
- laptop;
- narrow desktop window;
- tablet;
- mobile portrait;
- mobile landscape.

Verify particularly:

- Reservoir framing;
- Focused layout;
- labels;
- atmosphere;
- control plane;
- menu;
- Inspection landing geometry;
- structured-document layout;
- image Inspection;
- external-link/repository Inspection;
- context tray;
- close control;
- Back to Top;
- terminal/footer reveal.

### Input coverage

Verify:

- pointer/mouse interaction;
- wheel interaction;
- touch interaction where supported;
- keyboard access;
- Escape behavior;
- focus restoration;
- reduced motion.

### Conventional access path

Important launch content must also be reachable through a semantic DOM-based path rather than requiring direct manipulation of WebGL/R3F nodes.

This may be implemented through the existing menu or another restrained index/navigation surface.

The first release does not require a complete alternate 2D version of the Digital Reservoir.

The objective is simply to ensure that important work remains reachable for:

- keyboard users;
- visitors who do not immediately understand the spatial interface;
- devices where 3D interaction is inconvenient;
- recruiters who want direct access to major work.

### Known refinement items

Existing observations such as:

- close-X latency;
- backdrop-entry opacity choreography;

remain refinement items unless they:

- prevent reliable use;
- reveal a functional regression;
- materially disrupt expected interaction.

Do not reopen accepted Inspection architecture solely to perfect non-blocking choreography.

### Completion condition

This stage is complete when the launch experience is functionally reliable across representative device/input configurations and important portfolio content has a practical non-spatial access path.

---

## 5. Production Release — Launch-Blocking

Once content and interaction behavior are stable, perform the final release gate.

### Validation

Run all established validation appropriate to the release candidate, including where applicable:

- content/schema validation;
- Inspection validation;
- geometry/label validation;
- typecheck;
- lint;
- production build;
- `git diff --check`;
- targeted runtime diagnostics.

Separate pre-existing warnings from release regressions.

### Production deployment

Confirm:

- production deployment succeeds;
- production domain is configured correctly;
- canonical metadata resolves correctly;
- public assets load correctly;
- direct Resource URLs resolve correctly;
- refresh on direct Resource URLs behaves correctly;
- browser navigation behaves acceptably;
- Resume opens/downloads correctly;
- LinkedIn works;
- GitHub works;
- email/contact works;
- external repository links work.

Smoke-test the **actual production URL**, not only localhost.

### Release condition

The portfolio is launch-ready when:

- approved professional content is present;
- unfinished public content is hidden;
- major work is conventionally addressable;
- the Reservoir's real-content paths have passed integrated QA;
- responsive/accessibility requirements are met at the agreed first-release level;
- production validation succeeds;
- the production URL and major outbound/direct-navigation paths have been manually verified.

At that point, begin using the site in applications.

The public release should be treated as the first live portfolio version of the Digital Reservoir, not as the completion of the broader Digital Reservoir product.

---

# Deferred Product Work

The following should **not** delay the current public portfolio launch unless the user explicitly expands scope:

- production ingestion/admin workflows;
- database persistence;
- automated migration;
- content hashing/deduplication infrastructure;
- full-text search;
- semantic search;
- Unassigned Resources inbox/query UI;
- automated Artifact promotion;
- automated Collection creation;
- polished renderers for video, audio, dataset-table, generic-file, or Resource kinds not required by launch content;
- complete personal archive migration;
- automatic semantic clustering;
- relationship visualization;
- timeline modes;
- sophisticated alternate 2D interface;
- topology LOD;
- semantic zoom;
- speculative future product architecture unrelated to launch readiness.

Future renderer or ingestion work should only move ahead of launch work when a specific approved launch Resource requires it.

---

# Authority and Source-of-Truth Responsibilities

The repository uses **domain-specific authorities**, not one document that overrides all others.

## User instruction

The user's current explicit instruction has highest authority over project direction and task scope.

## Release sequencing

`docs/release-preparation-roadmap.md`

Controls:

- what should be worked on next;
- launch priorities;
- launch blockers;
- deferred work.

It does not define semantic architecture, determine implementation-completion state, or claim that work is implemented.

## Implementation state

`docs/l2-implementation-status.md`

Controls:

- what has landed;
- what remains technically open;
- accepted implementation checkpoints.

It records implementation-completion state only. It does not determine sequencing and does not override ontology or user priorities.

## Semantic architecture

`docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`

Controls:

- Object identity;
- Resource identity;
- Artifact status;
- Collections;
- membership;
- support relationships;
- addressability;
- semantic roles.

## Interaction and visual behavior

`docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`

Controls established interaction and visual behavior unless superseded by a later explicit approved specification or implementation correction.

## Implementation context

`docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`

Provides implementation background, constraints, and closed foundation context.

It should not be treated as more current than explicit implementation-status or roadmap documents.

## Bellabeat content authority

`docs/l2-bellabeat-manual-ingestion-manifest.md`

Controls approved Bellabeat content, provenance, materialization boundaries, and curatorial decisions.

## Completed-pass evidence

Closeout documents record accepted outcomes and boundaries for specific completed passes.

They are historical evidence, not general sequencing authorities.

## Runtime truth

Current code, validated runtime behavior, and current validation output determine what the application actually does.

When runtime truth and documentation diverge:

1. identify the discrepancy;
2. determine whether behavior or documentation is incorrect;
3. correct the appropriate source;
4. reconcile the documentation afterward.

---

## Roadmap Maintenance

Do not use this roadmap to preserve:

- transient branch state;
- exact implementation constants;
- temporary debugging observations;
- detailed architecture already owned by another canonical document;
- speculative future design.

Update it when:

- release sequencing materially changes;
- a launch blocker is completed;
- a deferred item becomes launch-required;
- the public-launch definition changes.

Keep it concise enough that a new ChatGPT, Work, or Codex session can determine **what matters next** without reconstructing project history.
