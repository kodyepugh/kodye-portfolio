import { artifacts, resources } from "../../content/digital-reservoir/artifacts";
import { assets } from "../../content/digital-reservoir/assets";
import { collections } from "../../content/digital-reservoir/collections";
import { memberships } from "../../content/digital-reservoir/memberships";
import { resourceSupportRelations } from "../../content/digital-reservoir/resource-support-relations";
import { sourceRecords } from "../../content/digital-reservoir/sources";
import { resources as supportingResources } from "../../content/digital-reservoir/resources";
import { supportingRelationships } from "../../content/digital-reservoir/relationships";
import type { ContentRegistry } from "../../types/content";

export const contentRegistry: ContentRegistry = {
  resources,
  artifacts,
  resources: [...artifacts, ...supportingResources],
  collections,
  memberships,
  resourceSupportRelations,
  assets,
  sourceRecords,
  supportingRelationships,
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
