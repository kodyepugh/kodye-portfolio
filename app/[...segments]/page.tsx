import type { Metadata } from "next";
import { ReservoirRouteEntry } from "@/components/reservoir/ReservoirRouteEntry";
import {
  getCollectionMetadata,
  getResourceMetadata,
} from "@/lib/site-metadata";
import { getCollectionById, getResourceById } from "@/lib/content/selectors";
import { resolvePublicRoute } from "@/lib/public-routing";
import { notFound, permanentRedirect, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[...segments]">): Promise<Metadata> {
  const { segments } = await params;
  const route = resolvePublicRoute(segments);

  if (route.kind === "collection") {
    const collection = getCollectionById(route.collectionId);
    return collection ? getCollectionMetadata(collection) : {};
  }

  if (
    route.kind === "resource" ||
    route.kind === "query-resource" ||
    route.kind === "contextual-resource" ||
    route.kind === "redirect-resource"
  ) {
    const resource = getResourceById(route.resourceId);
    return resource
      ? getResourceMetadata(resource, {
          index: route.kind === "resource",
        })
      : {};
  }

  return {};
}

export default async function PublicRoutePage({
  params,
}: PageProps<"/[...segments]">) {
  const { segments } = await params;
  const route = resolvePublicRoute(segments);

  if (route.kind === "not-found") notFound();
  if (route.kind === "redirect-root") redirect("/");
  if (route.kind === "redirect-resource") {
    const resource = getResourceById(route.resourceId);
    if (!resource) notFound();
    permanentRedirect(`/${resource.slug}`);
  }

  return <ReservoirRouteEntry route={route} />;
}
