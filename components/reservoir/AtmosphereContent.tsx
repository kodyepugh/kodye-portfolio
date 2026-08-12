import type { Ref } from "react";
import type { ReservoirArtifact } from "@/types/reservoir";

type AtmosphereContentProps = {
  containerRef?: Ref<HTMLElement>;
  selectedArtifact: ReservoirArtifact | null;
};

export function AtmosphereContent({
  containerRef,
  selectedArtifact,
}: AtmosphereContentProps) {
  if (!selectedArtifact) {
    return (
      <header
        ref={containerRef}
        className="atmosphere-content atmosphere-content--home"
        aria-hidden="true"
      >
        <span>Digital Reservoir</span>
        <span>Spatial study / 01</span>
      </header>
    );
  }

  const metadata = [
    { label: "Date", value: selectedArtifact.date },
    { label: "Context", value: selectedArtifact.context },
    { label: "Medium", value: selectedArtifact.medium },
  ].filter(
    (entry): entry is { label: string; value: string } =>
      Boolean(entry.value),
  );

  return (
    <section
      ref={containerRef}
      key={selectedArtifact.id}
      className="atmosphere-content atmosphere-content--artifact"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="atmosphere-content__type">{selectedArtifact.type}</p>
      <h2 className="atmosphere-content__title">{selectedArtifact.title}</h2>
      {selectedArtifact.subtitle ? (
        <p className="atmosphere-content__subtitle">
          {selectedArtifact.subtitle}
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
