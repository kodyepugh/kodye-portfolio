# Digital Reservoir
## Codex Implementation Brief

**Version:** 0.4
**Status:** Persistent Developer Reference
**Project:** kodyepugh.com
**Primary reference:** `docs/digital-reservoir-interface-spec.md`

---

# 1. Purpose

This brief defines how implementation work should preserve the Digital Reservoir's architecture, milestone boundaries, and validated behavior. The interface specification defines the experience; this brief defines the implementation approach and current checkpoint.

Use this source hierarchy:

```text
1. Explicit current task instruction
2. Current validated repository behavior
3. Digital Reservoir Interface Specification
4. This Codex Implementation Brief
5. Existing repository conventions and engineering judgment
```

Do not silently preserve historical documentation when it conflicts with validated behavior.

# 2. Engineering principles

Keep these concerns distinct:

```text
CONTENT       what exists
SEMANTICS     what an object means
GEOMETRY      where it exists spatially
PRESENTATION  how it looks
STATE         what the interface is doing
TRANSITION    how states change
```

Favor explicit state, reusable components, semantic HTML, deterministic geometry, small verified changes, and readable code. Avoid monolithic scene logic, content embedded in animation code, unnecessary global state, speculative infrastructure, and unrequested future features.

The project currently uses Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, Git, GitHub, and Vercel. Follow the installed Next.js version's local documentation before changing framework behavior.

# 3. Milestone sequence

```text
Milestone 1 — COMPLETE
Camera & Spatial Navigation

Milestone 2 — COMPLETE
Artifact Spatial Identity, Inspection & Selection

Milestone 3 — COMPLETE
Progressive Artifact Inspection & Opening

Milestone 4 — COMPLETE (2026-08-13)
Recursive Collection Identity, Traversal & Navigation

Milestone 5+
Not yet scoped
```

Milestone 3 remains the closed stable artifact-opening checkpoint. Milestone 4 is the closed recursive collection checkpoint. Preserve both contracts unless a later explicit milestone authorizes a change.

# 4. Current component boundaries

The current prototype separates responsibilities approximately as follows:

- `ReservoirScene` owns interaction state, input ownership, artifact open/restore orchestration, collection history, forward/reverse traversal, camera snapshots, and semantic layer coordination.
- `ReservoirSphere` and `SphereGrid` own active-reservoir and topology presentation.
- `ArtifactNode` and `CollectionNode` own node rendering, focus/selection treatments, continuation cues, recession, and restoration interpolation.
- `CollectionSphere` owns the embedded collection's dormant/active grid and grey handoff presentation; `ReturningCollectionNode` owns the exited child during reverse traversal.
- `ArtifactLabel` owns the shared spatial label system and visibility rules for artifact and collection nodes.
- `ArtifactTerritory` owns canonical first-selection topology, artifact second-selection radial expansion/dissipation, collection topology suction, and artifact close restoration.
- `ArtifactShockwave` owns the artifact-colored topology wave visualization.
- `AtmosphereContent` owns semantic active-collection, selected-artifact, or selected-collection atmospheric content.
- `ArtifactWindow` owns semantic long-form content, document deployment/retraction, sticky close, Escape handling, and the persistent reading backdrop.
- `CollectionNavigation` owns contextual Home/Back UI-space controls.
- `opening.ts`, `reading.ts`, `collection-entry.ts`, `selection.ts`, `second-selection.ts`, and `node.ts` centralize transition timing and presentation helpers.
- `artifacts.ts`, `collections.ts`, and `nodes.ts` own canonical content records, hierarchy, immediate-child queries, and development-only density generation.

Maintain these boundaries unless a later task demonstrates a clearer structure.

# 5. State and input model

The interaction model distinguishes at least:

```text
idle / reservoir exploration
openingArtifact
deployingArtifact
readingArtifact
closingArtifact
restoringArtifact
enteringCollection
emergingCollection
leavingCollection
```

Exact identifiers may evolve, but input ownership must remain explicit:

- idle reservoir state owns drag traversal, wheel camera travel, focus, selection, and second-selection opening;
- opening suppresses reservoir input;
- deployment keeps document scrolling locked until deployment actually completes;
- reading gives wheel, trackpad, keyboard, and pointer behavior to the semantic document;
- closing disables document interaction;
- restoration suppresses reservoir input until deterministic restoration finishes.
- collection entry owns topology suction, child recession, camera approach, grey/grid handoff, and destination activation;
- child emergence keeps input locked until immediate children settle;
- collection return owns child recession, camera retreat, reverse grey/grid handoff, and preserved-parent restoration.

Do not allow WebGL input and document scrolling to respond to the same reading gesture.

# 6. Milestone 3 implementation checkpoint

Milestone 3 completed the following coherent loop:

- semantic atmospheric metadata rendering for Home and selected artifacts;
- selected-label suppression;
- preservation of Milestone 2 selection and topology identity;
- an occasional selected continuation reverb bounce with a thin white ring;
- a stronger steady white direct-hover treatment without pulsing or extra rings;
- second-selection confirmation semantics;
- capture of exact pre-open camera, navigation, sphere, and selected-artifact state;
- an artifact-colored shockwave propagated through sphere topology;
- non-selected-node reaction ordered by topological surface distance;
- overlapping sphere dimming, node recession, selected-node embedding, and camera withdrawal;
- complete recession of non-selected nodes beneath the sphere;
- partial, color-identifiable embedding of the selected node at its original vertex;
- camera withdrawal toward the established atmospheric/outer view without resetting sphere orientation;
- staged semantic artifact content;
- a dark artifact reading document positioned beneath atmospheric metadata;
- approximately 16px of tuned initial separation between atmosphere and document;
- artifact body content that does not duplicate the atmospheric identity block;
- foreground conventional document scrolling;
- a fixed continuous dark reading backdrop that prevents WebGL exposure during aggressive scrolling;
- a semantic sticky close control, visible focus treatment, and Escape dismissal;
- deterministic deployment gating based on the completed window animation;
- retraction followed by exact camera, target, camera-progress, sphere-quaternion, and node restoration;
- preservation of the selected artifact and atmospheric metadata after close;
- repeated-cycle stabilization under standard, dense, and reduced-motion conditions.

This checkpoint intentionally supersedes the earlier generic simultaneous-sinking concept, the no-camera-reframe opening concept, the pulsing selected-hover glow, duplicated window metadata, and any non-sticky close assumption.

# 7. Selection and continuation constraints

First selection must not open content, alter camera travel, reset sphere orientation, detach the node, or move it to the identity mark. It replaces Home atmospheric content with the selected artifact's available metadata and hides only that artifact's floating label.

While selected, the artifact remains actionable. The occasional continuation cue may run during ordinary traversal and must stop during opening or deselection. Direct hover uses a steady stronger white emphasis. Do not reintroduce a selected-hover pulse.

# 8. Opening transition constraints

Treat second selection as one overlapping event:

```text
shockwave
+ sphere dimming
+ node recession
+ selected-node embedding
+ camera withdrawal
```

The visible wave uses the selected artifact color and existing topology. Node arrival order derives from graph/geodesic distance rather than one simultaneous generic sink. Nearby nodes react before distant nodes. Non-selected nodes perk and then recede fully; the selected node remains partly embedded at its original vertex.

Capture the exact current state before mutating the scene. Camera withdrawal may use the established Milestone 1 outer frame, but sphere orientation must not be reset or auto-aligned. Preserve all Milestone 1 clearance, pole, rim, and roll protections.

# 9. Reading architecture constraints

Prepare content during opening so reading deployment does not wait on late content construction. The atmosphere owns artifact identity and high-level metadata; the document begins with body content.

The reading stack is intentionally layered:

```text
artifact document and sticky controls
atmospheric selected-artifact metadata
fixed opaque reading backdrop
WebGL reservoir
```

The fixed backdrop must remain for the full artifact-window lifetime, including deployment and retraction, and must not intercept pointer events. The moving document remains above it. Reading-mode scroll ownership belongs to the root document; avoid overflow containers that break sticky positioning or expose the reservoir at inertial boundaries.

Deployment keeps the root scroll position locked until the window's deployment animation completes. Reading uses ordinary browser scrolling and disables sphere navigation. The sticky close must remain keyboard accessible and available at long-document depths. Escape closes where supported.

The current dark presentation is a prototype decision, not a final theme system. Do not introduce light mode, device-theme adaptation, or a replacement typography system without a separate design task.

# 10. Close and restoration contract

Close must:

1. suppress reading interaction;
2. retract the document below the viewport while retaining coverage;
3. restore sphere brightness and node depths;
4. restore the exact saved camera position, target, quaternion, travel progress, and sphere quaternion;
5. restore reservoir input only after restoration completes;
6. keep the artifact selected and keep its metadata in the atmosphere.

Do not return to a default sphere orientation. Only explicit deselection restores Home atmosphere.

# 11. Retired artifact-opening behavior

Do not reintroduce these concepts without a new explicit design decision:

- orb extraction;
- orb-to-symbol transfer;
- symbol center drop or replacement;
- center-circle retraction;
- automatic sphere-to-symbol or sphere-to-artifact alignment;
- ensō artifact-opening animation;
- lateral information-banner deployment.

The Kodye Pugh symbol remains a stable identity anchor, not an artifact loader or transition controller.

# 12. Content and data rules

Canonical artifact data remains independent of scene animation logic. Optional metadata fields are rendered only when populated. Production defaults to the five canonical artifact records.

The 24-node density mode is development-only:

```text
NEXT_PUBLIC_RESERVOIR_DENSITY_TEST=1
```

It must remain gated by the development environment and must not alter the production artifact count or placement behavior.

# 13. Milestone 3 validation record

The final checkpoint passed:

- TypeScript type checking;
- ESLint;
- Next.js production build with webpack;
- whitespace/diff validation;
- ten hard-refresh first-open aggressive-scroll cycles;
- ten selected-artifact reopen aggressive-scroll cycles;
- direction reversals and inertial-strength document scroll input;
- focus, sticky close, click close, and Escape close checks;
- exact restoration checks with zero observed camera-position, camera-target, and sphere-quaternion error;
- five density-mode open/read/close cycles with all 24 vertex identities preserved;
- dense topology-distance recession/restoration;
- reduced-motion deployment lock, coverage, sticky close, and restoration;
- clean browser warning/error logs during final QA.

Future changes to opening, scroll ownership, stacking, camera state, or restoration must rerun proportionate versions of these checks.

# 14. Milestone 4 architecture and presentation

> **Every reservoir is a collection, and every collection can become a reservoir.**

Home is collection `home` rendered in its active-reservoir state. An embedded collection is the same semantic class rendered dormant. At stable depth exactly one collection is active.

An active collection:

- occupies the main reservoir role;
- uses the shared active-grey material and detail-15 grid;
- renders only its immediate artifact and collection children;
- owns reservoir navigation and default atmospheric context.

A dormant collection:

- is a black orb approximately twice an artifact-node diameter;
- uses a scale-appropriate reduced version of the reservoir grid;
- remains at a deterministic valid vertex;
- exposes no children;
- uses the shared local-north, billboarded, horizon-faded, backside-hidden label system and subtle white resting hover.

The grid is the primary visual indicator that a dormant collection is another reservoir. Do not add shells, secondary rings, unrelated internal lighting, or decorative topology.

# 15. Collection selection contract

First selection inspects rather than enters. It reuses the shared node-selection model: press/bounce, lower selected-depth hold, canonical surrounding topology, bright edges/spokes, radial gradation, idle continuation bounce/ring, label suppression, atmospheric collection metadata, and restrained selected-hover confirmation. The collection body stays black and gridded; active grey does not appear on first selection.

Second selection confirms traversal. Canonical selected faces and edges retract inward, with the outside disappearing first, until all external selected topology reaches zero inside the node. There is no topology spin, detached geometry, outward second-selection bounce, or physical orb extraction.

# 16. Forward traversal contract

Forward traversal coordinates these overlapping concerns:

```text
selected topology suction
+ parent remaining-child recession
+ concave-up camera approach
+ active-grey parent → destination handoff
+ dormant-grid → detail-15 active-grid handoff
↓
parent hidden
↓
destination immediate-child emergence
↓
idle input ownership
```

The destination collection remains fixed in world space. Camera approach creates apparent enlargement and uses a deterministic local radial/tangent frame with an upward, concave-up arc. It intentionally differs from the ordinary concave-down inward dive while retaining clearance, pole/rim, near-overhead, tangent, and roll safeguards. The endpoint is the normalized active-reservoir camera relationship.

Active grey is traversal state, not category color. It transfers from the old active parent to the destination, which finishes with the same grey as Home. The previous parent becomes hidden and non-participatory. Only after activation do the destination's immediate children rise from below the surface, settle at deterministic vertices, and regain label/hover/input behavior. Grandchildren are not rendered.

# 17. Recursive state and rendering contract

> **Recursive collection depth is preserved as state, not accumulated as visible geometry.**

At stable depth, render interactively only the active collection and its immediate children. Preserved ancestors are not visible reservoirs, raycastable geometry, grids, labels, or child trees.

`collectionHistory` stores ordered frames whose collection IDs conceptually form `home → work → data`. The active frame is the current world. Parent frames preserve the exact state required for deterministic return, including collection identity, sphere quaternion, camera pose and travel relationship, local inspection/dive context, selected destination, and active outer frame. Geometry placement remains canonical data rather than accumulated render trees.

Contextual navigation is semantic UI, not WebGL:

```text
depth 0  → no controls
depth 1  → Home
depth 2+ → Home + Back
```

Back targets the immediately preceding frame. Home targets root directly and does not activate intermediate ancestors.

# 18. Reverse traversal contract

Reverse traversal begins by locking input and submerging the current active collection's immediate children. The major camera pull-out starts only after that recession is established.

> **Reverse traversal is a camera retreat through the collection hierarchy, not a sphere morph.**

The camera performs a larger collection-scale retreat. The preserved target parent enters primarily from below through perspective rather than popping into final framing. During the retreat, active grey and the detail-15 grid drain from the current child and fill/resolve on the parent. The child remains a distinct collection object, becomes smaller through perspective, and resolves to its dormant black reduced-grid state.

At arrival, the exact preserved parent orientation and camera relationship are restored, then the parent's immediate children restore before normal input resumes. Back restores one level. Direct Home uses the same recession-first principle, targets the root frame in one retreat, keeps intermediate ancestors hidden, restores Home's active state and children, and collapses history to root.

# 19. Active-collection-relative artifact behavior

Artifact lookup, selection, opening, reading, close, and deterministic restoration are relative to the active collection. No artifact lifecycle code may assume `activeCollectionId === "home"`. Artifact opening also recedes dormant collection siblings with the active collection's other non-selected nodes.

# 20. Milestone 4 completion record

## Milestone 4 — Recursive Collection Identity, Traversal & Navigation: COMPLETE

Completed 2026-08-13. The checkpoint includes:

- Home/root unified with collection semantics;
- active/dormant shared reservoir identity, black dormant nodes, adaptive dormant grids, and detail-15 active grids;
- shared collection labels and hover;
- collection first selection and inward topology suction on confirmation;
- camera-driven concave-up forward traversal, parent-child recession, and active-grey parent-to-child transfer;
- hidden-ancestor architecture, destination child emergence, and recursive forward traversal;
- preserved traversal-history frames and contextual Home/Back controls;
- reverse child recession before pull-out, large camera retreat, parent entrance from below, and active-grey child-to-parent transfer;
- dormant child resolution, exact parent-state restoration, and direct Home return;
- nested artifact compatibility and standard, reduced-motion, responsive, density, mixed-interaction, recursive, console, and resource-lifecycle stabilization QA.

# 21. Deferred work

Preserve these open decisions:

- **Initial Reservoir Composition / Load Orientation**;
- final responsive/mobile translation and brand safe-zone formula;
- final artifact-window production styling, theme behavior, semantic colors, and typography;
- routing and browser-history integration;
- optional breadcrumb/path representation;
- production menu and footer;
- production content/data and media integration;
- accessible alternate representation;
- search, filtering, timeline, and long-term relational systems.

Milestone 5 and later work are not yet scoped. Do not build ahead into databases, CMS integration, accounts, admin tooling, or other speculative platform work without direct authorization.

# 22. Completion status

```text
Milestone 1 — Camera & Spatial Navigation: COMPLETE
Milestone 2 — Artifact Spatial Identity, Inspection & Selection: COMPLETE
Milestone 3 — Progressive Artifact Inspection & Opening: COMPLETE
Milestone 4 — COMPLETE (2026-08-13)
Recursive Collection Identity, Traversal & Navigation
Milestone 5+ — Not yet scoped
```

Version 0.4 is the implementation reference for future Digital Reservoir work. Preserve Milestone 3 as the closed artifact-opening contract and Milestone 4 as the closed recursive collection contract.
