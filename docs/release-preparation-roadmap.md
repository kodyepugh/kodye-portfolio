# KP Website — Release Preparation Roadmap

**Status:** Current sequencing authority for near-term work
**Updated:** August 24, 2026

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

**Status:** Complete.

Complete the production essentials needed for a credible live portfolio.

### Foundational presentation metadata — completed

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
`/<collection-slug>`, a single-result Query Reservoir uses the derived
`/q/<resource-slug>`, and an open Resource Inspection uses
`/<resource-slug>` (or its valid contextual Resource address).
`/<collection-slug>/<resource-slug>` is accepted only for an actual published
Collection membership and records that Collection as the Resource's return
context; it does not create a second Resource identity. The root Collection
slug redirects canonically to `/`; unknown, unpublished, mismatched, and
non-member contextual paths render Next's unavailable surface.

The resolver is registry-backed and validates the existing global semantic
address namespace rather than deriving URLs from display text. Reservoir
history remains the owner of semantic visits. A closed Reservoir exposes its
actual Collection or addressable single-result Query URL; an open Inspection
exposes the Resource URL. Browser history
records committed semantic destinations and owned Resource entries carry only
their return path and initial-entry status. `popstate` asks the same coordinator
to restore or retract the visible semantic state without adding another browser
entry. Index, footer, Inspection support navigation, Home, and visible
Reservoir history therefore converge on the same public address policy. URLs
never encode presentation-only state such as Index visibility, Inspection
scroll, zoom, or layout mode.

Direct Resource initialization follows the same active-Reservoir rule as Index and
footer selection: when the requested Resource is already represented by the
initialized active Reservoir, the shared coordinator selects that existing node,
rotates it to the canonical forehead point, and opens Inspection without creating
a Query Reservoir. For a valid contextual Resource route, that reuse is eligible
only when the active Collection matches the Collection encoded by the URL; a
different active Collection is reconstituted first and the same existing node is
then focused and opened. Existing matching Collection history is reused rather
than duplicated. An absent Resource uses the established direct Resource → Query
Reservoir path. Explicit `/q/<resource-slug>` routes always retain their derived
single-result Query Reservoir meaning.

Supporting-Resource navigation from an open Inspection explicitly disables
active-node reuse and retains the established ephemeral Query Reservoir detour
and Inspection-return history boundary.

### Reservoir Index and semantic footer — completed

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

**Status:** Completed.

The root metadata and public route metadata now present **Kodye Pugh — Digital
Reservoir** as the portfolio identity. Published Resource routes derive their
titles and available descriptions from the canonical registry; Query Reservoir
and contextual Resource paths canonically identify the direct Resource and are
not independently indexed. The shared social card and app icon use the
approved Kodye Pugh mark with explicit owned backgrounds, and the public shell
no longer describes itself as a spatial study or initial prototype.

The production canonical base is `https://kodyepugh.com`, as established by
the project authorities, and the production deployment is connected to that
domain. The completed Production Release audit records final verification of
the live canonical, robots metadata, icon, social preview, assets, and direct
Resource URLs on the production domain.

Completed:

- production page title and description;
- Open Graph/social metadata and owned-background preview;
- public robots defaults and canonical metadata foundation;
- app icon identity treatment;
- removal of public-shell prototype/study framing.

The public website should present the Digital Reservoir as the interface of the portfolio, not present the entire site as an unfinished spatial experiment.

### Real outbound actions

Wire and verify working production destinations for:

- LinkedIn;
- GitHub;
- email/contact;
- Resume.

No launch-facing navigation control should remain wired to a development placeholder such as `#` or an unavailable destination.

The implemented Contact Resource provides a bounded form, LinkedIn, and GitHub through its dedicated Inspection surface.

### Production Contact delivery — completed

Production Contact delivery is configured and smoke-tested. The production deployment uses the server-only `RESEND_API_KEY`, `CONTACT_FROM_EMAIL=contact@kodyepugh.com`, and `CONTACT_TO_EMAIL=contact@kodyepugh.com`. The `kodyepugh.com` sending domain is authenticated with Resend, and a live form submission reached the configured mailbox. A reply addressed the visitor through the existing `Reply-To` behavior. The delivery implementation remains server-only and does not expose the API key or delivery configuration to client code.

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

### Implemented routing contract

The current routing contract to preserve is:

- internal semantic ID, display title, and public slug remain distinct concepts;
- a slug is an explicit stable address token and does not automatically change when a title changes;
- Home/root is reserved for `/`;
- a directly addressed published Collection uses `/<collection-slug>`;
- an addressable single-result Query Reservoir uses the derived `/q/<resource-slug>` namespace without becoming a persistent Object;
- an open Resource Inspection uses `/<resource-slug>` unless a valid Collection context is intentionally represented by `/<collection-slug>/<resource-slug>`;
- a Resource remains independently addressable regardless of Collection membership;
- the contextual path expresses viewing/navigation context and does not create a second Resource identity;
- Collection membership creates context and discovery, not identity;
- ordinary Inspection close exposes the actual underlying Collection or Query Reservoir, while explicit Back owns return to prior semantic history.

Current examples are `/`, `/bellabeat-wellness-analysis`, `/q/bellabeat-wellness-analysis`, `/resume`, and `/contact`; future published Collections may use paths such as `/work` and contextual member Resources such as `/work/cif-oakland`. The production domain is connected, launch-facing outbound destinations are verified, and the corrected Bellabeat direct-route behavior is deployed and smoke-tested on production.

### Completion condition

This stage is complete. Production `/bellabeat-wellness-analysis` uses Home plus the existing Bellabeat node rather than an unnecessary Query Reservoir; refresh preserves that behavior; closing the Inspection exposes `/`; and `/q/bellabeat-wellness-analysis` retains explicit single-result Query Reservoir semantics. Contact delivery, LinkedIn, GitHub, Resume/PDF access, and Contact refresh are also verified.

---

## 3. Bellabeat Recruiter-Path QA — Launch-Blocking / Complete

**Status:** Complete.

Bellabeat was used as the integrated recruiter-path test because it exercises the richest combination of structured reading, figures, supporting Resources, repository handoff, Query detours, browser navigation, Inspection return ownership, and Home behavior in the launch registry.

The production exercise exposed a systemic browser-history ownership defect after support detours. The completed correction now uses one explicit stable-state transaction model: Query and Inspection commits own separate entries; entry identity and full semantic snapshots distinguish same-path visits; browser restoration is no-write/latest-wins; valid owned entries own reload initialization; physical browser Back is restricted to exact adjacency known by the current live document; refreshed or otherwise unverified interface Back/close paths use semantic push/replace fallbacks; recovery replaces/reloads in place under a bounded loop guard; root-context Resource URLs redirect server-side to their direct canonical URL; and practical reading restoration is bounded to current geometry. The exact policy and evidence are recorded in `docs/bellabeat-browser-navigation-transaction-record.md`.

Branch-local runtime QA covered support Back/Forward with the same Query visit, owned Query/Inspection refresh, same-path snapshots, stale-predecessor fallback, current-document Back eligibility, root-context canonical redirect, bounded recovery, geometry changes, and restored-state Back-to-Top behavior. The user then completed the production visual/runtime smoke test and approved closeout.

Treat this navigation model as accepted launch behavior. Do not reopen it during later launch work without a reproducible regression.

### Verified Bellabeat path

The accepted QA covered:

- Bellabeat surfaced from its intended public entry points;
- structured-document and figure rendering;
- supporting Resource and repository navigation;
- canonical Resource identity through support detours;
- browser Back/Forward restoration across Query and Inspection states;
- refreshed Query interface Back and refreshed Inspection close behavior;
- practical reading-position restoration;
- restored-state Back-to-Top behavior;
- Home discarding Inspection return context and returning to root;
- Collection context remaining membership-derived rather than inferred from support relationships;
- safe external repository navigation.

### Completion condition

Complete. The real launch registry proved the established semantic and interaction architecture under actual user-facing Bellabeat content and the corrected navigation model passed the accepted production visual/runtime check.

---

## 4. Minimum Responsive / Accessibility / Interaction Sweep — Launch-Blocking Where Functional / Complete

**Status:** Complete.

Stage 4 is closed. Representative desktop, laptop, narrow, and mobile layouts passed; IR-01 and IR-03 were resolved through the shared structured-document containment correction; SG-01 was not reproduced; the lint baseline is green; keyboard/focus and reduced-motion checks passed; the accepted Stage 3 browser-navigation contract remained intact; and the latest branch deployment passed Vercel verification.

The user completed and approved the physical-device touch smoke test, including Reservoir drag/tap/open behavior, pinch and image interactions, context-tray versus vertical reading scroll, terminal/footer reveal, and practical Index use. This closes the final input-evidence gate. No P2/P3 refinement item is being held as a launch blocker.

Treat the Stage 4 behavior as accepted launch behavior unless a reproducible regression is found. The complete diagnostic, correction, and closeout evidence is recorded in `docs/stage-4-minimum-responsive-accessibility-interaction-audit.md`.

### Responsive coverage

Verified representative:

- large desktop;
- laptop;
- narrow desktop window;
- practical mobile viewport.

The accepted sweep covered Reservoir framing, Focused layout, labels, atmosphere, control plane, Reservoir Index, Inspection landing geometry, structured documents, image Inspection, external-link/repository Inspection, context tray, close control, Back to Top, and terminal/footer reveal.

### Input coverage

Accepted coverage includes:

- pointer/mouse interaction;
- wheel interaction;
- physical touch interaction;
- keyboard access;
- Escape behavior;
- focus restoration;
- reduced motion.

### Conventional access path

Bellabeat and other essential launch actions remain reachable through the semantic DOM-based Reservoir Index rather than requiring direct manipulation of WebGL/R3F nodes.

The first release does not require a complete alternate 2D version of the Digital Reservoir.

### Known refinement items

Existing observations such as:

- close-X latency;
- backdrop-entry opacity choreography;
- optional mobile density refinement;

remain post-launch refinement items unless they later become reproducible functional regressions.

### Completion condition

Complete. The launch experience is functionally reliable across the representative device/input configurations exercised for the first release, important portfolio content has a practical non-spatial access path, physical touch behavior is user-approved, and the Stage 4 deterministic validation and deployment evidence are release-acceptable.

---

## 5. Production Release — Complete

**Status:** Complete. The first public portfolio release is complete and `https://kodyepugh.com/` is approved for resume and job-application use. All five launch stages are complete; the final Resume synchronization, Index/layout correction, production acceptance, and accepted post-launch evidence boundaries are recorded in `docs/production-release-audit.md`.

Further content and product work is post-launch expansion rather than
launch-blocking work.

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

This release condition is met: the site is ready to place on the resume and use
in job applications.

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
