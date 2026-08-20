import type { Resource } from "@/types/content";
import {
  getExternalLinkInspectionActionLabel,
  getExternalLinkInspectionLocationLabel,
  getExternalLinkInspectionProviderLabel,
  resolveExternalLinkInspection,
} from "@/lib/content/external-link-inspection";

type ExternalLinkInspectionBodyProps = {
  resource: Resource;
};

function ExternalLinkUnavailableState({
  reason,
  details,
}: {
  reason: string;
  details: readonly string[];
}) {
  return (
    <div className="inspection-external-link__unavailable" role="note">
      <p className="inspection-external-link__unavailable-title">
        External link unavailable
      </p>
      <p className="inspection-external-link__unavailable-reason">{reason}</p>
      {details.length > 0 ? (
        <ul className="inspection-external-link__detail-list">
          {details.map((detail, index) => (
            <li key={`${index}-${detail}`}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ExternalLinkInspectionBody({
  resource,
}: ExternalLinkInspectionBodyProps) {
  const resolution = resolveExternalLinkInspection(resource);
  const titleId = `inspection-${resource.id}-external-link-heading`;
  const actionLabel = getExternalLinkInspectionActionLabel(resource.type);

  if (resolution.status === "unavailable") {
    return (
      <section
        className="inspection-external-link"
        aria-labelledby={titleId}
        data-external-link-resolution="unavailable"
      >
        <h2 id={titleId} className="sr-only">
          {resource.title}
        </h2>
        <ExternalLinkUnavailableState
          reason={resolution.reason}
          details={resolution.details}
        />
      </section>
    );
  }

  const { target } = resolution;
  const providerLabel = getExternalLinkInspectionProviderLabel(target);
  const locationLabel = getExternalLinkInspectionLocationLabel(
    target,
    resource.type,
  );

  return (
    <section
      className="inspection-external-link"
      aria-labelledby={titleId}
      data-external-link-resolution={resolution.source}
      data-external-link-hostname={target.hostname}
      data-external-link-variant={resource.type === "repository" ? "repository" : "external"}
    >
      <h2 id={titleId} className="sr-only">
        {resource.title}
      </h2>

      <div className="inspection-external-link__hero">
        <div className="inspection-external-link__icon">↗</div>
        <p className="inspection-external-link__provider">{providerLabel}</p>
        {locationLabel !== providerLabel ? (
          <p className="inspection-external-link__location">{locationLabel}</p>
        ) : null}
      </div>

      <a
        className="inspection-external-link__action"
        href={target.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${actionLabel} in a new tab`}
      >
        <span>{actionLabel}</span>
        <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
