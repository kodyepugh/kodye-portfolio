# Bellabeat Recruiter-Path QA — Browser Navigation Transaction Record

**Status:** Production visual/runtime QA accepted; Stage 3 complete
**Date:** August 24, 2026
**Stage:** Bellabeat Recruiter-Path QA complete

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

Physical browser Back is an optimization restricted to exact adjacency known
by the current live document. Each document owns a bounded in-memory registry
of entry ID to restoration fingerprint. Startup registers only the selected
valid owned entry; persisted predecessor metadata does not seed the registry.
Pushes, replacements, and owned entries selected by events handled in that
document update the registry. A retained entry ID receives the replacement
fingerprint, so its prior fingerprint stops being known. A full reload creates
fresh knowledge, while BFCache restoration of the same document may retain it.

The shared browser-history coordinator is the only application layer that
calls `pushState`, `replaceState`, or `back`. Browser selection creates a
latest-wins restoration intent and performs no browser write while restoring.
Interface controls remain locked until the selected entry, URL, active
Reservoir visit, Inspection state, and owned practical reading frame converge.
Stored predecessor metadata is only an adjacency hint. Back is eligible when
the current entry's exact fingerprint is known, the predecessor ID and stored
fingerprint are known as the same current-document entry, and the requested
restoration has that predecessor fingerprint. Otherwise `back-or-push` and
`back-or-replace` immediately use push and replace respectively, without a
pending token, timeout, or physical Back-request increment.

After an eligible asynchronous Back selection, the coordinator still verifies
the selected entry ID, path, and full restoration fingerprint before settling
it. A mismatch commits the originally requested destination with the retained
push-or-replace fallback. Each eligible Back handoff owns a unique token, its
starting browser-selection key, and one bounded no-selection check. A matching
selection signal cancels that check. If the key changed without a processed
signal, the coordinator verifies and restores the currently selected entry
through the same path; if the key did not change, it applies the retained
fallback without issuing Back again. Newer transactions supersede older
tokens, so a stale check cannot keep input locked or overwrite a newer
selection.

Every owned replacement strips the prior Digital Reservoir marker,
`schemaVersion`, `entryId`, `path`, `initial`, `restoration`, and `predecessor`
before applying the complete replacement entry. Unrelated browser, Next.js, and
other state remains intact. An optional owned field omitted by the replacement
therefore cannot survive from the prior entry.

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
| Ordinary X/Escape close | Select an exact current-document predecessor with Back; otherwise replace with the underlying Reservoir | Existing verified entry is reused; refreshed/unverified close cannot unload before fallback, and direct initial entry cannot leave the application |
| Browser Back/Forward restoration | No write | Exact selected entry and stored Reservoir-history visit are restored |
| Interface Back/history selection | Select an exact current-document adjacent entry with Back; otherwise push one final restored destination | Refreshed/unverified navigation branches directly to the semantic target; no transient underlying Reservoir entry is exposed |
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
| Refreshed B Query → interface Back/history title | A Inspection at its owned practical reading frame | The fresh document knows only B, so no physical Back is attempted and one final A Inspection fallback is pushed |
| Refreshed B Inspection → X/Escape | Its stored B Query visit | No physical Back is attempted; the selected Inspection entry is replaced with the same Query visit and entry identity |
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
| Back changes the selection but its event is missed | Currently selected owned entry verified and restored | No fallback entry or duplicate settled visit is created |
| Back cannot move from the selected entry | Requested restoration committed with the retained fallback policy | One Back request, one bounded handoff check, and no permanent pending/input lock |
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

After a real B Query hard refresh, interface Back made zero physical Back
requests, created no pending token, never selected root, and reopened Bellabeat
at the exact owned practical reading frame. After a real B Inspection hard
refresh, both X and Escape made zero physical Back requests and directly
replaced the selected entry with the same B Query visit and entry ID; no
duplicate Query visit was created. Without refresh, B Inspection close made one
physical Back request and B Query interface Back made one more, each reusing
its exact adjacent entry with no fallback.

In the stale retained-ID replacement sequence, replacing direct-initial
Bellabeat with root updated that known entry's fingerprint. The old Bellabeat
predecessor therefore skipped Back and used its direct fallback both before and
after B Query refresh, with zero physical Back requests and no pending token.
A controlled same-document wrong-adjacent case with genuinely established
eligibility still made exactly one Back request, rejected the changed root
entry, consumed exactly one retained fallback, and settled Bellabeat with the
token cleared. A valid adjacent predecessor still reused the original entry
with no fallback. The root contextual Bellabeat URL performed one server-owned
redirect to `/bellabeat-wellness-analysis`; refresh and Back/Forward produced
no loop or duplicate settled visit.

Replacement-state validation removed malformed and valid-but-stale predecessor
metadata whenever the complete replacement omitted it, replaced every other
owned field, retained unrelated framework and arbitrary state, and produced an
entry accepted by the owned-entry parser. The repaired entry could not initiate
Back from the removed predecessor. Browser recovery and direct-initial close
confirmed the same preservation and sanitization behavior in place.

The bounded Back handoff restored a valid adjacent selection normally and kept
the existing wrong-adjacent fallback behavior. In the no-movement case it made
exactly one Back request, applied exactly one retained fallback after the
unchanged-key check, cleared the pending token, and unlocked input. With browser
movement but selection listeners suppressed, it processed the changed current
entry, left the fallback count and history length unchanged, converged the
requested root state, and unlocked input. Deterministic token coverage rejects
superseded callbacks.

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

## Production closeout

The corrected branch was deployed for final visual/runtime verification. The user completed the Bellabeat recruiter-path smoke test and accepted the resulting navigation behavior, including support-detour Back/Forward behavior, refreshed Query/interface Back, refreshed Inspection close, practical reading restoration, restored-state Back-to-Top, and the expected root/Home behavior.

Bellabeat Recruiter-Path QA is therefore closed. Later responsive/accessibility work may exercise these paths again, but this transaction model should be treated as accepted unless a reproducible functional regression is found.