"use client";

import { useEffect, useRef } from "react";
import type { WheelEvent } from "react";
import type { ReservoirContentNode } from "@/lib/content/reservoir-adapter";

export type ReservoirIndexState = "closed" | "opening" | "open" | "closing";

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
            {nodes.map((node, index) => (
              <li key={node.id}>
                <button
                  ref={index === 0 ? firstEntryRef : undefined}
                  type="button"
                  className="reservoir-index__entry"
                  aria-label={`${node.mediumLabel}: ${node.title}`}
                  disabled={!indexInteractive}
                  onClick={() => onSelectNode(node)}
                >
                  <span className="reservoir-index__medium">{node.mediumLabel}</span>
                  <span className="reservoir-index__title">{node.title}</span>
                </button>
              </li>
            ))}
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
