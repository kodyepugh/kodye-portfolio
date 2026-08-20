import type {
  Resource,
  ResourceInspectionKind,
} from "../../types/content";

export type ResourceInspectionSurface =
  | "structured-document"
  | "image-compatibility"
  | "unsupported";

export function getResourceInspectionSurface(
  inspectionKind: ResourceInspectionKind,
): ResourceInspectionSurface {
  switch (inspectionKind) {
    case "structured-document":
      return "structured-document";
    case "image":
      return "image-compatibility";
    case "video":
    case "audio":
    case "external-link":
    case "dataset-table":
    case "notebook-code":
    case "generic-file":
      return "unsupported";
  }
}

export function canInspectResource(resource: Resource) {
  return getResourceInspectionSurface(resource.inspectionKind) !== "unsupported";
}
