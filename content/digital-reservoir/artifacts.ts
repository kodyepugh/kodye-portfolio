import type { Artifact } from "../../types/content";

export const ARTIFACT_IDS = {
  bellabeat: "artifact-bellabeat-wellness-analysis",
  resume: "artifact-resume",
  about: "artifact-about",
  reservoirStudy: "artifact-reservoir-interface-study",
  brandSymbol: "artifact-kodyepugh-symbol",
} as const;

export const artifacts = [
  {
    id: ARTIFACT_IDS.bellabeat,
    slug: "bellabeat-wellness-analysis",
    title: "Bellabeat Wellness Analysis",
    subtitle: "Patterns in everyday activity and rest",
    type: "case-study",
    category: "Data / Analytics",
    categoryColor: "#28758c",
    date: "2024",
    medium: "Data analysis",
    format: "Case study",
    featured: true,
    published: true,
    content: {
      kind: "case-study",
      status: "placeholder",
      sections: [
        {
          id: "overview",
          heading: "Overview",
          body: [
            "Patterns in everyday activity and rest.",
            "TODO: Add repository-supported methodology, findings, visualizations, and case-study narrative.",
          ],
        },
      ],
    },
  },
  {
    id: ARTIFACT_IDS.resume,
    slug: "resume",
    title: "Resume",
    subtitle: "Experience, capabilities, and selected engagements",
    type: "resume",
    category: "Practice / Experience",
    categoryColor: "#667d83",
    medium: "Document",
    format: "Resume",
    featured: true,
    published: true,
    content: {
      kind: "document",
      status: "placeholder",
      note: "TODO: Add the approved resume asset and verified resume content.",
    },
  },
  {
    id: ARTIFACT_IDS.about,
    slug: "about",
    title: "About",
    subtitle: "A working portrait of practice, context, and intent",
    type: "profile",
    category: "About / Self",
    categoryColor: "#8d7257",
    medium: "Profile",
    featured: true,
    published: true,
    content: {
      kind: "rich-text",
      status: "placeholder",
      body: [
        "A working portrait of practice, context, and intent.",
        "TODO: Add approved biography copy.",
      ],
    },
  },
  {
    id: ARTIFACT_IDS.reservoirStudy,
    slug: "reservoir-interface-study",
    title: "Reservoir Interface Study",
    subtitle: "A spatial navigation prototype",
    type: "project",
    category: "Web / Interaction",
    categoryColor: "#b9573f",
    date: "2026",
    medium: "WebGL prototype",
    format: "Interactive website",
    featured: true,
    published: true,
    content: {
      kind: "case-study",
      status: "placeholder",
      sections: [
        {
          id: "overview",
          heading: "Overview",
          body: [
            "The Digital Reservoir is a spatial interface layered over semantic, conventional web content.",
            "TODO: Add approved project narrative, process evidence, and implementation details.",
          ],
        },
      ],
    },
  },
  {
    id: ARTIFACT_IDS.brandSymbol,
    slug: "kodyepugh-symbol",
    title: "Kodye Pugh Symbol",
    type: "image",
    category: "Identity",
    categoryColor: "#6f8065",
    medium: "Vector graphic",
    format: "SVG",
    published: true,
    content: {
      kind: "media",
      status: "ready",
      assetId: "asset-kodyepugh-symbol",
    },
  },
] satisfies readonly Artifact[];
