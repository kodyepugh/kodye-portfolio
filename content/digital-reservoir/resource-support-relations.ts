import type { ResourceSupportRelationship } from "../../types/content";
import { ARTIFACT_IDS, RESOURCE_IDS } from "./artifacts";

export const resourceSupportRelations = [
  {
    id: "support-bellabeat-repository",
    sourceResourceId: ARTIFACT_IDS.bellabeat,
    targetResourceId: RESOURCE_IDS.bellabeatRepository,
    relationshipType: "supporting",
    order: 1,
    published: true,
    label: "Repository",
    role: "reproducibility-repository",
  },
] satisfies readonly ResourceSupportRelationship[];
