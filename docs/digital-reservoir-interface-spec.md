# Digital Reservoir
## Interface & Experience Specification

**Version:** 0.4
**Status:** Foundational Design Specification / Living Document
**Established:** 2026
**Project:** kodyepugh.com
**Working concept:** *Digital Reservoir — A collection of all things Kodye Pugh*

---

# 0. Purpose and authority

This document defines what the Digital Reservoir interface does, how it behaves, and what its visual and spatial experience should communicate. It is a living specification: foundational principles should remain stable, current prototype decisions should be preserved until deliberately revised, and open decisions should remain visibly open.

When a historical description conflicts with validated repository behavior, the validated behavior is authoritative. Version 0.4 records the completed Milestone 4 recursive collection system while preserving the closed Milestone 1–3 interaction contracts.

# 1. Product model

The site is a spatial reservoir of artifacts produced by, observed by, or pertaining to Kodye Pugh. The current portfolio is the first public implementation of that broader idea.

The primary concepts are:

- **Artifact:** an individually inspectable object attached to a reservoir vertex.
- **Collection:** a container of artifacts and/or collections that may become a reservoir.
- **Reservoir:** the spatial representation of a collection; Home is the root collection.
- **Atmosphere:** the viewport region outside the sphere and an active information surface.
- **Artifact reading context:** a conventional semantic document opened above the spatial interface.
- **Control plane:** the stable screen-fixed identity and future navigation layer.

Foundational principles:

> **Collections change the world. Artifacts open windows.**

> **Every reservoir is a collection, and every collection can become a reservoir.**

> **Exploration is spatial. Inspection is immediate. Reading is conventional.**

> **First selection explains the artifact; second selection opens it.**

> **The atmosphere is an information surface, not empty decoration.**

> **The reservoir preserves continuity.**

> **The symbol is a stable identity anchor, not an artifact-loading mechanism.**

# 2. Artifact and collection identity

## 2.1 Artifacts

An artifact is represented by a colored node attached to a stable sphere-grid vertex. Its type, title, subtitle, date or date range, category/context, medium/format, and other concise supporting metadata may be presented when relevant. Empty fields are omitted rather than forced into the interface.

Artifact interaction uses progressive disclosure. Focus identifies an available object. First selection explains it without leaving the reservoir. Second selection of the active artifact confirms the intent to open its reading context.

## 2.2 Collections

Collections change spatial context rather than opening ordinary artifact documents. Home is the root collection rendered in its active-reservoir state:

```text
Home
=
root collection
=
active root reservoir
```

An embedded collection node is the same conceptual class of object rendered in dormant form. A dormant collection:

- is a black orb;
- is approximately twice the diameter of a standard artifact node;
- uses the same reservoir/grid visual language at a scale-appropriate reduced density;
- occupies a deterministic valid reservoir vertex;
- does not expose its children;
- avoids shells, secondary rings, unrelated internal lighting, and decorative internal topology. Its grid is the primary indication that it is another reservoir.

Dormant collections share the established node-label system: local-north anchoring, camera billboarding, horizon fade, backside hiding, direct-hover reveal, and a subtle white resting-hover treatment.

# 3. Stable reservoir composition

The reservoir is a large triangulated sphere whose scale exceeds the viewport. Visitors see only part of it at a time and traverse it through direct spatial input.

At every stable traversal depth, exactly one collection occupies the live main-reservoir role. The active collection uses the accepted active-grey material and detail-15 structural triangular grid, renders only its immediate artifact and collection children, owns reservoir navigation, and supplies the default active-collection atmospheric context. Dormant collections remain black, use their reduced grid, and reveal no descendants.

The Kodye Pugh symbol and wordmark remain a screen-fixed identity anchor. Their accepted desktop resting composition should be preserved while a final responsive safe-zone formula is developed. The symbol does not receive artifacts and does not orchestrate artifact opening.

The following opening concepts remain explicitly retired:

- orb extraction from its vertex;
- orb-to-symbol transfer;
- center-circle retraction or replacement;
- automatic sphere alignment to the artifact or symbol;
- ensō artifact-opening animation;
- lateral banner deployment.

# 4. Canonical Milestone 3 interaction loop

```text
Reservoir exploration
↓
focus artifact
↓
first selection
↓
accepted M2 selection treatment
+ selected label hides
+ artifact metadata replaces Home atmosphere
↓
selected artifact remains actionable
+ occasional radial reverb bounce and white continuation ring
↓
direct hover
↓
strong steady white hover emphasis
↓
second selection
↓
artifact-colored topology shockwave launches
+ sphere begins dimming
+ selected node begins embedding
+ camera begins coordinated withdrawal
↓
non-selected nodes react by surface-distance arrival
perk outward → sink completely beneath sphere
↓
selected node remains partially embedded and identifiable
↓
artifact reading context rises from below
↓
window rests beneath atmospheric artifact metadata
↓
artifact body scrolls normally in front of atmosphere
+ dark reading surface continuously covers reservoir
+ sticky close remains available
↓
close
↓
reading window retracts
↓
reservoir brightness and nodes restore
+ camera returns to exact pre-open state
↓
artifact returns to selected inspection state
+ selected metadata remains
↓
deselect when desired
↓
Home atmosphere returns
```

# 5. Focus and first selection

Focus uses a restrained white emphasis while preserving artifact color and identity. First selection:

- does not open long-form content;
- preserves camera position, camera travel/zoom, and sphere orientation;
- keeps the artifact attached to its vertex;
- uses the accepted Milestone 2 topology-aware selection treatment;
- hides the selected artifact's floating label;
- replaces Home atmosphere with semantic selected-artifact metadata.

The atmosphere owns the selected artifact's identity, title, subtitle, and high-level metadata. It is not empty decoration and it is not duplicated at the top of the artifact body.

# 6. Selected continuation affordance

While an artifact remains selected, an occasional radial reverb-style bounce and settle communicates that another interaction is available. A thin white ring emerges from the node mesh with that movement.

The cue:

- travels along the node's local radial axis;
- may occur while the user traverses the sphere;
- does not require an idle camera or reservoir;
- stops or cancels during opening and deselection transitions;
- is shortened or reduced to a restrained non-disruptive treatment under reduced motion.

Directly hovering the selected node uses a stronger **steady** white glow. It does not pulse and does not emit extra hover rings. The former selected-hover pulse is retired.

# 7. Second selection and opening impact

Second selection of the active artifact is one causal event. It captures the exact pre-open reservoir state, suppresses conflicting input, and begins these overlapping effects:

```text
artifact-colored topology shockwave
+ sphere dimming
+ selected-node embedding
+ wave-ordered non-selected-node recession
+ camera withdrawal
```

The shockwave follows existing mesh/topology relationships and uses the artifact's color. It need not visibly wrap the entire sphere. Reaction order follows topological/geodesic surface distance so nearby nodes react before farther nodes.

Each non-selected node reacts at wave arrival:

```text
brief radial perk
↓
complete recession beneath the sphere surface
```

The activated node does not disappear or move to another vertex. It sinks to a partially embedded open-state depth and remains visibly identifiable through its artifact color.

# 8. Camera behavior and continuity

Before opening, the interface captures the exact current spatial state, including the camera position, target, quaternion, camera travel/zoom progress, sphere quaternion/orientation, selected artifact ID, and other navigation state required for deterministic restoration.

During opening, the camera withdraws toward the established Milestone 1 atmospheric/outer view as part of the recession event. The sphere orientation is not reset, and the sphere is not automatically rotated toward the artifact, identity mark, or any canonical default. Milestone 1 rim, pole, clearance, and roll safeguards remain in force.

On close, the exact saved pre-open state is restored. Close does not return the reservoir to a default orientation.

# 9. Artifact reading context

## 9.1 Preparation and deployment

Artifact content is staged during opening. The semantic reading context rises from below the viewport and initially rests directly beneath the selected atmospheric metadata. The current desktop prototype tunes this relationship to approximately 16px; it is a validated current value rather than an immutable system constant.

The atmosphere acts as the artifact's external identity/header. The artifact body begins with actual body content and does not repeat the full title/metadata block.

## 9.2 Document behavior

The reading context uses conventional browser document scrolling. The artifact body moves in front of the atmospheric metadata; the atmosphere is not a sticky reading header. While reading, wheel and trackpad input scroll the document rather than navigating the sphere, and reservoir drag/wheel input remains disabled.

The current prototype uses the site's dark visual language:

- a dark editorial surface;
- light readable typography;
- restrained borders and dividers;
- clear link and focus contrast.

This is not the final production theme system. A potential light theme, automatic system/device adaptation, final semantic color system, and final production typography remain deferred.

## 9.3 Continuous coverage

A fixed, continuous dark reading surface remains above the WebGL reservoir for the full reading lifecycle, including deployment and retraction. The moving document remains above that surface. Rapid, inertial, reversed-direction, and boundary scrolling must not expose the reservoir beneath.

## 9.4 Close control

The close control is explicit, semantic, keyboard accessible, and independent of the Kodye Pugh symbol. It remains sticky near the viewport top while long content scrolls. Escape closes the artifact where supported. Focus treatment must remain visible against the dark document surface.

# 10. Close and deterministic restoration

```text
close
↓
reading input disabled
↓
context window retracts below viewport
↓
reading coverage exits at the correct lifecycle point
↓
sphere brightness and non-selected nodes restore
↓
selected node returns to normal selected depth
↓
camera returns to exact saved pre-open state
↓
reservoir input restores
↓
artifact remains selected
+ selected metadata remains in atmosphere
```

Only deselection restores Home atmosphere. Reservoir input remains suppressed until deterministic restoration completes.

# 11. Input ownership by state

## Reservoir — no artifact selected

```text
drag      traverse/rotate
wheel     camera travel/zoom
hover     focus
click     first-select
```

## Reservoir — artifact selected

```text
drag                    traverse/rotate
wheel                   camera travel/zoom
hover selected node     strong steady white emphasis
second click selected   open artifact
```

The occasional continuation bounce/ring may occur during traversal.

## Opening

Opening owns the scene. Reservoir pointer, drag, and wheel input are suppressed.

## Reading

```text
wheel/trackpad    normal document scrolling
keyboard          normal document navigation
pointer           document interaction
Escape/close      exit artifact
```

## Restoration

Reading input is disabled and reservoir input remains suppressed until the saved spatial state is restored.

# 12. Accessibility and responsive direction

Semantic metadata and document content must remain available outside the canvas. Selection cannot rely exclusively on hover. The reading context uses semantic headings, links, controls, focus indication, and keyboard dismissal. Reduced motion shortens or removes nonessential movement without changing state semantics, coverage, close availability, or restoration correctness.

Mobile interaction and a complete alternate accessible representation remain open work. They must not be inferred from the desktop prototype without deliberate design and validation.

# 13. Density and validation tooling

Production defaults to the five canonical artifacts. Development can enable a deterministic 24-node density harness with:

```text
NEXT_PUBLIC_RESERVOIR_DENSITY_TEST=1
```

The harness is development-only. Milestone 3 validation confirmed all 24 nodes retained stable vertex placement through opening, topology-distance recession, reading, close, and exact restoration. It remains available for future spatial and transition stress testing.

# 14. Collection selection

## 14.1 First selection

First selection inspects a collection without entering it:

```text
rest
↓
first selection
↓
press / bounce
+ selected topology propagation
+ lower selected depth
↓
selected inspection state
```

The selected collection remains a black gridded body. It holds the selected depth and receives surrounding selected faces, bright edges and spokes, radial gradation strongest near the node, an occasional selected idle bounce and ring, label suppression, collection metadata in the atmosphere, and restrained white direct-hover confirmation.

## 14.2 Second selection

Second selection confirms traversal:

```text
second selection
↓
selected topology retracts inward
↓
outer selected faces and edges lose selection first
↓
selected mesh is sucked completely into the collection node
↓
external selected topology reaches zero
↓
collection traversal proceeds
```

There is no second-selection topology spin, detached topology geometry, outward mesh bounce, or physical extraction of the collection orb.

# 15. Forward collection traversal

The implemented forward sequence is:

```text
selected dormant collection
↓
second selection / topology suction
↓
current active parent's remaining child nodes submerge
except the destination collection
↓
camera begins collection-entry traversal
+ active grey transfers parent → destination
↓
destination black → active grey
+ destination dormant grid → active detail-15 grid
↓
previous parent becomes hidden and non-participatory
↓
camera establishes destination in active-reservoir framing
↓
destination immediate children emerge from beneath its surface
↓
normal reservoir interaction restores
```

Collection entry is camera-driven. The destination collection remains fixed in world space and does not physically enlarge or move; its apparent enlargement comes from camera approach. The camera uses an upward, concave-up swoop that intentionally differs from the normal local concave-down inward reservoir dive. It preserves pole, rim, and near-overhead stability, avoids roll, and ends in the normalized active-reservoir relationship.

Active grey indicates the active collection rather than a content category. Forward traversal transfers that state from parent to child. The destination ends with the same active-grey material as Home, while the previous parent loses active status. Dormant collection presentation uses the reduced scale-appropriate grid; active presentation uses detail 15 without redefining the collection as a different geometry class.

Only an active collection surfaces children. After activation, its immediate artifact and collection children rise from beneath the surface and settle at deterministic vertices before labels, hover, and interaction become available. Grandchildren remain hidden.

# 16. Recursive rendering, history, and controls

> **Recursive collection depth is preserved as state, not accumulated as visible geometry.**

At stable depth, the only interactive spatial tree is:

```text
active collection
+ its immediate child nodes
```

Previously active ancestors remain preserved in navigation state but are not visible active reservoirs, raycastable objects, grids, labels, or child-node trees. They do not interfere with camera traversal or atmospheric visibility.

Traversal history is an ordered collection of frames conceptually equivalent to:

```typescript
collectionHistory = ["home", "work", "data"];
activeCollectionId = "data";
```

The implementation preserves the collection identity and the parent information required for deterministic return: sphere orientation, camera position/target/quaternion and travel relationship, local inspection context, selected destination, active outer frame, and related traversal state. Node placement remains deterministic content/geometry data rather than duplicated visible ancestry.

Contextual Home and Back controls are semantic UI-space controls, not WebGL nodes:

```text
depth 0  → no controls
depth 1  → Home
depth 2+ → Home + Back
```

Home returns directly to the root from any depth without activating intermediate ancestors. Back returns to the immediately preceding collection and restores its actual preserved orientation and camera relationship rather than a canonical default.

# 17. Reverse collection traversal

The first reverse beat is mandatory: the current active collection's immediate children submerge before the major camera pull-out begins.

```text
Home / Back
↓
input locks
↓
current active collection's immediate child nodes submerge
↓
current collection surface clears
↓
camera begins larger collection-scale pull-out
↓
target parent enters naturally from the bottom through perspective
↓
active grey drains child → target parent
↓
current child resolves to dormant black collection node
+ active grid resolves to dormant grid
↓
target parent becomes active-grey detail-15 reservoir
↓
camera settles into preserved parent framing
↓
parent immediate children restore
↓
normal interaction restores
```

> **Reverse traversal is a camera retreat through the collection hierarchy, not a sphere morph.**

The target parent is restored at its preserved spatial relationship and enters primarily from below rather than popping into its final frame. The current child remains a distinct object, becomes smaller through perspective, and resolves to its dormant black/grid state; it does not morph into the parent.

Back restores one level. Direct Home first recedes the current collection's immediate children, retreats to Home as the sole target, leaves intermediate ancestors hidden, transfers active grey to Home, restores Home's children, and collapses history to the root.

# 18. Nested artifact compatibility

Artifact interaction is active-collection-relative, not Home-specific. Artifacts within any active nested collection retain the completed artifact focus, first selection, second-selection opening, semantic reading, close, and exact restoration loop.

# 19. Milestone 4 completion record

## Milestone 4 — Recursive Collection Identity, Traversal & Navigation: COMPLETE

Completed 2026-08-13. The checkpoint includes:

- Home/root unified with the collection model;
- shared active/dormant reservoir identity, black dormant collection orbs, adaptive dormant grid, and detail-15 active grid;
- collection label and hover integration;
- collection first selection and inward second-selection topology suction;
- concave-up camera-driven forward traversal, parent-child recession, and active-grey parent-to-child transfer;
- hidden-ancestor rendering, destination activation, immediate-child emergence, and recursive forward traversal;
- preserved collection-history frames and contextual Home/Back controls;
- reverse child recession before a larger camera retreat, parent entrance from below, and active-grey child-to-parent transfer;
- dormant child restoration, exact preserved parent-state restoration, and direct Home return from recursive depth;
- standard, reduced-motion, responsive, density, mixed-interaction, recursive, console, and resource-lifecycle stabilization QA.

# 20. Deferred and open decisions

The following remain intentionally unresolved:

- **Initial Reservoir Composition / Load Orientation**;
- final responsive/mobile translation and brand safe-zone formula;
- final artifact-window production styling, theme system, semantic colors, and typography;
- routing and browser-history integration;
- optional breadcrumb/path representation;
- production menu and footer;
- production content/data and media integration;
- accessible alternate representation;
- search, filtering, timeline, and long-term relational systems.

Milestone 5 and later work are not yet scoped.

# 21. Milestone status at Version 0.4

```text
Milestone 1 — Camera & Spatial Navigation: COMPLETE
Milestone 2 — Artifact Spatial Identity, Inspection & Selection: COMPLETE
Milestone 3 — Progressive Artifact Inspection & Opening: COMPLETE
Milestone 4 — COMPLETE (2026-08-13)
Recursive Collection Identity, Traversal & Navigation
Milestone 5+ — Not yet scoped
```

Milestone 3 remains the closed stable artifact-opening checkpoint. Milestone 4 adds the closed recursive collection identity, traversal, and navigation contract without changing that administrative status.

# 22. Canonical summary

The Digital Reservoir is a recursive spatial body of artifacts and collections. Home is the root collection, and the sole active collection at each depth is rendered as the active-grey detail-15 reservoir with only its immediate children. Dormant collections remain black reduced-grid nodes that can be inspected once and entered on confirmation.

Artifacts open conventional reading windows relative to whichever collection is active. Collections change the world through camera-driven forward and reverse traversal, active-grey and grid handoff, preserved hierarchical state, hidden ancestors, deterministic child emergence/recession, and contextual Home/Back navigation. Spatial continuity is preserved without accumulating recursive geometry.
