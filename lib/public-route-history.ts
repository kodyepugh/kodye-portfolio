import { ROOT_COLLECTION_ID } from "@/content/digital-reservoir/collections";
import {
  getReservoirContentNodeBySemanticId,
  getReservoirContentNodes,
  getReservoirContentNodesBySemanticIds,
} from "@/lib/content/reservoir-adapter";
import {
  getCollectionById,
  getPublishedResourceCollections,
  getResourceById,
} from "@/lib/content/selectors";
import type { PublicRoute } from "@/lib/public-routing";
import {
  getQueryReservoirHistoryLabel,
  type ReservoirHistoryFrame,
} from "@/lib/reservoir/history";
import { canInspectResource } from "@/lib/reservoir/inspection";
import type { InspectionReturnFrame } from "@/lib/reservoir/inspection-return";
import type { ReservoirContext } from "@/types/reservoir";

export const PUBLIC_ROUTE_HISTORY_STATE_KEY = "digitalReservoirPublicRoute";
export const PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION = 2;

export type PublicRouteRestorationDescriptor = {
  reservoirHistory: ReservoirHistoryFrame[];
  inspectedResourceId: string | null;
};

export type PublicRouteHistoryPredecessor = {
  entryId: string;
  restorationFingerprint: string;
};

export type PublicRouteHistoryEntry = {
  [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true;
  schemaVersion: typeof PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION;
  entryId: string;
  path: string;
  initial: boolean;
  restoration: PublicRouteRestorationDescriptor;
  predecessor?: PublicRouteHistoryPredecessor;
};

export type BrowserRestorationIntent = {
  revision: number;
  entryId: string;
  path: string;
  restoration: PublicRouteRestorationDescriptor;
  restorationFingerprint: string;
};

export type PublicRouteHistoryTransactionMode =
  | "push"
  | "replace"
  | "back-or-push"
  | "back-or-replace";

export type PublicRouteHistoryTransactionPlan =
  | { kind: "push" | "replace"; entry: PublicRouteHistoryEntry }
  | { kind: "back"; expectedEntryId: string }
  | { kind: "no-write"; entry: PublicRouteHistoryEntry | null }
  | { kind: "invalid" };

type PublicRouteHistoryPort = Pick<
  History,
  "back" | "pushState" | "replaceState"
> & {
  readonly state: unknown;
};

export type BrowserEntryRecoveryDecision =
  | { kind: "restore"; entry: PublicRouteHistoryEntry }
  | {
      kind: "reinitialize";
      entry: PublicRouteHistoryEntry;
      reason: "invalid-owned-entry" | "legacy-entry";
    }
  | { kind: "redirect-root" }
  | { kind: "hard-reload"; path: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isInspectionReturnFrame(
  value: unknown,
): value is InspectionReturnFrame {
  if (!value || typeof value !== "object") return false;
  const frame = value as Partial<InspectionReturnFrame>;
  return (
    typeof frame.resourceId === "string" &&
    typeof frame.scrollY === "number" &&
    Number.isFinite(frame.scrollY) &&
    frame.scrollY >= 0 &&
    typeof frame.postContentProgress === "number" &&
    Number.isFinite(frame.postContentProgress) &&
    frame.postContentProgress >= 0 &&
    frame.postContentProgress <= 1
  );
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
  return (
    typeof frame.id === "string" &&
    typeof frame.label === "string" &&
    isReservoirContext(frame.context) &&
    (frame.inspectionReturn === undefined ||
      isInspectionReturnFrame(frame.inspectionReturn))
  );
}

function getReservoirContextNodes(context: ReservoirContext) {
  return context.kind === "collection"
    ? getReservoirContentNodes(context.collectionId)
    : getReservoirContentNodesBySemanticIds(context.resultIds);
}

function isPublishedReservoirContext(
  context: ReservoirContext,
  depth = 0,
): boolean {
  if (depth > 16) return false;
  if (context.kind === "collection") {
    return getCollectionById(context.collectionId)?.published === true;
  }
  return (
    context.resultIds.length > 0 &&
    new Set(context.resultIds).size === context.resultIds.length &&
    context.resultIds.every(
      (resultId) => getReservoirContentNodeBySemanticId(resultId) !== null,
    ) &&
    isPublishedReservoirContext(context.returnContext, depth + 1)
  );
}

function resourceExistsInContext(
  resourceId: string,
  context: ReservoirContext,
) {
  return getReservoirContextNodes(context).some(
    (node) => node.kind !== "collection" && node.id === resourceId,
  );
}

function getPersistentReturnContext(
  context: ReservoirContext,
): ReservoirContext {
  return context.kind === "collection"
    ? context
    : getPersistentReturnContext(context.returnContext);
}

export function getPublicPathForReservoirContext(context: ReservoirContext) {
  if (!isPublishedReservoirContext(context)) return null;
  if (context.kind === "collection") {
    if (context.collectionId === ROOT_COLLECTION_ID) return "/";
    const collection = getCollectionById(context.collectionId);
    return collection ? `/${collection.slug}` : null;
  }

  if (context.resultIds.length !== 1) return null;
  const resource = getResourceById(context.resultIds[0]);
  return resource?.published === true ? `/q/${resource.slug}` : null;
}

export function getPublicInspectionPath(
  resourceId: string,
  context: ReservoirContext,
) {
  const resource = getResourceById(resourceId);
  if (
    !resource ||
    resource.published !== true ||
    !canInspectResource(resource) ||
    !isPublishedReservoirContext(context) ||
    !resourceExistsInContext(resourceId, context)
  ) {
    return null;
  }

  const returnContext = getPersistentReturnContext(context);
  if (returnContext.kind === "collection") {
    const collection = getCollectionById(returnContext.collectionId);
    if (
      collection &&
      collection.id !== ROOT_COLLECTION_ID &&
      collection.published === true &&
      getPublishedResourceCollections(resource.id).some(
        (candidate) => candidate.id === collection.id,
      )
    ) {
      return `/${collection.slug}/${resource.slug}`;
    }
  }

  return `/${resource.slug}`;
}

export function isPublicRouteRestorationDescriptor(
  value: unknown,
): value is PublicRouteRestorationDescriptor {
  if (!value || typeof value !== "object") return false;
  const restoration = value as Partial<PublicRouteRestorationDescriptor>;
  if (
    !Array.isArray(restoration.reservoirHistory) ||
    restoration.reservoirHistory.length === 0 ||
    !restoration.reservoirHistory.every(isReservoirHistoryFrame) ||
    !(
      restoration.inspectedResourceId === null ||
      typeof restoration.inspectedResourceId === "string"
    )
  ) {
    return false;
  }

  const history = restoration.reservoirHistory;
  const rootFrame = history[0];
  if (
    rootFrame.context.kind !== "collection" ||
    rootFrame.context.collectionId !== ROOT_COLLECTION_ID ||
    new Set(history.map((frame) => frame.id)).size !== history.length ||
    !history.every((frame) => {
      if (!isPublishedReservoirContext(frame.context)) return false;
      if (!frame.inspectionReturn) return true;
      const resource = getResourceById(frame.inspectionReturn.resourceId);
      return (
        resource?.published === true &&
        canInspectResource(resource) &&
        resourceExistsInContext(resource.id, frame.context)
      );
    })
  ) {
    return false;
  }

  if (restoration.inspectedResourceId) {
    const activeContext = history.at(-1)?.context;
    const resource = getResourceById(restoration.inspectedResourceId);
    return Boolean(
      activeContext &&
        resource?.published === true &&
        canInspectResource(resource) &&
        resourceExistsInContext(resource.id, activeContext),
    );
  }

  return true;
}

export function getPublicRouteRestorationPath(
  restoration: PublicRouteRestorationDescriptor,
) {
  if (!isPublicRouteRestorationDescriptor(restoration)) return null;
  const activeContext = restoration.reservoirHistory.at(-1)?.context;
  if (!activeContext) return null;
  return restoration.inspectedResourceId
    ? getPublicInspectionPath(restoration.inspectedResourceId, activeContext)
    : getPublicPathForReservoirContext(activeContext);
}

export function getPublicRouteRestorationFingerprint(
  restoration: PublicRouteRestorationDescriptor,
) {
  return JSON.stringify(restoration);
}

export function arePublicRouteRestorationsEqual(
  left: PublicRouteRestorationDescriptor,
  right: PublicRouteRestorationDescriptor,
) {
  return (
    getPublicRouteRestorationFingerprint(left) ===
    getPublicRouteRestorationFingerprint(right)
  );
}

export function areInspectionReturnFramesEqual(
  left: InspectionReturnFrame | null | undefined,
  right: InspectionReturnFrame | null | undefined,
) {
  if (!left || !right) return left === right;
  return (
    left.resourceId === right.resourceId &&
    left.scrollY === right.scrollY &&
    left.postContentProgress === right.postContentProgress
  );
}

function getReservoirHistoryLabel(context: ReservoirContext) {
  if (context.kind === "collection") {
    return getCollectionById(context.collectionId)?.title ?? "Collection";
  }
  return getQueryReservoirHistoryLabel(
    context.resultIds.map(
      (resultId) =>
        getReservoirContentNodeBySemanticId(resultId)?.title ?? "",
    ),
    context.label,
  );
}

export function createRouteRestorationDescriptor(
  route: PublicRoute,
  entryId: string,
): PublicRouteRestorationDescriptor | null {
  if (route.kind === "not-found" || route.kind === "redirect-root") {
    return null;
  }
  const rootContext: ReservoirContext = {
    kind: "collection",
    collectionId: ROOT_COLLECTION_ID,
  };
  const rootFrame: ReservoirHistoryFrame = {
    id: `${entryId}-root`,
    context: rootContext,
    label: getReservoirHistoryLabel(rootContext),
  };
  const withContext = (context: ReservoirContext) =>
    getPublicPathForReservoirContext(context) === "/"
      ? [rootFrame]
      : [
          rootFrame,
          {
            id: `${entryId}-target`,
            context,
            label: getReservoirHistoryLabel(context),
          },
        ];

  if (route.kind === "root") {
    return { reservoirHistory: [rootFrame], inspectedResourceId: null };
  }
  if (route.kind === "collection") {
    return {
      reservoirHistory: withContext({
        kind: "collection",
        collectionId: route.collectionId,
      }),
      inspectedResourceId: null,
    };
  }
  if (route.kind === "contextual-resource") {
    return {
      reservoirHistory: withContext({
        kind: "collection",
        collectionId: route.collectionId,
      }),
      inspectedResourceId: route.resourceId,
    };
  }
  if (route.kind === "query-resource") {
    return {
      reservoirHistory: withContext({
        kind: "query",
        resultIds: [route.resourceId],
        returnContext: rootContext,
      }),
      inspectedResourceId: null,
    };
  }

  const resourceExistsAtRoot = resourceExistsInContext(
    route.resourceId,
    rootContext,
  );
  return {
    reservoirHistory: resourceExistsAtRoot
      ? [rootFrame]
      : withContext({
          kind: "query",
          resultIds: [route.resourceId],
          returnContext: rootContext,
        }),
    inspectedResourceId: route.resourceId,
  };
}

export function createPublicRouteHistoryEntry({
  entryId,
  initial,
  restoration,
  predecessor,
}: {
  entryId: string;
  initial: boolean;
  restoration: PublicRouteRestorationDescriptor;
  predecessor?: PublicRouteHistoryPredecessor;
}): PublicRouteHistoryEntry {
  const path = getPublicRouteRestorationPath(restoration);
  if (!path) {
    throw new Error("Cannot create a browser entry for an invalid restoration.");
  }
  return {
    [PUBLIC_ROUTE_HISTORY_STATE_KEY]: true,
    schemaVersion: PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION,
    entryId,
    path,
    initial,
    restoration,
    ...(predecessor ? { predecessor } : {}),
  };
}

function isPublicRouteHistoryPredecessor(
  value: unknown,
): value is PublicRouteHistoryPredecessor {
  if (!value || typeof value !== "object") return false;
  const predecessor = value as Partial<PublicRouteHistoryPredecessor>;
  return (
    typeof predecessor.entryId === "string" &&
    typeof predecessor.restorationFingerprint === "string"
  );
}

export function hasPublicRouteHistoryMarker(state: unknown) {
  return Boolean(
    state &&
      typeof state === "object" &&
      PUBLIC_ROUTE_HISTORY_STATE_KEY in state &&
      (state as Record<string, unknown>)[PUBLIC_ROUTE_HISTORY_STATE_KEY] ===
        true,
  );
}

export function getPublicRouteHistoryEntry(
  state: unknown,
  selectedPath?: string,
): PublicRouteHistoryEntry | null {
  if (!hasPublicRouteHistoryMarker(state)) return null;

  const entry = state as Partial<PublicRouteHistoryEntry>;
  if (
    entry.schemaVersion !== PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION ||
    typeof entry.entryId !== "string" ||
    typeof entry.path !== "string" ||
    typeof entry.initial !== "boolean" ||
    !isPublicRouteRestorationDescriptor(entry.restoration) ||
    (entry.predecessor !== undefined &&
      !isPublicRouteHistoryPredecessor(entry.predecessor))
  ) {
    return null;
  }

  const canonicalPath = getPublicRouteRestorationPath(entry.restoration);
  return canonicalPath === entry.path &&
    (selectedPath === undefined || selectedPath === entry.path)
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
    path: entry.path,
    restoration: entry.restoration,
    restorationFingerprint: getPublicRouteRestorationFingerprint(
      entry.restoration,
    ),
  };
}

export function isCurrentBrowserRestorationIntent(
  intent: BrowserRestorationIntent,
  currentRevision: number,
) {
  return intent.revision === currentRevision;
}

export function planPublicRouteHistoryTransaction({
  currentEntry,
  restoration,
  mode,
  entryId,
  initial = false,
}: {
  currentEntry: PublicRouteHistoryEntry | null;
  restoration: PublicRouteRestorationDescriptor;
  mode: PublicRouteHistoryTransactionMode;
  entryId: string;
  initial?: boolean;
}): PublicRouteHistoryTransactionPlan {
  const path = getPublicRouteRestorationPath(restoration);
  if (!path) return { kind: "invalid" };
  if (
    currentEntry?.path === path &&
    arePublicRouteRestorationsEqual(currentEntry.restoration, restoration)
  ) {
    return { kind: "no-write", entry: currentEntry };
  }

  const restorationFingerprint =
    getPublicRouteRestorationFingerprint(restoration);
  if (
    (mode === "back-or-push" || mode === "back-or-replace") &&
    currentEntry?.predecessor?.restorationFingerprint ===
      restorationFingerprint
  ) {
    return {
      kind: "back",
      expectedEntryId: currentEntry.predecessor.entryId,
    };
  }

  const fallbackMode =
    mode === "back-or-replace"
      ? "replace"
      : mode === "back-or-push"
        ? "push"
        : mode;
  const predecessor =
    fallbackMode === "push" && currentEntry
      ? {
          entryId: currentEntry.entryId,
          restorationFingerprint: getPublicRouteRestorationFingerprint(
            currentEntry.restoration,
          ),
        }
      : currentEntry?.predecessor;
  const entry = createPublicRouteHistoryEntry({
    entryId:
      fallbackMode === "replace" && currentEntry
        ? currentEntry.entryId
        : entryId,
    initial:
      fallbackMode === "replace" && currentEntry
        ? currentEntry.initial
        : initial,
    restoration,
    predecessor,
  });
  return { kind: fallbackMode, entry };
}

export function applyPublicRouteHistoryTransaction(
  history: PublicRouteHistoryPort,
  transaction: PublicRouteHistoryTransactionPlan,
) {
  if (transaction.kind === "push") {
    history.pushState(transaction.entry, "", transaction.entry.path);
    return transaction.entry;
  }
  if (transaction.kind === "replace") {
    const existingState =
      history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState(
      { ...existingState, ...transaction.entry },
      "",
      transaction.entry.path,
    );
    return transaction.entry;
  }
  if (transaction.kind === "back") {
    history.back();
    return null;
  }
  return transaction.kind === "no-write" ? transaction.entry : null;
}

export function getBrowserEntryRecoveryDecision({
  state,
  selectedPath,
  route,
  replacementEntryId,
}: {
  state: unknown;
  selectedPath: string;
  route: PublicRoute;
  replacementEntryId: string;
}): BrowserEntryRecoveryDecision {
  if (route.kind === "redirect-root") return { kind: "redirect-root" };
  if (route.kind === "not-found") {
    return { kind: "hard-reload", path: selectedPath };
  }

  const ownedEntry = getPublicRouteHistoryEntry(state, selectedPath);
  if (ownedEntry) return { kind: "restore", entry: ownedEntry };

  const restoration = createRouteRestorationDescriptor(
    route,
    replacementEntryId,
  );
  if (
    !restoration ||
    getPublicRouteRestorationPath(restoration) !== selectedPath
  ) {
    return { kind: "hard-reload", path: selectedPath };
  }

  return {
    kind: "reinitialize",
    entry: createPublicRouteHistoryEntry({
      entryId: replacementEntryId,
      initial: true,
      restoration,
    }),
    reason: hasPublicRouteHistoryMarker(state)
      ? "invalid-owned-entry"
      : "legacy-entry",
  };
}
