# Digital Reservoir Prototype Charter

**Status:** Phase 0 proposal — approval required before prototype implementation  
**Version:** 0.1  
**Date:** 2026-08-31  
**Reference implementation audited:** `kodyepugh/kodye-portfolio@main`  
**Implementation authorization:** None. This document defines a bounded prototype; it does not authorize broad implementation.

## 1. Purpose

The prototype exists to prove that the Digital Reservoir can operate as a headless, permission-aware knowledge system whose flagship interface is a synchronized **Projection Sphere** rather than a portfolio-specific 3D website.

The prototype must preserve the established semantic foundation:

- persistent `Object = Collection | Resource`;
- every persistent Object has stable direct identity and addressability;
- Artifact is reversible curatorial status on a Resource;
- Collection membership is selective and does not define identity;
- Asset and Source describe roles or provenance, not mandatory peer Object types;
- Collection Reservoirs are persistent contexts;
- Query Reservoirs are temporary retrieval contexts;
- `inspectionKind` determines presentation;
- Collections organize, Queries retrieve, and Inspection reveals.

It must extend that foundation into a system capable of:

1. registering uploaded or connected files as Resources;
2. automatically extracting, summarizing, classifying, and proposing relationships and curation;
3. resolving one permission-filtered active context across Spatial, Index, and Relational projections;
4. supporting private, workspace, and public access;
5. serving human interfaces and authorized agents from the same canonical substrate;
6. demonstrating governed traversal between two independent reservoirs;
7. operating over a catalog large enough to validate bounded, progressively resolved projections.

## 2. Product thesis under test

> The Digital Reservoir is a persistent knowledge fabric. The recursive 3D Reservoir, conventional Index, and Relational map are synchronized projections of one active semantic context.

The prototype succeeds only if the same Resource identity, relationships, policy decisions, and context state can be consumed through:

- a recursive 3D Spatial Projection;
- a conventional Index Projection;
- a relationship-centered Relational Projection;
- a conventional Inspection surface;
- a permission-scoped agent interface.

The graphical interface must not become the database, authorization engine, ingestion pipeline, or sole route to content.

## 3. Repository boundary

Phase 0 documents live in the current portfolio repository because that repository contains the accepted ontology and reference interaction behavior.

Broad prototype implementation should occur in a separate repository, provisionally:

```text
digital-reservoir-prototype
```

The current `kodye-portfolio` repository remains:

- the live public portfolio;
- the accepted reference implementation for interaction behavior;
- a source of reusable algorithms, tests, components, and product grammar;
- protected from platform-scale experimental architecture.

The new repository should consume selected concepts and code through deliberate extraction or reimplementation. It should not begin as a branch that silently converts the live portfolio into a multi-tenant platform.

## 4. Primary users represented in the prototype

### 4.1 Individual owner

An individual maintains a private reservoir, uploads personal and professional files, curates selected Resources, grants an agent limited access, and publishes a subset.

### 4.2 Team knowledge operator

A team member uploads and organizes shared material, reviews machine-generated assertions, navigates a large shared context, and sees only permitted Resources and relationships.

### 4.3 Enterprise evaluator

An evaluator verifies that identity, provenance, policy filtering, auditability, storage abstraction, bounded projection manifests, and agent permissions are designed as platform concerns rather than frontend conventions.

The prototype is not required to satisfy every enterprise compliance program. It must demonstrate architecture that can be extended without replacing the canonical model.

## 5. Bounded prototype scenario

The reference demonstration will use two isolated reservoirs:

```text
Reservoir A — primary owner/workspace
Reservoir B — independent owner/workspace
```

Reservoir A will:

1. accept representative file uploads;
2. register stable Resource identities before AI processing completes;
3. create versions, representations, extracted segments, previews, and provenance;
4. generate summaries, classifications, relationship proposals, Collection proposals, and Artifact recommendations as reviewable assertions;
5. allow approved Resources and Collections to populate persistent Collection contexts;
6. construct temporary Query contexts;
7. display the same active context through the three Projection Sphere projections;
8. apply private, workspace, and public policies before generating any projection or agent response;
9. provide an authorized agent with bounded context packages;
10. discover and reference a permitted Resource exposed by Reservoir B;
11. distinguish remote reference, mounted context, imported copy, and fork.

## 6. In-scope capabilities

### 6.1 Storage and registration

The prototype supports:

- managed upload into S3-compatible object storage;
- one federated-storage adapter proving that Resource identity is independent of byte custody;
- immutable file-version records;
- content hashing and duplicate-candidate detection;
- stable Resource addresses issued at registration;
- provenance for upload, connector, import, fork, and machine-derived representations.

Recommended federated-storage proof: a separately configured S3-compatible bucket. This proves bring-your-own-storage behavior without making the prototype depend on a broad connector marketplace.

### 6.2 Initial Resource types

The automated compiler must support a deliberately limited representative set:

- PDF;
- DOCX;
- Markdown and plain text;
- JPEG, PNG, and WebP images;
- CSV.

Other file types may be registered as generic files but are not required to receive rich extraction.

External URLs may be registered as Resources, but arbitrary web crawling is not an ingestion requirement.

### 6.3 Resource compiler

For supported types, the compiler must provide:

- MIME/type verification;
- safe-file handling and explicit failure states;
- text and metadata extraction where applicable;
- thumbnail or preview generation where applicable;
- internal segmentation without automatically creating a persistent Resource for every segment;
- concise and extended summaries;
- searchable text and embeddings;
- Resource-type and `inspectionKind` recommendations;
- entity and topic extraction;
- duplicate/version candidates;
- typed relationship proposals;
- existing Collection recommendations;
- new Collection proposals when no suitable approved Collection exists;
- Artifact promotion recommendations;
- model/version, timestamp, confidence, and evidence attached to generated assertions.

Machine output must remain an assertion until accepted by a user or an explicitly approved automation rule.

### 6.4 Curation

The prototype supports:

- approve, reject, edit, and supersede machine assertions;
- promote or demote a Resource without changing its identity;
- create and edit curated Collections;
- assign Artifact-status Resources and Collections to Collections;
- preserve supporting/provenance relationships independently from membership;
- surface unreviewed or unassigned Resources through an operational query/inbox rather than a catch-all Collection.

### 6.5 Contexts

The prototype supports:

- persistent Collection contexts;
- ephemeral Query contexts;
- direct Resource contexts resolved through a single-result Query Reservoir;
- a policy-filtered active Context Manifest;
- context-local filters;
- selection and focus distinct from navigation;
- Back, Home, direct history selection, and conventional direct addresses;
- bounded populations, paging, aggregation, and progressive resolution.

### 6.6 Projection Sphere

The Projection Sphere contains three horizontally cyclic projections:

1. **Spatial Projection** — recursive 3D Reservoir;
2. **Index Projection** — structured and accessible inventory;
3. **Relational Projection** — typed relationship explanation around the active context or current focus.

Required behavior:

- horizontal swipe, drag, keyboard, and explicit controls rotate between projections;
- the projections behave as surfaces on the inner circumference surrounding the user, not as unrelated tabs;
- rotating projections does not change semantic context or append history;
- context navigation updates all three projections;
- selection and focus remain synchronized where the selected Object is present;
- Relational recentering changes focus by default, not context;
- explicit navigation from any projection uses one shared navigation command;
- Inspection remains conventional 2D UI above the projections;
- the vertical axis is reserved and has no product semantics in this prototype.

### 6.7 Access

The prototype implements three visibility layers:

- private;
- workspace/shared;
- public.

The policy model must separately govern at least:

- discovery;
- metadata read;
- preview/derived representation read;
- original download;
- relationship traversal;
- curation;
- agent read;
- agent proposal/write.

Policy filtering must occur before Context Manifests, search results, relationship graphs, summaries, previews, embeddings, or agent packages leave the trusted service boundary.

### 6.8 Agent access

The prototype exposes a transport-independent agent service with an MCP-compatible adapter and REST/OpenAPI fallback.

Required read operations:

- search;
- resolve Object address;
- read permitted metadata;
- retrieve a permitted representation;
- traverse permitted relationships;
- obtain a bounded Context Package;
- inspect provenance and assertion status.

Required write behavior:

- an agent may propose relationships, metadata changes, Collection placement, or Artifact promotion only under an explicit grant;
- proposals remain reviewable unless an approved rule permits automatic acceptance;
- all agent activity is audited;
- no agent receives direct database access.

### 6.9 Federated traversal

Between the two test reservoirs, the prototype must demonstrate:

- permission-filtered remote discovery;
- stable remote identity;
- local reference without byte duplication;
- a mounted remote Collection or remote Query context;
- explicit import;
- explicit fork with lineage;
- origin-side revocation or loss of access;
- truthful distinction between remote, imported, and locally owned Objects.

Open public federation, global discovery, and a social feed are not required.

### 6.10 Scale proof

The prototype must support a synthetic catalog of at least:

- 50,000 Resources;
- 100,000 relationships;
- one query matching at least 10,000 Resources.

The UI must not attempt to render the full result graph.

The Context Engine must produce bounded manifests using:

- aggregation;
- pagination or cursors;
- progressive resolution;
- projection-specific render budgets.

The initial target visible budget is:

- Spatial: no more than 400 leaf or aggregate nodes;
- Relational: no more than 300 visible nodes and 600 visible edges;
- Index: virtualized access to the complete permitted result set.

These values are prototype targets and may be tuned through measured testing. They are not enterprise capacity claims.

## 7. Explicitly out of scope

The prototype does not include:

- conversion of the live portfolio into the platform;
- billing, subscriptions, or marketplace functionality;
- production SCIM provisioning;
- complete enterprise SSO administration;
- legal hold, eDiscovery, or records-management certification;
- multi-region active-active deployment;
- formal uptime or disaster-recovery guarantees;
- every cloud-storage connector;
- open, global reservoir federation;
- public social feeds, messaging, reactions, or follower systems;
- arbitrary website crawling;
- rich extraction for every file type;
- real-time collaborative editing;
- autonomous acceptance of all model-generated assertions;
- a defined vertical Projection Sphere dimension;
- VR hardware support;
- claims of infinite rendering or million-user readiness.

## 8. Prototype completion standard

The prototype is complete only when a fresh staging environment can demonstrate the entire reference scenario and the acceptance matrix has no unresolved blocking criteria.

Completion requires:

- reproducible environment setup and migrations;
- automated tests for domain contracts, ingestion, policy, context, APIs, and projection synchronization;
- end-to-end upload-to-inspection flow;
- manual approval of compiler quality against representative files;
- synchronized three-projection behavior;
- two-reservoir federation proof;
- agent permission and audit proof;
- synthetic-scale evidence;
- accessibility and reduced-motion alternatives;
- documented failures and unsupported states;
- independent review of security, architecture, and regression findings;
- final user acceptance at the defined validation gates.

A compiling application or visually convincing 3D scene is not sufficient.

## 9. User validation gates

### Gate 0 — Charter and architecture

The user approves:

- separate-repository boundary;
- prototype scope and deferrals;
- initial file types;
- storage proof;
- access layers;
- critical interface semantics;
- target architecture and contracts.

### Gate 1 — Projection Sphere shell

The user validates:

- horizontal globe/inner-surface metaphor;
- transition weight and orientation;
- projection adjacency;
- preservation of context;
- selection/focus/navigation distinction;
- negative-space quality.

### Gate 2 — Semantic ingestion quality

Using representative files, the user validates:

- summaries;
- Resource boundaries;
- relationship proposals;
- Collection recommendations;
- Artifact recommendations;
- review and correction workflow.

### Gate 3 — Access, agent, and federation behavior

The user validates:

- private/workspace/public expectations;
- agent grants;
- remote reference/import/fork distinctions;
- revocation behavior.

### Gate 4 — Release candidate

The user performs final scenario-based acceptance on staging. Merge or release remains a separate explicit decision.

## 10. Decisions intentionally deferred until Gate 0 approval

The following are recommendations, not silent implementation commitments:

- final new-repository name;
- exact API framework;
- exact background-job implementation;
- exact OIDC provider;
- whether the first federated-storage adapter is S3-compatible storage or another provider;
- final visual treatment of the Relational Projection;
- final numeric render budgets after benchmarking.

These decisions may be resolved during the implementation-scaffold task, but none may alter the semantic contracts without review.

## 11. Phase 0 stop condition

Phase 0 ends when the six planning documents are:

- committed to a dedicated documentation branch;
- internally consistent;
- grounded in the audited repository;
- reviewable by the user;
- free of prototype implementation code.

No new application repository, database, ingestion worker, Projection Sphere component, or platform service is created during Phase 0.
