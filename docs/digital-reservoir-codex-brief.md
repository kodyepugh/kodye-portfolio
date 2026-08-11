# Digital Reservoir
## Codex Implementation Brief
**Version:** 0.1
**Status:** Persistent Developer Reference
**Project:** kodyepugh.com
**Primary reference:** `docs/digital-reservoir-interface-spec.md`

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

# 2. Source-of-Truth Hierarchy

When implementing changes, use the following priority order:

```text
1. Explicit current task instruction
2. Digital Reservoir Interface Specification
3. This Codex Implementation Brief
4. Existing repository conventions
5. Codex judgment
```

If an explicit task conflicts with the interface specification, do not silently reinterpret the request.

Surface the conflict before making a major architectural change.

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

Codex must not interpret the existence of that vision as authorization to implement it.

Unless directly instructed, do not implement:

- recursive collection infrastructure;
- relational databases;
- CMS integration;
- search;
- filtering;
- semantic embeddings;
- automated node placement;
- timeline views;
- advanced relationships;
- account systems;
- admin systems;
- private/public content layers;
- production analytics infrastructure;
- complex mobile variants;
- speculative backend services.

Build only the requested milestone.

---

# 7. Prototype-First Development

The Digital Reservoir should be developed through isolated interaction milestones.

Each milestone should answer a specific design or technical question.

Current sequence:

```text
Milestone 1 — COMPLETE (2026-08-11)
Render and stabilize the spatial reservoir scene, camera navigation, and sphere traversal

Milestone 2 — COMPLETE (2026-08-11)
Add artifact spatial identity, inspection, and selection

Milestone 3
Scope the next interaction stage only after explicit authorization

Milestone 4
Add orb-to-symbol activation

Milestone 5
Add content inspection window

Milestone 6
Add exit and state restoration

Milestone 7
Test and refine complete artifact loop

Milestone 8+
Only then expand collections, menu, footer, etc.
```

Do not merge multiple major milestones into one implementation unless explicitly requested.

---

# 8. Current Prototype Goal

The immediate prototype goal is to validate the core loop:

```text
Reservoir
↓
focus node
↓
select artifact
↓
extract orb
↓
orb travels to symbol
↓
symbol activates
↓
content rises
↓
read
↓
close
↓
orb returns
↓
reservoir resumes exactly where it was
```

The prototype should prioritize interaction quality over completeness.

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
    SphereGrid.tsx
    ArtifactNode.tsx
    CollectionNode.tsx
    NodeLabel.tsx

  artifact/
    ArtifactWindow.tsx
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
- camera;
- lights;
- high-level 3D composition.

Should not contain long-form artifact content.

---

## ReservoirSphere

Responsible for:

- sphere geometry;
- overall transform;
- surface structure;
- scene-level rotation/zoom relationship.

Should not own business content definitions.

---

## SphereGrid

Responsible for:

- grid geometry;
- vertex coordinates;
- line rendering;
- stable node locations.

Should expose coordinates rather than tightly coupling to artifacts.

---

## ArtifactNode

Responsible for:

- orb representation;
- focus state;
- selection state;
- icon;
- label trigger;
- category visual treatment.

Should not directly open long-form content by manipulating DOM outside agreed state flow.

---

## CollectionNode

Responsible for collection-node representation.

Do not implement until a task explicitly requires collection traversal.

---

## ArtifactWindow

Responsible for:

- 2D artifact content container;
- scroll behavior;
- opening/closing presentation;
- readable content surface.

Should remain separate from WebGL scene internals.

---

## BottomControlPlane

Responsible for:

- symbol;
- wordmark;
- contextual title;
- contextual subtitle;
- home/exit controls;
- movement of the persistent bottom plate.

Should not own reservoir geometry.

---

# 11. State Architecture

Prefer explicit state over inferred DOM conditions.

State should make important UI modes obvious.

Conceptual example:

```typescript
type TransitionState =
  | "idle"
  | "focusing"
  | "activatingArtifact"
  | "readingArtifact"
  | "closingArtifact"
  | "enteringCollection"
  | "leavingCollection";
```

Potential application state:

```typescript
interface ReservoirState {
  currentCollectionId: string;

  focusedNodeId: string | null;
  selectedArtifactId: string | null;

  sphereRotation: {
    x: number;
    y: number;
  };

  zoomLevel: number;

  menuOpen: boolean;
  footerVisible: boolean;
  contentOpen: boolean;

  transitionState: TransitionState;
}
```

Do not implement all fields merely because they exist here.

Introduce state only when the current milestone requires it.

---

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

Content should not store arbitrary rendered screen coordinates.

Preferred relationship:

```text
artifact
↓
vertex ID
↓
geometry system
↓
world-space position
```

Example:

```typescript
type SpatialPlacement = {
  collectionId: string;
  vertexId: number;
};
```

This keeps content independent of the current sphere implementation.

---

# 14. Artifact Data Rules

Prototype content may initially be static.

Keep artifact records outside scene logic where practical.

Conceptual shape:

```typescript
interface Artifact {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: string;
  icon?: string;
  category?: string;
  categoryColor?: string;
  spatialPlacement?: {
    collectionId: string;
    vertexId: number;
  };
}
```

Do not create a full database schema during the prototype.

---

# 15. Interaction Mode Separation

Reservoir mode and artifact-reading mode must not compete for the same input.

## Reservoir mode

Expected behavior:

```text
drag        rotate sphere
wheel       zoom
hover       focus
click       select
```

## Artifact mode

Expected behavior:

```text
wheel       scroll content
drag        standard browser/content interaction
Esc / close exit artifact
```

When artifact content is open:

- disable sphere wheel behavior;
- disable sphere drag behavior;
- prevent accidental interaction through the content layer.

When content closes:

- restore prior reservoir interaction.

---

# 16. State Preservation

When an artifact opens, preserve:

- current collection;
- sphere orientation;
- zoom level;
- artifact source vertex.

When the artifact closes:

- return the orb to its original vertex;
- restore the exact previous orientation;
- restore zoom;
- restore navigation ability.

Do not reset the reservoir to its default orientation.

---

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

Artifact activation should remain conceptually segmented.

## Extraction

Orb separates from its vertex.

## Transfer

Orb moves toward symbol center.

## Activation

Orb merges with or replaces central symbol dot.

## Deployment

Artifact content rises and contextual title/subtitle appear.

Even if implemented within one animation timeline, preserve these conceptual phases.

---

# 19. Exit Requirements

Artifact exit should reverse the activation logic rather than simply hide content.

Expected conceptual order:

```text
content retracts
↓
symbol deactivates
↓
orb leaves center
↓
orb returns to source vertex
↓
reservoir input restores
```

Exact animation timing may change during testing.

---

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

Prefer:

- instancing where useful;
- stable geometry;
- memoized materials;
- controlled DPR;
- low-cost lighting;
- minimal postprocessing.

Avoid:

- excessive bloom;
- excessive dynamic shadows;
- large unnecessary textures;
- high-poly models for simple orbs;
- continuous re-renders caused by unrelated React state.

---

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

The artifact window should prioritize readability.

Do not make long-form content depend on:

- WebGL text;
- 3D camera movement;
- curved text surfaces;
- spatial scrolling;
- rotating panels.

Once content opens, standard web reading principles apply.

---

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

If Codex determines that a requested change requires a substantial architectural rewrite, it should not proceed invisibly.

Examples:

- replacing React Three Fiber;
- changing routing strategy;
- introducing a global state library;
- changing content storage format;
- replacing animation framework;
- restructuring the application directory.

Surface the reason and scope before making the change unless the current task explicitly authorizes it.

---

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

REFERENCE
Relevant specification sections.

SCOPE
What files/systems may be touched.

REQUIREMENTS
Expected behavior.

DO NOT IMPLEMENT
Explicit exclusions.

VALIDATION
What should be tested before completion.
```

---

# 41. Example Task

```text
OBJECTIVE

Implement the initial 3D reservoir scene.

REFERENCE

Digital Reservoir Interface Specification:
Sections 4, 5, 10, 13, and 61.

SCOPE

Create the minimum components needed for:
- a central sphere,
- grid geometry,
- five placeholder nodes,
- rotation,
- zoom.

REQUIREMENTS

- Sphere remains centered.
- Drag rotates the sphere.
- Wheel zoom changes camera distance.
- Five nodes remain attached to stable vertices.
- Existing Next.js deployment configuration must remain unchanged.

DO NOT IMPLEMENT

- artifact activation;
- content window;
- recursive collections;
- menu;
- footer;
- database;
- production styling.

VALIDATION

- npm run build succeeds.
- No runtime console errors.
- Sphere can be rotated and zoomed locally.
- Nodes remain attached to the grid while rotating.
```

---

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

The following should remain unresolved until implementation evidence exists:

- exact sphere topology;
- exact grid-generation algorithm;
- state-management library;
- animation framework;
- routing structure;
- content file format;
- fallback rendering approach;
- mobile interaction specifics;
- final performance thresholds;
- final accessibility alternate representation.

Do not lock these prematurely.

---

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

These rules should remain visible throughout development:

> **Collections change the world. Artifacts open windows.**

> **Exploration is spatial. Reading is conventional.**

> **The reservoir preserves continuity.**

> **The symbol is functional, not ornamental.**

> **The 3D layer enhances access; it does not control access.**

> **Build only the milestone currently being tested.**

---

# 49. Current Development Status

Infrastructure is established.

The project:

- runs locally;
- is version-controlled;
- is connected to GitHub;
- is deployed through Vercel.

**Milestone 1 — Camera & Spatial Navigation was completed on 2026-08-11.**

**Milestone 2 — Artifact Spatial Identity, Inspection & Selection was completed on 2026-08-11.**

The repository now contains the validated initial spatial reservoir prototype:

- a responsive, fixed-scale reservoir sphere;
- a detail-15 structural triangular grid;
- five deterministic, vertex-anchored placeholder artifact nodes;
- cursor-directed continuous inward camera travel;
- region-relative atmospheric retreat;
- camera clearance and pole/rim stability guards;
- view-relative quaternion sphere traversal;
- proximity-sensitive drag control with inner sensitivity at 20% of outer sensitivity;
- preserved sphere orientation throughout camera-only travel.

The validated Milestone 2 checkpoint adds:

- artifact-colored spatial nodes;
- radially anchored, camera-billboarded labels with shared horizon fading and backside hiding;
- responsive label widths with a retained `MAX_LABEL_WIDTH` of `720` and a continuously looping overflow carousel;
- isolated label rendering above the grid, glow fields, and artifact orbs;
- a subtle, uniform white hover treatment that preserves artifact color;
- cursor-responsive white topology inspection with a continuous three-band face field and restrained edge hierarchy;
- artifact-colored selected topology whose visual strength remains above cursor white;
- a press → mesh propagation → selected-depth orb sequence with upward-traveling white selected illumination;
- deselection mesh retraction followed by downward white retreat and exact orb reset;
- preserved click-versus-drag behavior and proximity-sensitive traversal;
- the accepted detail-15 topology and no-directly-adjacent occupied-node rule;
- a successful deterministic 24-node density stress test;
- restoration of the five canonical artifacts as the default dataset;
- a reusable development-only density harness enabled with `NEXT_PUBLIC_RESERVOIR_DENSITY_TEST=1`.

Artifact activation, content presentation, collections, and production interface systems remain outside the completed M2 scope.

### Deferred issue — Initial Reservoir Composition / Load Orientation

Density QA confirmed that valid artifacts may be distributed across hemispheres that are not visible on initial load. Future work should determine how the initial reservoir orientation and/or content distribution can expose a meaningful visible population without breaking spatial continuity. This is a future composition question, not an M2 regression, and is deliberately not implemented at this checkpoint.

---

# 50. Milestone Checkpoint

Milestone 1 is complete and remains the stable spatial-navigation checkpoint.

Milestone 2 is complete and should be treated as the stable artifact identity, inspection, selection, and density-QA checkpoint.

Do not begin Milestone 3 without explicit authorization and a newly scoped interaction brief.

Artifact activation remains a later milestone and must not be combined with node focus by default.

---

**End of Codex Implementation Brief — v0.1**
