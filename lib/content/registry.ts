import { artifacts, resources } from "../../content/digital-reservoir/artifacts";
import { assets } from "../../content/digital-reservoir/assets";
import { collections } from "../../content/digital-reservoir/collections";
import { memberships } from "../../content/digital-reservoir/memberships";
import { resourceSupportRelations } from "../../content/digital-reservoir/resource-support-relations";
import { sourceRecords } from "../../content/digital-reservoir/sources";
import type { ContentRegistry } from "../../types/content";

export const contentRegistry: ContentRegistry = {
  resources,
  artifacts,
  collections,
  memberships,
  resourceSupportRelations,
  assets,
  sourceRecords,
};

export {
  artifacts,
  assets,
  collections,
  memberships,
  resourceSupportRelations,
  resources,
  sourceRecords,
};
