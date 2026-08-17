import { contentRegistry } from "./registry";
import { getArtifactContentAssetIds } from "./references";
import type {
  Artifact,
  ArtifactMembership,
  Collection,
  CollectionMembership,
} from "../../types/content";

const artifactById = new Map(
  contentRegistry.artifacts.map((artifact) => [artifact.id, artifact] as const),
);
const artifactBySlug = new Map(
  contentRegistry.artifacts.map(
    (artifact) => [artifact.slug, artifact] as const,
  ),
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

export type ResolvedCollectionMember =
  | {
      kind: "artifact";
      membership: ArtifactMembership;
      artifact: Artifact;
    }
  | {
      kind: "collection";
      membership: CollectionMembership;
      collection: Collection;
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
    if (membership.memberType === "artifact") {
      const artifact = getArtifactById(membership.memberId);
      if (artifact) members.push({ kind: "artifact", membership, artifact });
      continue;
    }

    const collection = getCollectionById(membership.memberId);
    if (collection) {
      members.push({ kind: "collection", membership, collection });
    }
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

export function getArtifactCollections(artifactId: string) {
  return contentRegistry.memberships.flatMap((membership) => {
    if (
      membership.memberType !== "artifact" ||
      membership.memberId !== artifactId
    ) {
      return [];
    }

    const collection = getCollectionById(membership.collectionId);
    return collection ? [collection] : [];
  });
}

export function getPublishedArtifactCollections(artifactId: string) {
  return getArtifactCollections(artifactId).filter(
    (collection) => collection.published === true,
  );
}

export function getAssetsForArtifact(artifactId: string) {
  const artifact = getArtifactById(artifactId);
  if (!artifact) return [];

  return [...new Set(getArtifactContentAssetIds(artifact.content))].flatMap(
    (assetId) => {
      const asset = getAssetById(assetId);
      return asset ? [asset] : [];
    },
  );
}

export function getSourceRecordsForArtifact(artifactId: string) {
  return contentRegistry.sourceRecords.filter(
    (sourceRecord) => sourceRecord.artifactId === artifactId,
  );
}

export function getSourceRecordsForAsset(assetId: string) {
  return contentRegistry.sourceRecords.filter(
    (sourceRecord) => sourceRecord.assetId === assetId,
  );
}

function getArtifactDateLabel(artifact: Artifact) {
  if (artifact.date) return artifact.date;
  if (artifact.dateStart && artifact.dateEnd) {
    return `${artifact.dateStart}–${artifact.dateEnd}`;
  }
  return artifact.dateStart ?? artifact.dateEnd;
}

export function getArtifactAtmosphereMetadata(
  artifactId: string,
  collectionId?: string,
) {
  const artifact = getArtifactById(artifactId);
  if (!artifact) return null;

  const relationshipContext = collectionId
    ? getPublishedArtifactCollections(artifactId).filter(
        (collection) => collection.id === collectionId,
      )
    : getPublishedArtifactCollections(artifactId);

  return {
    artifactId: artifact.id,
    type: artifact.type,
    title: artifact.title,
    subtitle: artifact.subtitle,
    date: getArtifactDateLabel(artifact),
    category: artifact.category,
    categoryColor: artifact.categoryColor,
    relationshipContext: relationshipContext.map(
      (collection) => collection.title,
    ),
    medium: artifact.medium,
    format: artifact.format,
    description: artifact.description,
  };
}
