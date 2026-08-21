import type { ReactNode } from "react";
import {
  getAssetById,
  getResourceById,
} from "@/lib/content/selectors";
import type {
  Resource,
  StructuredDocumentBlock,
  StructuredDocumentFigureBlock,
  StructuredDocumentHeadingBlock,
} from "@/types/content";

type StructuredDocumentBodyProps = {
  blocks: readonly StructuredDocumentBlock[];
  resource: Resource;
};

type StructuredDocumentSection = {
  id: string;
  labelledBy?: string;
  blocks: readonly StructuredDocumentBlock[];
};

function getBlockDomId(resourceId: string, blockId: string) {
  return `structured-document-${resourceId}-${blockId}`;
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "block";
}

function renderInlineMarkdown(resource: Resource, text: string) {
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    if (match[2] && match[3]) {
      const markdownRepresentation = resource.representations?.find(
        (representation) =>
          representation.kind === "external" &&
          representation.published !== false &&
          representation.url.endsWith(".md"),
      );
      let href = match[3];
      if (href.startsWith("#")) {
        href = `#${getBlockDomId(resource.id, `${resource.id}-${slugifyHeading(href.slice(1))}`)}`;
      } else if (
        markdownRepresentation?.kind === "external" &&
        !/^[a-z][a-z0-9+.-]*:/i.test(href)
      ) {
        href = new URL(href, markdownRepresentation.url).toString();
      }
      nodes.push(<a key={`${start}-${href}`} href={href}>{match[2]}</a>);
    } else if (match[4]) {
      nodes.push(<strong key={`${start}-strong`}>{match[4]}</strong>);
    } else if (match[5]) {
      nodes.push(<code key={`${start}-code`}>{match[5]}</code>);
    }
    cursor = start + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length > 0 ? nodes : text;
}

export function groupStructuredDocumentBlocks(
  resourceId: string,
  blocks: readonly StructuredDocumentBlock[],
): StructuredDocumentSection[] {
  const sections: Array<{
    id: string;
    labelledBy?: string;
    blocks: StructuredDocumentBlock[];
  }> = [];

  for (const block of blocks) {
    const startsSection = block.type === "heading" && block.level === 2;
    if (sections.length === 0 || startsSection) {
      sections.push({
        id: `${resourceId}-section-${sections.length + 1}`,
        labelledBy: startsSection
          ? getBlockDomId(resourceId, block.id)
          : undefined,
        blocks: [],
      });
    }
    sections.at(-1)?.blocks.push(block);
  }

  return sections;
}

function renderHeading(
  resourceId: string,
  block: StructuredDocumentHeadingBlock,
) {
  const id = getBlockDomId(resourceId, block.id);
  const eyebrow = block.eyebrow ? (
    <p className="artifact-window__section-index">{block.eyebrow}</p>
  ) : null;

  switch (block.level) {
    case 2:
      return <>{eyebrow}<h2 id={id}>{block.text}</h2></>;
    case 3:
      return <>{eyebrow}<h3 id={id}>{block.text}</h3></>;
    case 4:
      return <>{eyebrow}<h4 id={id}>{block.text}</h4></>;
    case 5:
      return <>{eyebrow}<h5 id={id}>{block.text}</h5></>;
    case 6:
      return <>{eyebrow}<h6 id={id}>{block.text}</h6></>;
  }
}

function resolveFigureAsset(block: StructuredDocumentFigureBlock) {
  const figureResource = getResourceById(block.resourceId);
  if (!figureResource) return null;

  const representation = block.representationId
    ? figureResource.representations?.find(
        (candidate) => candidate.id === block.representationId,
      )
    : figureResource.representations?.find(
        (candidate) => candidate.kind === "asset" && candidate.published !== false,
      );
  const representationAsset =
    representation?.kind === "asset"
      ? getAssetById(representation.assetId)
      : null;
  const contentAsset =
    figureResource.content?.kind === "media"
      ? getAssetById(figureResource.content.assetId)
      : null;

  return {
    asset: representationAsset ?? contentAsset,
    resource: figureResource,
  };
}

function renderBlock(
  resource: Resource,
  block: StructuredDocumentBlock,
): ReactNode {
  switch (block.type) {
    case "heading":
      return renderHeading(resource.id, block);
    case "paragraph":
      return <p>{renderInlineMarkdown(resource, block.text)}</p>;
    case "figure": {
      const resolved = resolveFigureAsset(block);
      return (
        <figure
          className="artifact-window__media structured-document__figure"
          data-figure-resource-id={block.resourceId}
        >
          {resolved?.asset?.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolved.asset.src} alt={block.alt} />
          ) : (
            <div className="structured-document__figure-fallback" role="img" aria-label={block.alt}>
              Figure Resource unavailable: {resolved?.resource.title ?? block.resourceId}
            </div>
          )}
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    }
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={`${block.id}-${index}`}>
          {renderInlineMarkdown(resource, item)}
        </li>
      ));
      return block.style === "ordered" ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "callout":
      return (
        <aside className="structured-document__callout" data-callout-tone={block.tone ?? "note"}>
          {block.title ? <h3>{block.title}</h3> : null}
          <p>{renderInlineMarkdown(resource, block.text)}</p>
        </aside>
      );
    case "link":
      return (
        <div className="structured-document__link">
          {block.description ? <p>{block.description}</p> : null}
          <a href={block.href}>{block.label}</a>
        </div>
      );
    case "divider":
      return <hr />;
    case "table":
      return (
        <div className="structured-document__table-scroll">
          <table>
            {block.caption ? <caption>{block.caption}</caption> : null}
            <thead>
              <tr>
                {block.columns.map((column, index) => (
                  <th key={`${block.id}-column-${index}`} scope="col">
                    {renderInlineMarkdown(resource, column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.id}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-cell-${rowIndex}-${cellIndex}`}>
                      {renderInlineMarkdown(resource, cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <figure className="structured-document__quote">
          <blockquote>{renderInlineMarkdown(resource, block.text)}</blockquote>
          {block.attribution ? <figcaption>{block.attribution}</figcaption> : null}
        </figure>
      );
    case "code":
      return (
        <figure className="structured-document__code">
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
          <pre><code data-language={block.language}>{block.code}</code></pre>
        </figure>
      );
    case "resource-reference": {
      const referencedResource = getResourceById(block.resourceId);
      return (
        <aside className="structured-document__resource-reference" data-resource-reference-id={block.resourceId}>
          <p className="artifact-window__section-index">Resource reference</p>
          <h3>{block.label ?? referencedResource?.title ?? block.resourceId}</h3>
          {block.description ? <p>{block.description}</p> : null}
        </aside>
      );
    }
  }
}

export function StructuredDocumentBody({
  blocks,
  resource,
}: StructuredDocumentBodyProps) {
  const sections = groupStructuredDocumentBlocks(resource.id, blocks);

  return (
    <div
      className="structured-document"
      data-structured-document-resource={resource.id}
      data-structured-document-block-order={blocks.map((block) => block.id).join(",")}
    >
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.labelledBy}>
          {section.blocks.map((block) => (
            <div
              key={block.id}
              className="structured-document__block"
              data-structured-document-block-id={block.id}
              data-structured-document-block-type={block.type}
            >
              {renderBlock(resource, block)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
