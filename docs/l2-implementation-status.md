# Digital Reservoir — L2 Implementation Status

**Status:** Closed L2 implementation line / public-launch preparation
**Updated:** August 21, 2026
**Ontology authority:** `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md` revision 0.7.1
**Bellabeat ingestion authority:** `docs/l2-bellabeat-manual-ingestion-manifest.md`

---

## Purpose

This document records which portions of the L2-enabling architecture described in the ontology and Bellabeat ingestion manifest are implemented in the current repository line.

It is an implementation-status companion only. It does not supersede ontology, content, or interaction rules.

Where the Bellabeat manifest's historical registry-gap section still lists already-completed foundation work, this status document controls only the implementation-completion state.

---

## Completed in Current Repository Line

### 1. Canonical Object / Resource Registry Foundation

Implemented in the current repository line:

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

Implemented in the current repository line:

- published non-Artifact Resources can be adapted into Query Reservoir nodes without Collection membership;
- semantic Query Reservoir nodes distinguish `artifact`, `resource`, and `collection`;
- Artifact-status and non-Artifact Resources share the inspectable-resource sizing/rendering family while retaining truthful semantic status;
- direct Resource requests resolve through the canonical Resource address and reuse the existing Query Reservoir coordinator;
- direct About/Resume requests use the same generic Resource-query seam;
- single-result Resource queries use existing canonical focal placement and auto-selection behavior;
- selection state is Resource-native;
- Query Reservoir `returnContext` ancestry, Home semantics, and context-local presentation restoration remain preserved beneath unified Reservoir history;
- Resource atmosphere metadata and diagnostics are status-aware;
- non-Artifact Resources are not falsely reported as Artifacts in query-node, adaptive-zoom, or traversal diagnostics;
- synthetic QA covers non-Artifact Resource adaptation without adding fake production content.

### 3. Common Inspection Window + Structured-Document Foundation

Implemented in the current repository line:

- one Resource-oriented `InspectionWindow` is the canonical reading/inspection chassis;
- the former `ArtifactWindow` remains only as a compatibility wrapper for older callers;
- inspection eligibility and continuation capability are driven by implemented Resource inspection surfaces rather than Artifact status;
- both Artifact-status and non-Artifact Resources can use the same inspection architecture when their `inspectionKind` is supported;
- `inspectionKind` selects the inspection surface;
- `structured-document` is the first canonical inspection surface;
- legacy `rich-text`, `case-study`, and `document` content adapts into the structured-document model instead of forming a second canonical document system;
- reusable ordered structured-document blocks include headings, paragraphs, figures, lists, callouts, links, dividers, tables, quotes, code, and Resource references;
- figure blocks reference stable Resource/representation identity rather than creating duplicate file identity;
- structured-document validation covers block identity/order constraints, Resource references, representation references, figure alt text, links, lists, tables, and content/inspection compatibility;
- unsupported inspection kinds remain explicit and do not silently render through the structured-document surface;
- the Inspection Window owns one coherent modal semantic/focus boundary encompassing both primary inspection content and the terminal footer;
- background Reservoir controls are inert while inspection is active; Escape closes; focus restores after ordinary close;
- the structured article is not used as a giant `aria-describedby` payload;
- synthetic inspection QA proves Artifact/non-Artifact renderer parity without adding fake production Resources.

### 4. Supporting-Resource Navigation

Implemented in the current repository line:

- the common `InspectionWindow` resolves published supporting Resources from canonical Resource-support relationships;
- support entries preserve canonical Resource identity rather than duplicating Resource metadata into UI-specific records;
- unpublished relationships and unpublished targets are excluded;
- support ordering is deterministic;
- selecting a supporting Resource does not swap the current renderer in place;
- support selection retracts the current Inspection Window and delegates to the canonical direct Resource / Query Reservoir seam;
- support navigation does not promote Resources to Artifact status and does not mutate Collection membership;
- duplicate support-navigation requests are blocked once a handoff is pending;
- ordinary Inspection close preserves the current semantic Reservoir context and restores pre-inspection presentation.

### 5. Minimum Inspection Return Context

Implemented, corrected, reviewed, and accepted in the current repository line:

- an Inspection-originated Resource or Collection detour captures a minimal `InspectionReturnFrame` on the unified history frame for the Reservoir visit being left;
- the frame preserves originating Resource ID, practical document `scrollY`, and proportional post-content/control-plane/footer reveal progress;
- Back restores the prior semantic Reservoir context before reselecting and reopening the originating Resource;
- reopened Inspection restores bounded practical reading position rather than promising pixel-perfect browser-history semantics;
- return frames are visit-specific and consumed exactly once after successful restoration;
- failed or abandoned paths discard ephemeral state;
- ordinary Query Reservoir Back/Home behavior remains unchanged when no Inspection return state exists;
- root-returning queries with an Inspection return frame expose Back because Back and Home are semantically distinct;
- Home remains an unconditional root return, discards Inspection return state, and does not reopen the prior Inspection;
- Collection detours launched from Inspection reuse the same visit-specific `InspectionReturnFrame` ownership as Resource-query detours;
- nested Collection traversal only reopens the Inspection when Back crosses the original Inspection-originated Collection boundary;
- current-Collection selection performs an ordinary Inspection close without creating a redundant return hop;
- return state does not promote Resources to Artifact status, mutate Collection membership, or duplicate semantic identity.

### 5.1 Unified Reservoir History

Implemented in the current repository line:

- one ordered visit-based `ReservoirHistoryFrame[]` records persistent Collection and ephemeral Query Reservoir arrivals;
- frames preserve unique visit identity, semantic context, user-facing label, and optional Inspection reading state without geometry/layout snapshots;
- repeated visits to the same Resource or Collection remain distinct;
- Back selects the immediately preceding frame without asking callers to distinguish Collection ancestry from Query ancestry;
- selecting an older visible frame performs one direct transition and truncates the later active branch;
- Home performs one direct root transition, resets history to root, clears pending auto-open/return state, and never reopens Inspection;
- the control-panel projection shows at most five prior non-Home visits and a leading ellipsis when older visits are hidden;
- Collection titles and single-Resource titles provide semantic labels, while unlabeled multi-result Queries use `Query · N results`;
- recursive Query `returnContext` remains intact for semantic ancestry and transition helpers;
- existing context-keyed Explore/selection presentation stores and continuous quaternion/zoom transition behavior remain separate from semantic history;
- input locks, transition-plan ownership, pending-intent clearing, visit-ID checks, and branch truncation prevent repeated or stale navigation from reopening the wrong Inspection.

### Integrated Manual QA

The production Bellabeat graph has now exercised mixed Collection/Query history and Inspection return behavior in-browser:

- Home → Work → Data / Analytics established Collection traversal in the unified history;
- real relationship navigation exercised Bellabeat, Comprehensive Case Study, Methodology Appendix, Identifier Population Audit, Notebook, and Final Validation Query visits without adding convenience edges;
- the authored graph does not contain a direct Methodology → Identifier Audit edge, so the valid source-backed path returns through Comprehensive Case Study before entering Identifier Audit;
- a seven-visit path exposed exactly five prior non-Home frames plus the leading hidden-history ellipsis;
- random access returned directly to an older Comprehensive Case Study visit, truncated all later frames, reopened Inspection, and restored a nonzero practical reading position;
- Bellabeat → Methodology → Bellabeat → Methodology → Bellabeat preserved both Bellabeat Query visits as distinct frames, and selecting the earlier Bellabeat frame truncated the later branch and restored that visit;
- unified Back restored the immediately preceding report visit and reading state;
- Home reset history to the root Collection, cleared Inspection-return state, and did not reopen Inspection;
- the final browser console contained no warnings or errors.

### 6. Polished Image Inspection + Shared Inspection Context Grammar

Implemented, refined, reviewed, and approved for merge:

- `inspectionKind: "image"` now resolves to a dedicated production image Inspection renderer rather than the former compatibility surface;
- canonical Resource → published Representation → Asset resolution is preserved, with deterministic representation ordering and compatible media-content fallback;
- invalid, missing, unpublished, wrong-kind, or browser-failed image payloads resolve to an explicit unavailable state rather than another renderer;
- alt text follows deterministic semantic fallback from Asset alt → resolved caption → Resource title;
- image rendering preserves intrinsic aspect ratio across portrait, landscape, square, SVG, and extreme ratios;
- the shared Inspection chassis now owns a universal three-column coordinate frame whose center column defines primary content placement independent of renderer width;
- structured-document-specific typography/layout selectors are scoped to structured documents rather than leaking onto other renderer roots;
- image viewing uses a centered, proportionally contained tonal field with no explicit border, radius, or stage shadow;
- image first-landing sizing is derived from the actual Inspection landing geometry rather than arbitrary full-viewport percentages;
- image painting is contained by its allocated layout box, so relationship/context content always stacks beneath the image instead of overlapping it;
- the atmosphere owns Resource identity and concise metadata; renderer bodies own the inspected content rather than duplicating identity chrome;
- the shared Inspection context tray exposes vertically separate `Resources` and `Collections` regions beneath primary content rather than a type switch;
- the universal Resource region is available to Artifact-status and non-Artifact Resources alike, maps outgoing edges to `Supported by` and incoming edges to `Supports`, and uses an adaptive direction control only when both sets are populated;
- Resource context deduplicates within each direction without erasing a legitimate cross-direction fact;
- Collections remain actual membership-derived pills and the entire region is omitted when membership is empty;
- Resource and Collection entries use minimal semantic-object pills with icon + name only;
- Resource pills retain canonical Resource-query navigation and Inspection return semantics;
- Collection pills use canonical Collection navigation and preserve Inspection return ownership on the specific history hop;
- SourceRecord terminology remains distinct from Resource relationships;
- the shared close control is reduced to minimal X-only chrome and remains outside primary content geometry;
- Inspection minimum length now follows the visible remainder below its landing horizon plus actual content, instead of forcing a large synthetic second viewport;
- trailing space after final semantic content is reduced so terminal/footer reveal follows the content with only a modest buffer;
- synthetic Inspection validation covers image resolution/fallback, representation ordering, context availability, ontology invariants, and Collection-return semantics.

### 7. Preserved Query Reservoir Closure Baseline

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

### 8. External-Link / Repository Inspection

Implemented in the current repository line and accepted in the external-link/repository closeout:

- `inspectionKind: "external-link"` dispatches to a dedicated Inspection surface;
- published external representations resolve deterministically, with compatible external-link content as fallback;
- malformed, unsafe, unavailable, or unsupported targets resolve to an explicit unavailable state;
- repository presentation remains a variant of the external-link surface rather than a separate semantic system;
- the Bellabeat Wellness Analysis Repository is a published non-Artifact Resource with a canonical external representation, provenance SourceRecord, and published support relationship;
- the shared three-column Inspection frame, Resource/Collection context, return context, reduced-motion behavior, terminal reveal, and Query Reservoir navigation are preserved;
- the close X and semantic Back-to-Top behavior were simplified and accepted in final user review.

See `docs/l2-external-link-repository-inspection-closeout.md` for the bounded pass's detailed acceptance record.

---

## Remaining L2 / Public-Launch Preparation

The L2/Bellabeat feature line is closed and accepted. Its completed foundation includes Bellabeat real-content ingestion and an audited Resource graph; universal directional Resource context; a separate membership-derived Collection region; direct Resource Query Reservoir auto-open; visit-based unified Reservoir history and Inspection reading-state restoration; structured documents; image, external-link/repository, and notebook Inspection surfaces; the shared fullscreen, zoomable, swipeable Inspection image viewer; and horizontally owned, bounded Resource/Collection tray scrolling.

The L2-enabling architecture required by the currently approved launch content is complete in the current repository line:

- canonical Resource / Collection registry foundation;
- direct Resource Query Reservoir surfacing;
- common Inspection Window and structured-document rendering;
- supporting-Resource navigation;
- minimum Inspection return context;
- image Inspection;
- external-link / repository Inspection;
- Bellabeat's source-audited Resource/support graph and launch materialization.

This document records completion state only. **`docs/release-preparation-roadmap.md` is the sequencing authority for what should be worked on next.**

The remaining work is public-release preparation rather than expansion of the L2 ontology.

### Public-launch work still open

The roadmap currently groups the remaining launch work into five stages:

1. **Portfolio Content Cut** — finalize the launch portfolio content set and hide/unpublish unfinished public objects.
2. **Public Web Layer** — production identity/metadata, real outbound destinations, and practical direct public addresses for major portfolio Resources.
3. **Integrated Reservoir QA** — exercise the real Bellabeat Resource/support graph and established return-context behavior in-browser.
4. **Responsive, Accessibility, and Interaction Regression Sweep** — representative devices/input modes, semantic DOM access, reduced motion, focus behavior, and functional regression cleanup.
5. **Production Release** — full validation, production deployment/domain verification, and production-URL smoke testing.

Implementation work should follow that roadmap rather than treating a technically logical next renderer or ingestion seam as automatically higher priority.

### L2 capability not required for the current launch cut

The following remain valid future capabilities but are not required merely to finish L2 for the current launch registry:

- polished generic-file, dataset, video, and audio renderers not required by approved launch content;
- production ingestion/admin UI;
- database persistence;
- content hashing/deduplication;
- full-text or semantic search;
- an Unassigned Resources inbox/query UI;
- automated migration;
- automatic Artifact promotion;
- automatic Collection creation.

The notebook treatment required by the Bellabeat launch material is implemented. Unsupported Resource kinds should remain explicit rather than being forced through an unrelated renderer.

### Public routing is no longer an L2 deferral

Final public URL/deep-link behavior remains outside the semantic ontology, but it is now part of the **launch-blocking Public Web Layer** defined by the release-preparation roadmap.

Do not classify public routing/address mapping as deferred product work when evaluating launch readiness.

---

## Pinned Final-Refinement / Launch-Sweep Backlog

The following items are explicitly non-blocking for current L2 architecture and should not interrupt the next bounded implementation passes:

- **Inspection close X latency:** after Inspection is fully initialized, a single X activation now eventually fires but retains a noticeable delay; Escape is more responsive. Treat as a launch/regression bug-sweep item. Preserve existing close diagnostics so the eventual sweep can distinguish hit-testing/input delivery from transition acceptance rather than reopening this checkpoint by default.
- **Inspection backdrop entry opacity choreography:** the shared fixed backdrop is functionally stable and no longer remains stuck/opaque after closure; Inspection Window arrival position is approved; backdrop exit behavior is acceptable. Entry opacity can still appear to finish/jump near window settlement. Revisit during final launch polish/refinement.

Do not treat these pinned refinements as reasons to reopen completed Inspection/navigation architecture unless a functional regression appears.

---

## Still Explicitly Deferred

Do not treat the following as L2 prerequisites unless separately authorized:

- production ingestion/admin UI;
- database persistence;
- content hashing/deduplication engine;
- full-text or semantic search;
- Unassigned Resources inbox/query UI;
- automated migration;
- polished video/audio/dataset renderers;
- automatic Artifact promotion;
- automatic Collection creation.

---

## Current Handoff Rule

For new implementation or debugging branches:

1. read `docs/release-preparation-roadmap.md` for sequencing and launch priority;
2. read this file for implementation-completion state;
3. read the ontology for semantic rules;
4. read the interface specification for accepted interaction behavior;
5. read the Bellabeat manifest when the task touches Bellabeat content, provenance, or curatorial boundaries.

Do not reimplement the Resource registry foundation, direct Resource Query Reservoir seam, common Inspection Window/structured-document foundation, supporting-Resource navigation, minimum Inspection return context, image Inspection, or external-link/repository Inspection without a reviewed defect that specifically requires correction.

Current work is public-launch preparation. Do not expand into additional renderer families, ingestion infrastructure, or future product systems merely because they are conceptually adjacent.
