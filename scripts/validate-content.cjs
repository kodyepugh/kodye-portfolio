/* eslint-disable @typescript-eslint/no-require-imports -- The validation runner installs a small CommonJS TypeScript loader before importing the typed registry. */
const fs = require("node:fs");
const crypto = require("node:crypto");
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
const { ARTIFACT_IDS, RESOURCE_IDS } = require(path.join(
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
  getReservoirContentNodesBySemanticIds,
  getReservoirNodeSizingFamily,
  getReservoirCollectionNodeById,
} = require(path.join(projectRoot, "lib/content/reservoir-adapter.ts"));
const {
  getMediumColor,
  getMediumLabel,
} = require(path.join(projectRoot, "lib/content/object-metadata.ts"));
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
  getAssetsForArtifact,
  getCollectionById,
  getCollectionByAddress,
  getCollectionMembers,
  getPublishedCollectionMembers,
  getPublishedResourceCollections,
  getPublishedFooterResources,
  getPublishedSupportingResources,
  getPublishedSupportingResourcesFromRegistry,
  getPublishedResourcesSupportedByFromRegistry,
  getPublishedResourceContextFromRegistry,
  getResourceByAddress,
  getResourceById,
  getResourceRepresentations,
  getSourceRecordsForArtifact,
  getSourceRecordsForAsset,
  resolveSemanticObjectAddress,
} = require(path.join(projectRoot, "lib/content/selectors.ts"));
const { assertValidContentRegistry } = require(path.join(
  projectRoot,
  "lib/content/validation.ts",
));
const {
  getStructuredDocumentBody,
} = require(path.join(
  projectRoot,
  "lib/content/structured-document.ts",
));
const {
  validateContactSubmission,
} = require(path.join(projectRoot, "lib/contact-form.ts"));

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
const syntheticSupportSource = {
  objectType: "resource",
  id: "qa-support-source",
  slug: "qa-support-source",
  title: "QA Support Source",
  type: "report",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: true,
};
const syntheticSupportTargetAlpha = {
  objectType: "resource",
  id: "qa-support-target-alpha",
  slug: "qa-support-target-alpha",
  title: "QA Support Target Alpha",
  type: "document",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: true,
};
const syntheticSupportTargetBeta = {
  objectType: "resource",
  id: "qa-support-target-beta",
  slug: "qa-support-target-beta",
  title: "QA Support Target Beta",
  type: "image",
  inspectionKind: "image",
  isArtifact: true,
  published: true,
};
const syntheticSupportTargetHidden = {
  objectType: "resource",
  id: "qa-support-target-hidden",
  slug: "qa-support-target-hidden",
  title: "QA Support Target Hidden",
  type: "document",
  inspectionKind: "structured-document",
  isArtifact: false,
  published: false,
};
const syntheticSupportRegistry = {
  ...contentRegistry,
  resources: [
    ...contentRegistry.resources,
    syntheticSupportSource,
    syntheticSupportTargetAlpha,
    syntheticSupportTargetBeta,
    syntheticSupportTargetHidden,
  ],
  resourceSupportRelations: [
    {
      id: "qa-support-rel-hidden",
      sourceResourceId: syntheticSupportSource.id,
      targetResourceId: syntheticSupportTargetHidden.id,
      relationshipType: "supporting",
      order: 3,
      published: true,
      label: "Hidden",
      role: "supporting-report",
    },
    {
      id: "qa-support-rel-beta",
      sourceResourceId: syntheticSupportSource.id,
      targetResourceId: syntheticSupportTargetBeta.id,
      relationshipType: "supporting",
      order: 2,
      published: true,
      label: "Second",
      role: "supporting-figure",
    },
    {
      id: "qa-support-rel-alpha",
      sourceResourceId: syntheticSupportSource.id,
      targetResourceId: syntheticSupportTargetAlpha.id,
      relationshipType: "supporting",
      order: 1,
      published: true,
      label: "First",
      role: "supporting-report",
    },
    {
      id: "qa-support-rel-unpublished",
      sourceResourceId: syntheticSupportSource.id,
      targetResourceId: syntheticSupportTargetAlpha.id,
      relationshipType: "supporting",
      order: 0,
      published: false,
      label: "Hidden by relationship",
      role: "supporting-report",
    },
  ],
};
const syntheticPublishedSupportingResources =
  getPublishedSupportingResourcesFromRegistry(
    syntheticSupportRegistry,
    syntheticSupportSource.id,
  );
const syntheticPublishedIncomingResources =
  getPublishedResourcesSupportedByFromRegistry(
    syntheticSupportRegistry,
    syntheticSupportTargetAlpha.id,
  );
const syntheticDeduplicatedSupportRegistry = {
  ...syntheticSupportRegistry,
  resourceSupportRelations: [
    ...syntheticSupportRegistry.resourceSupportRelations,
    {
      id: "qa-support-rel-alpha-duplicate",
      sourceResourceId: syntheticSupportSource.id,
      targetResourceId: syntheticSupportTargetAlpha.id,
      relationshipType: "supporting",
      order: 4,
      published: true,
      label: "Duplicate",
      role: "supporting-report",
    },
    {
      id: "qa-support-rel-alpha-reverse",
      sourceResourceId: syntheticSupportTargetAlpha.id,
      targetResourceId: syntheticSupportSource.id,
      relationshipType: "supporting",
      order: 1,
      published: true,
      label: "Independent reverse fact",
      role: "validation-evidence",
    },
    {
      id: "qa-support-rel-alpha-reverse-duplicate",
      sourceResourceId: syntheticSupportTargetAlpha.id,
      targetResourceId: syntheticSupportSource.id,
      relationshipType: "supporting",
      order: 4,
      published: true,
      label: "Duplicate reverse fact",
      role: "validation-evidence",
    },
  ],
};
const syntheticResourceContext = getPublishedResourceContextFromRegistry(
  syntheticDeduplicatedSupportRegistry,
  syntheticSupportSource.id,
);
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
const bellabeatSupportingResources = getPublishedSupportingResources(
  ARTIFACT_IDS.bellabeat,
).map((relationship) => relationship.resource);
const bellabeatFullDocumentResources = bellabeatSupportingResources.filter(
  (resource) =>
    resource.content?.kind === "structured-document" &&
    "markdownSource" in resource.content,
);
const bellabeatImageResources = bellabeatSupportingResources.filter(
  (resource) => resource.inspectionKind === "image",
);
const comprehensiveCaseStudy = getResourceById(
  "resource-bellabeat-comprehensive-case-study",
);
const notebookResource = getResourceById(
  "resource-fitbit-identifier-revision-audit-notebook",
);
const bellabeatAuditedResourceIds = new Set([
  ARTIFACT_IDS.bellabeat,
  ...bellabeatSupportingResources.map((resource) => resource.id),
]);
const bellabeatAuditedRelationships =
  contentRegistry.resourceSupportRelations.filter(
    (relationship) =>
      bellabeatAuditedResourceIds.has(relationship.sourceResourceId) &&
      bellabeatAuditedResourceIds.has(relationship.targetResourceId),
  );
const bellabeatRelationshipPairs = new Set(
  bellabeatAuditedRelationships.map(
    (relationship) =>
      `${relationship.sourceResourceId}->${relationship.targetResourceId}`,
  ),
);
const comprehensiveContext = getPublishedResourceContextFromRegistry(
  contentRegistry,
  "resource-bellabeat-comprehensive-case-study",
);
const identifierAuditContext = getPublishedResourceContextFromRegistry(
  contentRegistry,
  "resource-bellabeat-identifier-population-audit",
);
const notebookContext = getPublishedResourceContextFromRegistry(
  contentRegistry,
  "resource-fitbit-identifier-revision-audit-notebook",
);
const resumeStructuredContent = getResourceById(ARTIFACT_IDS.resume)?.content;
const resumeStructuredBlocks =
  resumeStructuredContent?.kind === "structured-document"
    ? resumeStructuredContent.blocks
    : [];
const rootReservoirIndexNodes = getReservoirContentNodes(ROOT_COLLECTION_ID);
const queryReservoirIndexNodes = getReservoirContentNodesBySemanticIds([
  RESOURCE_IDS.bellabeatRepository,
]);
const reservoirIndexSource = fs.readFileSync(
  path.join(projectRoot, "components/navigation/ReservoirIndex.tsx"),
  "utf8",
);
const reservoirSceneSource = fs.readFileSync(
  path.join(projectRoot, "components/reservoir/ReservoirScene.tsx"),
  "utf8",
);
const reservoirFooterSource = fs.readFileSync(
  path.join(projectRoot, "components/navigation/ReservoirFooter.tsx"),
  "utf8",
);
const checks = [
  [
    "published Objects carry canonical Medium and system dates",
    [...contentRegistry.resources, ...contentRegistry.collections]
      .filter((object) => object.published === true)
      .every((object) => object.medium && object.createdAt && object.updatedAt),
  ],
  [
    "Medium color authority is deterministic for launch node classes",
    getMediumColor("collection") === "#000000" &&
      getMediumColor("document") === "#28758c" &&
      getMediumColor("form") === "#6f8065" &&
      getMediumLabel("link") === "Link",
  ],
  [
    "Reservoir nodes expose Medium presentation without replacing Resource type",
    (() => {
      const bellabeat = getArtifactById(ARTIFACT_IDS.bellabeat);
      const node = bellabeat && adaptResourceToReservoirContentNode(bellabeat);
      return bellabeat?.type === "case-study" && node?.medium === "document" &&
        node.mediumLabel === "Document" && node.mediumColor === "#28758c";
    })(),
  ],
  ["root collection resolves", Boolean(getCollectionById(ROOT_COLLECTION_ID))],
  [
    "launch root has exactly Bellabeat, Resume, and Contact",
    getPublishedCollectionMembers(ROOT_COLLECTION_ID).map((member) =>
      member.kind === "artifact" ? member.artifact.id : member.collection.id,
    ).join(",") ===
      [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].join(","),
  ],
  [
    "Reservoir Index projects the active canonical nodes as a semantic Title, Medium, Added, and Modified list",
    rootReservoirIndexNodes.map((node) => node.id).join(",") ===
      [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].join(",") &&
      rootReservoirIndexNodes.every(
        (node) =>
          node.mediumLabel === getMediumLabel(node.medium) &&
          node.title &&
          node.createdAt &&
          node.updatedAt,
      ) &&
      reservoirIndexSource.includes("<ul") &&
      reservoirIndexSource.includes("nodes.map") &&
      reservoirIndexSource.includes("node.mediumLabel") &&
      reservoirIndexSource.includes("node.title") &&
      reservoirIndexSource.includes("formatObjectDate(node.createdAt)") &&
      reservoirIndexSource.includes("formatObjectDate(node.updatedAt)") &&
      reservoirIndexSource.includes("<MediumIcon") &&
      !reservoirIndexSource.includes("node.description") &&
      !reservoirIndexSource.includes("node.relationship"),
  ],
  [
    "Reservoir Index can project a published non-Artifact Query Resource without Collection membership",
    queryReservoirIndexNodes.length === 1 &&
      queryReservoirIndexNodes[0].id === RESOURCE_IDS.bellabeatRepository &&
      queryReservoirIndexNodes[0].kind === "resource" &&
      queryReservoirIndexNodes[0].isArtifact === false &&
      !contentRegistry.memberships.some(
        (membership) => membership.memberId === RESOURCE_IDS.bellabeatRepository,
      ),
  ],
  [
    "Index selection retains canonical Collection transitions, rotates its existing Resource to the live forehead point, and returns to Index after inspection close",
    reservoirSceneSource.includes('if (node.kind === "collection")') &&
      reservoirSceneSource.includes("requestCollection(node.id, true)") &&
      reservoirSceneSource.includes(
        "getReservoirResourceSelectionAction(node, node.id)",
      ) &&
      reservoirSceneSource.includes("setSelectedResourceId(node.id)") &&
      reservoirSceneSource.includes(
        "rotateResourceToCanonicalForehead(node.id, \"index\")",
      ) &&
      reservoirSceneSource.includes(
        "activeRotationGroup.quaternion.slerpQuaternions(",
      ) &&
      reservoirSceneSource.includes(
        "new THREE.Vector3(...focalDiagnostics.targetWorld)",
      ) &&
      reservoirSceneSource.includes("setPendingFocalInspection({") &&
      reservoirSceneSource.includes("setIndexInspectionReturn({ resourceId, contextKey })") &&
      reservoirSceneSource.includes('setIndexState("opening")') &&
      reservoirSceneSource.includes('setIndexState("closing")') &&
      !reservoirSceneSource.includes(
        "directions.set(resourceId, focalDiagnostics.targetLocal)",
      ) &&
      !reservoirSceneSource.includes("requestDirectResource(node.id)") &&
      !reservoirSceneSource.includes("ReservoirMenu"),
  ],
  [
    "footer destinations rotate active Resources to the canonical forehead point before falling back to direct Query navigation",
    getPublishedFooterResources().map((resource) => resource.id).join(",") ===
      [ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].join(",") &&
      getResourceById(ARTIFACT_IDS.about)?.footerNavigation === true &&
      getResourceById(ARTIFACT_IDS.about)?.published === false &&
      reservoirFooterSource.includes("getPublishedFooterResources") &&
      reservoirFooterSource.includes("onResourceSelect") &&
      reservoirSceneSource.includes("const activeResourceNode = activeReservoirResources.find(") &&
      reservoirSceneSource.includes(
        "rotateResourceToCanonicalForehead(resourceId, \"footer\")",
      ) &&
      reservoirSceneSource.includes("if (!requestDirectResource(resourceId)) return") &&
      !reservoirFooterSource.includes("href=\"#\"") &&
      !reservoirFooterSource.includes("LinkedIn"),
  ],
  [
    "launch artifacts resolve",
    [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].every(
      (artifactId) => Boolean(getArtifactById(artifactId)),
    ),
  ],
  [
    "only root collection is published",
    contentRegistry.collections.filter((collection) => collection.published === true).length === 1 &&
      contentRegistry.collections.find((collection) => collection.published === true)?.id === ROOT_COLLECTION_ID,
  ],
  [
    "launch artifacts are published and artifact-status",
    [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].every(
      (artifactId) => {
        const artifact = getArtifactById(artifactId);
        return artifact?.published === true && artifact.isArtifact === true;
      },
    ),
  ],
  [
    "unfinished launch Resources are unpublished",
    [ARTIFACT_IDS.about, ARTIFACT_IDS.reservoirStudy].every(
      (artifactId) => getResourceById(artifactId)?.published === false,
    ),
  ],
  [
    "no published placeholder Resources remain",
    contentRegistry.resources.every(
      (resource) =>
        resource.published !== true || resource.content?.status !== "placeholder",
    ),
  ],
  [
    "Resume is a compact native structured document with a registered PDF download",
    getResourceById(ARTIFACT_IDS.resume)?.inspectionKind === "structured-document" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.kind === "structured-document" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.status === "ready" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.presentationProfile === "compact" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.blocks.at(-1)?.type === "download" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.blocks.at(-1)?.label ===
        "Download PDF" &&
      getResourceById(ARTIFACT_IDS.resume)?.content?.blocks.at(-1)?.assetId ===
        ASSET_IDS.resumePdf &&
      getResourceRepresentations(ARTIFACT_IDS.resume).some(
        (representation) =>
          representation.kind === "asset" &&
          representation.assetId === ASSET_IDS.resumePdf &&
          representation.published !== false,
      ) &&
      getAssetsForArtifact(ARTIFACT_IDS.resume).some(
        (asset) =>
          asset.id === ASSET_IDS.resumePdf &&
          asset.kind === "document" &&
          asset.mimeType === "application/pdf" &&
          asset.src === "/resume/Kodye_Pugh_Resume_2026.pdf" &&
          fs.existsSync(path.join(projectRoot, "public", asset.src)),
      ) &&
      getStructuredDocumentBody(getResourceById(ARTIFACT_IDS.resume)).presentationProfile ===
        "compact",
  ],
  [
    "Contact is a canonical contact-form with public professional profiles only",
    getResourceById(ARTIFACT_IDS.contact)?.inspectionKind === "contact-form" &&
      getResourceById(ARTIFACT_IDS.contact)?.content?.kind === "contact" &&
      getResourceById(ARTIFACT_IDS.contact)?.content?.socialLinks.map(
        (link) => `${link.provider}:${link.url}`,
      ).join(",") ===
        "linkedin:https://www.linkedin.com/in/kodyepugh/,github:https://github.com/kodyepugh",
  ],
  [
    "Resume semantic content preserves the approved section and entry hierarchy",
    resumeStructuredBlocks.filter((block) => block.type === "heading" && block.level === 2)
      .map((block) => block.text)
      .join(",") ===
        "Skills,Selected Data Analytics Project,Professional Experience,Additional Experience,Education,Certifications" &&
      resumeStructuredBlocks[0]?.type === "paragraph" &&
      resumeStructuredBlocks[0]?.text ===
        "Analyst and digital product professional who redesigned a federal task-tracking workflow, built CMS structures and information architectures for three client organizations, and developed a validated BigQuery analysis across more than 15 million wellness data rows. Combines SQL, Excel, Tableau, Python-supported workflows, requirements analysis, and stakeholder communication to turn ambiguous operational needs into reliable systems, defensible insights, and actionable recommendations." &&
      resumeStructuredBlocks.filter((block) => block.type === "entry")
        .map((block) => block.title)
        .join(",") ===
          "Bellabeat Wellness-Behavior Analysis,Independent Web & Digital Product Consultant,U.S. Department of Education - Federal Student Aid,Netflix Productions,Various Production Companies,Stanford University & Loyola Marymount University,Loyola Marymount University,Stanford University,Google Data Analytics Professional Certificate,Finance & Quantitative Modeling for Analysts Specialization",
  ],
  [
    "Contact submissions reject malformed input and accept bounded safe input",
    validateContactSubmission({
      name: "Recruiter",
      email: "recruiter@example.com",
      subject: "Portfolio question",
      message: "Could we schedule a conversation?",
    }).valid === true &&
      validateContactSubmission({ name: "", email: "invalid", message: "" }).valid === false &&
      validateContactSubmission({
        name: "Recruiter\nBcc: bad@example.com",
        email: "recruiter@example.com",
        message: "Hello",
      }).valid === false &&
      validateContactSubmission({
        name: "Recruiter",
        email: "recruiter@example.com",
        message: "Hello",
        website: "bot.example",
      }).valid === false,
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
    "Bellabeat has one published launch Collection without duplication",
    getPublishedResourceCollections(ARTIFACT_IDS.bellabeat).length === 1 &&
      getPublishedResourceCollections(ARTIFACT_IDS.bellabeat)[0].id === ROOT_COLLECTION_ID &&
      contentRegistry.artifacts.filter(
        (artifact) => artifact.id === ARTIFACT_IDS.bellabeat,
      ).length === 1,
  ],
  [
    "unpublished future Collections are not root launch members",
    getCollectionMembers(ROOT_COLLECTION_ID).every(
      (member) => member.kind === "artifact",
    ) &&
      [
        COLLECTION_IDS.work,
        COLLECTION_IDS.dataAnalytics,
        COLLECTION_IDS.web,
        COLLECTION_IDS.filmCreative,
        COLLECTION_IDS.aboutSelf,
      ].every((collectionId) => getCollectionById(collectionId)?.published === false),
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
    Array.isArray(getPublishedSupportingResources(ARTIFACT_IDS.bellabeat)) &&
      getPublishedSupportingResources(ARTIFACT_IDS.bellabeat).length === 18 &&
      getPublishedSupportingResources(ARTIFACT_IDS.bellabeat)[0]
        .targetResourceId === "resource-bellabeat-comprehensive-case-study",
  ],
  [
    "published support relationships filter and order deterministically",
    syntheticPublishedSupportingResources.length === 2 &&
      syntheticPublishedSupportingResources[0].targetResourceId ===
        syntheticSupportTargetAlpha.id &&
      syntheticPublishedSupportingResources[1].targetResourceId ===
        syntheticSupportTargetBeta.id &&
      syntheticPublishedSupportingResources[0].resource ===
        syntheticSupportTargetAlpha &&
      syntheticPublishedSupportingResources[1].resource ===
        syntheticSupportTargetBeta &&
      syntheticPublishedSupportingResources.every(
        (entry) => entry.relationship.published !== false,
      ) &&
      syntheticPublishedSupportingResources.every(
        (entry) => entry.resource.published === true,
      ),
  ],
  [
    "incoming support relationships expose the canonical source resource",
    syntheticPublishedIncomingResources.length === 1 &&
      syntheticPublishedIncomingResources[0].resource === syntheticSupportSource &&
      syntheticPublishedIncomingResources[0].relationshipId ===
        "qa-support-rel-alpha",
  ],
  [
    "resource context deduplicates within directions but preserves cross-direction facts",
    syntheticResourceContext.supportedBy
      .map((entry) => entry.resource.id)
      .join(",") ===
      `${syntheticSupportTargetAlpha.id},${syntheticSupportTargetBeta.id}` &&
      syntheticResourceContext.supports
        .map((entry) => entry.resource.id)
        .join(",") === syntheticSupportTargetAlpha.id &&
      syntheticResourceContext.supportedBy.every(
        (entry) => entry.direction === "outgoing",
      ) &&
      syntheticResourceContext.supports.every(
        (entry) => entry.direction === "incoming",
      ),
  ],
  [
    "Bellabeat support graph remains one directional semantic edge",
    contentRegistry.resourceSupportRelations.filter(
      (relationship) =>
        relationship.sourceResourceId === ARTIFACT_IDS.bellabeat &&
        relationship.targetResourceId === RESOURCE_IDS.bellabeatRepository,
    ).length === 1 &&
      contentRegistry.resourceSupportRelations.filter(
        (relationship) =>
          relationship.sourceResourceId === RESOURCE_IDS.bellabeatRepository &&
          relationship.targetResourceId === ARTIFACT_IDS.bellabeat,
      ).length === 0,
  ],
  [
    "audited Bellabeat graph has unique IDs, no duplicate pairs, and no accidental reciprocal edges",
    new Set(bellabeatAuditedRelationships.map((relationship) => relationship.id))
      .size === bellabeatAuditedRelationships.length &&
      bellabeatRelationshipPairs.size === bellabeatAuditedRelationships.length &&
      bellabeatAuditedRelationships.every(
        (relationship) =>
          !bellabeatRelationshipPairs.has(
            `${relationship.targetResourceId}->${relationship.sourceResourceId}`,
          ),
      ),
  ],
  [
    "comprehensive report directly resolves its audited documents, repository, and ten figures",
    comprehensiveContext.supportedBy.length === 16 &&
      [
        "resource-bellabeat-methodology-appendix",
        "resource-bellabeat-identifier-population-audit",
        "resource-bellabeat-analysis-decision-memo",
        "resource-bellabeat-marketing-recommendations",
        "resource-bellabeat-final-validation-report",
        RESOURCE_IDS.bellabeatRepository,
        ...bellabeatImageResources.map((resource) => resource.id),
      ].every((resourceId) =>
        comprehensiveContext.supportedBy.some(
          (entry) => entry.resourceId === resourceId,
        ),
      ),
  ],
  [
    "identifier audit and notebook expose complete audited bidirectional context",
    identifierAuditContext.supportedBy.map((entry) => entry.resourceId).join(",") ===
      "resource-fitbit-identifier-revision-audit-notebook" &&
      identifierAuditContext.supports.length === 3 &&
      notebookContext.supportedBy.map((entry) => entry.resourceId).join(",") ===
        `${RESOURCE_IDS.bellabeatRepository},resource-bellabeat-final-validation-report` &&
      notebookContext.supports.length === 2,
  ],
  [
    "each approved figure supports the comprehensive report and carries direct validation evidence",
    bellabeatImageResources.every((resource) => {
      const context = getPublishedResourceContextFromRegistry(
        contentRegistry,
        resource.id,
      );
      return (
        context.supportedBy.some(
          (entry) =>
            entry.resourceId === "resource-bellabeat-final-validation-report",
        ) &&
        context.supports.some(
          (entry) =>
            entry.resourceId === "resource-bellabeat-comprehensive-case-study",
        )
      );
    }),
  ],
  [
    "Bellabeat relationship audit materializes no speculative Resources",
    bellabeatAuditedResourceIds.size === 19 &&
      bellabeatAuditedRelationships.every(
        (relationship) =>
          bellabeatAuditedResourceIds.has(relationship.sourceResourceId) &&
          bellabeatAuditedResourceIds.has(relationship.targetResourceId),
      ),
  ],
  [
    "support relationships do not create Collection context",
    getPublishedResourceCollections(RESOURCE_IDS.bellabeatRepository).length ===
      0,
  ],
  [
    "Bellabeat full documents use complete local Markdown sources",
    bellabeatFullDocumentResources.length === 6 &&
      bellabeatFullDocumentResources.every((resource) => {
        const sourcePath = resource.content.markdownSource.path;
        const localPath = path.join(projectRoot, "public", sourcePath);
        return (
          fs.existsSync(localPath) &&
          fs.readFileSync(localPath, "utf8").split("\n").length >= 40
        );
      }),
  ],
  [
    "comprehensive case study is one native structured Resource with HTML and Markdown representations",
    comprehensiveCaseStudy?.inspectionKind === "structured-document" &&
      comprehensiveCaseStudy.content?.kind === "structured-document" &&
      "markdownSource" in comprehensiveCaseStudy.content &&
      comprehensiveCaseStudy.representations?.filter(
        (representation) => representation.kind === "external",
      ).length === 2 &&
      comprehensiveCaseStudy.representations.some(
        (representation) =>
          representation.kind === "external" &&
          representation.url.endsWith(".html"),
      ) &&
      comprehensiveCaseStudy.representations.some(
        (representation) =>
          representation.kind === "external" &&
          representation.url.endsWith(".md"),
      ),
  ],
  [
    "notebook has an unchanged local Asset representation and secondary GitHub provenance",
    notebookResource?.inspectionKind === "notebook-code" &&
      notebookResource.content === undefined &&
      notebookResource.representations?.[0]?.kind === "asset" &&
      notebookResource.representations[0].assetId ===
        ASSET_IDS.fitbitIdentifierRevisionAuditNotebook &&
      notebookResource.representations[1]?.kind === "external" &&
      notebookResource.representations[1].url.endsWith(".ipynb") &&
      crypto
        .createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(
              projectRoot,
              "public/bellabeat/notebooks/fitbit_identifier_revision_audit.ipynb",
            ),
          ),
        )
        .digest("hex") ===
        "bd73af95639a60e364c7e148ffd35e8dad3718cb254f2d1f97d402416392711f",
  ],
  [
    "Bellabeat image representations expose verified intrinsic dimensions",
    bellabeatImageResources.length === 10 &&
      bellabeatImageResources.every((resource) => {
        const representation = resource.representations?.find(
          (candidate) => candidate.kind === "asset",
        );
        const asset =
          representation?.kind === "asset"
            ? contentRegistry.assets.find(
                (candidate) => candidate.id === representation.assetId,
              )
            : null;
        return Boolean(asset?.width && asset?.height);
      }),
  ],
  [
    "no Bellabeat supporting Resource receives Collection membership",
    bellabeatSupportingResources.length === 18 &&
      bellabeatSupportingResources.every(
        (resource) =>
          resource.isArtifact === false &&
          !contentRegistry.memberships.some(
            (membership) => membership.memberId === resource.id,
          ),
      ),
  ],
  [
    "source records resolve independently",
    getSourceRecordsForArtifact(ARTIFACT_IDS.bellabeat).length > 0 &&
      getSourceRecordsForAsset(ASSET_IDS.brandSymbol).length > 0 &&
      getSourceRecordsForAsset(
        ASSET_IDS.fitbitIdentifierRevisionAuditNotebook,
      ).some(
        (source) =>
          source.originalPath ===
          "notebooks/fitbit_identifier_revision_audit.ipynb",
      ),
  ],
  [
    "launch collection contents adapt without spatial placement",
    getReservoirContentNodes(ROOT_COLLECTION_ID).every(
      (node) =>
        node.kind === "artifact" &&
        [ARTIFACT_IDS.bellabeat, ARTIFACT_IDS.resume, ARTIFACT_IDS.contact].includes(node.id) &&
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
