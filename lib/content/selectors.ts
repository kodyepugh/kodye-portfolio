import { contentRegistry } from "./registry";
import {
  getArtifactContentAssetIds,
  getResourceRepresentationAssetIds,
} from "./references";
import type {
  Artifact,
  ContentRegistry,
  Collection,
  CollectionMembership,
  ResourceInspectionKind,
  Resource,
  ResourceMembership,
  ResourceSupportRelationship,
  ResourceType,
} from "../../types/content";

const resourceById = new Map(
  contentRegistry.resources.map((resource) => [resource.id, resource] as const),
);
const resourceBySlug = new Map(
  contentRegistry.resources.map(
    (resource) => [resource.slug, resource] as const,
  ),
);
const artifactById = new Map(
  contentRegistry.resources
    .filter((resource): resource is Artifact => resource.isArtifact === true)
    .map((resource) => [resource.id, resource] as const),
);
const artifactBySlug = new Map(
  contentRegistry.resources
    .filter((resource): resource is Artifact => resource.isArtifact === true)
    .map((resource) => [resource.slug, resource] as const),
);
const collectionById = new Map(
  contentRegistry.collections.map(
    (collection) => [collection.id, collection] as const,
  ),
);
const collectionBySlug = new Map(
  contentRegistry.collections.map(
    (collection) => [collection.slug, collection] as const,
  ),
);
const assetById = new Map(
  contentRegistry.assets.map((asset) => [asset.id, asset] as const),
);

export type PublishedSupportingResource = {
  relationshipId: string;
  targetResourceId: string;
  targetResourceTitle: string;
  targetResourceType: ResourceType;
  targetResourceInspectionKind: ResourceInspectionKind;
  relationshipType: ResourceSupportRelationship["relationshipType"];
  role?: string;
  label?: string;
  order?: number;
  relationship: ResourceSupportRelationship;
  resource: Resource;
};

export type PublishedResourceContext = {
  relationshipId: string;
  resourceId: string;
  direction: "incoming" | "outgoing";
  relationshipType: ResourceSupportRelationship["relationshipType"];
  role?: string;
  label?: string;
  order?: number;
  relationship: ResourceSupportRelationship;
  resource: Resource;
};

export type ResolvedCollectionMember =
  | {
      kind: "artifact";
      membership: ResourceMembership;
      artifact: Artifact;
    }
  | {
      kind: "collection";
      membership: CollectionMembership;
      collection: Collection;
    };

export type ResolvedSemanticObject =
  | {
      kind: "collection";
      collection: Collection;
    }
  | {
      kind: "resource";
      resource: Resource;
    };

function compareMembershipOrder(
  a: { order?: number; id: string },
  b: { order?: number; id: string },
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
}

function compareSupportOrder(
  a: { order?: number; relationshipId: string },
  b: { order?: number; relationshipId: string },
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.relationshipId.localeCompare(b.relationshipId)
  );
}

function compareResourceContextOrder(
  a: Pick<PublishedResourceContext, "order" | "relationshipId" | "direction">,
  b: Pick<PublishedResourceContext, "order" | "relationshipId" | "direction">,
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.relationshipId.localeCompare(b.relationshipId) ||
    a.direction.localeCompare(b.direction)
  );
}

function resolveResource(resource: Resource | null) {
  return resource ?? null;
}

export function getResourceById(resourceId: string) {
  return resolveResource(resourceById.get(resourceId) ?? null);
}

export function getResourceBySlug(slug: string) {
  return resolveResource(resourceBySlug.get(slug) ?? null);
}

export function getResourceByAddress(address: string) {
  return getResourceById(address) ?? getResourceBySlug(address);
}

export function getArtifactById(artifactId: string) {
  return artifactById.get(artifactId) ?? null;
}

export function getArtifactBySlug(slug: string) {
  return artifactBySlug.get(slug) ?? null;
}

export function getCollectionById(collectionId: string) {
  return collectionById.get(collectionId) ?? null;
}

export function getCollectionBySlug(slug: string) {
  return collectionBySlug.get(slug) ?? null;
}

export function getCollectionByAddress(address: string) {
  return getCollectionById(address) ?? getCollectionBySlug(address);
}

export function resolveSemanticObjectAddress(
  address: string,
): ResolvedSemanticObject | null {
  const collection = getCollectionByAddress(address);
  if (collection) {
    return { kind: "collection", collection };
  }

  const resource = getResourceByAddress(address);
  if (resource) {
    return { kind: "resource", resource };
  }

  return null;
}

export function getSemanticObjectByAddress(address: string) {
  return resolveSemanticObjectAddress(address);
}

export function getArtifactStatusResources() {
  return contentRegistry.resources.filter(
    (resource): resource is Artifact => resource.isArtifact === true,
  );
}

export function getResourceStatusResources() {
  return getArtifactStatusResources();
}

export function getAssetById(assetId: string) {
  return assetById.get(assetId) ?? null;
}

export function getCollectionMemberships(collectionId: string) {
  return contentRegistry.memberships
    .filter((membership) => membership.collectionId === collectionId)
    .slice()
    .sort(compareMembershipOrder);
}

export function getCollectionMembers(
  collectionId: string,
): ResolvedCollectionMember[] {
  const members: ResolvedCollectionMember[] = [];

  for (const membership of getCollectionMemberships(collectionId)) {
    if (membership.memberType === "collection") {
      const collection = getCollectionById(membership.memberId);
      if (collection) {
        members.push({ kind: "collection", membership, collection });
      }
      continue;
    }

    const artifact = getArtifactById(membership.memberId);
    if (artifact) members.push({ kind: "artifact", membership, artifact });
  }

  return members;
}

export function getPublishedCollectionMembers(collectionId: string) {
  return getCollectionMembers(collectionId).filter((member) =>
    member.kind === "artifact"
      ? member.artifact.published === true
      : member.collection.published === true,
  );
}

export function getResourceCollections(resourceId: string) {
  return contentRegistry.memberships.flatMap((membership) => {
    if (membership.memberType !== "resource") return [];
    if (membership.memberId !== resourceId) {
      return [];
    }

    const collection = getCollectionById(membership.collectionId);
    return collection ? [collection] : [];
  });
}

export function getArtifactCollections(artifactId: string) {
  return getResourceCollections(artifactId);
}

export function getPublishedResourceCollections(resourceId: string) {
  return getResourceCollections(resourceId).filter(
    (collection) => collection.published === true,
  );
}

export function getPublishedArtifactCollections(artifactId: string) {
  return getPublishedResourceCollections(artifactId);
}

export function getResourceRepresentations(resourceId: string) {
  return getResourceById(resourceId)?.representations ?? [];
}

export function getResourceSupportRelationships(resourceId: string) {
  return contentRegistry.resourceSupportRelations
    .filter((relationship) => relationship.sourceResourceId === resourceId)
    .slice()
    .sort(compareMembershipOrder);
}

export function getPublishedSupportingResourcesFromRegistry(
  registry: Pick<ContentRegistry, "resources" | "resourceSupportRelations">,
  resourceId: string,
) {
  const resourceById = new Map(
    registry.resources.map((resource) => [resource.id, resource] as const),
  );

  return registry.resourceSupportRelations
    .filter((relationship) => relationship.sourceResourceId === resourceId)
    .filter((relationship) => relationship.published !== false)
    .flatMap((relationship) => {
      const source = resourceById.get(relationship.sourceResourceId);
      const resource = resourceById.get(relationship.targetResourceId);
      if (!source || source.published !== true || !resource || resource.published !== true) {
        return [];
      }

      return [
        {
          relationshipId: relationship.id,
          targetResourceId: resource.id,
          targetResourceTitle: resource.title,
          targetResourceType: resource.type,
          targetResourceInspectionKind: resource.inspectionKind,
          relationshipType: relationship.relationshipType,
          role: relationship.role,
          label: relationship.label,
          order: relationship.order,
          relationship,
          resource,
        },
      ];
    })
    .sort(compareSupportOrder);
}

export function getPublishedSupportingResources(resourceId: string) {
  return getPublishedSupportingResourcesFromRegistry(
    contentRegistry,
    resourceId,
  );
}

export function getPublishedResourcesSupportedByFromRegistry(
  registry: Pick<ContentRegistry, "resources" | "resourceSupportRelations">,
  resourceId: string,
) {
  const resourceById = new Map(
    registry.resources.map((resource) => [resource.id, resource] as const),
  );

  return registry.resourceSupportRelations
    .filter((relationship) => relationship.targetResourceId === resourceId)
    .filter((relationship) => relationship.published !== false)
    .flatMap((relationship) => {
      const source = resourceById.get(relationship.sourceResourceId);
      const target = resourceById.get(relationship.targetResourceId);
      if (
        !source ||
        source.published !== true ||
        !target ||
        target.published !== true
      ) {
        return [];
      }

      return [
        {
          relationshipId: relationship.id,
          sourceResourceId: source.id,
          sourceResourceTitle: source.title,
          sourceResourceType: source.type,
          sourceResourceInspectionKind: source.inspectionKind,
          relationshipType: relationship.relationshipType,
          role: relationship.role,
          label: relationship.label,
          order: relationship.order,
          relationship,
          resource: source,
        },
      ];
    })
    .sort(compareSupportOrder);
}

export function getPublishedResourceContextFromRegistry(
  registry: Pick<ContentRegistry, "resources" | "resourceSupportRelations">,
  resourceId: string,
): PublishedResourceContext[] {
  const outgoing: PublishedResourceContext[] =
    getPublishedSupportingResourcesFromRegistry(registry, resourceId).map(
      (entry) => ({
        relationshipId: entry.relationshipId,
        resourceId: entry.resource.id,
        direction: "outgoing",
        relationshipType: entry.relationshipType,
        role: entry.role,
        label: entry.label,
        order: entry.order,
        relationship: entry.relationship,
        resource: entry.resource,
      }),
    );
  const incoming: PublishedResourceContext[] =
    getPublishedResourcesSupportedByFromRegistry(registry, resourceId).map(
      (entry) => ({
        relationshipId: entry.relationshipId,
        resourceId: entry.resource.id,
        direction: "incoming",
        relationshipType: entry.relationshipType,
        role: entry.role,
        label: entry.label,
        order: entry.order,
        relationship: entry.relationship,
        resource: entry.resource,
      }),
    );
  const seenResourceIds = new Set<string>();

  return [...outgoing, ...incoming]
    .sort(compareResourceContextOrder)
    .filter((entry) => {
      if (seenResourceIds.has(entry.resourceId)) return false;
      seenResourceIds.add(entry.resourceId);
      return true;
    });
}

export function getPublishedResourceContext(resourceId: string) {
  return getPublishedResourceContextFromRegistry(contentRegistry, resourceId);
}

export function getSupportingResourcesForResource(resourceId: string) {
  return getPublishedSupportingResources(resourceId).map(
    (supportingResource) => supportingResource.resource,
  );
}

export function getAssetsForResource(resourceId: string) {
  const resource = getResourceById(resourceId);
  if (!resource) return [];

  const assetIds = [
    ...new Set([
      ...getArtifactContentAssetIds(resource.content),
      ...getResourceRepresentationAssetIds(resource),
    ]),
  ];

  return assetIds.flatMap((assetId) => {
    const asset = getAssetById(assetId);
    return asset ? [asset] : [];
  });
}

export function getAssetsForArtifact(artifactId: string) {
  return getAssetsForResource(artifactId);
}

export function getSourceRecordsForResource(resourceId: string) {
  return contentRegistry.sourceRecords.filter(
    (sourceRecord) => sourceRecord.resourceId === resourceId,
  );
}

export function getSourceRecordsForArtifact(artifactId: string) {
  return getSourceRecordsForResource(artifactId);
}

export function getSourceRecordsForAsset(assetId: string) {
  return contentRegistry.sourceRecords.filter(
    (sourceRecord) => sourceRecord.assetId === assetId,
  );
}

function getArtifactDateLabel(resource: Resource) {
  if (resource.date) return resource.date;
  if (resource.dateStart && resource.dateEnd) {
    return `${resource.dateStart}–${resource.dateEnd}`;
  }
  return resource.dateStart ?? resource.dateEnd;
}

export function getResourceAtmosphereMetadata(
  resourceId: string,
  collectionId?: string,
) {
  const resource = getResourceById(resourceId);
  if (!resource) return null;

  const relationshipContext = collectionId
    ? getPublishedResourceCollections(resourceId).filter(
        (collection) => collection.id === collectionId,
      )
    : getPublishedResourceCollections(resourceId);

  return {
    resourceId: resource.id,
    artifactId: resource.id,
    type: resource.type,
    title: resource.title,
    subtitle: resource.subtitle,
    date: getArtifactDateLabel(resource),
    category: resource.category,
    categoryColor: resource.categoryColor,
    relationshipContext: relationshipContext.map((collection) => collection.title),
    medium: resource.medium,
    format: resource.format,
    description: resource.description,
  };
}

export function getArtifactAtmosphereMetadata(
  artifactId: string,
  collectionId?: string,
) {
  return getResourceAtmosphereMetadata(artifactId, collectionId);
}
