# Bellabeat Recruiter-Path QA — Browser Navigation Transaction Record

**Status:** Branch-local correction verified; production retest required
**Date:** August 24, 2026
**Stage:** Bellabeat Recruiter-Path QA remains in progress

## Accepted branch model

An owned browser entry represents one settled semantic state: a Collection or
root Reservoir, a single-result Query Reservoir, or a Resource Inspection over
its encoded Reservoir context. Reconstitution, focal rotation, Inspection
animation, reading restoration, and Index/footer closure are not browser
destinations.

Schema-versioned entries carry a stable entry ID, canonical path, complete
Reservoir-history snapshot, inspected Resource identity, initial-entry status,
and the immediately preceding owned entry's semantic fingerprint when one
exists. Entry equality uses the full restoration descriptor. Equal paths do not
make distinct visits equal.

The shared browser-history coordinator is the only application layer that
calls `pushState`, `replaceState`, or `back`. Browser selection creates a
latest-wins restoration intent and performs no browser write while restoring.
Interface controls remain locked until the selected entry, URL, active
Reservoir visit, Inspection state, and owned practical reading frame converge.

## Browser-write audit

| Navigation action | Stable browser transaction | Settled result |
| --- | --- | --- |
| Initial root, Collection, direct Resource, contextual Resource, or explicit Query route | Replace the selected document entry with its route-derived owned state | Canonical route with one selected semantic snapshot |
| Collection/Query context commit | Push the settled Reservoir descriptor | `/`, `/<collection>`, or `/q/<resource>` with Inspection closed |
| Resource open from a node, Index, footer, or settled Query | Push the settled Inspection descriptor | Direct or contextual Resource URL over the existing Reservoir visit |
| Supporting-Resource detour | Push Query, then push Inspection | Origin Inspection → support Query → support Inspection |
| Collection detour from Inspection | Suppress transient reconstitution and push one final Collection entry | Requested Collection visible with Inspection closed |
| Ordinary X/Escape close | Select the verified predecessor with Back; otherwise replace with the underlying Reservoir | Existing underlying entry is reused and direct initial entry cannot leave the application |
| Browser Back/Forward restoration | No write | Exact selected entry and stored Reservoir-history visit are restored |
| Interface Back/history selection | Select an exact adjacent owned entry with Back; otherwise push one final restored destination | No transient underlying Reservoir entry is exposed |
| Home | Push one root snapshot and reset application-owned history/return state | `/`, root active, Inspection closed |
| Valid legacy or invalid-owned entry | Replace with canonical route-derived state | Bounded direct-route recovery |
| Redirect or unavailable route | Canonical root navigation or bounded hard navigation to the selected path | Next redirect/unavailable handling owns the result |

## Transaction matrix

| Starting state and action | Final semantic state | Internal-history and Forward contract |
| --- | --- | --- |
| A Inspection → select supporting B | B Query, then B Inspection in separate entries | B Inspection Back exposes the same B Query visit; Forward reopens B without a new visit or node |
| B Inspection → X/Escape | Existing B Query predecessor | Back restores A Inspection; Forward traverses the same B Query and B Inspection entries |
| B Query → interface Back/history title | A Inspection at its owned practical reading frame | Adjacent exact entry is reused; otherwise only the final A Inspection is pushed |
| Support detour → Home | Root Reservoir | Return frame is discarded; browser Back/Forward still restores selected owned entries |
| A Inspection → Collection pill | Requested Collection Reservoir | Reconstitution is transient; Back/history restores A Inspection without an intermediate browser destination |
| Direct Resource already in active Reservoir | Resource Inspection over that Reservoir | Existing node and visit are reused; no Query is created |
| Direct Resource absent from active Reservoir | Query, then Resource Inspection | Query remains an independently selectable browser state |
| Explicit `/q/<resource>` | Query Reservoir | It remains explicit and does not auto-open Inspection |
| `/<collection>/<resource>` | Resource Inspection over the encoded Collection | A different active Collection is reconstituted without changing Resource identity |
| Repeated same URL with a different snapshot | Distinct owned entry | Back/Forward selects by entry identity and descriptor, not pathname |
| Older visit whose context equals the active context | Selected stored visit, including any return frame | Snapshot is applied directly; no redundant spatial transition is required |
| Back/Forward while Index/footer or a semantic transition is active | Latest selected owned entry | Control planes close fully, stale continuations are revision-cancelled, and only the latest selection settles |
| Invalid descriptor/path pair, legacy state, or unavailable route | Restore, reinitialize, redirect, or hard-navigate according to bounded recovery policy | URL and rendered semantic state cannot remain divergent |

## Branch-local QA result

Real browser QA passed the support-detour, close-then-browser, interface Back,
Home, Collection-detour, repeated-same-URL, Index/footer open-opening-closing,
rapid-supersession, direct refresh, explicit Query, legacy-entry, and
unavailable-route paths. In the support sequence, Forward reopened B Inspection
over the browser entry's existing B Query visit ID; it did not append a Query
visit or create another node. Returning to A restored its captured reading
position within the practical browser-scroll tolerance.

The sparse launch registry does not expose a second selectable published
Collection or a visible same-context duplicate through the public interface.
Those two coordinator branches are therefore covered by behavioral tests using
synthetic published memberships/repeated history frames; the production-facing
Bellabeat, Resume, root, Query, Index, footer, and support paths were exercised
in the running application.

No responsive/accessibility sweep is accepted by this record. Stage 3 remains
open until this branch is deployed and the support-detour Back/Forward stack,
ordinary Inspection close, interface Back, Home, and direct refresh behavior
are explicitly rechecked on `kodyepugh.com`.
