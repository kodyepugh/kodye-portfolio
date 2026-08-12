# Digital Reservoir
## Interface & Experience Specification

**Version:** 0.3
**Status:** Foundational Design Specification / Living Document
**Established:** 2026
**Project:** kodyepugh.com
**Working concept:** *Digital Reservoir — A collection of all things Kodye Pugh*

---

# 0. Purpose and authority

This document defines what the Digital Reservoir interface does, how it behaves, and what its visual and spatial experience should communicate. It is a living specification: foundational principles should remain stable, current prototype decisions should be preserved until deliberately revised, and open decisions should remain visibly open.

When a historical description conflicts with validated repository behavior, the validated behavior is authoritative. Version 0.3 records the completed Milestone 3 interaction as the stable checkpoint for future work.

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

Collections change spatial context rather than opening ordinary artifact documents. Milestone 4 will begin with a collection node that:

- is a black orb;
- is approximately twice the diameter of a standard artifact node;
- occupies a stable reservoir vertex;
- uses the existing node-label system above it;
- initially avoids unnecessary shells, rings, and internal animation.

Collection activation and traversal remain unimplemented and must be designed and validated incrementally.

# 3. Stable reservoir composition

The reservoir is a large triangulated sphere whose scale exceeds the viewport. Visitors see only part of it at a time and traverse it through direct spatial input.

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

# 14. Deferred and open decisions

The following remain intentionally unresolved:

- initial reservoir composition and load orientation;
- final responsive brand safe-zone formula;
- final artifact-window production styling;
- light theme, device-theme adaptation, and final semantic color system;
- final production typography;
- collection activation and traversal details;
- menu and footer;
- routing;
- production content and media treatment;
- mobile interaction;
- accessible alternate representation.

# 15. Milestone status at Version 0.3

```text
Milestone 1 — Camera & Spatial Navigation: COMPLETE
Milestone 2 — Artifact Spatial Identity, Inspection & Selection: COMPLETE
Milestone 3 — Progressive Artifact Inspection & Opening: COMPLETE
Milestone 4 — Collection Spatial Identity & Traversal: NEXT / DESIGN SCOPE
```

Milestone 3 is the new stable artifact-opening checkpoint. It establishes progressive first/second selection, semantic atmospheric inspection, topology-aware opening impact, conventional foreground reading, continuous reservoir coverage, sticky close availability, and exact spatial restoration.

Milestone 4 must not be implemented from this document alone. Its only established starting direction is the restrained black collection node described in Section 2.2.

# 16. Canonical summary

The Digital Reservoir is a spatial body of artifacts and collections. Visitors traverse a continuous sphere, focus artifacts, and select once for immediate atmospheric context. A selected artifact remains spatially actionable through a restrained continuation cue and a steady direct-hover emphasis. Selecting it again launches one coordinated topology-driven opening event: the artifact-colored wave, sphere dimming, node recession, selected-node embedding, and camera withdrawal overlap.

The artifact's semantic body rises beneath its atmospheric identity and becomes an ordinary foreground document. Its dark coverage prevents the WebGL reservoir from showing through, its close control remains available during long scrolling, and closing restores the exact pre-open reservoir state while preserving selection. Reading ends without sacrificing spatial continuity.
