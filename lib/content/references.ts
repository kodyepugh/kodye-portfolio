import type { Resource, ResourceContent } from "../../types/content";

export function getResourceContentAssetIds(
  content: ResourceContent | undefined,
) {
  if (!content) return [];

  switch (content.kind) {
    case "media":
      return [content.assetId];
    case "document":
      return content.assetId ? [content.assetId] : [];
    case "case-study":
      return content.sections.flatMap((section) => section.assetIds ?? []);
    case "external-link":
    case "rich-text":
      return [];
  }
}

export function getResourceRepresentationAssetIds(
  resource: Resource | undefined,
) {
  if (!resource?.representations) return [];

  return resource.representations.flatMap((representation) =>
    representation.kind === "asset" ? [representation.assetId] : [],
  );
}

export function getArtifactContentAssetIds(
  content: ResourceContent | undefined,
) {
  return getResourceContentAssetIds(content);
}
