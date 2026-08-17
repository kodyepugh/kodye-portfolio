import { getArtifactContentAssetIds } from "./references";
import type { ContentRegistry } from "../../types/content";

export type ContentValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

function reportDuplicates(
  errors: string[],
  label: string,
  values: readonly string[],
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  for (const value of [...duplicates].sort()) {
    errors.push(`Duplicate ${label}: ${value}`);
  }
}

function reportCollectionCycles(
  registry: ContentRegistry,
  errors: string[],
) {
  const childrenByCollectionId = new Map<string, string[]>();

  for (const membership of registry.memberships) {
    if (membership.memberType !== "collection") continue;
    const children = childrenByCollectionId.get(membership.collectionId) ?? [];
    children.push(membership.memberId);
    childrenByCollectionId.set(membership.collectionId, children);
  }

  const visited = new Set<string>();
  const active = new Set<string>();

  function visit(collectionId: string, path: string[]) {
    if (active.has(collectionId)) {
      const cycleStart = path.indexOf(collectionId);
      const cycle = [...path.slice(cycleStart), collectionId].join(" -> ");
      errors.push(`Collection membership cycle: ${cycle}`);
      return;
    }
    if (visited.has(collectionId)) return;

    active.add(collectionId);
    for (const childId of childrenByCollectionId.get(collectionId) ?? []) {
      visit(childId, [...path, collectionId]);
    }
    active.delete(collectionId);
    visited.add(collectionId);
  }

  for (const collection of registry.collections) visit(collection.id, []);
}

export function validateContentRegistry(
  registry: ContentRegistry,
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  reportDuplicates(
    errors,
    "artifact ID",
    registry.artifacts.map((artifact) => artifact.id),
  );
  reportDuplicates(
    errors,
    "artifact slug",
    registry.artifacts.map((artifact) => artifact.slug),
  );
  reportDuplicates(
    errors,
    "collection ID",
    registry.collections.map((collection) => collection.id),
  );
  reportDuplicates(
    errors,
    "collection slug",
    registry.collections.map((collection) => collection.slug),
  );
  reportDuplicates(
    errors,
    "membership ID",
    registry.memberships.map((membership) => membership.id),
  );
  reportDuplicates(
    errors,
    "asset ID",
    registry.assets.map((asset) => asset.id),
  );
  reportDuplicates(
    errors,
    "source record ID",
    registry.sourceRecords.map((sourceRecord) => sourceRecord.id),
  );

  const artifactIds = new Set(registry.artifacts.map((artifact) => artifact.id));
  const collectionIds = new Set(
    registry.collections.map((collection) => collection.id),
  );
  const assetIds = new Set(registry.assets.map((asset) => asset.id));
  const membershipEdges = new Set<string>();
  const membershipOrders = new Set<string>();

  for (const membership of registry.memberships) {
    if (!collectionIds.has(membership.collectionId)) {
      errors.push(
        `Membership ${membership.id} has unknown collectionId ${membership.collectionId}`,
      );
    }

    const targetIds =
      membership.memberType === "artifact" ? artifactIds : collectionIds;
    if (!targetIds.has(membership.memberId)) {
      errors.push(
        `Membership ${membership.id} has unknown ${membership.memberType} memberId ${membership.memberId}`,
      );
    }
    if (
      membership.memberType === "collection" &&
      membership.collectionId === membership.memberId
    ) {
      errors.push(`Membership ${membership.id} makes a collection contain itself`);
    }

    const edge = `${membership.collectionId}:${membership.memberType}:${membership.memberId}`;
    if (membershipEdges.has(edge)) {
      errors.push(`Duplicate membership relationship: ${edge}`);
    }
    membershipEdges.add(edge);

    if (membership.order !== undefined) {
      const orderKey = `${membership.collectionId}:${membership.order}`;
      if (membershipOrders.has(orderKey)) {
        errors.push(`Duplicate membership order: ${orderKey}`);
      }
      membershipOrders.add(orderKey);
    }
  }

  for (const artifact of registry.artifacts) {
    for (const assetId of getArtifactContentAssetIds(artifact.content)) {
      if (!assetIds.has(assetId)) {
        errors.push(`Artifact ${artifact.id} references unknown asset ${assetId}`);
      }
    }

    if (artifact.content?.status === "placeholder") {
      warnings.push(`Artifact ${artifact.id} still has placeholder content`);
    }
  }

  for (const sourceRecord of registry.sourceRecords) {
    const artifactId = sourceRecord.artifactId;
    const assetId = sourceRecord.assetId;
    if (Boolean(artifactId) === Boolean(assetId)) {
      errors.push(
        `Source record ${sourceRecord.id} must reference exactly one artifact or asset`,
      );
    }
    if (artifactId && !artifactIds.has(artifactId)) {
      errors.push(
        `Source record ${sourceRecord.id} references unknown artifact ${artifactId}`,
      );
    }
    if (assetId && !assetIds.has(assetId)) {
      errors.push(
        `Source record ${sourceRecord.id} references unknown asset ${assetId}`,
      );
    }
  }

  reportCollectionCycles(registry, errors);

  return { valid: errors.length === 0, errors, warnings };
}

export function assertValidContentRegistry(registry: ContentRegistry) {
  const result = validateContentRegistry(registry);
  if (!result.valid) {
    throw new Error(`Invalid content registry:\n${result.errors.join("\n")}`);
  }
  return result;
}
