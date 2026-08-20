import {
  getArtifactById,
  getCollectionById,
  getPublishedCollectionMembers,
  getResourceById,
} from "./selectors";
import type {
  Resource,
  ResourceInspectionKind,
  ResourceType,
} from "../../types/content";

export type ReservoirContentNode =
  | {
      kind: "artifact";
      isArtifact: true;
      id: string;
      membershipId?: string;
      order?: number;
      title: string;
      subtitle?: string;
      type: ResourceType;
      inspectionKind: ResourceInspectionKind;
      typeLabel: string;
      icon?: string;
      category?: string;
      categoryColor?: string;
      date?: string;
      medium?: string;
      format?: string;
    }
  | {
      kind: "resource";
      isArtifact: false;
      id: string;
      membershipId?: string;
      order?: number;
      title: string;
      subtitle?: string;
      type: ResourceType;
      inspectionKind: ResourceInspectionKind;
      typeLabel: string;
      icon?: string;
      category?: string;
      categoryColor?: string;
      date?: string;
      medium?: string;
      format?: string;
    }
  | {
      kind: "collection";
      id: string;
      membershipId?: string;
      order?: number;
      title: string;
      subtitle?: string;
      icon?: string;
      category?: string;
      categoryColor?: string;
    };

export type ReservoirInspectableResourceNode = Extract<
  ReservoirContentNode,
  { kind: "artifact" | "resource" }
>;

export function isReservoirInspectableResourceNode(
  node: ReservoirContentNode,
): node is ReservoirInspectableResourceNode {
  return node.kind !== "collection";
}

export function getReservoirNodeSizingFamily(node: ReservoirContentNode) {
  return isReservoirInspectableResourceNode(node)
    ? ("inspectable-resource" as const)
    : ("collection" as const);
}

function getTypeLabel(type: ResourceType) {
  return type
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function adaptResourceToReservoirContentNode(
  resource: Resource,
): ReservoirInspectableResourceNode {
  const metadata = {
    id: resource.id,
    title: resource.title,
    subtitle: resource.subtitle,
    type: resource.type,
    inspectionKind: resource.inspectionKind,
    typeLabel: getTypeLabel(resource.type),
    icon: resource.icon,
    category: resource.category,
    categoryColor: resource.categoryColor,
    date: resource.date,
    medium: resource.medium,
    format: resource.format,
  };

  return resource.isArtifact
    ? { kind: "artifact", isArtifact: true, ...metadata }
    : { kind: "resource", isArtifact: false, ...metadata };
}

export function getReservoirContentNodes(
  collectionId: string,
): ReservoirContentNode[] {
  return getPublishedCollectionMembers(collectionId).map((member) => {
    if (member.kind === "artifact") {
      const { artifact, membership } = member;
      return {
        ...adaptResourceToReservoirContentNode(artifact),
        membershipId: membership.id,
        order: membership.order,
      };
    }

    const { collection, membership } = member;
    return {
      kind: "collection",
      id: collection.id,
      membershipId: membership.id,
      order: membership.order,
      title: collection.title,
      subtitle: collection.subtitle,
      icon: collection.icon,
      category: collection.category,
      categoryColor: collection.categoryColor,
    };
  });
}

export function getReservoirContentNodeBySemanticId(
  nodeId: string,
): ReservoirContentNode | null {
  const resource = getResourceById(nodeId);
  if (resource?.published === true) {
    return adaptResourceToReservoirContentNode(resource);
  }

  const collection = getCollectionById(nodeId);
  if (collection?.published === true) {
    return {
      kind: "collection",
      id: collection.id,
      title: collection.title,
      subtitle: collection.subtitle,
      icon: collection.icon,
      category: collection.category,
      categoryColor: collection.categoryColor,
    };
  }

  return null;
}

export function getReservoirContentNodesBySemanticIds(
  nodeIds: readonly string[],
): ReservoirContentNode[] {
  return nodeIds.flatMap((nodeId) => {
    const node = getReservoirContentNodeBySemanticId(nodeId);
    return node ? [node] : [];
  });
}

export function getReservoirContentNodeById(
  collectionId: string,
  nodeId: string,
) {
  return getReservoirContentNodes(collectionId).find((node) => node.id === nodeId) ?? null;
}

export function getReservoirArtifactNodeById(artifactId: string) {
  const artifact = getArtifactById(artifactId);
  if (!artifact || artifact.published !== true) return null;

  return adaptResourceToReservoirContentNode(artifact);
}

export function getReservoirCollectionNodeById(collectionId: string) {
  const collection = getCollectionById(collectionId);
  if (!collection || collection.published !== true) return null;

  return {
    kind: "collection" as const,
    id: collection.id,
    title: collection.title,
    subtitle: collection.subtitle,
    icon: collection.icon,
    category: collection.category,
    categoryColor: collection.categoryColor,
  };
}
