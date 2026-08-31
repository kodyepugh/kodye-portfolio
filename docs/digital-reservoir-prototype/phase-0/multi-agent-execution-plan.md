# Digital Reservoir Prototype Multi-Agent Execution Plan

**Status:** Phase 0 proposal — execution begins only after Gate 0 approval  
**Version:** 0.1  
**Date:** 2026-08-31  
**Implementation authorization:** None

## 1. Operating model

The prototype should be executed through a controlled multi-agent program, not one unrestricted long-running implementation prompt.

Roles:

```text
User
  product owner, experiential authority, privacy authority, release authority

ChatGPT
  architecture/specification/review lead, task-boundary and model-routing authority

Lead Codex agent
  execution orchestrator, integration owner, plan maintainer

Specialist Codex agents
  bounded implementation, testing, audit, and review workstreams
```

The repository remains the durable source of truth.

Parallelism is used where work is contractually separable. Write-heavy work does not run in parallel merely because additional agents are available.

## 2. Preconditions for implementation

No implementation wave begins until:

- the six Phase 0 documents are approved;
- the new repository boundary is approved;
- the initial representative corpus is available or a fixture substitute is approved;
- staging infrastructure and secrets handling are authorized;
- the user approves Gate 0 decisions;
- a new-repository `AGENTS.md` and living execution plan are created;
- shared contracts have an explicit owner.

## 3. New-repository governance

Recommended branch structure:

```text
main
  protected; release-quality checkpoints only

integration/prototype-v0
  current integrated prototype

workstream/contracts
workstream/platform
workstream/resource-fabric
workstream/compiler
workstream/context-policy
workstream/projection-shell
workstream/spatial
workstream/index
workstream/relational
workstream/inspection-curation
workstream/agent-gateway
workstream/federation
workstream/qa-*
```

Rules:

- each write-enabled agent uses an isolated worktree and branch;
- agents receive explicit subsystem/file ownership;
- only the integration owner merges workstream branches into `integration/prototype-v0`;
- no agent pushes directly to `main`;
- integration checkpoints are coherent, validated commits;
- independent review occurs before a workstream is accepted;
- user approval is required before merging a release candidate to `main`;
- documentation changes accompany contract or behavior changes;
- unresolved product meaning is escalated rather than silently chosen.

## 4. Model routing

### High-capability model

Required for:

- lead orchestration;
- domain and contract design;
- Context/Policy architecture;
- Projection Sphere state architecture;
- Relational Projection semantics;
- federation and agent authorization;
- difficult cross-system debugging;
- final architecture and security review.

### Mid-tier model

Appropriate for:

- normal API and repository implementation;
- compiler stages with settled contracts;
- frontend projection implementation;
- Inspection and curation UI;
- integration tests;
- moderate multi-file debugging.

### Low-cost/fast model

Appropriate for:

- repository scans;
- fixture generation;
- mechanical schema/type updates after approval;
- isolated tests;
- documentation formatting;
- log triage;
- static analysis;
- repeat validation passes.

Subagents must receive an explicit model tier. They should not inherit an expensive lead model by default.

## 5. Core agent roles

### 5.1 Lead orchestrator

**Model:** High  
**Write access:** integration plan/docs; integration branch through controlled merges  
**Responsibilities:**

- maintain `docs/execution/prototype-v0-plan.md`;
- decompose work into bounded tasks;
- assign contracts and file ownership;
- sequence dependency gates;
- review agent reports;
- integrate approved branches;
- maintain decision and risk logs;
- batch user questions;
- stop scope expansion;
- ensure acceptance evidence is linked;
- escalate model capability when repeated failures or ambiguity warrant it.

The lead should not implement every feature. Its context is reserved for system coherence.

### 5.2 Contract/domain agent

**Model:** High  
**Write access:** `packages/contracts`, `packages/domain`, schema docs/tests  
**Responsibilities:**

- implement versioned schemas;
- enforce Object/Resource/Collection/Artifact invariants;
- own breaking-change review;
- provide fixtures and contract conformance tests;
- prevent workstreams from redefining shared types.

### 5.3 Platform agent

**Model:** Mid/High  
**Write access:** repository scaffold, database, migrations, CI, observability  
**Responsibilities:**

- monorepo and environment scaffold;
- PostgreSQL/pgvector and object-store integration;
- queue and worker lifecycle;
- OIDC plumbing;
- logging, correlation IDs, migrations, seed harness;
- staging deployment.

### 5.4 Resource Fabric agent

**Model:** Mid/High  
**Write access:** Resource/Version/Representation repositories and services  
**Responsibilities:**

- stable registration and direct address resolution;
- managed/federated custody;
- versions and representations;
- provenance;
- audit events;
- duplicate candidates.

### 5.5 Compiler agent

**Model:** Mid/High  
**Write access:** worker and ingestion packages  
**Responsibilities:**

- safe staged pipeline;
- supported parsers;
- segmentation;
- previews and extracted representations;
- summarization and assertion generation;
- idempotency and retries;
- malformed/unsupported states;
- compiler test corpus.

### 5.6 Context and Policy agent

**Model:** High  
**Write access:** context, search, relationship, policy packages and APIs  
**Responsibilities:**

- hybrid retrieval;
- policy decisions;
- Context Manifest resolution;
- Collections and Query contexts;
- bounded aggregation/cursors;
- visit history;
- derived-data protection;
- scale fixtures.

### 5.7 Projection Shell agent

**Model:** High  
**Write access:** Projection Sphere shell and shared client state  
**Responsibilities:**

- horizontal cyclic projection system;
- active context subscription;
- attention and navigation coordinators;
- transition lifecycle;
- reduced-motion and input equivalents;
- vertical-axis reservation;
- projection adapter lifecycle;
- Gate 1 demonstrator.

### 5.8 Spatial Projection agent

**Model:** Mid/High  
**Write access:** Spatial projection package/components  
**Responsibilities:**

- port tested deterministic geometry;
- aggregate/leaf node rendering;
- orientation, zoom, labels, negative-space rules;
- progressive-resolution requests;
- WebGL failure behavior;
- device performance.

### 5.9 Index Projection agent

**Model:** Mid  
**Write access:** Index projection package/components  
**Responsibilities:**

- accessible list/grid/table;
- virtualization;
- shared selection/navigation;
- sorting/filtering distinction;
- non-WebGL fallback;
- bulk curation hooks when authorized.

### 5.10 Relational Projection agent

**Model:** High  
**Write access:** Relational projection package/components  
**Responsibilities:**

- typed directed graph grammar;
- local recentering;
- relationship bundles;
- confidence/provenance/review indicators;
- graph accessibility alternative;
- scale and readability behavior.

### 5.11 Inspection and Curation agent

**Model:** Mid/High  
**Write access:** Inspection renderers and review UI  
**Responsibilities:**

- adapt shared Inspection chassis;
- version/provenance/representation presentation;
- assertion review;
- Artifact and Collection curation;
- visit-specific reading return;
- explicit unsupported states.

### 5.12 Agent Gateway agent

**Model:** High  
**Write access:** agent application service and protocol adapters  
**Responsibilities:**

- Context Packages;
- grants;
- MCP-compatible adapter;
- REST/OpenAPI adapter;
- proposal operations;
- audit and conformance tests;
- cache/revocation behavior.

### 5.13 Federation agent

**Model:** High  
**Write access:** federation package/service  
**Responsibilities:**

- reservoir identity;
- remote Object resolution;
- reference/mount/import/fork;
- policy intersection;
- cache/revocation;
- two-reservoir test harness.

### 5.14 Independent QA agents

Use separate mostly read-only agents for:

- architecture/conformance;
- security/privacy;
- data integrity;
- accessibility;
- performance;
- UI/interaction regression;
- test-quality review.

The author of a feature is not the sole approver of that feature.

## 6. Parallelism rules

### Safe parallel work

- read-only repository analysis;
- independent threat modeling;
- fixture creation against frozen contracts;
- separate projection implementation after shell contract freeze;
- parser implementation for distinct file types;
- independent test and review passes;
- performance and accessibility investigation.

### Restricted parallel work

Do not allow simultaneous uncoordinated edits to:

- shared contracts;
- database migrations;
- policy semantics;
- Context Manifest;
- Projection Sphere shared state;
- integration configuration;
- navigation/history coordinator;
- release branch.

### Contract freeze

A contract is “frozen for a wave” when:

- machine-readable schema exists;
- conformance tests pass;
- affected agents acknowledge the version;
- unresolved breaking questions are closed;
- the lead records the freeze in the execution plan.

Frozen does not mean immutable forever. It means changes use explicit review rather than local invention.

## 7. Execution waves

## Wave 0 — Approved scaffold and reference baseline

**Goal:** Create the new repository and execution controls without product implementation.

Workstreams:

- lead;
- contracts;
- platform;
- read-only reuse auditor;
- test-strategy reviewer.

Outputs:

- new repository;
- `AGENTS.md`;
- living execution plan;
- decision log;
- risk register;
- source reference SHA from the portfolio;
- monorepo skeleton;
- CI skeleton;
- local dependency composition;
- empty contract package and test harness;
- no feature-complete UI.

Parallelism:

- platform scaffold and reference audit may run concurrently;
- contracts remain lead-owned until initial schema merge.

Validation:

- install;
- lint/typecheck;
- empty test suite;
- environment boot;
- branch protection and secret handling review.

User involvement:

- only if scaffold choices materially alter approved architecture.

## Wave 1 — Contracts, persistence skeleton, and Projection Sphere shell

**Goal:** Prove boundaries before depth.

Parallel tracks after contract freeze:

1. Resource/Version/Representation repository skeleton;
2. Context Manifest mock service;
3. Projection Sphere shell using mock manifests;
4. CI, migrations, fixture harness;
5. independent contract review.

Outputs:

- versioned contracts;
- database migrations for core identities;
- mock Collection and Query manifests;
- three stub projections in horizontal cyclic shell;
- shared attention/navigation events;
- reduced-motion behavior;
- vertical axis inert;
- no automated compiler yet.

Integration dependency:

- shell consumes only contract package;
- platform does not import web components;
- no projection reads database directly.

### User Gate 1

The user validates the physical and conceptual Projection Sphere interaction before deeper projection work.

Required questions are batched around:

- inner-surface/globe feeling;
- horizontal direction and wraparound;
- neighbor projection visibility;
- movement weight;
- selection preservation;
- distinction between recenter and navigation;
- negative-space composition.

Gate 1 may change shell behavior, but should not redefine Resource identity or policy.

## Wave 2 — Thin end-to-end vertical slice

**Goal:** Make one complete Resource flow work before broad parallel expansion.

Scenario:

```text
upload one supported file
→ register stable Resource
→ store Version
→ extract text/preview
→ generate proposed summary/relationship/Collection/Artifact assertions
→ user reviews
→ promote and place
→ resolve Context Manifest
→ render in all three projections
→ inspect
→ retrieve through agent read operation
```

Primary agents:

- Resource Fabric;
- Compiler;
- Context/Policy;
- Projection Shell;
- one integrated projection implementation;
- Inspection/Curation;
- Agent Gateway read-only seam.

Parallelism:

- parser/extraction work may run alongside UI review surface;
- Context/Policy and Resource Fabric coordinate through frozen repository contracts;
- only one integration agent wires the vertical path.

Required independent reviews:

- domain invariant review;
- policy data-flow review;
- compiler idempotency review;
- E2E test review.

### User Gate 2

The user evaluates real compiler and curation quality, not just technical completion.

The gate uses representative files and records:

- useful versus misleading summaries;
- correct Resource boundary;
- correct relationship direction/type;
- suitable Collection suggestion;
- justified Artifact recommendation;
- ease of correcting model output;
- whether the result feels like curation rather than automated clutter.

No broad file-type expansion begins until the vertical slice passes.

## Wave 3 — Controlled capability expansion

**Goal:** Fill the bounded prototype scope using separable workstreams.

Parallel tracks:

- supported file parsers;
- Spatial Projection;
- Index Projection;
- Relational Projection;
- curation and review;
- policy/action matrix;
- search and aggregation;
- agent gateway;
- federation;
- synthetic data generator.

Dependency rules:

- all projections use the same Context Manifest version;
- agent gateway uses the same application/policy services;
- federation uses policy and remote contracts, not projection internals;
- compiler writes assertions, not accepted graph facts;
- Index and Relational agents do not redefine navigation.

Integration cadence:

- workstream branch accepted only after targeted tests and independent review;
- integration occurs in coherent checkpoints, not daily blind merges;
- each checkpoint runs the complete contract and vertical-slice suite.

### User Gate 3

The user validates:

- private/workspace/public meaning;
- agent grant scope;
- proposed writes;
- Reservoir A/B traversal;
- remote reference versus mount/import/fork;
- revocation behavior.

Product ambiguities discovered here are resolved before hardening.

## Wave 4 — Scale, security, accessibility, and bug hardening

**Goal:** Stop adding product scope and attack the integrated system.

Write feature work is frozen except for defect resolution.

Parallel read/review agents investigate:

- unauthorized derived-data leakage;
- policy/cache invalidation;
- file parser security;
- idempotency and race conditions;
- stale Context Manifests;
- projection synchronization drift;
- selection/history corruption;
- WebGL/resource cleanup;
- touch and keyboard conflicts;
- Relational graph unreadability;
- synthetic scale;
- agent grant escalation;
- federation revocation;
- migrations and fresh environment;
- missing and misleading tests.

Bug workflow:

1. reviewer files a reproducible finding;
2. lead classifies severity and owning contract;
3. fixing agent works in an isolated branch;
4. targeted regression test is added;
5. a different agent verifies the fix;
6. integration owner merges;
7. full suite runs;
8. acceptance evidence is updated.

Bugs are investigated across parallel causes—state ownership, cache, lifecycle, timing, policy, transforms, event propagation—not patched only at the visible symptom.

## Wave 5 — Release candidate

**Goal:** Produce a reproducible staging prototype and evidence package.

Required actions:

- provision fresh environment;
- run migrations;
- seed two reservoirs and scale fixtures;
- execute full test suite;
- execute security and accessibility checks;
- run end-to-end reference scenario;
- generate benchmark report;
- close or explicitly defer all blocking findings;
- freeze contract versions;
- produce known-limitations record;
- deploy staging release candidate.

### User Gate 4

The user performs hands-on acceptance across:

- ingestion;
- curation;
- Spatial/Index/Relational rotation;
- context synchronization;
- Inspection;
- access levels;
- agent interaction;
- federation;
- representative desktop/touch behavior.

Approval to merge or release is requested separately after Gate 4 evidence is reviewed.

## 8. Dependency graph

```text
Charter approval
      |
Repository scaffold
      |
Contracts + core schema
      |
-------------------------------------------------
| Resource Fabric | Context/Policy | Sphere Shell |
-------------------------------------------------
         \             |              /
             Thin vertical slice
                     |
      -----------------------------------------
      | Spatial | Index | Relational | Inspection |
      | Agent   | Federation | Parser expansion   |
      -----------------------------------------
                     |
          Integrated hardening and scale
                     |
             Release candidate
```

No projection feature may block Resource identity or policy work by forcing presentation-specific fields into the canonical catalog.

## 9. Work packet format

Every delegated task should contain:

```text
OBJECTIVE
One bounded outcome.

AUTHORITIES
Canonical docs/contracts and current integration base.

OWNERSHIP
Permitted directories/files and interfaces.

PRESERVE
Accepted behavior and contracts that cannot drift.

REQUIREMENTS
Observable behavior.

NON-GOALS
Adjacent features explicitly excluded.

ACCEPTANCE
Tests, runtime evidence, and matrix IDs.

VALIDATION
Commands and manual checks.

GIT
Branch, coherent commits, push expectations, no main merge.

MODEL
Explicit recommended capability tier.

ESCALATION
Conditions requiring lead or user decision.
```

Agents should not receive a full product-history dump when the repository already contains the relevant authority.

## 10. Integration report format

Each workstream checkpoint reports:

- branch and commit;
- acceptance IDs addressed;
- files/modules changed;
- contract version used;
- validation run and result;
- known warnings;
- unresolved risks;
- documentation changed;
- independent reviewer and disposition;
- integration recommendation.

A success claim without test evidence is treated as unverified.

## 11. User inquiry and escalation policy

### Agents decide independently when

- the decision is reversible;
- it follows a frozen contract;
- tests objectively determine correctness;
- it does not alter visible product meaning;
- it does not widen data access;
- it does not add significant dependency or operating cost.

### Escalate to ChatGPT/lead when

- two contracts conflict;
- integration requires architectural restructuring;
- a lower-tier model fails repeatedly;
- the likely fix spans several workstreams;
- a security finding challenges the current design;
- scope or schedule must change.

### Escalate to the user when

- ontology meaning would change;
- Projection Sphere interaction grammar would change;
- private/shared/public semantics are ambiguous;
- agent authority would broaden;
- federation ownership or revocation semantics change;
- a major dependency creates lock-in or material cost;
- there is risk of data loss;
- accepted requirements conflict;
- experiential quality cannot be judged objectively.

Questions are batched into a decision memo:

- decision required;
- evidence;
- options;
- recommendation;
- consequences;
- work that can continue without the answer.

## 12. Review independence

Minimum review pairs:

| Workstream | Independent reviewer |
|---|---|
| Contracts/domain | Architecture reviewer |
| Resource Fabric | Data-integrity reviewer |
| Compiler | Idempotency/security reviewer |
| Context/Policy | Security/privacy reviewer |
| Projection Shell | Interaction/state reviewer |
| Spatial | Performance/geometry reviewer |
| Index | Accessibility reviewer |
| Relational | Graph/readability + accessibility reviewer |
| Agent Gateway | Authorization reviewer |
| Federation | Security/lineage reviewer |
| Integration | Fresh-context regression reviewer |

The same agent may fix a finding but cannot be the only source declaring it resolved.

## 13. Validation layers

Every integration checkpoint runs the applicable layers:

1. formatting and static analysis;
2. type checking;
3. contract conformance;
4. unit tests;
5. database/repository integration tests;
6. policy and security tests;
7. compiler fixture tests;
8. API and protocol tests;
9. projection synchronization tests;
10. browser E2E;
11. accessibility checks;
12. scale/performance tests;
13. production build;
14. staging smoke test.

Pre-existing warnings are recorded separately from regressions introduced by the checkpoint.

## 14. Completion and stop rules

An agent stops and reports rather than expanding scope when:

- the task requires a contract change outside ownership;
- acceptance cannot be met without a product decision;
- tests reveal unrelated architectural debt;
- secrets or infrastructure access are unavailable;
- a security boundary is unclear;
- implementation would modify the live portfolio;
- broad refactoring is tempting but not required.

Partial verified work is preferable to speculative completion claims.

## 15. Immediate next action after Phase 0 approval

The first Codex execution task should be **Wave 0 only**:

> Create the separate prototype repository, establish `AGENTS.md`, the living execution plan, decision/risk logs, contract/test package skeleton, CI skeleton, and local service composition. Record the portfolio reference SHA. Do not implement ingestion, persistence behavior, the Projection Sphere, agent operations, or federation.

Recommended model:

- high-capability lead;
- mid-tier platform subagent;
- low-cost read-only reference and test-strategy subagents.

Wave 1 begins only after the Wave 0 repository scaffold is reviewed.
