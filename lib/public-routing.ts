import { ROOT_COLLECTION_ID } from "@/content/digital-reservoir/collections";
import {
  getCollectionBySlug,
  getPublishedResourceCollections,
  getResourceBySlug,
} from "@/lib/content/selectors";

export type PublicRoute =
  | { kind: "root" }
  | { kind: "collection"; collectionId: string }
  | { kind: "resource"; resourceId: string }
  | { kind: "query-resource"; resourceId: string }
  | {
      kind: "contextual-resource";
      collectionId: string;
      resourceId: string;
    }
  | { kind: "redirect-resource"; resourceId: string }
  | { kind: "redirect-root" }
  | { kind: "not-found" };

export function resolvePublicRoute(
  segments: readonly string[] | undefined,
): PublicRoute {
  if (!segments || segments.length === 0) return { kind: "root" };
  if (segments.length > 2 || segments.some((segment) => !segment)) {
    return { kind: "not-found" };
  }

  const [firstSegment, secondSegment] = segments;
  if (firstSegment === "q") {
    const queryResource = secondSegment
      ? getResourceBySlug(secondSegment)
      : null;
    return queryResource?.published === true
      ? { kind: "query-resource", resourceId: queryResource.id }
      : { kind: "not-found" };
  }
  const collection = getCollectionBySlug(firstSegment);
  const resource = getResourceBySlug(firstSegment);

  if (!secondSegment) {
    if (collection?.id === ROOT_COLLECTION_ID && collection.published === true) {
      return { kind: "redirect-root" };
    }
    if (collection?.published === true) {
      return { kind: "collection", collectionId: collection.id };
    }
    if (resource?.published === true) {
      return { kind: "resource", resourceId: resource.id };
    }
    return { kind: "not-found" };
  }

  const contextualResource = getResourceBySlug(secondSegment);
  if (
    collection?.published !== true ||
    contextualResource?.published !== true ||
    !getPublishedResourceCollections(contextualResource.id).some(
      (candidate) => candidate.id === collection.id,
    )
  ) {
    return { kind: "not-found" };
  }

  if (collection.id === ROOT_COLLECTION_ID) {
    return {
      kind: "redirect-resource",
      resourceId: contextualResource.id,
    };
  }

  return {
    kind: "contextual-resource",
    collectionId: collection.id,
    resourceId: contextualResource.id,
  };
}
