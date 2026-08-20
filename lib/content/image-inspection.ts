import type { Asset, Resource, ResourceAssetRepresentation } from "../../types/content";
import { getAssetById } from "./selectors";

export type ImageInspectionResolution =
  | {
      status: "ready";
      source: "representation" | "content";
      asset: Asset;
      representation?: ResourceAssetRepresentation;
      caption?: string;
    }
  | {
      status: "unavailable";
      reason: string;
      details: readonly string[];
    };

function compareRepresentations(
  a: { order?: number; id: string },
  b: { order?: number; id: string },
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
}

function hasUsableImageSource(asset: Asset) {
  return typeof asset.src === "string" && asset.src.trim().length > 0;
}

export function getPublishedImageRepresentations(
  resource: Pick<Resource, "representations">,
) {
  return (resource.representations ?? [])
    .filter(
      (
        representation,
      ): representation is ResourceAssetRepresentation =>
        representation.kind === "asset" && representation.published !== false,
    )
    .slice()
    .sort(compareRepresentations);
}

export function resolveImageInspection(
  resource: Pick<Resource, "content" | "representations" | "id">,
  assetById: typeof getAssetById = getAssetById,
): ImageInspectionResolution {
  const details: string[] = [];
  const representations = (resource.representations ?? [])
    .slice()
    .sort(compareRepresentations);

  for (const representation of representations) {
    if (representation.kind !== "asset") {
      if (representation.published !== false) {
        details.push(
          `Published image representation ${representation.id} is malformed because it is not an asset representation.`,
        );
      }
      continue;
    }

    if (representation.published === false) {
      details.push(`Image representation ${representation.id} is unpublished.`);
      continue;
    }

    const asset = assetById(representation.assetId);
    if (!asset) {
      details.push(
        `Published image representation ${representation.id} points to missing asset ${representation.assetId}.`,
      );
      continue;
    }

    if (asset.kind !== "image") {
      details.push(
        `Published image representation ${representation.id} resolves to asset ${asset.id} with unsupported kind ${asset.kind}.`,
      );
      continue;
    }

    if (!hasUsableImageSource(asset)) {
      details.push(
        `Published image representation ${representation.id} resolves to image asset ${asset.id} without a usable source.`,
      );
      continue;
    }

    return {
      status: "ready",
      source: "representation",
      asset,
      representation,
      caption: representation.caption ?? asset.caption,
    };
  }

  if (resource.content?.kind === "media") {
    const asset = assetById(resource.content.assetId);
    if (!asset) {
      details.push(
        `Media-content fallback asset ${resource.content.assetId} is missing.`,
      );
    } else if (asset.kind !== "image") {
      details.push(
        `Media-content fallback asset ${asset.id} has unsupported kind ${asset.kind}.`,
      );
    } else if (!hasUsableImageSource(asset)) {
      details.push(
        `Media-content fallback asset ${asset.id} does not expose a usable source.`,
      );
    } else {
      return {
        status: "ready",
        source: "content",
        asset,
        caption: resource.content.caption ?? asset.caption,
      };
    }
  }

  const reason =
    getPublishedImageRepresentations(resource).length > 0
      ? "The published image representation is unavailable."
      : resource.content?.kind === "media"
        ? "The media-content fallback is unavailable."
        : "This Resource does not currently expose a published image representation.";

  return {
    status: "unavailable",
    reason,
    details,
  };
}
