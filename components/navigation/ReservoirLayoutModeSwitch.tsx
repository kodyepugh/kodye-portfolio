"use client";

import type { ReservoirLayoutMode } from "@/lib/reservoir/layout";

type ReservoirLayoutModeSwitchProps = {
  disabled: boolean;
  mode: ReservoirLayoutMode;
  onChange: (mode: ReservoirLayoutMode) => void;
};

function ReservoirLayoutModeGlyph({
  mode,
}: {
  mode: ReservoirLayoutMode;
}) {
  const distributed = mode === "distributed";

  return (
    <svg
      className="reservoir-layout-switch__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.8"
      />
      {distributed ? (
        <>
          <circle cx="6.2" cy="8" r="0.9" fill="currentColor" />
          <circle cx="16.8" cy="6.6" r="0.9" fill="currentColor" />
          <circle cx="18.2" cy="13.8" r="0.9" fill="currentColor" />
          <circle cx="10.1" cy="17.5" r="0.9" fill="currentColor" />
          <circle cx="7.4" cy="13.4" r="0.9" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="11.8" cy="6.6" r="0.9" fill="currentColor" />
          <circle cx="14.7" cy="8.1" r="0.9" fill="currentColor" />
          <circle cx="9.5" cy="8.8" r="0.9" fill="currentColor" />
          <circle cx="13.5" cy="10.8" r="0.9" fill="currentColor" />
          <circle cx="10.6" cy="11.8" r="0.9" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export function ReservoirLayoutModeSwitch({
  disabled,
  mode,
  onChange,
}: ReservoirLayoutModeSwitchProps) {
  return (
    <nav
      className="reservoir-layout-switch"
      aria-label="Reservoir layout mode"
      data-layout-mode={mode}
    >
      <button
        type="button"
        className="reservoir-layout-switch__button"
        aria-label="Distributed layout"
        aria-pressed={mode === "distributed"}
        disabled={disabled}
        title="Distributed"
        onClick={() => onChange("distributed")}
      >
        <ReservoirLayoutModeGlyph mode="distributed" />
      </button>
      <button
        type="button"
        className="reservoir-layout-switch__button"
        aria-label="Focused layout"
        aria-pressed={mode === "focused"}
        disabled={disabled}
        title="Focused"
        onClick={() => onChange("focused")}
      >
        <ReservoirLayoutModeGlyph mode="focused" />
      </button>
    </nav>
  );
}
