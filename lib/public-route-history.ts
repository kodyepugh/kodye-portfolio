import type { ReservoirHistoryFrame } from "@/lib/reservoir/history";
import type { ReservoirContext } from "@/types/reservoir";

export const PUBLIC_ROUTE_HISTORY_STATE_KEY = "digitalReservoirPublicRoute";

export type PublicRouteRestorationDescriptor = {
  reservoirHistory: ReservoirHistoryFrame[];
  inspectedResourceId: string | null;
};

export type PublicRouteHistoryEntry = {
  [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true;
  entryId: string;
  path: string;
  initial: boolean;
  restoration: PublicRouteRestorationDescriptor;
  returnPath?: string;
  closeAction?: "back" | "replace";
};

export type BrowserRestorationIntent = {
  revision: number;
  entryId: string;
  restoration: PublicRouteRestorationDescriptor;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReservoirContext(
  value: unknown,
  depth = 0,
): value is ReservoirContext {
  if (!value || typeof value !== "object" || depth > 16) return false;
  const context = value as Partial<ReservoirContext>;
  if (context.kind === "collection") {
    return typeof context.collectionId === "string";
  }
  return (
    context.kind === "query" &&
    isStringArray(context.resultIds) &&
    isReservoirContext(context.returnContext, depth + 1) &&
    (context.label === undefined || typeof context.label === "string")
  );
}

function isReservoirHistoryFrame(
  value: unknown,
): value is ReservoirHistoryFrame {
  if (!value || typeof value !== "object") return false;
  const frame = value as Partial<ReservoirHistoryFrame>;
  const inspectionReturn = frame.inspectionReturn;
  return (
    typeof frame.id === "string" &&
    typeof frame.label === "string" &&
    isReservoirContext(frame.context) &&
    (inspectionReturn === undefined ||
      (typeof inspectionReturn === "object" &&
        inspectionReturn !== null &&
        typeof inspectionReturn.resourceId === "string" &&
        typeof inspectionReturn.scrollY === "number" &&
        Number.isFinite(inspectionReturn.scrollY) &&
        typeof inspectionReturn.postContentProgress === "number" &&
        Number.isFinite(inspectionReturn.postContentProgress)))
  );
}

function isPublicRouteRestorationDescriptor(
  value: unknown,
): value is PublicRouteRestorationDescriptor {
  if (!value || typeof value !== "object") return false;
  const restoration = value as Partial<PublicRouteRestorationDescriptor>;
  return (
    Array.isArray(restoration.reservoirHistory) &&
    restoration.reservoirHistory.length > 0 &&
    restoration.reservoirHistory.every(isReservoirHistoryFrame) &&
    (restoration.inspectedResourceId === null ||
      typeof restoration.inspectedResourceId === "string")
  );
}

export function createPublicRouteHistoryEntry({
  entryId,
  path,
  initial,
  restoration,
  returnPath,
  closeAction,
}: Omit<PublicRouteHistoryEntry, typeof PUBLIC_ROUTE_HISTORY_STATE_KEY>) {
  return {
    [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true as const,
    entryId,
    path,
    initial,
    restoration,
    ...(returnPath ? { returnPath } : {}),
    ...(closeAction ? { closeAction } : {}),
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
    typeof entry.entryId === "string" &&
    typeof entry.path === "string" &&
    typeof entry.initial === "boolean" &&
    isPublicRouteRestorationDescriptor(entry.restoration)
    ? (entry as PublicRouteHistoryEntry)
    : null;
}

export function createBrowserRestorationIntent(
  entry: PublicRouteHistoryEntry,
  revision: number,
): BrowserRestorationIntent {
  return {
    revision,
    entryId: entry.entryId,
    restoration: entry.restoration,
  };
}

export function isCurrentBrowserRestorationIntent(
  intent: BrowserRestorationIntent,
  currentRevision: number,
) {
  return intent.revision === currentRevision;
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
