import type { Ref } from "react";
import type {
  EmbeddedReservoirCollection,
  ReservoirArtifact,
  ReservoirCollection,
} from "@/types/reservoir";

type AtmosphereContentProps = {
  containerRef?: Ref<HTMLElement>;
  selectedArtifact: ReservoirArtifact | null;
  selectedCollection: EmbeddedReservoirCollection | null;
  activeCollection: ReservoirCollection;
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
        <span>{activeCollection.title === "Home" ? "Digital Reservoir" : activeCollection.title}</span>
        <span>{activeCollection.subtitle ?? "Spatial study / 01"}</span>
      </header>
    );
  }

  const selectedNode = selectedArtifact ?? selectedCollection;
  if (!selectedNode) return null;
  const selectedType = selectedArtifact?.type ?? "Collection";
  const selectedSubtitle =
    selectedNode.subtitle ?? selectedCollection?.description;
  const metadata = [
    { label: "Date", value: selectedNode.date },
    {
      label: selectedArtifact ? "Context" : "Lens",
      value: selectedArtifact?.context ?? selectedCollection?.category,
    },
    {
      label: selectedArtifact ? "Medium" : "Contents",
      value: selectedArtifact?.medium ?? selectedCollection?.contentSummary,
    },
  ].filter(
    (entry): entry is { label: string; value: string } =>
      Boolean(entry.value),
  );

  return (
    <section
      ref={containerRef}
      key={`${selectedNode.kind}-${selectedNode.id}`}
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
