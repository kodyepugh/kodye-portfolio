import type { Resource, ResourceInspectionKind } from "../../types/content";

export type ResourceInspectionSurface =
  | "structured-document"
  | "image"
  | "external-link"
  | "unsupported";

export function getResourceInspectionSurface(
  inspectionKind: ResourceInspectionKind,
): ResourceInspectionSurface {
  switch (inspectionKind) {
    case "structured-document":
      return "structured-document";
    case "image":
      return "image";
    case "external-link":
      return "external-link";
    case "video":
    case "audio":
    case "dataset-table":
    case "notebook-code":
    case "generic-file":
      return "unsupported";
  }
}

export function canInspectResource(resource: Pick<Resource, "inspectionKind">) {
  return (
    resource.inspectionKind === "notebook-code" ||
    getResourceInspectionSurface(resource.inspectionKind) !== "unsupported"
  );
}
