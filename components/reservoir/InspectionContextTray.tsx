import { useState } from "react";
import type { PublishedResourceContext } from "@/lib/content/selectors";
import type { Collection } from "@/types/content";
import {
  getInspectionContextAvailability,
  getInspectionCollectionPill,
  getInspectionResourcePill,
  type InspectionObjectIconKey,
} from "@/lib/reservoir/inspection-context";
import {
  isInspectionSupportRailInteractive,
  type InspectionWindowPhase,
} from "@/lib/reservoir/inspection-support";

type InspectionContextView = "resources" | "collections";

type InspectionContextTrayProps = {
  phase: InspectionWindowPhase;
  resources: readonly PublishedResourceContext[];
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

function ObjectPills({
  view,
  resources,
  collections,
  interactive,
  onNavigateToResource,
  onNavigateToCollection,
}: {
  view: InspectionContextView;
  resources: readonly PublishedResourceContext[];
  collections: readonly Collection[];
  interactive: boolean;
  onNavigateToResource: (resourceId: string) => void;
  onNavigateToCollection: (collectionId: string) => void;
}) {
  if (view === "resources") {
    return (
      <ul className="inspection-context-tray__pills" aria-label="Resources">
        {resources.map((connection) => {
          const pill = getInspectionResourcePill(connection.resource);

          return (
            <li key={connection.relationshipId}>
              <button
                className="inspection-context-pill"
                type="button"
                disabled={!interactive}
                aria-label={`Open resource ${pill.name}`}
                onClick={() => onNavigateToResource(pill.id)}
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

  return (
    <ul className="inspection-context-tray__pills" aria-label="Collections">
      {collections.map((collection) => {
        const pill = getInspectionCollectionPill(collection);

        return (
          <li key={pill.id}>
            <button
              className="inspection-context-pill"
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
  resources,
  collections,
  onNavigateToResource,
  onNavigateToCollection,
}: InspectionContextTrayProps) {
  const hasResources = resources.length > 0;
  const hasCollections = collections.length > 0;
  const initialView = getInspectionContextAvailability(
    resources.length,
    collections.length,
  ).initialView;
  const [activeView, setActiveView] = useState<InspectionContextView>(() =>
    initialView ?? "collections",
  );
  const resolvedView =
    activeView === "resources" && hasResources
      ? activeView
      : activeView === "collections" && hasCollections
        ? activeView
        : initialView ?? "collections";
  const interactive = isInspectionSupportRailInteractive(phase);

  if (!hasResources && !hasCollections) return null;

  return (
    <aside
      className="inspection-context-tray"
      aria-label="Related objects"
      data-context-tray-visible="true"
      data-context-tray-active-view={resolvedView}
      data-context-tray-interactive={interactive}
      data-context-tray-resources-count={resources.length}
      data-context-tray-collections-count={collections.length}
    >
      <div
        className="inspection-context-tray__switch"
        role="tablist"
        aria-label="Related object types"
      >
        <button
          type="button"
          role="tab"
          className="inspection-context-tray__tab"
          aria-selected={resolvedView === "resources"}
          aria-controls="inspection-context-tray-resources"
          id="inspection-context-tray-resources-tab"
          disabled={!hasResources}
          onClick={() => setActiveView("resources")}
        >
          Resources
        </button>
        <button
          type="button"
          role="tab"
          className="inspection-context-tray__tab"
          aria-selected={resolvedView === "collections"}
          aria-controls="inspection-context-tray-collections"
          id="inspection-context-tray-collections-tab"
          disabled={!hasCollections}
          onClick={() => setActiveView("collections")}
        >
          Collections
        </button>
      </div>

      <div className="inspection-context-tray__panels">
        <section
          className="inspection-context-tray__panel"
          id={
            resolvedView === "resources"
              ? "inspection-context-tray-resources"
              : "inspection-context-tray-collections"
          }
          role="tabpanel"
          aria-labelledby={`inspection-context-tray-${resolvedView}-tab`}
        >
          <ObjectPills
            view={resolvedView}
            resources={resources}
            collections={collections}
            interactive={interactive}
            onNavigateToResource={onNavigateToResource}
            onNavigateToCollection={onNavigateToCollection}
          />
        </section>
      </div>
    </aside>
  );
}
