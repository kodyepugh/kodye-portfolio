# Codex Deployment Prompt — Digital Reservoir Prototype Wave 0

Copy the prompt below into Codex as one lead-orchestrator task.

---

## Recommended model routing

- **Lead orchestrator:** High-capability model with high reasoning.
- **Governance/contracts scaffold agent:** High-capability model.
- **Platform/repository scaffold agent:** Mid-tier model.
- **Reuse/reference audit agent:** Low-cost or mid-tier model; read-only where practical.
- **Test-strategy and scaffold-review agent:** Low-cost or mid-tier model; read-only where practical.
- **Independent final Wave 0 reviewer:** Mid-tier or high-capability model, separate from the primary author.

Assign these tiers explicitly. Do not allow every subagent to inherit the lead model by default.

## Role

Act as the **lead Codex orchestrator** for Wave 0 of the Digital Reservoir prototype program.

You own decomposition, bounded delegation, workstream coordination, integration, validation, evidence collection, and the final Wave 0 report. Use parallel specialist agents where the environment supports them. The user must not be required to dispatch individual subagents or assign their models manually.

Do not begin Wave 1 or broad product implementation.

## Authoritative planning source

Read the following files from:

```text
Repository: kodyepugh/kodye-portfolio
Branch: docs/digital-reservoir-prototype-phase-0
Approved Phase 0 source commit: 8fd35c8d9e0bc3b74faf118773f5e52fba12dc4d
Reference portfolio main commit: a3e98b4e52bb8ae9c9f0e29c00a2f1c077e99b02
```

Required documents:

```text
docs/digital-reservoir-prototype/phase-0/prototype-charter.md
docs/digital-reservoir-prototype/phase-0/target-architecture.md
docs/digital-reservoir-prototype/phase-0/interface-contracts.md
docs/digital-reservoir-prototype/phase-0/acceptance-matrix.md
docs/digital-reservoir-prototype/phase-0/reuse-plan.md
docs/digital-reservoir-prototype/phase-0/multi-agent-execution-plan.md
docs/digital-reservoir-prototype/phase-0/gate-0-approval-record.md
```

Also inspect the current portfolio `AGENTS.md`, but treat the Phase 0 documents and Gate 0 approval record as the authority for this task. The portfolio is a reference implementation and must remain unchanged.

Before making edits, summarize the Wave 0 boundary internally and identify any apparent conflict among the approved documents. Resolve only reversible implementation details independently. Escalate a true product or architecture conflict rather than silently rewriting the plan.

## Objective

Execute **Wave 0 — approved scaffold and reference baseline** only.

Create the separate prototype repository and establish the repository, governance, orchestration, local-environment, CI, contract-package, and test-harness foundations required for later waves.

Wave 0 must prove that the development program can be run reproducibly by a lead orchestrator using bounded specialist agents. It must not implement Digital Reservoir product capabilities.

## Repository boundary

Provision a new repository named provisionally:

```text
digital-reservoir-prototype
```

Default to a **private** GitHub repository when the connected environment permits remote creation. The repository must be separate from `kodye-portfolio`.

If the current environment cannot create the remote repository:

1. create a separate local Git repository in an appropriate sibling project directory;
2. complete only work that remains valid before remote provisioning;
3. record the exact remote-creation and push step still required;
4. do not place prototype scaffold files inside `kodye-portfolio` as a workaround;
5. do not claim the remote-repository acceptance condition has passed.

Treat `kodye-portfolio` as read-only during Wave 0.

## Required orchestration

Use the approved multi-agent plan. At minimum, delegate these bounded workstreams:

### 1. Governance and contracts scaffold

**Model:** High  
**Ownership:** `AGENTS.md`, planning-document import, execution-plan skeleton, contract-package skeleton, decision/risk records.

Responsibilities:

- import the approved Phase 0 package into the new repository as durable authority;
- record the exact source repository, branch, and commit SHAs;
- draft the new repository `AGENTS.md` from the approved operating model;
- create a versioned but intentionally skeletal contracts package;
- define the contract-change and freeze process without implementing Wave 1 domain contracts.

### 2. Platform and repository scaffold

**Model:** Mid  
**Ownership:** workspace configuration, apps/packages skeleton, local dependencies, CI, environment boot.

Responsibilities:

- establish the TypeScript monorepo;
- choose the least-complex workspace/package-manager setup that satisfies the approved architecture;
- create the approved `apps/` and `packages/` boundaries;
- establish local dependency composition and health checks;
- establish lint, typecheck, test, build, and CI skeletons;
- avoid product/domain implementation.

### 3. Reuse and reference auditor

**Model:** Low/Mid  
**Write access:** read-only by default; may write only its bounded audit record.

Responsibilities:

- verify the portfolio reference SHA and reusable source paths named in the reuse plan;
- identify licenses, attribution concerns, framework-version constraints, and test seams relevant to future extraction;
- create no ported production code during Wave 0;
- flag any reuse-plan assumption that is not supported by the audited source.

### 4. Test-strategy and scaffold reviewer

**Model:** Low/Mid  
**Write access:** test/CI strategy and review findings only.

Responsibilities:

- define the testing layers required by the acceptance matrix;
- verify the scaffold can support contract, integration, E2E, security, accessibility, and performance evidence later;
- review CI and local-environment reproducibility;
- ensure empty/placeholder tests do not create false claims of product coverage.

### 5. Independent Wave 0 review

**Model:** Mid/High  
**Write access:** findings only until fixes are assigned.

Review:

- scope compliance;
- repository separation;
- planning-document fidelity;
- dependency restraint;
- CI and environment reproducibility;
- secret handling;
- future contract and workstream boundaries;
- whether any Wave 1 behavior was implemented prematurely.

The author of a scaffold area must not be its sole approver.

If the current Codex environment does not expose subagent orchestration, do not pretend parallel execution occurred. Perform only safe discovery and non-destructive preparation, record the missing capability as a Wave 0 blocker, and return a truthful report rather than claiming Wave 0 completion.

## Required Wave 0 outputs

### A. Repository governance

Create:

```text
AGENTS.md
README.md
```

`AGENTS.md` must establish:

- repository source-of-truth order;
- approved Phase 0 authorities;
- scope discipline;
- semantic/persistence/projection separation;
- branch-per-workstream and isolated-worktree rules;
- integration ownership;
- model-routing requirements;
- contract freeze/change rules;
- validation and documentation requirements;
- independent review requirements;
- user escalation conditions;
- prohibition on direct `main` pushes and unapproved later-wave work.

### B. Durable execution records

Create at minimum:

```text
docs/execution/prototype-v0-plan.md
docs/execution/decision-log.md
docs/execution/risk-register.md
docs/execution/wave-0-record.md
docs/architecture/source-reference-baseline.md
```

The living execution plan must contain:

- current wave and gate;
- accepted Phase 0 source SHAs;
- workstream ownership;
- dependency graph;
- contract-freeze status;
- completed and pending evidence;
- open decisions and blockers;
- user-escalation queue;
- explicit stop condition at the end of Wave 0.

The decision log must distinguish:

- user/product decisions;
- architecture decisions;
- reversible implementation decisions.

The risk register must include at least:

- multi-agent write conflicts;
- shared-contract drift;
- premature platform complexity;
- dependency/toolchain lock-in;
- secret leakage;
- infrastructure cost;
- false test confidence;
- portfolio/prototype contamination;
- inability to reproduce the environment;
- unsupported assumptions in the reuse plan.

### C. Approved planning package

Copy or otherwise preserve the seven approved Phase 0/approval documents in the new repository under a clearly authoritative path such as:

```text
docs/phase-0/
```

Preserve their terminology and content. Do not silently rewrite the approved architecture while importing it. Add a source-reference note rather than replacing their historical status text.

### D. Monorepo skeleton

Create the approved structural boundaries:

```text
apps/
  web/
  api/
  worker/

packages/
  contracts/
  domain/
  policy/
  context/
  projections/
  ingestion/
  federation/
  testing/

docs/
  architecture/
  decisions/
  execution/
```

The packages may contain typed placeholder entry points, package metadata, and health/build seams only. Do not implement Resource, Collection, Assertion, Policy, Context Manifest, ingestion, projection, federation, or agent behavior in Wave 0.

### E. Toolchain and CI skeleton

Establish one coherent TypeScript toolchain with:

- pinned runtime/toolchain policy;
- workspace install;
- formatting policy where useful;
- lint;
- typecheck;
- unit-test runner;
- build command;
- CI workflow running the appropriate scaffold checks;
- dependency-cache strategy where justified;
- no unnecessary overlapping frameworks.

Prefer the smallest stack that supports the approved architecture. Record the rationale for package manager, test runner, build orchestration, and lint/format choices in the decision log.

### F. Local environment composition

Create a reproducible local dependency composition consistent with the target architecture, limited to scaffold/health purposes.

It should account for:

- PostgreSQL with vector capability;
- S3-compatible object storage;
- a durable background-job mechanism or an explicitly documented Wave 1 choice point;
- future OIDC integration without implementing authentication;
- health checks and documented startup/shutdown commands;
- `.env.example` with no real secrets;
- ignored local secret files and generated data.

Do not create Digital Reservoir domain tables or production migrations in Wave 0. Infrastructure initialization may create only what is necessary to prove that the local services start and can be reached by health/configuration checks.

### G. Contract and test harness skeleton

Create:

- a version namespace and package boundary for future transport/domain contracts;
- an empty conformance-test harness;
- shared fixture/test utility boundaries;
- clear prohibition on individual workstreams redefining contracts locally;
- documentation for adding contract fixtures in Wave 1.

Do not implement the full interfaces from `interface-contracts.md` yet.

### H. Git and branch structure

Establish or document:

```text
main
integration/prototype-v0
workstream/contracts
workstream/platform
```

Create additional Wave 0 workstream branches only when they are actually used. Use isolated worktrees for simultaneous write-enabled agents. Only the lead/integration owner may integrate accepted workstreams.

Configure branch protection when permissions allow. Otherwise produce an exact repository-settings checklist and mark protection as externally pending.

Do not merge a release or integration checkpoint to `main` without separate user approval.

## Strict non-goals

Do not implement:

- Resource registration or direct addressing;
- database domain schemas or migrations;
- file upload or object-storage application logic;
- ingestion, extraction, segmentation, summarization, embeddings, or assertions;
- curation UI;
- Projection Sphere interactions;
- Spatial, Index, or Relational projections;
- Inspection UI;
- authentication, policies, or permission evaluation;
- agent gateway or MCP behavior;
- federation or remote traversal;
- synthetic 50,000-Resource datasets;
- portfolio integration;
- production deployment;
- Wave 1 or later acceptance criteria.

A placeholder page, health endpoint, package entry point, or environment probe is allowed only when needed to prove the scaffold builds and boots. It must not be represented as product implementation.

## Scope and decision discipline

Decide reversible mechanical details without interrupting the user. Record them in the decision log.

Escalate only when a decision would materially alter:

- the approved separate-repository boundary;
- the modular-monolith architecture;
- the canonical Phase 0 product semantics;
- data custody/security expectations;
- major infrastructure cost or lock-in;
- the ability to use parallel agents safely;
- the Wave 0/Wave 1 boundary.

Batch material questions. Continue unrelated safe work where possible.

## Validation

Run and report all scaffold-relevant checks, including at minimum:

- clean install from the repository root;
- formatting check if configured;
- lint;
- typecheck;
- tests;
- build;
- local service composition validation;
- application/package health or boot smoke checks;
- `git diff --check`;
- secret and generated-file exclusion review;
- fresh-clone or clean-worktree reproduction where possible;
- independent scope/repository-boundary review.

Do not claim success merely because TypeScript compiles.

Report pre-existing or environment-specific warnings separately from Wave 0 regressions.

## Required completion report

Return one integrated Wave 0 report containing:

1. repository URL and/or exact local path;
2. default, integration, and workstream branch status;
3. commits created and whether anything was pushed;
4. agent delegation map, model tier used, branch/worktree ownership, and result of each workstream;
5. complete file/directory scaffold summary;
6. toolchain and infrastructure decisions with rationale;
7. validation commands and exact results;
8. independent-review findings and resolutions;
9. acceptance evidence satisfied for Wave 0;
10. unresolved blockers or external GitHub/infrastructure actions;
11. risks carried into Wave 1;
12. confirmation that `kodye-portfolio` was not modified;
13. confirmation that no Wave 1 product behavior was implemented;
14. a recommended next action, but **no Wave 1 execution prompt and no automatic continuation**.

## Stop condition

Stop after the Wave 0 scaffold has been integrated and reviewed on `integration/prototype-v0`, or after a truthful blocker report if the required repository or multi-agent capability is unavailable.

Do not proceed into Wave 1. Do not merge to `main`. Return the completion report for ChatGPT/user review and separate authorization.

---
