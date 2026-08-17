import type { ArtifactContent } from "../../types/content";

export function getArtifactContentAssetIds(
  content: ArtifactContent | undefined,
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
