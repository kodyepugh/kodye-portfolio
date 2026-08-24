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

## Completion supplement — August 24, 2026

### Validation update

The required standard `npm run build` was run twice (including one permitted
unsandboxed retry) and failed both times in Turbopack before compilation because
its CSS worker could not bind a local port: `Operation not permitted (os error
1)`. This is an environment/build-tool blocker, not evidence of an application
compile failure. The earlier `npm run build -- --webpack` passed and remains
supplemental evidence only. Typecheck, content (56/56), Inspection (86/86),
routing, label geometry, and diff check pass.

`npm run lint` remains the exact prior baseline: 7 errors and 3 warnings.

| File / line | Rule | Classification |
| --- | --- | --- |
| `InspectionImageViewer.tsx:171,207,225,524` | `react-hooks/set-state-in-effect` | React lifecycle/state hygiene; touches the image viewer but no corresponding Stage 4 runtime defect was reproduced. |
| `InspectionImageViewer.tsx:178` | `react-hooks/exhaustive-deps` | Lifecycle hygiene. |
| `NotebookInspectionBody.tsx:214` | `react-hooks/immutability` | Renderer correctness/hygiene; intersects the notebook surface and requires correction-pass review. |
| `ReservoirScene.tsx:3077,3951` | `react-hooks/set-state-in-effect` | Reservoir interaction lifecycle hygiene. |
| `ReservoirScene.tsx:3965,4841` | `react-hooks/exhaustive-deps` | Reservoir interaction lifecycle hygiene. |

### Completed viewport matrix

| Viewport | Result |
| --- | --- |
| 1440 x 900 | Shell fits; Index, layout controls, and footer remain within viewport. |
| 1280 x 720 | Shell fits under vertical compression; no page overflow. |
| 1024 x 900 | Shell fits; no page overflow. |
| 768 x 900 | Shell fits; no page overflow. |
| 360 x 800 | Shell and ordinary Bellabeat, Resume, Contact, and image Inspections fit. |
| 390 x 844 | Prior measurements retained; shell fits, with visually dense composition. |
| 430 x 932 | Shell fits; ordinary Bellabeat, Resume, and Contact fit. |

The native Index trigger rectangle is 38 x 18px in every sampled shell
viewport. This is below a 24px minimum visual target dimension, but its actual
pointer hit area and accessibility outcome need physical-device confirmation;
it is recorded as RS-02 rather than inflated to a blocker.

### Defect-matrix updates

| ID | Priority | Viewport/input | Surface | Result and correction boundary | Stage 4 blocker |
| --- | --- | --- | --- | --- | --- |
| RS-01 | P2 | 360, 390, 430 mobile | Reservoir shell | Still visually dense but no collision, page overflow, or obstructed required control was observed. Keep as refinement only. | No |
| RS-02 | P2 | 360–1440, pointer | Index trigger | Visible trigger rect is 38 x 18px. Confirm actual hit target on a physical touch device before changing target geometry. | No |
| IR-03 | P1 | 360 x 800, mouse | Notebook Inspection | The `.inspection-notebook` is 277px wide but has 360px scroll width; a markdown section and descendants render to 360px/right 401px. `pre` correctly scrolls locally (998px within 275px), so code is not the root cause. Inspect notebook markdown-cell/section width constraints separately from IR-01. | Yes |
| AK-01 | Not reproduced as an application defect | 390 x 844, automation keyboard | Index | Locator Enter/Space and CUA Tab did not focus/activate the native button, while pointer click opened it. CUA Tab stayed on `body`, so this browser-control path cannot establish physical/native keyboard behavior. No handler change authorized. | Not yet determined |
| RM-01 | Passed, bounded | 390 x 844, CDP reduced motion | Bellabeat Inspection | With `prefers-reduced-motion: reduce`, direct Bellabeat Inspection opened (dialog true; page width 390px) and Escape closed it. Collection/Query/layout/Home/Back-to-Top variants remain untested. | No finding |

The repository external-link Inspection was observed settled at 360 x 800:
dialog true, 277px primary track, 320px chassis, page width 360px, and no
page-level overflow. Its context shelf is locally scrollable (311px within a
277px panel). The 430px direct-route sample did not settle within the 7-second
measurement interval and is **not tested**, not a failure. The same qualification
applies to the 430px image and notebook direct-route samples.

The comprehensive direct-route samples in this completion run did not settle;
IR-01 remains confirmed by the prior dedicated measurement table above and is
not weakened by those empty samples.

### Keyboard, touch, reduced motion, and Stage 3 status

- Keyboard: semantic names and dialog role remain observed. Native keyboard
  tab/focus and Index navigation are **not tested conclusively** because the
  available native-key injection did not move focus out of `body`; do not treat
  that automation limitation as an application failure.
- Touch/pinch/swipe: **not tested**. The in-app browser exposed mouse CUA only;
  no trustworthy touch-device path was available. Do not infer gesture success
  from pointer tests.
- Reduced motion: direct open/close passed as described above; all other
  transition paths are **not tested**.
- Stage 3 full repository Query/Inspection Back/Forward/return/reading-position
  sequence: browser Back from repository Inspection restored the same repository
  Query (`/q/bellabeat-wellness-analysis-repository`, dialog closed), and browser
  Forward restored the repository Inspection. A controlled Pass B rerun proved
  that the subsequent return also passes once Bellabeat reading restoration is
  allowed to converge. The earlier scroll-zero observation sampled the expected
  deploying/reopening phase rather than the final transaction result.

| ID | Priority | Viewport/input | Surface | Reproduction / actual | Likely ownership and boundary | Stage 4 blocker |
| --- | --- | --- | --- | --- | --- | --- |
| SG-01 | Not reproduced | 390 x 844 and 1280 x 720, browser Back/Forward | Bellabeat → repository support detour → return | Cases A–E restored the owned Bellabeat Inspection entry and practical reading position. The prior scroll-zero sample was captured while restoration diagnostics reported `deferred: inspection-reading-state`, local Inspection phase `deploying`, and return phase `reopening-inspection`; convergence then restored the stored position. | No navigation correction. Preserve the accepted Stage 3 coordinator and require convergence before classifying a return result. | No |

### Revised correction planning

1. **Pass A — IR-01, mid-tier, independent.** `app/globals.css` structured
   document grid/section min-content constraints; retain local table/pre scroll.
2. **Pass B — IR-03, mid-tier, independently testable after Pass A.** Notebook
   markdown-cell/section width constraints plus the existing notebook lint
   immutability finding only if it is causally related.
3. **Pass C — physical input completion, mid-tier QA.** Native keyboard Index,
   touch gestures, and full reduced-motion transitions;
   no implementation until a reproducible issue exists.
4. **Pass D — RS-01/RS-02 refinement, low-to-mid tier.** Only after physical
   target testing; no mobile composition redesign.

No application fixes or persistent diagnostic instrumentation were implemented.

## Pass A — Mobile structured-document containment — August 24, 2026

**Status:** Implemented and verified; Stage 4 remains in progress.

### Root cause and correction

IR-01's root cause was confirmed. The shared Inspection chassis and primary
track were already bounded; the unbounded implicit grid column in
`.structured-document` allowed intrinsic descendants to enlarge the renderer.
Sections had only a `max-width`, so they inherited that oversized track.

`app/globals.css` now gives the shared renderer a one-column
`minmax(0, 1fr)` grid and explicit `width`, `max-width`, and `min-width`
ownership. Semantic sections use the same bounded contract while retaining the
700px desktop editorial maximum and alternating alignment. Table/code wrappers
now own their local scroll allocation; tables retain intrinsic width inside that
scroller. Inline code can break when a path or other token would enlarge the
reading column.

### Results

| Surface / viewport | Before | After | Result |
| --- | --- | --- | --- |
| Comprehensive, 360 x 800 | page 528px; document implicit track 486px; 277px primary | page 360px; 277px chassis primary/document/section | IR-01 resolved |
| Comprehensive, 390 x 844 | page 529px; document implicit track 486px; 303px primary | page 390px; 303px primary/document/section | IR-01 resolved |
| Comprehensive, 430 x 932 | page 532px; document implicit track 486px; 338px primary | page 430px; 338px primary/document/section | IR-01 resolved |
| Comprehensive, 768 x 900 | not previously measured after correction | page 768px; 584px primary/document/section | Pass |
| Comprehensive, 1280 x 720 | not previously measured after correction | page 1280px; 880px document; editorial sections remain 700px | Pass |
| Comprehensive, 1440 x 900 | not previously measured after correction | page 1440px; 880px document; editorial sections remain 700px | Pass |
| Notebook, 360 x 800 | page 360px but notebook scroll width 360px; markdown section escaped a 277px primary | page 360px; notebook, embedded document, and section all 277px | IR-03 resolved by shared correction |
| Notebook, 390 x 844 | not complete before Pass A | page 390px; notebook, embedded document, and section all 303px | Pass |
| Notebook, 768 x 900 | not complete before Pass A | page 768px; notebook/document 584px; section 584px | Pass |
| Notebook, 1280 x 720 | desktop sanity pending before Pass A | page 1280px; notebook/document 880px; editorial section 700px | Pass |
| Resume, 360 / 390 / 1280 | compact regression risk | pages equal viewport; structured document equals 277px / 303px / 880px primary | Pass |
| Ordinary Bellabeat, 360 / 1280 | figure regression risk | pages equal viewport; figures are 277px / 700px within the bounded document | Pass |

The widest comprehensive table now measures 3912px intrinsically inside a
277px/303px/338px `.structured-document__table-scroll`; the wrapper, section,
document, and page remain bounded. This is intentional semantic local scrolling,
not page overflow. Notebook `pre` remains locally scrollable at 998px content
inside 275px (360px viewport), 301px (390px), 496px (768px), and 792px
(1280px) client widths.

### Validation update

- `npm run typecheck` — pass.
- `npm run validate:content` — pass (56/56).
- `npm run validate:inspection` — pass (86/86).
- `npm run validate:routing` — pass.
- `npm run validate:label-geometry` — pass with the existing Node module-type warning.
- `git diff --check` — pass.
- `npm run lint` — unchanged baseline: 7 errors and 3 warnings; none introduced by Pass A.
- `npm run build` — still fails before application compilation because Turbopack's CSS worker cannot bind a local port (`Operation not permitted`), including the permitted retry. Webpack build was run as supplemental evidence.
- `npm run build -- --webpack` — compilation reached `Compiled successfully`, but its terminal completion was not returned. A later retry reported another Next build process/lock while no live build process was observable. The lock was not removed, so supplemental production-build completion remains unverified.

IR-01 and IR-03 are closed for this correction pass. Remaining Stage 4 work is
native keyboard and touch verification, reduced-motion transition coverage,
and any non-blocking shell refinement.

## Pass B — SG-01 support-detour return investigation — August 24, 2026

**Result:** SG-01 not reproduced; no application behavior changed. Stage 4
remains in progress.

### Controlled matrix

All mobile cases began in a fresh browser tab at 390 x 844. Bellabeat was
scrolled to a meaningful reading position; the captured return frame stabilized
at `scrollY = 8954` in this browser's scroll-unit behavior.

| Case | Result |
| --- | --- |
| A — immediate close after Forward | Pass. The close control first became available with browser restoration already `converged`, no pending restoration ID, no pending close transaction, browser-write mode `push`, and the restored Repository Inspection entry selected. Close reused the exact Repository Query predecessor; semantic Back restored Bellabeat at 8954. |
| B — converged close after Forward | Pass. Repository Query entry `browser-entry-505592a2-343b-4beb-ad08-e45482aaa248` and Repository Inspection entry `browser-entry-9ddbaa26-5c18-487c-85d9-c164ca4102d7` remained distinct and stable. Close returned to the Query entry; semantic Back restored origin entry `browser-entry-b9965e4a-6ee5-4a77-9d0d-2758147f0989` at 8954. |
| C — no browser Back/Forward | Pass. Ordinary Repository close exposed its Query and semantic Back restored Bellabeat at 8954. |
| D — browser Back only | Pass. Browser Back converged on the same Repository Query visit; semantic Back restored Bellabeat at 8954. |
| E — delayed repeatability | Pass twice: once at 390 x 844 and once at 1280 x 720. Both runs returned to Bellabeat at 8954 with return phase `restored`. |

The Query frame retained the origin return boundary in every case:
`reservoir-visit-0` carried the Bellabeat Resource ID and stored reading frame,
while `reservoir-visit-1` remained the single Repository Query visit. Browser
Back/Forward changed owned browser entries without duplicating either semantic
history frame.

### Root cause of the prior observation

The initial Stage 4 audit sampled the return after a fixed short wait. At that
moment the pathname and Bellabeat dialog had returned, but the application-owned
state explicitly reported:

- browser restoration phase `deferred` with reason
  `inspection-reading-state`;
- pending restoration entry equal to the original Bellabeat entry;
- local Inspection phase `deploying`;
- return runtime phase `reopening-inspection`;
- current scroll position 0 with target `scrollY = 8954`.

On the next convergence observation, the same owned Bellabeat entry reported
browser restoration `converged`, Inspection phase `reading`, return phase
`restored`, and actual `scrollY = 8954`. The candidate was therefore a QA
sampling error, not a close/restoration ownership race. The hypothesized stale
`{ mode: "none" }` close transaction was not present when close became
available; normal close ownership had already been handed back.

### Regression checks

- Repository Inspection → browser Back → same Query → browser Forward → same
  Inspection: pass.
- Repository close → Query → semantic Back → originating Bellabeat Inspection:
  pass with practical reading restoration.
- Back-to-Top from restored Bellabeat: pass; scroll returned to 0, Close received
  focus, and Back-to-Top hid.
- Support detour → Repository close → Home: pass; `/` became the active root,
  Inspection closed, Reservoir history reset to `reservoir-visit-0`, and no
  Inspection return frame remained.
- Pass A mobile protection at 390 x 844: comprehensive and notebook pages both
  remained 390px wide with 303px primary/renderer tracks.

Temporary read-only data attributes exposed pending close ownership, pending
Inspection browser-write mode, restoration revision, and per-frame return
summaries during diagnosis. They were removed after the matrix; no persistent
instrumentation or navigation code remains in the diff.

### Validation

- `npm run typecheck` — pass.
- `npm run validate:content` — pass, 56/56 checks.
- `npm run validate:inspection` — pass, 86/86 checks.
- `npm run validate:routing` — pass.
- `npm run validate:label-geometry` — pass with the existing Node
  `MODULE_TYPELESS_PACKAGE_JSON` warning.
- `npm run lint` — unchanged repository baseline: 7 errors and 3 warnings in
  `InspectionImageViewer.tsx`, `NotebookInspectionBody.tsx`, and
  `ReservoirScene.tsx`; none are introduced by this documentation-only pass.
- `npm run build` — environment-blocked. Turbopack's CSS worker could not bind a
  local port and returned `Operation not permitted (os error 1)` in both the
  sandboxed run and permitted retry. This is not recorded as a successful build
  or as an application compile regression.
- `git diff --check` — pass.
