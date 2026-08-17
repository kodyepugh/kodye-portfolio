"use client";

import { useEffect, useRef } from "react";
import type { WheelEvent } from "react";
import type {
  ActiveExploreFilter,
  DirectArtifactId,
} from "@/types/reservoir";

export type ReservoirMenuState = "closed" | "opening" | "open" | "closing";

type ReservoirMenuProps = {
  activeFilter: ActiveExploreFilter;
  controlsLocked?: boolean;
  state: ReservoirMenuState;
  onClose: () => void;
  onDirectSelect: (artifactId: DirectArtifactId) => void;
  onFilterSelect: (filter: ActiveExploreFilter) => void;
  onOpen: () => void;
  onInterfaceWheel: (event: WheelEvent<HTMLElement>) => void;
  onOutsideWheel: (event: WheelEvent<HTMLElement>) => void;
};

const EXPLORE_OPTIONS: Array<{
  id: ActiveExploreFilter;
  label: string;
}> = [
  { id: "all", label: "All Objects" },
  { id: "collections", label: "Collections" },
  { id: "work", label: "Work" },
  { id: "self", label: "Self" },
  { id: "world", label: "World" },
  { id: "inquiry", label: "Inquiry" },
];

const DIRECT_OPTIONS: Array<{ id: DirectArtifactId; label: string }> = [
  { id: "about", label: "About" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
];

export function ReservoirMenu({
  activeFilter,
  controlsLocked = false,
  state,
  onClose,
  onDirectSelect,
  onFilterSelect,
  onOpen,
  onInterfaceWheel,
  onOutsideWheel,
}: ReservoirMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousStateRef = useRef<ReservoirMenuState>(state);
  const menuVisible = state !== "closed";
  const menuInteractive = state === "open" && !controlsLocked;

  useEffect(() => {
    if (state === "open" && previousStateRef.current !== "open") {
      closeRef.current?.focus({ preventScroll: true });
    }
    if (
      state === "closed" &&
      previousStateRef.current !== "closed"
    ) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    previousStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!menuVisible) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }

    window.addEventListener("keydown", closeOnEscape, { capture: true });
    return () =>
      window.removeEventListener("keydown", closeOnEscape, {
        capture: true,
      });
  }, [menuVisible, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="reservoir-menu-trigger"
        aria-controls="reservoir-control-menu"
        aria-expanded={menuVisible}
        disabled={state !== "closed"}
        onClick={onOpen}
      >
        Menu
      </button>

      <div
        className="reservoir-menu-reveal"
        data-menu-state={state}
      >
        <section
          id="reservoir-control-menu"
          className="reservoir-menu"
          aria-label="Reservoir controls"
          aria-hidden={!menuVisible}
          onWheel={onInterfaceWheel}
        >
          <div className="reservoir-menu__content">
            <header className="reservoir-menu__header">
              <p>Active reservoir controls</p>
              <button
                ref={closeRef}
                type="button"
                className="reservoir-menu__close"
                disabled={!menuInteractive}
                onClick={onClose}
              >
                <span>Close Menu</span>
                <span aria-hidden="true">×</span>
              </button>
            </header>

            <div className="reservoir-menu__groups">
              <fieldset className="reservoir-menu__group">
                <legend>Explore</legend>
                <div className="reservoir-menu__options">
                  {EXPLORE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="reservoir-menu__option"
                      aria-pressed={activeFilter === option.id}
                      disabled={!menuInteractive}
                      onClick={() => onFilterSelect(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="reservoir-menu__group reservoir-menu__group--direct">
                <legend>Direct</legend>
                <div className="reservoir-menu__options">
                  {DIRECT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="reservoir-menu__option reservoir-menu__option--direct"
                      aria-label={`Open ${option.label} artifact`}
                      disabled={!menuInteractive}
                      onClick={() => onDirectSelect(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </section>
      </div>

      <div
        className="reservoir-menu__outside-dismiss"
        aria-hidden="true"
        data-menu-state={state}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
        onWheel={onOutsideWheel}
      />
    </>
  );
}
