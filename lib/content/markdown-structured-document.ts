import type { StructuredDocumentBlock } from "../../types/content";

type MarkdownParseOptions = {
  resourceId: string;
  figureResourceIds?: Readonly<Record<string, string>>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "block";
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return splitTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function basename(path: string) {
  return path.split("/").at(-1)?.split(/[?#]/)[0] ?? path;
}

export function parseMarkdownStructuredDocument(
  markdown: string,
  options: MarkdownParseOptions,
): readonly StructuredDocumentBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: StructuredDocumentBlock[] = [];
  const idCounts = new Map<string, number>();

  function blockId(seed: string) {
    const base = `${options.resourceId}-${slugify(seed)}`;
    const count = (idCounts.get(base) ?? 0) + 1;
    idCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  }

  for (let index = 0; index < lines.length; ) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed || /^\[Back to top\]\(#top\)$/i.test(trimmed)) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```\s*([^\s]*)/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({
        id: blockId(`code-${blocks.length + 1}`),
        type: "code",
        code: code.join("\n"),
        language: fence[1] || undefined,
      });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      index += 1;
      if (heading[1].length === 1) continue;
      const text = stripInlineMarkdown(heading[2]);
      blocks.push({
        id: blockId(text),
        type: "heading",
        level: Math.min(Math.max(heading[1].length, 2), 6) as 2 | 3 | 4 | 5 | 6,
        text,
      });
      continue;
    }

    if (/^(---+|\*\*\*+|___+)$/.test(trimmed)) {
      blocks.push({ id: blockId(`divider-${blocks.length + 1}`), type: "divider" });
      index += 1;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/);
    if (image) {
      const sourceKey = basename(image[2]);
      const resourceId = options.figureResourceIds?.[sourceKey];
      if (resourceId) {
        blocks.push({
          id: blockId(`figure-${sourceKey}`),
          type: "figure",
          resourceId,
          alt: image[1] || sourceKey,
        });
      } else {
        blocks.push({
          id: blockId(`image-reference-${sourceKey}`),
          type: "paragraph",
          text: image[1] || `Image: ${sourceKey}`,
        });
      }
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      const text = quote.join(" ").trim();
      const important = /^\*\*(essential interpretation boundary|important|warning)/i.test(text);
      blocks.push(
        important
          ? {
              id: blockId(`callout-${blocks.length + 1}`),
              type: "callout",
              tone: "important",
              text: stripInlineMarkdown(text),
            }
          : {
              id: blockId(`quote-${blocks.length + 1}`),
              type: "quote",
              text: stripInlineMarkdown(text),
            },
      );
      continue;
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const style = ordered ? "ordered" : "unordered";
      const items: string[] = [];
      const matcher = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const match = lines[index].trim().match(matcher);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({
        id: blockId(`list-${blocks.length + 1}`),
        type: "list",
        style,
        items,
      });
      continue;
    }

    if (
      trimmed.startsWith("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const columns = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({
        id: blockId(`table-${blocks.length + 1}`),
        type: "table",
        columns,
        rows,
      });
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        /^(#{1,6})\s+/.test(next) ||
        /^```/.test(next) ||
        /^(---+|\*\*\*+|___+)$/.test(next) ||
        /^>/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+[.)]\s+/.test(next) ||
        /^!\[[^\]]*\]\(/.test(next) ||
        (next.startsWith("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1]))
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }
    blocks.push({
      id: blockId(`paragraph-${blocks.length + 1}`),
      type: "paragraph",
      text: paragraph.join(" "),
    });
  }

  return blocks;
}
