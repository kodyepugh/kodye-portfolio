import type { Resource } from "@/types/content";
import { resolveImageInspection } from "@/lib/content/image-inspection";

type ImageInspectionBodyProps = {
  resource: Resource;
};

function formatImageDimensions(width?: number, height?: number) {
  if (!width || !height) return null;

  return `${width} × ${height}px`;
}

function ImageInspectionUnavailableState({
  resource,
  reason,
  details,
}: {
  resource: Resource;
  reason: string;
  details: readonly string[];
}) {
  return (
    <div className="inspection-image__unavailable" role="note">
      <p className="artifact-window__section-index">Image unavailable</p>
      <h3>{resource.title}</h3>
      <p>{reason}</p>
      {details.length > 0 ? (
        <ul className="inspection-image__detail-list">
          {details.map((detail, index) => (
            <li key={`${index}-${detail}`}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ImageInspectionBody({ resource }: ImageInspectionBodyProps) {
  const resolution = resolveImageInspection(resource);
  const titleId = `inspection-${resource.id}-image-heading`;

  return (
    <div
      className="inspection-image"
      aria-labelledby={titleId}
      data-image-resolution={resolution.status}
      data-image-resolution-source={
        resolution.status === "ready" ? resolution.source : "unavailable"
      }
    >
      <div className="inspection-image__header">
        <p className="artifact-window__section-index">01 / Image</p>
        <h2 id={titleId}>
          {resolution.status === "ready" ? resource.title : "Image unavailable"}
        </h2>
        <p className="inspection-image__lede">
          {resolution.status === "ready"
            ? resolution.source === "representation"
              ? resolution.representation?.label ??
                resolution.asset.filename ??
                "Published image representation"
              : resolution.asset.filename ?? "Media asset fallback"
            : resolution.reason}
        </p>
      </div>

      {resolution.status === "ready" ? (
        <figure className="inspection-image__figure">
          <div className="inspection-image__stage">
            <div className="inspection-image__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="inspection-image__image"
                src={resolution.asset.src}
                alt={resolution.asset.alt ?? resource.title}
                width={resolution.asset.width}
                height={resolution.asset.height}
                decoding="async"
                loading="eager"
              />
            </div>
          </div>
          <figcaption className="inspection-image__meta">
            {resolution.caption ? (
              <p className="inspection-image__caption">{resolution.caption}</p>
            ) : null}
            <dl className="inspection-image__stats">
              <div>
                <dt>Source</dt>
                <dd>
                  {resolution.source === "representation"
                    ? "Published representation"
                    : "Media-content fallback"}
                </dd>
              </div>
              {resolution.representation?.label ? (
                <div>
                  <dt>Representation</dt>
                  <dd>{resolution.representation.label}</dd>
                </div>
              ) : null}
              {resolution.asset.filename ? (
                <div>
                  <dt>File</dt>
                  <dd>{resolution.asset.filename}</dd>
                </div>
              ) : null}
              {resolution.asset.mimeType ? (
                <div>
                  <dt>MIME</dt>
                  <dd>{resolution.asset.mimeType}</dd>
                </div>
              ) : null}
              {formatImageDimensions(
                resolution.asset.width,
                resolution.asset.height,
              ) ? (
                <div>
                  <dt>Dimensions</dt>
                  <dd>
                    {formatImageDimensions(
                      resolution.asset.width,
                      resolution.asset.height,
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </figcaption>
        </figure>
      ) : (
        <ImageInspectionUnavailableState
          resource={resource}
          reason={resolution.reason}
          details={resolution.details}
        />
      )}
    </div>
  );
}
