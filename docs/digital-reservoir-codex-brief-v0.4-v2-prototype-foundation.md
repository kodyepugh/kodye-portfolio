# Digital Reservoir
## Codex Implementation Brief
**Version:** 0.7 — Public Launch Implementation Alignment
**Status:** Persistent Developer Reference — V2/L2 foundation stable / public-launch preparation
**Project:** kodyepugh.com
**Primary references:** `docs/release-preparation-roadmap.md`, `docs/l2-implementation-status.md`, `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`, and the Interface Specification

---

# 1. Purpose

This document defines how Codex should interpret and implement the Digital Reservoir project.

It is not the design specification.

The design specification defines:

- what the interface is;
- how it should behave;
- what the user experience should feel like;
- which interaction principles are foundational.

This brief defines:

- how implementation work should be approached;
- how the repository should be organized;
- what architectural boundaries should be preserved;
- how Codex should scope tasks;
- what Codex should not assume;
- how implementation should remain aligned with the specification.

Codex should treat this file as a persistent operational reference.

---

# 2. Source-of-Truth Responsibilities

Do not treat one project document as overriding all others outside its domain.

Use these authorities:

1. **Explicit current user/task instruction** — highest authority for scope and direction.
2. **`docs/release-preparation-roadmap.md`** — sequencing, launch priorities, blockers, and deferred work.
3. **`docs/l2-implementation-status.md`** — what is implemented, accepted, and still technically open.
4. **`docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md`** — semantic Object/Resource/Collection/Artifact-status rules, addressability, memberships, relationships, and inspection semantics.
5. **Interface Specification** — accepted interaction, visual, spatial, accessibility, and experience behavior.
6. **This Codex Implementation Brief** — implementation discipline and historical technical context.
7. **Bellabeat manifest** — Bellabeat content/provenance/curatorial authority when Bellabeat is in scope.
8. **Closeout documents** — accepted evidence for their bounded completed passes.
9. **Current code and validation output** — runtime truth; reconcile documentation when behavior and docs diverge.

If two authorities appear to conflict, identify the domain of the conflict before changing architecture.

Do not use historical "next step" language in this brief or an older closeout to override the current release roadmap.

---

# 3. Core Project Principle

The Digital Reservoir is a spatial interface layered over semantic, conventional web content.

Implementation must preserve the distinction between:

```text
CONTENT
what exists

SEMANTICS
what an object means

GEOMETRY
where it appears spatially

PRESENTATION
how it looks

STATE
what the system is doing

TRANSITION
how one state becomes another
```

Do not collapse these concerns into one component or one data structure without a compelling reason.

## 3.1 Approved Runtime Contract

The Query Reservoir feature branch is closed for this development phase. Future Codex work should treat the following as baseline rules, not optional experiments:

- one authoritative `activeLayout` at rest;
- one ephemeral `transitionPlan` during a transition, then `null` again on completion;
- semantic history is separate from geometry and must not depend on persistent reusable geometry snapshots;
- collection and query changes share the same exchange choreography: departure → semantic handoff → arrival;
- `returnContext` defines directional query ancestry, `Back` follows that ancestry, and query chains must not form reciprocal loops;
- `Home` always returns to the root reservoir;
- a direct single-result Query Reservoir uses the canonical viewport-relative focal anchor regardless of the global Distributed / Focused preference;
- query filter ownership is context-local, so a fresh Query Reservoir starts at `All` unless its own context is being restored;
- staying nodes remain stationary; leaving nodes sink; entering nodes emerge; failed filters produce the red reservoir response rather than mutating state;
- direct artifact Query Reservoirs auto-select on arrival, but the Inspection Window still requires a second click to open;
- preserved quaternion / zoom behavior continues through exchange, but no historical geometry-restoration hierarchy should be reintroduced.

---

# 4. Current Technology Baseline

Current project stack:

- Next.js
- React
- TypeScript
- Git
- GitHub
- Vercel

Expected likely 3D tooling:

- Three.js
- React Three Fiber
- Drei where useful

Animation tooling may be introduced only when justified by the implementation task.

Do not install multiple overlapping animation libraries by default.

Prefer the smallest toolset that cleanly supports the required behavior.

---

# 5. Implementation Philosophy

Codex should favor:

- explicit state;
- reusable components;
- modular geometry;
- semantic HTML;
- progressive enhancement;
- small implementation steps;
- clear separation between visual experiment and production architecture;
- reversible decisions during prototyping;
- direct readability over clever abstraction.

Avoid:

- premature overengineering;
- monolithic scene components;
- hard-coded content inside animation logic;
- unnecessary global state;
- installing libraries before need is established;
- speculative future infrastructure;
- implementing later-phase features without instruction.

---

# 6. Do Not Build Ahead

The project contains a large long-term vision.

Codex must not interpret the V2 architecture as authorization to build all potential consequences of it.

Unless directly instructed, do not implement:

- semantic embeddings;
- automatic semantic clustering;
- relationship visualization;
- timeline views;
- account systems;
- production CMS/database migration;
- automated ingestion/admin systems;
- semantic zoom aggregation beyond the requested V2 foundation;
- visible structural topology/grid unless explicitly reauthorized by a later design decision;
- search-driven spatial reorganization;
- speculative multiplayer or collaboration systems;
- complex mobile-specific layouts beyond what is needed to keep the architecture viable.

V2 does authorize the spatial substrate required for dynamic node layout, continuous spherical positions, centered scale-based zoom, a clean continuous reservoir surface, and active/destination collection transitions.

# 7. Development Phase

Historical milestones M1–M5 and V2.1–V2.6 established the interaction and spatial substrate.

The following are now accepted foundation, not active implementation milestones:

- centered reservoir;
- scale-based zoom;
- continuous spherical layout;
- population-aware node sizing/spacing;
- adaptive inspectability and dynamic labels;
- Distributed / Focused layout modes;
- Active + Destination collection transitions;
- Query Reservoir closure baseline;
- Resource/Collection semantic registry;
- Resource-oriented Inspection Window;
- structured-document, image, and external-link/repository Inspection;
- supporting-Resource navigation;
- minimum Inspection return context;
- Bellabeat initial materialization.

### Current phase — Public Launch Preparation

Current work is sequenced by `docs/release-preparation-roadmap.md`.

The five current launch stages are:

```text
1. Portfolio Content Cut
2. Public Web Layer
3. Integrated Reservoir QA
4. Responsive + Accessibility + Regression Sweep
5. Production Release
```

Do not automatically continue into the next conceptually interesting renderer, ingestion system, or product capability.

The launch portfolio takes priority over further Digital Reservoir product expansion unless an approved launch Resource requires that capability.

### L1 / Query Reservoir closure

L1 Release-Candidate QA and the Query Reservoir closure baseline remain accepted regression references.

Do not reintroduce historical camera-path, reciprocal query ancestry, physical collection-slot, or mesh-semantic architecture.

---

# 8. Current Implementation Goal

The current goal is to **ship the first credible public portfolio release of the Digital Reservoir**.

The implementation should preserve the accepted spatial/semantic foundation while completing the bounded launch work defined by the release roadmap.

The system should already be treated as:

```text
PERSISTENT CENTERED RESERVOIR
+
SEMANTIC COLLECTION / QUERY CONTEXT
+
RESOURCE-ORIENTED INSPECTION
+
CONVENTIONAL PUBLIC WEB ACCESS
```

The highest-priority implementation work is no longer substrate invention.

Current tasks should generally fall into one of these categories:

- finishing approved professional content;
- exposing that content through real public destinations and direct addresses;
- correcting reproducible launch regressions;
- responsive/accessibility validation and fixes;
- production release validation/packaging.

Do not reopen accepted architecture merely because a launch task touches it.

---

# 9. Suggested Repository Boundaries

Recommended conceptual structure:

```text
app/
  layout.tsx
  page.tsx

components/
  reservoir/
    ReservoirScene.tsx
    ReservoirSphere.tsx
    ReservoirSurface.tsx
    ArtifactNode.tsx
    CollectionNode.tsx
    NodeLabel.tsx

  artifact/
    InspectionWindow.tsx
    ArtifactRenderer.tsx

  navigation/
    BottomControlPlane.tsx
    ReservoirMenu.tsx
    Footer.tsx

  environment/
    ReservoirEnvironment.tsx

content/
  artifacts/
  collections/

lib/
  reservoir/
    geometry.ts
    state.ts
    transitions.ts
    placement.ts

types/
  artifact.ts
  collection.ts
  reservoir.ts

docs/
  digital-reservoir-interface-spec.md
  digital-reservoir-codex-brief.md
```

This is guidance, not a rigid requirement.

Codex should preserve existing repository conventions where they are already sound.

---

# 10. Component Responsibility Rules

## ReservoirScene

Responsible for:

- scene orchestration;
- stable camera setup;
- centered 3D composition;
- lights;
- coordinating reservoir input;
- passing zoom/orientation state to geometry and presentation systems.

Should not own node-placement algorithms inline.

## ReservoirSphere

Responsible for:

- active sphere transform;
- centered scale behavior;
- orientation transform;
- overall material / darkened states;
- projection onto the current reservoir radius without depending on render-mesh vertices.

It should not use camera distance as the canonical zoom state.

## Reservoir Surface / Sphere Geometry

Responsible for:

- rendering the continuous sphere surface;
- providing sufficient curvature/depth cues through restrained material and lighting;
- keeping render-mesh tessellation an implementation detail;
- allowing sphere geometry complexity to change for performance without changing node identity or layout.

Do not render the V1 triangular/geodesic grid as a default interface layer.

The sphere mesh must not be the source of truth for artifact identity or permanent node placement.

## Layout Engine

Conceptual responsibility:

- inspect current collection population;
- generate deterministic continuous spherical positions;
- enforce minimum spacing / distribution constraints;
- preserve positions independently from render-mesh vertex indexing;
- optionally score a useful initial orientation.

Recommended location:

```text
lib/reservoir/layout.ts
```

Exact file organization may follow repository conventions.

## ArtifactNode / CollectionNode

Responsible for node representation and local interaction state.

Their rendered position should come from continuous spherical layout state rather than permanent render-mesh vertex IDs.

## AtmosphereContent

Responsible for Home vs selected-artifact metadata presentation.

Must compose around the centered reservoir without becoming the reason the sphere is vertically displaced.

## InspectionWindow

Responsible for conventional 2D artifact content, opening, scrolling, closing, and bottom-panel reveal behavior.

Artifact reading remains independent from reservoir zoom.

## BottomControlPlane / Menu / Footer

Responsible for stable UI-space navigation and controls.

They must not encode camera-path progress or physical collection-slot state.

# 11. State Architecture

Prefer explicit state over inferred scene conditions.

V2 state should make the following independent concepts obvious:

```typescript
type TransitionState =
  | "idle"
  | "selected"
  | "openingArtifact"
  | "readingArtifact"
  | "closingArtifact"
  | "changingCollection";

interface ReservoirState {
  currentCollectionId: string;
  collectionHistory: string[];

  focusedNodeId: string | null;
  selectedArtifactId: string | null;

  orientation: [number, number, number, number];
  zoomLevel: number;

  layoutKey: string;

  menuOpen: boolean;
  footerVisible: boolean;
  contentOpen: boolean;

  transitionState: TransitionState;
}
```

Exact shape may differ.

Critical rules:

- do not store camera-path progress as zoom;
- do not infer collection direction from physical sphere slots;
- do not bind node identity to render-mesh vertex indices;
- keep layout state separable from render-mesh implementation details;
- keep UI-space states independent from 3D transition state where practical.

# 12. Independent State Requirement

Some visual states must remain independent.

Most importantly:

```text
menuOpen
```

and:

```text
footerVisible
```

must not be treated as mutually exclusive states.

This allows:

```text
HEADER
MENU
FOOTER
```

and later:

```text
HEADER
FOOTER
```

without incorrectly resetting the user's position.

---

# 13. Geometry Rules

V2 geometry is governed by four independent concepts:

```text
SEMANTIC MEMBERSHIP
what nodes belong to the active collection

LAYOUT
where nodes live in continuous spherical space

SURFACE RENDERING
how the continuous sphere is visually expressed

TRANSFORM
how the centered reservoir is oriented and scaled
```

### Node position

Do not store permanent render-mesh vertex IDs as the foundational placement model.

Preferred generated layout representation:

```typescript
type ReservoirPosition = {
  direction: [number, number, number];
};
```

The direction is normalized and may be projected to the current reservoir radius.

### Starting layout

The layout engine should derive stable positions from:

- collection membership;
- node count;
- spacing requirements;
- deterministic seed/configuration;
- future optional semantic weights.

### Surface rendering

V2 allows a dense triangular surface pattern as a presentation-only layer. The sphere should still read as a continuous surface.

The underlying mesh may use whatever tessellation is appropriate for appearance and performance, but mesh vertices/faces have no semantic role and must not own node identity or placement.

Use restrained shading/material cues to preserve curvature and orientation during rotation. If the sphere becomes perceptually ambiguous at sparse densities, improve those cues rather than treating the pattern as semantic topology.

### Centering

Reservoir center should be derived from the usable 3D frame and remain stable through ordinary rotation, zoom, and collection transitions.

# 14. Resource / Artifact-Status Data Rules

Keep semantic Resource data independent from generated spatial presentation.

Canonical persistent semantic Objects are:

```text
Object
├── Collection
└── Resource
```

Artifact is reversible curatorial status on a Resource rather than a peer entity class.

Conceptually:

```typescript
interface Resource {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  resourceType: string;
  inspectionKind: string;
  isArtifact: boolean;
  published: boolean;
}
```

Collection participation is expressed through Membership records.

Representations, support relationships, and provenance records must not create duplicate Resource identity.

Generated reservoir layout should be stored separately or derived deterministically.

If legacy Artifact-oriented selectors or components remain for compatibility, isolate them behind adapters and do not extend the old semantic assumption.

# 14.1 Current Product Entity Boundaries

Do not architect the frontend as though all future system concerns are fields on `Artifact`.

Current semantic boundaries are:

```text
RESOURCE
stable addressable content-bearing Object

ARTIFACT STATUS
reversible Resource curation status

COLLECTION
persistent curated Object

MEMBERSHIP
Collection → Collection or Artifact-status Resource

REPRESENTATION
one form of a Resource, not a duplicate Resource

SUPPORT RELATIONSHIP
Resource → Resource discovery/support relation

SOURCE / PROVENANCE
relationship or implementation record describing origin/evidence
```

Future database schemas, migration pipelines, hashing, deduplication, synchronization, cloud connectors, automated classification, and production ingestion remain deferred unless explicitly tasked.

---

# 15. Interaction Mode Separation

Reservoir and artifact-reading input remain distinct.

## Reservoir mode

```text
drag / swipe    rotate centered reservoir
wheel / pinch   change reservoir zoom / scale
hover           focus
first select    inspect artifact / select collection according to object type
second artifact select
                open selected artifact
```

Wheel/pinch must not trigger camera dive behavior.

## Artifact mode

```text
wheel / trackpad   conventional document scroll
pointer            normal content interaction
close / Escape     exit artifact
```

Reservoir scale input is disabled while artifact content owns scrolling.

## Collection transition

Collection selection supplies a destination semantic collection.

The transition coordinator may animate current nodes out and destination nodes in while preserving the same fixed reservoir frame and continuous sphere surface. It should not require separate physical ancestor/child sphere slots or camera travel through them.

# 16. State Preservation

Preserve the user's meaningful spatial context rather than obsolete camera-path state.

Per active collection, preserve where appropriate:

- orientation;
- zoom level;
- generated layout key / seed;
- stable node spherical positions;
- selected artifact;
- navigation history.

When an artifact opens and closes, restore the same orientation and zoom.

Node identity and generated spherical position must remain independent from the sphere render mesh. Zoom must not rebuild or redefine node positions.

When changing collections, semantic history should remain authoritative. Physical scene-slot history is not required.

# 17. Motion Rules

All major motion should have semantic meaning.

Codex should ask of every noticeable animation:

> What state change is this communicating?

Preferred motion classes:

```text
Spatial
Mechanical
Ambient
```

Avoid arbitrary animation.

---

# 18. Orb Activation Requirements

The previous orb-to-symbol activation model is **retired from the current artifact-opening specification**.

Do not implement:

- orb extraction from its vertex;
- cross-space orb transfer;
- orb arrival at the Kodye Pugh symbol;
- center-circle replacement or retraction;
- automatic camera/sphere alignment to the symbol;
- ensō activation tied to artifact opening.

Current artifact opening is instead segmented as:

## Selection / inspection

First selection keeps the artifact on the reservoir and swaps the atmosphere to detailed artifact metadata.

## Confirmation

While directly hovering an already-selected orb, apply a gentle pulsing white glow. A second selection of that same artifact confirms opening.

## Reservoir recession

On confirmation:

- nodes sink into the sphere;
- sphere darkens / recedes;
- reservoir input disables.

## Deployment

The artifact content window rises from below the viewport and becomes the primary conventional reading surface.

# 19. Exit Requirements

Artifact exit should be direct rather than a reversal of an orb-transfer sequence.

Expected conceptual order:

```text
close control
↓
Inspection Window retracts below viewport
↓
sphere visual state restores
+
nodes rise back to surface
↓
reservoir input restores
↓
return to selected artifact state
+
selected metadata returns to atmosphere
```

Sphere orientation and zoom must remain unchanged.

The opened artifact should remain selected after close unless a future task explicitly changes this behavior.

# 20. Animation Implementation

Prefer animation orchestration that is:

- deterministic;
- interruptible where appropriate;
- tied to application state;
- easy to tune.

Do not scatter unrelated animation calls across many components.

Where possible, centralize transition coordination.

Potential choices may include:

- R3F frame interpolation;
- GSAP timeline;
- Motion;
- React Spring.

Choose one based on actual need.

Do not install all of them.

---

# 21. 3D Rendering Discipline

Avoid unnecessary rendering cost.

V2 adds specific geometry discipline:

Prefer:

- one stable reusable sphere geometry for the prototype;
- deterministic node positions independent of render-mesh vertex identity;
- instancing where useful;
- controlled DPR;
- low-cost lighting;
- a sphere-mesh complexity appropriate to target devices.

Avoid:

- rebuilding all node positions when zoom changes;
- coupling node population to sphere tessellation;
- continuous React rerenders for high-frequency zoom/orientation input;
- excessive postprocessing.

# 22. Performance Baseline

The site should remain usable on:

- modern integrated laptop graphics;
- Safari;
- mobile Safari;
- common Android devices.

Prototype work should be tested on real hardware early.

Do not optimize only for a high-end desktop GPU.

---

# 23. Accessibility Requirements

Even during prototyping, do not create architecture that makes accessibility impossible later.

Maintain:

- semantic DOM content;
- accessible buttons;
- keyboard-operable controls;
- readable labels;
- stable focus order.

WebGL objects should eventually have semantic equivalents.

Important artifacts must never exist solely as inaccessible 3D objects.

---

# 24. Reduced Motion

Code should not assume full cinematic animation is always enabled.

Architecture should allow reduced-motion behavior.

When implementing animation logic, avoid designs that make interaction impossible without the animation.

---

# 25. Mobile Consideration

Do not fully solve mobile during Prototype 1 unless asked.

However:

- avoid desktop-only assumptions embedded deep in architecture;
- avoid relying exclusively on hover;
- avoid pointer APIs that cannot translate to touch;
- keep touch gesture support feasible.

---

# 26. Routing

The interface may feel like a persistent single environment, but artifacts should ultimately support addressable URLs.

Do not implement final routing unless requested.

When routing is introduced, preserve:

- direct linking;
- browser back/forward;
- refresh persistence;
- semantic page metadata.

---

# 27. Styling Discipline

Do not prematurely build a large design system.

Prototype styles should be:

- centralized enough to edit quickly;
- semantic;
- minimal;
- easy to replace.

Avoid hard-coding visual values across many components.

Use reusable variables/tokens where repeated values emerge.

---

# 28. Visual Restraint

The interface should avoid common 3D-web clichés.

Do not default to:

- neon cyberpunk colors;
- heavy glassmorphism;
- exaggerated bloom;
- excessive particle fields;
- constant floating animation;
- sci-fi HUD overlays;
- gratuitous distortion.

The intended aesthetic is:

> editorial portfolio × technical interface × spatial archive

---

# 29. Symbol Integrity

The Kodye Pugh symbol is a core branded asset.

When using the real symbol:

- preserve its geometry;
- do not redraw approximately;
- do not distort aspect ratio;
- do not modify without instruction.

If prototype work requires temporary geometry, label it clearly as placeholder.

---

# 30. Content Window Discipline

The Inspection Window should prioritize readability and conventional browser behavior.

Do not make long-form content depend on:

- WebGL text;
- 3D camera movement;
- curved text surfaces;
- spatial scrolling;
- rotating panels;
- orb-to-symbol choreography.

Current presentation requirements:

- enter from below the viewport;
- render above the reservoir interface;
- initially settle with its top edge approximately around the viewport's upper-third line;
- allow content to extend beyond the viewport;
- use normal static vertical document scrolling;
- include an explicit close control;
- avoid a cramped nested scroll box unless a specific artifact requires one.

Once content opens, standard web reading principles apply.

# 31. Error Boundaries

The spatial layer should not be able to destroy access to content.

Where practical:

- isolate WebGL errors;
- allow fallback UI;
- keep navigation recoverable;
- avoid blank-screen failures.

---

# 32. Logging and Debugging

During prototypes, temporary debugging instrumentation is acceptable.

Examples:

- current state;
- selected node ID;
- sphere rotation;
- zoom;
- transition phase.

Remove or disable debug UI before production release.

Do not pollute production console output.

---

# 33. No Silent Architectural Rewrites

The V2 spatial foundation explicitly authorizes a substantial rewrite of the existing reservoir navigation substrate where necessary to remove V1 camera-dive and physical collection-slot assumptions.

This authorization includes reasonable restructuring of:

- camera/zoom logic;
- reservoir transforms;
- geometry/surface utilities;
- node-placement logic;
- collection transition coordination;
- related state types.

It does **not** authorize unrelated rewrites such as:

- replacing React Three Fiber;
- changing routing strategy;
- introducing a new global state library without need;
- changing artifact content storage;
- replacing the entire animation framework;
- altering deployment architecture.

If one of those becomes necessary, surface it separately.

# 34. Dependency Policy

Before installing a dependency, determine:

1. whether native platform functionality is sufficient;
2. whether the project already has a suitable library;
3. whether the dependency materially simplifies the implementation;
4. whether its bundle/performance cost is justified.

Avoid dependencies for trivial utilities.

---

# 35. Change Scope

Each Codex task should modify the minimum practical surface area.

Preferred:

```text
one feature
few related files
clear reason
clear test
```

Avoid broad cleanup while implementing unrelated features unless necessary.

---

# 36. Existing Behavior Preservation

When implementing a new milestone:

- preserve current working behavior;
- avoid changing unrelated layouts;
- avoid modifying deployment configuration unnecessarily;
- avoid altering Git or Vercel setup unless explicitly instructed.

---

# 37. Verification After Changes

After implementation, Codex should verify as appropriate:

- project builds;
- TypeScript compiles;
- lint passes where configured;
- development server starts;
- changed interaction works;
- no obvious console errors;
- no obvious hydration warnings.

For visual interaction tasks, build success alone is insufficient.

---

# 38. Visual QA Expectations

For each milestone, inspect:

- positioning;
- responsive behavior;
- state transitions;
- clipping;
- stacking;
- input conflicts;
- scene stability;
- unintended layout movement.

If visual behavior cannot be fully verified automatically, identify what the user should inspect locally.

---

# 39. Definition of Done for a Milestone

A milestone is complete when:

1. requested behavior is implemented;
2. unrelated behavior remains intact;
3. code is reasonably modular;
4. project passes relevant technical checks;
5. no known blocking console errors remain;
6. implementation aligns with the interface specification;
7. remaining limitations are stated clearly.

---

# 40. Task Prompt Format

Future Codex tasks should ideally use this structure:

```text
OBJECTIVE
What to implement.

V2 FOUNDATION
Which spatial rules from the Interface Specification govern the task.

PRESERVE
Existing validated artifact/UI behavior that must remain intact.

SCOPE
Files/systems that may be touched.

REQUIREMENTS
Expected behavior.

RETIRED BEHAVIOR
Old camera/path/slot assumptions that must not be preserved.

DO NOT IMPLEMENT
Explicit future features outside the task.

VALIDATION
Technical, visual, interaction, and performance checks.
```

For V2 work, prompts should explicitly distinguish:

```text
layout state
reservoir surface presentation
orientation
zoom
semantic collection state
```

# 41. Example Task

```text
OBJECTIVE

Implement V2.1–V2.3 of the reservoir spatial foundation.

V2 FOUNDATION

- Reservoir remains centered in the usable visual frame.
- Drag rotates the reservoir.
- Wheel changes reservoir scale, not camera-path depth.
- Node positions are generated in continuous spherical space.
- The sphere render mesh must not own node identity.

PRESERVE

- Existing artifact selection/open behavior.
- Bottom control plane.
- Menu/footer behavior.
- Current content/data definitions.

SCOPE

Reservoir scene, sphere transform, zoom state, geometry utilities, placement/layout utilities, and directly related types.

RETIRED BEHAVIOR

Remove ordinary zoom dependencies on:
- cursor-directed dive;
- surface lock;
- inner camera position;
- atmospheric retreat;
- camera-depth progress.

DO NOT IMPLEMENT

- semantic clustering;
- semantic zoom aggregation;
- relationship visualization;
- database/admin systems.

VALIDATION

- build/typecheck/lint pass;
- sphere center remains stable across zoom range;
- wheel/pinch produces smooth bounded scale change;
- drag remains stable at all scales;
- nodes do not jump when scale changes;
- artifact open/close still preserves orientation and zoom;
- no obvious regression in menu/footer/input ownership.
```

# 42. Working Relationship With the Specification

Codex should not reinterpret the design specification as implementation pseudocode.

The specification defines intent.

Implementation should use the simplest robust technical structure that reproduces that intent.

Where multiple implementations are equally valid, prefer:

- clarity;
- maintainability;
- performance;
- future extensibility;
- ease of tuning.

---

# 43. Open Technical Decisions

The following remain unresolved until implementation evidence exists:

- exact spherical distribution algorithm;
- deterministic layout seeding strategy;
- spacing metric and population-to-layout heuristic;
- approved reservoir surface presentation family / detail level;
- exact zoom curve / scale bounds;
- node apparent-size behavior across zoom;
- initial-orientation scoring heuristic;
- per-collection state restoration policy;
- mobile pinch implementation details;
- performance-safe reservoir surface presentation ceiling;
- fallback rendering approach.

Do not lock these prematurely.

The following are no longer open V2 questions:

- reservoir is centered;
- ordinary zoom is scale-based rather than dive-based;
- node layout is render-mesh-independent;
- reservoir surface presentation is approved for V2 as a presentation-only layer and remains replaceable by architecture;
- collection traversal uses semantic Active + Destination state rather than physical parent/child sphere slots.

# 44. Architecture Test

Before introducing a major abstraction, ask:

> Is this solving a current implementation problem, or a hypothetical future problem?

If hypothetical, delay it.

---

# 45. Product Test

Before implementing a feature from the larger vision, ask:

> Is this necessary to validate or ship the current milestone?

If no, do not build it yet.

---

# 46. Interaction Test

Before adding an animation, ask:

> What does the visitor learn from this movement?

If the answer is unclear, simplify or remove it.

---

# 47. Performance Test

Before adding a graphical effect, ask:

> Is its perceptual value worth its rendering cost?

If not, remove it.

---

# 48. Core Rules to Preserve

> **Collections change the world. Artifacts open windows.**

> **The reservoir remains the reference frame.**

> **Zoom changes reservoir scale and information resolution, not semantic location.**

> **Node identity and layout are independent from render-mesh vertex identity.**

> **Layout serves the information population; the reservoir surface remains visually continuous.**

> **Exploration is spatial. Inspection is immediate. Reading is conventional.**

> **First selection explains the artifact; second selection opens it.**

> **The atmosphere is an information surface, not empty decoration.**

> **The control plane is persistent UI space, not a camera-navigation mechanism.**

> **The 3D layer enhances access; it does not control access.**

> **Build only the currently authorized V2 increment.**

# 49. Current Development Status

The project has completed the V1 interaction exploration, V2 spatial-foundation work, Query Reservoir closure, and the L2 semantic/Inspection foundation required by the current Bellabeat launch material.

Accepted foundation includes:

- centered R3F/Three.js Reservoir;
- render-mesh-independent node layout;
- population-aware node sizing/spacing;
- Distributed / Focused modes;
- progressive Resource selection and conventional Inspection;
- recursive Collection navigation through Active + Destination state;
- bottom control plane, menu, footer, and query coordination;
- directional Query Reservoir ancestry;
- Resource/Collection registry and addressability;
- Resource-oriented Inspection Window;
- structured-document, image, and external-link/repository Inspection;
- supporting-Resource navigation and practical Inspection return;
- Bellabeat initial materialization.

Historical mechanics that remain retired:

- lower-frame sphere composition;
- semantic mesh topology;
- permanent render-mesh vertex placement;
- cursor-directed camera dive as ordinary zoom;
- locked surface/inner camera state;
- physical Active / Ancestor / Child Collection spheres;
- Collection traversal dependent on camera push/pull through those slots.

### Current target

Current implementation should preserve the accepted foundation while completing the public launch roadmap.

Do not treat V2 spatial work as an unfinished current milestone.

---

# 50. Current Checkpoint — Public Launch Preparation

V1/V2 milestones remain historical checkpoints and regression references.

The current sequencing authority is `docs/release-preparation-roadmap.md`.

Current stages:

```text
1. Portfolio Content Cut
2. Public Web Layer
3. Integrated Reservoir QA
4. Responsive, Accessibility, and Interaction Regression Sweep
5. Production Release
```

### Preserve during launch work

- centered reservoir;
- scale-based zoom;
- current node sizing/spacing;
- adaptive inspectability;
- dynamic label behavior;
- Distributed / Focused layouts;
- Active + Destination Collection transitions;
- directional Query Reservoir ancestry;
- context-local query filters;
- Resource identity and Artifact-status semantics;
- shared InspectionWindow architecture;
- Inspection return context;
- menu/footer independence;
- reduced-motion and accessibility behavior already established.

### Do not reopen by default

Do not restart V2.1–V2.6, rebuild L2 registry architecture, or add new renderer families merely because the current task touches these systems.

A completed foundation may be changed only for:

- a reproducible defect;
- an explicitly approved design change;
- a launch requirement that cannot be satisfied within the accepted abstraction.

### Definition of launch-preparation completion

Use the release roadmap's completion conditions rather than the historical V2 milestone checklist.
