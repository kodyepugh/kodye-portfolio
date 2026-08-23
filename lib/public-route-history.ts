export const PUBLIC_ROUTE_HISTORY_STATE_KEY = "digitalReservoirPublicRoute";

export type PublicRouteHistoryEntry = {
  [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true;
  path: string;
  initial: boolean;
  returnPath?: string;
  closeAction?: "back" | "replace";
};

export function createPublicRouteHistoryEntry({
  path,
  initial,
  returnPath,
}: Omit<PublicRouteHistoryEntry, typeof PUBLIC_ROUTE_HISTORY_STATE_KEY>) {
  return {
    [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true as const,
    path,
    initial,
    ...(returnPath ? { returnPath } : {}),
  };
}

export function getPublicRouteHistoryEntry(
  state: unknown,
): PublicRouteHistoryEntry | null {
  if (
    !state ||
    typeof state !== "object" ||
    !(PUBLIC_ROUTE_HISTORY_STATE_KEY in state)
  ) {
    return null;
  }

  const entry = state as Partial<PublicRouteHistoryEntry>;
  return entry[PUBLIC_ROUTE_HISTORY_STATE_KEY] === true &&
    typeof entry.path === "string" &&
    typeof entry.initial === "boolean"
    ? (entry as PublicRouteHistoryEntry)
    : null;
}

export function getInspectionCloseHistoryAction(
  entry: PublicRouteHistoryEntry | null,
  returnPath: string,
) {
  if (entry?.closeAction) return entry.closeAction;
  return entry && !entry.initial && entry.returnPath === returnPath
    ? "back"
    : "replace";
}
