# Digital Reservoir
## Object, Resource, Artifact, Collection, Query & Inspection Ontology Addendum
**Version:** 0.7.1 — Universal Object Addressability & Inspection Surfaces
**Status:** Authoritative Ontology Addendum — Supersedes Conflicting Asset / Source / Inspection Language Until Folded Into the Main Specification
**Established:** 2026
**Project:** kodyepugh.com
**Primary references:**
- `docs/digital-reservoir-interface-spec-v0.4-v2-prototype-foundation.md`
- `docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md`

---

# 0. Purpose

This addendum formalizes the Digital Reservoir's current semantic model for:

- Objects;
- Collections;
- Resources;
- Artifact status;
- supporting Asset and Source roles;
- direct addressability;
- Query Reservoirs;
- curatorial resolution;
- and type-driven inspection surfaces.

It exists because L2 manual-ingestion planning exposed several distinctions that the earlier prototype model did not express clearly enough:

- `Artifact`, `Asset`, and `Source Record` should not be treated as fixed levels in a containment hierarchy;
- the same Resource may support another Artifact and also have Artifact status itself;
- Artifact status may be granted or removed without replacing the underlying Resource;
- Collections should remain curated sets of independently meaningful objects rather than dumping grounds for constituent files;
- every persistent semantic Object must be directly addressable in its own right;
- Query Reservoirs provide temporary spatial surfacing without granting persistent Collection membership;
- the way an Object is inspected should be determined by its content/inspection kind rather than by whether it has Artifact status;
- document-like Artifacts need structure-driven rendering rather than one fixed case-study template;
- supporting Resources should remain visible and independently queryable from the Artifact they support.

Where this addendum conflicts with earlier Asset / Source Record / Artifact Window language in the main Interface Specification or Codex Brief, this addendum governs until those documents are fully consolidated in a later revision.

---

# 1. Core Ontology

The current conceptual model is:

```text
OBJECT
persistent semantic thing known to the system
│
├── COLLECTION
│     curated persistent context
│     may contain:
│       - Collection
│       - Artifact-status Resource
│
└── RESOURCE
      addressable content-bearing object
      │
      ├── may support one or more Artifacts
      │       → Asset role
      │       → Source role when provenance/evidentiary origin is the relationship
      │
      ├── may be granted Artifact status
      │       → eligible for Collection membership
      │       → eligible for persistent Reservoir placement
      │
      └── may remain non-Artifact
              → directly addressable
              → queryable
              → inspectable
              → not persistently placed in Collections

QUERY RESERVOIR
navigation context, not a persistent semantic Object
```

The model is relational rather than a fixed containment hierarchy.

### Foundational rule

> **Addressability is universal. Membership is selective.**

---

# 2. Object

An **Object** is any persistent semantic thing known to the Digital Reservoir.

For the current ontology, persistent Objects are:

```text
Object
├── Collection
└── Resource
```

Artifact is not a third sibling Object type. Artifact is a curatorial status that may be granted to a Resource.

Query Reservoirs, Memberships, support relationships, provenance records, transition plans, layout snapshots, and other implementation/state records are not persistent semantic Objects merely because the implementation stores them.

Every persistent Object must have:

- stable semantic identity;
- its own direct system address;
- enough type information for the system to resolve what should happen when that address is requested.

### Foundational rule

> **Every persistent Object is directly addressable in its own right.**

---

# 3. Direct Addressability

Direct addressability means an Object can be requested by its own stable semantic address without first resolving another Object that contains, supports, references, or points to it.

A supporting Resource is not addressed "through" its Artifact. The Artifact merely provides one discovery path to that Resource's independent address.

A nested Collection is not addressed "through" its parent. Parent membership provides navigational context, not identity.

Conceptually:

```text
stable object address
        ↓
resolve object identity + object kind
        ↓
Collection?
    → activate that Collection Reservoir

Resource?
    → create/resolve direct Query Reservoir
    → surface the Resource
    → inspect with its type-driven inspection surface
```

### 3.1 Collection address resolution

A directly addressed Collection resolves to the Collection itself as the active persistent Reservoir context.

```text
address → Collection → Collection Reservoir
```

A Collection does not need to be wrapped in a Query Reservoir merely to be directly addressed.

### 3.2 Resource address resolution

A directly addressed Resource resolves through direct-query behavior because a Resource is not itself a persistent Reservoir context.

```text
address → Resource → Query Reservoir → Resource surfaced
```

This applies whether or not the Resource currently has Artifact status.

For Artifact-status Resources, preserve the established direct-artifact progressive-disclosure contract: a direct single-result query may auto-select the Artifact on arrival, while opening the inspection surface still requires deliberate confirmation.

For non-Artifact Resources, the direct Query Reservoir should likewise surface the requested Resource without granting it persistent Collection membership.

### 3.3 Semantic address vs public URL

Universal direct addressability is a semantic-system requirement.

During L2, a stable semantic ID/slug or equivalent registry address is sufficient to establish identity and direct queryability.

The final public URL/routing scheme remains part of the public web layer. A later router may map public URLs onto these stable Object addresses without changing Object identity.

Do not make L2 depend on final production routing merely to satisfy direct addressability.

### Foundational rule

> **Relationships create discovery paths; they do not create identity or addressability.**

---

# 4. Collection

A **Collection** is the highest-level curatorial object in the current system model.

A Collection expresses that independently meaningful Objects belong together in a useful persistent view.

A Collection may directly curate only:

- Collections;
- Artifact-status Resources.

Supporting Resources without Artifact status do not receive ordinary persistent Collection membership.

This preserves the distinction between a curated Reservoir and a file browser.

## 4.1 Collection is not composition

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

A Collection emerges only when the independently meaningful child Objects warrant persistent curation as a set.

## 4.2 Collection direct addressability

Every Collection receives its own stable semantic address regardless of whether it is:

- root;
- nested;
- reachable from a menu;
- reachable from a parent node;
- currently visible in another Reservoir.

Its membership path is not its identity.

### Foundational rule

> **Collections curate; they do not merely expose composition.**

---

# 5. Resource

A **Resource** is an addressable content-bearing Object represented by the system.

A Resource may be:

- image;
- photograph;
- document;
- report;
- chart;
- dataset;
- URL;
- webpage;
- repository;
- video;
- audio file;
- code file;
- notebook;
- text excerpt;
- presentation;
- spreadsheet;
- or another materially or semantically useful object.

A Resource does not automatically receive a node in a persistent Collection merely because it exists or is stored.

Every materialized Resource does receive its own stable semantic identity/address.

The system should materialize a Resource only when there is a useful reason to:

- name it independently;
- reference it independently;
- query it independently;
- inspect it independently;
- relate it independently;
- reuse it independently;
- publish it independently;
- or potentially promote it into persistent curation.

### Foundational rules

> **Every materialized Resource is directly addressable.**

> **Addressability does not imply curatorial membership.**

---

# 6. Artifact Status

An **Artifact** is a Resource that has been granted independent curatorial status in the Reservoir.

Artifact status means the Resource is meaningful enough, at the user's current desired granularity, to participate persistently in the organized Reservoir.

An Artifact-status Resource may:

- receive one or more Collection memberships;
- appear persistently as a node in those Collections;
- carry Artifact-oriented metadata;
- participate in relationships;
- be surfaced through queries;
- open the inspection surface appropriate to its Resource kind;
- support other Artifacts as a Resource where relevant.

The underlying Resource is not replaced when Artifact status is granted.

## 6.1 Promotion

A non-Artifact Resource may be promoted to Artifact status whenever persistent Collection membership or independent curation becomes desirable.

Promotion does not require duplicating the Resource or changing its address.

## 6.2 Demotion

An Artifact may be demoted from Artifact status when it no longer warrants persistent Collection placement.

Demotion should remove or disable its Artifact memberships while preserving, where applicable:

- underlying Resource identity;
- stable address;
- supporting relationships;
- source/provenance relationships;
- Query Reservoir reachability;
- inspection behavior;
- metadata required to restore or re-promote it later.

### Foundational rule

> **Artifact is a reversible curatorial status, not an immutable content or file type.**

---

# 7. Supporting Asset Role

An **Asset** is not a required peer entity class beside Resource or Artifact.

"Asset" describes a Resource's role relative to an Artifact it supports.

Examples:

```text
Bellabeat Case Study [Artifact]
    supported by
        Sleep Chart [Resource / Asset role]
        Activity Chart [Resource / Asset role]
        Comprehensive Report [Resource / Asset role]
        Dataset [Resource / Asset role]
```

One Resource may support multiple Artifacts without duplication.

A Resource may simultaneously:

- support another Artifact;
- retain Artifact status itself;
- belong to one or more Collections;
- be reached directly by its own address;
- be surfaced through direct queries.

Therefore Asset and Artifact are not mutually exclusive identities.

### Foundational rule

> **Asset describes subordinate use; Artifact describes curatorial status.**

---

# 8. Source Role

A **Source** is a specialized supporting relationship that expresses provenance, evidentiary origin, or reference context.

The source target is still a Resource.

Examples:

```text
Bellabeat Case Study [Artifact]
    source
        Fitbit Fitness Tracker Dataset [Resource]

Digital Reservoir Case Study [Artifact]
    source
        Interface Specification [Resource]
```

A source Resource:

- has its own stable address if materialized as a Resource;
- does not need Artifact status merely because provenance matters;
- may later be promoted to Artifact status without breaking the source relationship.

Implementation may retain dedicated provenance metadata or source-record structures where technically useful. Those implementation records do not automatically become visible Reservoir Objects or Collection members.

### Foundational rule

> **Source is a supporting role first; provenance implementation records need not become public Objects.**

---

# 9. Membership

Persistent Membership expresses Collection curation.

For the current model:

```text
Collection Membership Target
    = Artifact-status Resource | Collection
```

A Resource without Artifact status should not receive ordinary Collection membership.

If a user wants such a Resource to belong persistently to a Collection, the intended action is:

```text
Resource
    ↓ promote
Artifact-status Resource
    ↓ membership
Collection
```

Demoting an Artifact requires handling its Collection memberships explicitly; the underlying Resource, stable address, support relationships, provenance, and inspection behavior remain available.

### Foundational rule

> **Collection membership is the privilege conferred by Artifact status.**

---

# 10. Curatorial Resolution and Granularity

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

If none apply, further granularity remains internal structure rather than additional Reservoir Objects.

### Foundational rule

> **The semantic floor is user-defined desired granularity, not technical decomposability.**

---

# 11. Query Reservoirs as the Retrieval and Temporary-Surfacing Layer

The approved Query Reservoir architecture provides the mechanism for surfacing addressable Objects that do not themselves define the persistent Collection context requested by the user.

For Resource requests:

```text
Object address or relationship link
        ↓
DIRECT RESOURCE QUERY
        ↓
temporary Query Reservoir
        ↓
requested Resource surfaced
```

Creating this Query Reservoir does **not**:

- grant Artifact status;
- create Collection membership;
- convert the Resource into a persistent Collection node;
- mutate the source Artifact's Collection memberships;
- change the Resource's stable address.

The Query Reservoir remains temporary navigation context.

Back follows the established directional `returnContext` ancestry.

Home returns to the root Digital Reservoir.

## 11.1 Collection requests remain distinct

A directly addressed Collection resolves to that Collection's persistent Reservoir rather than to a Query Reservoir containing the Collection.

This preserves the difference between:

```text
Collection address
→ persistent curated world

Resource address
→ temporary query context
```

## 11.2 Queries do not own identity

The Query Reservoir does not make an Object addressable.

It is the spatial mechanism used to present an Object that was already independently addressable.

### Foundational rules

> **Collections organize. Queries retrieve. Inspection reveals.**

> **Queries temporarily surface what does not need a permanent place.**

---

# 12. Unassigned Resources and Discoverability

Universal Resource addressability creates a future operational case:

```text
Resource exists
Artifact status = false
support relationships = 0
```

Such a Resource is not semantically lost because it retains stable identity and direct addressability, but it may become practically undiscoverable if the user does not possess its address and no search/index exists.

The long-term product should therefore support a system-generated retrieval context such as:

```text
Unassigned Resources
= Resources with no Artifact status
  and no active supporting relationship
```

This should be treated as a query/inbox/review context, not automatically as a persistent Collection. Otherwise the system would defeat the curatorial distinction by forcing every uncurated Resource into a catch-all Collection.

### L2 scope

L2 manual ingestion is intentional enough that Resources should not be created without an approved relationship or explicit reason. Therefore a production Unassigned Resources interface is **not required for the Bellabeat implementation**.

The architecture must simply avoid making such a future query impossible.

### Foundational rule

> **Uncurated does not mean unaddressable; discoverability can be supplied by system queries without inventing Collection membership.**

---

# 13. Inspection System

The earlier phrase **Artifact Window** is now understood as one use of a broader **Inspection Window / Inspection Surface** system.

Curatorial status and inspection behavior are independent concerns:

```text
Artifact status
→ determines Collection-membership eligibility

Resource inspection kind
→ determines how the Object is opened and consumed
```

An image does not become document-like merely because it has Artifact status.

A document does not change renderer merely because it is currently only a supporting Resource.

### Foundational rule

> **Status determines curation; kind determines inspection.**

---

# 14. Stable Inspection Chassis

Inspection surfaces should share one recognizable chassis so different Resource kinds feel like adaptations of one system rather than unrelated modal interfaces.

The common chassis should preserve, where appropriate:

- entrance from below the viewport;
- common close-control location;
- stable title/metadata conventions;
- primary inspection body;
- supporting-resource region;
- common exit behavior;
- responsive translation;
- reduced-motion equivalents;
- restoration of the prior Reservoir context when closed normally.

Conceptually:

```text
┌──────────────────────────────────────────────────────┐
│                                           CLOSE      │
│                                                      │
│     PRIMARY INSPECTION BODY        SUPPORT RAIL      │
│     -----------------------        ------------      │
│                                    ▰ Resource A      │
│                                    ▰ Resource B      │
│                                    ▰ Resource C      │
│                                    ▰ Source D        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The exact proportions may vary by inspection kind and viewport.

---

# 15. Inspection Kinds

A Resource should expose an `inspectionKind` or equivalent semantic renderer contract independent of Artifact status.

The initial renderer families are:

## 15.1 Structured document

Examples:

- case study;
- report;
- essay;
- profile;
- methodology document;
- resume where structured rendering is preferred.

Preferred composition:

- editorial central article/body;
- structure-driven headings and content blocks;
- supporting-resource rail alongside the article on large viewports.

## 15.2 Image / photograph

Preferred composition:

- image is the dominant inspection object;
- metadata/caption remains secondary;
- supporting-resource rail remains available where relevant;
- zoom/pan may be considered later only if useful.

## 15.3 Video

Preferred composition:

- dominant video player;
- concise contextual metadata;
- supporting-resource rail;
- standard accessible media controls.

## 15.4 Audio

Preferred composition:

- playback-focused primary area;
- artwork/waveform only where useful;
- title/context/metadata;
- supporting-resource rail;
- standard accessible media controls.

## 15.5 External link / website / repository

Preferred composition:

- object identity and description;
- destination/domain metadata;
- explicit external-open action;
- optional preview imagery or repository metadata;
- supporting-resource rail.

Do not iframe arbitrary external sites by default.

## 15.6 Dataset / table

Preferred composition:

- dataset identity and context;
- grain/schema/coverage metadata where relevant;
- bounded preview or table where useful;
- provenance and related Resource access;
- supporting-resource rail.

## 15.7 Notebook / code

Preferred composition:

- readable technical preview where feasible;
- language/runtime/source metadata;
- repository/download/open-original actions where useful;
- supporting-resource rail.

Do not force source code into prose-oriented layouts.

## 15.8 Generic file

Safe fallback when no richer renderer exists.

Preferred composition:

- file identity;
- type/size/format metadata where available;
- explicit open/download action where appropriate;
- supporting relationships.

### L2 implementation rule

Pin all renderer contracts conceptually, but implement only the kinds required by the current launch material unless a later task explicitly expands scope.

For Bellabeat, the first implementation should fully exercise:

- structured document;
- image;
- external link/repository;
- generic document/file or notebook treatment as needed.

Do not build polished video/audio/dataset systems merely because their contracts are now defined.

---

# 16. Structured Document Model

Document-like inspection must be generated from document structure rather than from a Bellabeat-specific page template.

The current simplistic `heading + body paragraphs` case-study model should evolve toward reusable structured blocks.

Candidate block semantics include:

```text
heading
paragraph
figure
table
list
quote
callout
code
link
resource-reference
divider
```

A structured document determines its own article hierarchy through the ordered block structure.

This allows:

- Bellabeat case study;
- future essays;
- reports;
- methodology documents;
- profiles;
- resumes;
- research notes;
- other document-like Resources

to share one renderer without sharing one fixed content template.

### Foundational rule

> **The document's structure determines the article; the inspection chassis provides the frame.**

---

# 17. Supporting Resource Rail

An inspected Artifact may expose the Resources that support it through a dedicated supporting-resource region.

Current visual direction:

- stacked compact blocks/cards beneath the close control or in the lower portion of the same side rail;
- visually related to "bubbling bricks" rather than a conventional flat attachment list;
- each block carries enough identity to understand what will be queried;
- Resource kind/icon, short title, and relationship role may be shown where useful;
- the stack must remain secondary to the primary inspection body.

The supporting-resource region may contain:

- images;
- reports;
- charts;
- datasets;
- sources;
- references;
- code;
- notebooks;
- repositories;
- media;
- external URLs;
- any other materialized Resource.

A supporting Resource does not need Artifact status to appear here.

A Resource that does have Artifact status may appear in the same rail without losing its other Collection memberships.

## 17.1 Responsive behavior

On smaller viewports, the side rail may become:

- a bottom stack;
- collapsible section;
- bottom drawer;
- or another touch-appropriate presentation.

The relationship model must remain the same even when the visual placement changes.

### Foundational rule

> **Supporting Resources remain directly reachable without promoting the source Artifact into a Collection.**

---

# 18. Supporting Resource Query Behavior

Selecting a supporting-resource block should issue a direct query for that Resource's own stable address.

Conceptually:

```text
Artifact inspection window
        ↓ select supporting Resource
current window retracts
        ↓
DIRECT RESOURCE QUERY
        ↓
Query Reservoir exchange
        ↓
Resource surfaced
        ↓
deliberate inspection
        ↓
type-driven Inspection Window
```

This behavior should be identical whether the selected Resource:

- is only a supporting Resource; or
- also has Artifact status and memberships elsewhere.

The query does not alter persistent membership.

---

# 19. Inspection Return Context

A supporting-resource query may originate from inside an already-open inspection surface.

For that case, Back should be capable of restoring the meaningful inspection context, not merely the underlying Collection/Query Reservoir.

Desired restoration payload may include:

```text
returnContext
+
inspectionReturnContext:
  inspectedObjectAddress
  inspectionOpen = true
  documentScrollPosition
  relevant local inspection state
```

Expected user experience:

```text
Bellabeat article
→ inspect Figure 03
→ Back
→ Bellabeat article restored near the prior reading position
```

Home remains stronger:

```text
Home
→ root Reservoir
→ no requirement to restore the previous inspection window
```

This extends the approved directional Query Reservoir ancestry model; it must not reintroduce reciprocal query loops or historical geometry hierarchies.

### L2 implementation guidance

Because Bellabeat will expose supporting-resource queries from inside its reading surface, L2 should implement the minimum practical inspection-return behavior needed to avoid making support exploration a dead-end or forcing unnecessary manual reopening.

---

# 20. Inspection Morphing Behavior

Different Resource kinds should not require unrelated modal architectures.

The system should use one inspection chassis that resolves into a type-appropriate internal structure before/deploying as the target Resource's inspection surface.

The preferred interaction is **not** to morph an already-open Bellabeat document directly into an image or repository view while bypassing the Reservoir.

Instead:

```text
inspection surface closes/retracts
→ Query Reservoir exchange communicates object change
→ target Resource is surfaced
→ common chassis deploys in target inspection form
```

This preserves the Reservoir as the navigation layer and the Inspection Window as the consumption layer.

Common motion language should remain stable across inspection kinds, while internal layout changes according to `inspectionKind`.

Reduced-motion mode may replace the full transition with direct state changes / short fades.

### Foundational rule

> **The inspection instrument adapts to the Object; navigation between Objects remains a Reservoir concern.**

---

# 21. Artifact / Resource Relationship Examples

## 21.1 Bellabeat at L2 launch resolution

```text
Work [Collection]
└── Data / Analytics [Collection]
      └── Bellabeat Wellness-Behavior Analysis [Artifact-status Resource]
              supported by
                  Comprehensive Case Study [Resource]
                  Daily Steps Distribution [Image Resource]
                  Activity Intensity Composition [Image Resource]
                  Methodology Appendix [Resource]
                  Identifier Audit [Resource]
                  Analysis Decision Memo [Resource]
                  Final Validation [Resource]
                  Audit Notebook [Resource]
                  GitHub Repository [Resource]
```

Every named Collection and every materialized Resource above has its own direct address.

Bellabeat does not need to be a Collection at this resolution.

If later several supporting Resources earn independent curatorial value, they may be promoted:

```text
Bellabeat Methodology [Artifact-status Resource]
Bellabeat Reproducibility Notebook [Artifact-status Resource]
```

If the grouping then becomes useful as a persistent curated world, a Bellabeat Collection may be created.

The Collection emerges from useful curation, not raw file count.

## 21.2 Resource with dual role

```text
Sleep Analysis Chart [Resource + Artifact status]

supports:
    Bellabeat Case Study
    Wearable Behavior Research

member of:
    Analytics [Collection]
    Research [Collection]
```

The same underlying Resource keeps one stable identity/address while serving supporting and curatorial roles simultaneously.

---

# 22. Implementation Boundaries

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
- bulk migration infrastructure;
- full-text search;
- final production URL architecture;
- polished inspection renderers for Resource kinds not required by launch content.

L2 should use a manual ingestion protocol to test the ontology against real portfolio material.

---

# 23. L2 Manual Ingestion Protocol

For each launch project:

1. gather relevant raw material into an external staging/source location;
2. inventory candidate Resources without assuming their final role;
3. materialize only Resources that deserve independent identity/addressability at the current curatorial resolution;
4. assign every materialized Resource a stable semantic address;
5. identify the primary Resource(s) that warrant Artifact status and persistent Collection membership now;
6. classify other useful Resources by supporting relationship, including Source roles where applicable;
7. identify Resources that are private, redundant, or unnecessary for publication;
8. record possible future Artifact promotion candidates without promoting them merely for density;
9. approve public content and supporting Resources;
10. copy only approved public representations into the website implementation where needed;
11. implement Object identity, inspection kind, Artifact status, relationships, and memberships;
12. validate direct Object-address behavior;
13. validate supporting-resource Query Reservoir behavior and inspection return;
14. verify that no representation variant accidentally creates duplicate Resource identity.

Bellabeat is the first L2 ingestion pilot.

---

# 24. Minimum L2-Enabling Architecture

Bellabeat ingestion has exposed the minimum implementation needed before the Artifact can be populated cleanly.

L2 should implement the smallest practical extension that supports:

1. universal stable semantic addresses for persistent Collections and Resources;
2. a general query-addressable Resource identity broader than the current media-focused Asset record;
3. Artifact status as the Collection-membership eligibility layer for Resources;
4. Resource representations so one logical Resource may have HTML/Markdown or other variants without duplication;
5. Artifact → Resource support relationships with role/order/publication metadata;
6. Source as a specialized supporting/provenance role;
7. direct Resource queries using the approved Query Reservoir transition coordinator;
8. a reusable Inspection Window chassis;
9. structured-document rendering from reusable content blocks;
10. image inspection;
11. external-link/repository inspection;
12. generic document/file/notebook fallback sufficient for Bellabeat's support material;
13. the supporting-resource brick/stack rail;
14. minimum inspection-return context for Back after a resource query issued from an open window;
15. preservation of Home semantics, query ancestry, quaternion/zoom behavior, and all existing Query Reservoir closure rules.

Do not interpret this list as authorization to build search, unassigned-resource inbox UI, automated ingestion, or all future media renderers during Bellabeat.

---

# 25. Codex Rules Derived From This Addendum

When implementing future content or ingestion work, Codex must preserve these boundaries:

- treat `Object = Collection | Resource` as the persistent semantic object model;
- assign every persistent Object stable direct semantic identity/addressability;
- do not make Object identity depend on parent Collection, supporting Artifact, or relationship path;
- do not infer Artifact status from file type;
- do not infer Collection membership merely because a Resource supports an Artifact;
- do not turn every supporting Resource into a node in a persistent Collection;
- do not create Collections merely because an Artifact has many constituent files;
- treat promotion/demotion as changes in curatorial status rather than destructive conversion;
- preserve underlying Resource identity/address during promotion/demotion where practical;
- allow one Resource to support multiple Artifacts without duplication;
- treat Source as a supporting/provenance role, not an automatic persistent public entity class;
- use Query Reservoir semantics when a direct Resource request needs temporary spatial presentation;
- direct Collection addresses resolve to Collection Reservoirs rather than unnecessary Query Reservoir wrappers;
- preserve `returnContext`, Back, Home, and the approved Query Reservoir closure contract;
- support inspection-return context for resource queries launched from an open inspection surface where required by the active task;
- choose inspection renderer by Resource inspection kind, not Artifact status;
- preserve one common Inspection Window chassis rather than creating unrelated modal systems;
- render structured documents from document structure rather than one hard-coded case-study layout;
- keep supporting-resource UI secondary to the primary inspected content;
- do not implement production ingestion infrastructure unless explicitly authorized.

---

# 26. Canonical Rules

> **Every persistent Object is directly addressable.**

> **Collections and Resources are the persistent Object types.**

> **Collections curate.**

> **Artifacts are Resources granted persistent curatorial status.**

> **Only Artifact-status Resources and Collections receive ordinary persistent Collection membership.**

> **Resources may support Artifacts without becoming Artifacts.**

> **Asset and Source describe contextual roles/relationships, not mandatory permanent public entity classes.**

> **Artifact promotion and demotion preserve Resource identity and addressability.**

> **Relationships create discovery paths; they do not create identity.**

> **Direct Collection addresses resolve to persistent Collection Reservoirs.**

> **Direct Resource addresses resolve through temporary Query Reservoirs without granting membership.**

> **Queries retrieve; Collections organize; Inspection reveals.**

> **Queries temporarily surface what does not need a permanent place.**

> **Inspection kind determines presentation; Artifact status determines curation.**

> **The document's structure determines its article; the inspection chassis provides the frame.**

> **Collections express curation, not arbitrary decomposition.**

> **The user determines useful granularity; technical decomposability does not define the semantic floor.**

---

# 27. Relationship to Existing Interface Rules

This ontology preserves the established interaction rule:

> **Collections change the world. Artifacts open windows.**

It clarifies that the deeper implementation rule is:

> **Collections change the persistent world. Resources are inspected through type-appropriate windows. Artifact status determines which Resources may participate persistently in Collections.**

It also preserves the Query Reservoir extension:

> **Queries temporarily surface what does not need a permanent place.**

Together:

```text
OBJECT
stable directly addressable semantic identity

COLLECTION
persistent curated world

RESOURCE
addressable inspectable content object

ARTIFACT STATUS
permission for Resource to participate persistently in Collections

QUERY RESERVOIR
temporary spatial retrieval context

INSPECTION WINDOW
common chassis adapting to Resource kind
```

This structure is the approved conceptual basis for L2 Bellabeat ingestion, subsequent manual portfolio ingestion, and future ingestion-system design.
