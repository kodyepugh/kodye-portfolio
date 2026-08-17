import { artifacts } from "../../content/digital-reservoir/artifacts";
import { assets } from "../../content/digital-reservoir/assets";
import { collections } from "../../content/digital-reservoir/collections";
import { memberships } from "../../content/digital-reservoir/memberships";
import { sourceRecords } from "../../content/digital-reservoir/sources";
import type { ContentRegistry } from "../../types/content";

export const contentRegistry: ContentRegistry = {
  artifacts,
  collections,
  memberships,
  assets,
  sourceRecords,
};

export { artifacts, assets, collections, memberships, sourceRecords };
