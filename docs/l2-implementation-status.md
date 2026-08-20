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
- the existing image Artifact has a narrow image-compatibility inspection surface while polished image inspection remains deferred;
- unsupported inspection kinds remain explicit and do not silently render through the structured-document surface;
- the Inspection Window owns one coherent modal semantic/focus boundary encompassing both primary inspection content and the terminal footer;
- background Reservoir controls are inert while inspection is active; Escape closes; focus restores after ordinary close;
- the structured article is not used as a giant `aria-describedby` payload;
- synthetic inspection QA proves Artifact/non-Artifact renderer parity without adding fake production Resources.

### 4. Supporting-Resource Rail + Resource → Resource Navigation

Implemented and merged:

- the common `InspectionWindow` resolves published supporting Resources from canonical Resource-support relationships;
- support entries preserve canonical Resource identity rather than duplicating Resource metadata into UI-specific records;
- unpublished relationships and unpublished targets are excluded from the public support rail;
- support ordering is deterministic and relationship metadata can surface role/label/type/order where useful;
- Resources with no public support relationships reserve no empty rail column;
- desktop inspection uses a compact secondary support rail, with a bounded responsive stacked treatment at narrower widths;
- support entries remain real accessible buttons and are actionable only while the Inspection Window is in its reading phase;
- support-rail geometry remains stable through deploy/read/close so the reading body does not reflow at phase boundaries;
- duplicate support-navigation requests are blocked once a handoff is pending;
- selecting a supporting Resource does not swap the current renderer in place;
- support selection retracts the current Inspection Window and delegates to the existing canonical `requestDirectResource()` / Query Reservoir seam;
- the target Resource surfaces through the existing temporary Query Reservoir coordinator, preserving canonical focal placement and selection behavior;
- support navigation does not promote Resources to Artifact status and does not mutate Collection membership;
- ordinary Inspection close preserves the current Collection/Query Reservoir context and restores the pre-inspection Reservoir presentation;
- Inspection close/recovery lifecycle hardening prevents the previous full-viewport focus-ring regression and removes the earlier opaque-backdrop stuck/black-screen failure mode;
- the shared Inspection Window owns one fixed presentation-only backdrop that fades independently of window translation and does not own navigation/recovery state;
- the approved Inspection Window arrival position is dynamically tied to measured atmosphere height with the current compact header/content spacing relationship.

### 5. Minimum Inspection Return Context

Implemented, corrected, reviewed, and merged:

- an Inspection-originated support Resource detour captures a minimal `InspectionReturnFrame` rather than introducing a second navigation-history architecture;
- the return frame preserves the originating Resource ID, practical document `scrollY`, and proportional post-content/control-plane/footer reveal progress;
- return frames are associated with the specific temporary support-query Reservoir context rather than stored as general Resource metadata;
- Back from a support Resource detour first uses the existing directional Query Reservoir transition to restore the prior semantic Reservoir context;
- after the returned Reservoir context is fully settled, the originating Resource is reselected and reopened through the normal Resource Inspection path;
- the reopened Inspection restores a bounded practical reading position and proportional terminal-layer reveal state rather than promising pixel-perfect browser-history semantics;
- return frames are consumed exactly once after a successful restoration;
- failed or abandoned return paths discard their ephemeral frame rather than leaving stale navigation state;
- ordinary Query Reservoirs that did not originate from an Inspection preserve their prior Back/Home behavior;
- ordinary root-returning queries continue to hide Back when Home is semantically equivalent;
- a root-returning query that owns a valid Inspection return frame explicitly shows Back because Back and Home are then semantically distinct;
- Home remains an unconditional return to the root Reservoir, discards Inspection return state, and does not reopen the previous Inspection;
- nested Query Reservoir return chains remain supported without expanding the canonical `ReservoirContext` model;
- Inspection return state does not promote Resources to Artifact status, alter Collection membership, or duplicate Resource identity;
- synthetic Inspection QA covers root/non-root Back visibility, frame ownership, bounded reading-state restoration, Home discard, failed-query cleanup, one-time consumption, and ontology preservation.

### Integrated Manual QA Deferral

The production registry does not yet contain the Bellabeat supporting-Resource graph required to exercise the complete Resource → supporting Resource → Back → reopened Inspection path manually.

Accordingly:

- this checkpoint is accepted on reviewed implementation plus synthetic/automated QA;
- do not add fake production Resources, memberships, or support relationships solely to expose this path manually;
- integrated manual QA of supporting-Resource navigation and Inspection return is deferred until Bellabeat and its approved supporting Resources are materialized in the production registry;
- Bellabeat integration QA must then exercise both Back restoration and Home discard behavior with real semantic content.

### 6. Preserved Query Reservoir Closure Baseline

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

The Resource registry, direct Resource Query Reservoir seam, common Inspection Window, structured-document foundation, supporting-Resource navigation, and minimum Inspection return context are now implemented on `main`.

### Immediate next pass — Polished Image Inspection

The next bounded L2 implementation seam is the polished image Inspection surface already anticipated by the common `InspectionWindow` architecture.

The pass should remain narrow and establish:

- a production-quality image inspection renderer selected through `inspectionKind` rather than Artifact status;
- canonical Resource/representation identity preservation;
- appropriate image sizing, containment, aspect-ratio behavior, alt text, and responsive presentation inside the shared Inspection chassis;
- compatibility with existing close, footer, support-resource rail, reduced-motion, and return-context behavior;
- explicit handling of missing or invalid image representations without silently falling back to an unrelated renderer;
- no duplicate image Resource identity for multiple representations;
- no Bellabeat content ingestion unless separately authorized.

### Subsequent passes

After polished image inspection is stable:

1. external-link / repository inspection;
2. generic document/file/notebook fallback sufficient for Bellabeat;
3. Bellabeat Resource/supporting-Resource materialization and approved content population;
4. integrated manual QA of the now-real support-navigation / Inspection-return path.

The exact grouping of these subsequent items may be adjusted if implementation evidence shows a cleaner bounded pass, but do not collapse them into production ingestion/search infrastructure.

---

## Pinned Final-Refinement Backlog

The following item is explicitly non-blocking for the current L2 architecture and should not interrupt the next implementation passes:

- **Inspection backdrop entry opacity choreography:** the shared fixed backdrop is functionally stable and no longer remains stuck/opaque after closure; Inspection Window arrival position is approved; backdrop exit behavior is acceptable. The remaining visual issue is that entry opacity can still appear to finish/jump near window settlement rather than manifesting with the desired perceptual relationship to window arrival. Revisit during final launch-polish/refinement rather than continuing architecture work now.

Do not treat this pinned visual refinement as a reason to reopen completed Inspection/navigation architecture unless a functional regression appears.

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

Do not reimplement the Resource registry foundation, direct Resource Query Reservoir seam, common Inspection Window/structured-document foundation, supporting-Resource navigation, or minimum Inspection return context unless a reviewed defect specifically requires correction.

The current next-task seam is polished image inspection.
