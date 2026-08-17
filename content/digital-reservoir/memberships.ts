import type { Membership } from "../../types/content";
import { ARTIFACT_IDS } from "./artifacts";
import { COLLECTION_IDS } from "./collections";

export const memberships = [
  {
    id: "membership-root-work",
    collectionId: COLLECTION_IDS.root,
    memberType: "collection",
    memberId: COLLECTION_IDS.work,
    order: 1,
  },
  {
    id: "membership-root-about-self",
    collectionId: COLLECTION_IDS.root,
    memberType: "collection",
    memberId: COLLECTION_IDS.aboutSelf,
    order: 2,
  },
  {
    id: "membership-work-data-analytics",
    collectionId: COLLECTION_IDS.work,
    memberType: "collection",
    memberId: COLLECTION_IDS.dataAnalytics,
    order: 1,
  },
  {
    id: "membership-work-web",
    collectionId: COLLECTION_IDS.work,
    memberType: "collection",
    memberId: COLLECTION_IDS.web,
    order: 2,
  },
  {
    id: "membership-work-film-creative",
    collectionId: COLLECTION_IDS.work,
    memberType: "collection",
    memberId: COLLECTION_IDS.filmCreative,
    order: 3,
  },
  {
    id: "membership-work-bellabeat",
    collectionId: COLLECTION_IDS.work,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.bellabeat,
    order: 4,
  },
  {
    id: "membership-work-reservoir-study",
    collectionId: COLLECTION_IDS.work,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.reservoirStudy,
    order: 5,
  },
  {
    id: "membership-work-resume",
    collectionId: COLLECTION_IDS.work,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.resume,
    order: 6,
  },
  {
    id: "membership-data-analytics-bellabeat",
    collectionId: COLLECTION_IDS.dataAnalytics,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.bellabeat,
    order: 1,
  },
  {
    id: "membership-web-reservoir-study",
    collectionId: COLLECTION_IDS.web,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.reservoirStudy,
    order: 1,
  },
  {
    id: "membership-web-brand-symbol",
    collectionId: COLLECTION_IDS.web,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.brandSymbol,
    order: 2,
  },
  {
    id: "membership-about-self-about",
    collectionId: COLLECTION_IDS.aboutSelf,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.about,
    order: 1,
  },
  {
    id: "membership-about-self-resume",
    collectionId: COLLECTION_IDS.aboutSelf,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.resume,
    order: 2,
  },
  {
    id: "membership-about-self-brand-symbol",
    collectionId: COLLECTION_IDS.aboutSelf,
    memberType: "artifact",
    memberId: ARTIFACT_IDS.brandSymbol,
    order: 3,
  },
] satisfies readonly Membership[];
