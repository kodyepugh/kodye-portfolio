"use client";

import type { WheelEvent } from "react";
import type { Resource } from "@/types/content";
import { getPublishedFooterResources } from "@/lib/content/selectors";

export type ReservoirFooterState =
  | "closed"
  | "opening"
  | "open"
  | "closing";

type ReservoirFooterProps = {
  onInterfaceWheel: (event: WheelEvent<HTMLElement>) => void;
  onResourceSelect: (resourceId: string) => void;
  state: ReservoirFooterState;
};

type ReservoirFooterContentProps = {
  interactive?: boolean;
  onResourceSelect?: (resourceId: string) => void;
  resources?: readonly Resource[];
};

export function ReservoirFooterContent({
  interactive = true,
  onResourceSelect,
  resources = getPublishedFooterResources(),
}: ReservoirFooterContentProps) {
  return (
    <>
      <p className="reservoir-footer__copyright">© Kodye Pugh</p>
      <nav className="reservoir-footer__links" aria-label="Portfolio destinations">
        {resources.map((resource) => (
          <button
            key={resource.id}
            type="button"
            disabled={!interactive || !onResourceSelect}
            onClick={() => onResourceSelect?.(resource.id)}
          >
            {resource.title}
          </button>
        ))}
      </nav>
    </>
  );
}

export function ReservoirFooter({
  onInterfaceWheel,
  onResourceSelect,
  state,
}: ReservoirFooterProps) {
  const interactive = state === "open";
  const visible = state !== "closed";

  return (
    <div
      className="reservoir-footer-reveal"
      aria-hidden={!visible}
      data-footer-state={state}
    >
      <footer
        className="reservoir-footer"
        aria-label="Site footer"
        onWheel={onInterfaceWheel}
      >
        <ReservoirFooterContent
          interactive={interactive}
          onResourceSelect={onResourceSelect}
        />
      </footer>
    </div>
  );
}
