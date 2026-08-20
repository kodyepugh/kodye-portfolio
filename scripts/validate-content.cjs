/* eslint-disable @typescript-eslint/no-require-imports -- The validation runner installs a small CommonJS TypeScript loader before importing the typed registry. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const THREE = require("three");

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
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
const { ARTIFACT_IDS } = require(path.join(
  projectRoot,
  "content/digital-reservoir/artifacts.ts",
));
const { ASSET_IDS } = require(path.join(
  projectRoot,
  "content/digital-reservoir/assets.ts",
));
const {
  COLLECTION_IDS,
  ROOT_COLLECTION_ID,
} = require(path.join(
  projectRoot,
  "content/digital-reservoir/collections.ts",
));
const { contentRegistry } = require(path.join(
  projectRoot,
  "lib/content/registry.ts",
));
const {
  adaptResourceToReservoirContentNode,
  getReservoirContentNodes,
  getReservoirNodeSizingFamily,
  getReservoirCollectionNodeById,
} = require(path.join(projectRoot, "lib/content/reservoir-adapter.ts"));
const { getReservoirAdaptiveZoom } = require(path.join(
  projectRoot,
  "lib/reservoir/zoom.ts",
));
const { getReservoirResourceSelectionAction } = require(path.join(
  projectRoot,
  "lib/reservoir/resource-selection.ts",
));
const {
  getArtifactById,
  getArtifactBySlug,
  getArtifactStatusResources,
  getArtifactCollections,
  getAssetsForArtifact,
  getCollectionById,
  getCollectionByAddress,
  getCollectionMembers,
  getResourceByAddress,
  getResourceById,
  getResourceRepresentations,
  getSupportingResourcesForResource,
  getSourceRecordsForArtifact,
  getSourceRecordsForAsset,
  resolveSemanticObjectAddress,
} = require(path.join(projectRoot, "lib/content/selectors.ts"));
const { assertValidContentRegistry } = require(path.join(
  projectRoot,
  "lib/content/validation.ts",
));

const result = assertValidContentRegistry(contentRegistry);
const syntheticPublishedResource = {
  objectType: "resource",
  id: "qa-resource-query-only",
  slug: "qa-resource-query-only",
  title: "Synthetic Query-only Resource",
  type: "report",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: true,
};
const syntheticReservoirNode = adaptResourceToReservoirContentNode(
  syntheticPublishedResource,
);
const syntheticCollectionNode = getReservoirCollectionNodeById(ROOT_COLLECTION_ID);
const testCamera = (() => {
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
})();
const testZoom = (nodes, artifactDiameter = 2, collectionDiameter = 4) =>
  getReservoirAdaptiveZoom({
    camera: testCamera,
    viewportHeight: 1000,
    reservoirCenter: new THREE.Vector3(0, 0, 0),
    baseScale: 1,
    nodes,
    artifactDiameter,
    collectionDiameter,
    cameraNear: 0.1,
  });
const allPersistentCollectionNodes = contentRegistry.collections.flatMap(
  (collection) => getReservoirContentNodes(collection.id),
);
const checks = [
  ["root collection resolves", Boolean(getCollectionById(ROOT_COLLECTION_ID))],
  [
    "root child collections resolve",
    [COLLECTION_IDS.work, COLLECTION_IDS.aboutSelf].every((collectionId) =>
      getCollectionMembers(ROOT_COLLECTION_ID).some(
        (member) =>
          member.kind === "collection" && member.collection.id === collectionId,
      ),
    ),
  ],
  [
    "representative artifacts resolve",
    [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.about].every(
      (artifactId) => Boolean(getArtifactById(artifactId)),
    ),
  ],
  [
    "resource address resolution works",
    getResourceById(ARTIFACT_IDS.brandSymbol)?.id === ARTIFACT_IDS.brandSymbol &&
      getResourceByAddress("kodyepugh-symbol")?.id === ARTIFACT_IDS.brandSymbol &&
      getCollectionByAddress("digital-reservoir")?.id === COLLECTION_IDS.root &&
      resolveSemanticObjectAddress(ARTIFACT_IDS.brandSymbol)?.kind === "resource" &&
      resolveSemanticObjectAddress(COLLECTION_IDS.root)?.kind === "collection",
  ],
  [
    "artifact slug selector resolves canonical record",
    getArtifactBySlug("bellabeat-wellness-analysis") ===
      getArtifactById(ARTIFACT_IDS.bellabeat),
  ],
  [
    "artifact status resources resolve",
    getArtifactStatusResources().every((resource) => resource.isArtifact === true),
  ],
  [
    "legacy artifact memberships are absent",
    contentRegistry.memberships.every(
      (membership) => membership.memberType !== "artifact",
    ),
  ],
  [
    "one artifact belongs to multiple collections without duplication",
    getArtifactCollections(ARTIFACT_IDS.bellabeat).length >= 2 &&
      contentRegistry.artifacts.filter(
        (artifact) => artifact.id === ARTIFACT_IDS.bellabeat,
      ).length === 1,
  ],
  [
    "child collections belong to parent collections",
    getCollectionMembers(ROOT_COLLECTION_ID).some(
      (member) =>
        member.kind === "collection" &&
        member.collection.id === COLLECTION_IDS.work,
    ),
  ],
  [
    "asset resolves independently through artifact content",
    getAssetsForArtifact(ARTIFACT_IDS.brandSymbol).some(
      (asset) => asset.id === ASSET_IDS.brandSymbol,
    ),
  ],
  [
    "resource representations resolve",
    getResourceRepresentations(ARTIFACT_IDS.brandSymbol).some(
      (representation) =>
        representation.kind === "asset" &&
        representation.assetId === ASSET_IDS.brandSymbol,
    ),
  ],
  [
    "supporting resources selector is stable",
    Array.isArray(getSupportingResourcesForResource(ARTIFACT_IDS.bellabeat)),
  ],
  [
    "source records resolve independently",
    getSourceRecordsForArtifact(ARTIFACT_IDS.bellabeat).length > 0 &&
      getSourceRecordsForAsset(ASSET_IDS.brandSymbol).length > 0,
  ],
  [
    "collection contents adapt without spatial placement",
    getReservoirContentNodes(COLLECTION_IDS.dataAnalytics).some(
      (node) =>
        node.kind === "artifact" &&
        node.id === ARTIFACT_IDS.bellabeat &&
        !("vertexId" in node),
    ),
  ],
  [
    "persistent collection reservoirs remain artifact-gated",
    allPersistentCollectionNodes.every(
      (node) => node.kind === "collection" || node.isArtifact === true,
    ) &&
      !allPersistentCollectionNodes.some(
        (node) => node.id === syntheticPublishedResource.id,
      ),
  ],
  [
    "published non-artifact resource adapts without membership",
    syntheticReservoirNode.kind === "resource" &&
      syntheticReservoirNode.isArtifact === false &&
      syntheticReservoirNode.id === syntheticPublishedResource.id &&
      !contentRegistry.memberships.some(
        (membership) => membership.memberId === syntheticPublishedResource.id,
      ),
  ],
  [
    "non-artifact query node uses inspectable-resource sizing",
    getReservoirNodeSizingFamily(syntheticReservoirNode) ===
      "inspectable-resource",
  ],
  [
    "artifact-only zoom input reports artifact",
    testZoom([
      adaptResourceToReservoirContentNode(getArtifactById(ARTIFACT_IDS.about)),
    ]).smallestNodeKind === "artifact",
  ],
  [
    "non-artifact resource-only zoom input reports resource",
    testZoom([syntheticReservoirNode]).smallestNodeKind === "resource",
  ],
  [
    "collection-only zoom input reports collection",
    testZoom([syntheticCollectionNode]).smallestNodeKind === "collection",
  ],
  [
    "mixed artifact and collection zoom input reports artifact",
    testZoom(
      [
        adaptResourceToReservoirContentNode(
          getArtifactById(ARTIFACT_IDS.about),
        ),
        syntheticCollectionNode,
      ],
      2,
      4,
    ).smallestNodeKind === "artifact",
  ],
  [
    "mixed resource and collection zoom input reports resource",
    testZoom([syntheticReservoirNode, syntheticCollectionNode], 2, 4)
      .smallestNodeKind === "resource",
  ],
  [
    "artifact and resource share inspectable-resource sizing",
    testZoom([
      adaptResourceToReservoirContentNode(getArtifactById(ARTIFACT_IDS.about)),
    ]).smallestNodeWorldDiameter ===
      testZoom([syntheticReservoirNode]).smallestNodeWorldDiameter,
  ],
  [
    "non-artifact structured document opens Resource inspection",
    getReservoirResourceSelectionAction(
      syntheticReservoirNode,
      syntheticReservoirNode.id,
    ) === "open-resource-inspection",
  ],
  [
    "artifact second selection opens Resource inspection",
    getReservoirResourceSelectionAction(
      adaptResourceToReservoirContentNode(
        getArtifactById(ARTIFACT_IDS.about),
      ),
      ARTIFACT_IDS.about,
    ) === "open-resource-inspection",
  ],
];

const failedChecks = checks.filter(([, passed]) => !passed);
if (failedChecks.length > 0) {
  for (const [label] of failedChecks) console.error(`FAIL: ${label}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content graph valid: ${contentRegistry.resources.length} resources, ` +
      `${contentRegistry.collections.length} collections, ` +
      `${contentRegistry.memberships.length} memberships, ` +
      `${contentRegistry.assets.length} asset, ` +
      `${contentRegistry.sourceRecords.length} source records.`,
  );
  console.log(`Graph QA passed: ${checks.length}/${checks.length} checks.`);
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
}
