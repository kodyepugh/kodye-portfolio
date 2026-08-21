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
  parseMarkdownStructuredDocument,
} = require(path.join(
  projectRoot,
  "lib/content/markdown-structured-document.ts",
));
const {
  canConsumeDirectResourceInspectionIntent,
  createDirectResourceInspectionIntent,
  isDirectResourceInspectionIntentStale,
} = require(path.join(
  projectRoot,
  "lib/reservoir/direct-resource-inspection-intent.ts",
));
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
  getPublishedExternalLinkRepresentations,
  getExternalLinkInspectionActionLabel,
  getExternalLinkInspectionLocationLabel,
  getExternalLinkInspectionProviderLabel,
  resolveExternalLinkInspection,
} = require(path.join(
  projectRoot,
  "lib/content/external-link-inspection.ts",
));
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
  getPublishedResourcesSupportedByFromRegistry,
  getPublishedResourceContextFromRegistry,
} = require(path.join(projectRoot, "lib/content/selectors.ts"));
const {
  RESOURCE_IDS,
} = require(path.join(projectRoot, "content/digital-reservoir/artifacts.ts"));
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
  getCollectionInspectionReturnFrame,
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
const comprehensiveCaseStudy = getResourceById(
  "resource-bellabeat-comprehensive-case-study",
);
const notebookResource = getResourceById(
  "resource-fitbit-identifier-revision-audit-notebook",
);
const brandSymbol = getResourceById("artifact-kodyepugh-symbol");
const repositoryResource = getResourceById(RESOURCE_IDS.bellabeatRepository);
const imageResource = contentRegistry.resources.find(
  (resource) => resource.inspectionKind === "image",
);
const imageResolution = resolveImageInspection(brandSymbol);
const comprehensiveMarkdownSource =
  comprehensiveCaseStudy?.content?.kind === "structured-document" &&
  "markdownSource" in comprehensiveCaseStudy.content
    ? comprehensiveCaseStudy.content.markdownSource
    : null;
const comprehensiveMarkdown = comprehensiveMarkdownSource
  ? fs.readFileSync(
      path.join(projectRoot, "public", comprehensiveMarkdownSource.path),
      "utf8",
    )
  : "";
const comprehensiveBlocks = comprehensiveMarkdownSource
  ? parseMarkdownStructuredDocument(comprehensiveMarkdown, {
      resourceId: comprehensiveCaseStudy.id,
      figureResourceIds: comprehensiveMarkdownSource.figureResourceIds,
    })
  : [];
const directIntent = createDirectResourceInspectionIntent(
  "resource-direct",
  "query:resource-direct|return=collection:root",
  7,
);
const reservoirSceneSource = fs.readFileSync(
  path.join(projectRoot, "components/reservoir/ReservoirScene.tsx"),
  "utf8",
);
const inspectionCssSource = fs.readFileSync(
  path.join(projectRoot, "app/globals.css"),
  "utf8",
);
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
const syntheticExternalLinkResource = {
  objectType: "resource",
  id: "qa-external-link-resource",
  slug: "qa-external-link-slug",
  title: "QA External Link Resource",
  type: "repository",
  inspectionKind: "external-link",
  isArtifact: false,
  published: true,
  representations: [
    {
      id: "qa-external-link-rep-b",
      kind: "external",
      url: "https://example.com/second",
      label: "Second target",
      order: 2,
      published: true,
    },
    {
      id: "qa-external-link-rep-a",
      kind: "external",
      url: "https://example.com/first",
      label: "First target",
      order: 1,
      published: true,
    },
    {
      id: "qa-external-link-rep-inline",
      kind: "inline",
      format: "markdown",
      body: "[ignored](https://example.com/ignored)",
      order: 0,
      published: true,
    },
  ],
  content: {
    kind: "external-link",
    status: "ready",
    url: "https://example.com/content",
    label: "Fallback content target",
  },
};
const syntheticExternalLinkFallbackResource = {
  objectType: "resource",
  id: "qa-external-link-fallback-resource",
  slug: "qa-external-link-fallback-resource",
  title: "QA External Link Fallback Resource",
  type: "webpage",
  inspectionKind: "external-link",
  isArtifact: false,
  published: true,
  content: {
    kind: "external-link",
    status: "ready",
    url: "https://example.com/fallback",
    label: "Fallback content target",
  },
};
const syntheticExternalLinkUnavailableResource = {
  objectType: "resource",
  id: "qa-external-link-unavailable-resource",
  slug: "qa-external-link-unavailable-resource",
  title: "QA External Link Unavailable Resource",
  type: "repository",
  inspectionKind: "external-link",
  isArtifact: false,
  published: true,
  representations: [
    {
      id: "qa-external-link-rep-invalid",
      kind: "external",
      url: "   ",
      label: "Broken target",
      order: 1,
      published: true,
    },
  ],
  content: {
    kind: "external-link",
    status: "ready",
    url: "   ",
    label: "Broken fallback target",
  },
};
const syntheticExternalLinkInvalidUrlResource = {
  objectType: "resource",
  id: "qa-external-link-invalid-url-resource",
  slug: "qa-external-link-invalid-url-resource",
  title: "QA External Link Invalid URL Resource",
  type: "repository",
  inspectionKind: "external-link",
  isArtifact: false,
  published: true,
  content: {
    kind: "external-link",
    status: "ready",
    url: "not-a-url",
    label: "Broken content target",
  },
};
const syntheticExternalLinkUnsafeSchemeResource = {
  objectType: "resource",
  id: "qa-external-link-unsafe-scheme-resource",
  slug: "qa-external-link-unsafe-scheme-resource",
  title: "QA External Link Unsafe Scheme Resource",
  type: "webpage",
  inspectionKind: "external-link",
  isArtifact: false,
  published: true,
  representations: [
    {
      id: "qa-external-link-rep-javascript",
      kind: "external",
      url: "javascript:alert(1)",
      label: "Unsafe javascript target",
      order: 1,
      published: true,
    },
  ],
  content: {
    kind: "external-link",
    status: "ready",
    url: "data:text/html,<h1>unsafe</h1>",
    label: "Unsafe data target",
  },
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
const incomingSupportEntries = getPublishedResourcesSupportedByFromRegistry(
  supportRegistry,
  supportTargetResource.id,
);
const deduplicatedSupportRegistry = {
  ...supportRegistry,
  resourceSupportRelations: [
    ...supportRegistry.resourceSupportRelations,
    {
      id: "qa-inspection-support-rel-visible-duplicate",
      sourceResourceId: supportSourceResource.id,
      targetResourceId: supportTargetResource.id,
      relationshipType: "supporting",
      order: 3,
      published: true,
      label: "Duplicate",
      role: "supporting-report",
    },
  ],
};
const bidirectionalSupportContext = getPublishedResourceContextFromRegistry(
  deduplicatedSupportRegistry,
  supportTargetResource.id,
);
const inspectionStyles = fs.readFileSync(
  path.join(projectRoot, "app/globals.css"),
  "utf8",
);
const sharedInspectionBodyRule =
  inspectionStyles.match(/\.artifact-window__body\s*\{([^}]*)\}/)?.[1] ?? "";
const inspectionCloseRule =
  inspectionStyles.match(/\.inspection-window__close-row\s*\{([^}]*)\}/)?.[1] ?? "";
const artifactCloseRule =
  inspectionStyles.match(/\.artifact-window__close\s*\{([^}]*)\}/)?.[1] ?? "";
const inspectionSource = fs.readFileSync(
  path.join(projectRoot, "components/reservoir/InspectionWindow.tsx"),
  "utf8",
);
const validSyntheticRegistry = {
  ...contentRegistry,
  resources: [
    ...contentRegistry.resources,
    nonArtifactDocument,
    syntheticExternalLinkResource,
  ],
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
const publishedExternalLinkRepresentations =
  getPublishedExternalLinkRepresentations(syntheticExternalLinkResource);
const resolvedExternalLinkInspection = resolveExternalLinkInspection(
  syntheticExternalLinkResource,
);
const fallbackExternalLinkInspection = resolveExternalLinkInspection(
  syntheticExternalLinkFallbackResource,
);
const unavailableExternalLinkInspection = resolveExternalLinkInspection(
  syntheticExternalLinkUnavailableResource,
);
const invalidExternalLinkInspection = resolveExternalLinkInspection(
  syntheticExternalLinkInvalidUrlResource,
);
const unsafeSchemeExternalLinkInspection = resolveExternalLinkInspection(
  syntheticExternalLinkUnsafeSchemeResource,
);
const publishedRepositoryInspection = repositoryResource
  ? resolveExternalLinkInspection(repositoryResource)
  : null;

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
const ordinaryCollectionHistory = [
  { collectionId: ROOT_COLLECTION_ID },
  { collectionId: "collection-web" },
];
const inspectionCollectionHistory = [
  { collectionId: ROOT_COLLECTION_ID },
  {
    collectionId: "collection-about-self",
    inspectionReturn: inspectionReturnFrame,
  },
];
const nestedInspectionCollectionHistory = [
  ...inspectionCollectionHistory,
  { collectionId: "collection-digital-reservoir" },
];
const collectionReturnFrame = getCollectionInspectionReturnFrame(
  inspectionCollectionHistory,
);
const nestedFirstBackHistory = nestedInspectionCollectionHistory.slice(0, -1);
const nestedSecondBackHistory = nestedFirstBackHistory.slice(0, -1);

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
    "S primary Bellabeat article remains a canonical structured document",
    bellabeat.content.kind === "structured-document" &&
      getStructuredDocumentBody(bellabeat).source === "canonical" &&
      getStructuredDocumentBody(bellabeat).blocks.length > 0,
  ],
  [
    "full comprehensive Markdown adapts into native headings, tables, lists, and all ten figures",
    comprehensiveCaseStudy?.inspectionKind === "structured-document" &&
      comprehensiveBlocks.filter((block) => block.type === "heading").length >= 20 &&
      comprehensiveBlocks.filter((block) => block.type === "table").length >= 3 &&
      comprehensiveBlocks.filter((block) => block.type === "list").length >= 4 &&
      comprehensiveBlocks.filter((block) => block.type === "figure").length === 10,
  ],
  [
    "notebook opens the common chassis while retaining an explicit unsupported renderer",
    notebookResource?.inspectionKind === "notebook-code" &&
      canInspectResource(notebookResource) &&
      getResourceInspectionSurface(notebookResource.inspectionKind) ===
        "unsupported",
  ],
  [
    "direct Resource intent consumes only its exact settled single-result query",
    canConsumeDirectResourceInspectionIntent(
      directIntent,
      directIntent.queryContextKey,
      directIntent.queryRevision,
      [directIntent.resourceId],
    ) &&
      !canConsumeDirectResourceInspectionIntent(
        directIntent,
        directIntent.queryContextKey,
        directIntent.queryRevision,
        [directIntent.resourceId, "resource-other"],
      ),
  ],
  [
    "stale direct Resource intents fail closed on revision or context changes",
    isDirectResourceInspectionIntentStale(
      directIntent,
      directIntent.queryContextKey,
      directIntent.queryRevision + 1,
    ) &&
      isDirectResourceInspectionIntentStale(
        directIntent,
        "query:resource-other|return=collection:root",
        directIntent.queryRevision,
      ),
  ],
  [
    "menu and Inspection support navigation share the canonical direct Resource coordinator",
    reservoirSceneSource.includes(
      "requestDirectResourceRef.current(\n          supportNavigationTarget",
    ) &&
      reservoirSceneSource.includes(
        "requestDirectResource(resourceAddress)",
      ) &&
      reservoirSceneSource.includes(
        "createDirectResourceInspectionIntent(",
      ),
  ],
  [
    "relationship shelf pins four rows with horizontal overflow and shared height",
    inspectionCssSource.includes("grid-template-rows: repeat(4, 38px)") &&
    inspectionCssSource.includes("grid-auto-flow: column") &&
      inspectionCssSource.includes("overflow-x: auto") &&
      inspectionCssSource.includes("min-height: 182px") &&
      inspectionCssSource.includes("width: min(260px, calc(100vw - 56px))"),
  ],
  [
    "image tonal field belongs to the aspect-ratio frame rather than layout allocation",
    inspectionCssSource.includes("--inspection-image-aspect-ratio: 1") &&
      inspectionCssSource.includes(
        "aspect-ratio: var(--inspection-image-aspect-ratio)",
      ) &&
      /\.inspection-image__stage\s*\{[\s\S]*?background: transparent;/.test(
        inspectionCssSource,
      ) &&
      /\.inspection-image__frame\s*\{[\s\S]*?background:/.test(
        inspectionCssSource,
      ),
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
    "incoming support context exposes the canonical source resource",
    incomingSupportEntries.length === 1 &&
      incomingSupportEntries[0].resource === supportSourceResource &&
      incomingSupportEntries[0].relationshipId ===
        "qa-inspection-support-rel-visible",
  ],
  [
    "bidirectional context deduplicates semantic resources",
    bidirectionalSupportContext.length === 1 &&
      bidirectionalSupportContext[0].resource === supportSourceResource &&
      bidirectionalSupportContext[0].direction === "incoming",
  ],
  [
    "shared Inspection body owns the full available frame",
    /\bwidth:\s*100%;/.test(sharedInspectionBodyRule) &&
      /\bmargin-inline:\s*0;/.test(sharedInspectionBodyRule) &&
      inspectionStyles.includes("--inspection-primary-track") &&
      inspectionStyles.includes("minmax(0, var(--inspection-primary-track))"),
  ],
  [
    "Inspection close uses an ordinary in-flow hit area",
    /\bheight:\s*44px;/.test(inspectionCloseRule) &&
      /\bmargin:\s*0 0 -44px;/.test(inspectionCloseRule) &&
      !/\bposition:\s*(?:fixed|sticky);/.test(inspectionCloseRule) &&
      !/\bposition:\s*fixed;/.test(artifactCloseRule) &&
      !/\.inspection-window__close-row[\s\S]*?transform:\s*translateY\(var\(--artifact-window-offset\)\)/.test(
        inspectionStyles,
      ),
  ],
  [
    "shared Inspection chassis gates Back to Top on close-button visibility",
    inspectionSource.includes('className="inspection-window__back-to-top"') &&
      inspectionSource.includes('aria-label="Back to top"') &&
      inspectionSource.includes("updatePostContentOffset(0)") &&
      inspectionSource.includes("IntersectionObserver") &&
      inspectionSource.includes("closeButtonVisibleInViewport") &&
      inspectionSource.includes("useState<boolean | null>(null)") &&
      inspectionSource.includes(
        "const showBackToTop = closeButtonVisibleInViewport === false;",
      ) &&
      inspectionSource.includes("{phase === \"reading\" ? (") &&
      inspectionSource.includes("disabled={!showBackToTop}") &&
      inspectionSource.includes(
        "data-back-to-top-visible={showBackToTop}",
      ) &&
      inspectionStyles.includes("grid-column: 3") &&
      inspectionStyles.includes("grid-row: 2") &&
      inspectionStyles.includes("grid-column: 2") &&
      inspectionStyles.includes("visibility: hidden;") &&
      inspectionStyles.includes("pointer-events: none;") &&
      inspectionStyles.includes(
        '[data-back-to-top-visible="true"]',
      ),
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
  [
    "AK ordinary Collection history has no Inspection return ownership",
    getCollectionInspectionReturnFrame(ordinaryCollectionHistory) === null &&
      ordinaryCollectionHistory.slice(0, -1).at(-1)?.collectionId ===
        ROOT_COLLECTION_ID,
  ],
  [
    "AL Inspection-originated Collection history retains its frame on the arrival hop",
    collectionReturnFrame === inspectionReturnFrame &&
      collectionReturnFrame.resourceId === supportSourceResource.id,
  ],
  [
    "AM nested Collection Back consumes the outer hop before reopening",
    getCollectionInspectionReturnFrame(nestedFirstBackHistory) ===
        inspectionReturnFrame &&
      getCollectionInspectionReturnFrame(nestedSecondBackHistory) ===
        null &&
      nestedFirstBackHistory.at(-1)?.collectionId ===
        "collection-about-self" &&
      nestedSecondBackHistory.at(-1)?.collectionId === ROOT_COLLECTION_ID,
  ],
  [
    "AN nested Collection Back preserves the originating frame until its boundary is crossed",
    getCollectionInspectionReturnFrame(nestedInspectionCollectionHistory) ===
      null &&
      nestedFirstBackHistory.at(-1)?.inspectionReturn === inspectionReturnFrame,
  ],
  [
    "AO Home discards Collection Inspection return ownership",
    nestedSecondBackHistory.length === 1 &&
      getCollectionInspectionReturnFrame(nestedSecondBackHistory) === null,
  ],
  [
    "AP current Collection selection does not create a new history hop",
    inspectionCollectionHistory.length === 2 &&
      inspectionCollectionHistory.at(-1)?.collectionId ===
        "collection-about-self",
  ],
  [
    "AQ invalid Collection return sources fail closed without reopening",
    !canInspectResource(unsupportedResource) &&
      collectionReturnFrame.resourceId === supportSourceResource.id,
  ],
  [
    "AR external-link inspection dispatches to the dedicated surface",
    getResourceInspectionSurface("external-link") === "external-link" &&
      repositoryResource !== null &&
      canInspectResource(repositoryResource) &&
      getReservoirResourceSelectionAction(
        adaptResourceToReservoirContentNode(repositoryResource),
        repositoryResource.id,
      ) === "open-resource-inspection",
  ],
  [
    "AS external-link representation ordering is deterministic and ignores unrelated kinds",
    publishedExternalLinkRepresentations.map((representation) => representation.id)
      .join(",") === "qa-external-link-rep-a,qa-external-link-rep-b" &&
      publishedExternalLinkRepresentations.every(
        (representation) => representation.kind === "external",
      ),
  ],
  [
    "AT repository and generic presentation helpers stay truthful",
    getExternalLinkInspectionActionLabel("repository") === "Open repository" &&
      getExternalLinkInspectionActionLabel("webpage") ===
        "Open external resource" &&
      publishedRepositoryInspection !== null &&
      getExternalLinkInspectionProviderLabel(
        publishedRepositoryInspection.target,
      ) === "GitHub" &&
      getExternalLinkInspectionProviderLabel(
        fallbackExternalLinkInspection.status === "ready"
          ? fallbackExternalLinkInspection.target
          : { hostname: "", sourceLabel: undefined },
      ) === "example.com" &&
      getExternalLinkInspectionLocationLabel(
        fallbackExternalLinkInspection.status === "ready"
          ? fallbackExternalLinkInspection.target
          : { hostname: "", pathname: "/" },
        "webpage",
      ) === "/fallback",
  ],
  [
    "AU repository resources resolve through the published external-link representation",
    publishedRepositoryInspection?.status === "ready" &&
      publishedRepositoryInspection.source === "representation" &&
      publishedRepositoryInspection.target.hostname === "github.com" &&
      publishedRepositoryInspection.target.pathname ===
        "/kodyepugh/bellabeat-wellness-analysis",
  ],
  [
    "AV ordered published external-link Resources pick the first usable representation",
    resolvedExternalLinkInspection.status === "ready" &&
      resolvedExternalLinkInspection.source === "representation" &&
      resolvedExternalLinkInspection.target.url ===
        "https://example.com/first" &&
      resolvedExternalLinkInspection.target.label === "First target",
  ],
  [
    "AW external-link content fallback resolves when no published representation is usable",
    fallbackExternalLinkInspection.status === "ready" &&
      fallbackExternalLinkInspection.source === "content" &&
      fallbackExternalLinkInspection.target.url ===
        "https://example.com/fallback",
  ],
  [
    "AX explicit unsafe-scheme resources resolve as unavailable",
    unsafeSchemeExternalLinkInspection.status === "unavailable" &&
      unsafeSchemeExternalLinkInspection.details.some((detail) =>
        detail.includes("unsupported URL protocol"),
      ) &&
      validateContentRegistry({
        ...contentRegistry,
        resources: [
          ...contentRegistry.resources,
          syntheticExternalLinkUnsafeSchemeResource,
        ],
      }).errors.some((error) => error.includes("unsupported protocol")),
  ],
  [
    "AY unavailable external-link Resources report an explicit failure",
    unavailableExternalLinkInspection.status === "unavailable" &&
      unavailableExternalLinkInspection.reason.includes("unavailable") &&
      unavailableExternalLinkInspection.details.some((detail) =>
        detail.includes("usable URL"),
      ),
  ],
  [
    "AZ invalid external-link content is rejected",
    invalidExternalLinkInspection.status === "unavailable" &&
      invalidExternalLinkInspection.details.some((detail) =>
        detail.includes("invalid URL"),
      ),
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
