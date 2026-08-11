# Digital Reservoir
## Interface & Experience Specification
**Version:** 0.1
**Status:** Foundational Design Specification / Living Document
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

The primary conceptual units are:

1. **Artifact**
2. **Collection**
3. **Reservoir**
4. **Inspection Window**
5. **Control Plane**

---

## 2.1 Artifact

An artifact is an individually inspectable object.

Examples:

- Bellabeat case study;
- resume;
- photograph;
- essay;
- film;
- external link;
- project;
- painting;
- observation;
- video;
- document.

Within the spatial interface, an artifact is represented by an **orb positioned on a vertex of the reservoir grid**.

An artifact may carry:

- title;
- subtitle;
- icon;
- category;
- category color;
- media;
- content;
- relationships;
- metadata;
- collection membership.

Selecting an artifact does **not** replace the reservoir with another reservoir.

It extracts the artifact from the spatial environment and opens it for inspection.

### Foundational rule

> **Artifacts open windows.**

---

## 2.2 Collection

A collection is an object containing other artifacts and/or collections.

A collection is represented in the reservoir as a sphere-like node.

Selecting a collection does not open a conventional page.

Instead, the interface transitions into that collection, and the collection becomes the new spatial reservoir.

A collection may contain:

- artifacts;
- subcollections;
- both simultaneously.

Examples:

```text
Root
└── Work
    ├── Data
    │   ├── Bellabeat
    │   └── Future Project
    ├── Web
    └── Film
```

### Foundational rule

> **Collections change the world.**

---

## 2.3 Reservoir

A reservoir is the spatial representation of a collection.

The root/home environment is therefore simply the highest-level collection.

Conceptually:

```text
Home Reservoir = Root Collection
```

There is no special architectural distinction between the home sphere and other collection spheres.

The home sphere is simply the root instance of the same recursive system.

### Foundational rule

> **Every reservoir is a collection, and every collection can become a reservoir.**

---

## 2.4 Inspection Window

Artifact content should not itself be forced into spatial 3D interaction.

Once an artifact is selected, its contents are displayed in a conventional, readable 2D content layer.

This content layer may contain:

- text;
- images;
- data visualizations;
- embedded media;
- interactive charts;
- tables;
- links;
- documents;
- calls to action.

### Foundational rule

> **Exploration may be spatial. Reading should remain natural.**

---

## 2.5 Persistent Control Plane

The conventional website header is inverted.

The persistent interface control plane is located at the **bottom of the viewport**.

It contains the identity system and contextual controls.

Its central anchor is the Kodye Pugh symbol and wordmark.

The control plane may expand, lift, transform, or reveal contextual information without losing its central identity.

---

# 3. Core Experience Principles

## 3.1 Spatial Exploration, Conventional Consumption

The visitor discovers content through a spatial interface.

The visitor consumes substantial content through familiar scrolling interfaces.

```text
EXPLORE
spatial

SELECT
cinematic

READ
conventional
```

The system should never require a visitor to manipulate 3D geometry in order to read long-form information.

---

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

The Kodye Pugh symbol should not merely decorate the interface.

It acts as a functional part of the interaction model.

Most importantly, the center dot of the symbol becomes the destination of a selected artifact orb.

The enso-like outer geometry may rotate during artifact activation.

The symbol therefore functions as:

- brand mark;
- system center;
- artifact activation point;
- state indicator;
- visual anchor.

---

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
- surface grid;
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
L4  CONTENT / INSPECTION WINDOW
    Long-form artifact content

L3  RESERVOIR / SPHERE
    Grid, artifacts, collections

L2  ENVIRONMENT
    Memoir, atmosphere, featured objects

L1  PERSISTENT BOTTOM CONTROL PLANE
    Symbol, wordmark, contextual controls

L0  MENU / FOOTER REVEAL LAYERS
    Positioned beneath movable control plane
```

Actual CSS/WebGL z-order may differ according to implementation requirements.

The conceptual relationship should remain intact.

---

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

When an artifact is open:

```text
PAGE TITLE             SYMBOL             SUBTITLE
                     KODYEPUGH
                         HOME
```

Conceptual semantics:

```text
OBJECT IDENTITY      SYSTEM CORE       OBJECT CONTEXT
```

If an artifact has no subtitle, the right region may remain empty or adopt another meaningful secondary metadata element.

---

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

## 10.1 Sphere Position

The active reservoir sphere remains visually fixed around the center of the main viewport.

Navigation changes the user's view of the sphere rather than moving the sphere to unrelated positions on the page.

---

## 10.2 Visible Portion

The initial concept calls for approximately the **upper quarter of a larger sphere** to dominate the visible area.

The precise proportion should be visually tested.

The sphere may extend beyond the viewport.

It should feel larger than the visible window, creating the impression that the visitor is observing only part of a larger object.

---

## 10.3 Surface Grid

An axonometric/geodesic-inspired grid overlays the sphere.

The grid creates visible vertices.

Each usable vertex can host:

- an artifact;
- a collection;
- an intentionally empty node.

The grid should provide structural coherence and avoid the aesthetic of arbitrary floating objects.

---

## 10.4 Grid Geometry

Exact geometry remains open.

Candidates include:

- triangulated geodesic sphere;
- subdivided icosahedron;
- custom spherical triangular lattice;
- other topology capable of producing consistent vertices.

The geometry must support:

- stable vertex indexing;
- deterministic artifact placement;
- smooth rotation;
- responsive density;
- collection transitions.

---

# 11. Nodes

## 11.1 Artifact Node

An artifact node is represented as a mini sphere/orb located on a reservoir vertex.

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

- faint internal grid;
- secondary ring;
- shell;
- different internal lighting;
- slight topology hint;
- subtle animation.

The collection node should not become visually louder than every artifact merely because it is a collection.

---

## 11.3 Node Labels

Artifact labels may float near or slightly in front of nodes.

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

Hover, keyboard focus, or equivalent selection intent should create a low-intensity focus state.

Possible behaviors:

- increase orb glow;
- reveal label;
- increase icon contrast;
- slightly reduce neighboring visual intensity;
- reveal relationship lines;
- slightly enlarge the node.

Avoid dramatic camera movement during focus.

Focus represents inspection, not activation.

---

# 13. Reservoir Navigation

## 13.1 Desktop

Preferred interaction mapping:

```text
Pointer drag     rotate/traverse sphere
Wheel            zoom
Hover            focus node
Click artifact   activate artifact
Click collection enter collection
```

---

## 13.2 Touch

Preferred mapping:

```text
Swipe            rotate sphere
Pinch            zoom
Tap              focus/select node
Tap collection   enter collection
Tap artifact     activate artifact
```

Implementation must avoid gesture conflicts with browser scrolling.

---

## 13.3 Terminology

Avoid describing sphere navigation as conventional page scrolling.

Use conceptual language such as:

- rotate;
- traverse;
- orbit;
- navigate surface;
- pan across reservoir.

Conventional **scrolling** should primarily refer to content inspection.

---

# 14. Zoom

Zoom changes camera relationship to the sphere.

The sphere remains centered.

Zooming should change:

- apparent grid size;
- apparent node size;
- density of visible information.

Zoom should not meaningfully relocate the reservoir.

Minimum and maximum zoom should be bounded.

Potential future behavior:

- progressively reveal labels at closer scales;
- progressively aggregate visual information at farther scales.

This is not required for V1.

---

# 15. Collection Navigation

## 15.1 Selection

Selecting a collection initiates a transition into that collection.

The user should feel as though they are entering the selected collection object.

Avoid:

```text
fade out old page
fade in unrelated page
```

Prefer:

```text
selected collection orb
        ↓
camera approaches
        ↓
orb expands
        ↓
its structure resolves
        ↓
becomes new reservoir
```

---

## 15.2 Recursive Behavior

The same `CollectionView` conceptual system should render:

- root;
- Work;
- Data;
- Film;
- Inquiry;
- future collections.

The interface should not require unique hard-coded page layouts for every collection.

---

## 15.3 Collection State Preservation

When traversing back out of a collection, the parent collection should ideally remember:

- sphere orientation;
- zoom;
- selected node;
- previous focus.

Exact state persistence behavior can be refined later.

---

# 16. Artifact Activation Sequence

Artifact activation is intended to become one of the site's signature interactions.

The sequence should consist of distinct conceptual beats.

---

## 16.1 Beat A — Extraction

The selected artifact orb disconnects visually from its grid vertex.

Possible details:

- relationship lines detach;
- orb rises slightly off surface;
- glow increases;
- camera/sphere motion pauses;
- neighboring nodes reduce visual intensity.

The visitor should understand:

> This object has been removed from the reservoir for inspection.

---

## 16.2 Beat B — Transfer

The orb accelerates toward the center of the Kodye Pugh symbol in the bottom control plane.

The orb's trajectory should feel intentional and mechanically connected to the identity system.

The sphere may:

- subtly blur;
- dim;
- reduce depth emphasis;
- freeze interaction.

Avoid making the transfer excessively long.

---

## 16.3 Beat C — Activation

The artifact orb arrives at the center dot of the symbol.

The center dot is visually replaced or merged with the selected orb.

The enso ring rotates around it.

This communicates system activation.

Potential visual behaviors:

- one controlled rotation;
- slight luminous response;
- easing into active state;
- category glow briefly reflected in the symbol.

Avoid continuous aggressive spinning.

---

## 16.4 Beat D — Content Deployment

Following activation:

- page title appears on the left of the control plane;
- subtitle/context appears on the right;
- home control appears below wordmark;
- artifact content window rises from below/behind the reservoir view.

The content window becomes the primary interaction surface.

---

# 17. Artifact Open State

## 17.1 Reading Mode

Once open, interaction priority changes.

```text
Wheel      vertical content scroll
Trackpad   normal page scroll
Keyboard   normal document navigation
Pointer    text/media/chart interaction
```

Sphere navigation becomes inactive.

---

## 17.2 Content Window

The content window should feel like it emerges from the reservoir rather than replacing the entire site with a new webpage.

Possible visual treatment:

- slides upward;
- reservoir remains subtly visible behind;
- translucent or opaque content surface depending on readability;
- consistent bottom control plane remains visible.

---

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

---

# 18. Artifact Exit Sequence

Artifact exit should reverse the conceptual activation.

Sequence:

1. visitor chooses exit/close;
2. content panel slides downward;
3. title/subtitle leave control plane;
4. enso rotation returns to idle;
5. artifact orb ejects from symbol center;
6. orb travels back toward its original vertex;
7. orb reconnects;
8. reservoir restores focus and interaction;
9. previous sphere orientation and zoom remain intact.

Avoid simply destroying and recreating the reservoir state.

---

# 19. Home Control

When an artifact is open, a home symbol appears below the wordmark.

Its exact meaning must be carefully defined.

Possible behaviors:

### Option A
Return directly to root reservoir.

### Option B
Exit artifact to current collection.

### Option C
Open navigation path.

### Option D
Single click exits artifact; secondary behavior returns to root.

This remains an **open decision**.

The exit action and root-navigation action should not become confusingly redundant.

---

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
- featured content;
- site metadata.

---

## 21.1 Site Memoir

Core copy:

```text
DIGITAL RESERVOIR

EST. 2026

A collection of all things Kodye Pugh
```

Exact capitalization and punctuation remain a visual-design decision.

---

## 21.2 Dome Concept

The environment should suggest that the sphere exists within a larger enclosing field.

This does **not** necessarily require rendering a literal second geometric dome.

Preferred direction:

- curved typography;
- subtle perspective;
- atmospheric gradients or lighting;
- restrained arc structures;
- spatial positioning.

The reservoir sphere should remain the primary visual object.

---

## 21.3 Highlighted Artifacts

A small number of highlighted or featured objects may appear in the environment beneath the memoir text.

Initial concept:

```text
○        ○        ○
```

arranged horizontally.

These should not overwhelm the primary reservoir.

Their role may eventually include:

- featured projects;
- newest artifacts;
- editorial selections;
- resume;
- currently highlighted work.

Behavior remains open.

---

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

# 23. Artifact Content Model

Provisional conceptual structure:

```typescript
Artifact {
  id
  slug
  title
  subtitle
  description

  type

  icon
  category
  categoryColor

  content

  collections[]
  relationships[]

  featured
  published
  createdAt
  updatedAt

  spatialPlacement
}
```

Not every field needs implementation in V1.

---

# 24. Collection Content Model

Provisional structure:

```typescript
Collection {
  id
  slug
  title
  subtitle
  description

  icon
  category
  categoryColor

  artifacts[]
  collections[]

  spatialLayout

  parentCollections[]
}
```

The data model should not force all content into strict tree hierarchy if future relational navigation is anticipated.

---

# 25. Spatial Placement Model

Artifact metadata should be separated from sphere geometry.

Preferred concept:

```text
artifact
   ↓
vertex_id
   ↓
geometry system
   ↓
3D coordinate
```

rather than storing arbitrary pixel positions inside content.

Example:

```typescript
spatialPlacement: {
  collectionId: "data",
  vertexId: 27
}
```

This permits changing sphere geometry without rewriting content records.

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

Provisional conceptual state:

```typescript
interface ReservoirState {
  currentCollectionId: string

  collectionHistory: string[]

  selectedArtifactId: string | null
  focusedNodeId: string | null

  sphereRotation: {
    x: number
    y: number
  }

  zoomLevel: number

  menuOpen: boolean
  footerVisible: boolean
  contentOpen: boolean

  transitionState:
    | "idle"
    | "enteringCollection"
    | "activatingArtifact"
    | "readingArtifact"
    | "closingArtifact"
    | "leavingCollection"
}
```

Exact implementation may use React state, reducers, Zustand, XState, or another state architecture.

The important requirement is **explicit state transitions**.

---

# 28. Interface State Map

Primary states:

```text
HOME RESERVOIR
│
├── NODE FOCUS
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
└── ARTIFACT ACTIVATION
       │
       └── ARTIFACT OPEN
              │
              └── ARTIFACT EXIT
                     │
                     └── RETURN TO RESERVOIR
```

---

# 29. Motion Timing

Exact durations remain open, but animation should generally favor responsiveness over spectacle.

Suggested ranges for prototype testing:

```text
hover response             100–250 ms
header lift                250–450 ms
menu reveal                250–450 ms
orb extraction             200–400 ms
orb transfer               400–800 ms
enso activation            300–700 ms
content deployment         400–800 ms
collection transition      600–1200 ms
```

These are not locked values.

Perceived speed should be tested on real hardware.

---

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

The interface has multiple concepts commonly associated with scrolling and must distinguish them.

## Reservoir Mode

Mouse wheel/trackpad gesture:

**zoom** or other deliberately defined spatial behavior.

It should not cause conventional document scrolling unless the environmental layer intentionally supports limited vertical travel.

---

## Artifact Mode

Mouse wheel/trackpad gesture:

**normal document scroll**.

Sphere zoom must be disabled.

---

## Bottom Environmental Position

A separate mechanism must determine when the user has reached the environmental bottom that triggers footer reveal.

This may involve:

- page scroll;
- controlled scene translation;
- scroll-linked environment;
- dedicated intersection marker.

Exact implementation remains open.

---

# 32. Input Mode Switching

When content opens:

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
```

This transition must be deterministic.

The same physical gesture should not unexpectedly perform multiple actions simultaneously.

---

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

Reduced-motion behavior should replace cinematic transitions with:

- short fades;
- direct state changes;
- limited translation;
- no prolonged sphere animation;
- no unnecessary enso spinning.

Functionality must remain identical.

---

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

- conventional artifact grid/index;
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

Even though the interface behaves as one spatial system, artifacts should still have addressable URLs.

Examples:

```text
/
 /work
 /work/data
 /work/data/bellabeat
 /about
 /resume
```

or another logical structure.

Benefits:

- direct linking;
- search indexing;
- browser history;
- social sharing;
- refresh persistence;
- accessibility;
- recruiter convenience.

A visitor loading a deep artifact URL should still be able to enter the interface coherently.

Potential behavior:

1. application initializes;
2. correct collection context resolves;
3. reservoir state loads;
4. artifact opens.

For reduced-motion contexts, it may open directly.

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
- clean grid lines;
- soft environmental lighting.

Avoid excessive:

- glassmorphism;
- bloom;
- neon;
- metallic clutter;
- sci-fi interface clichés.

---

# 52. Grid Rendering

The grid should remain readable but subordinate to artifacts.

Potential treatments:

- low-opacity lines;
- brighter focus region;
- perspective-consistent line thickness;
- subtle depth fade.

The grid exists to provide structure.

It should not become a visual cage.

---

# 53. Relationship Visualization

Future artifacts may contain explicit references or relationships.

Potential visual behavior:

- selecting/focusing node highlights connected nodes;
- connecting paths become visible;
- unrelated grid lines recede.

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
- grid gradually resolving;
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

> **Does the defining interaction feel compelling, understandable, and usable?**

The MVP should not attempt to prove every future feature.

---

# 61. MVP Prototype Scope

Build only:

1. environmental background;
2. fixed central 3D sphere;
3. visible grid;
4. approximately five nodes;
5. one Bellabeat node;
6. bottom Kodye Pugh symbol;
7. wordmark;
8. sphere drag/rotation;
9. zoom;
10. node focus;
11. artifact click;
12. orb extraction;
13. orb-to-symbol transition;
14. enso activation;
15. title/subtitle appearance;
16. content panel rise;
17. simple placeholder Bellabeat content;
18. content scroll;
19. close action;
20. orb return;
21. exact restoration of previous reservoir orientation.

---

# 62. Explicitly Excluded From Prototype 1

Do **not** initially build:

- recursive collections;
- production menu;
- footer behavior;
- full mobile implementation;
- database integration;
- search;
- filters;
- timeline;
- relationship visualization;
- dynamic node-layout algorithm;
- complete Bellabeat case study;
- all categories;
- final color system;
- final typography;
- advanced accessibility system;
- complex loading sequences;
- production SEO;
- full routing architecture.

These follow only after the primary loop is validated.

---

# 63. Prototype Success Criteria

Prototype 1 should answer:

### Visual

Does the reservoir have a distinctive identity?

### Spatial

Does rotating the sphere feel intuitive?

### Interaction

Does the visitor understand that nodes are selectable objects?

### Activation

Does the orb-to-symbol transition feel coherent rather than gimmicky?

### Reading

Does the transition into conventional content feel natural?

### Continuity

Does closing the artifact feel like returning an object to the same world?

### Performance

Can the interaction remain smooth on realistic hardware?

If several of these fail, fix the interaction before expanding features.

---

# 64. Phase 2

After primary interaction validation:

- collection node prototype;
- collection-entry animation;
- nested reservoir;
- basic path/navigation depth;
- menu prototype;
- footer reveal;
- production Bellabeat artifact;
- responsive behavior.

---

# 65. Phase 3

Potential production expansion:

- full artifact content model;
- multiple professional artifacts;
- category system;
- search/index;
- accessibility improvements;
- 2D fallback;
- route persistence;
- SEO;
- production performance tuning.

---

# 66. Phase 4

Long-term reservoir development:

- personal artifact database;
- automated ingestion;
- metadata;
- multiple collections;
- relational references;
- temporal views;
- dynamic curation;
- semantic relationships;
- public/private publishing layers.

These are explicitly outside the immediate job-portfolio implementation.

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
  <Environment />
  <ReservoirScene>
    <SphereGrid />
    <ArtifactNode />
    <CollectionNode />
    <NodeLabel />
  </ReservoirScene>

  <ArtifactWindow />

  <BottomControlPlane>
    <ContextTitle />
    <BrandSymbol />
    <Wordmark />
    <ContextSubtitle />
    <HomeControl />
  </BottomControlPlane>

  <MenuLayer />
  <FooterLayer />
</App>
```

Exact React structure may differ.

---

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

The following remain intentionally unresolved.

### Geometry
- exact sphere topology;
- grid density;
- visible sphere percentage;
- vertex count.

### Navigation
- exact back-navigation UI;
- breadcrumb/path representation;
- home-button semantics.

### Category
- final categories;
- category colors;
- multiple-category representation.

### Environment
- literal vs implied dome;
- featured artifact behavior;
- vertical environmental extent.

### Menu
- exact menu taxonomy;
- location of menu button;
- menu visual treatment.

### Footer
- exact trigger mechanism;
- precise footer content.

### Artifact Window
- opacity;
- width;
- corner treatment;
- background;
- exact transition.

### Animation
- timing;
- easing;
- enso rotation count;
- artifact trajectory.

### Mobile
- degree of 3D retained;
- fallback thresholds.

### Accessibility
- preferred semantic alternate interface.

### Routing
- final URL structure.

---

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

The defining interaction is:

```text
RESERVOIR
   ↓
discover node
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
read / inspect
   ↓
close
   ↓
content retracts
   ↓
orb ejects
   ↓
orb returns to original vertex
   ↓
reservoir reactivates
```

This loop should be perfected before expanding the surrounding system.

---

# 77. Core Collection Loop

Secondary defining interaction:

```text
RESERVOIR
   ↓
discover collection
   ↓
select collection
   ↓
approach collection
   ↓
collection expands
   ↓
new geometry resolves
   ↓
collection becomes reservoir
   ↓
explore contents
```

This should be built only after the artifact loop feels correct.

---

# 78. Core Interface Philosophy

The site is not a collection of unrelated pages hidden behind a creative navigation system.

The site itself is the manifestation of the collection.

The reservoir is the persistent environment.

Collections alter the environment.

Artifacts temporarily leave the environment to be inspected.

The identity mark mediates between the two states.

The visitor should gradually understand this logic through use rather than through instructions.

---

# 79. Canonical Summary

The Digital Reservoir is a spatial, recursive interface for exploring artifacts associated with Kodye Pugh.

A fixed central sphere represents the active collection.

Its surface contains a structured grid of vertices populated by artifact and collection nodes.

The user rotates and zooms the reservoir to explore its contents.

Selecting a collection transforms that collection into the new active reservoir.

Selecting an artifact extracts its orb from the sphere and sends it into the central point of the Kodye Pugh symbol located within a persistent bottom control plane.

The symbol activates, contextual information appears, and a conventional vertically scrolling content window rises above the spatial environment.

Closing the artifact retracts the content window, ejects the orb from the symbol, returns it to its original location, and restores the exact previous reservoir state.

The bottom control plane doubles as the site's primary navigational mechanism. It may lift to reveal a menu or footer beneath it, with those reveal states remaining independent.

Behind the reservoir sits an environmental identity layer containing the Digital Reservoir memoir, establishment year, descriptive language, atmospheric structure, and potentially featured artifacts.

The entire interface is constructed around a simple distinction:

> **Collections change the world. Artifacts open windows.**

The system should feel experimental when exploring, cinematic when transitioning, and completely natural when reading.

---

# 80. Status at Version 0.1

### Foundational concepts established

- Digital Reservoir identity;
- recursive collection model;
- artifact vs collection distinction;
- fixed spatial reservoir;
- bottom control plane;
- orb-to-symbol activation;
- conventional artifact reading;
- menu/header/footer stacking concept;
- environmental layer;
- state preservation;
- 3D as enhancement rather than barrier.

### Prototype Milestone 1 complete — 2026-08-11

The first spatial-navigation prototype is implemented and validated.

The completed milestone establishes:

- responsive outer framing with the reservoir held in the lower viewport region;
- a fixed-scale sphere with detail-15 structural triangular grain;
- five deterministic, vertex-anchored placeholder artifact nodes;
- bounded cursor-directed inward camera travel;
- region-relative outward atmospheric retreat;
- continuous camera clearance outside the reservoir surface;
- deterministic rim- and pole-safe camera frames without roll inversion;
- view-relative quaternion sphere traversal;
- proximity-sensitive drag with inspection sensitivity at 20% of atmospheric sensitivity;
- preservation of sphere orientation during camera-only navigation.

The milestone intentionally excludes artifact focus, selection, activation, content windows, collections, menus, footers, search, filtering, and production styling.

### Prototype Milestone 2 complete — 2026-08-11

**Milestone 1 — Camera & Spatial Navigation: COMPLETE**

**Milestone 2 — Artifact Spatial Identity, Inspection & Selection: COMPLETE**

The approved Milestone 2 checkpoint establishes:

- artifact-colored spatial nodes on the accepted detail-15 reservoir topology;
- a no-directly-adjacent occupied-node spacing rule;
- radially anchored, camera-billboarded labels with coherent horizon fading and backside hiding;
- responsive label widths, a retained `MAX_LABEL_WIDTH` of `720`, and seamless continuous overflow-title looping;
- label render isolation above grid lines, cursor and selected glows, and artifact orbs;
- subtle uniform white hover treatment with selected state taking priority;
- cursor-responsive white topology inspection;
- stronger artifact-colored selected topology that dominates cursor white;
- an accepted selection sequence of orb press → outward mesh propagation → selected-depth orb with upward white selected illumination;
- an accepted deselection sequence of inward mesh retraction → downward white retreat → resting orb reset;
- preserved click-versus-drag interaction and camera/traversal behavior;
- successful deterministic density QA with 24 active nodes and no adjacent occupied detail-15 vertices;
- the five canonical artifacts restored as the production-facing default;
- a retained development-only density harness enabled by `NEXT_PUBLIC_RESERVOIR_DENSITY_TEST=1`.

### Deferred issue — Initial Reservoir Composition / Load Orientation

Dense artifacts can be correctly distributed across hemispheres that are unseen on initial load. Future work should determine how initial orientation and/or artifact distribution should expose a meaningful visible population without breaking spatial continuity. No load-orientation or distribution behavior is implemented as part of this checkpoint.

Milestone 3 has not begun and requires a separately authorized scope.

---

**End of Digital Reservoir Interface & Experience Specification — v0.1**
