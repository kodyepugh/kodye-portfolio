import type {
  Collection,
  ObjectMedium,
  ObjectRelationship,
  Resource,
} from "../../types/content";

export const MEDIUM_COLORS: Readonly<Record<ObjectMedium, string>> = {
  collection: "#000000",
  document: "#28758c",
  image: "#6e5890",
  video: "#b9573f",
  audio: "#8d7257",
  form: "#6f8065",
  link: "#667d83",
  data: "#28758c",
  code: "#6e5890",
  other: "#a2a7a1",
};

const MEDIUM_LABELS: Readonly<Record<ObjectMedium, string>> = {
  collection: "Collection", document: "Document", image: "Image", video: "Video",
  audio: "Audio", form: "Form", link: "Link", data: "Data", code: "Code", other: "Other",
};

export function getObjectMedium(object: Collection | Resource): ObjectMedium {
  return object.objectType === "collection" ? "collection" : object.medium ?? "other";
}

export function getMediumLabel(medium: ObjectMedium) {
  return MEDIUM_LABELS[medium];
}

export function getMediumColor(medium: ObjectMedium) {
  return MEDIUM_COLORS[medium];
}

export function formatObjectDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(parsed);
}

export function formatObjectRelationships(relationships: readonly ObjectRelationship[] | undefined) {
  return relationships?.filter((relationship) => relationship.label.trim()) ?? [];
}
