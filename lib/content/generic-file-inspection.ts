import type { Asset, Resource, ResourceAssetRepresentation } from "../../types/content";
import { getAssetById } from "./selectors";

export type GenericFileInspectionResolution =
  | {
      status: "ready";
      asset: Asset;
      representation?: ResourceAssetRepresentation;
      source: "representation" | "content";
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

function isUsablePdf(asset: Asset) {
  return (
    asset.kind === "document" &&
    asset.mimeType === "application/pdf" &&
    typeof asset.src === "string" &&
    asset.src.trim().length > 0
  );
}

export function resolveGenericFileInspection(
  resource: Pick<Resource, "content" | "id" | "representations">,
  assetById: typeof getAssetById = getAssetById,
): GenericFileInspectionResolution {
  const details: string[] = [];
  const representations = (resource.representations ?? [])
    .filter(
      (representation): representation is ResourceAssetRepresentation =>
        representation.kind === "asset" && representation.published !== false,
    )
    .slice()
    .sort(compareRepresentations);

  for (const representation of representations) {
    const asset = assetById(representation.assetId);
    if (!asset) {
      details.push(
        `Published generic-file representation ${representation.id} points to a missing asset.`,
      );
      continue;
    }
    if (!isUsablePdf(asset)) {
      details.push(
        `Published generic-file representation ${representation.id} is not a usable PDF.`,
      );
      continue;
    }
    return { status: "ready", asset, representation, source: "representation" };
  }

  if (resource.content?.kind === "document" && resource.content.assetId) {
    const asset = assetById(resource.content.assetId);
    if (asset && isUsablePdf(asset)) {
      return { status: "ready", asset, source: "content" };
    }
    details.push(
      `Document content for Resource ${resource.id} does not resolve to a usable PDF.`,
    );
  }

  return {
    status: "unavailable",
    reason: "This generic-file Resource does not expose a supported PDF preview.",
    details,
  };
}
