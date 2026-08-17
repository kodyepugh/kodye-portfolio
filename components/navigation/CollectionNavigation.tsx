"use client";

import { useEffect, useRef } from "react";

type CollectionAncestor = {
  id: string;
  title: string;
};

type CollectionNavigationProps = {
  ancestors: readonly CollectionAncestor[];
  depth: number;
  disabled: boolean;
  onAncestorSelect: (collectionId: string) => void;
  onBack: () => void;
  onHome: () => void;
};

export function CollectionNavigation({
  ancestors,
  depth,
  disabled,
  onAncestorSelect,
  onBack,
  onHome,
}: CollectionNavigationProps) {
  const ancestryViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = ancestryViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = viewport.scrollWidth - viewport.clientWidth;
  }, [ancestors]);

  if (depth === 0) return null;

  return (
    <>
      {ancestors.length > 0 ? (
        <nav
          className="collection-ancestry"
          aria-label="Collection ancestry"
          data-collection-ancestry-count={ancestors.length}
        >
          <div
            ref={ancestryViewportRef}
            className="collection-ancestry__viewport"
          >
            <ol className="collection-ancestry__list">
              {ancestors.map((ancestor) => (
                <li key={ancestor.id} className="collection-ancestry__item">
                  <button
                    type="button"
                    className="collection-ancestry__control"
                    aria-label={`Return to ${ancestor.title} collection`}
                    disabled={disabled}
                    onClick={() => onAncestorSelect(ancestor.id)}
                  >
                    <span
                      className="collection-ancestry__symbol"
                      aria-hidden="true"
                    >
                      ↰
                    </span>
                    <span className="collection-ancestry__title">
                      {ancestor.title}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      ) : null}

      <nav
        className="collection-navigation"
        aria-label="Collection navigation"
        data-collection-navigation-depth={depth}
      >
        <button
          type="button"
          className="collection-navigation__control"
          aria-label="Return to Home collection"
          disabled={disabled}
          onClick={onHome}
        >
          Home
        </button>
        {depth >= 2 ? (
          <button
            type="button"
            className="collection-navigation__control"
            aria-label="Return to previous collection"
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
