<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Digital Reservoir project references

Use repository documentation as durable project memory. Do not reconstruct current project state from remembered conversations when the repository can resolve it.

### Domain-specific authorities

1. `docs/release-preparation-roadmap.md` — current sequencing, launch blockers, and deferred work.
2. `docs/l2-implementation-status.md` — implementation-completion state.
3. `docs/digital-reservoir-resource-artifact-query-ontology-v0.7.md` — semantic Object/Resource/Collection/Artifact-status ontology, addressability, memberships, relationships, Query Reservoir semantics, and Inspection semantics.
4. `docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md` — accepted interaction, spatial, visual, responsive, and accessibility behavior.
5. `docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md` — developer/implementation discipline and historical technical context.
6. `docs/l2-bellabeat-manual-ingestion-manifest.md` — Bellabeat content, provenance, curatorial boundaries, and integrated-QA requirements.
7. Closeout documents — accepted evidence for the specific bounded passes they close.

Current code and validation output are runtime truth. If behavior and documentation diverge, determine which is wrong and reconcile the documentation afterward.

### Current semantic baseline

The ontology is revision **0.7.1** and is authoritative where older documents still use peer-entity `Artifact`, `Asset`, `Source Record`, or `Artifact Window` language.

Preserve these rules:

- persistent semantic `Object = Collection | Resource`;
- every persistent Object has stable direct semantic identity/addressability;
- Collection addresses resolve to persistent Collection Reservoirs;
- Resource addresses resolve through temporary Query Reservoirs;
- Artifact is reversible curatorial status on a Resource and grants Collection-membership eligibility;
- Asset and Source are supporting/provenance roles or implementation records rather than mandatory peer public Object classes;
- Resource identity/addressability survives promotion/demotion;
- supporting Resources may be directly queried without receiving Collection membership;
- renderer selection is driven by Resource `inspectionKind`, not Artifact status;
- one shared Resource-oriented Inspection Window chassis is canonical;
- atmosphere owns concise Resource identity/metadata, renderer bodies own inspected content, and the shared `Resources | Collections` context tray exposes relationships after primary content;
- Resource/Collection detours issued from an open Inspection preserve the approved practical Inspection return semantics;
- curatorial resolution, not technical decomposability, determines which constituent objects are materialized.

### Current project phase

The V2 spatial foundation, Query Reservoir closure baseline, L2 semantic registry foundation, common Inspection architecture, supporting-Resource navigation, image Inspection, external-link/repository Inspection, and Bellabeat initial materialization are accepted foundation.

Current work is **public-launch preparation**. Follow the release roadmap rather than continuing automatically into additional renderer or ingestion architecture.

Do not build production ingestion, database persistence, search, an Unassigned Resources inbox, automated migration, broad renderer expansion, or other deferred product systems unless the current approved task explicitly authorizes them or a launch Resource requires them.

# KP Website — Codex Instructions

## Source of Truth

- The user's current explicit instruction has highest priority.
- Repository documentation is canonical for current architecture, terminology, accepted behavior, milestones, constraints, and implementation state.
- Inspect relevant documentation and code before relying on remembered project state.
- Do not duplicate changing project state into static instructions.

## Scope Discipline

- Implement only the requested task.
- Do not build ahead into speculative features, backend systems, or future milestones.
- Preserve accepted behavior outside the task unless changing it is required to complete the task or fix a confirmed regression.
- If the task appears to require a broader architectural change, surface that issue instead of silently expanding scope.

## Architecture

Preserve existing separation between:

- semantic/content state;
- spatial geometry;
- visual presentation;
- interaction state;
- transition behavior;
- persistence/storage concerns.

Prefer solutions that fit existing abstractions and avoid unnecessary coupling, duplicated state, or one-off special cases.

## Bug Investigation

Do not limit debugging to the literal symptom or most obvious file.

Within reasonable scope, investigate related causes such as:

- state ownership or stale state;
- lifecycle and sequencing;
- animation timing;
- geometry and coordinate transforms;
- camera or quaternion/orientation state;
- rendering and visibility state;
- responsive behavior;
- event propagation;
- shared abstractions;
- regressions from adjacent systems;
- assumptions inherited from earlier architecture.

Prefer fixing the underlying cause over adding compensating visual or timing patches.

## Model Use

- Use the model tier specified in the task instruction.
- Use the lowest-cost model that can reliably complete the task.
- Surface the need for escalation when:
  - architecture is ambiguous;
  - debugging spans multiple coupled systems;
  - a broad refactor becomes necessary;
  - repeated attempts are failing;
  - the solution must be discovered through substantial reasoning rather than straightforward implementation.
- Do not escalate merely because a task touches many files if the work remains mechanical.

## Implementation

- Inspect existing abstractions before editing.
- Prefer deterministic behavior where the existing system relies on determinism.
- Avoid unnecessary rewrites of unrelated systems.
- Temporary debugging instrumentation is allowed, but remove it before completion unless it has lasting value.
- Multiple local edit/test/debug cycles may occur before creating a checkpoint.

## Validation

Before claiming completion, run validation appropriate to the task using the repository's established commands.

Where applicable, include:

- typecheck;
- lint;
- content/schema validation;
- targeted validation scripts or tests;
- production build;
- `git diff --check`;
- relevant runtime verification.

Do not claim success solely because the project compiles.

Report pre-existing warnings separately from regressions introduced by the task.

## Documentation

Update canonical repository documentation when the implementation changes:

- architecture;
- accepted behavior;
- terminology;
- milestone status;
- documented constraints;
- validation requirements;
- established invariants.

Do not create redundant documentation that merely repeats the task prompt.

## Git Workflow

- Use a feature/task branch unless explicitly instructed otherwise.
- Do not push directly to `main`.
- Do not merge into `main` without explicit user approval.
- Do not open a pull request unless explicitly requested.
- Commit coherent implementation checkpoints rather than every local experiment.
- Use descriptive commit messages.
- Push the current feature branch when a remote review checkpoint or synchronization is required.

## Decision Authority

Do not silently establish new project-wide architecture when repository documentation does not resolve a consequential choice.

Surface unresolved product or architectural decisions for user/ChatGPT review.

The user retains final authority over:

- product direction;
- architectural tradeoffs;
- scope expansion;
- major refactors;
- changes to accepted behavior;
- merges to `main`.

## Completion Report

At the end of an implementation pass, report concisely:

- what changed;
- the underlying cause when fixing a bug;
- important implementation choices;
- validation performed and results;
- documentation updated;
- commit and push status;
- anything still uncertain or requiring user judgment.

Do not treat implementation completion as authorization to merge.
