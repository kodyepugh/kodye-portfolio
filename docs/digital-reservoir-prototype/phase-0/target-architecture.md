# Digital Reservoir Prototype Target Architecture

**Status:** Phase 0 proposal — approval required before implementation  
**Version:** 0.1  
**Date:** 2026-08-31  
**Companion documents:** `prototype-charter.md`, `interface-contracts.md`, `acceptance-matrix.md`, `reuse-plan.md`, `multi-agent-execution-plan.md`

## 1. Architectural decision

The prototype will be designed around one inversion of the current portfolio implementation:

> The canonical system is a headless Resource Fabric. The Projection Sphere, Inspection surfaces, public routes, and agent gateway are clients of that fabric.

The present repository proves valuable product behavior but currently resolves content from authored TypeScript registries, in-memory selectors, frontend-owned navigation state, and one large scene coordinator. That shape is appropriate for a finished public portfolio vertical slice. It is not the target persistence, authorization, ingestion, federation, or agent architecture.

## 2. Architectural principles

1. **Identity precedes presentation.**  
   Resource and Collection identities exist independently of files, routes, Collections, projections, or storage locations.

2. **One canonical semantic substrate.**  
   Human interfaces and agents use the same Objects, relationships, assertions, policies, and context resolver.

3. **Policy before projection.**  
   Unauthorized Objects and derived data never enter a client manifest and are not merely hidden in the browser.

4. **Generated knowledge is attributed.**  
   Summaries, classifications, embeddings, and inferred relationships retain provenance, model/version, confidence, evidence, and review state.

5. **Context is independent of projection.**  
   Spatial, Index, and Relational views render the same active context; switching views does not change that context.

6. **Bounded projection over unbounded catalog.**  
   No client is expected to load or render the full knowledge base. The Context Engine resolves progressive, cursor-based, aggregated manifests.

7. **Logical modularity before physical distribution.**  
   The prototype begins as a modular monolith plus background workers, not a fleet of premature microservices.

8. **Storage custody is replaceable.**  
   Managed and federated Resources share the same semantic identity and policy model.

9. **Inspection remains conventional.**  
   Long-form reading, media consumption, tables, and administrative work remain accessible 2D interfaces.

10. **Auditability is foundational.**  
    Human and agent mutations produce durable audit events.

## 3. System overview

```text
Managed Uploads         Federated Storage         Remote Reservoirs
       \                       |                         /
        \                      |                        /
                 Source and Storage Adapters
                             |
                     Resource Registration
                             |
                     Resource Compiler Queue
        ------------------------------------------------
        | extraction | previews | segments | embeddings |
        | summaries  | assertions | relation proposals  |
        ------------------------------------------------
                             |
                 Canonical Resource Fabric
        ------------------------------------------------
        | Object catalog | versions | representations   |
        | Collections    | memberships | relationships  |
        | assertions     | provenance | policies        |
        | principals     | agent grants | audit events  |
        ------------------------------------------------
                             |
          Search, Policy, Relationship, and Context Engine
             /                 |                    \
            /                  |                     \
 Projection Sphere       Inspection / Admin       Agent Gateway
 Spatial | Index |       conventional 2D UI       MCP adapter +
 Relational                                        REST/OpenAPI
            \                  |                      /
             \                 |                     /
                    Federated Context Gateway
```

## 4. Recommended repository and deployment shape

Broad implementation should occur in a separate TypeScript monorepo.

```text
digital-reservoir-prototype/
  apps/
    web/                 Projection Sphere, Inspection, curation UI
    api/                 authenticated application and agent API
    worker/              compiler and background jobs
  packages/
    contracts/           versioned transport and domain contracts
    domain/              Object, Resource, Collection, relationship rules
    policy/              authorization decisions and policy tests
    context/             context resolution and manifest construction
    projections/         projection adapter interfaces and shared state
    ingestion/           compiler stages and assertion contracts
    federation/          remote identity/reference contracts
    testing/             fixtures, synthetic generators, contract harnesses
  docs/
    architecture/
    decisions/
    execution/
```

Recommended prototype infrastructure:

- PostgreSQL for transactional identity, versions, memberships, policies, audit, and relationship records;
- pgvector for embedding retrieval within the same operational boundary;
- S3-compatible object storage for managed bytes and generated representations;
- a durable job queue for compiler work;
- an OIDC-compatible identity provider;
- server-side structured logging and trace correlation;
- a staging deployment with isolated Reservoir A and Reservoir B workspaces.

These are implementation defaults, not semantic invariants. The domain contracts must remain portable.

## 5. Canonical domain model

### 5.1 Persistent semantic Objects

```text
Object
├── Collection
└── Resource
```

A persistent Object has:

- globally unique internal ID;
- workspace/reservoir ownership;
- stable semantic address;
- human-readable slug aliases;
- lifecycle state;
- policy reference;
- created/updated metadata;
- audit history.

### 5.2 Resource

A Resource is an independently addressable content-bearing Object.

It owns or references:

- current version;
- immutable version history;
- one or more representations;
- source/provenance records;
- extracted segments;
- accepted and pending assertions;
- relationships;
- Artifact status;
- inspection contract.

Resource identity does not change when:

- the file is renamed;
- the storage location changes;
- a new version is uploaded;
- Artifact status changes;
- Collection membership changes;
- a remote Resource is referenced;
- a public route changes.

### 5.3 Collection

A Collection is a persistent curated context.

A Collection may have explicit memberships to:

- another Collection;
- an Artifact-status Resource.

Smart Collections may later persist an owner-approved rule, but the prototype treats that as an optional extension. Query contexts remain ephemeral.

### 5.4 Artifact status

Artifact remains a reversible state on a Resource.

Promotion:

- enables ordinary persistent Collection membership;
- does not create a second Object;
- does not change the Resource address.

Demotion:

- disables or removes memberships according to policy;
- preserves Resource identity, versions, provenance, supporting relationships, and direct queryability.

### 5.5 Representations and versions

A **Version** captures one immutable state of a Resource’s source content.

A **Representation** is one consumable or derived form of a Resource version, such as:

- original file;
- extracted text;
- normalized HTML;
- thumbnail;
- preview image;
- structured document;
- tabular preview;
- embedding set;
- external locator.

Representations do not create new Resource identity unless the user explicitly materializes one as an independently meaningful Resource.

### 5.6 Assertions

An Assertion is a provenance-bearing claim about an Object or relationship.

Sources include:

- user;
- administrator;
- import;
- deterministic system rule;
- model-generated inference;
- remote reservoir.

Assertion states include:

- proposed;
- accepted;
- rejected;
- superseded;
- expired.

Examples:

- summary;
- Resource type;
- topic;
- entity;
- relationship;
- Collection recommendation;
- Artifact recommendation;
- duplicate/version candidate.

Accepted facts used for system behavior must remain distinguishable from pending model output.

### 5.7 Relationships

Relationships are directed, typed, independently governed records.

Prototype Object-relationship families:

- semantic — related-to, about, supports, contradicts;
- provenance — derived-from, source-of;
- structural — contains or materially-part-of when both constituents have been deliberately materialized as Resources;
- operational — supersedes or depends-on between persistent Objects;
- social/federated — references-remote, imported-from, forked-from.

Version lineage, Representation derivation, model generation, and human review remain explicit Version, Representation, Assertion, and Audit records unless both endpoints are independently materialized Objects. Collection Membership remains a separate first-class relationship because it carries curatorial rules unavailable to generic graph edges.

### 5.8 Policy and principals

A Principal may be:

- human user;
- workspace group;
- service account;
- agent identity;
- public/anonymous principal.

Policies define action-level access over:

- Object;
- Version;
- Representation;
- Relationship;
- Collection membership;
- assertion;
- context;
- agent operation.

The initial policy engine may use a compact relationship/attribute model, but its API must be independent of any vendor.

### 5.9 Remote references

A Remote Reference stores:

- origin reservoir identity;
- remote Object address;
- remote version or revision marker;
- permission-scoped resolver;
- local display/cache metadata;
- lineage and ownership truth;
- access/revocation state.

A remote reference is not a local copy. Import and fork are explicit operations that create local ownership with retained lineage.

## 6. Major application modules

### 6.1 Source and Storage Adapters

Responsibilities:

- managed upload;
- federated locator registration;
- byte streaming;
- storage-specific authorization;
- checksum and version signals;
- revocation/unavailability reporting.

They must not decide Artifact status, Collection placement, or visible relationships.

### 6.2 Resource Registration

Registration is synchronous and minimal.

It:

1. authenticates the principal;
2. creates a stable Resource ID and address;
3. records source/storage custody;
4. creates an initial version record;
5. writes an audit event;
6. queues compiler work;
7. returns the address and processing status.

The user does not wait for AI processing to receive Resource identity.

### 6.3 Resource Compiler

The compiler is an idempotent staged pipeline.

Conceptual stages:

```text
registered
→ secured
→ typed
→ extracted
→ segmented
→ represented
→ enriched
→ proposed
→ review-ready
```

Each stage:

- receives a versioned job payload;
- records status and structured errors;
- may retry safely;
- emits representations or assertions;
- never silently accepts model assertions as authoritative facts.

### 6.4 Resource Catalog

The catalog is the transactional source of truth for:

- Objects;
- versions;
- representations;
- Artifact status;
- Collections and memberships;
- assertions;
- provenance;
- policies;
- aliases and stable addresses.

Search indexes and caches are derived and rebuildable.

### 6.5 Relationship Service

Responsibilities:

- typed edge storage;
- direction and role semantics;
- assertion/review state;
- evidence and provenance;
- policy inheritance;
- neighborhood traversal;
- relationship bundles for Relational Projection.

It does not infer Collection membership from semantic similarity.

### 6.6 Search Service

The prototype uses hybrid retrieval:

- exact address and metadata;
- full-text;
- vector similarity;
- relationship constraints;
- Collection and policy filters.

Search returns candidate Object IDs and scores. The Context Engine remains responsible for converting results into a coherent active context.

### 6.7 Policy Service

All read and mutation paths call one policy decision interface.

The service must evaluate:

- principal;
- action;
- target;
- workspace/reservoir;
- inherited policy;
- representation or edge restrictions;
- delegated agent grant;
- remote-origin constraints.

No projection or agent adapter may implement its own weaker publication filter.

### 6.8 Context Engine

The Context Engine is the canonical resolver for human and agent contexts.

Inputs include:

- Collection address or query definition;
- principal and agent grant;
- filters;
- cursor/resolution request;
- selected/focused Object;
- projection capabilities;
- device/render budget.

Output is a versioned, policy-filtered **Context Manifest** containing:

- context identity and kind;
- canonical Object summaries;
- permitted relationship summaries;
- aggregate groups;
- cursors and counts;
- selection/focus validity;
- Inspection targets;
- projection hints;
- provenance and freshness markers.

The Context Engine does not return WebGL geometry as semantic truth. Projection adapters may derive view state from manifest data.

### 6.9 Projection Sphere Shell

The shell owns:

- active projection;
- horizontal cyclic rotation;
- projection transition state;
- shared active context subscription;
- shared selection/focus;
- navigation command dispatch;
- reduced-motion behavior;
- keyboard and touch equivalents;
- reservation of the vertical axis.

It does not own Resource records, policy decisions, Collection membership, or search execution.

### 6.10 Spatial Projection

Responsibilities:

- recursive 3D rendering of the active context;
- deterministic layout from stable Object IDs and context key;
- bounded leaf and aggregate nodes;
- orientation and zoom;
- negative-space budgeting;
- semantic-resolution requests;
- spatial selection and navigation intents.

The existing centered-sphere, mesh-independent layout, node sizing, pointer, and label concepts are reference inputs.

### 6.11 Index Projection

Responsibilities:

- exact accessible inventory of the active context;
- virtualized list/grid/table presentations;
- sort and filter controls that update the shared context;
- keyboard and assistive-technology access;
- bulk curation where authorized;
- the same selection, Inspection, and navigation commands used elsewhere.

It is not an independently maintained registry.

### 6.12 Relational Projection

Responsibilities:

- explain typed relationships around the context anchor or focused Object;
- represent direction, type, provenance/review state, and confidence;
- aggregate large neighborhoods into labeled bundles;
- allow local recentering without implicit context navigation;
- issue explicit navigation commands when the user chooses to enter another context;
- request progressively deeper neighborhoods.

It must avoid an unreadable all-edges graph.

### 6.13 Inspection and Curation UI

Inspection remains a conventional 2D layer.

It owns:

- type-driven Resource rendering;
- version and provenance visibility;
- accepted/pending assertion review;
- related Resource and Collection context;
- download/open-original actions;
- Artifact promotion/demotion;
- Collection placement;
- return to the preserved active context.

The existing shared chassis and renderer grammar may be adapted.

### 6.14 Agent Gateway

The gateway translates protocol-specific requests into the same application services used by the UI.

It exposes:

- discovery;
- retrieval;
- relationship traversal;
- Context Packages;
- provenance;
- permitted proposal operations.

It enforces delegated grants and creates audit events. MCP and REST/OpenAPI are adapters, not separate authorization systems.

### 6.15 Federation Gateway

Responsibilities:

- reservoir identity and endpoint discovery;
- signed or authenticated remote manifest retrieval;
- remote Object resolution;
- permission-scoped caching;
- mount/reference/import/fork semantics;
- revocation and stale-state handling;
- origin and lineage preservation.

Federation does not bypass local policy evaluation or convert every remote result into a local Object automatically.

## 7. Active context and Projection Sphere state

State is separated into four layers:

```text
Semantic context
  Collection or Query identity, filters, permitted result population

Projection state
  active horizontal projection, transition phase, projection-local view state

Attention state
  focused Object, selected Object, Inspection target

Navigation state
  visit history, Home, Back, direct address, return state
```

Canonical rules:

- projection rotation does not create a semantic history visit;
- projection-local zoom, orientation, list scroll, and graph recentering do not redefine context;
- selection may survive projection rotation if the Object exists in the manifest;
- a context change invalidates attention only when the target is absent or forbidden;
- all context-changing actions go through one navigation coordinator;
- Inspection return state belongs to a visit, not to a global Resource singleton.

## 8. Data flow examples

### 8.1 Upload to curation

```text
Upload
→ stable Resource registered
→ version stored
→ compiler stages run
→ representations and assertions produced
→ review inbox
→ user accepts/edits recommendations
→ Artifact status and memberships updated
→ Context Manifest revision advances
→ all projections refresh from the same revision
```

### 8.2 Projection rotation

```text
Spatial active
→ user swipes horizontally
→ Projection Sphere enters transition
→ active Context Manifest remains unchanged
→ Index becomes active
→ selection and context are preserved
→ no semantic history entry is created
```

### 8.3 Relational recentering

```text
Relational view
→ user focuses neighboring Resource
→ graph recenters locally
→ active context remains unchanged
→ explicit “enter” command
→ navigation coordinator resolves new Collection or Query context
→ all projections receive the new manifest
```

### 8.4 Agent request

```text
Agent principal + delegated grant
→ request Context Package
→ policy evaluation
→ Context Engine resolves bounded permitted context
→ package includes citations/provenance/version markers
→ audit event written
```

### 8.5 Remote traversal

```text
Local user opens permitted remote reference
→ federation gateway resolves origin identity and access
→ local policy evaluates allowed operation
→ remote Object appears with origin truth
→ reference or mount does not duplicate bytes
→ import/fork creates explicit local lineage
```

## 9. Security and privacy boundaries

Minimum rules:

- untrusted file processing occurs in an isolated worker boundary;
- originals are never made public because a summary is public;
- derived representations inherit the strictest applicable source policy until reviewed;
- embeddings and extracted segments are treated as protected data;
- policy checks occur server-side for every query, edge traversal, download, and agent action;
- remote data retains origin restrictions;
- cached remote data has expiry and revocation behavior;
- secrets never enter Resource metadata or model prompts by default;
- model calls use only the content required for the stage;
- model and tool outputs are stored with attribution;
- destructive actions require explicit authorization and audit.

## 10. Scalability path

The prototype remains physically simple:

- one transactional database;
- one object store;
- one API deployment;
- one worker deployment;
- one queue;
- horizontally scalable stateless web/API instances.

Logical module boundaries allow later separation when measured pressure justifies it:

- compiler workers by file type;
- dedicated search infrastructure;
- graph traversal service;
- policy service;
- federation gateway;
- enterprise tenant isolation.

No service is split merely because the eventual product could be large.

## 11. Observability

Every request or job should carry a correlation ID.

Required evidence includes:

- ingestion stage timings and failures;
- model usage and assertion provenance;
- policy decisions without logging protected content;
- Context Manifest sizes and query latency;
- projection performance metrics;
- agent operation audit;
- federation access and revocation events;
- deployment and migration version.

Observability is part of completion evidence, not deferred production polish.

## 12. Architecture boundaries inherited from the current system

The target preserves:

- semantic identity separate from layout;
- deterministic spatial placement;
- active semantic context separate from transition state;
- visit history separate from geometry;
- type-driven Inspection;
- Index as a projection of active context;
- conventional access alongside WebGL;
- explicit unsupported states;
- user-defined curatorial resolution.

The target replaces:

- authored TypeScript arrays as persistence;
- `published: boolean` as the full access model;
- frontend selectors as the only query layer;
- scene-owned routing and semantic coordination;
- Resource relationships limited to portfolio support edges;
- public-route history as the primary environment;
- one application bundle serving storage, semantics, and visualization.

## 13. Architecture approval boundary

Approval of this document authorizes only a later implementation-scaffold task. It does not authorize:

- migration of portfolio content;
- broad feature implementation;
- dependency installation in the live portfolio;
- creation of cloud resources;
- production user data ingestion;
- merge to `main`.

Those actions require an approved execution task under the multi-agent plan.
