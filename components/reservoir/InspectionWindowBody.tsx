import { getStructuredDocumentBody } from "@/lib/content/structured-document";
import { ExternalLinkInspectionBody } from "./ExternalLinkInspectionBody";
import { getResourceInspectionSurface } from "@/lib/reservoir/inspection";
import type { Resource, ResourceExternalRepresentation } from "@/types/content";
import { ImageInspectionBody } from "./ImageInspectionBody";
import { MarkdownStructuredDocumentBody } from "./MarkdownStructuredDocumentBody";
import { StructuredDocumentBody } from "./StructuredDocumentBody";

type InspectionWindowBodyProps = {
  resource: Resource;
};

export function InspectionWindowBody({ resource }: InspectionWindowBodyProps) {
  const surface = getResourceInspectionSurface(resource.inspectionKind);
  const externalRepresentation = resource.representations?.find(
    (representation): representation is ResourceExternalRepresentation =>
      representation.kind === "external" && representation.published !== false,
  );

  if (surface === "structured-document") {
    if (
      resource.content?.kind === "structured-document" &&
      resource.content.markdownSource
    ) {
      return (
        <div
          data-inspection-body="structured-document"
          data-structured-document-source="canonical-markdown"
        >
          <MarkdownStructuredDocumentBody
            resource={resource}
            source={resource.content.markdownSource}
          />
        </div>
      );
    }
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

  if (surface === "external-link") {
    return (
      <div data-inspection-body="external-link">
        <ExternalLinkInspectionBody resource={resource} />
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
      {externalRepresentation ? (
        <p>
          <a
            href={externalRepresentation.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the original representation
          </a>
        </p>
      ) : null}
    </section>
  );
}
