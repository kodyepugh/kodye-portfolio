import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type {
  PublishedResourceContext,
  PublishedResourceContextDirections,
} from "@/lib/content/selectors";
import type { Collection } from "@/types/content";
import {
  getInspectionCollectionPill,
  getInspectionContextAvailability,
  getInspectionResourceDirectionAvailability,
  getInspectionResourcePill,
  INSPECTION_RESOURCE_DIRECTION_LABELS,
  type InspectionObjectIconKey,
  type InspectionResourceDirection,
} from "@/lib/reservoir/inspection-context";
import {
  isInspectionSupportRailInteractive,
  type InspectionWindowPhase,
} from "@/lib/reservoir/inspection-support";
import {
  clampRelationshipShelfScrollLeft,
  distributeRelationshipShelfItems,
  getRelationshipShelfWheelDelta,
} from "@/lib/reservoir/relationship-shelf";

type InspectionContextTrayProps = {
  phase: InspectionWindowPhase;
  resourceContext: PublishedResourceContextDirections;
  collections: readonly Collection[];
  onNavigateToResource: (resourceId: string) => void;
  onNavigateToCollection: (collectionId: string) => void;
};

function InspectionObjectIcon({
  iconKey,
}: {
  iconKey: InspectionObjectIconKey;
}) {
  const pathByIcon: Record<InspectionObjectIconKey, string> = {
    collection: "M3 7.5 12 3l9 4.5-9 4.5-9-4.5Zm0 0V16l9 5 9-5V7.5M7 10v5.5l5 2.75 5-2.75V10",
    code: "M8 7 3 12l5 5M16 7l5 5-5 5M13.5 4l-3 16",
    document: "M6 3.5h8l4 4V20.5H6V3.5Zm8 0v4h4M9 12h6M9 16h6",
    image: "M4 5.5h16v13H4v-13Zm2 10 3.5-3.5 3 3 2.5-2.5 3 3M9 9.5h.01",
    link: "M9.5 14.5 14.5 9.5M7 17H5.5a4 4 0 0 1 0-8H9m6-3h1.5a4 4 0 0 1 0 8H15",
    media: "M5 4.5h14v15H5v-15Zm4 4 6 3.5-6 3.5v-7Z",
    resource: "M4 6.5h16v11H4v-11Zm4-3h8v3H8v-3ZM8 11h8M8 14h5",
  };

  return (
    <svg
      className="inspection-context-pill__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d={pathByIcon[iconKey]} />
    </svg>
  );
}

function ResourcePills({
  resources,
  interactive,
  onNavigateToResource,
}: {
  resources: readonly PublishedResourceContext[];
  interactive: boolean;
  onNavigateToResource: (resourceId: string) => void;
}) {
  const items = resources.map((connection) => {
    const pill = getInspectionResourcePill(connection.resource);
    return {
      key: connection.relationshipId,
      pill,
      ariaLabel: `Open resource ${pill.name}`,
    };
  });
  const rows = distributeRelationshipShelfItems(items);

  return (
    <div
      className="inspection-context-tray__brick-field"
      role="group"
      aria-label="Resource relationships"
      data-relationship-brick-rows={rows.length}
    >
      {rows.map((row, rowIndex) => (
        <ul
          className="inspection-context-tray__brick-row"
          aria-label={`Resources row ${rowIndex + 1}`}
          data-relationship-brick-row={rowIndex + 1}
          key={`resources-row-${rowIndex + 1}`}
        >
          {row.map((item) => (
            <li key={item.key}>
              <button
                className="inspection-context-pill"
                type="button"
                disabled={!interactive}
                aria-label={item.ariaLabel}
                onClick={() => onNavigateToResource(item.pill.id)}
              >
                <InspectionObjectIcon iconKey={item.pill.iconKey} />
                <span>{item.pill.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

function CollectionPills({
  panelRef,
  collections,
  interactive,
  onNavigateToCollection,
}: {
  panelRef: RefObject<HTMLUListElement | null>;
  collections: readonly Collection[];
  interactive: boolean;
  onNavigateToCollection: (collectionId: string) => void;
}) {
  return (
    <ul
      ref={panelRef}
      className="inspection-context-tray__collection-list"
      aria-label="Collection memberships"
      data-context-wheel-horizontal="true"
    >
      {collections.map((collection) => {
        const pill = getInspectionCollectionPill(collection);
        return (
          <li key={pill.id}>
            <button
              className="inspection-context-pill inspection-context-pill--collection"
              type="button"
              disabled={!interactive}
              aria-label={`Open collection ${pill.name}`}
              onClick={() => onNavigateToCollection(pill.id)}
            >
              <InspectionObjectIcon iconKey={pill.iconKey} />
              <span>{pill.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function InspectionContextTray({
  phase,
  resourceContext,
  collections,
  onNavigateToResource,
  onNavigateToCollection,
}: InspectionContextTrayProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const collectionPanelRef = useRef<HTMLUListElement | null>(null);
  const supportedBy = resourceContext.supportedBy;
  const supports = resourceContext.supports;
  const resourceCount = supportedBy.length + supports.length;
  const contextAvailability = getInspectionContextAvailability(
    resourceCount,
    collections.length,
  );
  const directionAvailability = getInspectionResourceDirectionAvailability(
    supportedBy.length,
    supports.length,
  );
  const [activeDirection, setActiveDirection] =
    useState<InspectionResourceDirection>(
      () => directionAvailability.initialDirection ?? "outgoing",
    );
  const resolvedDirection =
    activeDirection === "outgoing" && directionAvailability.hasSupportedBy
      ? activeDirection
      : activeDirection === "incoming" && directionAvailability.hasSupports
        ? activeDirection
        : directionAvailability.initialDirection ?? "outgoing";
  const visibleResources =
    resolvedDirection === "outgoing" ? supportedBy : supports;
  const directionLabel =
    INSPECTION_RESOURCE_DIRECTION_LABELS[resolvedDirection];
  const interactive = isInspectionSupportRailInteractive(phase);

  useEffect(() => {
    const scrollingPanels = [panelRef.current, collectionPanelRef.current].filter(
      (panel): panel is HTMLElement => panel !== null,
    );
    if (scrollingPanels.length === 0) return;

    function translateWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      const scrollingPanel = event.currentTarget as HTMLElement;
      const delta = getRelationshipShelfWheelDelta(
        event,
        16,
        scrollingPanel.clientWidth,
      );

      event.preventDefault();
      event.stopPropagation();
      scrollingPanel.scrollLeft = clampRelationshipShelfScrollLeft(
        scrollingPanel.scrollLeft,
        scrollingPanel.scrollWidth,
        scrollingPanel.clientWidth,
        delta,
      );
      scrollingPanel.dataset.contextShelfWheelConsumed = "true";
      scrollingPanel.dataset.contextShelfScrollLeft =
        scrollingPanel.scrollLeft.toFixed(3);
    }

    scrollingPanels.forEach((scrollingPanel) => {
      scrollingPanel.addEventListener("wheel", translateWheel, {
        passive: false,
      });
    });
    return () =>
      scrollingPanels.forEach((scrollingPanel) =>
        scrollingPanel.removeEventListener("wheel", translateWheel),
      );
  }, [collections.length, resolvedDirection]);

  if (!contextAvailability.hasResources && !contextAvailability.hasCollections) {
    return null;
  }

  const resourceDirectionLabelId = directionAvailability.hasBothDirections
    ? `inspection-context-resources-${resolvedDirection}-tab`
    : "inspection-context-resources-direction-label";

  return (
    <aside
      className="inspection-context-tray"
      aria-label="Related objects"
      data-context-tray-visible="true"
      data-context-tray-interactive={interactive}
      data-context-tray-resources-count={resourceCount}
      data-context-tray-supported-by-count={supportedBy.length}
      data-context-tray-supports-count={supports.length}
      data-context-tray-active-direction={resolvedDirection}
      data-context-tray-collections-count={collections.length}
    >
      {contextAvailability.hasResources ? (
        <section
          className="inspection-context-tray__region inspection-context-tray__region--resources"
          aria-labelledby="inspection-context-resources-heading"
        >
          <h2
            className="inspection-context-tray__heading"
            id="inspection-context-resources-heading"
          >
            Resources
          </h2>

          <div className="inspection-context-tray__direction-header">
            {directionAvailability.hasBothDirections ? (
              <div
                className="inspection-context-tray__direction-switch"
                role="tablist"
                aria-label="Resource relationship direction"
              >
                <button
                  type="button"
                  role="tab"
                  className="inspection-context-tray__direction-tab"
                  aria-selected={resolvedDirection === "outgoing"}
                  aria-controls="inspection-context-resources-shelf"
                  id="inspection-context-resources-outgoing-tab"
                  onClick={() => setActiveDirection("outgoing")}
                >
                  {INSPECTION_RESOURCE_DIRECTION_LABELS.outgoing}
                </button>
                <span
                  className="inspection-context-tray__direction-separator"
                  aria-hidden="true"
                >
                  |
                </span>
                <button
                  type="button"
                  role="tab"
                  className="inspection-context-tray__direction-tab"
                  aria-selected={resolvedDirection === "incoming"}
                  aria-controls="inspection-context-resources-shelf"
                  id="inspection-context-resources-incoming-tab"
                  onClick={() => setActiveDirection("incoming")}
                >
                  {INSPECTION_RESOURCE_DIRECTION_LABELS.incoming}
                </button>
              </div>
            ) : (
              <p
                className="inspection-context-tray__direction-label"
                id="inspection-context-resources-direction-label"
              >
                {directionLabel}
              </p>
            )}
          </div>

          <section
            ref={panelRef}
            className="inspection-context-tray__panel"
            id="inspection-context-resources-shelf"
            role={directionAvailability.hasBothDirections ? "tabpanel" : undefined}
            aria-labelledby={resourceDirectionLabelId}
            aria-label={`${directionLabel} Resource relationship shelf; scroll horizontally for more`}
            tabIndex={0}
            data-context-shelf-max-rows="4"
            data-context-wheel-horizontal="true"
          >
            <ResourcePills
              resources={visibleResources}
              interactive={interactive}
              onNavigateToResource={onNavigateToResource}
            />
          </section>
        </section>
      ) : null}

      {contextAvailability.hasCollections ? (
        <section
          className="inspection-context-tray__region inspection-context-tray__region--collections"
          aria-labelledby="inspection-context-collections-heading"
        >
          <h2
            className="inspection-context-tray__heading"
            id="inspection-context-collections-heading"
          >
            Collections
          </h2>
          <CollectionPills
            panelRef={collectionPanelRef}
            collections={collections}
            interactive={interactive}
            onNavigateToCollection={onNavigateToCollection}
          />
        </section>
      ) : null}
    </aside>
  );
}
