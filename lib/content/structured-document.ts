import type {
  Resource,
  ResourceContentStatus,
  StructuredDocumentBlock,
} from "../../types/content";

export type StructuredDocumentBody = {
  status: ResourceContentStatus;
  blocks: readonly StructuredDocumentBlock[];
  source: "canonical" | "legacy-adapter";
};

function placeholderParagraph(
  resourceId: string,
): StructuredDocumentBlock {
  return {
    id: `${resourceId}-placeholder-note`,
    type: "paragraph",
    text: "This entry is intentionally sparse until the approved source material is added to the registry.",
  };
}

function withPlaceholderNote(
  resource: Resource,
  blocks: StructuredDocumentBlock[],
) {
  if (resource.content?.status === "placeholder") {
    blocks.push(placeholderParagraph(resource.id));
  }
  return blocks;
}

export function getStructuredDocumentBody(
  resource: Resource,
): StructuredDocumentBody | null {
  if (resource.inspectionKind !== "structured-document") return null;

  const content = resource.content;
  if (!content) {
    return {
      status: "placeholder",
      source: "legacy-adapter",
      blocks: [
        {
          id: `${resource.id}-unavailable-heading`,
          type: "heading",
          level: 2,
          text: "Unavailable content",
          eyebrow: "01 / Content",
        },
        {
          id: `${resource.id}-unavailable-copy`,
          type: "paragraph",
          text: "This Resource is published in the semantic registry, but its approved content body has not been added yet.",
        },
      ],
    };
  }

  if (content.kind === "structured-document") {
    if ("markdownSource" in content) return null;
    return {
      status: content.status,
      source: "canonical",
      blocks: content.blocks,
    };
  }

  const blocks: StructuredDocumentBlock[] = [];

  switch (content.kind) {
    case "rich-text":
      blocks.push({
        id: `${resource.id}-overview-heading`,
        type: "heading",
        level: 2,
        text: "Reading copy",
        eyebrow: "01 / Overview",
      });
      content.body.forEach((text, index) => {
        blocks.push({
          id: `${resource.id}-paragraph-${index + 1}`,
          type: "paragraph",
          text,
        });
      });
      break;
    case "case-study":
      content.sections.forEach((section, sectionIndex) => {
        blocks.push({
          id: `${section.id}-heading`,
          type: "heading",
          level: 2,
          text: section.heading,
          eyebrow: `${String(sectionIndex + 1).padStart(2, "0")} / ${section.heading}`,
        });
        section.body.forEach((text, paragraphIndex) => {
          blocks.push({
            id: `${section.id}-paragraph-${paragraphIndex + 1}`,
            type: "paragraph",
            text,
          });
        });
      });
      break;
    case "document":
      blocks.push({
        id: `${resource.id}-document-heading`,
        type: "heading",
        level: 2,
        text: "Document record",
        eyebrow: "01 / Document",
      });
      if (content.note) {
        blocks.push({
          id: `${resource.id}-document-note`,
          type: "paragraph",
          text: content.note,
        });
      }
      break;
    case "external-link":
    case "media":
    case "contact":
      return null;
  }

  return {
    status: content.status,
    source: "legacy-adapter",
    blocks: withPlaceholderNote(resource, blocks),
  };
}
