/* eslint-disable @typescript-eslint/no-require-imports -- This focused runner loads the typed registry directly. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveRepositoryAliases(
  request,
  parent,
  isMain,
  options,
) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(projectRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { ROOT_COLLECTION_ID } = require(path.join(
  projectRoot,
  "content/digital-reservoir/collections.ts",
));
const { ARTIFACT_IDS, RESOURCE_IDS } = require(path.join(
  projectRoot,
  "content/digital-reservoir/artifacts.ts",
));
const { resolvePublicRoute } = require(path.join(
  projectRoot,
  "lib/public-routing.ts",
));
const {
  PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION,
  advanceBrowserRecoveryGuard,
  applyPublicRouteHistoryTransaction,
  arePublicRouteRestorationsEqual,
  createBrowserRecoveryGuardKey,
  createBrowserRestorationIntent,
  createPublicRouteHistoryEntry,
  createRouteRestorationDescriptor,
  getBrowserEntryRecoveryDecision,
  getPublicRouteHistoryEntry,
  getPublicRouteRestorationFingerprint,
  getPublicRouteRestorationPath,
  isCurrentBrowserRestorationIntent,
  isPublicRouteHistoryBackSelectionMatch,
  planPublicRouteHistoryBackFallback,
  planPublicRouteHistoryTransaction,
} = require(path.join(projectRoot, "lib/public-route-history.ts"));
const {
  getNextReservoirHistoryVisitSequence,
  resolveReservoirHistoryVisit,
  truncateReservoirHistoryAtVisit,
} = require(path.join(
  projectRoot,
  "lib/reservoir/history.ts",
));
const {
  canReuseActiveReservoirResource,
  resolveContextualResourceHistory,
} = require(path.join(
  projectRoot,
  "lib/reservoir/direct-resource-routing.ts",
));

assert.deepEqual(resolvePublicRoute(), { kind: "root" });
assert.deepEqual(resolvePublicRoute(["bellabeat-wellness-analysis"]), {
  kind: "resource",
  resourceId: ARTIFACT_IDS.bellabeat,
});
assert.deepEqual(resolvePublicRoute(["resume"]), {
  kind: "resource",
  resourceId: ARTIFACT_IDS.resume,
});
assert.deepEqual(resolvePublicRoute(["contact"]), {
  kind: "resource",
  resourceId: ARTIFACT_IDS.contact,
});
assert.deepEqual(resolvePublicRoute(["q", "resume"]), {
  kind: "query-resource",
  resourceId: ARTIFACT_IDS.resume,
});
assert.equal(resolvePublicRoute(["q"]).kind, "not-found");
assert.equal(resolvePublicRoute(["q", "unknown-resource"]).kind, "not-found");
assert.equal(resolvePublicRoute(["q", "about"]).kind, "not-found");
assert.equal(
  resolvePublicRoute(["bellabeat-wellness-analysis-repository"]).kind,
  "resource",
);
assert.deepEqual(resolvePublicRoute(["digital-reservoir"]), {
  kind: "redirect-root",
});
assert.equal(resolvePublicRoute(["about"]).kind, "not-found");
assert.equal(resolvePublicRoute(["unknown-slug"]).kind, "not-found");
assert.deepEqual(
  resolvePublicRoute(["digital-reservoir", "bellabeat-wellness-analysis"]),
  {
    kind: "redirect-resource",
    resourceId: ARTIFACT_IDS.bellabeat,
  },
);
assert.equal(
  resolvePublicRoute(["digital-reservoir", "kodyepugh-symbol"]).kind,
  "not-found",
);
assert.equal(resolvePublicRoute(["work"]).kind, "not-found");

const syntheticPublishedResource = "synthetic-dual-member-resource";
const collectionAContext = {
  kind: "collection",
  collectionId: "synthetic-collection-a",
};
const collectionBContext = {
  kind: "collection",
  collectionId: "synthetic-collection-b",
};
assert.equal(
  canReuseActiveReservoirResource({
    resourceId: syntheticPublishedResource,
    activeContext: collectionAContext,
    activeResourceIds: [syntheticPublishedResource],
    requestedCollectionId: collectionBContext.collectionId,
  }),
  false,
);
const syntheticHistory = [
  {
    id: "synthetic-root-visit",
    context: { kind: "collection", collectionId: "synthetic-root" },
    label: "Home",
  },
  {
    id: "synthetic-collection-a-visit",
    context: collectionAContext,
    label: "Collection A",
  },
];
const createSyntheticFrame = (context) => ({
  id: `synthetic-${context.collectionId}-visit`,
  context,
  label: context.collectionId,
});
const firstContextualHistory = resolveContextualResourceHistory(
  syntheticHistory,
  collectionBContext.collectionId,
  createSyntheticFrame,
);
assert.deepEqual(
  firstContextualHistory.map((frame) => frame.context.collectionId),
  ["synthetic-root", "synthetic-collection-a", "synthetic-collection-b"],
);
const restoredContextualHistory = resolveContextualResourceHistory(
  firstContextualHistory,
  collectionBContext.collectionId,
  createSyntheticFrame,
);
assert.deepEqual(
  restoredContextualHistory.map((frame) => frame.context.collectionId),
  ["synthetic-root", "synthetic-collection-a", "synthetic-collection-b"],
);
assert.equal(
  canReuseActiveReservoirResource({
    resourceId: syntheticPublishedResource,
    activeContext: collectionBContext,
    activeResourceIds: [syntheticPublishedResource],
    requestedCollectionId: collectionBContext.collectionId,
  }),
  true,
);
assert.equal(
  canReuseActiveReservoirResource({
    resourceId: syntheticPublishedResource,
    activeContext: collectionAContext,
    activeResourceIds: [syntheticPublishedResource],
  }),
  true,
);
assert.equal(
  canReuseActiveReservoirResource({
    resourceId: syntheticPublishedResource,
    activeContext: {
      kind: "query",
      resultIds: [syntheticPublishedResource],
      returnContext: collectionAContext,
    },
    activeResourceIds: [syntheticPublishedResource],
    requestedCollectionId: collectionBContext.collectionId,
  }),
  false,
);

const browserRootFrame = {
  id: "browser-root-visit",
  context: { kind: "collection", collectionId: ROOT_COLLECTION_ID },
  label: "Digital Reservoir",
};
const browserRootRestoration = {
  reservoirHistory: [browserRootFrame],
  inspectedResourceId: null,
};
const bellabeatReturnFrame = {
  resourceId: ARTIFACT_IDS.bellabeat,
  scrollY: 4_320,
  postContentProgress: 0.375,
};
const browserBellabeatRestoration = {
  reservoirHistory: [browserRootFrame],
  inspectedResourceId: ARTIFACT_IDS.bellabeat,
};
const browserBellabeatReturnRestoration = {
  reservoirHistory: [
    { ...browserRootFrame, inspectionReturn: bellabeatReturnFrame },
  ],
  inspectedResourceId: ARTIFACT_IDS.bellabeat,
};
const repositoryQueryFrame = {
  id: "browser-repository-query-visit",
  context: {
    kind: "query",
    resultIds: [RESOURCE_IDS.bellabeatRepository],
    returnContext: browserRootFrame.context,
  },
  label: "Bellabeat Wellness Analysis Repository",
};
const browserRepositoryQueryRestoration = {
  reservoirHistory: [
    { ...browserRootFrame, inspectionReturn: bellabeatReturnFrame },
    repositoryQueryFrame,
  ],
  inspectedResourceId: null,
};
const browserRepositoryInspectionRestoration = {
  reservoirHistory: browserRepositoryQueryRestoration.reservoirHistory,
  inspectedResourceId: RESOURCE_IDS.bellabeatRepository,
};

assert.equal(getPublicRouteRestorationPath(browserRootRestoration), "/");
assert.equal(
  getPublicRouteRestorationPath(browserRepositoryQueryRestoration),
  "/q/bellabeat-wellness-analysis-repository",
);
assert.equal(
  getPublicRouteRestorationPath(browserRepositoryInspectionRestoration),
  "/bellabeat-wellness-analysis-repository",
);

function createFakeBrowserHistory(initialEntry) {
  const entries = [initialEntry];
  let index = 0;
  return {
    get state() {
      return entries[index];
    },
    get index() {
      return index;
    },
    get entries() {
      return entries;
    },
    pushState(state) {
      entries.splice(index + 1, entries.length, state);
      index += 1;
    },
    replaceState(state) {
      entries[index] = state;
    },
    back() {
      index = Math.max(0, index - 1);
    },
    forward() {
      index = Math.min(entries.length - 1, index + 1);
    },
  };
}

function applyPlannedTransaction(history, mode, restoration, entryId) {
  const transaction = planPublicRouteHistoryTransaction({
    currentEntry: getPublicRouteHistoryEntry(history.state),
    restoration,
    mode,
    entryId,
  });
  applyPublicRouteHistoryTransaction(history, transaction);
  return transaction;
}

const rootEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-root",
  initial: true,
  restoration: browserRootRestoration,
});
const fakeHistory = createFakeBrowserHistory(rootEntry);
assert.equal(
  applyPlannedTransaction(
    fakeHistory,
    "push",
    browserBellabeatRestoration,
    "browser-entry-bellabeat",
  ).kind,
  "push",
);
assert.equal(fakeHistory.state.path, "/bellabeat-wellness-analysis");

assert.equal(
  applyPlannedTransaction(
    fakeHistory,
    "replace",
    browserBellabeatReturnRestoration,
    "unused-replacement-id",
  ).kind,
  "replace",
);
const originatingBellabeatEntryId = fakeHistory.state.entryId;
assert.equal(originatingBellabeatEntryId, "browser-entry-bellabeat");

assert.equal(
  applyPlannedTransaction(
    fakeHistory,
    "push",
    browserRepositoryQueryRestoration,
    "browser-entry-repository-query",
  ).kind,
  "push",
);
const repositoryQueryEntryId = fakeHistory.state.entryId;
const repositoryQueryVisitId =
  fakeHistory.state.restoration.reservoirHistory.at(-1).id;
assert.equal(
  applyPlannedTransaction(
    fakeHistory,
    "push",
    browserRepositoryInspectionRestoration,
    "browser-entry-repository-inspection",
  ).kind,
  "push",
);

assert.deepEqual(
  fakeHistory.entries.slice(1).map((entry) => entry.path),
  [
    "/bellabeat-wellness-analysis",
    "/q/bellabeat-wellness-analysis-repository",
    "/bellabeat-wellness-analysis-repository",
  ],
);
fakeHistory.back();
assert.equal(fakeHistory.state.entryId, repositoryQueryEntryId);
assert.equal(
  fakeHistory.state.restoration.reservoirHistory.at(-1).id,
  repositoryQueryVisitId,
);
fakeHistory.forward();
assert.equal(fakeHistory.state.entryId, "browser-entry-repository-inspection");
assert.equal(
  fakeHistory.state.restoration.reservoirHistory.at(-1).id,
  repositoryQueryVisitId,
);
fakeHistory.back();
fakeHistory.back();
assert.equal(fakeHistory.state.entryId, originatingBellabeatEntryId);
assert.deepEqual(
  fakeHistory.state.restoration.reservoirHistory[0].inspectionReturn,
  bellabeatReturnFrame,
);
fakeHistory.forward();
fakeHistory.forward();
assert.equal(fakeHistory.state.entryId, "browser-entry-repository-inspection");

const closeInspectionPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(fakeHistory.state),
  restoration: browserRepositoryQueryRestoration,
  mode: "back-or-replace",
  entryId: "unused-close-id",
});
assert.equal(closeInspectionPlan.kind, "back");
assert.equal(closeInspectionPlan.expectedEntryId, repositoryQueryEntryId);
assert.equal(
  closeInspectionPlan.expectedPath,
  "/q/bellabeat-wellness-analysis-repository",
);
applyPublicRouteHistoryTransaction(fakeHistory, closeInspectionPlan);
assert.equal(fakeHistory.state.entryId, repositoryQueryEntryId);
assert.equal(
  isPublicRouteHistoryBackSelectionMatch(
    closeInspectionPlan,
    getPublicRouteHistoryEntry(fakeHistory.state),
  ),
  true,
);

const interfaceBackPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(fakeHistory.state),
  restoration: browserBellabeatReturnRestoration,
  mode: "back-or-push",
  entryId: "unused-interface-back-id",
});
assert.equal(interfaceBackPlan.kind, "back");
assert.equal(interfaceBackPlan.expectedEntryId, originatingBellabeatEntryId);
applyPublicRouteHistoryTransaction(fakeHistory, interfaceBackPlan);
assert.equal(fakeHistory.state.entryId, originatingBellabeatEntryId);
assert.equal(
  isPublicRouteHistoryBackSelectionMatch(
    interfaceBackPlan,
    getPublicRouteHistoryEntry(fakeHistory.state),
  ),
  true,
);

const directInitialEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-initial-resume",
  initial: true,
  restoration: {
    reservoirHistory: [browserRootFrame],
    inspectedResourceId: ARTIFACT_IDS.resume,
  },
});
const directInitialClosePlan = planPublicRouteHistoryTransaction({
  currentEntry: directInitialEntry,
  restoration: browserRootRestoration,
  mode: "back-or-replace",
  entryId: "unused-initial-close-id",
});
assert.equal(directInitialClosePlan.kind, "replace");
assert.equal(directInitialClosePlan.entry.entryId, directInitialEntry.entryId);

const stalePredecessorHistory = createFakeBrowserHistory(
  createPublicRouteHistoryEntry({
    entryId: "browser-entry-stale-origin",
    initial: true,
    restoration: browserBellabeatReturnRestoration,
  }),
);
applyPlannedTransaction(
  stalePredecessorHistory,
  "push",
  browserRepositoryQueryRestoration,
  "browser-entry-stale-query",
);
applyPlannedTransaction(
  stalePredecessorHistory,
  "push",
  browserRepositoryInspectionRestoration,
  "browser-entry-stale-inspection",
);
stalePredecessorHistory.back();
stalePredecessorHistory.back();
applyPlannedTransaction(
  stalePredecessorHistory,
  "replace",
  browserRootRestoration,
  "unused-root-replacement-id",
);
assert.equal(stalePredecessorHistory.state.path, "/");
stalePredecessorHistory.forward();
assert.equal(
  stalePredecessorHistory.state.entryId,
  "browser-entry-stale-query",
);
const stalePredecessorPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(stalePredecessorHistory.state),
  restoration: browserBellabeatReturnRestoration,
  mode: "back-or-push",
  entryId: "browser-entry-stale-fallback",
});
assert.equal(stalePredecessorPlan.kind, "back");
applyPublicRouteHistoryTransaction(
  stalePredecessorHistory,
  stalePredecessorPlan,
);
const staleSelectedEntry = getPublicRouteHistoryEntry(
  stalePredecessorHistory.state,
);
assert.equal(staleSelectedEntry.path, "/");
assert.equal(
  isPublicRouteHistoryBackSelectionMatch(
    stalePredecessorPlan,
    staleSelectedEntry,
  ),
  false,
);
const staleFallbackPlan = planPublicRouteHistoryBackFallback(
  stalePredecessorPlan,
  staleSelectedEntry,
);
assert.equal(staleFallbackPlan.kind, "push");
applyPublicRouteHistoryTransaction(
  stalePredecessorHistory,
  staleFallbackPlan,
);
assert.equal(
  stalePredecessorHistory.state.entryId,
  "browser-entry-stale-fallback",
);
assert.equal(
  stalePredecessorHistory.state.path,
  "/bellabeat-wellness-analysis",
);
assert.equal(stalePredecessorHistory.entries.length, 2);

const repeatedQueryFrame = {
  ...repositoryQueryFrame,
  id: "browser-repository-query-visit-repeated",
};
const repeatedRepositoryInspectionRestoration = {
  reservoirHistory: [browserRootFrame, repeatedQueryFrame],
  inspectedResourceId: RESOURCE_IDS.bellabeatRepository,
};
assert.equal(
  getPublicRouteRestorationPath(repeatedRepositoryInspectionRestoration),
  getPublicRouteRestorationPath(browserRepositoryInspectionRestoration),
);
assert.equal(
  arePublicRouteRestorationsEqual(
    repeatedRepositoryInspectionRestoration,
    browserRepositoryInspectionRestoration,
  ),
  false,
);
const samePathPlan = planPublicRouteHistoryTransaction({
  currentEntry: createPublicRouteHistoryEntry({
    entryId: "browser-entry-repository-earlier",
    initial: false,
    restoration: browserRepositoryInspectionRestoration,
  }),
  restoration: repeatedRepositoryInspectionRestoration,
  mode: "push",
  entryId: "browser-entry-repository-later",
});
assert.equal(samePathPlan.kind, "push");
assert.equal(
  samePathPlan.entry.path,
  "/bellabeat-wellness-analysis-repository",
);
assert.notEqual(
  samePathPlan.entry.predecessor.restorationFingerprint,
  getPublicRouteRestorationFingerprint(repeatedRepositoryInspectionRestoration),
);

const exactNoOpPlan = planPublicRouteHistoryTransaction({
  currentEntry: samePathPlan.entry,
  restoration: repeatedRepositoryInspectionRestoration,
  mode: "push",
  entryId: "unused-no-op-id",
});
assert.equal(exactNoOpPlan.kind, "no-write");

const serializedEntry = JSON.parse(JSON.stringify(samePathPlan.entry));
assert.deepEqual(
  getPublicRouteHistoryEntry(serializedEntry, serializedEntry.path),
  samePathPlan.entry,
);
const ownedQueryReload = getBrowserEntryRecoveryDecision({
  state: JSON.parse(
    JSON.stringify(
      createPublicRouteHistoryEntry({
        entryId: "browser-entry-owned-query-reload",
        initial: false,
        restoration: browserRepositoryQueryRestoration,
      }),
    ),
  ),
  selectedPath: "/q/bellabeat-wellness-analysis-repository",
  route: resolvePublicRoute([
    "q",
    "bellabeat-wellness-analysis-repository",
  ]),
  replacementEntryId: "unused-owned-query-reload-id",
});
assert.equal(ownedQueryReload.kind, "restore");
assert.equal(ownedQueryReload.entry.entryId, "browser-entry-owned-query-reload");
assert.equal(
  ownedQueryReload.entry.restoration.reservoirHistory.at(-1).id,
  repositoryQueryVisitId,
);
assert.deepEqual(
  ownedQueryReload.entry.restoration.reservoirHistory[0].inspectionReturn,
  bellabeatReturnFrame,
);
const ownedInspectionReload = getBrowserEntryRecoveryDecision({
  state: JSON.parse(
    JSON.stringify(
      createPublicRouteHistoryEntry({
        entryId: "browser-entry-owned-inspection-reload",
        initial: false,
        restoration: browserRepositoryInspectionRestoration,
      }),
    ),
  ),
  selectedPath: "/bellabeat-wellness-analysis-repository",
  route: resolvePublicRoute(["bellabeat-wellness-analysis-repository"]),
  replacementEntryId: "unused-owned-inspection-reload-id",
});
assert.equal(ownedInspectionReload.kind, "restore");
assert.equal(
  ownedInspectionReload.entry.restoration.reservoirHistory.at(-1).id,
  repositoryQueryVisitId,
);
const firstSamePathReload = getBrowserEntryRecoveryDecision({
  state: createPublicRouteHistoryEntry({
    entryId: "browser-entry-first-same-path-reload",
    initial: false,
    restoration: browserRepositoryInspectionRestoration,
  }),
  selectedPath: "/bellabeat-wellness-analysis-repository",
  route: resolvePublicRoute(["bellabeat-wellness-analysis-repository"]),
  replacementEntryId: "unused-first-same-path-id",
});
const secondSamePathReload = getBrowserEntryRecoveryDecision({
  state: createPublicRouteHistoryEntry({
    entryId: "browser-entry-second-same-path-reload",
    initial: false,
    restoration: repeatedRepositoryInspectionRestoration,
  }),
  selectedPath: "/bellabeat-wellness-analysis-repository",
  route: resolvePublicRoute(["bellabeat-wellness-analysis-repository"]),
  replacementEntryId: "unused-second-same-path-id",
});
assert.equal(firstSamePathReload.kind, "restore");
assert.equal(secondSamePathReload.kind, "restore");
assert.notEqual(
  firstSamePathReload.entry.restoration.reservoirHistory.at(-1).id,
  secondSamePathReload.entry.restoration.reservoirHistory.at(-1).id,
);
assert.equal(
  getPublicRouteHistoryEntry(
    { ...serializedEntry, path: "/resume" },
    "/resume",
  ),
  null,
);
assert.equal(
  getPublicRouteHistoryEntry({
    digitalReservoirPublicRoute: true,
    schemaVersion: PUBLIC_ROUTE_HISTORY_SCHEMA_VERSION,
    entryId: "browser-entry-invalid",
    path: "/",
    initial: true,
    restoration: { reservoirHistory: [], inspectedResourceId: null },
  }),
  null,
);

const staleIntent = createBrowserRestorationIntent(
  createPublicRouteHistoryEntry({
    entryId: "browser-entry-stale",
    initial: false,
    restoration: browserBellabeatReturnRestoration,
  }),
  7,
);
const latestIntent = createBrowserRestorationIntent(samePathPlan.entry, 8);
assert.equal(isCurrentBrowserRestorationIntent(staleIntent, 8), false);
assert.equal(isCurrentBrowserRestorationIntent(latestIntent, 8), true);
assert.equal(latestIntent.entry, samePathPlan.entry);
assert.equal(latestIntent.path, samePathPlan.entry.path);

const legacyRecovery = getBrowserEntryRecoveryDecision({
  state: { path: "/bellabeat-wellness-analysis" },
  selectedPath: "/bellabeat-wellness-analysis",
  route: resolvePublicRoute(["bellabeat-wellness-analysis"]),
  replacementEntryId: "browser-entry-legacy-replacement",
});
assert.equal(legacyRecovery.kind, "reinitialize");
assert.equal(legacyRecovery.reason, "legacy-entry");
assert.equal(legacyRecovery.entry.path, "/bellabeat-wellness-analysis");

const invalidOwnedRecovery = getBrowserEntryRecoveryDecision({
  state: { ...serializedEntry, path: "/resume" },
  selectedPath: "/resume",
  route: resolvePublicRoute(["resume"]),
  replacementEntryId: "browser-entry-invalid-replacement",
});
assert.equal(invalidOwnedRecovery.kind, "reinitialize");
assert.equal(invalidOwnedRecovery.reason, "invalid-owned-entry");
assert.equal(invalidOwnedRecovery.entry.path, "/resume");
const invalidOwnedRecoveryHistory = createFakeBrowserHistory({
  ...serializedEntry,
  path: "/resume",
});
applyPublicRouteHistoryTransaction(invalidOwnedRecoveryHistory, {
  kind: "replace",
  entry: invalidOwnedRecovery.entry,
});
assert.equal(invalidOwnedRecoveryHistory.entries.length, 1);
assert.equal(
  invalidOwnedRecoveryHistory.state.entryId,
  invalidOwnedRecovery.entry.entryId,
);
assert.equal(invalidOwnedRecoveryHistory.state.path, "/resume");
assert.deepEqual(
  getBrowserEntryRecoveryDecision({
    state: null,
    selectedPath: "/unknown-resource",
    route: resolvePublicRoute(["unknown-resource"]),
    replacementEntryId: "unused-invalid-route-id",
  }),
  { kind: "hard-reload", path: "/unknown-resource" },
);
assert.deepEqual(
  getBrowserEntryRecoveryDecision({
    state: null,
    selectedPath: "/digital-reservoir",
    route: resolvePublicRoute(["digital-reservoir"]),
    replacementEntryId: "unused-redirect-id",
  }),
  { kind: "redirect-root" },
);
assert.deepEqual(
  getBrowserEntryRecoveryDecision({
    state: null,
    selectedPath: "/digital-reservoir/bellabeat-wellness-analysis",
    route: resolvePublicRoute([
      "digital-reservoir",
      "bellabeat-wellness-analysis",
    ]),
    replacementEntryId: "unused-resource-redirect-id",
  }),
  {
    kind: "redirect-resource",
    path: "/bellabeat-wellness-analysis",
  },
);

const recoveryGuardKey = createBrowserRecoveryGuardKey({
  entryId: "browser-entry-broken",
  path: "/bellabeat-wellness-analysis-repository",
  reason: "convergence-mismatch",
});
const firstRecoveryAttempt = advanceBrowserRecoveryGuard(
  null,
  recoveryGuardKey,
);
const repeatedRecoveryAttempt = advanceBrowserRecoveryGuard(
  firstRecoveryAttempt.guard,
  recoveryGuardKey,
);
const distinctRecoveryAttempt = advanceBrowserRecoveryGuard(
  repeatedRecoveryAttempt.guard,
  createBrowserRecoveryGuardKey({
    entryId: "browser-entry-other",
    path: "/resume",
    reason: "unavailable-inspection-target",
  }),
);
assert.deepEqual(firstRecoveryAttempt, {
  guard: { key: recoveryGuardKey, attempts: 1 },
  exhausted: false,
});
assert.equal(repeatedRecoveryAttempt.guard.attempts, 2);
assert.equal(repeatedRecoveryAttempt.exhausted, true);
assert.equal(distinctRecoveryAttempt.guard.attempts, 1);
assert.equal(distinctRecoveryAttempt.exhausted, false);

const routeDerivedQuery = createRouteRestorationDescriptor(
  resolvePublicRoute(["q", "bellabeat-wellness-analysis-repository"]),
  "browser-entry-explicit-query",
);
assert.equal(
  getPublicRouteRestorationPath(routeDerivedQuery),
  "/q/bellabeat-wellness-analysis-repository",
);
assert.equal(routeDerivedQuery.inspectedResourceId, null);
const routeDerivedDirect = createRouteRestorationDescriptor(
  resolvePublicRoute(["bellabeat-wellness-analysis-repository"]),
  "browser-entry-direct-repository",
);
assert.equal(
  getPublicRouteRestorationPath(routeDerivedDirect),
  "/bellabeat-wellness-analysis-repository",
);
assert.equal(
  routeDerivedDirect.reservoirHistory.at(-1).context.kind,
  "query",
);

const branchTruncatedHistory = truncateReservoirHistoryAtVisit(
  browserRepositoryInspectionRestoration.reservoirHistory,
  browserRootFrame.id,
);
assert.equal(branchTruncatedHistory.length, 1);
assert.equal(
  browserRepositoryInspectionRestoration.reservoirHistory.length,
  2,
);

const repeatedRootHistory = [
  browserRootFrame,
  repositoryQueryFrame,
  {
    ...browserRootFrame,
    id: "reservoir-visit-repeated-root",
    inspectionReturn: bellabeatReturnFrame,
  },
  {
    ...repositoryQueryFrame,
    id: "reservoir-visit-after-repeated-root",
  },
];
const sameContextVisitResolution = resolveReservoirHistoryVisit(
  repeatedRootHistory,
  "reservoir-visit-repeated-root",
  browserRootFrame.context,
);
assert.equal(sameContextVisitResolution.activeContextMatches, true);
assert.equal(sameContextVisitResolution.history.length, 3);
assert.equal(
  sameContextVisitResolution.targetFrame.inspectionReturn.resourceId,
  bellabeatReturnFrame.resourceId,
);
assert.equal(
  browserRepositoryInspectionRestoration.reservoirHistory.at(-1).id,
  repositoryQueryVisitId,
);
assert.equal(
  getNextReservoirHistoryVisitSequence([
    browserRootFrame,
    { ...repositoryQueryFrame, id: "reservoir-visit-2" },
    { ...repositoryQueryFrame, id: "reservoir-visit-9" },
  ]),
  10,
);

console.log("Public routing validation passed.");
