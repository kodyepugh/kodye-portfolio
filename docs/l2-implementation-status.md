# Digital Reservoir — L2 Implementation Status

**Status:** Active L2 implementation checkpoint  
**Updated:** August 19, 2026  
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
- the existing reservoir opening, recession, deployment, scrolling, footer reveal, close, reduced-motion, and reservoir-restoration choreography is preserved;
- the Inspection Window owns one coherent modal semantic/focus boundary encompassing both primary inspection content and the terminal footer;
- background Reservoir controls are inert while inspection is active; Escape closes; focus restores after close;
- the structured article is not used as a giant `aria-describedby` payload;
- a deferred support-region seam exists in the common chassis, but supporting-resource UI/navigation is not yet implemented;
- synthetic inspection QA proves Artifact/non-Artifact renderer parity without adding fake production Resources.

### 4. Preserved Query Reservoir Closure Baseline

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

The next implementation layer is supporting-Resource navigation from the common Inspection Window.

### Immediate next pass

Build the supporting-resource rail/brick interface and connect it to the already-approved direct Resource → Query Reservoir seam.

The pass should establish:

- supporting Resources resolved from canonical Resource support relationships;
- compact supporting-resource bricks/stack within the existing deferred Inspection Window support-region seam;
- relationship role/order/publication metadata reflected where useful;
- desktop placement compatible with the intended side rail and a bounded responsive/mobile treatment;
- selecting a supporting Resource retracts the current Inspection Window and issues a normal direct Resource query rather than swapping renderers in place;
- the requested Resource surfaces in a temporary Query Reservoir using the existing transition coordinator;
- no Artifact promotion or Collection-membership mutation from support navigation;
- no Bellabeat content ingestion yet unless separately authorized.

### Subsequent passes

After supporting-Resource navigation is stable:

1. minimum inspection-return context so Back can restore the prior inspected Object and practical reading position after a supporting-Resource detour;
2. polished image inspection;
3. external-link / repository inspection;
4. generic document/file/notebook fallback sufficient for Bellabeat;
5. Bellabeat Resource/supporting-Resource materialization and approved content population.

The exact grouping of these subsequent items may be adjusted if implementation evidence shows a cleaner bounded pass, but do not collapse them into production ingestion/search infrastructure.

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

Do not reimplement the Resource registry foundation, direct Resource Query Reservoir seam, or common Inspection Window/structured-document foundation unless a reviewed defect specifically requires correction.
