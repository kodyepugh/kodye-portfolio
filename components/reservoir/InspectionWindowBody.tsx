import { getStructuredDocumentBody } from "@/lib/content/structured-document";
import { getResourceInspectionSurface } from "@/lib/reservoir/inspection";
import type { Resource } from "@/types/content";
import { ImageInspectionBody } from "./ImageInspectionBody";
import { StructuredDocumentBody } from "./StructuredDocumentBody";

type InspectionWindowBodyProps = {
  resource: Resource;
};

export function InspectionWindowBody({ resource }: InspectionWindowBodyProps) {
  const surface = getResourceInspectionSurface(resource.inspectionKind);

  if (surface === "structured-document") {
    const document = getStructuredDocumentBody(resource);
    if (document) {
      return (
        <div
          data-inspection-body="structured-document"
          data-structured-document-source={document.source}
        >
          <StructuredDocumentBody blocks={document.blocks} resource={resource} />
        </div>
      );
    }
  }

  if (surface === "image") {
    return (
      <div data-inspection-body="image">
        <ImageInspectionBody resource={resource} />
      </div>
    );
  }

  return (
    <section
      data-inspection-body="unsupported"
      aria-labelledby={`inspection-${resource.id}-unsupported-heading`}
    >
      <p className="artifact-window__section-index">Inspection unavailable</p>
      <h2 id={`inspection-${resource.id}-unsupported-heading`}>
        {resource.title}
      </h2>
      <p>
        The {resource.inspectionKind} inspection surface is not implemented in
        this release.
      </p>
    </section>
  );
}
