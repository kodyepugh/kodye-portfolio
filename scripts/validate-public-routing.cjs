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
const { ARTIFACT_IDS } = require(path.join(
  projectRoot,
  "content/digital-reservoir/artifacts.ts",
));
const { resolvePublicRoute } = require(path.join(
  projectRoot,
  "lib/public-routing.ts",
));
const {
  createPublicRouteHistoryEntry,
  getInspectionCloseHistoryAction,
  getPublicRouteHistoryEntry,
} = require(path.join(projectRoot, "lib/public-route-history.ts"));
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
    kind: "contextual-resource",
    collectionId: ROOT_COLLECTION_ID,
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

const inAppResourceEntry = createPublicRouteHistoryEntry({
  path: "/bellabeat-wellness-analysis",
  initial: false,
  returnPath: "/",
});
assert.equal(
  getPublicRouteHistoryEntry(
    createPublicRouteHistoryEntry({
      path: "/resume",
      initial: false,
      closeAction: "replace",
    }),
  ).closeAction,
  "replace",
);
assert.equal(
  getPublicRouteHistoryEntry(
    createPublicRouteHistoryEntry({
      path: "/resume",
      initial: false,
      closeAction: "back",
    }),
  ).closeAction,
  "back",
);
assert.equal(
  getPublicRouteHistoryEntry(
    createPublicRouteHistoryEntry({
      path: "/resume",
      initial: false,
    }),
  ).closeAction,
  undefined,
);
assert.equal(
  getInspectionCloseHistoryAction(
    getPublicRouteHistoryEntry(inAppResourceEntry),
    "/",
  ),
  "back",
);
assert.equal(
  getInspectionCloseHistoryAction(
    getPublicRouteHistoryEntry(
      createPublicRouteHistoryEntry({
        path: "/resume",
        initial: true,
      }),
    ),
    "/",
  ),
  "replace",
);
assert.equal(getPublicRouteHistoryEntry({ path: "/" }), null);

console.log("Public routing validation passed.");
