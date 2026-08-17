import type { Ref } from "react";
import type { Artifact } from "@/types/content";
import type { Collection } from "@/types/content";
import { getArtifactAtmosphereMetadata } from "@/lib/content/selectors";

function getTypeLabel(type: string) {
  return type
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

type AtmosphereContentProps = {
  containerRef?: Ref<HTMLElement>;
  selectedArtifact: Artifact | null;
  selectedCollection: Collection | null;
  activeCollection: Collection;
};

export function AtmosphereContent({
  containerRef,
  selectedArtifact,
  selectedCollection,
  activeCollection,
}: AtmosphereContentProps) {
  if (!selectedArtifact && !selectedCollection) {
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

  const selectedMetadata = selectedArtifact
    ? getArtifactAtmosphereMetadata(
        selectedArtifact.id,
        selectedCollection?.id,
      )
    : null;
  const selectedNode = selectedArtifact ?? selectedCollection;
  if (!selectedNode) return null;
  const selectedType = selectedArtifact
    ? getTypeLabel(selectedArtifact.type)
    : "Collection";
  const selectedSubtitle =
    selectedMetadata?.subtitle ?? selectedNode.subtitle ?? selectedCollection?.description;
  const metadata = [
    { label: "Date", value: selectedMetadata?.date },
    {
      label: selectedArtifact ? "Context" : "Lens",
      value: selectedMetadata?.category ?? selectedCollection?.category,
    },
    {
      label: selectedArtifact ? "Medium" : "Contents",
      value: selectedArtifact?.medium ?? selectedCollection?.description,
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
      key={`${selectedArtifact ? "artifact" : "collection"}-${selectedNode.id}`}
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
