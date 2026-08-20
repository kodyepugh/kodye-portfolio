import type { Collection, Resource, ResourceType } from "@/types/content";

export type InspectionObjectIconKey =
  | "collection"
  | "code"
  | "document"
  | "image"
  | "link"
  | "media"
  | "resource";

export type InspectionResourcePill = {
  id: string;
  name: string;
  iconKey: InspectionObjectIconKey;
};

export type InspectionCollectionPill = {
  id: string;
  name: string;
  iconKey: "collection";
};

export type InspectionContextAvailability = {
  hasResources: boolean;
  hasCollections: boolean;
  initialView: "resources" | "collections" | null;
};

const IMAGE_RESOURCE_TYPES = new Set<ResourceType>(["image", "photograph"]);
const MEDIA_RESOURCE_TYPES = new Set<ResourceType>(["audio", "video"]);
const CODE_RESOURCE_TYPES = new Set<ResourceType>([
  "code",
  "notebook",
  "repository",
]);
const LINK_RESOURCE_TYPES = new Set<ResourceType>([
  "link",
  "webpage",
]);
const DOCUMENT_RESOURCE_TYPES = new Set<ResourceType>([
  "case-study",
  "document",
  "presentation",
  "report",
  "spreadsheet",
  "text",
  "writing",
]);

export function getInspectionContextAvailability(
  resourceCount: number,
  collectionCount: number,
): InspectionContextAvailability {
  const hasResources = resourceCount > 0;
  const hasCollections = collectionCount > 0;

  return {
    hasResources,
    hasCollections,
    initialView: hasResources
      ? "resources"
      : hasCollections
        ? "collections"
        : null,
  };
}

export function getInspectionResourceIconKey(
  resourceType: ResourceType,
): Exclude<InspectionObjectIconKey, "collection"> {
  if (IMAGE_RESOURCE_TYPES.has(resourceType)) return "image";
  if (MEDIA_RESOURCE_TYPES.has(resourceType)) return "media";
  if (CODE_RESOURCE_TYPES.has(resourceType)) return "code";
  if (LINK_RESOURCE_TYPES.has(resourceType)) return "link";
  if (DOCUMENT_RESOURCE_TYPES.has(resourceType)) return "document";
  return "resource";
}

export function getInspectionResourcePill(
  resource: Pick<Resource, "id" | "title" | "type">,
): InspectionResourcePill {
  return {
    id: resource.id,
    name: resource.title,
    iconKey: getInspectionResourceIconKey(resource.type),
  };
}

export function getInspectionCollectionPill(
  collection: Pick<Collection, "id" | "title">,
): InspectionCollectionPill {
  return {
    id: collection.id,
    name: collection.title,
    iconKey: "collection",
  };
}
