import type { Resource } from "@/types/content";
import { resolveExternalLinkInspection } from "@/lib/content/external-link-inspection";

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

function formatRepositoryPath(pathname: string) {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function ExternalLinkInspectionBody({
  resource,
}: ExternalLinkInspectionBodyProps) {
  const resolution = resolveExternalLinkInspection(resource);
  const titleId = `inspection-${resource.id}-external-link-heading`;

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

  return (
    <section
      className="inspection-external-link"
      aria-labelledby={titleId}
      data-external-link-resolution={resolution.source}
      data-external-link-hostname={target.hostname}
      data-external-link-protocol={target.protocol}
    >
      <h2 id={titleId} className="sr-only">
        {resource.title}
      </h2>

      <div className="inspection-external-link__intro">
        <p className="artifact-window__section-index">
          {resource.type === "repository" ? "Repository" : "External link"}
        </p>
        <p className="inspection-external-link__lede">
          {resource.description ??
            resource.subtitle ??
            "Open the canonical external target in a new tab."}
        </p>
      </div>

      <div className="inspection-external-link__panel">
        <dl className="inspection-external-link__metadata">
          <div className="inspection-external-link__metadata-item">
            <dt>Destination</dt>
            <dd>{target.label}</dd>
          </div>
          <div className="inspection-external-link__metadata-item">
            <dt>Domain</dt>
            <dd>{target.hostname}</dd>
          </div>
          <div className="inspection-external-link__metadata-item">
            <dt>Path</dt>
            <dd>{formatRepositoryPath(target.pathname)}</dd>
          </div>
          {target.sourceLabel ? (
            <div className="inspection-external-link__metadata-item">
              <dt>Source</dt>
              <dd>{target.sourceLabel}</dd>
            </div>
          ) : null}
          <div className="inspection-external-link__metadata-item">
            <dt>Open</dt>
            <dd>
              <a
                className="inspection-external-link__action"
                href={target.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${target.label} in a new tab`}
              >
                Open repository
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
