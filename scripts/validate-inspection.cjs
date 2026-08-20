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
  getPublishedImageRepresentations,
  getImageAltText,
  resolveImageInspection,
} = require(path.join(projectRoot, "lib/content/image-inspection.ts"));
const {
  getInspectionCollectionPill,
  getInspectionContextAvailability,
  getInspectionResourcePill,
} = require(path.join(projectRoot, "lib/reservoir/inspection-context.ts"));
const {
  getReservoirResourceSelectionAction,
} = require(path.join(projectRoot, "lib/reservoir/resource-selection.ts"));
const {
  getResourceById,
  getPublishedResourceCollections,
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
const imageResolution = resolveImageInspection(brandSymbol);
const qaImageAssetRepresentation = {
  id: "qa-image-asset-representation",
  kind: "image",
  src: "/qa/image-representation.svg",
  filename: "qa-image-representation.svg",
  mimeType: "image/svg+xml",
  width: 960,
  height: 720,
  alt: "QA image representation",
};
const qaImageAssetFallback = {
  id: "qa-image-asset-fallback",
  kind: "image",
  src: "/qa/image-fallback.svg",
  filename: "qa-image-fallback.svg",
  mimeType: "image/svg+xml",
  width: 640,
  height: 640,
  alt: "QA image fallback",
};
const qaImageAssetWrongKind = {
  id: "qa-image-asset-wrong-kind",
  kind: "document",
  src: "/qa/image-wrong-kind.pdf",
  filename: "qa-image-wrong-kind.pdf",
  mimeType: "application/pdf",
  alt: "QA image wrong kind",
};
const qaImageAssetMissingSource = {
  id: "qa-image-asset-missing-source",
  kind: "image",
  src: "   ",
  filename: "qa-image-asset-missing-source.svg",
  mimeType: "image/svg+xml",
  width: 400,
  height: 300,
  alt: "QA missing source",
};
const qaAssetsById = new Map(
  [
    ...contentRegistry.assets,
    qaImageAssetRepresentation,
    qaImageAssetFallback,
    qaImageAssetWrongKind,
    qaImageAssetMissingSource,
  ].map((asset) => [asset.id, asset]),
);
const qaAssetById = (assetId) => qaAssetsById.get(assetId) ?? null;
const orderedImageRepresentations = getPublishedImageRepresentations({
  representations: [
    {
      id: "qa-image-rep-late",
      kind: "asset",
      assetId: qaImageAssetRepresentation.id,
      label: "Resolved representation",
      order: 2,
      published: true,
    },
    {
      id: "qa-image-rep-early",
      kind: "asset",
      assetId: "qa-missing-image-asset",
      label: "Missing asset",
      order: 1,
      published: true,
    },
    {
      id: "qa-image-rep-unpublished",
      kind: "asset",
      assetId: qaImageAssetWrongKind.id,
      label: "Unpublished",
      order: 0,
      published: false,
    },
  ],
});
const orderedImageResource = {
  objectType: "resource",
  id: "qa-ordered-image-resource",
  slug: "qa-ordered-image-resource",
  title: "QA Ordered Image Resource",
  type: "image",
  inspectionKind: "image",
  isArtifact: false,
  published: true,
  representations: [
    {
      id: "qa-image-rep-late",
      kind: "asset",
      assetId: qaImageAssetRepresentation.id,
      label: "Resolved representation",
      order: 2,
      published: true,
    },
    {
      id: "qa-image-rep-early",
      kind: "asset",
      assetId: qaImageAssetFallback.id,
      label: "Preferred representation",
      order: 1,
      published: true,
    },
    {
      id: "qa-image-rep-unpublished",
      kind: "asset",
      assetId: qaImageAssetWrongKind.id,
      label: "Unpublished",
      order: 0,
      published: false,
    },
  ],
  content: {
    kind: "media",
    status: "ready",
    assetId: qaImageAssetFallback.id,
    caption: "Fallback caption",
  },
};
const fallbackOnlyImageResource = {
  objectType: "resource",
  id: "qa-fallback-image-resource",
  slug: "qa-fallback-image-resource",
  title: "QA Fallback Image Resource",
  type: "image",
  inspectionKind: "image",
  isArtifact: false,
  published: true,
  content: {
    kind: "media",
    status: "ready",
    assetId: qaImageAssetFallback.id,
    caption: "Fallback caption",
  },
};
const unavailableImageResource = {
  objectType: "resource",
  id: "qa-unavailable-image-resource",
  slug: "qa-unavailable-image-resource",
  title: "QA Unavailable Image Resource",
  type: "image",
  inspectionKind: "image",
  isArtifact: false,
  published: true,
  representations: [
    {
      id: "qa-image-rep-malformed",
      kind: "inline",
      format: "text",
      body: "not an image",
      order: 0,
      published: true,
    },
    {
      id: "qa-image-rep-missing-source",
      kind: "asset",
      assetId: qaImageAssetMissingSource.id,
      label: "Missing source",
      order: 1,
      published: true,
    },
    {
      id: "qa-image-rep-unpublished-doc",
      kind: "asset",
      assetId: qaImageAssetWrongKind.id,
      label: "Unpublished document",
      order: 2,
      published: false,
    },
  ],
  content: {
    kind: "media",
    status: "ready",
    assetId: "qa-missing-image-asset",
  },
};
const orderedImageResolution = resolveImageInspection(
  orderedImageResource,
  qaAssetById,
);
const fallbackImageResolution = resolveImageInspection(
  fallbackOnlyImageResource,
  qaAssetById,
);
const unavailableImageResolution = resolveImageInspection(
  unavailableImageResource,
  qaAssetById,
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
const brandSymbolCollections = getPublishedResourceCollections(brandSymbol.id);
const resourcePill = getInspectionResourcePill(supportTargetResource);
const collectionPill = getInspectionCollectionPill(brandSymbolCollections[0]);

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
    "F image representation ordering is deterministic",
    orderedImageRepresentations.map((representation) => representation.id)
      .join(",") === "qa-image-rep-early,qa-image-rep-late",
  ],
  [
    "G production image Resources resolve through the published representation path",
    imageResolution.status === "ready" &&
      imageResolution.source === "representation" &&
      imageResolution.asset.id === brandSymbol.representations[0].assetId,
  ],
  [
    "H ordered published image Resources pick the first usable representation",
    orderedImageResolution.status === "ready" &&
      orderedImageResolution.source === "representation" &&
      orderedImageResolution.asset.id === qaImageAssetFallback.id &&
      orderedImageResolution.representation?.id === "qa-image-rep-early",
  ],
  [
    "I media-content fallback resolves when no published representation is usable",
    fallbackImageResolution.status === "ready" &&
      fallbackImageResolution.source === "content" &&
      fallbackImageResolution.asset.id === qaImageAssetFallback.id,
  ],
  [
    "J unavailable image Resources report an explicit failure",
    unavailableImageResolution.status === "unavailable" &&
      unavailableImageResolution.reason.includes("unavailable") &&
      unavailableImageResolution.details.some(
        (detail) =>
          detail.includes("missing") || detail.includes("malformed"),
      ),
  ],
  [
    "K published collection memberships resolve in order",
    brandSymbolCollections.map((collection) => collection.id).join(",") ===
      "collection-web,collection-about-self",
  ],
  [
    "L context availability chooses the first available semantic view",
    getInspectionContextAvailability(0, 0).initialView === null &&
      getInspectionContextAvailability(0, 2).initialView === "collections" &&
      getInspectionContextAvailability(2, 0).initialView === "resources" &&
      getInspectionContextAvailability(2, 2).initialView === "resources",
  ],
  [
    "M context pill models contain only canonical object identity",
    JSON.stringify(Object.keys(resourcePill).sort()) ===
      JSON.stringify(["iconKey", "id", "name"]) &&
      resourcePill.id === supportTargetResource.id &&
      resourcePill.name === supportTargetResource.title &&
      JSON.stringify(Object.keys(collectionPill).sort()) ===
        JSON.stringify(["iconKey", "id", "name"]) &&
      collectionPill.id === brandSymbolCollections[0].id &&
      collectionPill.name === brandSymbolCollections[0].title,
  ],
  [
    "N image alt text follows asset, caption, then Resource title",
    getImageAltText({ alt: "Asset alt" }, "Caption", "Title") ===
      "Asset alt" &&
      getImageAltText({ alt: "" }, "Caption", "Title") === "Caption" &&
      getImageAltText({ alt: undefined }, undefined, "Title") === "Title",
  ],
  [
    "O canonical block order is preserved",
    getStructuredDocumentBody(nonArtifactDocument).blocks
      .map((block) => block.id)
      .join(",") === structuredBlocks.map((block) => block.id).join(","),
  ],
  [
    "P every supported structured block validates",
    validSyntheticResult.valid,
  ],
  [
    "Q invalid Resource references fail validation",
    validateContentRegistry(invalidReferenceRegistry).errors.some((error) =>
      error.includes("references unknown Resource missing-resource"),
    ),
  ],
  [
    "R unsupported inspection kinds do not open a structured surface",
    getResourceInspectionSurface(unsupportedResource.inspectionKind) === "unsupported" &&
      getReservoirResourceSelectionAction(unsupportedNode, unsupportedNode.id) ===
        "unsupported-resource-inspection",
  ],
  [
    "S legacy case-study content resolves through the compatibility adapter",
    bellabeat.content.kind === "case-study" &&
      getStructuredDocumentBody(bellabeat).source === "legacy-adapter" &&
      getStructuredDocumentBody(bellabeat).blocks.length > 0,
  ],
  [
    "T opening selection is identity, membership, and status preserving",
    openAction === "open-resource-inspection" &&
      JSON.stringify({
        resource: nonArtifactDocument,
        memberships: contentRegistry.memberships,
      }) === originalSnapshot,
  ],
  [
    "U published supporting resources resolve through the canonical selector",
    supportEntries.length === 1 &&
      supportEntries[0].targetResourceId === supportTargetResource.id &&
      supportEntries[0].resource === supportTargetResource &&
      supportEntries[0].relationshipId ===
        "qa-inspection-support-rel-visible" &&
      supportEntries[0].relationship.published !== false,
  ],
  [
    "V unsupported target resources remain filtered from public support rails",
    supportEntries.every((entry) => entry.resource.published === true) &&
      supportEntries.every((entry) => entry.resource.id !== supportHiddenTargetResource.id),
  ],
  [
    "W support rail geometry is presence-driven",
    shouldShowInspectionSupportRail(0) === false &&
      shouldShowInspectionSupportRail(supportEntries.length) ===
        (supportEntries.length > 0),
  ],
  [
    "X support rail controls are reading-only",
    isInspectionSupportRailInteractive("reading") &&
      !isInspectionSupportRailInteractive("deploying") &&
      !isInspectionSupportRailInteractive("closing"),
  ],
  [
    "Y duplicate support navigation is blocked while pending or closing",
    canRequestInspectionSupportNavigation("reading", null) &&
      !canRequestInspectionSupportNavigation(
        "reading",
        supportTargetResource.id,
      ) &&
      !canRequestInspectionSupportNavigation("closing", null),
  ],
  [
    "Z Inspection return frames associate only with their support-query context",
    consumedInspectionReturnFrame === inspectionReturnFrame &&
      getInspectionReturnFrame(
        inspectionReturnStore,
        ordinaryQueryContextKey,
      ) === null,
  ],
  [
    "AA ordinary non-root queries keep Back available",
    shouldShowBackNavigationForQueryContext(
      ordinaryNestedQueryContext,
      false,
    ) === true,
  ],
  [
    "AB ordinary root-returning queries keep Back hidden",
    shouldShowBackNavigationForQueryContext(ordinaryRootQueryContext, false) ===
      false,
  ],
  [
    "AC inspection-originated root-returning support queries show Back",
    shouldShowBackNavigationForQueryContext(
      inspectionReturnQueryContext,
      true,
    ) === true,
  ],
  [
    "AD Inspection return frames preserve canonical Resource identity",
    inspectionReturnFrame.resourceId === supportSourceResource.id,
  ],
  [
    "AE Inspection return reading state is bounded and restores proportionally",
    boundedInspectionReturnFrame.scrollY === 0 &&
      boundedInspectionReturnFrame.postContentProgress === 1 &&
      getInspectionReturnScrollY(inspectionReturnFrame, 400) === 400 &&
      getInspectionReturnPostContentOffset(inspectionReturnFrame, 600) === 300,
  ],
  [
    "AF Home discards Inspection return state instead of restoring it",
    discardInspectionReturnFrame(homeDiscardStore, supportQueryContextKey) &&
      getInspectionReturnFrame(homeDiscardStore, supportQueryContextKey) ===
        null,
  ],
  [
    "AG failed support queries leave no Inspection return frame",
    getInspectionReturnFrame(
      failedSupportQueryStore,
      supportQueryContextKey,
    ) === null,
  ],
  [
    "AH unsupported destinations do not invalidate the inspectable source frame",
    !canInspectResource(unsupportedResource) &&
      canInspectResource(supportSourceResource) &&
      getInspectionReturnFrame(
        unsupportedDestinationStore,
        "query:qa-video-resource|return=collection:collection-work",
      )?.resourceId === supportSourceResource.id,
  ],
  [
    "AI Inspection return frames are consumed exactly once",
    consumedInspectionReturnFrame === inspectionReturnFrame &&
      consumeInspectionReturnFrame(
        inspectionReturnStore,
        supportQueryContextKey,
      ) === null,
  ],
  [
    "AJ Inspection return state does not mutate Artifact status or membership",
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
