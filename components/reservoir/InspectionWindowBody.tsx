import { getStructuredDocumentBody } from "@/lib/content/structured-document";
import { ContactInspectionBody } from "./ContactInspectionBody";
import { ExternalLinkInspectionBody } from "./ExternalLinkInspectionBody";
import { GenericFileInspectionBody } from "./GenericFileInspectionBody";
import { getResourceInspectionSurface } from "@/lib/reservoir/inspection";
import type { Resource, ResourceExternalRepresentation } from "@/types/content";
import { ImageInspectionBody } from "./ImageInspectionBody";
import { MarkdownStructuredDocumentBody } from "./MarkdownStructuredDocumentBody";
import { NotebookInspectionBody } from "./NotebookInspectionBody";
import { StructuredDocumentBody } from "./StructuredDocumentBody";

type InspectionWindowBodyProps = {
  resource: Resource;
  onNavigateToResource: (resourceId: string) => void;
};

export function InspectionWindowBody({
  resource,
  onNavigateToResource,
}: InspectionWindowBodyProps) {
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
            presentationProfile={resource.content.presentationProfile}
            onNavigateToResource={onNavigateToResource}
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
          <StructuredDocumentBody
            blocks={document.blocks}
            resource={resource}
            presentationProfile={document.presentationProfile}
            onNavigateToResource={onNavigateToResource}
          />
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

  if (surface === "contact-form") {
    return (
      <div data-inspection-body="contact-form">
        <ContactInspectionBody resource={resource} />
      </div>
    );
  }

  if (surface === "generic-file") {
    return (
      <div data-inspection-body="generic-file">
        <GenericFileInspectionBody resource={resource} />
      </div>
    );
  }

  if (surface === "notebook") {
    return (
      <div data-inspection-body="notebook">
        <NotebookInspectionBody
          resource={resource}
          onNavigateToResource={onNavigateToResource}
        />
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
