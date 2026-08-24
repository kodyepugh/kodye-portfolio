# Stage 4 Audit — Minimum Responsive / Accessibility / Interaction Sweep

**Status:** In progress — diagnostic audit only  
**Branch:** `qa/minimum-responsive-accessibility-interaction`  
**Audited:** August 24, 2026

This record is the first Stage 4 release-hardening audit. It does not alter the
accepted Stage 3 browser/navigation transaction architecture and it does not
implement corrections.

## Baseline

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run validate:content` | Pass (56/56) |
| `npm run validate:inspection` | Pass (86/86) |
| `npm run validate:routing` | Pass |
| `npm run validate:label-geometry` | Pass; Node emitted its existing module-type warning |
| `npm run build -- --webpack` | Pass |
| `git diff --check` | Pass |
| `npm run lint` | Baseline failure: 7 errors and 3 warnings in `InspectionImageViewer.tsx`, `NotebookInspectionBody.tsx`, and `ReservoirScene.tsx`; no audit change was made to these pre-existing findings. |

## Runtime matrix and limits

The local runtime was inspected in the in-app browser. Desktop `1440 x 900`,
mobile `360 x 800`, `390 x 844`, and `430 x 932` viewport overrides were used.
The root shell, Index, Bellabeat structured document, Resume, Contact, image
Inspection, and the comprehensive Bellabeat document were exercised where the
browser session remained available.

The automated browser session reset while attempting the final Stage 3
Back/Forward transaction run. Touch emulation and reduced-motion emulation were
not completed before that reset. They remain required audit work, not passing
results. The repository Inspection direct-route landing was observed to finish
asynchronously after the short surface-measurement interval, so that renderer
also requires a dedicated follow-up runtime check.

## Defect matrix

### 1. Responsive shell

| ID | Priority | Viewport/input | Surface | Finding and evidence | Ownership / correction boundary | Stage 4 blocker |
| --- | --- | --- | --- | --- | --- | --- |
| RS-01 | P2 | 390 x 844, mouse/keyboard | Reservoir shell | The composition is visually dense, but no document-level horizontal overflow, control collision, or inaccessible required control was observed. The Index, atmosphere, layout controls, and footer fit the viewport. | Reservoir spacing and typography only if a later visual pass is approved; do not redesign the mobile model. | No |

### 2. Inspection responsive behavior

| ID | Priority | Viewport/input | Surface | Steps / expected / actual | Root cause and ownership | Stage 4 blocker |
| --- | --- | --- | --- | --- | --- | --- |
| IR-01 | P0 | 360 x 800, 390 x 844, 430 x 932; mouse/keyboard | `Bellabeat Comprehensive Case Study` structured-document Inspection | Open `/bellabeat-comprehensive-case-study`; Inspection content should remain in its primary track, with tables locally scrollable where needed. Actual document width is 528px, 529px, and 532px respectively; figures, sections, paragraphs, and tables extend offscreen. | Renderer grid/min-content failure in `app/globals.css` around `.structured-document` and `.structured-document section`, not the shared three-column chassis. See the causal chain below. Correct the renderer's implicit grid track and its section/child min-content constraints, then preserve local table scrolling. | Yes |
| IR-02 | P3 | 390 x 844 and 430 x 932; mouse | Bellabeat related-object tray | The relationship brick field is 1,284px wide, but its 303px/338px `.inspection-context-tray__panel` has `overflow-x: auto`; the page scroll width remains the viewport width on the ordinary Bellabeat document. This is intended local horizontal navigation, not page overflow. | No correction indicated. Regression-test touch ownership after IR-01. | No |

Other observed launch surfaces at 390 x 844/430 x 932 behaved within their
primary tracks: the ordinary Bellabeat document (figures), Resume,
Contact, close control, and the shared chassis. This is evidence for those
specific observations only; it is not a full all-renderer certification.

### 3. Accessibility and keyboard

| ID | Priority | Viewport/input | Surface | Finding | Ownership / correction boundary | Stage 4 blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AK-01 | P1, reproduce before fix | 390 x 844, keyboard | Reservoir Index | In the audit browser, `Enter` on the focused Index trigger did not open the Index after two attempts; pointer activation did. The semantic Index is therefore not yet proven as a keyboard path in this environment. | Inspect the trigger's keyboard activation, readiness/disabled sequencing, and focus state in the Reservoir control plane. Do not replace the Index or add another 2D route. | Pending reproduction |
| AK-02 | P2, context-dependent | 390 x 844, keyboard | Direct image Inspection close | `Escape` closed the dialog, but focus landed on the document/main context rather than a visible launch control. This direct-route test has no physical invoking control, so it is not evidence of an Index-origin focus-return regression. | Re-test Index-origin opening and close after AK-01 is resolved or ruled out. | No, pending confirmation |

Accessible names were present for the observed Index, close, and image-launch
controls. The normal Inspection dialog was exposed as a dialog in the inspected
surfaces.

### 4. Touch / pointer

No defect classification yet. The available local-browser controls exposed
mouse-style CUA actions but not a reliable touch/pinch emulation path before the
session reset. Required follow-up: Reservoir drag/pinch/tap, relation-shelf
horizontal scroll versus page scroll, image viewer gestures, and terminal/footer
reveal at 360px and 390px.

### 5. Reduced motion

No defect classification yet. Reduced-motion functional-equivalence testing
(open/close, Back-to-Top, Query/Collection transitions, and layout switch) was
not completed before the browser reset.

### 6. Stage 3 regression guard

No Stage 3 regression is recorded. Bellabeat direct Inspection and related
resource controls were reached, but the required repository Query → repository
Inspection → browser Back/Forward sequence did not finish because the audit
browser session reset during that run. Re-run the bounded sequence after the
mobile correction; do not change the accepted history model absent a reproduced
failure.

## Mobile Inspection overflow — complete causal chain

The defect is reproducible on the comprehensive structured document, not on the
ordinary Bellabeat document or the shared chassis measured in this audit.

| Viewport | Chassis width | Primary track | Structured-document available width | Computed implicit renderer track | Document page scroll width |
| --- | ---: | ---: | ---: | ---: | ---: |
| 360 x 800 | 320px | 276.8px | 277px | 486.2px | 528px |
| 390 x 844 | 350px | 303.2px | 303px | 486.2px | 529px |
| 430 x 932 | 390px | 338.4px | 338px | 486.2px | 532px |

1. `.inspection-window__body-layout` correctly computes a mobile center track
   from `calc(100% - (2 * var(--inspection-column-gap)))`; it has `min-width: 0`
   and stays within the page width.
2. `.inspection-window__primary-body` also measures exactly to that center
   track.
3. `.structured-document` is a grid with no explicit column definition. Its
   implicit auto column resolves to a 486.2px intrinsic track for the
   comprehensive content, even though the renderer box itself is only
   277px–338px wide.
4. Each `.structured-document section` has `max-width: 700px` but no mobile
   width/min-width constraint. It stretches to the 486.2px implicit grid track.
   Figures and tables then inherit that 486px section width. The table scroll
   wrappers are locally scrollable, but are already 486px wide and therefore
   cannot contain the document-level expansion.
5. The browser expands document scroll width to 528px–532px. This hides content
   beyond the viewport and makes the core case study horizontally unusable.

The correction belongs first to the structured-document renderer: establish a
bounded/minmax document grid track and constrain section/child min-content to
the primary track. Then verify table and preformatted blocks retain intentional
local horizontal scrolling. Do not use global `overflow-x: hidden`.

## Smallest correction passes

1. **P0 shared structured-document mobile width correction — mid-tier.** Fix
   only renderer grid/section min-content behavior; test the comprehensive
   document at 360/390/430 and preserve table/pre local scrolling.
2. **Keyboard Index/focus verification and correction — mid-tier.** Reproduce
   AK-01 with a physical keyboard path, correct only confirmed activation or
   readiness ownership, then verify close focus from Index and direct routes.
3. **Touch, reduced-motion, and Stage 3 regression completion — mid-tier QA.**
   No architecture work unless it reproduces a functional defect.
4. **Optional mobile density refinement — low/mid-tier.** Consider only after
   functional blockers are closed; RS-01 does not justify a mobile redesign.

## Files changed by this audit

- `docs/stage-4-minimum-responsive-accessibility-interaction-audit.md` — added
  defect matrix and evidence.
- `docs/release-preparation-roadmap.md` — Stage 4 status moved from not started
  to in progress.
