/* eslint-disable @typescript-eslint/no-require-imports -- The validation runner installs a small CommonJS TypeScript loader before importing the typed registry. */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

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
const { getReservoirContentNodes } = require(path.join(
  projectRoot,
  "lib/content/reservoir-adapter.ts",
));
const {
  getArtifactById,
  getArtifactBySlug,
  getArtifactCollections,
  getAssetsForArtifact,
  getCollectionById,
  getCollectionMembers,
  getSourceRecordsForArtifact,
  getSourceRecordsForAsset,
} = require(path.join(projectRoot, "lib/content/selectors.ts"));
const { assertValidContentRegistry } = require(path.join(
  projectRoot,
  "lib/content/validation.ts",
));

const result = assertValidContentRegistry(contentRegistry);
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
    "artifact slug selector resolves canonical record",
    getArtifactBySlug("bellabeat-wellness-analysis") ===
      getArtifactById(ARTIFACT_IDS.bellabeat),
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
];

const failedChecks = checks.filter(([, passed]) => !passed);
if (failedChecks.length > 0) {
  for (const [label] of failedChecks) console.error(`FAIL: ${label}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content graph valid: ${contentRegistry.artifacts.length} artifacts, ` +
      `${contentRegistry.collections.length} collections, ` +
      `${contentRegistry.memberships.length} memberships, ` +
      `${contentRegistry.assets.length} asset, ` +
      `${contentRegistry.sourceRecords.length} source records.`,
  );
  console.log(`Graph QA passed: ${checks.length}/${checks.length} checks.`);
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
}
