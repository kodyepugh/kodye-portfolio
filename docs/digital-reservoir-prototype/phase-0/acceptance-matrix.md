# Digital Reservoir Prototype Acceptance Matrix

**Status:** Phase 0 proposal  
**Version:** 0.1  
**Date:** 2026-08-31  
**Purpose:** Convert the Prototype Charter into observable completion evidence.

## 1. Interpretation

Priority:

- **P0** — blocking. The prototype is not complete without it.
- **P1** — required quality criterion. May not block an intermediate milestone, but blocks release-candidate acceptance.
- **P2** — useful extension only when it does not threaten the bounded prototype.

Evidence types:

- **A** — automated test or machine-produced benchmark;
- **M** — manual product/visual validation;
- **R** — independent review;
- **D** — durable documentation or audit record.

A criterion is complete only when its evidence is linked from the execution plan. “Implemented” without evidence is not accepted.

## 2. Phase 0 and repository boundary

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| GOV-01 | P0 | The live portfolio remains unchanged by prototype implementation. | Prototype code exists only in the approved new repository; current portfolio receives no platform dependencies or migrations. | A, R | Gate 0 | Lead |
| GOV-02 | P0 | Canonical Phase 0 documents are approved before broad implementation. | Approved charter, architecture, contracts, matrix, reuse plan, and execution plan are versioned and referenced by `AGENTS.md` in the new repository. | D | Gate 0 | Lead |
| GOV-03 | P0 | Product decisions are distinct from implementation decisions. | Decision log labels product, architecture, and reversible implementation decisions; unresolved product changes are escalated. | D, R | All | Lead |
| GOV-04 | P0 | No workstream silently changes shared contracts. | Contract package tests pass; breaking contract changes include an accepted decision record. | A, R | All | Contracts |

## 3. Identity, catalog, and storage

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| CAT-01 | P0 | Registration issues a stable Resource identity before enrichment completes. | Upload API returns Resource ID/address and `registered` status while compiler job remains pending. | A | Gate 2 | Resource Fabric |
| CAT-02 | P0 | Direct identity survives rename, new version, promotion, demotion, and Collection changes. | Integration test performs each mutation and resolves the same canonical address afterward. | A | Gate 2 | Resource Fabric |
| CAT-03 | P0 | Collection path and storage location do not define Object identity. | Moving Resource custody and memberships does not change ID/address; tests reject address reuse. | A | Gate 2 | Resource Fabric |
| CAT-04 | P0 | Managed storage works. | Representative supported files upload, download under authorization, and create immutable Version records. | A, M | Gate 2 | Resource Fabric |
| CAT-05 | P0 | One federated-storage adapter proves custody independence. | A Resource backed by the external adapter is queried and inspected without copying into managed storage; unavailable access is explicit. | A, M | Gate 3 | Resource Fabric |
| CAT-06 | P0 | Versions are immutable and ordered. | Re-upload creates a new Version; prior hash, representations, and provenance remain queryable. | A | Gate 2 | Resource Fabric |
| CAT-07 | P1 | Duplicate/version candidates are detectable. | Identical hashes and a near-duplicate fixture create reviewable candidates without merging automatically. | A, M | Gate 2 | Compiler |
| CAT-08 | P0 | Representations do not create duplicate Resource identity. | Original, extracted text, preview, and embedding set all resolve to one Resource/Version chain. | A | Gate 2 | Resource Fabric |

## 4. Compiler and assertions

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| ING-01 | P0 | Supported types are safely identified. | PDF, DOCX, MD/TXT, JPEG/PNG/WebP, and CSV fixtures pass detection; mismatched extensions are handled by detected type. | A | Gate 2 | Compiler |
| ING-02 | P0 | Unsupported or malformed files fail explicitly without losing the Resource. | Resource remains directly addressable with structured failure status and retry eligibility. | A | Gate 2 | Compiler |
| ING-03 | P0 | Compiler stages are idempotent. | Replaying a completed stage for the same Version/compiler version creates no duplicate Object, Representation, or Assertion. | A | Gate 2 | Compiler |
| ING-04 | P0 | Extraction produces useful, attributable representations. | Supported fixtures produce extracted text/table/image previews linked to source Version. | A, M | Gate 2 | Compiler |
| ING-05 | P0 | Segmentation does not automatically flood the catalog. | Large document creates internal segments but no persistent child Resources unless explicitly materialized. | A, M | Gate 2 | Compiler |
| ING-06 | P0 | Summaries are reviewable assertions. | Concise and extended summaries include source/model/version/evidence and begin as `proposed`. | A, M | Gate 2 | Compiler |
| ING-07 | P0 | Relationship, Collection, and Artifact recommendations are proposals, not facts. | Machine recommendations remain pending until user acceptance or an approved rule; rejection is retained in history. | A, M | Gate 2 | Compiler/Curation |
| ING-08 | P0 | Assertion correction and supersession are durable. | User edit creates accepted/superseding assertion while original proposal remains auditable. | A, M | Gate 2 | Curation |
| ING-09 | P1 | Compiler quality is evaluated on representative real files. | User-scored evaluation records usefulness, false positives, missing relations, and curation time for the approved corpus. | M, D | Gate 2 | User/QA |
| ING-10 | P1 | Model/provider failure is recoverable. | Simulated timeout/rate/error leaves deterministic stages intact and permits bounded retry without duplication. | A | Gate 2 | Compiler |

## 5. Ontology and curation

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| ONT-01 | P0 | Persistent Object kinds remain `Collection | Resource`. | Schema and domain tests reject a peer Artifact Object type. | A, R | Gate 0/2 | Contracts |
| ONT-02 | P0 | Artifact is reversible Resource status. | Promote and demote operations retain identity and provenance; membership rules are enforced. | A, M | Gate 2 | Curation |
| ONT-03 | P0 | Only Collections and Artifact-status Resources receive ordinary persistent Collection membership. | Invalid membership mutation is rejected; valid promotion-then-membership succeeds. | A | Gate 2 | Domain |
| ONT-04 | P0 | Support/provenance relationships do not imply membership. | Relationship creation leaves membership unchanged; UI presents the distinction. | A, M | Gate 2 | Domain/Curation |
| ONT-05 | P0 | Curatorial resolution remains deliberate. | A document section can remain internal or be explicitly materialized as a Resource with its own address. | A, M | Gate 2 | Curation |
| ONT-06 | P1 | Unreviewed/unassigned Resources remain discoverable without a catch-all Collection. | Review query/inbox surfaces Resources lacking accepted curation without creating membership. | A, M | Gate 2 | Context/Curation |
| ONT-07 | P0 | Collection recursion is valid and cycle-safe. | Valid nested Collections resolve; prohibited cycles are rejected by domain validation. | A | Gate 2 | Domain |

## 6. Context and navigation

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| CTX-01 | P0 | Collection address resolves to a persistent Collection context. | Direct route/API request returns Collection Context Manifest and history frame. | A | Gate 1/2 | Context |
| CTX-02 | P0 | Resource address resolves to a single-result Query context. | Direct Resource request produces Query Context Manifest without changing Artifact status or membership. | A | Gate 1/2 | Context |
| CTX-03 | P0 | One policy-filtered Context Manifest drives all projections. | Spatial, Index, and Relational adapters receive the same context ID/revision and permitted Object IDs. | A, R | Gate 1 | Context/Projections |
| CTX-04 | P0 | Context and projection state are independent. | Rotating projections creates no history frame and does not change Context Manifest ID/revision. | A, M | Gate 1 | Projection Shell |
| CTX-05 | P0 | Focus, selection, Inspection, and navigation are distinct. | Contract/E2E tests show focus and relational recenter do not navigate; explicit enter/query does. | A, M | Gate 1 | Projection Shell |
| CTX-06 | P0 | Back, Home, and direct history selection work across Collection and Query visits. | E2E scenario proves ordered visits, branch truncation, root reset, and no geometry stored in semantic history. | A, M | Gate 1/4 | Context |
| CTX-07 | P1 | Context-local filters restore correctly. | Query/Collection A and B retain independent filters after Back/history traversal. | A | Gate 4 | Context |
| CTX-08 | P0 | Bounded progressive resolution prevents full-graph delivery. | Large query returns aggregates/cursor within requested service budgets; deeper request expands only selected region. | A | Gate 4 | Context |
| CTX-09 | P0 | Counts and cursors reveal only permitted population. | Two principals receive different permitted counts with no side-channel disclosure of hidden Objects. | A, R | Gate 3 | Context/Policy |

## 7. Projection Sphere

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| PS-01 | P0 | Spatial, Index, and Relational projections form a horizontal cyclic sequence. | Swipe/drag, keyboard, and explicit controls move Spatial ↔ Index ↔ Relational with wraparound. | A, M | Gate 1 | Projection Shell |
| PS-02 | P0 | Transition reads as rotation of an inner surrounding surface, not ordinary tab replacement. | User validates orientation, neighboring-surface cue, movement weight, and continuity on desktop and touch. | M | Gate 1 | User/Projection Shell |
| PS-03 | P0 | Projection rotation preserves active context and valid attention. | Selected Object remains selected across all projections when present; invalid selection clears explicitly after a context change. | A, M | Gate 1 | Projection Shell |
| PS-04 | P0 | Vertical axis is reserved and inert. | Vertical gesture does not trigger an undocumented projection or context mutation; UI communicates no hidden destination. | A, M | Gate 1 | Projection Shell |
| PS-05 | P0 | Reduced-motion projection switching preserves semantics. | Reduced-motion mode uses direct/short transition while context, selection, and focus behave identically. | A, M | Gate 1/4 | Projection Shell |
| PS-06 | P1 | Projection failure does not destroy access. | WebGL failure routes to Index; Relational renderer failure leaves Index/Inspection/navigation usable. | A, M | Gate 4 | Projections/QA |

## 8. Spatial Projection

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| SPA-01 | P0 | Recursive centered Reservoir behavior is preserved. | Root, nested Collection, and Query contexts use one centered reference frame and common navigation commands. | A, M | Gate 1/4 | Spatial |
| SPA-02 | P0 | Layout is deterministic and render-mesh independent. | Same manifest/layout version yields identical normalized directions across runs and mesh detail changes. | A | Gate 1 | Spatial |
| SPA-03 | P0 | Negative space has functional hierarchy. | User review confirms readable cluster separation, label/interaction clearance, and focus without encoding hidden Objects. | M, R | Gate 1 | Spatial/User |
| SPA-04 | P0 | Dense contexts aggregate before becoming unusable. | 10,000-result context renders no more than approved budget and supports progressive expansion. | A, M | Gate 4 | Spatial/Context |
| SPA-05 | P1 | Spatial memory is stable under non-semantic updates. | Revisiting an unchanged context restores deterministic landmarks; adding a small population does not arbitrarily reshuffle all nodes beyond tolerance. | A, M | Gate 4 | Spatial |
| SPA-06 | P1 | Touch, pointer, keyboard, and reduced-motion equivalents exist. | Input matrix passes on representative desktop, keyboard-only, and touch device. | A, M | Gate 4 | Spatial/QA |

## 9. Index Projection

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| IDX-01 | P0 | Index is the exact conventional projection of the active permitted context. | Object ID reconciliation test compares Index rows with Context Manifest population/cursor. | A | Gate 1 | Index |
| IDX-02 | P0 | Index is usable without WebGL. | Direct load with WebGL disabled permits search, selection, navigation, and Inspection. | A, M | Gate 4 | Index |
| IDX-03 | P0 | Large result sets are virtualized. | 10,000-result query scrolls/sorts without rendering all rows; no semantic items are lost. | A, M | Gate 4 | Index |
| IDX-04 | P0 | Index actions use shared attention/navigation commands. | Selecting/entering from Index produces the same state transitions as Spatial/Relational actions. | A | Gate 1 | Index/Projection Shell |
| IDX-05 | P0 | Accessibility is first-class. | Keyboard path, focus restoration, semantic names, and automated accessibility checks pass. | A, M | Gate 4 | Index/Accessibility |

## 10. Relational Projection

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| REL-01 | P0 | Relational view explains type, direction, and status. | Accepted/proposed, incoming/outgoing, and relationship families are distinguishable without relying only on color. | A, M | Gate 1/4 | Relational |
| REL-02 | P0 | Recenter is attention, not implicit navigation. | Clicking/recentering a neighbor changes anchor but not Context Manifest/history; explicit Enter navigates. | A, M | Gate 1 | Relational |
| REL-03 | P0 | Large neighborhoods aggregate into meaningful bundles. | High-degree fixture stays within node/edge budgets and exposes expandable typed bundles. | A, M | Gate 4 | Relational/Context |
| REL-04 | P0 | Denied endpoints and edges never appear. | Policy fixture hides edge and endpoint from graph, counts, tooltips, and expansion results. | A, R | Gate 3 | Relational/Policy |
| REL-05 | P1 | Provenance and confidence remain inspectable. | User can inspect evidence for generated relationships and see review state. | A, M | Gate 2/4 | Relational/Curation |
| REL-06 | P1 | Graph remains readable and recoverable. | User can reset anchor, collapse bundles, return to context anchor, and reach all visible items through an accessible alternative. | M, A | Gate 4 | Relational/Accessibility |

## 11. Inspection and curation

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| INS-01 | P0 | Inspection renderer is selected by `inspectionKind`, not Artifact status. | Artifact and non-Artifact fixtures with the same kind use the same renderer contract. | A | Gate 2 | Inspection |
| INS-02 | P0 | Inspection preserves context and visit-specific return state. | Open, navigate to related Resource, Back, and ordinary close restore the correct visit and practical reading position. | A, M | Gate 4 | Inspection/Context |
| INS-03 | P0 | Unsupported/unavailable content is explicit. | Broken federated source and unsupported file render recoverable unavailable states with provenance. | A, M | Gate 2/3 | Inspection |
| INS-04 | P0 | User can review and correct generated assertions. | Inspection/curation surface supports accept, reject, edit, and evidence review with audit events. | A, M | Gate 2 | Curation |
| INS-05 | P1 | Original and derived representations remain distinguishable. | UI identifies original, preview, extracted, and structured representations and applies separate capabilities. | A, M | Gate 2 | Inspection |

## 12. Access and audit

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| SEC-01 | P0 | Private, workspace, and public projections work from policy, not copies. | One Resource changes effective visibility by policy without creating duplicate semantic identity. | A, M | Gate 3 | Policy |
| SEC-01A | P0 | Workspace/tenant isolation is enforced below the UI. | A principal from Reservoir A cannot resolve, query, infer counts for, or mutate private Reservoir B records through API, jobs, search, caches, or direct IDs. | A, R | Gate 3 | Policy/Security |
| SEC-02 | P0 | Derived data cannot leak restricted originals. | Restricted original fixture is absent from summaries, search snippets, embeddings, relationship results, and public manifests. | A, R | Gate 3 | Policy/Security |
| SEC-03 | P0 | Action-level capabilities are enforced. | Principal may preview but not download; another may curate but not publish; UI/API both enforce. | A | Gate 3 | Policy |
| SEC-04 | P0 | Every mutation and agent access is audited. | Audit log contains actor, grant, target, action, correlation ID, decision ID, timestamp, and outcome. | A, R | Gate 3 | Audit |
| SEC-05 | P0 | Untrusted file processing is isolated and recoverable. | Security review documents worker boundary; malicious/oversized fixtures fail without API compromise. | A, R | Gate 4 | Compiler/Security |
| SEC-06 | P1 | Policy changes invalidate stale views. | Revocation prevents subsequent manifest, representation, cached agent, and remote access according to contract. | A | Gate 3 | Policy |

## 13. Agent gateway

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| AGT-01 | P0 | Agent uses the same canonical services as UI. | Architecture review and integration tests show protocol adapters call policy/context/application services, not database tables directly. | A, R | Gate 3 | Agent Gateway |
| AGT-02 | P0 | Agent grant is narrower than user identity where configured. | Same user and delegated agent receive different allowed Object/action sets. | A | Gate 3 | Agent Gateway/Policy |
| AGT-03 | P0 | Context Packages are bounded and attributable. | Package respects object/token/byte budgets and every excerpt carries Resource/Version/Representation evidence. | A, R | Gate 3 | Agent Gateway |
| AGT-04 | P0 | Write operations are proposals unless explicitly authorized. | Agent relationship/Collection/Artifact write creates review item; direct acceptance is denied without matching rule. | A, M | Gate 3 | Agent Gateway/Curation |
| AGT-05 | P0 | MCP-compatible and REST/OpenAPI adapters are behaviorally consistent. | Shared conformance suite produces equivalent authorization and domain outcomes. | A | Gate 4 | Agent Gateway |
| AGT-06 | P1 | Revoked/expired grants stop cached continuation. | Continuation request after expiry/revocation is denied and audited. | A | Gate 3 | Agent Gateway |

## 14. Federation and social traversal

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| FED-01 | P0 | Reservoir A discovers only permitted Reservoir B Objects. | Two-identity scenario returns public/shared Object and excludes private fixture without count leak. | A, M, R | Gate 3 | Federation/Policy |
| FED-02 | P0 | Remote reference preserves origin identity and ownership. | Referenced Object displays origin reservoir/address and stores no local ownership claim. | A, M | Gate 3 | Federation |
| FED-03 | P0 | Mount differs from import and fork. | Scenario demonstrates live mount, local import, and fork with distinct custody/lineage records. | A, M | Gate 3 | Federation |
| FED-04 | P0 | Revocation is truthful and recoverable. | Origin revocation changes reference to revoked/unavailable, prevents content access, and preserves historical audit/lineage. | A, M | Gate 3 | Federation |
| FED-05 | P1 | Remote context can feed all three projections. | Mounted permitted context resolves one local Context Manifest and renders Spatial, Index, and Relational projections with remote markers. | A, M | Gate 3/4 | Federation/Context |

## 15. Scale, performance, and reliability

| ID | Pri | Requirement | Observable acceptance evidence | Type | Gate | Primary owner |
|---|---:|---|---|---|---|---|
| PERF-01 | P0 | Synthetic catalog contains at least 50,000 Resources and 100,000 relationships. | Seed generator and verification report reproduce counts in a fresh environment. | A, D | Gate 4 | Performance |
| PERF-02 | P0 | A 10,000-result query remains bounded. | Context response respects budgets, provides cursor/aggregates, and does not serialize the full graph. | A | Gate 4 | Context/Performance |
| PERF-03 | P0 | Projection render budgets are enforced. | Spatial ≤400 nodes; Relational ≤300 nodes/600 edges unless an accepted benchmark revises limits. | A | Gate 4 | Projections |
| PERF-04 | P1 | Representative interaction remains responsive. | Benchmark report records API latency, context generation, Index scrolling, and projection frame performance on target hardware. | A, M, D | Gate 4 | Performance/User |
| PERF-05 | P0 | Fresh environment is reproducible. | CI provisions database/storage dependencies, runs migrations, seeds fixtures, starts services, and passes smoke tests. | A | Gate 4 | Platform |
| PERF-06 | P0 | Partial compiler failure does not corrupt canonical data. | Fault-injection tests preserve Resource/Version and allow safe retry/resume. | A | Gate 4 | Compiler |
| PERF-07 | P1 | Observability correlates UI/API/job behavior. | One upload-through-projection scenario can be traced by correlation ID without logging protected payloads. | A, R | Gate 4 | Platform |

## 16. Release-candidate evidence package

Gate 4 cannot close until the integration branch contains:

- automated test report;
- contract compatibility report;
- security review findings and dispositions;
- accessibility report;
- synthetic-scale benchmark;
- supported/unsupported file-type matrix;
- representative ingestion-quality evaluation;
- federation scenario record;
- agent-grant scenario record;
- visual/runtime validation checklist signed by the user;
- known limitations and deferred production requirements;
- clean deployment and migration instructions.

No criterion in this matrix authorizes merge or release by itself. User approval remains separate.
