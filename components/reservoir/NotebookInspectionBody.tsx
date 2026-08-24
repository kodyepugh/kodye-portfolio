import { useEffect, useMemo, useState } from "react";
import {
  parseNotebookDocument,
  resolveNotebookInspection,
  type NotebookDocument,
  type NotebookOutput,
} from "@/lib/content/notebook-inspection";
import { parseMarkdownStructuredDocument } from "@/lib/content/markdown-structured-document";
import type { Resource } from "@/types/content";
import { StructuredDocumentBody } from "./StructuredDocumentBody";
import { useInspectionImageLauncher } from "./InspectionImageViewer";

type NotebookInspectionBodyProps = {
  resource: Resource;
  onNavigateToResource?: (resourceId: string) => void;
};

type NotebookLoadState =
  | { status: "loading" }
  | { status: "ready"; sourceKey: string; notebook: NotebookDocument }
  | { status: "unavailable"; sourceKey: string; reason: string };

function NotebookOutputBody({
  output,
  executionCount,
  resourceId,
  imageOccurrence,
}: {
  output: NotebookOutput;
  executionCount: number | string | null;
  resourceId: string;
  imageOccurrence: number | null;
}) {
  const outputLabel =
    output.outputType === "stream"
      ? output.type === "text" && output.streamName
        ? output.streamName
        : "Stream"
      : `Out [${executionCount ?? " "}]:`;
  const imageSource =
    output.type === "image"
      ? `data:${output.mimeType};base64,${output.base64}`
      : null;
  const imageLauncher = useInspectionImageLauncher(
    output.type === "image" && imageOccurrence !== null
      ? {
          id: `${resourceId}:notebook-image:${imageOccurrence}`,
          order: imageOccurrence,
          src: imageSource ?? "",
          alt: "Notebook output",
        }
      : null,
  );

  return (
    <section
      className="inspection-notebook__output"
      data-notebook-output-type={output.outputType}
    >
      <p className="inspection-notebook__prompt">{outputLabel}</p>
      {output.type === "text" ? (
        <pre><code>{output.text}</code></pre>
      ) : output.type === "image" ? (
        <button
          className="inspection-notebook__image-launcher"
          type="button"
          {...imageLauncher}
          aria-label="Open notebook image output"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSource ?? ""} alt="Notebook output" />
        </button>
      ) : output.type === "error" ? (
        <div className="inspection-notebook__error" role="alert">
          <strong>{output.name}</strong>
          {output.value ? <p>{output.value}</p> : null}
          {output.traceback ? <pre><code>{output.traceback}</code></pre> : null}
        </div>
      ) : (
        <p className="inspection-notebook__unsupported-output">
          Output type {output.outputType} is not available in this read-only
          renderer.
        </p>
      )}
    </section>
  );
}

export function NotebookInspectionBody({
  resource,
  onNavigateToResource,
}: NotebookInspectionBodyProps) {
  const resolution = useMemo(
    () => resolveNotebookInspection(resource),
    [resource],
  );
  const [loadState, setLoadState] = useState<NotebookLoadState>({
    status: "loading",
  });
  const externalRepresentation = resource.representations?.find(
    (representation) =>
      representation.kind === "external" && representation.published !== false,
  );

  useEffect(() => {
    if (resolution.status === "unavailable") return;

    const controller = new AbortController();
    const sourceKey = resolution.asset.src;

    fetch(resolution.asset.src, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The notebook source returned ${response.status}.`);
        }
        return response.text();
      })
      .then((source) => {
        const parsed = parseNotebookDocument(source);
        setLoadState(
          parsed.status === "ready"
            ? { status: "ready", sourceKey, notebook: parsed.notebook }
            : {
                status: "unavailable",
                sourceKey,
                reason: parsed.reason,
              },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadState({
          status: "unavailable",
          sourceKey,
          reason:
            error instanceof Error
              ? error.message
              : "The notebook could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [resolution]);

  const displayedLoadState = useMemo<NotebookLoadState>(
    () =>
      resolution.status === "unavailable"
        ? {
            status: "unavailable",
            sourceKey: resource.id,
            reason: resolution.reason,
          }
        : loadState.status !== "loading" &&
            loadState.sourceKey === resolution.asset.src
          ? loadState
          : { status: "loading" },
    [loadState, resolution, resource.id],
  );
  const notebookCells = useMemo(
    () =>
      displayedLoadState.status === "ready"
        ? displayedLoadState.notebook.cells
        : [],
    [displayedLoadState],
  );
  const imageOccurrenceOffsets = useMemo(
    () =>
      notebookCells.reduce(
        (state, cell) => {
          const imageCount =
            cell.type === "markdown"
              ? parseMarkdownStructuredDocument(cell.source, {
                  resourceId: `${resource.id}-${cell.id}`,
                }).filter((block) => block.type === "figure").length
              : cell.outputs.filter((output) => output.type === "image").length;
          return {
            offsets: [...state.offsets, state.occurrence],
            occurrence: state.occurrence + imageCount,
          };
        },
        { offsets: [] as number[], occurrence: 0 },
      )
      .offsets,
    [notebookCells, resource.id],
  );

  if (displayedLoadState.status !== "ready") {
    return (
      <section
        className="inspection-notebook inspection-notebook--state"
        aria-live="polite"
        data-notebook-state={displayedLoadState.status}
      >
        <p className="artifact-window__section-index">
          {displayedLoadState.status === "loading"
            ? "Preparing notebook"
            : "Notebook unavailable"}
        </p>
        <h2>{resource.title}</h2>
        <p>
          {displayedLoadState.status === "loading"
            ? "Loading the approved read-only notebook…"
            : displayedLoadState.reason}
        </p>
      </section>
    );
  }

  return (
    <article
      className="inspection-notebook"
      data-notebook-state="ready"
      data-notebook-resource-id={resource.id}
      data-notebook-cell-count={displayedLoadState.notebook.cells.length}
    >
      <header className="inspection-notebook__header">
        <p className="artifact-window__section-index">Read-only notebook</p>
        <h2>{resource.title}</h2>
        {resource.subtitle ? <p>{resource.subtitle}</p> : null}
        <p className="inspection-notebook__format">
          nbformat {displayedLoadState.notebook.nbformat}.
          {displayedLoadState.notebook.nbformatMinor} · {displayedLoadState.notebook.cells.length} cells
        </p>
        {externalRepresentation?.kind === "external" ? (
          <a
            href={externalRepresentation.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View original notebook
          </a>
        ) : null}
      </header>

      <div className="inspection-notebook__cells">
        {notebookCells.map((cell, index) => {
          if (cell.type === "markdown") {
            const blocks = parseMarkdownStructuredDocument(cell.source, {
              resourceId: `${resource.id}-${cell.id}`,
            });
            const imageOrderOffset = imageOccurrenceOffsets[index] ?? 0;
            return (
              <section
                key={`${cell.id}-${index}`}
                className="inspection-notebook__cell inspection-notebook__cell--markdown"
                data-notebook-cell-type="markdown"
              >
                <StructuredDocumentBody
                  blocks={blocks}
                  resource={resource}
                  onNavigateToResource={onNavigateToResource}
                  imageOrderOffset={imageOrderOffset}
                />
              </section>
            );
          }

          return (
            <section
              key={`${cell.id}-${index}`}
              className="inspection-notebook__cell inspection-notebook__cell--code"
              data-notebook-cell-type="code"
              data-notebook-execution-count={cell.executionCount ?? ""}
            >
              <p className="inspection-notebook__prompt">
                In [{cell.executionCount ?? " "}]:
              </p>
              <pre className="inspection-notebook__code"><code>{cell.source}</code></pre>
              {cell.outputs.length > 0 ? (
              <div className="inspection-notebook__outputs">
                {cell.outputs.map((output, outputIndex) => {
                  const outputImageOccurrence =
                    output.type === "image"
                      ? (imageOccurrenceOffsets[index] ?? 0) +
                        cell.outputs
                          .slice(0, outputIndex)
                          .filter((previousOutput) => previousOutput.type === "image")
                          .length
                      : null;
                  return (
                    <NotebookOutputBody
                      key={`${cell.id}-output-${outputIndex}`}
                      output={output}
                      executionCount={cell.executionCount}
                      resourceId={resource.id}
                      imageOccurrence={outputImageOccurrence}
                    />
                  );
                })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </article>
  );
}
