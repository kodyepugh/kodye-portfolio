"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { WheelEvent } from "react";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";
import { formatObjectDate } from "@/lib/content/object-metadata";
import type { ObjectMedium } from "@/types/content";

export type ReservoirIndexState = "closed" | "opening" | "open" | "closing";

function MediumIcon({ medium }: { medium: ObjectMedium }) {
  const paths: Record<ObjectMedium, ReactNode> = {
    collection: <path d="M3.5 3.5h6v6h-6zm11 0h6v6h-6zm-11 11h6v6h-6zm11 0h6v6h-6z" />,
    document: <path d="M6 2.5h8l4 4v15H6zM14 2.5v4h4M9 11h6M9 15h6M9 19h4" />,
    image: <><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="8" cy="9" r="1.5" /><path d="m4 18 5.5-5 3.5 3 2.5-2.5L20 18" /></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="1" /><path d="m16 10 5-3v10l-5-3zM8 9.5l4 2.5-4 2.5z" /></>,
    audio: <path d="M4 14v-4M8 17V7M12 20V4M16 17V7M20 14v-4" />,
    form: <><rect x="5" y="4" width="14" height="17" rx="1" /><path d="M9 4.5h6v3H9zM9 11h6M9 15h6" /></>,
    link: <path d="M9.5 14.5 14.5 9.5M8 17H6a4 4 0 0 1 0-8h3M16 7h2a4 4 0 0 1 0 8h-3" />,
    data: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7" /><path d="M2 20h21" /></>,
    code: <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" />,
    other: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4M12 16h.01" /></>,
  };

  return (
    <svg className="reservoir-index__icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[medium]}
    </svg>
  );
}

type ReservoirIndexProps = {
  contextLabel: string;
  controlsLocked?: boolean;
  nodes: readonly ReservoirContentNode[];
  state: ReservoirIndexState;
  onClose: () => void;
  onOpen: () => void;
  onSelectNode: (node: ReservoirContentNode) => void;
  onInterfaceWheel: (event: WheelEvent<HTMLElement>) => void;
  onOutsideWheel: (event: WheelEvent<HTMLElement>) => void;
};

export function ReservoirIndex({
  contextLabel,
  controlsLocked = false,
  nodes,
  state,
  onClose,
  onOpen,
  onSelectNode,
  onInterfaceWheel,
  onOutsideWheel,
}: ReservoirIndexProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstEntryRef = useRef<HTMLButtonElement>(null);
  const previousStateRef = useRef<ReservoirIndexState>(state);
  const indexVisible = state !== "closed";
  const indexInteractive = state === "open" && !controlsLocked;

  useEffect(() => {
    if (state === "open" && previousStateRef.current !== "open") {
      firstEntryRef.current?.focus({ preventScroll: true });
    }
    if (state === "closed" && previousStateRef.current !== "closed") {
      triggerRef.current?.focus({ preventScroll: true });
    }
    previousStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state !== "open" || controlsLocked) return;
    firstEntryRef.current?.focus({ preventScroll: true });
  }, [contextLabel, controlsLocked, state]);

  useEffect(() => {
    if (!indexVisible) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || controlsLocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }

    window.addEventListener("keydown", closeOnEscape, { capture: true });
    return () =>
      window.removeEventListener("keydown", closeOnEscape, { capture: true });
  }, [controlsLocked, indexVisible, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="reservoir-index-trigger"
        aria-controls="reservoir-index"
        aria-expanded={indexVisible}
        disabled={state !== "closed"}
        onClick={onOpen}
      >
        Index
      </button>

      <div className="reservoir-index-reveal" data-index-state={state}>
        <section
          id="reservoir-index"
          className="reservoir-index"
          aria-label={`${contextLabel} Reservoir Index`}
          aria-hidden={!indexVisible}
          onWheel={onInterfaceWheel}
        >
          <header className="reservoir-index__header">
            <p>Index</p>
            <button
              type="button"
              className="reservoir-index__close"
              disabled={!indexInteractive}
              onClick={onClose}
            >
              <span>Close Index</span>
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <p className="sr-only" aria-live="polite">
            {contextLabel}. {nodes.length} {nodes.length === 1 ? "Object" : "Objects"}.
          </p>
          <ul className="reservoir-index__list" aria-live="polite">
            {nodes.map((node, index) => {
              const added = formatObjectDate(node.createdAt) ?? "Unavailable";
              const modified = formatObjectDate(node.updatedAt) ?? "Unavailable";

              return (
                <li key={node.id} className="reservoir-index__item">
                  <button
                    ref={index === 0 ? firstEntryRef : undefined}
                    type="button"
                    className="reservoir-index__entry"
                    aria-label={`${node.title}. ${node.mediumLabel}. Added ${added}. Modified ${modified}.`}
                    disabled={!indexInteractive}
                    onClick={() => onSelectNode(node)}
                  >
                    <MediumIcon medium={node.medium} />
                    <span className="reservoir-index__title">{node.title}</span>
                    <span className="reservoir-index__metadata">
                      <span>{node.mediumLabel}</span>
                      <span>Added {added}</span>
                      <span>Modified {modified}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div
        className="reservoir-index__outside-dismiss"
        aria-hidden="true"
        data-index-state={state}
        onPointerDown={(event) => {
          if (!indexInteractive) return;
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
        onWheel={onOutsideWheel}
      />
    </>
  );
}
