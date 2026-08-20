# Digital Reservoir — L2 Implementation Status

**Status:** Active L2 implementation checkpoint  
**Updated:** August 20, 2026  
**Ontology authority:** `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md` revision 0.7.1  
**Bellabeat ingestion authority:** `docs/l2-bellabeat-manual-ingestion-manifest.md`

---

## Purpose

This document records which portions of the L2-enabling architecture described in the ontology and Bellabeat ingestion manifest are already implemented on `main`.

It is an implementation-status companion only. It does not supersede ontology, content, or interaction rules.

Where the Bellabeat manifest's section describing the "Current Website-Registry Gap" still lists already-completed foundation work, this status document controls only the implementation-completion state.

---

## Completed on Main

### 1. Canonical Object / Resource Registry Foundation

Implemented and merged:

- persistent semantic `Object = Collection | Resource`;
- canonical Resource identity with Artifact represented as `isArtifact: true` status rather than a peer semantic entity;
- stable semantic Resource and Collection IDs/slugs with global address-token collision validation;
- Resource-native type vocabulary independent of inspection kind;
- Artifact-status gating for persistent Collection membership;
- canonical memberships limited to `resource | collection`;
- Resource representations so multiple representations do not create duplicate semantic Resources;
- Artifact-status Resource → Resource supporting-relationship model;
- Source/provenance implementation records aligned to Resource identity;
- compatibility Artifact selectors projected from canonical Resources;
- validation for addressability, membership, representation, support-relationship, and dangling-reference invariants.

### 2. Direct Resource → Query Reservoir Surfacing

Implemented and merged:

- published non-Artifact Resources can be adapted into Query Reservoir nodes without Collection membership;
- semantic Query Reservoir nodes distinguish `artifact`, `resource`, and `collection`;
- Artifact-status and non-Artifact Resources share the inspectable-resource sizing/rendering family while retaining truthful semantic status;
- direct Resource requests resolve through the canonical Resource address and reuse the existing Query Reservoir coordinator;
- direct About/Resume requests use the same generic Resource-query seam;
- single-result Resource queries use existing canonical focal placement and auto-selection behavior;
- selection state is Resource-native;
- Query Reservoir Back/Home and context-local state restoration remain unchanged;
- Resource atmosphere metadata and diagnostics are status-aware;
- non-Artifact Resources are not falsely reported as Artifacts in query-node, adaptive-zoom, or traversal diagnostics;
- synthetic QA covers non-Artifact Resource adaptation without adding fake production content.

### 3. Common Inspection Window + Structured-Document Foundation

Implemented and merged:

- one Resource-oriented `InspectionWindow` is the canonical reading/inspection chassis;
- the former `ArtifactWindow` remains only as a compatibility wrapper for older callers;
- inspection eligibility and continuation capability are driven by implemented Resource inspection surfaces rather than Artifact status;
- both Artifact-status and non-Artifact Resources can use the same inspection architecture when their `inspectionKind` is supported;
- `inspectionKind` selects the inspection surface;
- `structured-document` is the first canonical inspection surface;
- legacy `rich-text`, `case-study`, and `document` content adapts into the structured-document model instead of forming a second canonical document system;
- reusable ordered structured-document blocks include headings, paragraphs, figures, lists, callouts, links, dividers, tables, quotes, code, and Resource references;
- figure blocks reference stable Resource/representation identity rather than creating duplicate file identity;
- structured-document validation covers block identity/order constraints, Resource references, representation references, figure alt text, links, lists, tables, and content/inspection compatibility;
- unsupported inspection kinds remain explicit and do not silently render through the structured-document surface;
- the Inspection Window owns one coherent modal semantic/focus boundary encompassing both primary inspection content and the terminal footer;
- background Reservoir controls are inert while inspection is active; Escape closes; focus restores after ordinary close;
- the structured article is not used as a giant `aria-describedby` payload;
- synthetic inspection QA proves Artifact/non-Artifact renderer parity without adding fake production Resources.

### 4. Supporting-Resource Navigation

Implemented and merged:

- the common `InspectionWindow` resolves published supporting Resources from canonical Resource-support relationships;
- support entries preserve canonical Resource identity rather than duplicating Resource metadata into UI-specific records;
- unpublished relationships and unpublished targets are excluded;
- support ordering is deterministic;
- selecting a supporting Resource does not swap the current renderer in place;
- support selection retracts the current Inspection Window and delegates to the canonical direct Resource / Query Reservoir seam;
- support navigation does not promote Resources to Artifact status and does not mutate Collection membership;
- duplicate support-navigation requests are blocked once a handoff is pending;
- ordinary Inspection close preserves the current semantic Reservoir context and restores pre-inspection presentation.

### 5. Minimum Inspection Return Context

Implemented, corrected, reviewed, and merged:

- an Inspection-originated Resource detour captures a minimal `InspectionReturnFrame` rather than introducing a second navigation-history architecture;
- the frame preserves originating Resource ID, practical document `scrollY`, and proportional post-content/control-plane/footer reveal progress;
- Back restores the prior semantic Reservoir context before reselecting and reopening the originating Resource;
- reopened Inspection restores bounded practical reading position rather than promising pixel-perfect browser-history semantics;
- return frames are consumed exactly once after successful restoration;
- failed or abandoned paths discard ephemeral state;
- ordinary Query Reservoir Back/Home behavior remains unchanged when no Inspection return state exists;
- root-returning queries with an Inspection return frame expose Back because Back and Home are semantically distinct;
- Home remains an unconditional root return, discards Inspection return state, and does not reopen the prior Inspection;
- Collection detours launched from Inspection now reuse the same `InspectionReturnFrame` semantics through the specific Collection-history hop rather than global Collection identity;
- nested Collection traversal only reopens the Inspection when Back crosses the original Inspection-originated Collection boundary;
- current-Collection selection performs an ordinary Inspection close without creating a redundant return hop;
- return state does not promote Resources to Artifact status, mutate Collection membership, or duplicate semantic identity.

### Integrated Manual QA Deferral

The production registry does not yet contain the Bellabeat supporting-Resource graph required to exercise the complete Resource → supporting Resource → Back → reopened Inspection path manually.

Accordingly:

- this checkpoint is accepted on reviewed implementation plus synthetic/automated QA;
- do not add fake production Resources, memberships, or support relationships solely to expose this path manually;
- integrated manual QA of supporting-Resource navigation and Inspection return is deferred until Bellabeat and its approved supporting Resources are materialized in the production registry;
- Bellabeat integration QA must then exercise both Back restoration and Home discard behavior with real semantic content.

### 6. Polished Image Inspection + Shared Inspection Context Grammar

Implemented, refined, reviewed, and approved for merge:

- `inspectionKind: "image"` now resolves to a dedicated production image Inspection renderer rather than the former compatibility surface;
- canonical Resource → published Representation → Asset resolution is preserved, with deterministic representation ordering and compatible media-content fallback;
- invalid, missing, unpublished, wrong-kind, or browser-failed image payloads resolve to an explicit unavailable state rather than another renderer;
- alt text follows deterministic semantic fallback from Asset alt → resolved caption → Resource title;
- image rendering preserves intrinsic aspect ratio across portrait, landscape, square, SVG, and extreme ratios;
- the shared Inspection chassis now owns a universal three-column coordinate frame whose center column defines primary content placement independent of renderer width;
- structured-document-specific typography/layout selectors are scoped to structured documents rather than leaking onto other renderer roots;
- image viewing uses a centered, proportionally contained tonal field with no explicit border, radius, or stage shadow;
- image first-landing sizing is derived from the actual Inspection landing geometry rather than arbitrary full-viewport percentages;
- image painting is contained by its allocated layout box, so relationship/context content always stacks beneath the image instead of overlapping it;
- the atmosphere owns Resource identity and concise metadata; renderer bodies own the inspected content rather than duplicating identity chrome;
- the shared Inspection context tray exposes `Resources | Collections` beneath primary content;
- Resource and Collection entries use minimal semantic-object pills with icon + name only;
- Resource pills retain canonical Resource-query navigation and Inspection return semantics;
- Collection pills use canonical Collection navigation and preserve Inspection return ownership on the specific history hop;
- SourceRecord terminology remains distinct from Resource relationships;
- the shared close control is reduced to minimal X-only chrome and remains outside primary content geometry;
- Inspection minimum length now follows the visible remainder below its landing horizon plus actual content, instead of forcing a large synthetic second viewport;
- trailing space after final semantic content is reduced so terminal/footer reveal follows the content with only a modest buffer;
- synthetic Inspection validation covers image resolution/fallback, representation ordering, context availability, ontology invariants, and Collection-return semantics.

### 7. Preserved Query Reservoir Closure Baseline

The above work preserves the approved v0.6 Query Reservoir baseline:

- one active layout at rest;
- ephemeral transition plan;
- departure → neutral handoff → arrival;
- staying nodes stationary;
- leaving nodes sink;
- entering nodes emerge;
- quaternion preservation;
- existing zoom behavior;
- directional `returnContext`;
- Home to root;
- no Collection-membership mutation from queries.

---

## Remaining L2-Enabling Architecture

The Resource registry, direct Resource Query Reservoir seam, common Inspection Window, structured-document foundation, supporting-Resource navigation, minimum Inspection return context, and polished image Inspection surface are now complete.

### Immediate next pass — External-Link / Repository Inspection

The next bounded L2 implementation seam is the external-link / repository Inspection surface.

The pass should remain narrow and establish:

- production `external-link` Inspection dispatch through `inspectionKind` rather than Artifact status;
- canonical Resource identity with external URL/representation data treated as representation/presentation rather than a duplicate Resource;
- a restrained shared Inspection presentation consistent with the current grammar: atmosphere for identity/concise metadata, renderer for the inspected object, shared Resources/Collections context tray beneath;
- repository-aware presentation where Resource type/representation data identifies a repository, without creating a separate repository semantic system;
- explicit unavailable/invalid external-target handling;
- safe external navigation behavior and accessibility;
- preservation of close, footer, Resource/Collection context tray, return-context, reduced-motion, and Query Reservoir behavior;
- no Bellabeat ingestion unless separately authorized.

### Subsequent passes

After external-link / repository inspection is stable:

1. generic document/file/notebook fallback sufficient for Bellabeat;
2. Bellabeat Resource/supporting-Resource materialization and approved content population;
3. integrated manual QA of the now-real support-navigation / Inspection-return path.

The exact grouping of these subsequent items may be adjusted if implementation evidence shows a cleaner bounded pass, but do not collapse them into production ingestion/search infrastructure.

---

## Pinned Final-Refinement / Launch-Sweep Backlog

The following items are explicitly non-blocking for current L2 architecture and should not interrupt the next bounded implementation passes:

- **Inspection close X latency:** after Inspection is fully initialized, a single X activation now eventually fires but retains a noticeable delay; Escape is more responsive. Treat as a launch/regression bug-sweep item. Preserve existing close diagnostics so the eventual sweep can distinguish hit-testing/input delivery from transition acceptance rather than reopening this checkpoint by default.
- **Inspection backdrop entry opacity choreography:** the shared fixed backdrop is functionally stable and no longer remains stuck/opaque after closure; Inspection Window arrival position is approved; backdrop exit behavior is acceptable. Entry opacity can still appear to finish/jump near window settlement. Revisit during final launch polish/refinement.

Do not treat these pinned refinements as reasons to reopen completed Inspection/navigation architecture unless a functional regression appears.

---

## Still Explicitly Deferred

Do not treat the following as L2 prerequisites unless separately authorized:

- production ingestion/admin UI;
- database persistence;
- content hashing/deduplication engine;
- full-text or semantic search;
- Unassigned Resources inbox/query UI;
- final public URL routing;
- automated migration;
- polished video/audio/dataset renderers;
- automatic Artifact promotion;
- automatic Collection creation.

---

## Current Handoff Rule

For new L2 implementation branches, read this file after the ontology and Bellabeat manifest to distinguish conceptual requirements from already-completed runtime work.

Do not reimplement the Resource registry foundation, direct Resource Query Reservoir seam, common Inspection Window/structured-document foundation, supporting-Resource navigation, minimum Inspection return context, or polished image Inspection unless a reviewed defect specifically requires correction.

The current next-task seam is external-link / repository inspection.
