# Public Web Access Semantics — Closeout

**Status:** Accepted and complete
**Date:** August 23, 2026

## Accepted implementation

Direct Resource initialization now reuses the shared active-Reservoir selection seam used by Index and footer Resource selection. When a requested Resource is already represented by the active Reservoir, the coordinator selects that node, rotates the existing Reservoir group to the canonical forehead point, and continues normal Inspection opening. It does not create a Query Reservoir.

Contextual Resource routes add one eligibility condition to that reuse: the
active Collection must match the Collection encoded by the URL. If a Resource
is shared by multiple Collections and another Collection is active, the
coordinator reconstitutes the requested Collection first, then uses the same
existing-node focal/Inspection seam. Existing matching Collection history is
reused so the correction does not add a duplicate settled visit.

The explicit `/q/<resource-slug>` route passes through the established Query Reservoir path and remains semantically distinct. Resources absent from the active Reservoir retain the direct Resource → Query Reservoir fallback. Browser route restoration uses the same distinction.

Supporting-Resource navigation from an open Inspection is the explicit
exception to active-node reuse: it always disables that optimization, creates
the supporting Resource's ephemeral Query Reservoir, and preserves the
originating `InspectionReturnFrame` history boundary for Back/restoration.

## Verification

- Production `/bellabeat-wellness-analysis` keeps Home as the underlying active context, focuses the existing Bellabeat node, opens Inspection at the direct Resource URL, and does not create a one-result Query Reservoir.
- Refreshing production `/bellabeat-wellness-analysis` preserves that same Home/active-node behavior.
- Closing Bellabeat Inspection exposes the Home Reservoir at `/`.
- Production `/q/bellabeat-wellness-analysis` retains its explicit one-result Query Reservoir meaning.
- Branch-local Query Back/Forward and direct Inspection close preserve the expected URLs and contexts without duplicate settled visits.
- The synthetic dual-membership regression rejects active-node reuse from
  Collection A for `/collection-b/resource`, accepts it after Collection B is
  active, preserves ordinary unscoped direct reuse, and rejects contextual
  reuse from an unrelated Query context.
- Live `/contact` exposes the approved LinkedIn and GitHub destinations and refreshes with the Contact form.
- Live `/resume` opens Resume Inspection and exposes the approved PDF download.
- The live Bellabeat GitHub repository destination resolves to `kodyepugh/bellabeat-wellness-analysis`.

## Closeout

The production rollout and four-point Bellabeat route smoke test are complete. This closes the remaining Public Web Essentials access-semantics gate.

The next launch-blocking stage is Bellabeat Recruiter-Path QA. This closeout does not begin or complete that QA stage, the responsive/accessibility/interaction sweep, or Production Release.
