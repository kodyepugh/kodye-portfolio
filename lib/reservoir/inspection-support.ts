export type InspectionWindowPhase = "deploying" | "reading" | "closing";

export function shouldShowInspectionSupportRail(
  supportingResourceCount: number,
) {
  return supportingResourceCount > 0;
}

export function isInspectionSupportRailInteractive(
  phase: InspectionWindowPhase,
) {
  return phase === "reading";
}

export function canRequestInspectionSupportNavigation(
  phase: InspectionWindowPhase,
  pendingNavigationTarget: string | null,
) {
  return isInspectionSupportRailInteractive(phase) && pendingNavigationTarget === null;
}
