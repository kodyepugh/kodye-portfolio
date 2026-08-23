import type { Ref } from "react";
import type { Resource } from "@/types/content";
import type { Collection } from "@/types/content";
import { formatObjectDate, formatObjectRelationships, getMediumLabel, getObjectMedium } from "@/lib/content/object-metadata";

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
  const relationships = formatObjectRelationships(selectedNode.relationships);

  return (
    <section
      ref={containerRef}
      key={`${selectedNode.objectType}-${selectedNode.id}`}
      className={`atmosphere-content ${isHome ? "atmosphere-content--home" : "atmosphere-content--artifact"}`}
      aria-live={isHome ? undefined : "polite"}
      aria-atomic={isHome || undefined}
      aria-hidden={isHome || undefined}
    >
      <h2 className="atmosphere-content__title">{selectedNode.title}</h2>
      {selectedNode.subtitle ? <p className="atmosphere-content__subtitle">{selectedNode.subtitle}</p> : null}
      <p className="atmosphere-content__summary">{[getMediumLabel(getObjectMedium(selectedNode)), ...dates].join(" | ")}</p>
      {relationships.length > 0 ? <p className="atmosphere-content__relationships">{relationships.map((relationship) => `${relationship.relation[0].toUpperCase()}${relationship.relation.slice(1)} ${relationship.label}`).join(" · ")}</p> : null}
    </section>
  );
}
