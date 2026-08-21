import type {
  Asset,
  Resource,
  ResourceAssetRepresentation,
} from "../../types/content";
import { getAssetById } from "./selectors";

type JsonRecord = Record<string, unknown>;

export type NotebookTextOutput = {
  type: "text";
  outputType: "stream" | "execute_result" | "display_data";
  text: string;
  streamName?: string;
};

export type NotebookImageOutput = {
  type: "image";
  outputType: "execute_result" | "display_data";
  mimeType: "image/png";
  base64: string;
};

export type NotebookErrorOutput = {
  type: "error";
  outputType: "error";
  name: string;
  value: string;
  traceback: string;
};

export type NotebookUnsupportedOutput = {
  type: "unsupported";
  outputType: string;
};

export type NotebookOutput =
  | NotebookTextOutput
  | NotebookImageOutput
  | NotebookErrorOutput
  | NotebookUnsupportedOutput;

export type NotebookMarkdownCell = {
  id: string;
  type: "markdown";
  source: string;
};

export type NotebookCodeCell = {
  id: string;
  type: "code";
  source: string;
  executionCount: number | string | null;
  outputs: readonly NotebookOutput[];
};

export type NotebookCell = NotebookMarkdownCell | NotebookCodeCell;

export type NotebookDocument = {
  nbformat: number;
  nbformatMinor: number;
  cells: readonly NotebookCell[];
};

export type NotebookParseResult =
  | { status: "ready"; notebook: NotebookDocument }
  | { status: "unavailable"; reason: string };

export type NotebookInspectionResolution =
  | {
      status: "ready";
      asset: Asset;
      representation: ResourceAssetRepresentation;
    }
  | {
      status: "unavailable";
      reason: string;
      details: readonly string[];
    };

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown) {
  if (typeof value === "string") return value;
  if (
    Array.isArray(value) &&
    value.every((entry): entry is string => typeof entry === "string")
  ) {
    return value.join("");
  }
  return null;
}

function parseOutput(value: unknown): NotebookOutput {
  if (!isRecord(value) || typeof value.output_type !== "string") {
    throw new Error("A code-cell output is missing a valid output_type.");
  }

  if (value.output_type === "stream") {
    const text = readText(value.text);
    if (text === null) throw new Error("A stream output has invalid text.");
    return {
      type: "text",
      outputType: "stream",
      text,
      streamName: typeof value.name === "string" ? value.name : undefined,
    };
  }

  if (value.output_type === "error") {
    const traceback = readText(value.traceback);
    return {
      type: "error",
      outputType: "error",
      name: typeof value.ename === "string" ? value.ename : "Notebook error",
      value: typeof value.evalue === "string" ? value.evalue : "",
      traceback: traceback ?? "",
    };
  }

  if (
    value.output_type === "execute_result" ||
    value.output_type === "display_data"
  ) {
    const data = isRecord(value.data) ? value.data : {};
    const text = readText(data["text/plain"]);
    if (text !== null) {
      return {
        type: "text",
        outputType: value.output_type,
        text,
      };
    }

    const image = readText(data["image/png"]);
    if (image !== null && /^[A-Za-z0-9+/=\s]+$/.test(image)) {
      return {
        type: "image",
        outputType: value.output_type,
        mimeType: "image/png",
        base64: image.replace(/\s+/g, ""),
      };
    }
  }

  return { type: "unsupported", outputType: value.output_type };
}

function parseCell(value: unknown, index: number): NotebookCell {
  if (!isRecord(value) || typeof value.cell_type !== "string") {
    throw new Error(`Notebook cell ${index + 1} has no valid cell_type.`);
  }

  const source = readText(value.source);
  if (source === null) {
    throw new Error(`Notebook cell ${index + 1} has invalid source content.`);
  }

  const id =
    typeof value.id === "string" && value.id.trim()
      ? value.id
      : `cell-${index + 1}`;

  if (value.cell_type === "markdown") {
    return { id, type: "markdown", source };
  }

  if (value.cell_type === "code") {
    if (!Array.isArray(value.outputs)) {
      throw new Error(`Notebook code cell ${index + 1} has invalid outputs.`);
    }
    const executionCount =
      typeof value.execution_count === "number" ||
      typeof value.execution_count === "string"
        ? value.execution_count
        : null;
    return {
      id,
      type: "code",
      source,
      executionCount,
      outputs: value.outputs.map(parseOutput),
    };
  }

  throw new Error(
    `Notebook cell ${index + 1} uses unsupported type ${value.cell_type}.`,
  );
}

export function parseNotebookDocument(source: string): NotebookParseResult {
  try {
    const value: unknown = JSON.parse(source);
    if (!isRecord(value)) throw new Error("The notebook root must be an object.");
    if (typeof value.nbformat !== "number" || value.nbformat < 4) {
      throw new Error("The notebook does not declare a supported nbformat.");
    }
    if (!Array.isArray(value.cells)) {
      throw new Error("The notebook does not contain a cells array.");
    }

    return {
      status: "ready",
      notebook: {
        nbformat: value.nbformat,
        nbformatMinor:
          typeof value.nbformat_minor === "number" ? value.nbformat_minor : 0,
        cells: value.cells.map(parseCell),
      },
    };
  } catch (error) {
    return {
      status: "unavailable",
      reason:
        error instanceof Error
          ? error.message
          : "The notebook could not be parsed.",
    };
  }
}

function compareRepresentations(
  a: { order?: number; id: string },
  b: { order?: number; id: string },
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
}

export function getPublishedNotebookRepresentations(
  resource: Pick<Resource, "representations">,
) {
  return (resource.representations ?? [])
    .filter(
      (
        representation,
      ): representation is ResourceAssetRepresentation =>
        representation.kind === "asset" && representation.published !== false,
    )
    .slice()
    .sort(compareRepresentations);
}

export function resolveNotebookInspection(
  resource: Pick<Resource, "representations" | "id">,
  assetById: typeof getAssetById = getAssetById,
): NotebookInspectionResolution {
  const details: string[] = [];

  for (const representation of getPublishedNotebookRepresentations(resource)) {
    const asset = assetById(representation.assetId);
    if (!asset) {
      details.push(
        `Notebook representation ${representation.id} points to missing asset ${representation.assetId}.`,
      );
      continue;
    }
    if (asset.kind !== "document" && asset.kind !== "other") {
      details.push(
        `Notebook representation ${representation.id} resolves to unsupported asset kind ${asset.kind}.`,
      );
      continue;
    }
    if (!asset.src.trim()) {
      details.push(
        `Notebook representation ${representation.id} has no usable source.`,
      );
      continue;
    }
    if (
      asset.mimeType !== "application/x-ipynb+json" &&
      asset.mimeType !== "application/json"
    ) {
      details.push(
        `Notebook representation ${representation.id} has unsupported MIME type ${asset.mimeType ?? "unknown"}.`,
      );
      continue;
    }
    return { status: "ready", asset, representation };
  }

  return {
    status: "unavailable",
    reason: "This Resource does not expose a usable published notebook Asset.",
    details,
  };
}
