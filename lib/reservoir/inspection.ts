import type { Resource, ResourceInspectionKind } from "../../types/content";

export type ResourceInspectionSurface =
  | "structured-document"
  | "image"
  | "unsupported";

export function getResourceInspectionSurface(
  inspectionKind: ResourceInspectionKind,
): ResourceInspectionSurface {
  switch (inspectionKind) {
    case "structured-document":
      return "structured-document";
    case "image":
      return "image";
    case "video":
    case "audio":
    case "external-link":
    case "dataset-table":
    case "notebook-code":
    case "generic-file":
      return "unsupported";
  }
}

export function canInspectResource(resource: Pick<Resource, "inspectionKind">) {
  return getResourceInspectionSurface(resource.inspectionKind) !== "unsupported";
}
