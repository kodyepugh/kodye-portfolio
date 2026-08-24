# Public Web Access Semantics — Closeout

**Status:** Implementation accepted; production rollout pending
**Date:** August 23, 2026

## Accepted implementation

Direct Resource initialization now reuses the shared active-Reservoir selection seam used by Index and footer Resource selection. When a requested Resource is already represented by the active Reservoir, the coordinator selects that node, rotates the existing Reservoir group to the canonical forehead point, and continues normal Inspection opening. It does not create a Query Reservoir.

The explicit `/q/<resource-slug>` route passes through the established Query Reservoir path and remains semantically distinct. Resources absent from the active Reservoir retain the direct Resource → Query Reservoir fallback. Browser route restoration uses the same distinction.

## Verification

- Branch-local `/bellabeat-wellness-analysis`: Home remains the active context, the existing Bellabeat node is selected, the runtime reports `active-reservoir`, Inspection opens at the direct Resource URL, and close returns to `/` with the single Home history visit.
- Branch-local refresh of `/bellabeat-wellness-analysis`: the same Home/active-node behavior is restored.
- Branch-local `/q/bellabeat-wellness-analysis`: runtime reports `query-reservoir`, with one Query result and Home as its return context.
- Branch-local Query Back/Forward and direct Inspection close preserve the expected URLs and contexts without duplicate settled visits.
- Live `/contact` exposes the approved LinkedIn and GitHub destinations and refreshes with the Contact form.
- Live `/resume` opens Resume Inspection and exposes the approved PDF download.
- The live Bellabeat GitHub repository destination resolves to `kodyepugh/bellabeat-wellness-analysis`.

## Remaining blocker

The currently deployed production `/bellabeat-wellness-analysis` still reports the pre-correction one-result Query Reservoir path. Redeploy this branch, then smoke-test the production Bellabeat direct route, refresh, Inspection close, and `/q/bellabeat-wellness-analysis` distinction. Public Web Essentials remains open until that production verification passes.

This closeout does not begin Bellabeat Recruiter-Path QA, the responsive/accessibility/interaction sweep, or Production Release.
