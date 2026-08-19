import type { Ref } from "react";
import type { Resource } from "@/types/content";
import type { Collection } from "@/types/content";
import { getResourceAtmosphereMetadata } from "@/lib/content/selectors";

function getTypeLabel(type: string) {
  return type
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

type AtmosphereContentProps = {
  containerRef?: Ref<HTMLElement>;
  selectedResource: Resource | null;
  selectedCollection: Collection | null;
  activeCollection: Collection;
};

export function AtmosphereContent({
  containerRef,
  selectedResource,
  selectedCollection,
  activeCollection,
}: AtmosphereContentProps) {
  if (!selectedResource && !selectedCollection) {
    return (
      <header
        ref={containerRef}
        className="atmosphere-content atmosphere-content--home"
        aria-hidden="true"
      >
        <span>{activeCollection.title}</span>
        <span>{activeCollection.subtitle ?? "Spatial study / 01"}</span>
      </header>
    );
  }

  const selectedMetadata = selectedResource
    ? getResourceAtmosphereMetadata(
        selectedResource.id,
        selectedCollection?.id,
      )
    : null;
  const selectedNode = selectedResource ?? selectedCollection;
  if (!selectedNode) return null;
  const selectedType = selectedResource
    ? getTypeLabel(selectedResource.type)
    : "Collection";
  const selectedSubtitle =
    selectedMetadata?.subtitle ?? selectedNode.subtitle ?? selectedCollection?.description;
  const metadata = [
    { label: "Date", value: selectedMetadata?.date },
    {
      label: selectedResource ? "Context" : "Lens",
      value: selectedMetadata?.category ?? selectedCollection?.category,
    },
    {
      label: selectedResource ? "Medium" : "Contents",
      value: selectedResource?.medium ?? selectedCollection?.description,
    },
    {
      label: "Collection",
      value: selectedMetadata?.relationshipContext?.join(", "),
    },
  ].filter(
    (entry): entry is { label: string; value: string } =>
      Boolean(entry.value),
  );

  return (
    <section
      ref={containerRef}
      key={`${selectedResource ? "resource" : "collection"}-${selectedNode.id}`}
      className="atmosphere-content atmosphere-content--artifact"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="atmosphere-content__type">{selectedType}</p>
      <h2 className="atmosphere-content__title">{selectedNode.title}</h2>
      {selectedSubtitle ? (
        <p className="atmosphere-content__subtitle">
          {selectedSubtitle}
        </p>
      ) : null}
      {metadata.length > 0 ? (
        <dl className="atmosphere-content__metadata">
          {metadata.map((entry) => (
            <div className="atmosphere-content__metadata-item" key={entry.label}>
              <dt>{entry.label}</dt>
              <dd>{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
