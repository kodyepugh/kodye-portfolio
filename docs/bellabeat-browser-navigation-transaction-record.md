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

On document load, a current, path-matching owned entry is the authoritative
initialization source. Its exact Reservoir-history frame and visit IDs,
Inspection identity, Inspection return frame, and practical reading state are
restored without appending route-derived visits. Route-derived initialization
is reserved for unowned, legacy, or invalid owned entries.

The shared browser-history coordinator is the only application layer that
calls `pushState`, `replaceState`, or `back`. Browser selection creates a
latest-wins restoration intent and performs no browser write while restoring.
Interface controls remain locked until the selected entry, URL, active
Reservoir visit, Inspection state, and owned practical reading frame converge.
Stored predecessor metadata is only an adjacency hint: after an asynchronous
Back selection, the coordinator verifies the selected entry ID, path, and full
restoration fingerprint before settling it. A mismatch commits the originally
requested destination with the transaction's push-or-replace fallback policy.

Owned-entry failure recovery replaces and reloads the selected entry in place;
it does not append a recovery entry. A session-scoped guard permits one retry
for the same entry, path, and failure reason, then replaces that entry with the
safe root state if the same recovery fails again. The root Collection's public
identity remains `/`, so `/<root-collection-slug>/<resource-slug>` is handled
by a server redirect to the direct Resource URL before client restoration.

Inspection reading restoration is verified against a target bounded to current
scroll and terminal/footer geometry while the original browser descriptor
retains exact ownership. Back-to-Top visibility is reconciled from current
close-control geometry after restoration, scrolling, resize, font/content
reflow, image load, and post-content offset changes, with an
`IntersectionObserver`-independent fallback.

## Browser-write audit

| Navigation action | Stable browser transaction | Settled result |
| --- | --- | --- |
| Initial unowned root, Collection, direct Resource, contextual Resource, or explicit Query route | Replace the selected document entry with its route-derived owned state | Canonical route with one selected semantic snapshot |
| Reload a valid path-matching owned entry | No write; restore the selected entry as authoritative | Exact stored visit IDs, Inspection/return ownership, and reading frame survive |
| Collection/Query context commit | Push the settled Reservoir descriptor | `/`, `/<collection>`, or `/q/<resource>` with Inspection closed |
| Resource open from a node, Index, footer, or settled Query | Push the settled Inspection descriptor | Direct or contextual Resource URL over the existing Reservoir visit |
| Supporting-Resource detour | Push Query, then push Inspection | Origin Inspection → support Query → support Inspection |
| Collection detour from Inspection | Suppress transient reconstitution and push one final Collection entry | Requested Collection visible with Inspection closed |
| Ordinary X/Escape close | Select the verified predecessor with Back; otherwise replace with the underlying Reservoir | Existing underlying entry is reused and direct initial entry cannot leave the application |
| Browser Back/Forward restoration | No write | Exact selected entry and stored Reservoir-history visit are restored |
| Interface Back/history selection | Select an exact adjacent owned entry with Back; otherwise push one final restored destination | No transient underlying Reservoir entry is exposed |
| Home | Push one root snapshot and reset application-owned history/return state | `/`, root active, Inspection closed |
| Valid legacy or invalid-owned entry | Replace with canonical route-derived state, then reinitialize in place | Recovery does not append another entry |
| Root-context contextual Resource URL | Server redirect | One canonical direct Resource URL; client restoration never enters a mismatch loop |
| Unavailable route or failed owned restoration | Replace/reload the selected entry under the bounded recovery guard | URL and rendered semantic state converge without a recovery loop |

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
| Reload either of two same-path owned snapshots | The selected snapshot's exact state | Entry identity and practical reading state are retained independently |
| Older visit whose context equals the active context | Selected stored visit, including any return frame | Snapshot is applied directly; no redundant spatial transition is required |
| Back/Forward while Index/footer or a semantic transition is active | Latest selected owned entry | Control planes close fully, stale continuations are revision-cancelled, and only the latest selection settles |
| Stale predecessor hint selects the wrong adjacent entry | Requested final restoration committed with the retained fallback policy | Incorrect selected entry is not exposed as the interface action's settled result |
| `/digital-reservoir/<root-member-resource>` | `/<resource>` | One server-owned canonical redirect; Back/Forward does not create duplicate settled visits |
| Invalid descriptor/path pair, legacy state, unavailable target, or repeated restoration failure | Restore, reinitialize, redirect, or replace/reload according to bounded recovery policy | URL and rendered semantic state cannot remain divergent or loop indefinitely |

## Branch-local QA result

This correction pass reverified the required focused matrix in a real localhost
browser. The Bellabeat support detour retained the same B Query visit ID through
B Inspection → browser Back → browser Forward. Reloading the originating
Bellabeat Inspection, B Query, and B Inspection preserved their exact owned
entry and Reservoir-history identities. Two owned snapshots of the same
Resource URL retained distinct entry IDs and reading positions across reload,
Back, and Forward.

The combined stale-predecessor sequence selected the changed root ancestor,
rejected it by entry ID/path/fingerprint, and established one requested
Bellabeat Inspection fallback branch. A valid adjacent predecessor still reused
the original entry with no fallback. The root contextual Bellabeat URL performed
one server-owned redirect to `/bellabeat-wellness-analysis`; refresh and
Back/Forward produced no loop or duplicate settled visit.

Deep, shallow, resized, and fully revealed terminal/footer reading frames
converged against current bounded geometry without recovery. On restored deep
Bellabeat state, Back-to-Top appeared without manual scrolling and returned to
scroll position zero, focused the close control, and hid itself for pointer,
keyboard, and reduced-motion activation. It stayed correct through viewport
resize and a real figure-load reflow; the shallow restored state kept it hidden.
Invalid owned and descriptor/path-mismatch states reinitialized the selected
entry in place without a duplicate. Legacy handling and repeated-failure guard
exhaustion are covered deterministically by the routing validator.

The sparse launch registry still does not expose a second selectable published
Collection through the public interface. Contextual non-root Collection
ownership remains covered by the existing synthetic published-membership
behavioral validation rather than this Bellabeat runtime matrix.

No responsive/accessibility sweep is accepted by this record. Stage 3 remains
open until this branch is deployed and the support-detour Back/Forward stack,
owned-entry refresh, ordinary Inspection close, interface Back, restored-reading
Back-to-Top behavior, root contextual redirect, and bounded recovery are
explicitly rechecked on `kodyepugh.com`.
