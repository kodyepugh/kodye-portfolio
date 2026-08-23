import type { ReactNode } from "react";
import {
  getAssetById,
  getResourceById,
} from "@/lib/content/selectors";
import type {
  Resource,
  StructuredDocumentBlock,
  StructuredDocumentEntryBlock,
  StructuredDocumentFigureBlock,
  StructuredDocumentHeadingBlock,
  StructuredDocumentPresentationProfile,
} from "@/types/content";
import { useInspectionImageLauncher } from "./InspectionImageViewer";

type StructuredDocumentBodyProps = {
  blocks: readonly StructuredDocumentBlock[];
  resource: Resource;
  onNavigateToResource?: (resourceId: string) => void;
  imageOrderOffset?: number;
  presentationProfile?: StructuredDocumentPresentationProfile;
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
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
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
      nodes.push(<em key={`${start}-emphasis`}>{match[5]}</em>);
    } else if (match[6]) {
      nodes.push(<code key={`${start}-code`}>{match[6]}</code>);
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

function StructuredDocumentFigure({
  block,
  resolved,
  resourceId,
  occurrence,
}: {
  block: StructuredDocumentFigureBlock;
  resolved: ReturnType<typeof resolveFigureAsset>;
  resourceId: string;
  occurrence: number;
}) {
  const imageAlt = block.alt || resolved?.asset?.alt || resolved?.resource.title || block.resourceId;
  const imageLauncher = useInspectionImageLauncher(
    resolved?.asset?.kind === "image"
      ? {
          id: `${resourceId}:figure:${block.id}:${occurrence}`,
          order: occurrence,
          src: resolved.asset.src,
          alt: imageAlt,
          width: resolved.asset.width,
          height: resolved.asset.height,
          caption: block.caption,
        }
      : null,
  );

  return (
    <figure
      className="artifact-window__media structured-document__figure"
      data-figure-resource-id={block.resourceId}
      data-image-occurrence={occurrence}
    >
      {resolved?.asset?.kind === "image" ? (
        <button
          className="structured-document__figure-launcher"
          type="button"
          {...imageLauncher}
          aria-label={`Open image: ${imageAlt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolved.asset.src} alt={imageAlt} width={resolved.asset.width} height={resolved.asset.height} />
        </button>
      ) : (
        <div className="structured-document__figure-fallback" role="img" aria-label={block.alt}>
          Figure Resource unavailable: {resolved?.resource.title ?? block.resourceId}
        </div>
      )}
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}

function StructuredDocumentEntry({
  block,
  resource,
}: {
  block: StructuredDocumentEntryBlock;
  resource: Resource;
}) {
  return (
    <article className="structured-document__entry">
      <div className="structured-document__entry-heading">
        <h3>{renderInlineMarkdown(resource, block.title)}</h3>
        {block.meta ? (
          <p className="structured-document__entry-meta">
            {renderInlineMarkdown(resource, block.meta)}
          </p>
        ) : null}
      </div>
      {block.subtitle ? (
        <p className="structured-document__entry-subtitle">
          {renderInlineMarkdown(resource, block.subtitle)}
        </p>
      ) : null}
      {block.supporting ? (
        <p className="structured-document__entry-supporting">
          {renderInlineMarkdown(resource, block.supporting)}
        </p>
      ) : null}
      {block.items?.length ? (
        <ul className="structured-document__entry-list">
          {block.items.map((item, index) => (
            <li key={`${block.id}-${index}`}>
              {renderInlineMarkdown(resource, item)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M7.25 1.5h1.5v7.21l2.18-2.17L12 7.6 8 11.6 4 7.6l1.07-1.06 2.18 2.17V1.5ZM2 13h12v1.5H2V13Z" fill="currentColor" />
    </svg>
  );
}

function renderBlock(
  resource: Resource,
  block: StructuredDocumentBlock,
  onNavigateToResource?: (resourceId: string) => void,
  imageOccurrence = 0,
): ReactNode {
  switch (block.type) {
    case "heading":
      return renderHeading(resource.id, block);
    case "paragraph":
      return <p>{renderInlineMarkdown(resource, block.text)}</p>;
    case "figure": {
      const resolved = resolveFigureAsset(block);
      return (
        <StructuredDocumentFigure
          block={block}
          resolved={resolved}
          resourceId={resource.id}
          occurrence={imageOccurrence}
        />
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
    case "entry":
      return <StructuredDocumentEntry block={block} resource={resource} />;
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
          {typeof block.resourceId === "string" ? (
            <button
              className="structured-document__link-action"
              type="button"
              onClick={() => onNavigateToResource?.(block.resourceId)}
              disabled={!onNavigateToResource}
              data-resource-link-id={block.resourceId}
            >
              {block.label}
            </button>
          ) : (
            <a href={block.href}>{block.label}</a>
          )}
        </div>
      );
    case "download": {
      const asset = getAssetById(block.assetId);
      if (!asset?.src) return null;
      return (
        <a
          className="structured-document__download"
          href={asset.src}
          download={asset.filename}
          aria-label={`Download ${block.label}`}
        >
          <span>{block.label}</span>
          <DownloadIcon />
        </a>
      );
    }
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
  onNavigateToResource,
  imageOrderOffset = 0,
  presentationProfile = "editorial",
}: StructuredDocumentBodyProps) {
  const sections = groupStructuredDocumentBlocks(resource.id, blocks);
  let imageOccurrence = imageOrderOffset;

  return (
    <div
      className={`structured-document structured-document--${presentationProfile}`}
      data-structured-document-resource={resource.id}
      data-structured-document-presentation-profile={presentationProfile}
      data-structured-document-block-order={blocks.map((block) => block.id).join(",")}
    >
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.labelledBy}>
              {section.blocks.map((block) => {
                const occurrence =
                  block.type === "figure" ? imageOccurrence++ : imageOccurrence;
                return (
                  <div
                    key={block.id}
                    className={`structured-document__block structured-document__block--${block.type}`}
                    data-structured-document-block-id={block.id}
                    data-structured-document-block-type={block.type}
                  >
                    {renderBlock(
                      resource,
                      block,
                      onNavigateToResource,
                      occurrence,
                    )}
                  </div>
                );
              })}
        </section>
      ))}
    </div>
  );
}
