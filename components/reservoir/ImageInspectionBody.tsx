import { useState } from "react";
import type { Resource } from "@/types/content";
import {
  getImageAltText,
  resolveImageInspection,
} from "@/lib/content/image-inspection";

type ImageInspectionBodyProps = {
  resource: Resource;
};

function ImageInspectionUnavailableState({
  reason,
  details,
}: {
  reason: string;
  details: readonly string[];
}) {
  return (
    <div className="inspection-image__unavailable" role="note">
      <p className="inspection-image__unavailable-title">Image unavailable</p>
      <p className="inspection-image__unavailable-reason">{reason}</p>
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
  const imageSource = resolution.status === "ready" ? resolution.asset.src : null;
  const imageSourceKey = `${resource.id}:${imageSource ?? ""}`;
  const [imageLoadFailureKey, setImageLoadFailureKey] = useState<string | null>(
    null,
  );
  const titleId = `inspection-${resource.id}-image-heading`;
  const imageLoadFailed = imageLoadFailureKey === imageSourceKey;
  const unavailable = resolution.status === "unavailable" || imageLoadFailed;

  return (
    <section
      className="inspection-image"
      aria-labelledby={titleId}
      data-image-resolution={unavailable ? "unavailable" : resolution.status}
      data-image-resolution-source={
        !unavailable && resolution.status === "ready"
          ? resolution.source
          : "unavailable"
      }
    >
      <h2 id={titleId} className="sr-only">
        {resource.title}
      </h2>

      {!unavailable && resolution.status === "ready" ? (
        <figure className="inspection-image__figure">
          <div className="inspection-image__stage">
            <div className="inspection-image__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="inspection-image__image"
                src={resolution.asset.src}
                alt={getImageAltText(
                  resolution.asset,
                  resolution.caption,
                  resource.title,
                )}
                width={resolution.asset.width}
                height={resolution.asset.height}
                decoding="async"
                loading="eager"
                onError={() => setImageLoadFailureKey(imageSourceKey)}
              />
            </div>
          </div>
          {resolution.caption ? (
            <figcaption className="inspection-image__caption">
              {resolution.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : (
        <ImageInspectionUnavailableState
          reason={
            imageLoadFailed
              ? "The image could not be loaded."
              : resolution.status === "unavailable"
                ? resolution.reason
                : "The image could not be displayed."
          }
          details={resolution.status === "unavailable" ? resolution.details : []}
        />
      )}
    </section>
  );
}
