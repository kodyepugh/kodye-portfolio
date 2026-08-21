# Digital Reservoir
## Interface & Experience Specification
**Version:** 0.7 — Resource Ontology + Public Launch Alignment
**Status:** Foundational Design Specification / Living Document — V2 + Query Reservoir baseline preserved / L2 launch preparation
**Established:** 2026
**Project:** kodyepugh.com
**Working concept:** *Digital Reservoir — A collection of all things Kodye Pugh*

---

# 0. Purpose of This Document

This document defines the conceptual, visual, spatial, behavioral, and technical foundations of the Digital Reservoir interface.

It is intended to serve as the central reference for:

- product and interaction design;
- visual design;
- prototyping;
- frontend implementation;
- 3D implementation;
- responsive design;
- accessibility;
- content architecture;
- artifact and collection modeling;
- animation behavior;
- future database integration;
- testing and iteration;
- instructions given to ChatGPT, Codex, or other development tools.

This document should be treated as a **living specification**, not an immutable contract.

### Current semantic-authority note

The authoritative persistent object model is defined by `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md` revision 0.7.1.

Where older sections of this specification use `Artifact`, `Asset`, `Source Record`, or `Inspection Window` as if they were peer entity classes, interpret them through the current ontology:

- persistent `Object = Collection | Resource`;
- Artifact is reversible curatorial status on a Resource;
- Asset and Source describe supporting/provenance roles or implementation records rather than mandatory peer public Object classes;
- Resource inspection is provided by the shared `InspectionWindow`, with renderer selection driven by `inspectionKind`;
- public routing/deep links map onto stable Object identity and do not redefine that identity.

Historical interaction language remains useful where it describes accepted behavior, but it must not override the current ontology.

However, not every decision carries equal weight.

Throughout the specification, decisions fall into three conceptual tiers.

### Foundational Principle

A rule that expresses the identity or logic of the system.

These should not be changed casually because multiple parts of the interface depend upon them.

### Current Specification

The intended implementation based on the present design.

These decisions should be tested through prototypes and may evolve.

### Open Decision

An area intentionally left unresolved until visual, technical, or usability testing provides enough evidence to choose.

## 0.1 Official Closure Baseline

The Query Reservoir feature branch is formally closed for this development phase.

This specification captures the approved implementation baseline and should not be read as authorization to reopen deprecated spatial or navigation models.

The approved runtime contract is:

- one authoritative `activeLayout` at rest;
- one ephemeral `transitionPlan` during a transition, then `null` again on completion;
- collection and query changes share the same exchange choreography: departure → semantic handoff → arrival;
- visit-based Reservoir history is separate from geometry and must not depend on reusable historical geometry snapshots;
- direct single-result Query Reservoirs use the canonical viewport-relative focal anchor regardless of global Distributed / Focused preference;
- query ancestry remains directional through `returnContext`, while the unified Reservoir history coordinator makes `Back` the immediately preceding Collection or Query visit;
- `Home` always returns to the root reservoir;
- `Explore` filter state belongs to the reservoir context, so a new Query Reservoir starts at `All` unless its own context is being restored;
- staying nodes remain stationary, leaving nodes sink, entering nodes emerge, and an empty target uses the red reservoir response rather than destroying state;
- direct Resource requests auto-select at canonical focal arrival and automatically open the Resource Inspection surface.

---

# 1. Product Vision

## 1.1 The Digital Reservoir

The website is not primarily conceived as a conventional portfolio composed of hierarchical pages.

It is conceived as a **digital reservoir of artifacts pertaining to, produced by, observed by, or collected by Kodye Pugh**.

Artifacts may eventually include:

- professional case studies;
- analytical projects;
- websites;
- films;
- photographs;
- paintings;
- writing;
- notes;
- observations;
- links;
- research;
- media;
- experiments;
- personal records;
- references;
- unfinished fragments;
- completed works;
- collections;
- external resources;
- future artifact types not yet anticipated.

The interface should therefore feel less like navigating a corporate website and more like **exploring a structured body of objects**.

The current professional portfolio is the first public implementation of this larger idea.

---

# 2. Foundational Conceptual Model

The current conceptual units are:

1. **Object**
2. **Collection**
3. **Resource**
4. **Artifact status**
5. **Query Reservoir**
6. **Reservoir**
7. **Inspection Window**
8. **Control Plane**

The semantic model is relational rather than a fixed hierarchy.

```text
OBJECT
├── COLLECTION
└── RESOURCE
      └── may hold ARTIFACT STATUS
```

Artifact is not a peer Object type beside Collection and Resource. It is curatorial status granted to a Resource when persistent Collection membership is useful.

For interface shorthand, this specification may still say "artifact" when referring to an Artifact-status Resource already participating persistently in the portfolio.

### Foundational rule

> **Addressability is universal. Membership is selective.**

## 2.1 Resource and Artifact Status

A Resource is an independently addressable, inspectable content-bearing Object.

Examples include:

- Bellabeat case study;
- resume;
- photograph;
- essay;
- film;
- external link;
- repository;
- notebook;
- project;
- painting;
- observation;
- document.

A Resource may remain non-Artifact while still being directly queryable and inspectable.

When a Resource is granted Artifact status, it becomes eligible for persistent Collection membership and therefore for persistent Reservoir placement.

Within the spatial interface, an Artifact-status Resource is represented by an orb positioned in continuous spherical space independently from the reservoir's render-mesh vertices.

Artifact-status interaction uses progressive disclosure:

1. first selection keeps the visitor in the Reservoir and exposes richer Resource information in the atmosphere;
2. second deliberate selection opens the Resource's type-appropriate Inspection Window.

Selecting an Artifact-status Resource does not transform the Reservoir into another persistent Reservoir.

### Foundational rule

> **Resources are inspected. Artifact status determines persistent curation.**

## 2.2 Collection

A Collection is a persistent curated Object that may contain:

- Collections;
- Artifact-status Resources.

A Collection is represented in the Reservoir as a sphere-like node.

Selecting a Collection changes the active persistent Reservoir context rather than opening a conventional page.

Supporting Resources without Artifact status do not receive ordinary Collection membership merely because they support another Resource.

### Foundational rule

> **Collections change the world.**

## 2.3 Query Reservoir

Queries answer "show me what matches."

A Query Reservoir is an ephemeral navigation context created from a query result set. It is not a stored Collection Object and does not alter Resource identity, Artifact status, or Collection membership.

A Query Reservoir may contain:

- 0 results;
- 1 result;
- N results.

A direct Resource request resolves through a temporary Query Reservoir. A directly addressed Collection resolves to that Collection's persistent Reservoir.

Direct single-result queries use the canonical viewport-relative focal placement. Direct Resource requests, whether or not the Resource has Artifact status, auto-select on arrival and open the Resource Inspection surface.

Every Collection or Query arrival appends a visit-specific frame to one ordered Reservoir history. Back selects the immediately preceding frame; selecting any older visible frame performs one direct transition and truncates the later branch. Query `returnContext` remains valid semantic ancestry for transition helpers. Home returns directly to the root Reservoir, resets active history to root, and discards pending Inspection resume state.

### Foundational rule

> **Collections organize. Queries retrieve. Inspection reveals.**

## 2.4 Reservoir

A Reservoir is the spatial presentation of an active persistent Collection or an active ephemeral Query context.

For persistent Collection context:

```text
Home Reservoir = Root Collection
```

Root and nested Collections use the same recursive spatial system.

Query Reservoirs reuse the spatial presentation system without becoming persistent Collections.

## 2.5 Inspection Window

Long-form or type-specific Resource consumption remains conventional 2D UI rather than being forced into WebGL.

The shared Resource-oriented `InspectionWindow` chooses a renderer from the Resource's `inspectionKind`.

Implemented launch surfaces include:

- structured document;
- image;
- external link/repository;
- the notebook/code treatment required by Bellabeat.

The atmosphere owns concise Resource identity/metadata. The renderer owns primary content. After primary content, the shared Inspection context tray presents Resources and Collections as separate vertical regions rather than alternate tabs. Every inspected Resource may receive Resource context regardless of Artifact status: outgoing stored support edges appear as `Supported by`, incoming edges appear as `Supports`, and the four-row shelf receives an interactive direction control only when both sets are non-empty. Collections appear below as simple pills derived only from actual persistent memberships. Empty regions are omitted.

### Foundational rule

> **Exploration may be spatial. Inspection and reading should remain natural.**

### 2.5.1 Shared Inspection Image Viewer

Inspectable images are presentation controls within the shared `InspectionWindow`, not separate semantic Objects, Query Reservoirs, or history visits. The Inspection renderer supplies an ordered sequence of image occurrences actually presented by the currently inspected Resource. Sequence positions are occurrence-based, so the same image may occupy more than one position when the content presents it more than once.

Clicking or keyboard-activating a valid standalone image, structured-document figure, or notebook image output opens the shared viewer above the current Inspection without changing its reading position. The viewer fits the selected image to the viewport, preserves aspect ratio, and provides bounded zoom, centered reset, optional captions, previous/next controls, and a current-position indicator. At fit scale, horizontal touch or pointer gestures navigate between sequence positions; above fit scale, the same gesture pans the current image and cannot accidentally navigate away. Pinch and wheel zoom are owned by the viewer while it is open.

The viewer traps focus within its controls, gives Escape first ownership to the viewer, restores focus to the launching image control on close, and locks the underlying document scroll without changing the Inspection's saved reading state. Image magnification is distinct from Resource navigation: clicking a figure enlarges the presented image and does not navigate to the figure Resource. Sequence changes reset the destination image to fit and centered pan; bounds do not wrap. Reduced-motion preferences remove nonessential viewer motion.

## 2.6 Persistent Control Plane

The conventional website header is inverted.

The persistent interface control plane is located at the **bottom of the viewport**.

It contains the identity system and contextual controls.

Its central anchor is the Kodye Pugh symbol and wordmark.

The control plane may expand, lift, transform, or reveal contextual information without losing its central identity.

---

# 3. Core Experience Principles

## 3.1 Spatial Exploration, Conventional Consumption

The visitor discovers content through a spatial interface.

The visitor receives useful artifact context before opening long-form content, then consumes substantial content through familiar scrolling interfaces.

```text
EXPLORE
spatial

SELECT
inspect in atmosphere

SELECT AGAIN
open

READ
conventional
```

The system should minimize the barrier between encountering an artifact and understanding what it is.

The system should never require a visitor to manipulate 3D geometry in order to read long-form information.

## 3.2 Interface Motion Must Have Meaning

Motion should communicate:

- position;
- hierarchy;
- state change;
- selection;
- entry;
- exit;
- activation;
- containment;
- relationship.

Decorative movement should be restrained.

Avoid:

- arbitrary bouncing;
- meaningless floating;
- excessive parallax;
- movement added solely because 3D technology allows it.

### Motion taxonomy

Motion belongs to one of three classes:

#### Spatial motion

Movement caused by navigating the world.

Examples:

- sphere rotation;
- zoom;
- collection traversal;
- orb extraction.

#### Mechanical motion

Movement caused by interface state changes.

Examples:

- bottom header lifting;
- menu reveal;
- footer exposure;
- content window deployment;
- enso rotation.

#### Ambient motion

Extremely subtle activity suggesting that the environment is alive.

Examples:

- glow modulation;
- minimal atmospheric movement;
- very slow lighting variation.

Ambient motion should never compete with intentional motion.

---

## 3.3 Branding Is Functional

The Kodye Pugh symbol and wordmark form the persistent identity anchor of the bottom control plane.

The symbol should remain visually stable through ordinary reservoir exploration and artifact inspection. It does not need to perform artifact intake, orb-transfer, or loading animations in order to justify its presence.

Its functional role is primarily to:

- anchor the persistent control plane;
- establish system identity;
- provide a stable spatial reference;
- host or align with future contextual controls such as Home where appropriate.

The currently accepted resting scale and position of the symbol should be preserved as the desktop reference composition and translated responsively across viewports using explicit safe-zone and sizing rules rather than arbitrary per-device offsets.

### Current specification

Do not animate the center circle, pillars, ensō, or wordmark as part of artifact activation unless a future design decision explicitly reintroduces such behavior.

## 3.4 Preserve Spatial Continuity

Entering or inspecting content should not make the visitor feel as though the previous environment was destroyed.

The interface should preserve:

- current collection;
- sphere orientation;
- zoom state;
- selected spatial context;
- navigation depth.

When an artifact closes, it should return the visitor to the same state from which it was selected.

---

## 3.5 The 3D Layer Must Enhance, Not Gatekeep

The spatial reservoir is a presentation and exploration system.

It must never become the only means of reaching important content.

Alternative navigation should exist for:

- keyboard users;
- assistive technology;
- reduced-motion users;
- low-performance devices;
- visitors who prefer conventional navigation.

---

# 4. Overall Interface Architecture

The interface consists of multiple persistent coordinate spaces and visual layers.

---

# 4.1 Coordinate Spaces

Three conceptual spaces exist.

## World Space

Contains environmental information surrounding the reservoir.

Examples:

- Digital Reservoir title;
- establishment year;
- descriptive memoir;
- highlighted artifacts;
- atmospheric graphics.

This layer does not rotate with the reservoir.

---

## Sphere Space

Contains the active reservoir.

Examples:

- sphere geometry;
- reservoir surface;
- vertices;
- artifact nodes;
- collection nodes;
- labels attached to nodes.

Sphere-space objects transform together when the sphere rotates.

---

## UI Space

Contains screen-fixed interface controls.

Examples:

- bottom control plane;
- title;
- subtitle;
- menu;
- footer;
- home control;
- close button;
- content inspection window.

UI-space objects do not rotate with the reservoir.

---

# 4.2 Layer Stack

Conceptual visual stack:

```text
L5  ARTIFACT / INSPECTION WINDOW
    Long-form artifact content; enters above the reservoir interface

L4  ENVIRONMENTAL INFORMATION
    Home memoir or selected-artifact metadata in atmospheric space

L3  RESERVOIR / SPHERE
    Reservoir surface, artifacts, collections

L2  ENVIRONMENT / ATMOSPHERE
    Background field and atmospheric graphics

L1  PERSISTENT BOTTOM CONTROL PLANE
    Symbol, wordmark, contextual controls

L0  MENU / FOOTER REVEAL LAYERS
    Positioned beneath movable control plane
```

Actual CSS/WebGL z-order may differ according to implementation requirements.

The Inspection Window must visually enter **above the reservoir interface**, while still feeling like it rises from below the viewport. The selected-artifact metadata belongs to the atmospheric information layer rather than the node-label layer.

# 5. Home Reservoir State

The Home Reservoir is the default landing state.

Conceptually:

```text
┌──────────────────────────────────────────────────┐
│                                                  │
│                DIGITAL RESERVOIR                 │
│                   EST. 2026                      │
│       A collection of all things Kodye Pugh      │
│                                                  │
│            ○        ○        ○                   │
│           highlighted artifacts                  │
│                                                  │
│                  _________                       │
│               .-'         '-.                    │
│             .'               '.                  │
│            /    ●───●───●      \                 │
│           |    / \ / \ / \      |                │
│           |   ●───●───●───●     |                │
│            \       \ /          /                 │
│             '.      ●        .'                   │
│               '-._________.-'                     │
│                                                  │
├──────────────────────────────────────────────────┤
│                       ◉                          │
│                   KODYEPUGH                      │
└──────────────────────────────────────────────────┘
```

---

# 6. Bottom Control Plane

## 6.1 Default Position

The bottom control plane is fixed to the lower edge of the viewport under normal conditions.

The Kodye Pugh symbol is:

- horizontally centered;
- vertically centered relative to the header region;
- aligned so that its horizontal center corresponds with the top edge relationship originally defined by the visual identity composition.

The Kodye Pugh wordmark rests beneath the symbol.

The center identity block should remain the visual anchor of the interface.

---

## 6.2 Default Contents

Default reservoir state:

```text
            SYMBOL
          KODYEPUGH
```

Avoid cluttering the default control plane with unnecessary navigation labels.

Contextual controls should appear only when relevant.

---

## 6.3 Artifact-Open Contents

When an artifact is open, the symbol and wordmark remain the stable center identity block.

Artifact title and descriptive metadata are not required to expand laterally from the symbol. Their primary preview location is the atmospheric information region during the selected state, while the opened Inspection Window owns the full reading hierarchy.

A close control belongs to the Inspection Window.

A future Home control may occupy the reserved space beneath the symbol/wordmark, but its semantics remain unresolved.

Avoid turning the control plane into an animated artifact-loading mechanism.

## 6.4 Header Movement Principle

The bottom header behaves like a **movable plate**.

The menu and footer exist underneath it.

The header moves vertically to expose them.

This is preferable to treating each state as an unrelated drawer or modal.

---

# 7. Menu Behavior

## 7.1 Opening

Selecting the menu control causes the bottom control plane to slide upward.

The menu is revealed beneath it.

Concept:

```text
MAIN VIEW

HEADER
↑
MENU
```

The menu itself should remain anchored underneath.

The header is the moving element.

---

## 7.2 Menu Purpose

The menu should not merely duplicate traditional site navigation.

It should provide **alternative traversal modes** for the reservoir.

Potential menu architecture:

```text
EXPLORE

All Objects
Collections
Work
Self
World
Inquiry

INDEX

Search
Timeline
Categories

DIRECT

About
Resume
Contact
```

Final menu taxonomy remains an open design decision.

---

## 7.3 Menu Closing

Closing the menu causes the control plane to descend and cover the menu.

If the footer is independently exposed, menu closure must not hide the footer.

---

# 8. Footer Behavior

## 8.1 Footer Exposure

The visitor can reach the environmental bottom of the interface.

At this point the bottom control plane lifts, exposing the footer beneath it.

Conceptually:

```text
MAIN VIEW

HEADER
↑
FOOTER
```

The footer itself should not move upward unnecessarily.

The control plane reveals it.

---

## 8.2 Returning Upward

When the visitor moves upward away from the bottom boundary, the control plane descends and covers the footer.

---

## 8.3 Footer Contents

Likely footer information:

- copyright;
- LinkedIn;
- GitHub;
- email/contact;
- optional site credits;
- optional technology statement.

Final content is not yet locked.

---

# 9. Menu + Footer Edge Case

Menu visibility and footer visibility are independent states.

If the footer is already exposed and the menu is opened:

```text
HEADER
MENU
FOOTER
```

If the menu is subsequently closed:

```text
HEADER
FOOTER
```

The footer remains visible because the user's environmental position has not changed.

The implementation must therefore **not** treat bottom-panel state as one mutually exclusive variable.

Conceptually:

```javascript
menuOpen: boolean
footerVisible: boolean
```

rather than:

```javascript
bottomPanel: "menu" | "footer" | "closed"
```

---

# 10. Reservoir Geometry

## 10.1 Persistent Centered Reservoir

The active reservoir is a persistent spherical reference frame centered in the usable reservoir viewport.

The reservoir should no longer be composed as a sphere intentionally displaced toward the lower portion of the screen in order to create a dedicated atmospheric band above it. The sphere itself is the primary spatial reference and should remain geometrically centered within the visual frame available to reservoir exploration.

The surrounding atmosphere, metadata, control plane, Inspection Window, menu, and footer should compose around this centered reference rather than determine its world-space position.

### Foundational rule

> **The reservoir stays centered. Navigation changes orientation, scale, resolution, and semantic state — not the reservoir's role as the visual reference frame.**

## 10.2 Sphere Scale

The rendered reservoir has a visual radius derived from:

- viewport dimensions;
- reserved UI safe zones;
- current zoom level;
- responsive constraints.

Conceptually:

```text
R = f(viewport, safeZones, zoom)
```

The sphere may become larger than the viewport at close zoom levels. This is expected. Its center remains stable even when its edges extend beyond the frame.

## 10.3 Clean Reservoir Surface

V2 allows a dense triangular surface pattern, but only as presentation.

The reservoir should still read as a continuous spherical field rather than as semantic topology. The underlying sphere mesh remains an implementation detail used to render the surface, and the visible triangular pattern must not be presented as node identity, node placement, or layout structure.

The surface should retain enough visual information to communicate:

- spherical form;
- depth;
- orientation during rotation;
- scale during zoom;
- darkened/receded artifact-open states.

Preferred cues include restrained lighting, material gradients, shading, node motion across the surface, and other low-noise depth treatments.

Do not promote the presentation-only pattern into semantic structure merely to make rotation easier to perceive. If orientation becomes ambiguous, solve that with surface/material treatment rather than changing the approved presentation-only pattern unless a future explicit design decision reauthorizes one.

### Foundational rule

> **The reservoir may use a dense triangular presentation pattern, but it is presentation-only. Render topology is an implementation detail, not a semantic layout layer.**

## 10.4 Layout vs Render Mesh

V2 distinguishes node layout from the underlying sphere geometry used to render the reservoir.

### Layout

Determines where node positions are distributed across continuous spherical space.

Its job is to answer:

> Where should the current collection's nodes live on the reservoir?

### Render mesh

Provides the geometric surface required to draw the sphere.

Its tessellation has no semantic meaning and must not determine artifact identity, collection membership, node placement, spacing, or future migration.

Layout must remain independent from render-mesh vertex identity so the sphere geometry can be replaced or tuned for performance without redefining artifact positions.

## 10.5 Initial Reservoir Composition

The initial composition is generated rather than hand-authored around permanent vertex assignments.

The collection layout engine should:

1. inspect the current node population;
2. determine an appropriate starting density;
3. generate deterministic spherical positions with adequate spacing;
4. choose a useful initial orientation;
5. preserve genuine spherical distribution rather than forcing all objects onto the front hemisphere.

The starting orientation should expose a meaningful visible population while retaining the expectation that rotation reveals additional content.

The exact visible-population target remains open and should be evaluated through usability testing.

## 10.6 Population-Aware Node Sizing

Node sizing is a separate world-space concern from layout placement.

The approved sizing curve is continuous and population-aware:

- 1-2 nodes render at `7.0×`;
- 6 nodes taper to `5.5×`;
- 24 nodes return to `1.0×`;
- denser collections continue with the inverse-square-root tail rather than an artificial floor.

Layout safety may proportionally reduce the resulting size when actual mixed-radius spacing requires it, but the curve itself does not impose a minimum size cap.

V2 also introduces adaptive inspectability. `2.15` is the ordinary baseline maximum; `4` is an absolute MVP guard, not the derived safety model. The active maximum may increase only when a smaller resolved node kind actually exists in the active semantic collection and needs more resolution. The node-inspectability target is `24px`, separate from label thresholds, and the required zoom is solved at the canonical viewer-facing center rather than from the current reservoir orientation. The active maximum is independent of rotation, remains below the responsive transform-safe maximum, and exposes whether the `24px` target is reachable. The transform-safe maximum accounts for camera-space depth, the near plane, responsive base scale, the sphere radius, the largest active node body, node center elevation, and a camera-clearance margin.

# 11. Nodes

## 11.1 Artifact Node

An artifact node is represented as a mini sphere/orb located at a continuous spherical surface position generated for the active collection.

Potential visual properties:

- neutral physical body;
- category-based glow;
- center icon;
- hover/focus halo;
- label;
- selection state.

---

## 11.2 Collection Node

Collection nodes should remain recognizably related to artifact nodes while indicating that they contain another environment.

Possible differences:

- subtle contained-depth cue;
- secondary ring;
- shell;
- different internal lighting;
- subtle internal spatial cue;
- subtle animation.

The collection node should not become visually louder than every artifact merely because it is a collection.

---

## 11.3 Node Labels

Artifact labels may float near or slightly in front of nodes.

The V2 label MVP should resolve labels per node instead of through one global zoom toggle. Labels use `hidden`, `inspection`, and `persistent` levels. Inspection labels require active inspection intent such as pointer hover; persistent labels do not require hover. Projected node size controls presentation with hysteresis; raw zoom is not an independent label gate, so sparse large nodes may retain persistent labels at minimum zoom. Selected-node labels remain hidden. A node label is a screen-space annotation constrained by the actual child-node sphere and parent-reservoir sphere: child visibility uses sphere occlusion, labels remain on the reservoir-exterior side, and viewport composition can influence placement but cannot override that surface constraint. Placement uses an outward candidate fan rather than a 180-degree reservoir-facing fallback, correct ray-to-rectangle support distance, full safe-bound containment when physically possible, and camera-side surface-aware anchoring. Eligible labels render as whole foreground annotations rather than being depth-fragmented by the reservoir. Labels keep upright canvas sprites at an approximately `52px` target height, and a dynamic narrow hover bridge follows the actual node-edge-to-label-edge path. Full collision solving, leader lines, and richer label tiers remain deferred.

Default state may show:

- no label;
- abbreviated label;
- selected subset.

Focus state may reveal:

- title;
- category;
- short descriptor.

Avoid displaying long descriptions in sphere space.

---

# 12. Node Focus State

Hover, keyboard focus, or equivalent inspection intent should create a low-intensity focus state.

Current behaviors may include:

- subtle white hover treatment;
- label visibility;
- cursor-responsive surface inspection;
- preservation of artifact color;
- no dramatic camera movement.

Focus represents inspection intent, not selection.

## 12.1 Artifact Selected State

The first deliberate selection of an artifact creates an intermediate inspection state without opening long-form content.

When an artifact becomes selected:

- preserve the accepted Milestone 2 selected-node animation and selected surface-response treatment where compatible with the grid/topology removal;
- replace the default Home atmospheric information with detailed information for the selected artifact;
- hide the floating label above the selected node because the atmosphere now carries the richer identity information;
- keep the selected artifact anchored to its established spherical position;
- keep reservoir orientation and camera position unchanged;
- allow the user to deselect and resume exploration without opening content.

The selected artifact's atmospheric information should be capable of presenting, as relevant:

- artifact type;
- full title;
- subtitle or subtitles;
- date or date range;
- category / relationship / collection context;
- medium or format;
- concise supporting metadata appropriate to the artifact.

The exact fields may vary by artifact type. Do not force empty metadata into the layout.

## 12.2 Selected Confirmation Cue

When the pointer is directly over an already-selected artifact orb, the orb should receive a **gentle pulsing white glow** as an implicit confirmation cue.

The pulse:

- appears only while the pointer is over the selected orb;
- stops when the pointer leaves the orb;
- remains visually subordinate to the artifact's selected identity;
- should be restrained enough to communicate interactivity without becoming ambient spectacle;
- suggests that selecting the orb again will open the artifact.

Do not pulse selected artifacts continuously when they are not hovered.

On touch or non-hover input, equivalent confirmation clarity must eventually be provided without relying on hover alone.

# 13. Reservoir Navigation

## 13.1 Desktop

Preferred interaction mapping:

```text
Pointer drag             rotate/traverse reservoir
Wheel                    change reservoir scale / zoom
Hover                    focus node
First click artifact     select / inspect artifact metadata
Second click selected    open Inspection Window
Click elsewhere          deselect where appropriate
Select collection        transition active semantic reservoir
```

Rotation changes reservoir orientation while the reservoir remains centered.

Zoom no longer performs a camera dive, surface approach, locked pathway traversal, or atmospheric retreat.

## 13.2 Touch

Preferred conceptual mapping:

```text
Swipe                  rotate reservoir
Pinch                  change reservoir scale / zoom
First tap artifact     select / inspect artifact metadata
Second tap selected    open Inspection Window
Tap collection         transition active semantic reservoir
```

Touch implementation must avoid gesture conflicts with conventional artifact scrolling.

## 13.3 Navigation Reference Frame

The reservoir itself is the stable navigational frame.

Conceptually:

```text
ROTATE
changes orientation Q

ZOOM
changes scale Z and derived presentation resolution

SELECT COLLECTION
changes semantic collection C
```

The system should not depend on camera-path state to communicate ordinary zoom or collection traversal.

## 13.4 Terminology

Use:

- rotate;
- traverse;
- orbit;
- zoom;
- change scale;
- resolve presentation detail;
- enter / switch collection.

Avoid treating zoom as "diving" into the sphere unless a future explicitly scoped interaction reintroduces that metaphor.

# 14. Zoom

Zoom is a scale-and-resolution operation centered on the persistent reservoir.

### Foundational rule

> **Zoom changes the scale at which the reservoir is inspected; it does not move the visitor along a predefined camera path.**

The reservoir center remains fixed in the visual frame.

Zoom may change:

- apparent reservoir radius;
- apparent surface scale;
- visible structural detail;
- apparent node spacing;
- node and label presentation thresholds;
- interaction sensitivity;
- future semantic information density.

Conceptually:

```text
zoom input
   ↓
continuous zoom level Z
   ↓
reservoir scale
+
presentation density
+
future semantic resolution
```

Minimum and maximum zoom are bounded.

The implementation should favor continuous apparent scale while node positions remain stable and node/label presentation changes remain independent from the underlying render mesh.

### Future semantic resolution

V2 architecture should allow — but does not yet require — zoom-dependent semantic detail such as:

```text
far
collections / major landmarks

medium
collections + artifacts

near
artifacts + richer labels / relationships
```

This future possibility must not be used as justification to implement semantic aggregation before it is explicitly authorized.

# 15. Collection Navigation

## 15.1 Selection

Selecting a collection changes the semantic contents of the persistent reservoir.

The previous V1 concept of camera approach → collection orb expansion → camera entry is retired as the default collection-navigation model.

V2 instead preserves the centered reservoir reference frame.

Preferred conceptual sequence:

```text
current reservoir
        ↓
collection selected as destination
        ↓
current nodes retract / clear according to transition language
        ↓
destination node layout resolves for its population
        ↓
active collection identity commits
        ↓
destination nodes resolve / emerge
        ↓
same centered reservoir, new semantic world
```

The exact transition effect may preserve established visual language such as mesh suction, twinkling, node submersion, and node emergence where still appropriate, but no camera dive or physical slot-to-slot travel is required.

### Foundational rule

> **Collections change the world without requiring the spatial reference frame to move.**

## 15.2 Active / Destination Model

Collection traversal should use the simplest semantic state necessary.

Conceptually:

```text
ACTIVE COLLECTION
DESTINATION COLLECTION
```

Direction is derived from navigation history or requested destination, not from separate physical parent/child sphere slots.

Home, Back, breadcrumbs, menu commands, and collection-node selection are all destination queries into the same transition system.

## 15.3 Recursive Behavior

The same reservoir system should render root and nested collections.

Each collection may produce its own:

- node population;
- generated node layout;
- starting presentation requirements;
- orientation state;
- zoom state where preservation is desired.

## 15.4 Reservoir History and Presentation Preservation

Collection and Query traversal share one visit-based semantic history independently from physical scene choreography. A history frame stores a unique visit ID, the Reservoir context, a user-facing label, and optional `InspectionReturnFrame` reading state captured for the visit being left. Repeated visits to the same Collection or Resource Query remain distinct. Geometry and layout snapshots do not belong in history frames.

The control plane projects at most the five most recent prior non-Home visits, excludes the current and root Reservoirs, and shows a leading non-interactive ellipsis when older visits are hidden. The newest prior visit appears nearest Back/Home. Collection labels use Collection titles; single-Resource Query labels use Resource titles; labeled multi-result queries use their explicit label, otherwise `Query · N results`.

Back and random-access selection perform one direct transition to the chosen frame and truncate all later frames. Home is a stronger direct reset to the root frame with no Inspection reopening. No Forward or persistent cross-session history is implied.

Potential preserved state per collection:

- orientation;
- zoom level;
- selected node;
- generated layout seed / stable node positions.

Context-keyed presentation stores continue to own orientation, zoom, layout/Explore state, and selection snapshots where implemented. History references context identity and optional Inspection reading state rather than embedding presentation or camera-path state.

## 15.5 Query Reservoir Navigation

Query and collection navigation are distinct.

Collections answer “where am I?”
Queries answer “show me what matches.”

Query Reservoirs are ephemeral navigation state, not semantic collection records.

Query ancestry is directional: each Query Reservoir may point back to the context that created it through `returnContext`. This recursive contract remains semantic ancestry; the visit-based Reservoir history is the higher-level coordinator for Back and random-access traversal across mixed Collection and Query paths.

Direct single-result Query Reservoirs use the canonical focal anchor regardless of the active Distributed / Focused preference.

Conceptually:

```text
query
↓
resolve matching artifact(s) / collection(s)
↓
create temporary Query Reservoir
↓
render only the result set using the existing reservoir layout system
```

For explicit direct artifact commands such as About or Resume, the intended Query Reservoir behavior is:

```text
direct artifact request
↓
Query Reservoir containing the requested artifact only
↓
artifact may emerge already selected
↓
artifact metadata appears in the atmosphere
↓
user may deliberately open the artifact
```

Query Reservoir recovery semantics:

- Back returns to the reservoir/context from which the query was issued;
- Home returns directly to the root reservoir and should become visibly apparent in the control plane while a Query Reservoir is active.

Filter ownership remains local to the current reservoir context:

- a fresh Query Reservoir starts at `All`;
- restoring a query or collection context restores that context's own filter state;
- Back restores the departed context rather than inheriting the destination context's filter.

Do not treat query state as a permanent collection, and do not create a permanent blank-query node entity.

# 16. Artifact Activation Sequence

Artifact activation should be deliberately simple.

The site should not turn artifact opening into a game, loading ritual, or multi-stage cinematic mechanism.

## 16.1 Beat A — Selected Inspection

The first selection leaves the visitor in reservoir mode.

The selected artifact:

- retains the accepted Milestone 2 selected treatment;
- loses its floating node label;
- populates the atmospheric information region with detailed artifact metadata;
- remains at its original spherical surface position;
- may show the gentle white confirmation pulse only while directly hovered.

No automatic camera movement, sphere rotation, orb extraction, symbol intake, center-circle retraction, or ensō activation occurs.

## 16.2 Beat B — Open Confirmation

Selecting the already-selected artifact a second time confirms that the visitor wants to open it.

At confirmation:

- reservoir navigation input becomes inactive;
- all artifact nodes sink into the sphere;
- the reservoir sphere visually darkens / recedes;
- the selected artifact remains logically identified for restoration;
- the artifact inspection window begins entering from below the viewport.

The sphere itself should not automatically rotate or reframe as part of opening.

## 16.3 Beat C — Content Deployment

The Inspection Window slides upward from the bottom of the screen **above the reservoir interface**.

Its initial top edge should settle approximately around the viewport's upper-third line, using the intentionally preserved atmospheric space as part of the composition.

The exact top offset should respond to viewport dimensions rather than rely on one desktop-only pixel value.

The window may extend beyond the bottom of the viewport according to its content length.

Once deployed, the Inspection Window becomes the primary interaction and reading surface.

# 17. Artifact Open State

## 17.1 Reading Mode

Once open, interaction priority changes.

```text
Wheel      normal vertical artifact/document scroll
Trackpad   normal page scroll
Keyboard   normal document navigation
Pointer    text/media/chart interaction
```

Sphere navigation becomes inactive while the Inspection Window is open.

## 17.2 Content Window

The Inspection Window is a conventional 2D document surface that enters from below the viewport above the reservoir.

Current specification:

- its initial top edge settles approximately at the upper-third line of the viewport;
- it may continue beyond the bottom of the viewport;
- long content uses normal static document scrolling rather than spatial or camera-based scrolling;
- its content should not be constrained to a small nested scroll box without a compelling reason;
- it includes an explicit close control;
- the darkened reservoir remains the preserved underlying context rather than being destroyed and recreated.

The exact surface treatment — opacity, background, width, edge treatment, and responsive margins — remains subject to visual testing.

## 17.3 Conventional Reading

Artifact content should support excellent conventional reading.

Requirements:

- clear typography;
- strong hierarchy;
- sufficient width control;
- readable line lengths;
- appropriate spacing;
- accessible contrast;
- standard hyperlinks;
- navigable media;
- large data visualizations where relevant;
- mobile responsiveness.

The system's experimental character should **not** compromise content comprehension.

# 18. Artifact Exit Sequence

Artifact exit should be simple and preserve context.

Sequence:

1. visitor chooses the Inspection Window's close control;
2. Inspection Window slides downward and exits below the viewport;
3. reservoir returns from its darkened/receded presentation;
4. artifact nodes rise back to their normal surface positions;
5. reservoir input is restored;
6. the previously opened artifact returns to the **selected inspection state**;
7. its detailed metadata returns to the atmospheric information region;
8. its selected-node treatment is restored;
9. sphere orientation and zoom remain exactly as they were before opening.

The user may then deselect the artifact to restore the default Home atmosphere or select/open another artifact.

Do not reset the reservoir to its default orientation and do not require an orb-return animation.

# 19. Home Control

A future Home control may appear beneath the wordmark in the reserved space created by the accepted symbol composition.

Its exact meaning must be carefully defined.

Possible behaviors:

### Option A
Return directly to root reservoir.

### Option B
Return from a nested collection to root.

### Option C
Reveal navigation path.

The Inspection Window itself already has a dedicated close control, so Home should **not** be required merely to close an artifact.

This remains an **open decision**.

The accepted symbol/wordmark resting position should preserve sufficient responsive space for this future control without forcing the symbol to move during artifact selection or opening.

# 20. Navigation Depth / Breadcrumbs

Deep collection recursion requires orientation.

Traditional breadcrumbs such as:

```text
Home > Work > Data > Bellabeat
```

may conflict visually with the spatial environment.

Alternative approaches should be explored.

Possibilities:

- compact vertical path beneath wordmark;
- expandable navigation stack;
- home icon revealing path;
- subtle collection labels;
- back navigation built into sphere transition;
- mini-path inside menu.

The system must provide recoverability even if the breadcrumb is visually unconventional.

---

# 21. Environmental Layer

The environment sits behind or around the central reservoir.

Its purpose is to establish:

- context;
- identity;
- atmosphere;
- selected-artifact information;
- featured content;
- site metadata.

The atmospheric region above the reservoir is an active information surface, not merely decorative negative space.

## 21.1 Home Atmospheric State

Default Home copy may include:

```text
DIGITAL RESERVOIR

EST. 2026

A collection of all things Kodye Pugh
```

Exact capitalization and punctuation remain a visual-design decision.

## 21.2 Selected Artifact Atmospheric State

When an artifact is selected, the default Home atmospheric content swaps to detailed metadata for that artifact.

This transition should be direct, readable, and restrained.

The selected-artifact atmosphere may contain:

- artifact type;
- full title;
- subtitle(s);
- date or date range;
- category / relationship / collection context;
- format or medium;
- other concise metadata relevant to that artifact.

This atmospheric preview is intended to make artifact understanding nearly frictionless before the user commits to opening long-form content.

When the artifact is deselected, the default Home atmospheric content returns.

When an opened artifact is closed, the selected-artifact atmospheric state returns because the artifact remains selected.

## 21.3 Dome / Atmospheric Concept

The environment may suggest that the sphere exists within a larger enclosing field.

This does **not** necessarily require rendering a literal second geometric dome.

Preferred direction:

- curved typography where justified;
- subtle perspective;
- atmospheric gradients or lighting;
- restrained arc structures;
- spatial positioning.

The reservoir sphere should remain the primary spatial object and the metadata layer should remain readable.

## 21.4 Highlighted Artifacts

A small number of highlighted or featured objects may eventually appear in the Home atmospheric state.

These should not compete with selected-artifact metadata and may be hidden/replaced while an artifact is selected.

Behavior remains open.

# 22. Category System

Potential high-level lenses:

- Self
- Work
- World
- Inquiry

These are not necessarily the only navigation collections.

They represent broad conceptual categories or lenses.

---

## 22.1 Category Color

Each broad category may have a visual color identity.

Preferred use:

```text
orb body    neutral
icon        neutral
label       neutral
glow        category color
```

Avoid saturating large portions of the interface.

Category color should function primarily as metadata.

---

## 22.2 Multiple Categories

An artifact may eventually relate to more than one category.

The visual system should avoid assuming that every artifact permanently belongs to exactly one conceptual lens.

For V1, a single primary category may be used for simplicity.

---

# 23. Resource / Artifact-Status Content Model

The canonical semantic model is owned by the ontology addendum rather than by this provisional TypeScript sketch.

Conceptually:

```typescript
Resource {
  id
  slug
  title
  subtitle
  description

  resourceType
  inspectionKind
  isArtifact

  content
  representations[]
  supportRelationships[]

  published
  createdAt
  updatedAt
}

Collection {
  id
  slug
  title
  description
}

Membership {
  collectionId
  targetKind // "resource" | "collection"
  targetId
}
```

Important constraints:

- only Artifact-status Resources and Collections receive ordinary persistent Collection membership;
- Resource identity is stable across Artifact promotion/demotion;
- representations do not create duplicate Resources;
- layout/spatial placement is generated presentation state rather than permanent Resource identity;
- support and provenance relationships do not imply Collection membership.

Exact implementation types may differ. The ontology addendum controls semantics.

---

# 24. Collection Content Model

Collections are persistent curated Objects.

Their canonical membership targets are:

- Collections;
- Artifact-status Resources.

Collection membership is many-to-many and relational rather than a strict tree identity model.

Imported or nested hierarchies may be represented through Collection membership without making parent path part of Object identity.

Exact implementation shape is owned by the current registry and ontology.

---

# 25. Spatial Placement Model

V2 removes permanent rendered vertex IDs from the conceptual artifact model.

Artifacts and collections should not fundamentally store arbitrary screen positions or render-mesh-specific vertex assignments.

Preferred relationship:

```text
artifact / collection membership
        ↓
layout engine
        ↓
stable continuous spherical position
        ↓
clean reservoir surface presentation
        ↓
visual presentation
```

A stable spherical position may be represented as a normalized direction vector, spherical coordinates, or an equivalent render-mesh-independent form.

Conceptual example:

```typescript
type ReservoirPosition = {
  direction: [number, number, number]
}
```

The direction should be normalized in implementation.

This position belongs to generated layout state, not necessarily permanent artifact metadata.

### Determinism

Given the same collection membership, layout configuration, and seed, placement should be deterministic enough to preserve spatial familiarity.

### Render-mesh independence

Node identity and continuous spherical position must remain independent from the reservoir's underlying render mesh.

Changing or replacing the reservoir sphere geometry in a future version must not require redefining an artifact's identity or logical spherical position.

### Future semantics

The layout engine may later incorporate:

- semantic similarity;
- chronology;
- category proximity;
- relationships;
- curated anchors.

V2 foundation should permit those inputs without implementing them prematurely.

# 25.1 Current Semantic Entity Model

The current ontology supersedes the older future-product model that treated Artifact, Asset, and Source Record as peer conceptual entities.

Current persistent semantic Objects are:

```text
Object
├── Collection
└── Resource
```

Additional concepts are relational or status-bearing:

- **Artifact status** — reversible curatorial status on a Resource; grants Collection-membership eligibility;
- **Membership** — relationship connecting a Collection to an Artifact-status Resource or another Collection;
- **Representation** — one presentation/storage form of a Resource without creating duplicate Resource identity;
- **Support relationship** — Resource-to-Resource relation expressing supporting context;
- **Asset role** — a Resource's supporting use relative to another Resource;
- **Source/provenance role** — supporting/evidentiary origin, with implementation SourceRecords allowed where technically useful.

Migration, hashing, deduplication, synchronization, persistence, and automated ingestion remain deferred product concerns unless explicitly authorized.

### Migration principle

Imported folder structures should be representable as Collections and memberships so prior hierarchy can be preserved as one relational path without making that path permanent or exclusive.

---

# 26. Future Relational Capability

V1 may use curated node placement.

However, the system should not prevent future node arrangement from reflecting relationships.

Potential future spatial meanings:

- category proximity;
- chronology;
- similarity;
- references;
- project lineage;
- thematic relationships;
- personal relationships;
- semantic embeddings;
- curated clusters.

No automated spatial semantics should be implemented before there is a clear interpretive reason to do so.

---

# 27. State Model

The visual complexity should be managed through explicit application state.

V2 separates semantic collection state, spherical orientation, zoom, node layout, and reservoir presentation.

Conceptual state:

```typescript
type ReservoirContext =
  | {
      kind: "collection"
      collectionId: string
    }
  | {
      kind: "query"
      resultIds: string[]
      returnContext: ReservoirContext
      label?: string
    }

interface ReservoirState {
  activeLayout: {
    context: ReservoirContext
    mode: "distributed" | "focused"
  }

  transitionPlan: {
    sourceContext: ReservoirContext
    destinationContext: ReservoirContext
    phase: "departure" | "handoff" | "arrival"
  } | null

  currentCollectionId: string
  reservoirHistory: Array<{
    id: string
    context: ReservoirContext
    label: string
    inspectionReturn?: {
      resourceId: string
      scrollY: number
      postContentProgress: number
    }
  }>
  reservoirContext: ReservoirContext

  activeExploreFilterByContextKey: Record<string, ActiveExploreFilter>
  queryReservoirSelectionSnapshotByContextKey: Record<
    string,
    {
      hoveredArtifactId: string | null
      selectedArtifactId: string | null
      selectedCollectionId: string | null
      selectedPressActive: boolean
    }
  >

  selectedArtifactId: string | null
  focusedNodeId: string | null

  orientation: {
    x: number
    y: number
    z: number
    w: number
  }

  zoomLevel: number

  layoutKey: string

  menuOpen: boolean
  footerVisible: boolean
  contentOpen: boolean

  transitionState:
    | "idle"
    | "selected"
    | "openingArtifact"
    | "readingArtifact"
    | "closingArtifact"
    | "changingCollection"
}
```

Exact implementation types may differ.

Important architectural requirements:

- activeLayout is authoritative at rest;
- transitionPlan is ephemeral and clears after the destination becomes active;
- orientation is independent of zoom;
- zoom is independent of camera-path progress;
- layout is independent of the reservoir's underlying render mesh;
- collection identity is independent of physical transition geometry;
- query context is independent from collection membership and is not stored as a collection record;
- query context filter state is local to the context key, not global across all reservoirs;
- single-result direct Query Reservoirs keep the canonical focal anchor regardless of the active global layout preference;
- staying nodes remain stationary during exchange;
- leaving nodes sink and entering nodes emerge;
- failed filter requests return the red reservoir response rather than mutating the semantic model;
- direct Resource Query Reservoirs auto-select on arrival and automatically open the Inspection Window;
- artifact-selected and artifact-open remain distinct states;
- menu and footer remain independent states.

# 28. Interface State Map

Primary states:

```text
HOME RESERVOIR
│
├── NODE FOCUS
│
├── QUERY RESERVOIR
│      ├── result set is ephemeral navigation state
│      ├── returnContext is directional ancestry
│      ├── unified history records the visit
│      ├── Back selects the preceding Reservoir visit
│      ├── Home returns to root reservoir
│      └── direct Resource requests auto-open Inspection on arrival
│
├── ARTIFACT SELECTED
│      │
│      ├── selected metadata replaces Home atmosphere
│      ├── selected node label hidden
│      ├── selected + hovered → gentle white pulse
│      └── second selection → ARTIFACT OPENING
│
├── MENU OPEN
│
├── FOOTER EXPOSED
│
├── MENU + FOOTER
│
├── COLLECTION TRANSITION
│      │
│      └── COLLECTION RESERVOIR
│
└── ARTIFACT OPENING
       │
       ├── nodes sink
       ├── sphere darkens
       └── window rises
              │
              └── ARTIFACT OPEN
                     │
                     └── ARTIFACT EXIT
                            │
                            └── RETURN TO ARTIFACT SELECTED
```

Deselecting an artifact from the selected state returns to the Home atmospheric state without changing sphere orientation or zoom.

Query Reservoir filters remain context-local. A query that is not restoring its own context begins at `All`, and Back restores the departed context's own filter state rather than inheriting the destination filter.

# 29. Motion Timing

Exact durations remain open, but animation should favor responsiveness and restraint over spectacle.

Suggested ranges for prototype testing:

```text
hover response               100–250 ms
selected-hover pulse cycle   gentle / slow; tune visually
atmosphere content swap      150–350 ms
node sink / sphere dim       200–450 ms
content window deployment    300–650 ms
content window close         250–550 ms
header lift                  250–450 ms
menu reveal                  250–450 ms
collection transition        600–1200 ms
```

These are not locked values.

There is no planned orb-transfer, symbol-intake, or ensō-activation timing in the current artifact-opening interaction.

Perceived speed should be tested on real hardware.

# 30. Animation Easing

Motion should generally communicate:

- acceleration;
- momentum;
- mechanical settling.

Avoid default linear movement.

Potential approach:

- ease-out for reveals;
- ease-in for departures;
- ease-in-out for spatial transitions;
- spring behavior only when physically justified.

Overly elastic interfaces should be avoided.

---

# 31. Scroll Behavior

The interface has multiple wheel/trackpad contexts and must distinguish them deterministically.

## Reservoir Mode

Mouse wheel or trackpad vertical gesture changes **reservoir zoom / scale**.

It should not initiate camera travel through the sphere and should not cause conventional page scrolling while the reservoir owns the gesture.

Pinch should map to the same continuous zoom model where supported.

## Artifact Mode

Once the Inspection Window opens, wheel/trackpad becomes conventional document scrolling.

Reservoir zoom is disabled.

Artifact bottom-panel reveal behavior may continue to use its separately specified scroll-linked mechanics.

## Footer / Control Plane

Footer and control-plane reveal behavior remains a UI-space concern and must not be implemented by altering reservoir scale or camera-path state.

The same physical gesture must never control reservoir zoom and artifact/document scrolling simultaneously.

# 32. Input Mode Switching

When an artifact is merely selected:

```text
spherePointerEvents = enabled
sphereWheelInput = enabled
atmosphere = selected artifact metadata
```

When artifact content opens:

```text
spherePointerEvents = disabled
sphereWheelInput = disabled
contentScroll = enabled
```

When content closes:

```text
contentScroll = disabled/removed
spherePointerEvents = enabled
sphereWheelInput = enabled
selectedArtifactId = preserved
atmosphere = selected artifact metadata
```

When the selected artifact is deselected:

```text
selectedArtifactId = null
atmosphere = Home content
```

These transitions must be deterministic.

The same physical gesture should not unexpectedly perform multiple actions simultaneously.

# 33. Keyboard Navigation

The system must support keyboard operation.

Minimum requirements:

- Tab reaches interactive nodes;
- Enter/Space activates node;
- Escape exits artifact or menu;
- focus indicator remains visible;
- menu is fully keyboard navigable;
- content window traps focus only if implemented as a modal-like surface;
- focus returns logically after artifact exit.

Potential future keyboard sphere navigation:

```text
Arrow keys       rotate sphere
+ / -            zoom
Enter            select node
Backspace/Escape return
```

This is optional for V1 but desirable.

---

# 34. Screen Reader Strategy

The 3D visual layer cannot serve as the sole semantic representation.

A semantic DOM representation should exist containing equivalent:

- collection names;
- artifact titles;
- descriptions;
- links;
- navigation controls.

Possible implementation:

- accessible offscreen navigation tree;
- menu/index as semantic alternative;
- DOM overlay labels tied to WebGL objects.

Screen-reader users must be able to reach all public artifacts without manipulating WebGL.

---

# 35. Reduced Motion

Respect:

```css
prefers-reduced-motion: reduce
```

Reduced-motion behavior should replace motion-heavy transitions with:

- short fades;
- direct state changes;
- limited translation;
- immediate or shortened node sink/restore;
- immediate or shortened Inspection-Window deployment/retraction;
- no unnecessary ambient pulsing.

For the selected-hover confirmation cue, reduced-motion mode may replace the pulse with a stable white emphasis while hovered.

Functionality must remain identical.

# 36. Performance Strategy

A 3D portfolio must remain performant.

Core requirements:

- avoid excessive polygon counts;
- avoid unnecessary dynamic lights;
- limit expensive post-processing;
- lazy-load heavy artifact content;
- load 3D assets responsibly;
- optimize textures;
- minimize JavaScript bundle growth;
- test on integrated graphics;
- test mobile Safari;
- test older hardware.

The experience should degrade gracefully.

---

# 37. Performance Fallback

Potential fallback tiers:

## Full

- WebGL reservoir;
- full transitions;
- dynamic lighting;
- animation.

## Reduced

- simplified geometry;
- fewer effects;
- lower pixel ratio;
- limited ambient animation.

## Static / 2D

- conventional artifact index/list;
- standard bottom navigation;
- no WebGL requirement.

Selection may be automatic based on capability or user preference.

---

# 38. Mobile Strategy

The desktop concept should not simply be compressed.

Mobile interaction should be intentionally translated.

Potential mobile principles:

- bottom control plane retained;
- thumb-accessible controls;
- sphere remains central;
- fewer simultaneously visible labels;
- pinch zoom;
- swipe rotation;
- simplified environmental text;
- content windows become nearly full-screen;
- menu becomes more prominent as alternative navigation.

The bottom-control concept may be especially appropriate for mobile interaction.

---

# 39. Responsive Layout

Potential broad breakpoint logic:

```text
Large Desktop
full reservoir presentation

Desktop / Laptop
full reservoir with optimized sphere sizing

Tablet
simplified environmental layout

Mobile
touch-focused reservoir + stronger conventional navigation

Fallback
2D/index experience
```

Exact breakpoint values should be based on layout behavior, not arbitrary device categories.

---

# 40. Browser Behavior

Initial browser targets:

- current Chrome;
- current Safari;
- current Firefox;
- current Edge;
- iOS Safari;
- Chrome Android.

Because the experience relies heavily on WebGL and pointer interaction, Safari testing should occur early.

---

# 41. Routing and URLs

The spatial interface remains one system, but important public Objects should also support conventional web addresses.

Semantic Object identity and public URL routing are related but distinct:

```text
stable Object identity
        ↓
public route/address mapping
        ↓
resolve Collection or Resource
```

For the first public portfolio release, practical direct addresses should exist at minimum for:

- Bellabeat;
- Resume;
- About;
- Digital Reservoir project/case study.

A directly addressed Collection resolves to its persistent Collection Reservoir.

A directly addressed Resource resolves through the established direct Resource Query Reservoir seam and may then be deliberately inspected.

Benefits include:

- recruiter convenience;
- direct linking;
- search indexing;
- browser history;
- social sharing;
- refresh persistence;
- accessibility.

The first release does not require every future Resource to have a polished human-readable route, but route mapping must preserve stable Resource/Collection identity rather than creating a parallel content model.


---

# 42. Browser History

Collection navigation and artifact inspection should ideally interact correctly with browser Back/Forward.

Example:

```text
Home
→ Work
→ Data
→ Bellabeat
```

Pressing browser Back should not unexpectedly exit the entire site.

History behavior must be designed intentionally.

---

# 43. SEO

The experimental interface must not hide content from search engines.

Important content should exist as semantic server-renderable HTML wherever practical.

Artifact pages should support:

- title metadata;
- description metadata;
- Open Graph;
- canonical URL;
- structured headings;
- textual content;
- crawlable links.

3D presentation should be considered an interface layer, not a replacement for semantic content.

---

# 44. Content Loading

Artifact content should be independent of the 3D rendering system.

Potential structure:

```text
/content
  /artifacts
  /collections

/components
  /reservoir
  /artifacts
  /ui
```

or data modules feeding reusable page templates.

This supports future migration to:

- CMS;
- database;
- API;
- relational artifact repository.

---

# 45. Current Professional V1 Content

The first public version remains professionally useful.

Likely initial artifacts:

- Bellabeat case study;
- resume;
- About;
- web/project work;
- future analytics projects;
- contact destinations.

The interface may hint at a larger reservoir without requiring the entire personal archive to exist at launch.

---

# 46. Content Hierarchy for Recruiting

Despite the unconventional interface, a recruiter should quickly determine:

```text
Who is Kodye?
↓
What does he do?
↓
What work has he completed?
↓
Can I inspect evidence?
↓
How do I contact him?
```

Experimental presentation must not obscure this progression.

---

# 47. Progressive Disclosure

The site should support multiple depths of engagement.

### Approximately 10 seconds

Visitor understands identity and general professional direction.

### Approximately 30–60 seconds

Visitor encounters primary projects, tools, and capabilities.

### Several minutes

Visitor can inspect methodology, analysis, case studies, resume, and deeper work.

Concept:

```text
SCAN
↓
UNDERSTAND
↓
EXPLORE
↓
VERIFY
```

---

# 48. Visual Language

Current desired direction:

> **Editorial portfolio × technical interface × spatial archive**

Potential qualities:

- minimal;
- geometric;
- restrained;
- dimensional;
- cinematic without being theatrical;
- technical without becoming dashboard-like;
- polished without appearing corporate-template-driven.

---

# 49. Typography

Exact typefaces remain open.

Typography should support:

- clean display treatment;
- editorial reading;
- technical metadata;
- compact labels.

Suggested conceptual hierarchy:

```text
Display
Section Heading
Artifact Title
Body
Caption
Metadata
Interface Label
```

Typography should remain legible inside both static and animated contexts.

---

# 50. Iconography

Artifact nodes may contain icons.

Rules:

- use assigned icon where appropriate;
- use a default artifact icon otherwise;
- collection icon treatment should remain consistent;
- icons should not dominate node identity.

Icons may eventually be generated from artifact type.

---

# 51. Lighting and Material

Current concept suggests a sophisticated minimal material language.

Potential characteristics:

- neutral dark or muted orb surfaces;
- controlled glow;
- subtle reflections;
- restrained emissive category color;
- restrained surface shading and depth cues;
- soft environmental lighting.

Avoid excessive:

- glassmorphism;
- bloom;
- neon;
- metallic clutter;
- sci-fi interface clichés.

---

# 52. Reservoir Surface Rendering

V2 allows a dense triangular surface pattern as a presentation-only layer.

The sphere should present as a continuous dark/muted surface whose form remains legible through restrained material and lighting cues. The pattern itself must not imply semantic topology.

Requirements:

- visible geodesic/triangular wireframe may be present as a presentation-only layer, but it must not carry semantic node identity;
- no grid subdivision reveal tied to zoom;
- no visual implication that mesh vertices or faces carry semantic meaning;
- enough shading/depth information to make rotation and curvature perceptible;
- surface treatment remains subordinate to nodes and atmospheric information;
- render-mesh complexity may be tuned for quality/performance without affecting node identity or layout;
- the presentation pattern may change later without artifact migration.

Potential treatments:

- soft directional or environmental shading;
- restrained radial/hemispheric gradients;
- subtle material response during rotation;
- low-noise darkening toward the limb;
- node movement itself as an orientation cue.

Avoid treating the approved presentation pattern as semantic structure or replacing it with a different structural metaphor without explicit design authorization.

# 53. Relationship Visualization

Future artifacts may contain explicit references or relationships.

Potential visual behavior:

- selecting/focusing node highlights connected nodes;
- connecting paths become visible;
- unrelated surface/connection treatments recede.

This is not required for first prototype.

---

# 54. Search

Search should eventually provide a direct route to objects.

Potential result behavior:

1. search artifact;
2. select result;
3. system identifies collection location;
4. reservoir transitions or highlights location;
5. artifact activates.

Search should not require manual spatial navigation.

---

# 55. Filtering

Potential future filters:

- category;
- artifact type;
- date;
- relationship;
- collection;
- medium;
- professional relevance.

Filter behavior may reorganize, hide, or highlight nodes.

Do not implement until the artifact set is large enough to justify it.

---

# 56. Timeline

Timeline navigation is a possible alternative spatial interpretation.

It may later reorganize artifacts chronologically.

Not part of V1.

---

# 57. Opening Experience

Avoid prolonged splash screens.

The visitor should reach usable content quickly.

Potential sequence:

1. environment loads;
2. wordmark/control plane appears;
3. reservoir resolves;
4. nodes become interactive.

Any introductory animation should be brief and skippable.

---

# 58. Loading States

3D scene load should provide visual feedback.

Potential treatments:

- logo;
- reservoir surface gradually resolving;
- progress indication;
- reduced static interface available early.

Do not leave a blank screen while WebGL initializes.

---

# 59. Error Handling

If an artifact fails to load:

- maintain reservoir;
- display conventional error message;
- permit exit;
- do not break sphere state.

If WebGL fails:

- automatically offer or switch to conventional navigation.

---

# 60. MVP Prototype Objective

The first prototype exists to answer one question:

> **Does the reservoir make artifacts compelling, understandable, and easy to inspect without turning navigation into a game?**

The MVP should prove progressive disclosure:

```text
explore
↓
select
↓
understand artifact in atmosphere
↓
select again
↓
read conventionally
↓
close
↓
return to selected context
```

The MVP should not attempt to prove every future feature.

# 61. MVP Prototype Scope

The completed V1 prototype validated the primary artifact interaction and earlier spatial experiments. V2 now authorizes a focused spatial-foundation overhaul.

The approved implementation already uses one authoritative `activeLayout` and one ephemeral `transitionPlan` per exchange in the persistent centered frame. Collection-node entry, Home, Back, random-access history selection, and direct Collection or Resource requests resolve semantic destinations through the shared transition coordinator. One visit-based Reservoir history records both persistent Collection and ephemeral Query arrivals; Query Reservoir ancestry remains directional through `returnContext`; query filters are context-local; direct single-result Query Reservoirs retain canonical focal placement regardless of the global Distributed / Focused preference and auto-open Resource Inspection; staying nodes remain stationary while leaving and entering nodes reconcile through the same choreography. Semantic navigation history is independent from geometry, and the implementation does not rely on a persistent reusable geometry-snapshot hierarchy.

### V2 foundation implementation scope

Build / revise only what is required to establish:

1. a reservoir geometrically centered in the usable reservoir frame;
2. a simplified stable camera/reference-frame model;
3. drag/swipe rotation of the centered reservoir;
4. wheel/pinch zoom expressed as reservoir scale rather than camera dive;
5. bounded continuous zoom state;
6. a dense, presentation-only reservoir surface pattern with no semantic grid/topology;
7. continuous spherical node positions independent from render-mesh vertices;
8. deterministic node-layout generation based on current collection population;
9. population-aware node layout and spacing independent from sphere tessellation;
10. stable node identity and position independent from the render mesh;
11. generated initial orientation that exposes a useful visible population without flattening distribution to one hemisphere;
12. preservation of the existing artifact first-select / second-select / Inspection-Window interaction where compatible;
13. preservation of the persistent control plane, menu, footer, query system, and artifact scroll behavior unless directly affected by the spatial rewrite;
14. collection transitions using active/destination semantic state rather than physical ancestor/child sphere slots or camera pathways;
15. reduced-motion and performance-safe spatial transitions.

### Explicitly retired from ordinary reservoir zoom

Do not preserve as architectural requirements:

- cursor-directed camera dive;
- locked surface point;
- inner camera position;
- atmospheric camera retreat path;
- proximity-based camera depth modes;
- camera-path progress as zoom state.

### Explicitly retired from default collection traversal

Do not preserve as architectural requirements:

- physical Active / Ancestor / Child sphere slots;
- camera push-through into a collection sphere;
- camera pullback through ancestor spheres;
- collection transitions whose meaning depends on physical sphere-to-sphere camera travel.

Visual effects developed during V1/M4/M5 may be reused selectively if they reinforce the new semantic transition without restoring the retired navigation model.

# 62. Historical Prototype Scope Notes

Sections 62–66 originally described pre-V2 prototype sequencing.

They are retained only as historical context and are **not current sequencing authority**.

Many items once listed as excluded or future — recursive collections, menu/footer behavior, dynamic layout, Bellabeat content architecture, responsive work, Query Reservoirs, and Inspection systems — have since been implemented or materially advanced.

Current sequencing is controlled by:

`docs/release-preparation-roadmap.md`

Current implementation-completion state is controlled by:

`docs/l2-implementation-status.md`

Do not use historical prototype exclusions to defer a current launch requirement, and do not use them to reopen completed architecture.

# 63. Historical Prototype Success Criteria

The original prototype success criteria remain useful as regression questions:

- distinctive but restrained visual identity;
- intuitive rotation/zoom;
- understandable node selection;
- progressive disclosure;
- clear second-selection confirmation;
- coherent Inspection opening/closing;
- conventional readable content;
- preservation of spatial context;
- realistic-device performance.

These are quality checks, not current milestone definitions.

# 64. Historical Phase 2

Historical only. The work described here has largely been implemented or superseded.

# 65. Historical Phase 3

Historical only. Current production work is defined by the release-preparation roadmap.

# 66. Long-Term Product Development

Long-term reservoir development may include:

- personal Resource database;
- automated ingestion;
- metadata enrichment;
- relational references;
- temporal views;
- dynamic curation;
- semantic relationships;
- public/private publishing layers.

These remain outside the immediate public-portfolio release unless explicitly promoted into scope.

---

# 67. Technical Direction

Current stack:

- Next.js;
- React;
- Vercel;
- Git/GitHub.

Likely 3D stack:

- Three.js;
- React Three Fiber;
- Drei where useful.

Potential animation tooling:

- GSAP;
- Framer Motion / Motion;
- React Spring;
- native R3F interpolation.

Final animation tool should be selected after prototype requirements are clear.

Avoid adding multiple overlapping animation frameworks without reason.

---

# 68. Component Architecture

Potential conceptual component structure:

```text
<App>
  <Environment>
    <AtmosphereContent />
  </Environment>

  <ReservoirScene>
    <ArtifactNode />
    <CollectionNode />
    <NodeLabel />
  </ReservoirScene>

  <InspectionWindow />

  <BottomControlPlane>
    <BrandSymbol />
    <Wordmark />
    <HomeControl />
  </BottomControlPlane>

  <MenuLayer />
  <FooterLayer />
</App>
```

`AtmosphereContent` conceptually owns the swap between Home memoir content and selected-artifact metadata.

`InspectionWindow` owns long-form content, document scrolling, and its close control.

The brand symbol should not own artifact-open transition orchestration.

Exact React structure may differ.

# 69. Suggested Repository Organization

Potential:

```text
app/
  layout.tsx
  page.tsx
  ...

components/
  reservoir/
    ReservoirScene.tsx
    ReservoirSphere.tsx
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
```

This is illustrative rather than mandatory.

---

# 70. Separation of Concerns

Maintain strong separation between:

```text
CONTENT
what the artifact contains

SEMANTICS
what the artifact is

GEOMETRY
where it appears

PRESENTATION
how it looks

STATE
what the interface is currently doing

TRANSITION
how one state becomes another
```

Do not bind content directly to hard-coded animation logic.

---

# 71. Codex Implementation Principle

Codex should receive discrete implementation tasks grounded in this specification.

Preferred task style:

```text
Implement Prototype 1 artifact selection according to sections
16–18 and 61 of the Digital Reservoir Interface Specification.

Do not implement recursive collections, menu, footer, or database
features.

Preserve current project configuration.
```

Avoid asking Codex to build the entire vision from one large prompt.

---

# 72. Specification Discipline

When implementation reveals a design issue:

1. identify the behavior;
2. decide whether the specification or implementation is wrong;
3. update the specification if design intent changes;
4. update code;
5. test again.

The code should not silently become the new design specification.

---

# 73. Open Design Decisions

The following remain intentionally unresolved after establishing the V2 spatial foundation.

### Layout generation
- exact spherical distribution algorithm;
- exact deterministic seeding strategy;
- exact minimum angular / perceptual node spacing formula;
- treatment of unusually sparse or extremely dense collections;
- whether collection nodes receive layout weighting.

### Reservoir surface
- exact material/lighting treatment needed to preserve curvature and orientation without a visible grid;
- render-mesh complexity required for smooth appearance across target devices;
- whether additional non-structural orientation cues are necessary at sparse node densities.

### Zoom
- exact minimum / maximum scale;
- zoom curve and sensitivity;
- whether node apparent size remains constant, partially scales, or fully scales;
- future semantic-detail thresholds.

### Initial composition
- ideal visible-population target;
- orientation scoring heuristic;
- whether featured artifacts influence initial orientation.

### Navigation depth
- exact path / breadcrumb representation;
- Home and Back visual treatment;
- collection state restoration policy.

### Category
- final categories;
- category colors;
- multiple-category representation.

### Environment
- exact relationship between centered reservoir and atmospheric metadata at different viewport sizes;
- literal vs implied dome;
- featured artifact behavior.

### Inspection Window
- final width and responsive margins;
- exact upper boundary treatment;
- short / long artifact edge cases.

### Performance / fallback
- device capability thresholds;
- 2D fallback trigger.

### Mobile
- exact touch sensitivity;
- pinch / browser gesture conflict handling;
- centered-reservoir safe-zone rules.

### Accessibility
- preferred semantic alternate interface.

### Routing
- final URL structure and state restoration rules.

# 74. Non-Goals

The website should **not** become:

- a 3D game;
- a VR environment;
- a novelty interaction demo;
- a dashboard;
- a social network clone;
- a generic portfolio template;
- an interface requiring explanation before use;
- a technological showcase that obscures the work;
- a literal visualization of every metadata relationship from day one.

Technology serves the reservoir concept.

The reservoir concept serves the content.

---

# 75. Design Test

Every major proposed feature should be evaluated against three questions.

### 1. Does it make the reservoir easier or more meaningful to explore?

### 2. Does it improve understanding of the artifact or its relationship to the system?

### 3. Does it strengthen the conceptual identity without degrading usability?

If the answer to all three is no, the feature likely does not belong.

---

# 76. Core Interaction Loop

The defining artifact interaction is:

```text
RESERVOIR
   ↓
discover node
   ↓
focus node
   ↓
first selection
   ↓
selected node treatment
+
label disappears
+
artifact metadata replaces Home atmosphere
   ↓
hover selected orb
   ↓
gentle white confirmation pulse
   ↓
second selection
   ↓
nodes sink into sphere
+
sphere darkens
   ↓
Inspection Window rises from below
   ↓
read / inspect with normal scrolling
   ↓
close
   ↓
content window retracts
   ↓
sphere and nodes restore
   ↓
return to selected artifact + metadata
   ↓
deselect when ready
   ↓
Home atmosphere returns
```

This loop should be perfected before expanding the surrounding system.

# 77. Core Collection Loop

Secondary defining interaction in V2:

```text
RESERVOIR
   ↓
discover collection
   ↓
select destination collection
   ↓
current nodes retract / transition
   ↓
destination layout resolves for its population
   ↓
active semantic collection changes
   ↓
destination nodes resolve
   ↓
continue exploring the same centered reservoir frame
```

The transition should communicate a change of contained world without requiring the camera to physically travel through a collection sphere.

# 78. Core Interface Philosophy

The site is not a collection of unrelated pages hidden behind a creative navigation system.

The site itself is the manifestation of the collection.

The reservoir is the persistent exploration environment.

Collections alter the environment.

Artifacts remain spatially anchored while the visitor progressively reveals more information about them.

The atmosphere provides lightweight artifact understanding before opening.

The Inspection Window provides conventional long-form reading when the visitor chooses to go deeper.

The identity mark anchors the interface but does not need to become an animated transfer mechanism.

The visitor should gradually understand this logic through use rather than through instructions.

Novelty belongs primarily to exploration. Access to information should remain frictionless.

# 79. Canonical Summary

The Digital Reservoir is a spatial, recursive interface for exploring artifacts associated with Kodye Pugh.

V2 establishes the active reservoir as a persistent spherical reference frame centered in the usable visual field. The user rotates this reference frame to traverse its surface and changes its scale to inspect information at different spatial resolutions.

Zoom no longer means camera travel toward or through the sphere. Wheel or pinch modifies a bounded continuous zoom level that controls reservoir scale and may also influence label presentation, interaction sensitivity, visible working sets, and future semantic resolution.

The V2 prototype allows a dense triangular surface pattern as a presentation-only layer. The reservoir presents as a continuous sphere whose curvature and orientation are communicated through restrained material, lighting, and node movement rather than semantic mesh structure. The underlying render mesh is purely an implementation detail.

Artifacts and collections occupy stable continuous spherical positions generated from the current collection's membership. Permanent mesh-vertex IDs are therefore no longer the foundational placement model, and future changes to sphere tessellation must not require artifact migration or repositioning.

Selecting a collection changes the semantic contents of the persistent centered reservoir. The active/destination collection model replaces physical ancestor/child sphere slots and camera push/pull traversal as the default architecture. Current nodes transition out, the destination layout resolves, destination contents appear, and exploration continues in the same stable frame.

Artifact interaction remains progressive: first selection reveals richer atmospheric information; second selection opens a conventional Inspection Window. Reading remains a 2D document interaction and closing restores the selected reservoir context.

The Kodye Pugh symbol and wordmark remain the stable bottom-centered identity anchor. Menu, footer, direct navigation, queries, and artifact-reading layers remain UI-space systems rather than camera-navigation mechanisms.

The interface continues to be governed by:

> **Collections change the world. Artifacts open windows.**

V2 adds a spatial corollary:

> **The reservoir remains the reference frame. Zoom changes spatial and informational resolution. Layout serves the information; the surface stays visually continuous.**

# 80. Current Status — August 21, 2026

The Digital Reservoir has moved beyond the V2 spatial-foundation build phase.

### Closed / stable foundation

The current repository line has completed and accepted:

- centered reservoir reference frame;
- scale-based zoom;
- continuous render-mesh-independent spherical layout;
- population-aware deterministic spacing and sizing;
- adaptive inspectability and dynamic labels;
- Distributed / Focused presentation modes;
- Active + Destination Collection transitions;
- Query Reservoir closure baseline and directional return context;
- Resource/Collection semantic registry foundation;
- direct Resource Query Reservoir surfacing;
- Resource-oriented Inspection Window and structured-document rendering;
- supporting-Resource navigation and minimum Inspection return context;
- image Inspection;
- external-link/repository Inspection;
- Bellabeat's initial approved Resource/support graph and launch materialization.

These systems should not be reopened without a reproducible defect or explicit design decision.

### Current phase

The project is in **public-launch preparation**.

Sequencing is controlled by `docs/release-preparation-roadmap.md`, whose current stages are:

1. Portfolio Content Cut;
2. Public Web Layer;
3. Integrated Reservoir QA;
4. Responsive, Accessibility, and Interaction Regression Sweep;
5. Production Release.

The immediate objective is no longer to prove the V2 spatial substrate. It is to turn the validated Digital Reservoir into a credible, populated, conventionally reachable professional portfolio that can be used in job applications.

### Product boundary

The public portfolio is the first live manifestation of the broader Digital Reservoir product.

Do not delay launch for production ingestion infrastructure, database persistence, automated migration, semantic search, relationship visualization, broad renderer expansion, or other deferred product systems unless an approved launch Resource actually requires them.
