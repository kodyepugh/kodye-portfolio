# KP Website — Release Preparation Roadmap

**Status:** Current sequencing authority for near-term work
**Updated:** August 23, 2026

## Objective

Prepare the KP Website / Digital Reservoir for a credible public portfolio launch that can be used immediately in job applications.

The immediate objective is to launch publicly as soon as responsibly possible, with Bellabeat as the only substantive portfolio project required for launch. The production URL should then be usable on the resume and in job applications. The launch version should remain understandable and accessible to visitors who do not already understand the spatial interface.

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

## 1. Bellabeat Launch Cut — Launch-Blocking

**Status:** Complete in the current public-launch repository line.

Treat the already-materialized Bellabeat project and supporting Resources as the substantive portfolio content required for launch. Audit the production-visible registry and hide or unpublish unfinished, synthetic, placeholder, development-only, or misleading public objects that are not intentionally required for the launch experience.

Do not require additional portfolio projects merely to create Reservoir density. If an object is not ready, remove it from the public launch surface rather than filling it with speculative content.

### Completion condition

This stage is complete when the production-visible registry presents Bellabeat and its supporting Resources as an intentional, truthful launch cut without unfinished public objects that a recruiter would be expected to interpret as portfolio work.

The current launch registry publishes only the root Digital Reservoir Collection. Its Home membership is exactly Bellabeat, Resume, and Contact. Bellabeat's supporting Resources remain published and independently addressable through the established support graph without receiving Collection membership. Dormant Collections and unfinished About and Reservoir Interface Study Resources remain in the canonical registry as unpublished compatibility/future records.

---

## 2. Public Web Essentials — Launch-Blocking

Complete the production essentials needed for a credible live portfolio.

### Foundational presentation metadata — completed on `feat/public-web-metadata`

The launch registry now resolves a controlled public-facing Medium independently
from Resource `type`, with one deterministic Medium-to-node-color authority.
Published Objects carry system Added/Modified dates and optional ordered `By` /
`For` / `On` relationships. Atmosphere presentation uses the shared grammar
Title, optional Subtitle, Medium/Added/Modified, then optional relationships;
it does not expose technical provenance or collection membership. Reservoir
labels are Medium plus Title, and Inspection landing derives only from the
measured atmosphere bottom plus responsive gap. This pass does not implement
public routing, browser-history synchronization, production SEO metadata,
custom-domain configuration, or production Resend delivery.

### Public routing — completed

Public URLs now resolve published canonical Objects through the shared
Reservoir shell: `/` is Home, a published Collection uses
`/<collection-slug>`, and a published Resource uses `/<resource-slug>` to
enter the established single-result Query Reservoir and Inspection flow.
`/<collection-slug>/<resource-slug>` is accepted only for an actual published
Collection membership and records that Collection as the Resource's return
context; it does not create a second Resource identity. The root Collection
slug redirects canonically to `/`; unknown, unpublished, mismatched, and
non-member contextual paths render Next's unavailable surface.

The resolver is registry-backed and validates the existing global semantic
address namespace rather than deriving URLs from display text. Reservoir
history remains the owner of semantic visits. A closed Reservoir exposes its
Collection URL; an open Inspection exposes the Resource URL. Browser history
records committed semantic destinations and owned Resource entries carry only
their return path and initial-entry status. `popstate` asks the same coordinator
to restore or retract the visible semantic state without adding another browser
entry. Index, footer, Inspection support navigation, Home, and visible
Reservoir history therefore converge on the same public address policy. URLs
never encode presentation-only state such as Index visibility, Inspection
scroll, zoom, or layout mode.

### Reservoir Index and semantic footer — completed on `feat/reservoir-index-navigation`

The public interface now provides a conventional semantic-DOM Reservoir Index
as a projection of the active canonical Reservoir context. It does not create
an alternate content registry: Collection entries retain the existing
Collection transition and history behavior, while Resource entries use the
active Reservoir's ordinary select-then-open Inspection path without creating
a new Query Reservoir. Footer Resource selectors likewise rotate an already
active Resource to the canonical forehead point; only an absent Resource uses
the direct Query Reservoir path. The Index
shows Title, Medium, Added, and Modified with deterministic Medium icons, is keyboard reachable, uses the same holographic control-panel visual treatment, and remains synchronized
to semantic context commits during Collection reconstitution.

The environmental footer now exposes published, explicitly designated Resource
destinations through that same direct Resource coordinator. The launch cut
publishes Resume and Contact there; professional social destinations remain
owned by Contact rather than duplicated as global footer links. This does not
implement public routing, browser-history synchronization, deep-link
initialization, production SEO metadata, custom-domain configuration, or
production Resend delivery.

### Production identity

Replace remaining prototype/study framing with public portfolio identity appropriate to the live portfolio.

Confirm:

- production page title;
- production description;
- Open Graph/social metadata;
- favicon and appropriate identity assets;
- canonical production-domain configuration;
- removal of visible prototype/debug/study language that is not intentionally part of the Digital Reservoir case study.

The public website should present the Digital Reservoir as the interface of the portfolio, not present the entire site as an unfinished spatial experiment.

### Real outbound actions

Wire and verify working production destinations for:

- LinkedIn;
- GitHub;
- email/contact;
- Resume.

No launch-facing navigation control should remain wired to a development placeholder such as `#` or an unavailable destination.

The implemented Contact Resource provides a bounded form, LinkedIn, and GitHub through its dedicated Inspection surface. Production delivery remains a deployment task: configure the server-only `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (a controlled, verified sender), and optional `CONTACT_TO_EMAIL` (which otherwise defaults server-side to the approved recipient). The visitor email is used only as `Reply-To`; do not expose delivery configuration in client content or claim production delivery until the Resend sender/domain is configured and smoke-tested.

### Direct addressability

Important professional Resources should be directly reachable without requiring a visitor to manually traverse the Reservoir from root.

At minimum establish a practical direct public address for:

- Bellabeat;

Resume must be reliably viewable or downloadable. A more elaborate Resume Reservoir presentation is not itself a launch prerequisite. A full About artifact or case study is also not launch-blocking if a minimal professional identity and contact path is sufficient.

Direct Resource access should reuse the established semantic Resource and Query Reservoir architecture rather than creating a parallel content system.

For Bellabeat, preserve:

- refresh behavior;
- browser back/forward expectations;
- meaningful return context;
- canonical Resource identity.

The first release does not require a complete public routing architecture for every possible future Resource.

### Approved routing contract for the next phase

The routing implementation belongs to Public Web Essentials and is not implemented by the completed Bellabeat Launch Cut. The contract to preserve is:

- internal semantic ID, display title, and public slug remain distinct concepts;
- a slug is an explicit stable address token and does not automatically change when a title changes;
- Home/root is reserved for `/`;
- a directly addressed persistent Object will eventually use `/<object-slug>`;
- a Resource remains independently addressable regardless of Collection membership;
- a contextual Resource path may eventually use `/<collection-slug>/<resource-slug>`;
- the contextual path expresses viewing/navigation context and does not create a second Resource identity;
- Collection membership creates context and discovery, not identity.

Intended examples are `/`, `/bellabeat-wellness-analysis`, `/resume`, `/contact`, future `/work`, and future `/work/cif-oakland`. Dynamic routing, browser-history synchronization, deep-link initialization, and production-domain behavior remain part of Public Web Essentials rather than the completed Bellabeat Launch Cut.

### Completion condition

This stage is complete when the website behaves as a conventional public portfolio where necessary while preserving the Reservoir as its primary interface.

---

## 3. Bellabeat Recruiter-Path QA — Launch-Blocking

Prioritize the actual recruiter journey from direct Bellabeat entry through the case study, figures and supporting Resources, repository, return navigation, and other essential launch actions rather than relying only on synthetic validation.

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

### Required invariants and bounded regression coverage

Also exercise the relevant launch paths and preserve:

- canonical Resource identity and semantic/navigation invariants;
- root, Home, Back, ancestry, direct Resource query, and Query Reservoir behavior;
- Inspection open/close, footer/terminal reveal, and Resource/Collection context navigation;
- the established layout, zoom, label, Reservoir Index, and control behavior where exercised by the launch path.

Do not reopen closed L2 architecture absent a reproducible defect.

### Completion condition

This stage is complete when the real launch registry proves the established semantic and interaction architecture under actual user-facing content.

---

## 4. Minimum Responsive / Accessibility / Interaction Sweep — Launch-Blocking Where Functional

Validate the launch experience on representative desktop/laptop configurations first, plus a practical mobile sanity check. Verify keyboard/direct-access usability and functional interaction, and fix launch-blocking regressions.

This is a release pass, not a redesign milestone.

### Responsive coverage

Test representative:

- large desktop;
- laptop;
- narrow desktop window;
- practical mobile viewport.

Verify particularly:

- Reservoir framing;
- Focused layout;
- labels;
- atmosphere;
- control plane;
- Reservoir Index;
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

Bellabeat and other essential launch actions must also be reachable through a semantic DOM-based path rather than requiring direct manipulation of WebGL/R3F nodes.

The Reservoir Index is the required restrained index/navigation surface.

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

Do not delay launch for minor choreography or other non-blocking polish items already classified as refinement backlog. Do not reopen accepted Inspection architecture solely to perfect non-blocking choreography.

### Completion condition

This stage is complete when the launch experience is functionally reliable across representative device/input configurations and important portfolio content has a practical non-spatial access path.

---

## 5. Production Release — Launch-Blocking

Once the Bellabeat launch cut, public essentials, and bounded QA are stable, perform the final release gate.

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
- external repository destinations work.

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

Once this passes, the site is ready to place on the resume and use in job applications.

The public release should be treated as the first live portfolio version of the Digital Reservoir, not as the completion of the broader Digital Reservoir product.

## Ongoing Portfolio Expansion — Post-Launch

After launch, expand the portfolio deliberately over time without making applications wait for additional content. This post-launch workstream may include, as appropriate:

- fuller About content;
- Digital Reservoir case study;
- Workforce Development;
- CIF Oakland;
- Oakland Gospel Festival if selected;
- other future portfolio or archive content.

These additions are not release prerequisites and should not block the initial public launch.

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
