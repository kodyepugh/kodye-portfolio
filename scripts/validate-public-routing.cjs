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
  canUseCurrentDocumentBrowserBack,
  createBrowserRecoveryGuardKey,
  createBrowserRestorationIntent,
  createPublicRouteHistoryEntry,
  createPublicRouteHistoryDocumentRegistry,
  createRouteRestorationDescriptor,
  getBrowserEntryRecoveryDecision,
  getPublicRouteHistoryBackHandoffDecision,
  getPublicRouteHistoryEntry,
  getPublicRouteRestorationFingerprint,
  getPublicRouteRestorationPath,
  isCurrentBrowserRestorationIntent,
  isPublicRouteHistoryBackSelectionMatch,
  mergePublicRouteHistoryReplacementState,
  planPublicRouteHistoryBackFallback,
  planPublicRouteHistoryTransaction,
  registerPublicRouteHistoryDocumentEntry,
  stripPublicRouteHistoryState,
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
  let backCallCount = 0;
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
    get backCallCount() {
      return backCallCount;
    },
    pushState(state) {
      entries.splice(index + 1, entries.length, state);
      index += 1;
    },
    replaceState(state) {
      entries[index] = state;
    },
    back() {
      backCallCount += 1;
      index = Math.max(0, index - 1);
    },
    forward() {
      index = Math.min(entries.length - 1, index + 1);
    },
  };
}

function getFakeBrowserSelectionKey(history) {
  return `${history.index}|${history.state?.entryId ?? "unowned"}|${history.state?.path ?? "unowned"}`;
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

const persistedPredecessorSelectedEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-reloaded-query",
  initial: false,
  restoration: browserRepositoryQueryRestoration,
  predecessor: {
    entryId: rootEntry.entryId,
    restorationFingerprint: getPublicRouteRestorationFingerprint(
      rootEntry.restoration,
    ),
  },
});
const reloadedDocumentRegistry = createPublicRouteHistoryDocumentRegistry(
  persistedPredecessorSelectedEntry,
);
assert.deepEqual([...reloadedDocumentRegistry.keys()], [
  persistedPredecessorSelectedEntry.entryId,
]);
assert.equal(
  canUseCurrentDocumentBrowserBack({
    registry: reloadedDocumentRegistry,
    currentEntry: persistedPredecessorSelectedEntry,
    restoration: rootEntry.restoration,
  }),
  false,
);
const reloadedInterfaceBackPlan = planPublicRouteHistoryTransaction({
  currentEntry: persistedPredecessorSelectedEntry,
  restoration: rootEntry.restoration,
  mode: "back-or-push",
  entryId: "browser-entry-reloaded-interface-fallback",
  allowBrowserBack: canUseCurrentDocumentBrowserBack({
    registry: reloadedDocumentRegistry,
    currentEntry: persistedPredecessorSelectedEntry,
    restoration: rootEntry.restoration,
  }),
});
assert.equal(reloadedInterfaceBackPlan.kind, "push");
assert.equal("expectedEntryId" in reloadedInterfaceBackPlan, false);
const reloadedInterfaceBackHistory = createFakeBrowserHistory(
  persistedPredecessorSelectedEntry,
);
applyPublicRouteHistoryTransaction(
  reloadedInterfaceBackHistory,
  reloadedInterfaceBackPlan,
);
assert.equal(reloadedInterfaceBackHistory.backCallCount, 0);

const refreshedInspectionEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-reloaded-inspection",
  initial: false,
  restoration: browserRepositoryInspectionRestoration,
  predecessor: {
    entryId: persistedPredecessorSelectedEntry.entryId,
    restorationFingerprint: getPublicRouteRestorationFingerprint(
      persistedPredecessorSelectedEntry.restoration,
    ),
  },
});
const refreshedInspectionRegistry = createPublicRouteHistoryDocumentRegistry(
  refreshedInspectionEntry,
);
const refreshedInspectionClosePlan = planPublicRouteHistoryTransaction({
  currentEntry: refreshedInspectionEntry,
  restoration: browserRepositoryQueryRestoration,
  mode: "back-or-replace",
  entryId: "unused-refreshed-inspection-close-id",
  allowBrowserBack: canUseCurrentDocumentBrowserBack({
    registry: refreshedInspectionRegistry,
    currentEntry: refreshedInspectionEntry,
    restoration: browserRepositoryQueryRestoration,
  }),
});
assert.equal(refreshedInspectionClosePlan.kind, "replace");
assert.equal(
  refreshedInspectionClosePlan.entry.entryId,
  refreshedInspectionEntry.entryId,
);
assert.equal("expectedEntryId" in refreshedInspectionClosePlan, false);

const sameDocumentRegistry = createPublicRouteHistoryDocumentRegistry(rootEntry);
const sameDocumentPushPlan = planPublicRouteHistoryTransaction({
  currentEntry: rootEntry,
  restoration: browserBellabeatRestoration,
  mode: "push",
  entryId: "browser-entry-known-bellabeat",
});
assert.equal(sameDocumentPushPlan.kind, "push");
registerPublicRouteHistoryDocumentEntry(
  sameDocumentRegistry,
  sameDocumentPushPlan.entry,
);
assert.equal(sameDocumentRegistry.has(rootEntry.entryId), true);
assert.equal(sameDocumentRegistry.has(sameDocumentPushPlan.entry.entryId), true);
assert.equal(
  canUseCurrentDocumentBrowserBack({
    registry: sameDocumentRegistry,
    currentEntry: sameDocumentPushPlan.entry,
    restoration: rootEntry.restoration,
  }),
  true,
);
const sameDocumentBackPlan = planPublicRouteHistoryTransaction({
  currentEntry: sameDocumentPushPlan.entry,
  restoration: rootEntry.restoration,
  mode: "back-or-push",
  entryId: "unused-known-back-id",
  allowBrowserBack: canUseCurrentDocumentBrowserBack({
    registry: sameDocumentRegistry,
    currentEntry: sameDocumentPushPlan.entry,
    restoration: rootEntry.restoration,
  }),
});
assert.equal(sameDocumentBackPlan.kind, "back");

const bfcacheRestoredRegistry = sameDocumentRegistry;
registerPublicRouteHistoryDocumentEntry(
  bfcacheRestoredRegistry,
  sameDocumentPushPlan.entry,
);
assert.equal(bfcacheRestoredRegistry.has(rootEntry.entryId), true);
assert.equal(
  canUseCurrentDocumentBrowserBack({
    registry: bfcacheRestoredRegistry,
    currentEntry: sameDocumentPushPlan.entry,
    restoration: rootEntry.restoration,
  }),
  true,
);
const newlyConstructedDocumentRegistry =
  createPublicRouteHistoryDocumentRegistry(sameDocumentPushPlan.entry);
assert.deepEqual([...newlyConstructedDocumentRegistry.keys()], [
  sameDocumentPushPlan.entry.entryId,
]);
assert.notEqual(newlyConstructedDocumentRegistry, sameDocumentRegistry);
assert.equal(
  canUseCurrentDocumentBrowserBack({
    registry: newlyConstructedDocumentRegistry,
    currentEntry: sameDocumentPushPlan.entry,
    restoration: rootEntry.restoration,
  }),
  false,
);

const originalKnownBellabeatFingerprint =
  sameDocumentRegistry.get(sameDocumentPushPlan.entry.entryId);
assert.equal(typeof originalKnownBellabeatFingerprint, "string");
const retainedIdReplacementPlan = planPublicRouteHistoryTransaction({
  currentEntry: sameDocumentPushPlan.entry,
  restoration: browserBellabeatReturnRestoration,
  mode: "replace",
  entryId: "unused-retained-replacement-id",
});
assert.equal(retainedIdReplacementPlan.kind, "replace");
registerPublicRouteHistoryDocumentEntry(
  sameDocumentRegistry,
  retainedIdReplacementPlan.entry,
);
assert.equal(
  sameDocumentRegistry.get(retainedIdReplacementPlan.entry.entryId),
  getPublicRouteRestorationFingerprint(
    retainedIdReplacementPlan.entry.restoration,
  ),
);
assert.notEqual(
  sameDocumentRegistry.get(retainedIdReplacementPlan.entry.entryId),
  originalKnownBellabeatFingerprint,
);
const staleFingerprintCurrentEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-stale-known-query",
  initial: false,
  restoration: browserRepositoryQueryRestoration,
  predecessor: {
    entryId: retainedIdReplacementPlan.entry.entryId,
    restorationFingerprint: originalKnownBellabeatFingerprint,
  },
});
registerPublicRouteHistoryDocumentEntry(
  sameDocumentRegistry,
  staleFingerprintCurrentEntry,
);
assert.equal(
  canUseCurrentDocumentBrowserBack({
    registry: sameDocumentRegistry,
    currentEntry: staleFingerprintCurrentEntry,
    restoration: sameDocumentPushPlan.entry.restoration,
  }),
  false,
);

const boundedDocumentRegistry = createPublicRouteHistoryDocumentRegistry();
for (let index = 0; index < 70; index += 1) {
  registerPublicRouteHistoryDocumentEntry(
    boundedDocumentRegistry,
    createPublicRouteHistoryEntry({
      entryId: `browser-entry-bounded-${index}`,
      initial: false,
      restoration: browserRootRestoration,
    }),
  );
}
assert.equal(boundedDocumentRegistry.size, 64);
assert.equal(boundedDocumentRegistry.has("browser-entry-bounded-0"), false);
assert.equal(boundedDocumentRegistry.has("browser-entry-bounded-69"), true);

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
  allowBrowserBack: true,
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
  allowBrowserBack: true,
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

const validAdjacentBackHistory = createFakeBrowserHistory(rootEntry);
applyPlannedTransaction(
  validAdjacentBackHistory,
  "push",
  browserBellabeatRestoration,
  "browser-entry-valid-adjacent",
);
const validAdjacentBackPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(validAdjacentBackHistory.state),
  restoration: browserRootRestoration,
  mode: "back-or-push",
  entryId: "unused-valid-adjacent-id",
  allowBrowserBack: true,
});
assert.equal(validAdjacentBackPlan.kind, "back");
const validAdjacentStartingSelectionKey = getFakeBrowserSelectionKey(
  validAdjacentBackHistory,
);
const validAdjacentEntryCount = validAdjacentBackHistory.entries.length;
applyPublicRouteHistoryTransaction(
  validAdjacentBackHistory,
  validAdjacentBackPlan,
);
assert.equal(
  getPublicRouteHistoryBackHandoffDecision({
    transactionToken: 1,
    activeTransactionToken: 1,
    startingSelectionKey: validAdjacentStartingSelectionKey,
    currentSelectionKey: getFakeBrowserSelectionKey(validAdjacentBackHistory),
  }),
  "process-selection",
);
assert.equal(
  isPublicRouteHistoryBackSelectionMatch(
    validAdjacentBackPlan,
    getPublicRouteHistoryEntry(validAdjacentBackHistory.state),
  ),
  true,
);
assert.equal(validAdjacentBackHistory.entries.length, validAdjacentEntryCount);
assert.equal(validAdjacentBackHistory.backCallCount, 1);

const missedSelectionEventHistory = createFakeBrowserHistory(rootEntry);
applyPlannedTransaction(
  missedSelectionEventHistory,
  "push",
  browserBellabeatRestoration,
  "browser-entry-missed-selection",
);
const missedSelectionEventPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(missedSelectionEventHistory.state),
  restoration: browserRootRestoration,
  mode: "back-or-push",
  entryId: "unused-missed-selection-id",
  allowBrowserBack: true,
});
assert.equal(missedSelectionEventPlan.kind, "back");
const missedSelectionStartingKey = getFakeBrowserSelectionKey(
  missedSelectionEventHistory,
);
const missedSelectionEntryCount = missedSelectionEventHistory.entries.length;
applyPublicRouteHistoryTransaction(
  missedSelectionEventHistory,
  missedSelectionEventPlan,
);
const missedSelectionDecision = getPublicRouteHistoryBackHandoffDecision({
  transactionToken: 2,
  activeTransactionToken: 2,
  startingSelectionKey: missedSelectionStartingKey,
  currentSelectionKey: getFakeBrowserSelectionKey(missedSelectionEventHistory),
});
assert.equal(missedSelectionDecision, "process-selection");
assert.equal(
  isPublicRouteHistoryBackSelectionMatch(
    missedSelectionEventPlan,
    getPublicRouteHistoryEntry(missedSelectionEventHistory.state),
  ),
  true,
);
assert.equal(
  missedSelectionEventHistory.entries.length,
  missedSelectionEntryCount,
);
assert.equal(missedSelectionEventHistory.backCallCount, 1);

const noMovementTargetEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-no-movement-target",
  initial: true,
  restoration: browserBellabeatReturnRestoration,
});
const noMovementCurrentEntry = createPublicRouteHistoryEntry({
  entryId: "browser-entry-no-movement-current",
  initial: false,
  restoration: browserRepositoryQueryRestoration,
  predecessor: {
    entryId: noMovementTargetEntry.entryId,
    restorationFingerprint: getPublicRouteRestorationFingerprint(
      noMovementTargetEntry.restoration,
    ),
  },
});
const noMovementHistory = createFakeBrowserHistory(noMovementCurrentEntry);
const noMovementPlan = planPublicRouteHistoryTransaction({
  currentEntry: getPublicRouteHistoryEntry(noMovementHistory.state),
  restoration: noMovementTargetEntry.restoration,
  mode: "back-or-push",
  entryId: "browser-entry-no-movement-fallback",
  allowBrowserBack: true,
});
assert.equal(noMovementPlan.kind, "back");
const noMovementStartingKey = getFakeBrowserSelectionKey(noMovementHistory);
applyPublicRouteHistoryTransaction(noMovementHistory, noMovementPlan);
assert.equal(noMovementHistory.backCallCount, 1);
assert.equal(
  getPublicRouteHistoryBackHandoffDecision({
    transactionToken: 3,
    activeTransactionToken: 3,
    startingSelectionKey: noMovementStartingKey,
    currentSelectionKey: getFakeBrowserSelectionKey(noMovementHistory),
  }),
  "apply-fallback",
);
const noMovementFallback = planPublicRouteHistoryBackFallback(
  noMovementPlan,
  getPublicRouteHistoryEntry(noMovementHistory.state),
);
assert.equal(noMovementFallback.kind, "push");
applyPublicRouteHistoryTransaction(noMovementHistory, noMovementFallback);
assert.equal(noMovementHistory.state.path, noMovementPlan.expectedPath);
assert.equal(noMovementHistory.entries.length, 2);
assert.equal(noMovementHistory.backCallCount, 1);

assert.equal(
  getPublicRouteHistoryBackHandoffDecision({
    transactionToken: 3,
    activeTransactionToken: 4,
    startingSelectionKey: noMovementStartingKey,
    currentSelectionKey: getFakeBrowserSelectionKey(noMovementHistory),
  }),
  "stale",
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

const unrelatedFrameworkState = {
  __NA: true,
  tree: ["router", { segment: "resume" }],
};
const malformedPredecessorReplacementState = {
  ...unrelatedFrameworkState,
  arbitraryTestField: { retained: true },
  digitalReservoirPublicRoute: true,
  schemaVersion: -1,
  entryId: "browser-entry-obsolete",
  path: "/obsolete",
  initial: false,
  restoration: { reservoirHistory: [], inspectedResourceId: "obsolete" },
  predecessor: { entryId: 42, restorationFingerprint: null },
};
const sanitizedMalformedReplacement =
  mergePublicRouteHistoryReplacementState(
    malformedPredecessorReplacementState,
    directInitialClosePlan.entry,
  );
assert.equal(sanitizedMalformedReplacement.__NA, true);
assert.deepEqual(
  sanitizedMalformedReplacement.tree,
  unrelatedFrameworkState.tree,
);
assert.deepEqual(sanitizedMalformedReplacement.arbitraryTestField, {
  retained: true,
});
assert.equal("predecessor" in sanitizedMalformedReplacement, false);
for (const [key, value] of Object.entries(directInitialClosePlan.entry)) {
  assert.deepEqual(sanitizedMalformedReplacement[key], value);
}
const parsedMalformedReplacement = getPublicRouteHistoryEntry(
  sanitizedMalformedReplacement,
  directInitialClosePlan.entry.path,
);
assert.ok(parsedMalformedReplacement);
assert.equal(
  parsedMalformedReplacement.entryId,
  directInitialClosePlan.entry.entryId,
);

const validStalePredecessorState = {
  ...directInitialEntry,
  ...unrelatedFrameworkState,
  predecessor: {
    entryId: "browser-entry-stale-predecessor",
    restorationFingerprint: "stale-restoration",
  },
};
const validStaleReplacementHistory = createFakeBrowserHistory(
  validStalePredecessorState,
);
applyPublicRouteHistoryTransaction(validStaleReplacementHistory, {
  kind: "replace",
  entry: directInitialClosePlan.entry,
});
assert.equal("predecessor" in validStaleReplacementHistory.state, false);
assert.deepEqual(
  validStaleReplacementHistory.state.tree,
  unrelatedFrameworkState.tree,
);
const parsedSanitizedReplacement = getPublicRouteHistoryEntry(
  validStaleReplacementHistory.state,
  directInitialClosePlan.entry.path,
);
assert.ok(parsedSanitizedReplacement);
const removedPredecessorPlan = planPublicRouteHistoryTransaction({
  currentEntry: parsedSanitizedReplacement,
  restoration: browserBellabeatReturnRestoration,
  mode: "back-or-push",
  entryId: "browser-entry-no-stale-back",
});
assert.equal(removedPredecessorPlan.kind, "push");

const replacementWithNewPredecessor = createPublicRouteHistoryEntry({
  entryId: "browser-entry-new-predecessor",
  initial: false,
  restoration: browserRepositoryQueryRestoration,
  predecessor: {
    entryId: "browser-entry-new-origin",
    restorationFingerprint: getPublicRouteRestorationFingerprint(
      browserBellabeatReturnRestoration,
    ),
  },
});
const sanitizedNewPredecessorReplacement =
  mergePublicRouteHistoryReplacementState(
    validStalePredecessorState,
    replacementWithNewPredecessor,
  );
assert.deepEqual(
  sanitizedNewPredecessorReplacement.predecessor,
  replacementWithNewPredecessor.predecessor,
);
const parsedNewPredecessorReplacement = getPublicRouteHistoryEntry(
  sanitizedNewPredecessorReplacement,
);
assert.ok(parsedNewPredecessorReplacement);
assert.deepEqual(
  parsedNewPredecessorReplacement.predecessor,
  replacementWithNewPredecessor.predecessor,
);
assert.deepEqual(stripPublicRouteHistoryState(validStalePredecessorState), {
  ...unrelatedFrameworkState,
});

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
assert.equal("predecessor" in stalePredecessorHistory.state, false);
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
  allowBrowserBack: true,
});
assert.equal(stalePredecessorPlan.kind, "back");
const stalePredecessorStartingKey = getFakeBrowserSelectionKey(
  stalePredecessorHistory,
);
applyPublicRouteHistoryTransaction(
  stalePredecessorHistory,
  stalePredecessorPlan,
);
assert.equal(stalePredecessorHistory.backCallCount, 3);
assert.equal(
  getPublicRouteHistoryBackHandoffDecision({
    transactionToken: 5,
    activeTransactionToken: 5,
    startingSelectionKey: stalePredecessorStartingKey,
    currentSelectionKey: getFakeBrowserSelectionKey(stalePredecessorHistory),
  }),
  "process-selection",
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
assert.equal(stalePredecessorHistory.backCallCount, 3);

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
