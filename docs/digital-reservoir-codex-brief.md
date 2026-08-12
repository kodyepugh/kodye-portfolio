# Digital Reservoir
## Codex Implementation Brief

**Version:** 0.3
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

Milestone 4 — NEXT / DESIGN SCOPE
Collection Spatial Identity & Traversal
```

Milestone 3 is the current stable checkpoint. Do not implement Milestone 4 unless an explicit task authorizes it.

# 4. Current component boundaries

The current prototype separates responsibilities approximately as follows:

- `ReservoirScene` owns interaction state, input ownership, selection/open/restore orchestration, camera snapshots, and semantic layer coordination.
- `ReservoirSphere` and `SphereGrid` own sphere and topology presentation.
- `ArtifactNode` owns node rendering, focus/selection treatments, the selected continuation cue, opening reaction, and restoration interpolation.
- `ArtifactLabel` owns spatial labels and their visibility rules.
- `ArtifactShockwave` owns the artifact-colored topology wave visualization.
- `AtmosphereContent` owns semantic Home or selected-artifact atmospheric content.
- `ArtifactWindow` owns semantic long-form content, document deployment/retraction, sticky close, Escape handling, and the persistent reading backdrop.
- `opening.ts` and `reading.ts` centralize transition timing and progress helpers.
- `artifacts.ts` owns canonical content records plus development-only density generation.

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
```

Exact identifiers may evolve, but input ownership must remain explicit:

- idle reservoir state owns drag traversal, wheel camera travel, focus, selection, and second-selection opening;
- opening suppresses reservoir input;
- deployment keeps document scrolling locked until deployment actually completes;
- reading gives wheel, trackpad, keyboard, and pointer behavior to the semantic document;
- closing disables document interaction;
- restoration suppresses reservoir input until deterministic restoration finishes.

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

# 14. Milestone 4 direction

The only currently established Milestone 4 direction is **Collection Spatial Identity & Traversal**.

Begin future design from a black collection orb approximately twice the diameter of an artifact node, fixed to a reservoir vertex and using the existing label system. Avoid extra shells, rings, or internal animation until testing demonstrates a need. Collection activation and traversal semantics remain open.

# 15. Deferred work

Preserve these open decisions:

- initial reservoir composition/load orientation;
- final responsive brand safe-zone formula;
- final artifact-window production styling;
- light theme and device-theme behavior;
- final semantic colors and typography;
- collection traversal details;
- menu;
- footer;
- routing;
- production content;
- mobile behavior;
- accessible alternate representation.

Also do not build ahead into databases, CMS integration, recursive collection infrastructure, search, filtering, accounts, admin tooling, or other speculative platform work without direct authorization.

# 16. Completion status

```text
Milestone 1 — Camera & Spatial Navigation: COMPLETE
Milestone 2 — Artifact Spatial Identity, Inspection & Selection: COMPLETE
Milestone 3 — Progressive Artifact Inspection & Opening: COMPLETE
Milestone 4 — Collection Spatial Identity & Traversal: NEXT / DESIGN SCOPE
```

Version 0.3 is the implementation reference for all future Digital Reservoir work. Preserve Milestone 3 behavior as the stable artifact-opening contract while Milestone 4 is designed incrementally.
