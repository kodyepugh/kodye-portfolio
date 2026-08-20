import type { PublishedSupportingResource } from "@/lib/content/selectors";
import {
  isInspectionSupportRailInteractive,
  type InspectionWindowPhase,
} from "@/lib/reservoir/inspection-support";

type InspectionSupportRailProps = {
  phase: InspectionWindowPhase;
  supportingResources: readonly PublishedSupportingResource[];
  onNavigateToResource: (resourceId: string) => void;
};

function formatResourceLabel(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function InspectionSupportRail({
  phase,
  supportingResources,
  onNavigateToResource,
}: InspectionSupportRailProps) {
  if (supportingResources.length === 0) {
    return null;
  }

  const interactive = isInspectionSupportRailInteractive(phase);

  return (
    <aside
      className="inspection-window__support-region"
      aria-labelledby="inspection-support-rail-title"
      data-supporting-resource-region="visible"
      data-supporting-resource-interactive={interactive}
      data-supporting-resource-count={supportingResources.length}
      data-supporting-resource-ids={supportingResources
        .map((supportingResource) => supportingResource.targetResourceId)
        .join(",")}
    >
      <div className="inspection-window__support-region-head">
        <p className="artifact-window__section-index">Supporting resources</p>
        <h2 id="inspection-support-rail-title">Open another resource</h2>
      </div>
      <div className="inspection-window__support-stack">
        {supportingResources.map((supportingResource) => {
          const metadataLine = [
            formatResourceLabel(supportingResource.targetResourceType),
            formatResourceLabel(supportingResource.targetResourceInspectionKind),
          ].join(" · ");

          return (
            <button
              key={supportingResource.relationshipId}
              className="inspection-support-brick"
              type="button"
              disabled={!interactive}
              aria-disabled={!interactive}
              aria-label={`Open supporting resource ${supportingResource.targetResourceTitle}`}
              onClick={() =>
                onNavigateToResource(supportingResource.targetResourceId)
              }
            >
              <span className="inspection-support-brick__kicker">
                {supportingResource.label ??
                  supportingResource.role ??
                  supportingResource.relationshipType}
              </span>
              <span className="inspection-support-brick__title">
                {supportingResource.targetResourceTitle}
              </span>
              <span className="inspection-support-brick__meta">
                {metadataLine}
              </span>
              {supportingResource.role &&
              supportingResource.label &&
              supportingResource.label !== supportingResource.role ? (
                <span className="inspection-support-brick__detail">
                  {supportingResource.role}
                </span>
              ) : null}
              <span className="inspection-support-brick__arrow" aria-hidden="true">
                Open
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
