import {
  getArtifactContentAssetIds,
  getResourceRepresentationAssetIds,
} from "./references";
import type {
  ContentRegistry,
  Resource,
  StructuredDocumentBlock,
} from "../../types/content";

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

function reportSemanticAddressNamespace(
  registry: ContentRegistry,
  errors: string[],
) {
  const owners = new Map<string, string>();

  const entries = [
    ...registry.resources.flatMap((resource) => [
      { token: resource.id, owner: `Resource ${resource.id} id` },
      { token: resource.slug, owner: `Resource ${resource.id} slug` },
    ]),
    ...registry.collections.flatMap((collection) => [
      { token: collection.id, owner: `Collection ${collection.id} id` },
      { token: collection.slug, owner: `Collection ${collection.id} slug` },
    ]),
  ];

  for (const { token, owner } of entries) {
    const existingOwner = owners.get(token);
    if (existingOwner) {
      errors.push(
        `Semantic address token ${token} is reused by ${existingOwner} and ${owner}`,
      );
      continue;
    }
    owners.set(token, owner);
  }
}

function reportStructuredDocumentBlocks(
  resource: Resource,
  registry: ContentRegistry,
  errors: string[],
) {
  if (resource.content?.kind !== "structured-document") return;

  if (resource.content.markdownSource) {
    if (!resource.content.markdownSource.path.trim()) {
      errors.push(
        `Resource ${resource.id} has a structured Markdown source with a blank path`,
      );
    }
    return;
  }

  const blockIds = new Set<string>();
  const resourcesById = new Map(
    registry.resources.map((candidate) => [candidate.id, candidate]),
  );
  const requireText = (
    block: StructuredDocumentBlock,
    label: string,
    value: string,
  ) => {
    if (!value.trim()) {
      errors.push(
        `Resource ${resource.id} structured-document block ${block.id} has blank ${label}`,
      );
    }
  };

  for (const block of resource.content.blocks) {
    if (!block.id.trim()) {
      errors.push(`Resource ${resource.id} has a structured-document block with a blank ID`);
    } else if (blockIds.has(block.id)) {
      errors.push(
        `Resource ${resource.id} has duplicate structured-document block ID ${block.id}`,
      );
    }
    blockIds.add(block.id);

    switch (block.type) {
      case "heading":
      case "paragraph":
      case "quote":
        requireText(block, "text", block.text);
        break;
      case "figure": {
        requireText(block, "alt text", block.alt);
        const figureResource = resourcesById.get(block.resourceId);
        if (!figureResource) {
          errors.push(
            `Resource ${resource.id} figure block ${block.id} references unknown Resource ${block.resourceId}`,
          );
        } else if (
          block.representationId &&
          !figureResource.representations?.some(
            (representation) => representation.id === block.representationId,
          )
        ) {
          errors.push(
            `Resource ${resource.id} figure block ${block.id} references unknown representation ${block.representationId} on Resource ${block.resourceId}`,
          );
        }
        break;
      }
      case "list":
        if (block.items.length === 0 || block.items.some((item) => !item.trim())) {
          errors.push(
            `Resource ${resource.id} list block ${block.id} must contain nonblank items`,
          );
        }
        break;
      case "callout":
        requireText(block, "text", block.text);
        break;
      case "link":
        requireText(block, "label", block.label);
        requireText(block, "href", block.href);
        try {
          new URL(block.href, "https://digital-reservoir.local");
        } catch {
          errors.push(
            `Resource ${resource.id} link block ${block.id} has invalid href ${block.href}`,
          );
        }
        break;
      case "table":
        if (
          block.columns.length === 0 ||
          block.columns.some((column) => !column.trim()) ||
          block.rows.some((row) => row.length !== block.columns.length)
        ) {
          errors.push(
            `Resource ${resource.id} table block ${block.id} must have nonblank columns and rectangular rows`,
          );
        }
        break;
      case "code":
        requireText(block, "code", block.code);
        break;
      case "resource-reference":
        if (!resourcesById.has(block.resourceId)) {
          errors.push(
            `Resource ${resource.id} reference block ${block.id} references unknown Resource ${block.resourceId}`,
          );
        }
        break;
      case "divider":
        break;
    }
  }
}

function reportInspectionContentCompatibility(
  resource: Resource,
  errors: string[],
) {
  const contentKind = resource.content?.kind;
  if (!contentKind) return;

  const compatible =
    resource.inspectionKind === "structured-document"
      ? ["structured-document", "rich-text", "case-study", "document"].includes(
          contentKind,
        )
      : resource.inspectionKind === "image"
        ? contentKind === "media"
        : resource.inspectionKind === "external-link"
          ? contentKind === "external-link"
          : true;

  if (!compatible) {
    errors.push(
      `Resource ${resource.id} inspectionKind ${resource.inspectionKind} is incompatible with content kind ${contentKind}`,
    );
  }
}

function reportExternalLinkTargets(resource: Resource, errors: string[]) {
  function validateExternalUrl(url: string) {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Unsupported protocol ${parsed.protocol}`);
    }
    return parsed;
  }

  for (const representation of resource.representations ?? []) {
    if (representation.kind !== "external" || representation.published === false) {
      continue;
    }

    try {
      validateExternalUrl(representation.url);
    } catch (error) {
      errors.push(
        error instanceof Error && error.message.includes("protocol")
          ? `Resource ${resource.id} published external representation ${representation.id} uses unsupported protocol ${representation.url}`
          : `Resource ${resource.id} published external representation ${representation.id} has an invalid URL ${representation.url}`,
      );
    }
  }

  if (resource.content?.kind !== "external-link") return;

  try {
    validateExternalUrl(resource.content.url);
  } catch (error) {
    errors.push(
      error instanceof Error && error.message.includes("protocol")
        ? `Resource ${resource.id} external-link content uses unsupported protocol ${resource.content.url}`
        : `Resource ${resource.id} external-link content has an invalid URL ${resource.content.url}`,
    );
  }
}

export function validateContentRegistry(
  registry: ContentRegistry,
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  reportDuplicates(
    errors,
    "resource ID",
    registry.resources.map((resource) => resource.id),
  );
  reportDuplicates(
    errors,
    "resource slug",
    registry.resources.map((resource) => resource.slug),
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
    "resource support relationship ID",
    registry.resourceSupportRelations.map((relationship) => relationship.id),
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

  const collectionIds = new Set(
    registry.collections.map((collection) => collection.id),
  );
  const resourceIds = new Set(registry.resources.map((resource) => resource.id));
  const assetIds = new Set(registry.assets.map((asset) => asset.id));
  const membershipEdges = new Set<string>();
  const membershipOrders = new Set<string>();
  const supportEdges = new Set<string>();
  const supportOrders = new Set<string>();
  const representationIds = new Set<string>();

  reportSemanticAddressNamespace(registry, errors);

  for (const resource of registry.resources) {
    reportInspectionContentCompatibility(resource, errors);
    reportExternalLinkTargets(resource, errors);
    reportStructuredDocumentBlocks(resource, registry, errors);

    for (const assetId of getArtifactContentAssetIds(resource.content)) {
      if (!assetIds.has(assetId)) {
        errors.push(`Resource ${resource.id} references unknown asset ${assetId}`);
      }
    }

    for (const assetId of getResourceRepresentationAssetIds(resource)) {
      if (!assetIds.has(assetId)) {
        errors.push(
          `Resource ${resource.id} references unknown representation asset ${assetId}`,
        );
      }
    }

    if (resource.representations) {
      for (const representation of resource.representations) {
        if (representationIds.has(representation.id)) {
          errors.push(`Duplicate resource representation ID: ${representation.id}`);
        }
        representationIds.add(representation.id);
        if (resourceIds.has(representation.id)) {
          errors.push(
            `Resource representation ${representation.id} duplicates a persistent Resource identity`,
          );
        }
      }
    }

    if (resource.content?.status === "placeholder") {
      warnings.push(`Resource ${resource.id} still has placeholder content`);
    }
  }

  for (const membership of registry.memberships) {
    if (!collectionIds.has(membership.collectionId)) {
      errors.push(
        `Membership ${membership.id} has unknown collectionId ${membership.collectionId}`,
      );
    }

    if (membership.memberType === "collection") {
      if (!collectionIds.has(membership.memberId)) {
        errors.push(
          `Membership ${membership.id} has unknown collection memberId ${membership.memberId}`,
        );
      }
      if (membership.collectionId === membership.memberId) {
        errors.push(`Membership ${membership.id} makes a collection contain itself`);
      }
    } else {
      const resource = registry.resources.find(
        (candidate) => candidate.id === membership.memberId,
      );
      if (!resource) {
        errors.push(
          `Membership ${membership.id} has unknown resource memberId ${membership.memberId}`,
        );
      } else if (resource.isArtifact !== true) {
        errors.push(
          `Membership ${membership.id} assigns collection membership to non-artifact resource ${resource.id}`,
        );
      }
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

  for (const relationship of registry.resourceSupportRelations) {
    const source = registry.resources.find(
      (candidate) => candidate.id === relationship.sourceResourceId,
    );
    if (!source) {
      errors.push(
        `Resource support relationship ${relationship.id} references unknown source resource ${relationship.sourceResourceId}`,
      );
      continue;
    }
    if (source.isArtifact !== true) {
      errors.push(
        `Resource support relationship ${relationship.id} must originate from an artifact-status resource`,
      );
    }

    const target = registry.resources.find(
      (candidate) => candidate.id === relationship.targetResourceId,
    );
    if (!target) {
      errors.push(
        `Resource support relationship ${relationship.id} references unknown target resource ${relationship.targetResourceId}`,
      );
    }
    if (relationship.sourceResourceId === relationship.targetResourceId) {
      errors.push(
        `Resource support relationship ${relationship.id} cannot point a resource at itself`,
      );
    }

    const edge = `${relationship.sourceResourceId}:${relationship.relationshipType}:${relationship.targetResourceId}`;
    if (supportEdges.has(edge)) {
      errors.push(`Duplicate resource support relationship: ${edge}`);
    }
    supportEdges.add(edge);

    if (relationship.order !== undefined) {
      const orderKey = `${relationship.sourceResourceId}:${relationship.order}`;
      if (supportOrders.has(orderKey)) {
        errors.push(`Duplicate resource support order: ${orderKey}`);
      }
      supportOrders.add(orderKey);
    }
  }

  for (const sourceRecord of registry.sourceRecords) {
    const resourceId = sourceRecord.resourceId;
    const assetId = sourceRecord.assetId;
    if (Boolean(resourceId) === Boolean(assetId)) {
      errors.push(
        `Source record ${sourceRecord.id} must reference exactly one resource or asset`,
      );
    }
    if (resourceId && !resourceIds.has(resourceId)) {
      errors.push(
        `Source record ${sourceRecord.id} references unknown resource ${resourceId}`,
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
