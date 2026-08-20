import { getStructuredDocumentBody } from "@/lib/content/structured-document";
import { getAssetById } from "@/lib/content/selectors";
import { getResourceInspectionSurface } from "@/lib/reservoir/inspection";
import type { Resource } from "@/types/content";
import { StructuredDocumentBody } from "./StructuredDocumentBody";

type InspectionWindowBodyProps = {
  resource: Resource;
};

function ImageCompatibilityBody({ resource }: InspectionWindowBodyProps) {
  const contentAsset =
    resource.content?.kind === "media"
      ? getAssetById(resource.content.assetId)
      : null;
  const representation = resource.representations?.find(
    (candidate) => candidate.kind === "asset" && candidate.published !== false,
  );
  const representationAsset =
    representation?.kind === "asset"
      ? getAssetById(representation.assetId)
      : null;
  const asset = representationAsset ?? contentAsset;
  const caption =
    resource.content?.kind === "media" ? resource.content.caption : undefined;

  return (
    <section aria-labelledby={`inspection-${resource.id}-image-heading`}>
      <p className="artifact-window__section-index">01 / Image</p>
      <h2 id={`inspection-${resource.id}-image-heading`}>
        {asset?.filename ?? resource.title}
      </h2>
      {asset?.kind === "image" ? (
        <figure className="artifact-window__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.src} alt={asset.alt ?? asset.caption ?? resource.title} />
          {caption || asset.caption ? (
            <figcaption>{caption ?? asset.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <p>This image Resource does not currently expose a published visual representation.</p>
      )}
    </section>
  );
}

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

  if (surface === "image-compatibility") {
    return (
      <div data-inspection-body="image-compatibility">
        <ImageCompatibilityBody resource={resource} />
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
