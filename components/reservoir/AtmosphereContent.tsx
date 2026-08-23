import type { Ref } from "react";
import type { Collection, Resource } from "@/types/content";
import { formatObjectDate } from "@/lib/content/object-metadata";

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
  const selectedNode = selectedResource ?? selectedCollection ?? activeCollection;
  const isHome = !selectedResource && !selectedCollection;
  const dates = [
    formatObjectDate(selectedNode.createdAt) ? `Added ${formatObjectDate(selectedNode.createdAt)}` : null,
    formatObjectDate(selectedNode.updatedAt) ? `Modified ${formatObjectDate(selectedNode.updatedAt)}` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <section
      ref={containerRef}
      key={`${selectedNode.objectType}-${selectedNode.id}`}
      className={`atmosphere-content ${isHome ? "atmosphere-content--home" : "atmosphere-content--artifact"}`}
      aria-live={isHome ? undefined : "polite"}
      aria-atomic={isHome || undefined}
      aria-hidden={isHome || undefined}
    >
      <div className="atmosphere-content__identity">
        <h2 className="atmosphere-content__title">{selectedNode.title}</h2>
        {dates.length > 0 ? <p className="atmosphere-content__dates">{dates.join(" | ")}</p> : null}
      </div>
      {selectedNode.subtitle ? <p className="atmosphere-content__subtitle">{selectedNode.subtitle}</p> : null}
    </section>
  );
}
