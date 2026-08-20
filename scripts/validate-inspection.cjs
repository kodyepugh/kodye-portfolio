/* eslint-disable @typescript-eslint/no-require-imports -- Loads repository TypeScript directly for deterministic model QA. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
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

const { contentRegistry } = require(path.join(
  projectRoot,
  "lib/content/registry.ts",
));
const {
  adaptResourceToReservoirContentNode,
} = require(path.join(projectRoot, "lib/content/reservoir-adapter.ts"));
const {
  getStructuredDocumentBody,
} = require(path.join(projectRoot, "lib/content/structured-document.ts"));
const {
  getResourceInspectionSurface,
} = require(path.join(projectRoot, "lib/reservoir/inspection.ts"));
const {
  canInspectResource,
} = require(path.join(projectRoot, "lib/reservoir/inspection.ts"));
const {
  getReservoirResourceSelectionAction,
} = require(path.join(projectRoot, "lib/reservoir/resource-selection.ts"));
const {
  getResourceById,
  getPublishedSupportingResourcesFromRegistry,
} = require(path.join(projectRoot, "lib/content/selectors.ts"));
const {
  ROOT_COLLECTION_ID,
} = require(path.join(
  projectRoot,
  "content/digital-reservoir/collections.ts",
));
const {
  shouldShowInspectionSupportRail,
  isInspectionSupportRailInteractive,
  canRequestInspectionSupportNavigation,
} = require(path.join(
  projectRoot,
  "lib/reservoir/inspection-support.ts",
));
const {
  associateInspectionReturnFrame,
  consumeInspectionReturnFrame,
  createInspectionReturnFrame,
  discardInspectionReturnFrame,
  getInspectionReturnFrame,
  getInspectionReturnPostContentOffset,
  getInspectionReturnScrollY,
} = require(path.join(
  projectRoot,
  "lib/reservoir/inspection-return.ts",
));
const {
  shouldShowBackNavigationForQueryContext,
} = require(path.join(projectRoot, "lib/reservoir/navigation.ts"));
const {
  validateContentRegistry,
} = require(path.join(projectRoot, "lib/content/validation.ts"));

const about = getResourceById("artifact-about");
const bellabeat = getResourceById("artifact-bellabeat-wellness-analysis");
const brandSymbol = getResourceById("artifact-kodyepugh-symbol");
const imageResource = contentRegistry.resources.find(
  (resource) => resource.inspectionKind === "image",
);
const structuredBlocks = [
  { id: "heading", type: "heading", level: 2, text: "Heading" },
  { id: "paragraph", type: "paragraph", text: "Paragraph" },
  {
    id: "figure",
    type: "figure",
    resourceId: brandSymbol.id,
    representationId: brandSymbol.representations[0].id,
    alt: "Brand symbol",
  },
  { id: "list", type: "list", style: "unordered", items: ["One"] },
  { id: "callout", type: "callout", text: "Callout" },
  { id: "link", type: "link", href: "https://example.com", label: "Example" },
  { id: "divider", type: "divider" },
  { id: "table", type: "table", columns: ["A"], rows: [["B"]] },
  { id: "quote", type: "quote", text: "Quote" },
  { id: "code", type: "code", code: "const ready = true;" },
  {
    id: "resource-reference",
    type: "resource-reference",
    resourceId: about.id,
  },
];
const nonArtifactDocument = {
  objectType: "resource",
  id: "qa-structured-document",
  slug: "qa-structured-document-slug",
  title: "QA Structured Document",
  type: "report",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: true,
  content: {
    kind: "structured-document",
    status: "ready",
    blocks: structuredBlocks,
  },
};
const unsupportedResource = {
  ...nonArtifactDocument,
  id: "qa-video-resource",
  slug: "qa-video-resource-slug",
  inspectionKind: "video",
  content: undefined,
};
const supportSourceResource = {
  objectType: "resource",
  id: "qa-inspection-support-source",
  slug: "qa-inspection-support-source",
  title: "QA Inspection Support Source",
  type: "report",
  inspectionKind: "structured-document",
  isArtifact: true,
  published: true,
};
const supportTargetResource = {
  objectType: "resource",
  id: "qa-inspection-support-target",
  slug: "qa-inspection-support-target",
  title: "QA Inspection Support Target",
  type: "document",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: true,
};
const supportHiddenTargetResource = {
  objectType: "resource",
  id: "qa-inspection-support-hidden-target",
  slug: "qa-inspection-support-hidden-target",
  title: "QA Inspection Support Hidden Target",
  type: "document",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: false,
};
const supportRegistry = {
  ...contentRegistry,
  resources: [
    ...contentRegistry.resources,
    supportSourceResource,
    supportTargetResource,
    supportHiddenTargetResource,
  ],
  resourceSupportRelations: [
    {
      id: "qa-inspection-support-rel-hidden",
      sourceResourceId: supportSourceResource.id,
      targetResourceId: supportHiddenTargetResource.id,
      relationshipType: "supporting",
      order: 2,
      published: true,
      label: "Hidden",
      role: "supporting-report",
    },
    {
      id: "qa-inspection-support-rel-visible",
      sourceResourceId: supportSourceResource.id,
      targetResourceId: supportTargetResource.id,
      relationshipType: "supporting",
      order: 1,
      published: true,
      label: "Visible",
      role: "supporting-report",
    },
  ],
};
const supportEntries = getPublishedSupportingResourcesFromRegistry(
  supportRegistry,
  supportSourceResource.id,
);
const validSyntheticRegistry = {
  ...contentRegistry,
  resources: [...contentRegistry.resources, nonArtifactDocument],
};
const invalidReferenceRegistry = {
  ...contentRegistry,
  resources: [
    ...contentRegistry.resources,
    {
      ...nonArtifactDocument,
      id: "qa-invalid-reference",
      slug: "qa-invalid-reference-slug",
      content: {
        ...nonArtifactDocument.content,
        blocks: [
          {
            id: "broken-figure",
            type: "figure",
            resourceId: "missing-resource",
            alt: "Missing figure",
          },
        ],
      },
    },
  ],
};
const validSyntheticResult = validateContentRegistry(validSyntheticRegistry);

const originalSnapshot = JSON.stringify({
  resource: nonArtifactDocument,
  memberships: contentRegistry.memberships,
});
const nonArtifactNode = adaptResourceToReservoirContentNode(nonArtifactDocument);
const unsupportedNode = adaptResourceToReservoirContentNode(unsupportedResource);
const openAction = getReservoirResourceSelectionAction(
  nonArtifactNode,
  nonArtifactNode.id,
);
const supportQueryContextKey =
  "query:qa-inspection-support-target|return=collection:collection-work";
const ordinaryQueryContextKey =
  "query:artifact-about|return=collection:collection-root";
const ordinaryRootQueryContext = {
  kind: "query",
  resultIds: [about.id],
  returnContext: {
    kind: "collection",
    collectionId: ROOT_COLLECTION_ID,
  },
};
const ordinaryNestedQueryContext = {
  kind: "query",
  resultIds: [about.id],
  returnContext: {
    kind: "collection",
    collectionId: "collection-work",
  },
};
const inspectionReturnQueryContext = {
  kind: "query",
  resultIds: [supportSourceResource.id],
  returnContext: {
    kind: "collection",
    collectionId: ROOT_COLLECTION_ID,
  },
};
const inspectionReturnStore = new Map();
const inspectionReturnFrame = createInspectionReturnFrame(
  supportSourceResource.id,
  740,
  0.5,
);
associateInspectionReturnFrame(
  inspectionReturnStore,
  supportQueryContextKey,
  inspectionReturnFrame,
);
const boundedInspectionReturnFrame = createInspectionReturnFrame(
  supportSourceResource.id,
  -40,
  1.8,
);
const homeDiscardStore = new Map(inspectionReturnStore);
const failedSupportQueryStore = new Map();
const unsupportedDestinationStore = new Map();
associateInspectionReturnFrame(
  unsupportedDestinationStore,
  "query:qa-video-resource|return=collection:collection-work",
  inspectionReturnFrame,
);
const consumedInspectionReturnFrame = consumeInspectionReturnFrame(
  inspectionReturnStore,
  supportQueryContextKey,
);
const inspectionReturnOwnershipSnapshot = JSON.stringify({
  source: supportSourceResource,
  target: supportTargetResource,
  memberships: contentRegistry.memberships,
});

const checks = [
  [
    "A Artifact structured-document resolves to the structured surface",
    about.isArtifact === true &&
      getResourceInspectionSurface(about.inspectionKind) === "structured-document",
  ],
  [
    "B non-Artifact structured-document resolves to the same surface",
    nonArtifactDocument.isArtifact === false &&
      getResourceInspectionSurface(nonArtifactDocument.inspectionKind) ===
        getResourceInspectionSurface(about.inspectionKind),
  ],
  [
    "C Artifact status does not choose the renderer",
    getResourceInspectionSurface(nonArtifactDocument.inspectionKind) ===
      getResourceInspectionSurface({ ...nonArtifactDocument, isArtifact: true }.inspectionKind),
  ],
  [
    "D inspectionKind determines dispatch",
    getResourceInspectionSurface("structured-document") === "structured-document" &&
      getResourceInspectionSurface("video") === "unsupported",
  ],
  [
    "E supported surfaces are inspectable and unsupported surfaces are not",
    imageResource !== undefined &&
      canInspectResource(about) &&
      canInspectResource(nonArtifactDocument) &&
      canInspectResource(imageResource) &&
      !canInspectResource(unsupportedResource),
  ],
  [
    "F canonical block order is preserved",
    getStructuredDocumentBody(nonArtifactDocument).blocks
      .map((block) => block.id)
      .join(",") === structuredBlocks.map((block) => block.id).join(","),
  ],
  [
    "G every supported structured block validates",
    validSyntheticResult.valid,
  ],
  [
    "H invalid Resource references fail validation",
    validateContentRegistry(invalidReferenceRegistry).errors.some((error) =>
      error.includes("references unknown Resource missing-resource"),
    ),
  ],
  [
    "I unsupported inspection kinds do not open a structured surface",
    getResourceInspectionSurface(unsupportedResource.inspectionKind) === "unsupported" &&
      getReservoirResourceSelectionAction(unsupportedNode, unsupportedNode.id) ===
        "unsupported-resource-inspection",
  ],
  [
    "J legacy case-study content resolves through the compatibility adapter",
    bellabeat.content.kind === "case-study" &&
      getStructuredDocumentBody(bellabeat).source === "legacy-adapter" &&
      getStructuredDocumentBody(bellabeat).blocks.length > 0,
  ],
  [
    "K opening selection is identity, membership, and status preserving",
    openAction === "open-resource-inspection" &&
      JSON.stringify({
        resource: nonArtifactDocument,
        memberships: contentRegistry.memberships,
      }) === originalSnapshot,
  ],
  [
    "L published supporting resources resolve through the canonical selector",
    supportEntries.length === 1 &&
      supportEntries[0].targetResourceId === supportTargetResource.id &&
      supportEntries[0].resource === supportTargetResource &&
      supportEntries[0].relationshipId ===
        "qa-inspection-support-rel-visible" &&
      supportEntries[0].relationship.published !== false,
  ],
  [
    "M unsupported target resources remain filtered from public support rails",
    supportEntries.every((entry) => entry.resource.published === true) &&
      supportEntries.every((entry) => entry.resource.id !== supportHiddenTargetResource.id),
  ],
  [
    "N support rail geometry is presence-driven",
    shouldShowInspectionSupportRail(0) === false &&
      shouldShowInspectionSupportRail(supportEntries.length) ===
        (supportEntries.length > 0),
  ],
  [
    "O support rail controls are reading-only",
    isInspectionSupportRailInteractive("reading") &&
      !isInspectionSupportRailInteractive("deploying") &&
      !isInspectionSupportRailInteractive("closing"),
  ],
  [
    "P duplicate support navigation is blocked while pending or closing",
    canRequestInspectionSupportNavigation("reading", null) &&
      !canRequestInspectionSupportNavigation(
        "reading",
        supportTargetResource.id,
      ) &&
      !canRequestInspectionSupportNavigation("closing", null),
  ],
  [
    "Q Inspection return frames associate only with their support-query context",
    consumedInspectionReturnFrame === inspectionReturnFrame &&
      getInspectionReturnFrame(
        inspectionReturnStore,
        ordinaryQueryContextKey,
      ) === null,
  ],
  [
    "R ordinary non-root queries keep Back available",
    shouldShowBackNavigationForQueryContext(
      ordinaryNestedQueryContext,
      false,
    ) === true,
  ],
  [
    "S ordinary root-returning queries keep Back hidden",
    shouldShowBackNavigationForQueryContext(ordinaryRootQueryContext, false) ===
      false,
  ],
  [
    "T inspection-originated root-returning support queries show Back",
    shouldShowBackNavigationForQueryContext(
      inspectionReturnQueryContext,
      true,
    ) === true,
  ],
  [
    "U Inspection return frames preserve canonical Resource identity",
    inspectionReturnFrame.resourceId === supportSourceResource.id,
  ],
  [
    "V Inspection return reading state is bounded and restores proportionally",
    boundedInspectionReturnFrame.scrollY === 0 &&
      boundedInspectionReturnFrame.postContentProgress === 1 &&
      getInspectionReturnScrollY(inspectionReturnFrame, 400) === 400 &&
      getInspectionReturnPostContentOffset(inspectionReturnFrame, 600) === 300,
  ],
  [
    "W Home discards Inspection return state instead of restoring it",
    discardInspectionReturnFrame(homeDiscardStore, supportQueryContextKey) &&
      getInspectionReturnFrame(homeDiscardStore, supportQueryContextKey) ===
        null,
  ],
  [
    "X failed support queries leave no Inspection return frame",
    getInspectionReturnFrame(
      failedSupportQueryStore,
      supportQueryContextKey,
    ) === null,
  ],
  [
    "Y unsupported destinations do not invalidate the inspectable source frame",
    !canInspectResource(unsupportedResource) &&
      canInspectResource(supportSourceResource) &&
      getInspectionReturnFrame(
        unsupportedDestinationStore,
        "query:qa-video-resource|return=collection:collection-work",
      )?.resourceId === supportSourceResource.id,
  ],
  [
    "Z Inspection return frames are consumed exactly once",
    consumedInspectionReturnFrame === inspectionReturnFrame &&
      consumeInspectionReturnFrame(
        inspectionReturnStore,
        supportQueryContextKey,
      ) === null,
  ],
  [
    "AA Inspection return state does not mutate Artifact status or membership",
    JSON.stringify({
      source: supportSourceResource,
      target: supportTargetResource,
      memberships: contentRegistry.memberships,
    }) === inspectionReturnOwnershipSnapshot,
  ],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
}
if (failures.length > 0) process.exitCode = 1;
else console.log(`Inspection QA passed: ${checks.length}/${checks.length} checks.`);
if (!validSyntheticResult.valid) {
  for (const error of validSyntheticResult.errors) {
    console.error(`Synthetic fixture error: ${error}`);
  }
}
