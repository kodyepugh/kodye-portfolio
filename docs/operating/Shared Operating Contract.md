# KP Website — Shared Operating Contract

## Purpose

These instructions define how work on the KP Website / Digital Reservoir project should be conducted across ChatGPT and Codex.

They are intentionally limited to stable operating rules.

Do not use static memory to preserve changing implementation details, milestone status, feature behavior, branch state, or architectural descriptions that are already maintained in the repository. Repository documentation is the durable source of truth for those subjects.

## Prompting and Model Recommendations

Approval is required before issuing or finalizing an execution prompt for Codex. Every approved Codex instruction must recommend the appropriate model level, using the lowest-cost model expected to complete the task reliably. Discussion, diagnosis, planning, and task decomposition may happen before approval.

## Source-of-Truth Order

When information conflicts, use this order:

1. The user's current explicit instruction.
2. Current canonical documentation in the repository.
3. Current task or feature specification.
4. Established repository conventions and validated implementation behavior.
5. Agent inference.

Do not rely on remembered implementation details when current repository documentation or code can resolve the issue.

## Repository as Durable Project Memory

Treat the repository as the canonical record of:

- product architecture;
- terminology;
- feature specifications;
- accepted interaction behavior;
- milestone and release status;
- implementation decisions;
- technical constraints;
- deferred work;
- known issues;
- acceptance criteria;
- validation procedures.

Do not unnecessarily duplicate this material in prompts or static memory.

Before undertaking work whose correctness depends on current implementation state, inspect the relevant repository documentation and code rather than reconstructing the state from conversational memory.

## Scope Discipline

Implement the requested task, not adjacent speculative features.

Do not build ahead into future product architecture unless the current task explicitly requires it.

Preserve established behavior outside the task's intended scope unless:

- it is demonstrably broken;
- changing it is necessary to satisfy the current task; or
- the user explicitly approves a broader change.

If a task exposes an architectural issue outside its intended scope, surface the issue rather than silently expanding the implementation.

## Architecture Discipline

Preserve separation between conceptual layers wherever the existing architecture intends such separation, including distinctions among:

- semantic/content state;
- spatial geometry;
- visual presentation;
- interaction state;
- transition behavior;
- persistence or storage concerns.

Avoid solving presentation problems by introducing unnecessary semantic coupling, and avoid solving semantic problems with fragile presentation-specific state.

Prefer changes that preserve future extensibility without prematurely implementing future systems.

## Bug Investigation

When diagnosing a bug, do not limit investigation to the literal symptom or the most obvious file.

Within reasonable scope, examine parallel and tangential causes that could produce the behavior, including:

- state ownership;
- stale state;
- transition sequencing;
- lifecycle timing;
- geometry or coordinate transforms;
- camera or orientation state;
- rendering state;
- responsive behavior;
- event propagation;
- reused abstractions;
- regressions from adjacent systems;
- assumptions inherited from earlier architecture.

Fix the underlying cause when it can be identified reliably rather than layering a visual or timing patch over the symptom.

## Validation

Every implementation pass should perform validation appropriate to its scope.

Use the repository's established validation commands and relevant targeted checks.

Do not claim completion solely because the code compiles.

Where applicable, validate:

- type correctness;
- lint;
- content/schema validation;
- production build;
- targeted tests or diagnostics;
- regressions in affected behavior;
- responsive or runtime behavior.

Report pre-existing warnings separately from regressions introduced by the current task.

Before implementation, identify the current branch and repository state, read the relevant canonical documentation, inspect the affected implementation areas, and understand existing abstractions. Preserve unrelated accepted behavior.

If validation cannot be completed, state exactly what remains unverified. Do not treat compilation or an executor's success report as sufficient evidence of completion.

## Git Discipline

Use a branch-per-task workflow unless the user explicitly directs otherwise.

For implementation work:

- work on the current feature/task branch;
- do not merge to `main` without explicit approval;
- do not push directly to `main`;
- create commits at coherent implementation checkpoints rather than after every experimental edit;
- use descriptive commit messages;
- push coherent checkpoints to the remote feature branch when remote review or durable synchronization is appropriate.

Local debugging iterations do not each require a commit.

## Documentation Discipline

When an implementation changes behavior, architecture, terminology, task status, or a documented invariant, update the appropriate canonical repository documentation as part of the implementation.

Do not create documentation merely to repeat information already maintained elsewhere.

Documentation should describe the resulting system, not narrate every experimental implementation step.

When implementation changes architecture, behavior, terminology, milestone status, constraints, validation requirements, or invariants, update the appropriate canonical repository documentation in the same pass. Do not use static memory for changing implementation details, branch state, temporary priorities, or current bugs.

## Efficiency Principle

Use the least expensive execution path that can reliably solve the task while reserving stronger models and broader context for work where additional reasoning capability materially improves the result.

Do not use expensive inference for mechanical work simply because it is available.

Do not use a weak model for architectural decisions where misunderstanding would create substantial rework.

The approved execution prompt must state the recommended model level. Use the lowest-cost model that can reliably complete the task. Local work may include multiple edit/test/debug cycles before a coherent checkpoint; temporary diagnostics should be removed unless they have lasting value.

## Escalation

Escalate model capability or reasoning depth when any of the following apply:

- architecture is ambiguous;
- the task spans several tightly coupled subsystems;
- debugging requires causal reasoning across the repository;
- a lower-tier model has failed repeatedly;
- the implementation requires choosing among materially different architectural approaches;
- the consequence of an incorrect interpretation would be substantial rework.

Do not escalate merely because a task is large if it is mechanically straightforward.

## User Authority

The user retains final authority over:

- product direction;
- architectural tradeoffs;
- scope expansion;
- merging;
- major refactors;
- new feature development;
- changes to accepted behavior.

When a meaningful product or architectural choice cannot be resolved from repository documentation, present the decision to the user rather than silently choosing a new direction.

At the end of an implementation pass, report what changed, important implementation choices, validation performed and results, documentation updated, commit/push status, and anything still uncertain or requiring user judgment. Implementation completion does not authorize merging.
