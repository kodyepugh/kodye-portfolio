import type { SourceRecord } from "../../types/content";
import { ARTIFACT_IDS } from "./artifacts";
import { ASSET_IDS } from "./assets";

export const sourceRecords = [
  {
    id: "source-bellabeat-prototype-record",
    resourceId: ARTIFACT_IDS.bellabeat,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing Digital Reservoir prototype record",
  },
  {
    id: "source-resume-prototype-record",
    resourceId: ARTIFACT_IDS.resume,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing direct-feature prototype record",
  },
  {
    id: "source-about-prototype-record",
    resourceId: ARTIFACT_IDS.about,
    sourceType: "local-file",
    originalPath: "content/reservoir/artifacts.ts",
    sourceLabel: "Existing direct-feature prototype record",
  },
  {
    id: "source-reservoir-study-project-record",
    resourceId: ARTIFACT_IDS.reservoirStudy,
    sourceType: "local-file",
    originalPath: "docs/digital-reservoir-codex-brief-v0.4-v2-prototype-foundation.md",
    sourceLabel: "Digital Reservoir implementation brief",
  },
  {
    id: "source-brand-symbol-artifact-record",
    resourceId: ARTIFACT_IDS.brandSymbol,
    sourceType: "manual",
    sourceLabel: "Existing public identity artifact",
  },
  {
    id: "source-brand-symbol-file",
    assetId: ASSET_IDS.brandSymbol,
    sourceType: "local-file",
    originalPath: "public/brand/kodyepugh-symbol.svg",
    sourceLabel: "Public brand asset",
  },
] satisfies readonly SourceRecord[];
