"use client";

import type { ReservoirHistoryFrame } from "@/lib/reservoir/history";

type ReservoirHistoryNavigationProps = {
  depth: number;
  disabled: boolean;
  hasHiddenHistory: boolean;
  history: readonly ReservoirHistoryFrame[];
  showHome: boolean;
  showBack: boolean;
  onHistorySelect: (visitId: string) => void;
  onBack: () => void;
  onHome: () => void;
};

export function ReservoirHistoryNavigation({
  depth,
  disabled,
  hasHiddenHistory,
  history,
  showHome,
  showBack,
  onHistorySelect,
  onBack,
  onHome,
}: ReservoirHistoryNavigationProps) {
  if (!showHome && !showBack && history.length === 0) return null;

  return (
    <>
      {history.length > 0 || hasHiddenHistory ? (
        <nav
          className="reservoir-history"
          aria-label="Reservoir history"
          data-reservoir-history-count={history.length}
          data-reservoir-history-hidden={hasHiddenHistory}
        >
          <ol className="reservoir-history__list">
            {hasHiddenHistory ? (
              <li
                className="reservoir-history__hidden-indicator"
                aria-label="Older Reservoir history is hidden"
              >
                …
              </li>
            ) : null}
            {history.map((frame) => (
              <li key={frame.id} className="reservoir-history__item">
                <button
                  type="button"
                  className="reservoir-history__control"
                  aria-label={`Return to ${frame.label} Reservoir visit`}
                  disabled={disabled}
                  onClick={() => onHistorySelect(frame.id)}
                >
                  <span
                    className="reservoir-history__symbol"
                    aria-hidden="true"
                  >
                    ↰
                  </span>
                  <span className="reservoir-history__title">
                    {frame.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <nav
        className="reservoir-navigation"
        aria-label="Reservoir navigation"
        data-reservoir-navigation-depth={depth}
      >
        {showHome ? (
          <button
            type="button"
            className="reservoir-navigation__control"
            aria-label="Return to Home Reservoir"
            disabled={disabled}
            onClick={onHome}
          >
            Home
          </button>
        ) : null}
        {showBack ? (
          <button
            type="button"
            className="reservoir-navigation__control"
            aria-label="Return to previous Reservoir visit"
            disabled={disabled}
            onClick={onBack}
          >
            Back
          </button>
        ) : null}
      </nav>
    </>
  );
}
