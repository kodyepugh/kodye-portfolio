import type { Metadata } from "next";
import type { Collection, Resource } from "@/types/content";

export const SITE_URL = new URL("https://kodyepugh.com");
export const SITE_TITLE = "Kodye Pugh — Digital Reservoir";
export const SITE_DESCRIPTION =
  "The portfolio of Kodye Pugh, presented through the Digital Reservoir — an interactive collection of selected work, analysis, experience, and supporting resources.";

export const siteMetadata: Metadata = {
  metadataBase: SITE_URL,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Kodye Pugh — Digital Reservoir",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Kodye Pugh — Digital Reservoir",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

function resourceDescription(resource: Resource) {
  return resource.description ?? resource.subtitle ?? SITE_DESCRIPTION;
}

function collectionDescription(collection: Collection) {
  return collection.subtitle ?? SITE_DESCRIPTION;
}

export function getResourceMetadata(
  resource: Resource,
  options: { canonicalPath?: string; index?: boolean } = {},
): Metadata {
  const title = `${resource.title} — Kodye Pugh`;
  const description = resourceDescription(resource);

  return {
    title,
    description,
    alternates: {
      canonical: options.canonicalPath ?? `/${resource.slug}`,
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
    ...(options.index === false
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export function getCollectionMetadata(collection: Collection): Metadata {
  const title = `${collection.title} — Kodye Pugh`;
  const description = collectionDescription(collection);

  return {
    title,
    description,
    alternates: {
      canonical: `/${collection.slug}`,
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}
