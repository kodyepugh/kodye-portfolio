import { useEffect, useMemo, useState } from "react";
import { parseMarkdownStructuredDocument } from "@/lib/content/markdown-structured-document";
import type { Resource, StructuredMarkdownSource } from "@/types/content";
import { StructuredDocumentBody } from "./StructuredDocumentBody";

type MarkdownStructuredDocumentBodyProps = {
  resource: Resource;
  source: StructuredMarkdownSource;
  onNavigateToResource?: (resourceId: string) => void;
};

type MarkdownLoadState =
  | { status: "loading" }
  | { status: "ready"; markdown: string }
  | { status: "unavailable"; reason: string };

export function MarkdownStructuredDocumentBody({
  resource,
  source,
  onNavigateToResource,
}: MarkdownStructuredDocumentBodyProps) {
  const [loadState, setLoadState] = useState<MarkdownLoadState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(source.path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`The document source returned ${response.status}.`);
        }
        return response.text();
      })
      .then((markdown) => {
        if (!markdown.trim()) throw new Error("The document source is empty.");
        setLoadState({ status: "ready", markdown });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadState({
          status: "unavailable",
          reason:
            error instanceof Error
              ? error.message
              : "The document source could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [source.path]);

  const blocks = useMemo(
    () =>
      loadState.status === "ready"
        ? parseMarkdownStructuredDocument(loadState.markdown, {
            resourceId: resource.id,
            figureResourceIds: source.figureResourceIds,
          })
        : [],
    [loadState, resource.id, source.figureResourceIds],
  );

  if (loadState.status === "loading") {
    return (
      <section className="structured-document-source-state" aria-live="polite">
        <p className="artifact-window__section-index">Preparing document</p>
        <p>Loading the complete approved source…</p>
      </section>
    );
  }

  if (loadState.status === "unavailable") {
    return (
      <section className="structured-document-source-state" role="note">
        <p className="artifact-window__section-index">Document unavailable</p>
        <h2>{resource.title}</h2>
        <p>{loadState.reason}</p>
      </section>
    );
  }

  return (
    <StructuredDocumentBody
      blocks={blocks}
      resource={resource}
      onNavigateToResource={onNavigateToResource}
    />
  );
}
