# Digital Reservoir
## Resource, Artifact, Collection & Query Ontology Addendum
**Version:** 0.7 — Resource / Artifact / Query Ontology
**Status:** Authoritative Ontology Addendum — Supersedes Conflicting Asset / Source Language Until Folded Into the Main Specification
**Established:** 2026
**Project:** kodyepugh.com
**Primary references:**
- `docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`
- `docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`

---

# 0. Purpose

This addendum formalizes the Digital Reservoir's current model for Resources, Artifacts, Collections, supporting Assets, Sources, and Query Reservoirs.

It exists because the earlier prototype model treated `Artifact`, `Asset`, and `Source Record` too much like fixed entity classes in a hierarchy. L2 content-ingestion planning exposed a more useful distinction:

- a resource can support another object without requiring persistent Collection membership;
- the same resource may later be promoted to Artifact status;
- an Artifact may later be demoted from persistent curation while remaining a supporting resource;
- direct queries can spatially surface an addressable resource without granting it Collection membership;
- Collections should remain curated sets of independently meaningful objects rather than dumping grounds for every constituent file.

Where this addendum conflicts with earlier Asset / Source Record language in the main Interface Specification or Codex Brief, this addendum governs until those documents are fully consolidated in a later revision.

---

# 1. Core Ontology

The current conceptual model is:

```text
RESOURCE
underlying addressable thing
        │
        ├── may support one or more Artifacts
        │       → Asset role
        │       → Source role where provenance / evidentiary origin is the relationship
        │
        ├── may be granted Artifact status
        │       → independently curatable
        │       → eligible for Collection membership
        │       → eligible for persistent Reservoir placement
        │
        └── may remain non-Artifact
                → reachable through supporting relationships
                → surfaceable through Query Reservoirs
                → not persistently placed in Collections

COLLECTION
curates Artifacts and/or Collections
```

The model is relational rather than a fixed containment hierarchy.

---

# 2. Resource

A **Resource** is the underlying addressable thing represented by the system.

A Resource may be:

- an image;
- document;
- chart;
- dataset;
- URL;
- webpage;
- video;
- audio file;
- code file;
- notebook;
- report;
- text excerpt;
- or another materially or semantically useful object.

A Resource does not automatically receive a node in a persistent Collection merely because it exists or is stored.

The system should materialize a Resource only when there is a useful reason to identify, reference, query, inspect, relate, reuse, publish, or otherwise address it independently.

### Foundational rule

> **Addressability does not imply curatorial membership.**

---

# 3. Artifact Status

An **Artifact** is a Resource that has been granted independent curatorial status in the Reservoir.

Artifact status means the Resource is meaningful enough, at the user's current desired granularity, to participate persistently in the organized Reservoir.

An Artifact may:

- receive one or more Collection memberships;
- appear persistently as a node in those Collections;
- carry artifact metadata;
- participate in relationships;
- be surfaced through queries;
- open an Artifact inspection window;
- support other Artifacts as a Resource where relevant.

The underlying Resource is not replaced when Artifact status is granted.

### Promotion

A non-Artifact Resource may be promoted to Artifact status whenever persistent Collection membership or independent curation becomes desirable.

Promotion does not require duplicating the Resource.

### Demotion

An Artifact may be demoted from Artifact status when it no longer warrants persistent Collection placement.

Demotion should remove or disable its Artifact memberships while preserving, where applicable:

- the underlying Resource;
- supporting relationships;
- source / provenance relationships;
- addressability;
- Query Reservoir reachability;
- metadata required to restore or re-promote it later.

### Foundational rule

> **Artifact is a reversible curatorial status, not an immutable file type.**

---

# 4. Supporting Asset Role

An **Asset** is not a required peer entity class beside Artifact.

"Asset" describes a Resource's role relative to an Artifact it supports.

Examples:

```text
Bellabeat Case Study [Artifact]
    supported by
        Sleep Chart [Resource / Asset role]
        Activity Chart [Resource / Asset role]
        Final Report PDF [Resource / Asset role]
        Dataset [Resource / Asset role]
```

One Resource may support multiple Artifacts without duplication.

A Resource may simultaneously:

- support another Artifact;
- retain Artifact status itself;
- belong to one or more Collections;
- be reachable through direct queries.

Therefore Asset and Artifact are not mutually exclusive identities.

### Foundational rule

> **Asset describes subordinate use; Artifact describes curatorial status.**

---

# 5. Source Role

A **Source** is a supporting relationship that expresses provenance, evidentiary origin, or reference context.

The source target is still a Resource.

Examples:

```text
Bellabeat Case Study [Artifact]
    source
        Fitbit Fitness Tracker Dataset [Resource]

Digital Reservoir Case Study [Artifact]
    source
        Interface specification [Resource]
```

A source Resource does not need Artifact status merely because provenance matters.

If the source later becomes independently useful for curation, it may be promoted to Artifact status without breaking the source relationship.

Implementation may retain dedicated provenance metadata or source-record structures where technically useful. The important semantic rule is that those implementation records do not automatically become visible Reservoir objects or Collection members.

### Foundational rule

> **Source is a relationship/role first; provenance metadata may exist underneath without requiring public ontology.**

---

# 6. Collection

A **Collection** is the highest-level curatorial object in the current system model.

A Collection expresses that independently meaningful objects belong together in a useful view.

A persistent Collection may directly curate only:

- Artifacts;
- Collections.

Supporting Resources without Artifact status do not receive ordinary persistent Collection membership.

This preserves the distinction between a curated Reservoir and a file browser.

### Collection is not composition

A Collection does not exist merely because an object has constituent parts.

For example:

```text
Bellabeat Case Study [Artifact]
    uses chart.png
    uses report.pdf
    uses dataset.csv
```

should not automatically become:

```text
Bellabeat [Collection]
    chart.png
    report.pdf
    dataset.csv
```

A Collection emerges only when the independently meaningful child objects warrant persistent curation as a set.

### Foundational rule

> **Collections curate; they do not merely expose composition.**

---

# 7. Curatorial Resolution and Granularity

The Digital Reservoir does not impose a universal atomic unit.

Any object can theoretically be decomposed further:

```text
Document
→ sections
→ paragraphs
→ sentences
→ words
→ characters

Image
→ regions
→ objects
→ pixels
→ channels
```

The system should not materialize every technically possible subdivision.

The current **curatorial resolution** stops at the point beyond which the user has no desired independent addressability or identity.

Further decomposition is warranted only when a smaller constituent becomes useful to:

- name independently;
- inspect independently;
- reference independently;
- query independently;
- relate independently;
- reuse independently;
- publish independently;
- or promote into persistent curation.

If none apply, further granularity remains internal structure rather than additional Reservoir objects.

### Foundational rule

> **The semantic floor is user-defined desired granularity, not technical decomposability.**

---

# 8. Query Reservoirs as the Reachability Layer

The approved Query Reservoir architecture provides the mechanism for surfacing addressable Resources that do not warrant persistent Collection placement.

A direct request for a supporting Resource should be capable of creating a temporary Query Reservoir for that Resource.

Conceptually:

```text
Artifact Window
    supporting resources
        ↓
    select resource
        ↓
DIRECT RESOURCE QUERY
        ↓
temporary Query Reservoir
        ↓
requested Resource surfaced
```

Creating this Query Reservoir does **not**:

- grant Artifact status;
- create a Collection membership;
- convert the Resource into a persistent collection node;
- mutate the source Artifact's Collection memberships.

The Query Reservoir remains temporary navigation context.

Back returns through the established directional `returnContext` ancestry to the context from which the resource query was issued.

Home returns to the root Digital Reservoir.

This allows the system to spatially inspect supporting material without polluting persistent Collections.

### Foundational rule

> **Queries temporarily surface what does not need a permanent place.**

---

# 9. Artifact Window Supporting-Resource Access

An Artifact inspection window may expose a conventional list or panel of supporting Resources.

Examples include:

- images;
- reports;
- charts;
- datasets;
- references;
- source documents;
- code;
- notebooks;
- media;
- external URLs.

Selecting an entry may issue a direct Resource query and transition to a temporary Query Reservoir.

This behavior should work whether the selected Resource:

- is only a supporting Resource; or
- also has Artifact status and Collection memberships elsewhere.

The source Artifact should not need to become a Collection merely to make its supporting material reachable.

---

# 10. Artifact / Resource Relationship Examples

## 10.1 Bellabeat at L2 launch resolution

```text
Work [Collection]
    Bellabeat Case Study [Artifact]
        supported by
            Final Report [Resource]
            Activity Chart [Resource]
            Sleep Chart [Resource]
            Dataset [Resource / Source role]
            SQL validation material [Resource]
```

At this resolution, Bellabeat does not need to be a Collection.

If later several supporting Resources earn independent curatorial value, they may be promoted:

```text
Bellabeat Case Study [Artifact]
Bellabeat Validation Methodology [Artifact]
Bellabeat SQL Analysis [Artifact]
```

If the grouping then becomes useful as a persistent curated world, a Bellabeat Collection may be created:

```text
Bellabeat [Collection]
    Bellabeat Case Study [Artifact]
    Validation Methodology [Artifact]
    SQL Analysis [Artifact]
```

The Collection emerges from useful curation, not from raw file count.

## 10.2 Resource with dual role

```text
Sleep Analysis Chart [Resource + Artifact status]

supports:
    Bellabeat Case Study
    Wearable Behavior Research

member of:
    Analytics [Collection]
    Research [Collection]
```

The same underlying Resource serves supporting and curatorial roles simultaneously.

---

# 11. Membership Rules

Persistent Membership expresses Collection curation.

For the current model:

```text
Collection Membership Target
    = Artifact | Collection
```

A Resource without Artifact status should not receive ordinary Collection membership.

If a user wants such a Resource to belong persistently to a Collection, the intended action is to promote that Resource to Artifact status and then create the desired membership.

Demoting an Artifact requires handling its Collection memberships explicitly; the underlying Resource and supporting relationships should remain available where applicable.

---

# 12. Implementation Boundaries

This ontology establishes conceptual requirements. It does **not** authorize building the full production ingestion system during L2.

Unless explicitly tasked, do not implement:

- production database persistence;
- automated ingestion;
- content hashing;
- automatic deduplication;
- cloud connectors;
- automatic Artifact promotion;
- semantic classification;
- recursive file decomposition;
- automatic Collection creation from folders;
- bulk migration infrastructure.

L2 should use a manual ingestion protocol to test the ontology against real portfolio material.

---

# 13. L2 Manual Ingestion Protocol

For each launch project:

1. gather relevant raw material into an external staging location;
2. inventory candidate Resources without assuming their final role;
3. identify the primary Artifact(s) that warrant persistent Collection membership now;
4. classify other useful Resources by supporting relationship, including Source roles where applicable;
5. identify Resources that are private, redundant, or unnecessary for publication;
6. record possible future Artifact promotion candidates without promoting them merely for density;
7. approve public content and supporting Resources;
8. copy only approved public material into the website implementation;
9. implement Artifact content, relationships, and memberships;
10. validate direct Resource-query behavior separately when that interface capability is implemented.

Bellabeat is the first intended L2 ingestion pilot.

---

# 14. Codex Rules Derived From This Addendum

When implementing future content or ingestion work, Codex must preserve these boundaries:

- do not infer Artifact status from file type;
- do not infer Collection membership merely because a Resource supports an Artifact;
- do not turn every supporting Resource into a node in a persistent Collection;
- do not create Collections merely because an Artifact has many constituent files;
- treat promotion/demotion as changes in curatorial status rather than destructive conversion;
- preserve underlying Resource identity where practical;
- allow one Resource to support multiple Artifacts without duplication;
- treat Source as a supporting/provenance relationship, not an automatic persistent object class;
- use Query Reservoir semantics when a direct Resource request needs temporary spatial presentation;
- preserve `returnContext`, Back, Home, and the approved Query Reservoir closure contract;
- do not implement production ingestion infrastructure unless explicitly authorized.

---

# 15. Canonical Rules

> **Collections curate.**

> **Artifacts are Resources granted persistent curatorial status.**

> **Only Artifacts and Collections receive ordinary persistent Collection membership.**

> **Resources may support Artifacts without becoming Artifacts.**

> **Asset and Source describe contextual roles/relationships, not mandatory permanent public entity classes.**

> **Artifact promotion and demotion are reversible changes in curatorial status.**

> **Queries can surface any addressable Resource without granting Collection membership.**

> **Queries temporarily surface what does not need a permanent place.**

> **Collections express curation, not arbitrary decomposition.**

> **The user determines useful granularity; technical decomposability does not define the semantic floor.**

---

# 16. Relationship to Existing Interface Rules

This ontology does not replace the established interaction rules:

> **Collections change the world. Artifacts open windows.**

It extends them:

> **Queries temporarily surface what does not need a permanent place.**

Together:

```text
COLLECTION
persistent curated world

ARTIFACT
persistently curatable inspectable Resource

SUPPORTING RESOURCE
addressable supporting material

QUERY RESERVOIR
temporary spatial result context
```

This structure is the approved conceptual basis for L2 content ingestion and future ingestion-system design.
