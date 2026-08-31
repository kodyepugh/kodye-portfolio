# Digital Reservoir Prototype Reuse Plan

**Status:** Phase 0 repository audit output  
**Version:** 0.1  
**Date:** 2026-08-31  
**Audited repository:** `kodyepugh/kodye-portfolio@main`  
**Implementation authorization:** None

## 1. Audit conclusion

The current repository is a completed public portfolio vertical slice with a mature ontology and unusually resolved interaction behavior.

It should not be “upgraded in place” into the prototype platform.

The appropriate reuse strategy is:

```text
preserve product grammar
+ extract bounded domain/geometry behavior
+ carry forward tests and invariants
+ reimplement platform ownership boundaries
- do not migrate portfolio-specific persistence assumptions
```

The strongest reusable work is not the page composition itself. It is:

- semantic distinctions;
- deterministic spatial algorithms;
- history and return behavior;
- type-driven Inspection;
- conventional Index equivalence;
- validation discipline;
- motion and interaction grammar.

The largest architectural liabilities for the new platform are:

- static authored registries;
- `published: boolean` as the access model;
- in-memory selectors as the data service;
- frontend scene ownership of semantic, route, browser, transition, and presentation state;
- portfolio-specific content and routing contracts;
- compatibility types that still use Artifact-oriented naming.

## 2. Audit basis

The audit reviewed the current canonical and implementation surfaces, including:

- `AGENTS.md`;
- `README.md`;
- `package.json`;
- `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`;
- `docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`;
- `docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`;
- `docs/l2-implementation-status.md`;
- `types/content.ts`;
- `types/reservoir.ts`;
- `content/digital-reservoir/*`;
- `content/reservoir/*`;
- `lib/content/registry.ts`;
- `lib/content/selectors.ts`;
- `lib/content/reservoir-adapter.ts`;
- `lib/content/validation.ts`;
- `lib/reservoir/history.ts`;
- `lib/reservoir/layout.ts`;
- `lib/public-routing.ts`;
- `components/reservoir/ReservoirScene.tsx`;
- `components/reservoir/ReservoirSphere.tsx`;
- `components/reservoir/InspectionWindow.tsx`;
- `components/navigation/ReservoirIndex.tsx`;
- repository validation scripts.

The public-release documentation identifies the current line as closed and accepted. Reuse therefore must avoid silently reopening or destabilizing it.

## 3. Reuse classifications

### A. Preserve as authoritative product grammar

These concepts should be copied into the new repository’s canonical documentation and contract tests, with attribution to their source paths.

| Current source | Preserve | Target treatment |
|---|---|---|
| Ontology addendum | `Object = Collection | Resource`; Artifact status; direct addressability; membership selectivity; Asset/Source roles; curatorial resolution | Becomes the foundation of the domain package and schema invariants |
| Interface specification | Collections/Queries/Inspection distinction; centered recursive Reservoir; progressive disclosure; conventional reading; accessibility | Becomes product and projection behavior, adjusted for three synchronized projections |
| Query/history rules | Visit-based history; Back/Home; Query ancestry; Inspection return; no geometry in semantic history | Generalize into Context Visit and Inspection Return contracts |
| Separation-of-concerns rules | content, semantics, geometry, presentation, state, transition, persistence | Enforced as repository boundaries and architecture review checks |
| Validation discipline | typecheck, lint, schema/content validation, build, runtime/visual QA | Expanded into CI, contract, security, policy, scale, and E2E evidence |

### B. Extract or adapt into reusable packages

These areas contain implementation logic that is likely worth porting after tests are isolated.

#### 3.1 Spatial math and layout

Candidate sources:

- `lib/reservoir/layout.ts`;
- `lib/reservoir/geometry.ts`;
- `lib/reservoir/frame.ts`;
- `lib/reservoir/node-sizing.ts`;
- `lib/reservoir/zoom.ts`;
- `lib/reservoir/label-geometry.ts`;
- `lib/reservoir/pointer.ts`.

Reusable value:

- deterministic normalized spherical placement;
- mesh-independent node positions;
- focused/distributed layout concepts;
- population-aware sizing;
- viewport/camera-safe zoom calculations;
- label placement and occlusion reasoning;
- pointer candidate resolution;
- stable quaternion/reference-frame calculations.

Required adaptation:

- accept `ContextManifest` summaries rather than portfolio `ReservoirContentNode`;
- support aggregate presentation nodes;
- include layout algorithm version in `stableLayoutKey`;
- separate spatial projection local state from active semantic context;
- add incremental-stability tests when context population changes;
- remove assumptions about one scene component owning all lifecycle state;
- benchmark and tune for bounded manifests rather than small authored Collections.

Reuse decision: **port through tests, not by copying the entire scene directory.**

#### 3.2 Semantic history and Inspection return

Candidate sources:

- `lib/reservoir/history.ts`;
- `lib/reservoir/inspection-return.ts`;
- `lib/reservoir/direct-resource-routing.ts`;
- `lib/reservoir/direct-resource-inspection-intent.ts`;
- selected browser transaction tests.

Reusable value:

- unique visit identity;
- Collection and Query visits in one ordered history;
- repeated visits remaining distinct;
- direct branch truncation;
- Home as stronger root reset;
- visit-specific Inspection reading state;
- semantic history independent from geometry.

Required adaptation:

- replace recursive frontend-only `ReservoirContext` payloads with persisted/serializable `ContextDescriptor` references;
- permit remote contexts;
- separate browser URL projection from semantic visit ownership;
- allow multiple clients or sessions without trusting local browser state as canonical;
- add policy revision and manifest revision handling;
- preserve history behavior as application-domain tests.

Reuse decision: **extract the state-machine semantics; reimplement persistence and browser integration.**

#### 3.3 Content and Inspection model

Candidate sources:

- structured-document types in `types/content.ts`;
- `lib/content/structured-document.ts`;
- Markdown structure adapter;
- image, external-link, notebook, and generic-file resolvers;
- `components/reservoir/InspectionWindow.tsx`;
- `InspectionWindowBody` and renderer components;
- `InspectionContextTray`;
- image viewer behavior;
- Inspection validation tests.

Reusable value:

- `inspectionKind` independent of Artifact status;
- one shared Inspection chassis;
- structured semantic blocks;
- explicit unsupported states;
- Resource context after primary content;
- conventional document scrolling;
- focus management and reduced-motion behavior;
- visit-specific reading restoration.

Required adaptation:

- load Inspection models through API contracts rather than static selectors;
- separate accepted relationships from pending assertions;
- expose version/provenance and representation capabilities;
- remove portfolio footer and brand-specific terminal behavior from the generic chassis;
- convert `published` filtering into policy-filtered server responses;
- preserve accessible focus and reading behavior through component tests.

Reuse decision: **adapt the renderer architecture and selected components; do not copy the portfolio terminal composition wholesale.**

#### 3.4 Index behavior

Candidate source:

- `components/navigation/ReservoirIndex.tsx`;
- relevant interface specification and accessibility tests.

Reusable value:

- semantic DOM projection of active context;
- focus restoration;
- explicit Object metadata;
- shared selection/navigation coordinator;
- Index as fallback to WebGL.

Required adaptation:

- make Index a primary horizontal Projection Sphere surface rather than a revealed bottom panel;
- support cursor pagination and virtualization;
- support authorized sort/filter/bulk curation;
- consume `ContextManifest`;
- retain a no-WebGL route;
- preserve exact reconciliation with permitted manifest Objects.

Reuse decision: **reuse semantics and accessibility patterns; redesign shell and data-loading behavior.**

#### 3.5 Content validation logic

Candidate sources:

- `lib/content/validation.ts`;
- `scripts/validate-content.cjs`;
- `scripts/validate-inspection.cjs`;
- `scripts/validate-public-routing.cjs`;
- `scripts/validate-label-geometry.mjs`.

Reusable value:

- duplicate ID/address detection;
- reserved namespace validation;
- dangling references;
- Collection cycle checks;
- Artifact-membership rules;
- representation and structured-document integrity;
- renderer/content compatibility;
- deterministic routing and geometry assertions.

Required adaptation:

- turn script-level duplicated logic into package-level domain and contract tests;
- run against database fixtures and APIs, not imported arrays;
- add policies, Versions, Assertions, remote references, agent grants, and Context Manifest invariants;
- retain deterministic synthetic fixtures.

Reuse decision: **port the invariant suite early and use it to protect the new domain model.**

### C. Use as reference; reimplement ownership

These areas are valuable behavior references but should not be migrated as structural foundations.

#### 3.6 `ReservoirScene.tsx`

Current value:

- integrated proof of rotation, zoom, layout switching, Collection/Query exchange, history, direct routing, Inspection, Index, footer, browser restoration, pointer handling, and diagnostics.

Why not port whole:

- the scene imports and coordinates semantic registry, selectors, public routes, browser history, Collection/Query state, Inspection, UI panels, and rendering;
- it represents the current vertical slice’s integration point;
- the target needs separate application services, Context Store, Projection Sphere shell, and projection adapters;
- porting it would preserve the assumption that the 3D client owns the world.

Target use:

- behavior reference;
- source of transition constants and diagnostics;
- regression oracle for selected interactions;
- component-by-component extraction only after the target contracts exist.

Reuse decision: **do not copy as the target shell.**

#### 3.7 `ReservoirSphere.tsx` and node components

Current value:

- mature WebGL surface, node, selection, pulse, transition, and performance behavior.

Why not port whole:

- large prop surface reflects scene-specific state ownership;
- current node contracts depend on portfolio adapters;
- target Spatial Projection must support aggregate nodes and streamed manifest revisions;
- projection lifecycle includes suspend/resume during horizontal sphere rotation.

Target use:

- extract surface material, node renderers, and local animation primitives behind new adapter contracts;
- replace portfolio Resources/Collections with generic Spatial Display Nodes.

Reuse decision: **selective component salvage after the Projection Adapter contract is implemented.**

#### 3.8 Public routing and browser transaction layer

Candidate sources:

- `lib/public-routing.ts`;
- `lib/public-route-history.ts`;
- dynamic route components;
- routing validation scripts.

Current value:

- direct Object routes;
- contextual membership routes;
- Query route distinction;
- browser Back/Forward and refresh behavior.

Why not port whole:

- target identity, auth, workspace, private routes, remote contexts, and multi-client history differ materially;
- current resolution trusts static selectors and publication state;
- platform URL design should project canonical addresses without defining them.

Target use:

- preserve direct-address and browser recoverability test cases;
- implement new route adapters over application Context Visits.

Reuse decision: **reuse tests and semantics, not the portfolio router implementation.**

### D. Leave in the portfolio repository

These should not migrate into the new platform baseline.

| Current area | Reason |
|---|---|
| `content/digital-reservoir/*` authored portfolio data | Seed inspiration only; not a persistence mechanism |
| `content/reservoir/*` compatibility content | Historical/portfolio compatibility, not target domain |
| Bellabeat-specific Resources, assets, and manifests | May later become opt-in demo data; should not define generic architecture |
| Contact delivery and Resend integration | Portfolio feature, unrelated to core prototype |
| Kodye-specific footer, social links, metadata, and SEO | Public-site behavior, not platform core |
| Production launch audit/roadmap | Historical evidence for the portfolio, not prototype sequencing |
| Portfolio brand symbol as mandatory shell identity | The product needs tenant/owner theming; the symbol may remain for Kodye’s reservoir |
| Current `published` flags as policy | Too coarse for private/workspace/public and agent grants |
| Artifact compatibility aliases as new public API | Preserve only behind adapters during migration, then retire |

## 4. Detailed migration map

### 4.1 Domain types

Current:

- `types/content.ts` contains Resources, Collections, Memberships, Representations, support relationships, Assets, SourceRecords, structured blocks, and Artifact aliases.

Target:

- split into versioned packages:
  - `objects`;
  - `resources`;
  - `versions`;
  - `representations`;
  - `collections`;
  - `relationships`;
  - `assertions`;
  - `policies`;
  - `contexts`;
  - `federation`.

Migration action:

1. copy no type unchanged;
2. create new contracts from `interface-contracts.md`;
3. write mapping fixtures from current types to target types;
4. preserve ontology invariants in tests;
5. use compatibility adapters only for optional portfolio demo import.

### 4.2 Registry and selectors

Current:

- `lib/content/registry.ts` imports authored arrays;
- `selectors.ts` builds in-memory maps and filters by `published`.

Target:

- repository interfaces backed by PostgreSQL;
- application services for address resolution, Collection membership, relationships, and representations;
- policy-filtered queries;
- explicit pagination and Context Manifest construction.

Migration action:

- convert selector expectations into repository contract tests;
- do not create a global in-memory catalog as source of truth;
- use caches only as derived optimizations.

### 4.3 Resource adapter

Current:

- `reservoir-adapter.ts` converts canonical portfolio Resources/Collections into renderable nodes.

Target:

- Context Engine emits `ContextObjectSummary`;
- each Projection Adapter derives projection-specific display state;
- aggregate nodes are explicitly non-semantic.

Migration action:

- preserve the adapter concept;
- replace direct registry access with manifest input;
- ensure all three projections derive from the same manifest revision.

### 4.4 Relationships

Current:

- Resource relationships are limited to `supporting | source | provenance`;
- incoming/outgoing context is resolved for Inspection.

Target:

- typed relationship families;
- assertion/review status;
- evidence;
- policy;
- federation;
- bundle/aggregation support.

Migration action:

- map existing support edges into accepted semantic/provenance relationships;
- preserve membership as a separate entity;
- expand without making relation type control layout automatically.

### 4.5 Projection and interaction

Current:

- Spatial Reservoir plus a revealed Index;
- relationship context appears primarily in Inspection;
- no standalone Relational Projection.

Target:

- Projection Sphere shell;
- three primary synchronized projections;
- Inspection remains above the shell;
- one shared attention and navigation coordinator.

Migration action:

- extract proven Spatial behavior only after shell/state contracts are stable;
- recompose Index as a projection;
- implement Relational Projection from relationship contracts, not from WebGL node edges in the existing scene.

## 5. Reuse sequence

### Step 1 — Freeze reference baseline

Record:

- source commit SHA;
- relevant file list;
- current validation commands;
- accepted screenshots or interaction recordings where available.

No code extraction occurs before this baseline exists.

### Step 2 — Port invariants before features

Create target tests for:

- Object identity;
- Artifact status;
- membership;
- direct Resource/Collection address behavior;
- Query context;
- history;
- Inspection kind;
- deterministic layout;
- Index/context equivalence.

These tests prevent reuse from becoming visual imitation without semantic fidelity.

### Step 3 — Build new contracts and repositories

Implement target domain contracts and persistence independently.

Only after the new services return valid Context Manifests should frontend extraction begin.

### Step 4 — Reuse pure algorithms

Port and test:

- spherical directions;
- deterministic seeding;
- sizing;
- frame/zoom math;
- label geometry;
- history transition functions where contracts align.

Keep source attribution in commit history and documentation.

### Step 5 — Adapt Inspection and Index

Move accessible UI behavior onto API-backed models.

Remove portfolio brand/content assumptions during adaptation.

### Step 6 — Rebuild the Spatial Projection shell

Use new projection contracts and selectively adapt surface/node components.

Do not wrap the current `ReservoirScene` and call it the new architecture.

### Step 7 — Add Relational Projection

Build against typed, policy-filtered relationship manifests.

Do not derive relationship truth from spatial proximity.

### Step 8 — Optional portfolio demo import

After the prototype is stable, a one-way importer may map selected current portfolio content into a demo workspace.

This is not required for the core prototype and must not couple the platform to authored TypeScript files.

## 6. Risks and controls

| Risk | Consequence | Control |
|---|---|---|
| Copying `ReservoirScene` early | Frontend continues to own context, routing, and platform state | Implement Context Engine and Projection Adapter tests first |
| Treating current registry as starter database | Static assumptions leak into persistence and access | Build repository interfaces and migrations from new contracts |
| Reusing `published` checks | Private or agent data leaks through projections/derived content | Central policy service; server-side manifest filtering |
| Preserving Artifact terminology in all APIs | Artifact becomes a peer entity again | Domain tests enforce Resource + status |
| Reusing browser history as semantic truth | Multi-client/session behavior becomes fragile | Context Visits owned by application; browser is a projection |
| Porting motion without interaction contracts | Three projections feel like unrelated screens | Gate 1 validates shell before feature depth |
| Mapping all current edges into one generic graph | Membership/provenance semantics blur | Separate relationship families and Collection Membership |
| Extracting components before tests | Visual parity hides semantic regressions | Port invariant and behavior tests first |
| Overfitting to Bellabeat | Prototype becomes another curated demo | Use mixed representative corpus and synthetic scale fixtures |
| Premature microservices | Coordination and deployment cost overwhelms prototype | Modular monolith + workers until measured need |
| Parallel agents touching shared types | Contract drift and merge conflicts | Contract ownership, isolated worktrees, integration gates |

## 7. Reuse definition of done

Reuse is complete when:

- every ported unit has a source mapping;
- target tests establish equivalent or intentionally revised behavior;
- no target service imports current portfolio content arrays;
- no permission decision relies on `published: boolean`;
- the Projection Sphere consumes Context Manifests rather than selectors;
- the live portfolio remains unchanged;
- adapted components have removed portfolio-only dependencies;
- deviations from current behavior are documented as approved target changes.

## 8. Final recommendation

Use the current repository as a **reference implementation and test mine**, not as the platform base.

The product has already discovered the difficult nouns, interaction distinctions, and spatial grammar. The prototype should preserve those gains while moving ownership of identity, policy, context, ingestion, and agent access beneath the interface.
