import type { Collection } from "../../types/content";

export const COLLECTION_IDS = {
  root: "collection-digital-reservoir",
  work: "collection-work",
  dataAnalytics: "collection-data-analytics",
  web: "collection-web",
  filmCreative: "collection-film-creative",
  aboutSelf: "collection-about-self",
} as const;

export const ROOT_COLLECTION_ID = COLLECTION_IDS.root;

export const collections = [
  {
    objectType: "collection",
    id: COLLECTION_IDS.root,
    slug: "digital-reservoir",
    title: "Digital Reservoir",
    subtitle: "A collection of all things Kodye Pugh",
    featured: true,
    published: true,
  },
  {
    objectType: "collection",
    id: COLLECTION_IDS.work,
    slug: "work",
    title: "Work",
    subtitle: "Selected projects and ongoing studies",
    category: "Practice",
    categoryColor: "#b9573f",
    featured: true,
    published: false,
  },
  {
    objectType: "collection",
    id: COLLECTION_IDS.dataAnalytics,
    slug: "data-analytics",
    title: "Data / Analytics",
    category: "Work",
    categoryColor: "#28758c",
    published: false,
  },
  {
    objectType: "collection",
    id: COLLECTION_IDS.web,
    slug: "web",
    title: "Web",
    category: "Work",
    categoryColor: "#3d8062",
    published: false,
  },
  {
    objectType: "collection",
    id: COLLECTION_IDS.filmCreative,
    slug: "film-creative",
    title: "Film / Creative",
    category: "Work",
    categoryColor: "#6e5890",
    published: false,
  },
  {
    objectType: "collection",
    id: COLLECTION_IDS.aboutSelf,
    slug: "about-self",
    title: "About / Self",
    category: "Identity",
    categoryColor: "#8d7257",
    featured: true,
    published: false,
  },
] satisfies readonly Collection[];
