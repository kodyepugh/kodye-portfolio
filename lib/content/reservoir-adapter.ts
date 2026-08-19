import { getArtifactById, getCollectionById, getPublishedCollectionMembers } from "./selectors";
import type { ResourceType } from "../../types/content";

export type ReservoirContentNode =
  | {
      kind: "artifact";
      id: string;
      membershipId?: string;
      order?: number;
      title: string;
      subtitle?: string;
      type: ResourceType;
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

function getTypeLabel(type: ResourceType) {
  return type
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getReservoirContentNodes(
  collectionId: string,
): ReservoirContentNode[] {
  return getPublishedCollectionMembers(collectionId).map((member) => {
    if (member.kind === "artifact") {
      const { artifact, membership } = member;
      return {
        kind: "artifact",
        id: artifact.id,
        membershipId: membership.id,
        order: membership.order,
        title: artifact.title,
        subtitle: artifact.subtitle,
        type: artifact.type,
        typeLabel: getTypeLabel(artifact.type),
        icon: artifact.icon,
        category: artifact.category,
        categoryColor: artifact.categoryColor,
        date: artifact.date,
        medium: artifact.medium,
        format: artifact.format,
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
  const artifact = getArtifactById(nodeId);
  if (artifact?.published === true) {
    return {
      kind: "artifact",
      id: artifact.id,
      title: artifact.title,
      subtitle: artifact.subtitle,
      type: artifact.type,
      typeLabel: getTypeLabel(artifact.type),
      icon: artifact.icon,
      category: artifact.category,
      categoryColor: artifact.categoryColor,
      date: artifact.date,
      medium: artifact.medium,
      format: artifact.format,
    };
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

  return {
    kind: "artifact" as const,
    id: artifact.id,
    title: artifact.title,
    subtitle: artifact.subtitle,
    type: artifact.type,
    typeLabel: getTypeLabel(artifact.type),
    icon: artifact.icon,
    category: artifact.category,
    categoryColor: artifact.categoryColor,
    date: artifact.date,
    medium: artifact.medium,
    format: artifact.format,
  };
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
