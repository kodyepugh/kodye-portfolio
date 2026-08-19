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
- selection state is Resource-native while existing Artifact second-click opening behavior remains intact;
- non-Artifact Resource second selection is intentionally deferred pending the Inspection Window implementation;
- Query Reservoir Back/Home and context-local state restoration remain unchanged;
- Resource atmosphere metadata and diagnostics are status-aware;
- non-Artifact Resources are not falsely reported as Artifacts in query-node, adaptive-zoom, or traversal diagnostics;
- synthetic QA covers non-Artifact Resource adaptation without adding fake production content.

### 3. Preserved Query Reservoir Closure Baseline

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

The next implementation layer is the Inspection system.

### Immediate next pass

Build the common Inspection Window chassis and the structured-document inspection surface.

The pass should establish:

- one common Inspection Window chassis rather than Artifact-only modal architecture;
- inspection target driven by Resource identity and `inspectionKind`;
- existing Artifact opening migrated through that common chassis without changing interaction choreography;
- structured-document rendering from reusable ordered content blocks;
- preservation of the existing reading-window entrance/close/restoration behavior where compatible;
- no Bellabeat content ingestion yet unless explicitly authorized in a later pass.

### Subsequent passes

After the chassis and structured-document surface are stable:

1. image inspection;
2. external-link / repository inspection;
3. generic document/file/notebook fallback sufficient for Bellabeat;
4. supporting-resource brick/stack rail;
5. supporting Resource → direct Query Reservoir handoff from an open inspection surface;
6. minimum inspection-return context so Back can restore the prior inspected Object and reading position;
7. Bellabeat Resource/supporting-Resource materialization and approved content population.

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

Do not reimplement the Resource registry foundation or direct Resource Query Reservoir seam unless a reviewed defect specifically requires correction.
