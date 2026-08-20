import { useState } from "react";
import type { PublishedSupportingResource } from "@/lib/content/selectors";
import type { Collection } from "@/types/content";
import {
  isInspectionSupportRailInteractive,
  type InspectionWindowPhase,
} from "@/lib/reservoir/inspection-support";

type InspectionContextView = "connections" | "collections";

type InspectionContextTrayProps = {
  phase: InspectionWindowPhase;
  connections: readonly PublishedSupportingResource[];
  collections: readonly Collection[];
  onNavigateToResource: (resourceId: string) => void;
};

function formatResourceLabel(value: string) {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getCollectionContextLabel(collection: Collection) {
  return collection.subtitle ?? collection.description ?? collection.category;
}

function getInitialView(
  connections: readonly PublishedSupportingResource[],
  collections: readonly Collection[],
): InspectionContextView | null {
  if (connections.length > 0) return "connections";
  if (collections.length > 0) return "collections";
  return null;
}

function ContextCards({
  kind,
  connections,
  collections,
  interactive,
  onNavigateToResource,
}: {
  kind: InspectionContextView;
  connections: readonly PublishedSupportingResource[];
  collections: readonly Collection[];
  interactive: boolean;
  onNavigateToResource: (resourceId: string) => void;
}) {
  if (kind === "connections") {
    return (
      <ol className="inspection-context-tray__cards">
        {connections.map((connection) => {
          const metadataLine = [
            formatResourceLabel(connection.targetResourceType),
            formatResourceLabel(connection.targetResourceInspectionKind),
          ].join(" · ");

          return (
            <li key={connection.relationshipId}>
              <button
                className="inspection-context-card inspection-context-card--connection"
                type="button"
                disabled={!interactive}
                aria-disabled={!interactive}
                aria-label={`Open supporting resource ${connection.targetResourceTitle}`}
                onClick={() => onNavigateToResource(connection.targetResourceId)}
              >
                <span className="inspection-context-card__kicker">
                  {connection.label ??
                    connection.role ??
                    connection.relationshipType}
                </span>
                <span className="inspection-context-card__title">
                  {connection.targetResourceTitle}
                </span>
                <span className="inspection-context-card__meta">
                  {metadataLine}
                </span>
                {connection.role &&
                connection.label &&
                connection.label !== connection.role ? (
                  <span className="inspection-context-card__detail">
                    {connection.role}
                  </span>
                ) : null}
                <span className="inspection-context-card__arrow" aria-hidden="true">
                  Open
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="inspection-context-tray__cards">
      {collections.map((collection) => {
        const contextLabel = getCollectionContextLabel(collection);

        return (
          <li key={collection.id}>
            <article className="inspection-context-card inspection-context-card--collection">
              <span className="inspection-context-card__kicker">
                Collection
              </span>
              <span className="inspection-context-card__title">
                {collection.title}
              </span>
              {contextLabel ? (
                <span className="inspection-context-card__meta">
                  {contextLabel}
                </span>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

export function InspectionContextTray({
  phase,
  connections,
  collections,
  onNavigateToResource,
}: InspectionContextTrayProps) {
  const initialView = getInitialView(connections, collections);
  const [activeView, setActiveView] = useState<InspectionContextView | null>(
    initialView,
  );
  const interactive = isInspectionSupportRailInteractive(phase);
  const hasConnections = connections.length > 0;
  const hasCollections = collections.length > 0;
  const multipleViews = hasConnections && hasCollections;
  const resolvedView =
    activeView !== null &&
    ((activeView === "connections" && hasConnections) ||
      (activeView === "collections" && hasCollections))
      ? activeView
      : initialView;
  const trayTitle =
    resolvedView === "connections" || (!multipleViews && hasConnections)
      ? "Connections"
      : "Collections";

  if (!hasConnections && !hasCollections) {
    return null;
  }

  return (
    <aside
      className="inspection-context-tray"
      aria-labelledby="inspection-context-tray-title"
      data-context-tray-visible="true"
      data-context-tray-multiple={multipleViews}
      data-context-tray-active-view={resolvedView ?? "connections"}
      data-context-tray-interactive={interactive}
      data-context-tray-connections-count={connections.length}
      data-context-tray-collections-count={collections.length}
    >
      <div className="inspection-context-tray__head">
        <p className="artifact-window__section-index">Inspection context</p>
        <div className="inspection-context-tray__head-row">
          <h2 id="inspection-context-tray-title">{trayTitle}</h2>
          {multipleViews ? (
            <div
              className="inspection-context-tray__switch"
              role="tablist"
              aria-label="Inspection context categories"
            >
              <button
                type="button"
                role="tab"
                className="inspection-context-tray__tab"
                aria-selected={resolvedView === "connections"}
                aria-controls="inspection-context-tray-connections"
                id="inspection-context-tray-connections-tab"
                onClick={() => setActiveView("connections")}
              >
                Connections
              </button>
              <button
                type="button"
                role="tab"
                className="inspection-context-tray__tab"
                aria-selected={resolvedView === "collections"}
                aria-controls="inspection-context-tray-collections"
                id="inspection-context-tray-collections-tab"
                onClick={() => setActiveView("collections")}
              >
                Collections
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="inspection-context-tray__panels">
        {hasConnections && (resolvedView === "connections" || !multipleViews) ? (
          <section
            className="inspection-context-tray__panel"
            id="inspection-context-tray-connections"
            role={multipleViews ? "tabpanel" : undefined}
            aria-labelledby={multipleViews ? "inspection-context-tray-connections-tab" : undefined}
          >
            {!multipleViews ? (
              <p className="inspection-context-tray__panel-title">Connections</p>
            ) : null}
            <ContextCards
              kind="connections"
              connections={connections}
              collections={collections}
              interactive={interactive}
              onNavigateToResource={onNavigateToResource}
            />
          </section>
        ) : null}

        {hasCollections &&
        (resolvedView === "collections" || !multipleViews) ? (
          <section
            className="inspection-context-tray__panel"
            id="inspection-context-tray-collections"
            role={multipleViews ? "tabpanel" : undefined}
            aria-labelledby={multipleViews ? "inspection-context-tray-collections-tab" : undefined}
          >
            {!multipleViews ? (
              <p className="inspection-context-tray__panel-title">Collections</p>
            ) : null}
            <ContextCards
              kind="collections"
              connections={connections}
              collections={collections}
              interactive={interactive}
              onNavigateToResource={onNavigateToResource}
            />
          </section>
        ) : null}
      </div>
    </aside>
  );
}
