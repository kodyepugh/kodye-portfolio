import type { Resource, ResourceInspectionKind } from "../../types/content";

export type ResourceInspectionSurface =
  | "structured-document"
  | "image"
  | "external-link"
  | "contact-form"
  | "generic-file"
  | "notebook"
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
    case "contact-form":
      return "contact-form";
    case "generic-file":
      return "generic-file";
    case "notebook-code":
      return "notebook";
    case "video":
    case "audio":
    case "dataset-table":
      return "unsupported";
  }
}

export function canInspectResource(resource: Pick<Resource, "inspectionKind">) {
  return getResourceInspectionSurface(resource.inspectionKind) !== "unsupported";
}
