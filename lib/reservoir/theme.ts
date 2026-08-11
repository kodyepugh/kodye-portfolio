export const RESERVOIR_THEME = {
  environment: "#090b0a",
  sphere: "#232723",
  grid: "#a2a7a1",
  inspection: "#f4f6f1",
  label: "rgba(246, 247, 243, 0.96)",
  labelMuted: "rgba(246, 247, 243, 0.68)",
} as const;

export const RESERVOIR_RENDER_ORDER = {
  surface: 0,
  baseGrid: 1,
  cursorFaceGlow: 2,
  cursorEdgeGlow: 3,
  selectedFaceGlow: 4,
  selectedEdgeGlow: 5,
  artifactNode: 6,
  artifactLabel: 7,
} as const;
