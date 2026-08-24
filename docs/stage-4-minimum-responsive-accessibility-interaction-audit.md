# Stage 4 Audit — Minimum Responsive / Accessibility / Interaction Sweep

**Status:** Complete  
**Branch:** `qa/minimum-responsive-accessibility-interaction`  
**Closed:** August 24, 2026

Stage 4 is complete. This record consolidates the initial diagnostic audit, the accepted responsive correction, the SG-01 browser-navigation investigation, the interaction/accessibility/lint closeout, and the user's final visual and physical-touch approval. The accepted Stage 3 browser/navigation transaction architecture remains unchanged.

## Final release-hardening baseline

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass — zero errors and zero warnings |
| `npm run validate:content` | Pass (56/56) |
| `npm run validate:inspection` | Pass (86/86) |
| `npm run validate:routing` | Pass |
| `npm run validate:label-geometry` | Pass; existing Node module-type warning only |
| `npm run build` | Environment-blocked by Turbopack CSS-worker port restriction; not treated as an application compile failure |
| `npm run build -- --webpack` | Pass — compilation, TypeScript, static generation, optimization, and route output completed |
| `git diff --check` | Pass |
| Branch Vercel deployment | Pass on the final Stage 4 branch head before closeout documentation |

## Representative viewport coverage

The release sweep exercised:

- `1440 x 900` large desktop;
- `1280 x 720` laptop;
- `1024 x 900` narrow desktop/tablet-like;
- `768 x 900` narrow desktop/tablet-like;
- `430 x 932` mobile;
- `390 x 844` mobile;
- `360 x 800` mobile.

The Reservoir shell, Index, Bellabeat structured documents, Resume, Contact, image Inspection, external-link/repository Inspection, notebook Inspection, context tray, close control, Back to Top, and terminal/footer behavior were exercised at the appropriate representative sizes.

User visual QA was completed and approved. The mobile composition remains intentionally dense but functionally acceptable for launch; no P2/P3 visual refinement is being held as a blocker.

## Defect disposition

| ID | Final status | Result |
| --- | --- | --- |
| RS-01 | Closed as P2 refinement | Mobile shell is visually dense but no blocking collision, page overflow, or inaccessible required control was reproduced. |
| RS-02 | Closed as non-blocking | Index visible rectangle remains intentionally minimal. Native keyboard/pointer behavior passed and physical-device use was user-approved. |
| IR-01 | Resolved | Comprehensive structured-document mobile page overflow corrected through the shared renderer width contract. |
| IR-02 | Accepted behavior | Related-object tray retains intentional local horizontal scrolling without page-level overflow. |
| IR-03 | Resolved with IR-01 | Notebook markdown inherited the same shared structured-document correction; no notebook-specific responsive architecture was required. |
| AK-01 | Not reproduced as application defect | Native CUA Enter/Space activated the Index trigger; earlier automation failure was an input-path limitation. |
| AK-02 | Closed | Image viewer Escape/close returned focus to its launcher; direct Resource Inspection has no physical invoker by design. |
| RM-01 | Closed | Reduced-motion functional equivalence passed through the required launch paths. |
| SG-01 | Not reproduced | Earlier scroll-zero observation sampled the expected reopening phase before browser/reading restoration convergence. Controlled reruns restored the originating Inspection and practical reading state. |

## Pass A — Shared structured-document mobile containment

### Root cause

The shared Inspection chassis and primary track were already bounded. The failure was inside the structured-document renderer:

- `.structured-document` used an implicit auto grid column;
- intrinsic descendants enlarged that grid track beyond the available Inspection primary track;
- semantic sections had a desktop `max-width` but did not establish a shrinkable mobile width/min-width contract;
- figures and table wrappers inherited the oversized section track;
- local table scrolling therefore existed inside a parent that was already too wide.

Representative pre-correction measurements:

| Viewport | Primary track | Implicit renderer track | Page width |
| --- | ---: | ---: | ---: |
| 360 x 800 | 277px | 486.2px | 528px |
| 390 x 844 | 303px | 486.2px | 529px |
| 430 x 932 | 338px | 486.2px | 532px |

### Correction

`app/globals.css` now establishes the shared renderer width contract:

- `.structured-document` uses `grid-template-columns: minmax(0, 1fr)`;
- renderer width/max-width remain within the primary track;
- renderer and semantic sections use `min-width: 0`;
- editorial sections retain their desktop maximum and alternating alignment;
- table/code wrappers own intentional horizontal overflow locally;
- inline code may break long tokens rather than enlarge the document.

The fix was deliberately shared. Notebook markdown uses `StructuredDocumentBody`, so IR-03 was retested after the common correction before any notebook-specific responsive rule was considered.

### Accepted measurements

| Surface / viewport | After correction |
| --- | --- |
| Comprehensive, 360 x 800 | Page 360px; document/section follow 277px primary |
| Comprehensive, 390 x 844 | Page 390px; document/section follow 303px primary |
| Comprehensive, 430 x 932 | Page 430px; document/section follow 338px primary |
| Comprehensive, 768 x 900 | Page 768px; 584px primary/document/section |
| Comprehensive, 1280 x 720 | Page 1280px; 880px document; editorial sections 700px |
| Comprehensive, 1440 x 900 | Page 1440px; 880px document; editorial sections 700px |
| Notebook, 360 x 800 | Page 360px; notebook/document/markdown section 277px |
| Notebook, 390 x 844 | Page 390px; notebook/document/section 303px |
| Notebook, 768 x 900 | Page 768px; notebook/document/section 584px |
| Notebook, 1280 x 720 | Page 1280px; notebook/document 880px; editorial section 700px |
| Resume, mobile/desktop | Compact profile remains bounded and centered |
| Ordinary Bellabeat, mobile/desktop | Figures remain within bounded document |

The widest comprehensive table remains intrinsically much wider than the mobile reading track but scrolls inside `.structured-document__table-scroll`; the page remains bounded. Notebook `pre` similarly retains local horizontal scrolling without expanding the page.

IR-01 and IR-03 are closed.

## Pass B — SG-01 support-detour return investigation

The initial audit appeared to show Bellabeat reading state being lost after:

`Bellabeat Inspection → Repository Query → Repository Inspection → browser Back → browser Forward → Repository close → semantic Back`

No navigation correction was made until the accepted Stage 3 sequence was reproduced under controlled conditions.

### Controlled matrix

| Case | Result |
| --- | --- |
| Immediate close after browser Forward | Pass |
| Close after explicit restoration convergence | Pass |
| No browser Back/Forward control | Pass |
| Browser Back only | Pass |
| Repeated delayed runs on mobile and desktop | Pass |

The Repository Query and Repository Inspection retained distinct browser entries while the semantic Reservoir history retained a single Query visit and the origin Inspection return boundary.

The earlier failure was a QA sampling error: the page had returned to the Bellabeat route while application state still reported `deferred: inspection-reading-state`, Inspection phase `deploying`, return phase `reopening-inspection`, and scroll position zero with a nonzero stored target. On convergence, the same owned Bellabeat entry reached Inspection phase `reading`, return phase `restored`, and the practical reading position was applied.

SG-01 is therefore closed as **not reproduced**. The accepted Stage 3 browser-history coordinator remains unchanged.

## Interaction, accessibility, and lint closeout

### Lint cleanup

The entering baseline of seven errors and three warnings was resolved without blanket rule disables or lint-configuration weakening.

- `InspectionImageViewer.tsx` resets per-image state through the keyed viewer ownership boundary, tracks focus transitions with a ref, derives bounded pan during render, and closes stale registrations at their owning unregister point.
- `NotebookInspectionBody.tsx` derives immutable image-occurrence offsets for markdown figures and code outputs instead of mutating a render-local counter.
- `ReservoirScene.tsx` uses cancellable animation-frame handoffs for the linted effect-owned transitions and the existing latest-function refs for inspection/direct-route operations.

`npm run lint` now passes with zero errors and zero warnings.

### Runtime regression matrix

| Surface | Accepted result |
| --- | --- |
| Image viewer | Opens from figure, focuses Close, zooms, closes by Escape/click, restores launcher focus, and does not retain stale state between Resources. |
| Notebook | 13 cells (8 markdown, 5 code) and 6 outputs rendered; code/output/image behavior and local code scrolling remained functional. |
| Reservoir Index | Native Enter and Space open the Index; entries are reachable; Escape closes and focus returns to the trigger. |
| Keyboard/focus | Dialog roles and accessible names remain present; hidden controls are not tabbable; launcher focus restoration works. |
| Reduced motion | Index, Bellabeat Inspection, Repository support flow, browser Back/Forward, semantic Back, Home, Back to Top, and image viewer remain functionally complete without stuck transitions. |
| Stage 3 browser path | Support Query/Inspection Back/Forward and return to Bellabeat practical reading state pass after convergence; Home discards return state and returns root. |
| Pass A protection | Comprehensive and notebook pages remain viewport-bounded at 390 x 844; Resume and ordinary Bellabeat remain bounded. |
| Desktop sanity | Shell remains within the viewport and accepted layout behavior is preserved. |

## Physical touch-device acceptance

The local Codex/browser environment could not dispatch trustworthy touch events, so Stage 4 intentionally remained open rather than inferring touch behavior from mouse input.

The user subsequently completed the physical-device smoke test and approved the touch interactions. Accepted physical-device coverage includes:

1. one-finger Reservoir drag and tap-select;
2. deliberate second activation/open;
3. pinch zoom and image-viewer swipe/pan/zoom behavior;
4. horizontal Resource-tray scrolling versus ordinary vertical reading scroll;
5. terminal/footer reveal at mobile width;
6. practical mobile Index interaction.

This closes the final Stage 4 input-evidence gate.

## Final Stage 4 acceptance

Stage 4 is **Complete**.

Accepted evidence now includes:

- representative desktop/laptop/narrow/mobile responsive coverage;
- user-approved visual QA;
- resolved structured-document and notebook mobile containment;
- semantic DOM Reservoir Index access;
- native keyboard/focus behavior;
- user-approved physical touch behavior;
- reduced-motion functional equivalence;
- green lint/typecheck/content/Inspection/routing/geometry validation;
- full webpack production build success in the constrained local environment;
- successful Vercel deployment of the Stage 4 branch;
- preserved Stage 3 browser/navigation transaction behavior;
- no remaining P0/P1 Stage 4 defect.

Known P2/P3 choreography and density observations remain post-launch refinement work and do not block release.

The next roadmap stage is **Stage 5 — Production Release**.