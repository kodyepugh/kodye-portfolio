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
export type ArtifactContentStatus = "ready" | "placeholder";

export type ArtifactSection = {
  id: string;
  heading: string;
  body: readonly string[];
  assetIds?: readonly string[];
};

export type ArtifactContent =
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

export type Artifact = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: ArtifactType;
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
  content?: ArtifactContent;
  createdAt?: string;
  updatedAt?: string;
};

export type Collection = {
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

type MembershipBase = {
  id: string;
  collectionId: string;
  order?: number;
};

export type ArtifactMembership = MembershipBase & {
  memberType: "artifact";
  memberId: string;
};

export type CollectionMembership = MembershipBase & {
  memberType: "collection";
  memberId: string;
};

export type Membership = ArtifactMembership | CollectionMembership;

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

export type ArtifactSourceRecord = SourceRecordBase & {
  artifactId: string;
  assetId?: never;
};

export type AssetSourceRecord = SourceRecordBase & {
  artifactId?: never;
  assetId: string;
};

export type SourceRecord = ArtifactSourceRecord | AssetSourceRecord;

export type ContentRegistry = {
  artifacts: readonly Artifact[];
  collections: readonly Collection[];
  memberships: readonly Membership[];
  assets: readonly Asset[];
  sourceRecords: readonly SourceRecord[];
};
