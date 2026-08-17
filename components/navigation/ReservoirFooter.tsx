"use client";

import type { WheelEvent } from "react";

export type ReservoirFooterState =
  | "closed"
  | "opening"
  | "open"
  | "closing";

type ReservoirFooterProps = {
  onInterfaceWheel: (event: WheelEvent<HTMLElement>) => void;
  state: ReservoirFooterState;
};

const FOOTER_LINKS = ["LinkedIn", "GitHub", "Email"] as const;

type ReservoirFooterContentProps = {
  interactive?: boolean;
};

export function ReservoirFooterContent({
  interactive = true,
}: ReservoirFooterContentProps) {
  return (
    <>
      <p className="reservoir-footer__copyright">© Kodye Pugh</p>
      <nav className="reservoir-footer__links" aria-label="Footer links">
        {FOOTER_LINKS.map((label) => (
          <a
            key={label}
            href="#"
            aria-label={`${label} placeholder`}
            tabIndex={interactive ? 0 : -1}
            onClick={(event) => event.preventDefault()}
          >
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}

export function ReservoirFooter({
  onInterfaceWheel,
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
        <ReservoirFooterContent interactive={interactive} />
      </footer>
    </div>
  );
}
