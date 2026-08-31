# Digital Reservoir Prototype Interface Contracts

**Status:** Phase 0 proposal — contract baseline for later implementation  
**Version:** 0.1  
**Date:** 2026-08-31  
**Implementation authorization:** None

## 1. Purpose

These contracts define the boundaries that must be stable before parallel implementation begins.

They are conceptual TypeScript-like contracts. Exact syntax, database columns, and transport encoding may change during the implementation scaffold, but semantic meaning and invariants require explicit approval to change.

All externally exchanged contracts must carry a schema version.

```ts
type ContractVersion = "0.1";
type ObjectId = string;
type WorkspaceId = string;
type VersionId = string;
type RepresentationId = string;
type RelationshipId = string;
type AssertionId = string;
type PolicyId = string;
type PrincipalId = string;
type ContextId = string;
type Cursor = string;
type ISODateTime = string;
```

## 2. Canonical Object contract

```ts
type ObjectKind = "resource" | "collection";

type ObjectAddress = {
  canonical: string;        // stable system address
  aliases: readonly string[];
};

type ObjectLifecycle =
  | "active"
  | "archived"
  | "deleted-pending"
  | "deleted";

type SemanticObjectBase = {
  contractVersion: ContractVersion;
  id: ObjectId;
  workspaceId: WorkspaceId;
  kind: ObjectKind;
  address: ObjectAddress;
  title: string;
  description?: string;
  lifecycle: ObjectLifecycle;
  policyId: PolicyId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  revision: number;
};
```

### Invariants

- `id` and `canonical` address are stable for the life of the Object.
- Slug or route aliases may change without changing identity.
- Collection path is never part of identity.
- Storage location is never part of identity.
- Every read response is scoped to an authenticated server-resolved principal and policy decision.
- A deleted Object address must not be silently reassigned.

## 3. Resource Envelope

```ts
type ArtifactState = {
  status: "artifact" | "resource";
  changedAt: ISODateTime;
  changedBy: PrincipalId;
};

type ResourceType =
  | "document"
  | "image"
  | "dataset"
  | "text"
  | "external-link"
  | "code"
  | "audio"
  | "video"
  | "generic";

type InspectionKind =
  | "structured-document"
  | "image"
  | "dataset-table"
  | "external-link"
  | "notebook-code"
  | "audio"
  | "video"
  | "generic-file"
  | "unavailable";

type ResourceEnvelope = SemanticObjectBase & {
  kind: "resource";
  resourceType: ResourceType;
  inspectionKind: InspectionKind;
  artifact: ArtifactState;
  currentVersionId: VersionId;
  versionIds: readonly VersionId[];
  representationIds: readonly RepresentationId[];
  sourceRefs: readonly SourceReference[];
  processing: ResourceProcessingSummary;
};
```

### Invariants

- Artifact promotion or demotion modifies `artifact` but not Resource identity.
- `inspectionKind` may change as accepted knowledge improves, but the change is audited.
- Internal segments do not become Resources automatically.
- A representation is not a second Resource unless a user explicitly materializes it at a desired curatorial resolution.

## 4. Version and storage contracts

```ts
type StorageCustody =
  | {
      mode: "managed";
      provider: "s3-compatible";
      objectKey: string;
    }
  | {
      mode: "federated";
      adapter: string;
      locator: string;
      authorizationRef: string;
    }
  | {
      mode: "remote-reference";
      reservoirId: string;
      remoteAddress: string;
    };

type ResourceVersion = {
  contractVersion: ContractVersion;
  id: VersionId;
  resourceId: ObjectId;
  ordinal: number;
  custody: StorageCustody;
  filename?: string;
  declaredMimeType?: string;
  detectedMimeType?: string;
  sizeBytes?: number;
  contentHash?: string;
  createdAt: ISODateTime;
  createdBy: PrincipalId;
  availability: "available" | "processing" | "unavailable" | "revoked";
  supersedesVersionId?: VersionId;
};

type RepresentationKind =
  | "original"
  | "extracted-text"
  | "structured-document"
  | "thumbnail"
  | "preview"
  | "table-preview"
  | "embedding-set"
  | "external-locator";

type ResourceRepresentation = {
  contractVersion: ContractVersion;
  id: RepresentationId;
  resourceId: ObjectId;
  versionId: VersionId;
  kind: RepresentationKind;
  mediaType?: string;
  locator: string;
  derivedFromRepresentationIds: readonly RepresentationId[];
  policyId: PolicyId;
  generation?: {
    mechanism: "deterministic" | "model" | "user";
    name: string;
    version?: string;
    generatedAt: ISODateTime;
  };
  status: "ready" | "processing" | "failed" | "revoked";
};
```

### Invariants

- Versions are immutable.
- A new source state creates a new Version.
- Derived representations identify their source Version.
- Derived representations inherit source restrictions unless a stricter policy is assigned or an authorized review explicitly approves a broader release.
- Revoked or unavailable federated content must resolve explicitly.

## 5. Source and provenance

```ts
type SourceReference =
  | {
      kind: "upload";
      uploadedBy: PrincipalId;
      uploadedAt: ISODateTime;
    }
  | {
      kind: "connector";
      adapter: string;
      externalId: string;
      observedAt: ISODateTime;
    }
  | {
      kind: "import";
      sourceAddress: string;
      importedAt: ISODateTime;
    }
  | {
      kind: "fork";
      sourceAddress: string;
      forkedAt: ISODateTime;
    }
  | {
      kind: "generated";
      mechanism: string;
      generatedAt: ISODateTime;
    };
```

### Invariants

- Provenance is not erased when custody changes.
- Import and fork remain distinguishable.
- A remote reference retains origin ownership truth.
- Provenance records are not automatically visible semantic Objects.

## 6. Assertions

```ts
type AssertionSource =
  | { kind: "user"; principalId: PrincipalId }
  | { kind: "system-rule"; ruleId: string; version: string }
  | { kind: "model"; provider: string; model: string; promptVersion: string }
  | { kind: "remote"; reservoirId: string; remoteAssertionId: string };

type AssertionStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "superseded"
  | "expired";

type AssertionTarget =
  | { kind: "object"; objectId: ObjectId; field: string }
  | { kind: "relationship"; relationshipId: RelationshipId }
  | { kind: "membership-proposal"; collectionId: ObjectId; objectId: ObjectId }
  | { kind: "artifact-proposal"; resourceId: ObjectId };

type GeneratedAssertion<T = unknown> = {
  contractVersion: ContractVersion;
  id: AssertionId;
  workspaceId: WorkspaceId;
  target: AssertionTarget;
  value: T;
  source: AssertionSource;
  confidence?: number;
  evidence: readonly EvidenceReference[];
  status: AssertionStatus;
  policyId: PolicyId;
  createdAt: ISODateTime;
  reviewedAt?: ISODateTime;
  reviewedBy?: PrincipalId;
  supersedesAssertionId?: AssertionId;
};

type EvidenceReference = {
  resourceId: ObjectId;
  versionId: VersionId;
  representationId?: RepresentationId;
  segmentId?: string;
  locator?: string;
};
```

### Invariants

- Model output is `proposed` unless an approved rule explicitly accepts it.
- Confidence without evidence is insufficient for a relationship used as fact.
- Rejection does not delete provenance.
- Superseding creates history rather than rewriting the past.
- UI and agents must be able to distinguish accepted from proposed knowledge.

## 7. Relationships and memberships

```ts
type RelationshipFamily =
  | "semantic"
  | "provenance"
  | "structural"
  | "operational"
  | "federated";

type RelationshipType =
  | "related-to"
  | "about"
  | "supports"
  | "contradicts"
  | "derived-from"
  | "source-of"
  | "contains"
  | "materially-part-of"
  | "depends-on"
  | "supersedes"
  | "references-remote"
  | "imported-from"
  | "forked-from";

type ObjectRelationship = {
  contractVersion: ContractVersion;
  id: RelationshipId;
  workspaceId: WorkspaceId;
  sourceObjectId: ObjectId;
  targetObjectId?: ObjectId;
  remoteTarget?: RemoteObjectAddress;
  family: RelationshipFamily;
  type: RelationshipType;
  label?: string;
  role?: string;
  directionality: "directed" | "symmetric";
  assertionId?: AssertionId;
  status: "proposed" | "accepted" | "rejected" | "superseded";
  policyId: PolicyId;
  createdAt: ISODateTime;
  createdBy: PrincipalId;
};

type CollectionMembership = {
  contractVersion: ContractVersion;
  id: string;
  collectionId: ObjectId;
  member:
    | { kind: "collection"; objectId: ObjectId }
    | { kind: "resource"; objectId: ObjectId };
  order?: number;
  policyId: PolicyId;
  createdAt: ISODateTime;
  createdBy: PrincipalId;
};
```

### Invariants

- A Resource must have Artifact status before ordinary persistent Collection membership is accepted.
- Relationship existence never defines identity.
- A generic relationship does not imply membership.
- A membership does not imply that all representations are downloadable.
- Policy may suppress an edge even when both endpoint Objects are readable.
- The Relational Projection must not display proposed and accepted relationships as equivalent.

## 8. Collection contract

```ts
type Collection = SemanticObjectBase & {
  kind: "collection";
  collectionMode: "curated" | "smart";
  membershipCount: number;
  smartRule?: QueryDefinition;
};
```

### Invariants

- Curated Collection membership is explicit.
- A Smart Collection, when implemented, persists an approved rule; it is not the same as an ephemeral Query context.
- Collection recursion must detect and reject invalid containment cycles according to the approved membership policy.
- A Collection address resolves to a persistent Collection context.

## 9. Policy and principal contracts

```ts
type Principal =
  | { kind: "user"; id: PrincipalId; workspaceId: WorkspaceId }
  | { kind: "group"; id: PrincipalId; workspaceId: WorkspaceId }
  | { kind: "service"; id: PrincipalId; workspaceId: WorkspaceId }
  | { kind: "agent"; id: PrincipalId; workspaceId: WorkspaceId }
  | { kind: "public"; id: "public" };

type Action =
  | "discover"
  | "read-metadata"
  | "read-preview"
  | "read-derived"
  | "download-original"
  | "traverse-relationship"
  | "inspect-provenance"
  | "propose"
  | "curate"
  | "publish"
  | "administer"
  | "agent-read"
  | "agent-write";

type AccessDecision = {
  allowed: boolean;
  decisionId: string;
  evaluatedAt: ISODateTime;
  policyRevision: number;
  reasonCode: string;
  obligations?: readonly string[];
};

type AgentGrant = {
  id: string;
  agentPrincipalId: PrincipalId;
  delegatedBy: PrincipalId;
  workspaceId: WorkspaceId;
  actions: readonly Action[];
  objectScope:
    | { kind: "workspace" }
    | { kind: "collections"; collectionIds: readonly ObjectId[] }
    | { kind: "objects"; objectIds: readonly ObjectId[] };
  expiresAt?: ISODateTime;
  requireReviewForWrites: boolean;
};
```

### Invariants

- A graphical client never receives denied Objects for later hiding.
- A summary, embedding, preview, or relationship may not reveal information denied at the source.
- Agent identity and delegated grant are both required.
- Public access is a principal/policy decision, not a separate copy of the Resource.
- A cached decision is invalidated by relevant policy revision.

## 10. Ingestion contracts

```ts
type IngestionStage =
  | "registered"
  | "security-check"
  | "type-detection"
  | "extraction"
  | "segmentation"
  | "representation"
  | "enrichment"
  | "proposal"
  | "review-ready"
  | "completed"
  | "failed";

type StageStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

type IngestionStageRecord = {
  stage: IngestionStage;
  status: StageStatus;
  attempt: number;
  startedAt?: ISODateTime;
  completedAt?: ISODateTime;
  errorCode?: string;
  retryable?: boolean;
};

type IngestionJob = {
  contractVersion: ContractVersion;
  id: string;
  workspaceId: WorkspaceId;
  resourceId: ObjectId;
  versionId: VersionId;
  requestedBy: PrincipalId;
  stages: readonly IngestionStageRecord[];
  correlationId: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

type ResourceProcessingSummary = {
  state: "registered" | "processing" | "review-ready" | "complete" | "failed";
  currentStage?: IngestionStage;
  completedStages: readonly IngestionStage[];
  retryableFailure?: {
    code: string;
    stage: IngestionStage;
  };
};
```

### Invariants

- Stages are idempotent for the same Resource Version and compiler version.
- Retrying a stage does not duplicate semantic Objects or accepted assertions.
- Registration succeeds independently of enrichment completion.
- Unsupported types produce an explicit generic state rather than fabricated structure.
- Failure of enrichment does not destroy the original Resource or direct address.

## 11. Query and context contracts

```ts
type QueryDefinition = {
  text?: string;
  objectKinds?: readonly ObjectKind[];
  resourceTypes?: readonly ResourceType[];
  collectionIds?: readonly ObjectId[];
  relationshipConstraints?: readonly {
    type: RelationshipType;
    direction: "incoming" | "outgoing" | "either";
    objectId?: ObjectId;
  }[];
  dateRange?: { from?: ISODateTime; to?: ISODateTime };
  sort?: readonly { field: string; direction: "asc" | "desc" }[];
};

type ContextDescriptor =
  | {
      kind: "collection";
      id: ContextId;
      collectionId: ObjectId;
    }
  | {
      kind: "query";
      id: ContextId;
      query: QueryDefinition;
      label?: string;
      returnContextId?: ContextId;
    }
  | {
      kind: "remote";
      id: ContextId;
      reservoirId: string;
      remoteContextAddress: string;
      returnContextId?: ContextId;
    };

type ContextRequest = {
  contractVersion: ContractVersion;
  descriptor: ContextDescriptor;
  principal: Principal;
  agentGrantId?: string;
  filters?: QueryDefinition;
  cursor?: Cursor;
  resolution: {
    requestedDepth: number;
    maximumObjects: number;
    maximumRelationships: number;
  };
  projectionCapabilities?: {
    spatial: boolean;
    index: boolean;
    relational: boolean;
  };
};

type ContextObjectSummary = {
  id: ObjectId;
  kind: ObjectKind;
  address: string;
  title: string;
  description?: string;
  resourceType?: ResourceType;
  inspectionKind?: InspectionKind;
  artifactStatus?: "artifact" | "resource";
  aggregate?: {
    memberCount: number;
    expansionToken: string;
    label: string;
  };
  revision: number;
};

type ContextRelationshipSummary = {
  id: RelationshipId;
  sourceObjectId: ObjectId;
  targetObjectId?: ObjectId;
  remoteTarget?: RemoteObjectAddress;
  family: RelationshipFamily;
  type: RelationshipType;
  label?: string;
  status: "proposed" | "accepted";
  confidence?: number;
};

type ContextManifest = {
  contractVersion: ContractVersion;
  id: ContextId;
  revision: number;
  descriptor: ContextDescriptor;
  label: string;
  generatedAt: ISODateTime;
  policyDecisionIds: readonly string[];
  objects: readonly ContextObjectSummary[];
  relationships: readonly ContextRelationshipSummary[];
  totalPermittedObjectCount: number;
  nextCursor?: Cursor;
  aggregateCount: number;
  selectionValidity: {
    selectedObjectId?: ObjectId;
    selectedObjectPresent: boolean;
    focusedObjectId?: ObjectId;
    focusedObjectPresent: boolean;
  };
  projectionHints: {
    stableLayoutKey: string;
    suggestedAnchorObjectId?: ObjectId;
    spatialBudget: number;
    relationalBudget: number;
    indexVirtualizationRecommended: boolean;
  };
};
```

### Invariants

- One Manifest revision is the shared semantic input for all three projections.
- Counts reflect only permitted Objects.
- A client may request more resolution but may not bypass service budgets.
- Query context is not persisted as a Collection merely because it is revisited.
- A direct Resource address resolves to a single-result Query context.
- A direct Collection address resolves to a Collection context.
- Manifests never include original storage credentials.

## 12. Projection Sphere contracts

```ts
type ProjectionKind = "spatial" | "index" | "relational";

type ProjectionSphereState = {
  activeProjection: ProjectionKind;
  horizontalOrder: readonly ["spatial", "index", "relational"];
  transition:
    | { phase: "idle" }
    | {
        phase: "rotating";
        from: ProjectionKind;
        to: ProjectionKind;
        progress: number;
        direction: "left" | "right";
      };
  verticalAxis: {
    status: "reserved";
  };
};

type AttentionState = {
  focusedObjectId?: ObjectId;
  selectedObjectId?: ObjectId;
  inspectionObjectId?: ObjectId;
};

type NavigationIntent =
  | { kind: "enter-collection"; collectionId: ObjectId }
  | { kind: "query-resource"; resourceId: ObjectId }
  | { kind: "run-query"; query: QueryDefinition; label?: string }
  | { kind: "open-remote-context"; address: RemoteObjectAddress }
  | { kind: "back" }
  | { kind: "home" }
  | { kind: "visit-history"; visitId: string };

type AttentionIntent =
  | { kind: "focus"; objectId?: ObjectId }
  | { kind: "select"; objectId?: ObjectId }
  | { kind: "inspect"; resourceId: ObjectId }
  | { kind: "relational-recenter"; objectId: ObjectId };

type ProjectionAdapter<ViewState> = {
  kind: ProjectionKind;
  canRender(manifest: ContextManifest): boolean;
  deriveViewState(
    manifest: ContextManifest,
    attention: AttentionState,
    previous?: ViewState,
  ): ViewState;
  handleAttention(intent: AttentionIntent): void;
  handleNavigation(intent: NavigationIntent): void;
  suspend(): void;
  resume(): void;
};
```

### Projection invariants

- Horizontal projection rotation never emits `NavigationIntent`.
- Projection rotation never changes `ContextManifest.id` or revision.
- Each projection receives the same policy-filtered Manifest.
- Projection-specific ordering or aggregation must remain traceable to canonical Object IDs.
- Selection and focus are shared attention state, not copied into three independent stores.
- Projection-local view state is separate:
  - Spatial: quaternion, zoom, layout resolution;
  - Index: scroll, sort presentation, column state;
  - Relational: local center, expanded bundles, graph zoom.
- Relational recenter emits `AttentionIntent`, not `NavigationIntent`.
- Explicit entry into a Collection, direct Resource query, or remote context emits `NavigationIntent`.
- The vertical axis remains reserved and must not trigger hidden behavior.
- Reduced-motion changes transition presentation, not semantics.
- Index remains usable if WebGL is unavailable.

## 13. Spatial Projection view contract

```ts
type SpatialViewState = {
  contextId: ContextId;
  manifestRevision: number;
  layoutKey: string;
  orientation: readonly [number, number, number, number];
  zoom: number;
  nodes: readonly {
    objectId: ObjectId;
    direction: readonly [number, number, number];
    displayKind: "resource" | "collection" | "aggregate";
    sizeFamily: string;
  }[];
  requestedResolutionDepth: number;
};
```

### Invariants

- Layout is deterministic for the same context, Object population, layout version, and seed.
- Node position is independent of render-mesh vertices.
- Aggregate nodes are presentation constructs, not persistent semantic Objects.
- Negative space may encode separation and hierarchy but not undisclosed Object existence.
- Zoom may request greater semantic resolution; it may not invent membership.

## 14. Index Projection view contract

```ts
type IndexViewState = {
  contextId: ContextId;
  manifestRevision: number;
  mode: "list" | "grid" | "table";
  cursor?: Cursor;
  virtualWindow: { start: number; end: number };
  selectedObjectId?: ObjectId;
};
```

### Invariants

- The Index is a conventional projection of the active permitted context.
- It does not maintain a shadow registry.
- Sorting and filtering either affect presentation locally or update the shared Context Request explicitly; the distinction must be visible in code.
- Every important action is keyboard and assistive-technology operable.
- Index access does not require WebGL.

## 15. Relational Projection view contract

```ts
type RelationshipBundle = {
  id: string;
  anchorObjectId: ObjectId;
  family?: RelationshipFamily;
  type?: RelationshipType;
  direction: "incoming" | "outgoing" | "mixed";
  memberCount: number;
  expansionToken: string;
};

type RelationalViewState = {
  contextId: ContextId;
  manifestRevision: number;
  anchorObjectId?: ObjectId;
  visibleObjectIds: readonly ObjectId[];
  visibleRelationshipIds: readonly RelationshipId[];
  bundles: readonly RelationshipBundle[];
  expandedBundleIds: readonly string[];
};
```

### Invariants

- The default anchor is the selected Object when valid, otherwise the Context anchor.
- Proposed, accepted, remote, and provenance relationships remain visually distinguishable.
- Direction and relationship type are not inferred solely from line placement.
- Large neighborhoods aggregate before rendering.
- A relationship edge cannot expose a denied endpoint.
- Local anchor changes are reversible attention operations.

## 16. Inspection contract

```ts
type InspectionRequest = {
  resourceId: ObjectId;
  versionId?: VersionId;
  returnVisitId: string;
  initialReadingState?: {
    locator?: string;
    scrollY?: number;
    progress?: number;
  };
};

type InspectionModel = {
  resource: ResourceEnvelope;
  version: ResourceVersion;
  permittedRepresentations: readonly ResourceRepresentation[];
  acceptedRelationships: readonly ContextRelationshipSummary[];
  reviewableAssertions: readonly GeneratedAssertion[];
  collectionMemberships: readonly CollectionMembership[];
  capabilities: readonly Action[];
};
```

### Invariants

- Inspection renderer is chosen by `inspectionKind`.
- Artifact status does not choose the renderer.
- Inspection uses the same Resource identity presented in all projections.
- Ordinary close restores the prior visit and attention state.
- Navigation from Inspection uses the shared navigation coordinator.
- Unsupported or unavailable content resolves explicitly.

## 17. Agent Context Package

```ts
type AgentContextPackage = {
  contractVersion: ContractVersion;
  packageId: string;
  workspaceId: WorkspaceId;
  principalId: PrincipalId;
  grantId: string;
  context: ContextDescriptor;
  generatedAt: ISODateTime;
  expiresAt: ISODateTime;
  objects: readonly ContextObjectSummary[];
  relationships: readonly ContextRelationshipSummary[];
  excerpts: readonly {
    resourceId: ObjectId;
    versionId: VersionId;
    representationId: RepresentationId;
    text: string;
    evidence: EvidenceReference;
  }[];
  provenance: readonly SourceReference[];
  continuationCursor?: Cursor;
  auditEventId: string;
};
```

### Invariants

- Packages are bounded by object, relationship, byte, and token budgets.
- Every excerpt carries evidence.
- Package expiration does not delete source Objects.
- Agent caches must respect revision, expiry, and revocation.
- An agent package may contain less information than a human UI for the same user when the grant is narrower.

## 18. Federation contracts

```ts
type RemoteObjectAddress = {
  reservoirId: string;
  canonicalAddress: string;
};

type RemoteReference = {
  localReferenceId: string;
  localWorkspaceId: WorkspaceId;
  remote: RemoteObjectAddress;
  originRevision?: string;
  relationship: "references" | "mounts";
  accessState: "active" | "stale" | "revoked" | "unavailable";
  cachedMetadata?: {
    title: string;
    kind: ObjectKind;
    observedAt: ISODateTime;
  };
};

type ImportResult = {
  localObjectId: ObjectId;
  source: RemoteObjectAddress;
  mode: "import" | "fork";
  importedRevision?: string;
  lineageRelationshipId: RelationshipId;
};
```

### Invariants

- Reference and mount do not imply local ownership.
- Import and fork create local identity and preserve lineage.
- Remote revocation removes live access without falsifying historical audit records.
- Cached metadata is labeled stale when origin verification fails.
- Federation never exposes more than both origin policy and local policy permit.

## 19. Contract change control

Before parallel implementation, the contracts package must:

- expose machine-readable schemas;
- include contract tests;
- version breaking changes;
- document migration behavior;
- be owned by the lead architecture workstream.

No workstream may locally redefine `ResourceEnvelope`, `ContextManifest`, policy decisions, or Projection Sphere semantics. A proposed breaking change must include:

1. the conflicting requirement;
2. affected workstreams;
3. migration impact;
4. recommended resolution;
5. user escalation when product meaning changes.
