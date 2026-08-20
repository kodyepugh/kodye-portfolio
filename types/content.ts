export const ARTIFACT_TYPES = [
  "case-study",
  "resume",
  "profile",
  "project",
  "website",
  "film",
  "video",
  "image",
  "photograph",
  "writing",
  "document",
  "link",
  "observation",
  "other",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const RESOURCE_TYPES = [
  ...ARTIFACT_TYPES,
  "report",
  "chart",
  "dataset",
  "table",
  "webpage",
  "repository",
  "audio",
  "code",
  "notebook",
  "presentation",
  "spreadsheet",
  "text",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_INSPECTION_KINDS = [
  "structured-document",
  "image",
  "video",
  "audio",
  "external-link",
  "dataset-table",
  "notebook-code",
  "generic-file",
] as const;

export type ResourceInspectionKind =
  (typeof RESOURCE_INSPECTION_KINDS)[number];
export type ArtifactContentStatus = "ready" | "placeholder";
export type ResourceContentStatus = ArtifactContentStatus;

type StructuredDocumentBlockBase = {
  id: string;
};

export type StructuredDocumentHeadingBlock = StructuredDocumentBlockBase & {
  type: "heading";
  level: 2 | 3 | 4 | 5 | 6;
  text: string;
  eyebrow?: string;
};

export type StructuredDocumentParagraphBlock = StructuredDocumentBlockBase & {
  type: "paragraph";
  text: string;
};

export type StructuredDocumentFigureBlock = StructuredDocumentBlockBase & {
  type: "figure";
  resourceId: string;
  representationId?: string;
  alt: string;
  caption?: string;
};

export type StructuredDocumentListBlock = StructuredDocumentBlockBase & {
  type: "list";
  style: "ordered" | "unordered";
  items: readonly string[];
};

export type StructuredDocumentCalloutBlock = StructuredDocumentBlockBase & {
  type: "callout";
  text: string;
  title?: string;
  tone?: "note" | "important" | "warning";
};

export type StructuredDocumentLinkBlock = StructuredDocumentBlockBase & {
  type: "link";
  href: string;
  label: string;
  description?: string;
};

export type StructuredDocumentDividerBlock = StructuredDocumentBlockBase & {
  type: "divider";
};

export type StructuredDocumentTableBlock = StructuredDocumentBlockBase & {
  type: "table";
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  caption?: string;
};

export type StructuredDocumentQuoteBlock = StructuredDocumentBlockBase & {
  type: "quote";
  text: string;
  attribution?: string;
};

export type StructuredDocumentCodeBlock = StructuredDocumentBlockBase & {
  type: "code";
  code: string;
  language?: string;
  caption?: string;
};

export type StructuredDocumentResourceReferenceBlock =
  StructuredDocumentBlockBase & {
    type: "resource-reference";
    resourceId: string;
    label?: string;
    description?: string;
  };

export type StructuredDocumentBlock =
  | StructuredDocumentHeadingBlock
  | StructuredDocumentParagraphBlock
  | StructuredDocumentFigureBlock
  | StructuredDocumentListBlock
  | StructuredDocumentCalloutBlock
  | StructuredDocumentLinkBlock
  | StructuredDocumentDividerBlock
  | StructuredDocumentTableBlock
  | StructuredDocumentQuoteBlock
  | StructuredDocumentCodeBlock
  | StructuredDocumentResourceReferenceBlock;

export type StructuredDocumentContent = {
  kind: "structured-document";
  status: ResourceContentStatus;
  blocks: readonly StructuredDocumentBlock[];
};

export type ArtifactSection = {
  id: string;
  heading: string;
  body: readonly string[];
  assetIds?: readonly string[];
};

export type ResourceSection = ArtifactSection;

export type ResourceContent =
  | StructuredDocumentContent
  | {
      kind: "rich-text";
      status: ArtifactContentStatus;
      body: readonly string[];
    }
  | {
      kind: "external-link";
      status: ArtifactContentStatus;
      url: string;
      label?: string;
    }
  | {
      kind: "media";
      status: ArtifactContentStatus;
      assetId: string;
      caption?: string;
    }
  | {
      kind: "case-study";
      status: ArtifactContentStatus;
      sections: readonly ArtifactSection[];
    }
  | {
      kind: "document";
      status: ArtifactContentStatus;
      assetId?: string;
      note?: string;
    };

export type ArtifactContent = ResourceContent;

export type ResourceRepresentationBase = {
  id: string;
  label?: string;
  order?: number;
  published?: boolean;
};

export type ResourceAssetRepresentation = ResourceRepresentationBase & {
  kind: "asset";
  assetId: string;
  caption?: string;
};

export type ResourceInlineRepresentation = ResourceRepresentationBase & {
  kind: "inline";
  format: "html" | "markdown" | "text";
  body: string;
};

export type ResourceExternalRepresentation = ResourceRepresentationBase & {
  kind: "external";
  url: string;
  sourceLabel?: string;
};

export type ResourceRepresentation =
  | ResourceAssetRepresentation
  | ResourceInlineRepresentation
  | ResourceExternalRepresentation;

export type ResourceSupportRelationship = {
  id: string;
  sourceResourceId: string;
  targetResourceId: string;
  relationshipType: "supporting" | "source" | "provenance";
  order?: number;
  published?: boolean;
  label?: string;
  role?: string;
};

export type Collection = {
  objectType: "collection";
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  category?: string;
  categoryColor?: string;
  featured?: boolean;
  published?: boolean;
};

export type Resource = {
  objectType: "resource";
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: ResourceType;
  inspectionKind: ResourceInspectionKind;
  isArtifact: boolean;
  icon?: string;
  category?: string;
  categoryColor?: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  medium?: string;
  format?: string;
  featured?: boolean;
  published?: boolean;
  representations?: readonly ResourceRepresentation[];
  content?: ResourceContent;
  createdAt?: string;
  updatedAt?: string;
};

export type Artifact = Resource & {
  isArtifact: true;
};

export type SemanticObject = Collection | Resource;
export type SemanticObjectAddress = string;

type MembershipBase = {
  id: string;
  collectionId: string;
  order?: number;
};

export type ResourceMembership = MembershipBase & {
  memberType: "resource";
  memberId: string;
};

export type CollectionMembership = MembershipBase & {
  memberType: "collection";
  memberId: string;
};

export type Membership = ResourceMembership | CollectionMembership;

export const ASSET_KINDS = [
  "image",
  "video",
  "audio",
  "document",
  "other",
] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export type Asset = {
  id: string;
  kind: AssetKind;
  src: string;
  filename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
  caption?: string;
};

export const SOURCE_TYPES = [
  "local-file",
  "external-url",
  "manual",
  "import",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

type SourceRecordBase = {
  id: string;
  sourceType: SourceType;
  originalPath?: string;
  externalUrl?: string;
  sourceLabel?: string;
  importedAt?: string;
};

export type ResourceSourceRecord = SourceRecordBase & {
  resourceId: string;
  assetId?: never;
};

export type AssetSourceRecord = SourceRecordBase & {
  assetId: string;
  resourceId?: never;
};

export type SourceRecord = ResourceSourceRecord | AssetSourceRecord;

export type ContentRegistry = {
  resources: readonly Resource[];
  artifacts: readonly Artifact[];
  collections: readonly Collection[];
  memberships: readonly Membership[];
  resourceSupportRelations: readonly ResourceSupportRelationship[];
  assets: readonly Asset[];
  sourceRecords: readonly SourceRecord[];
};
