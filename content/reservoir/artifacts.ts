import type {
  DirectArtifactId,
  ExploreLens,
  PreparedArtifactContent,
  ReservoirArtifact,
} from "@/types/reservoir";
import {
  activeCollectionId,
  reservoirCollections,
} from "@/content/reservoir/collections";

const canonicalReservoirArtifacts = [
  {
    kind: "artifact",
    id: "artifact-01",
    collectionId: activeCollectionId,
    exploreLenses: ["world", "inquiry"],
    type: "Field Note",
    title: "Low Tide",
    subtitle: "Observations from the exposed shoreline",
    date: "2025",
    context: "Field Studies / Water",
    medium: "Text and photographs",
    color: "#b9573f",
  },
  {
    kind: "artifact",
    id: "artifact-02",
    collectionId: activeCollectionId,
    exploreLenses: ["work", "inquiry"],
    type: "Case Study",
    title: "Bellabeat Wellness Analysis",
    subtitle: "Patterns in everyday activity and rest",
    date: "2024",
    context: "Data / Wellness",
    medium: "Data analysis",
    color: "#28758c",
  },
  {
    kind: "artifact",
    id: "artifact-03",
    collectionId: activeCollectionId,
    exploreLenses: ["self", "world"],
    type: "Moving Image",
    title: "The Distance Between Memory and the Shape of a Place",
    subtitle: "A study in landscape, recall, and distance",
    date: "2023",
    context: "Memory / Place",
    medium: "Single-channel video",
    color: "#6e5890",
  },
  {
    kind: "artifact",
    id: "artifact-04",
    collectionId: activeCollectionId,
    exploreLenses: ["work", "inquiry"],
    type: "Web Experiment",
    title: "A Small Interface for Things That Refuse to Be Categorized",
    subtitle: "A navigational study in unstable taxonomies",
    date: "2025",
    context: "Interfaces / Classification",
    medium: "Interactive website",
    color: "#3d8062",
  },
  {
    kind: "artifact",
    id: "artifact-05",
    collectionId: activeCollectionId,
    exploreLenses: ["world"],
    type: "Photo Essay",
    title: "After the Last Train",
    subtitle: "Night studies from the end of the line",
    date: "2022–2024",
    context: "Transit / Nocturnes",
    medium: "Digital photography",
    color: "#a77a24",
  },
  {
    kind: "artifact",
    id: "work-artifact-01",
    collectionId: "collection-work",
    exploreLenses: ["work", "inquiry"],
    type: "Prototype",
    title: "Reservoir Interface Study",
    subtitle: "A spatial navigation prototype",
    date: "2026",
    context: "Interaction / Systems",
    medium: "WebGL prototype",
    color: "#b9573f",
  },
  {
    kind: "artifact",
    id: "work-artifact-02",
    collectionId: "collection-work",
    exploreLenses: ["work"],
    type: "Case Study",
    title: "Signals in Motion",
    subtitle: "A concise study of ordered visual transitions",
    date: "2025",
    context: "Motion / Interface",
    medium: "Interactive study",
    color: "#28758c",
  },
] satisfies ReservoirArtifact[];

type CanonicalDirectArtifact = {
  id: DirectArtifactId;
  type: string;
  title: string;
  subtitle: string;
  context: string;
  medium: string;
  color: string;
  exploreLenses: readonly ExploreLens[];
};

export const canonicalDirectArtifacts = [
  {
    id: "about",
    type: "Direct Feature",
    title: "About",
    subtitle: "A working portrait of practice, context, and intent",
    context: "Identity / Practice",
    medium: "Profile",
    color: "#8d7257",
    exploreLenses: ["self", "inquiry"],
  },
  {
    id: "resume",
    type: "Direct Feature",
    title: "Resume",
    subtitle: "Experience, capabilities, and selected engagements",
    context: "Practice / Experience",
    medium: "Document",
    color: "#667d83",
    exploreLenses: ["work", "self"],
  },
  {
    id: "contact",
    type: "Direct Feature",
    title: "Contact",
    subtitle: "Ways to begin a conversation or collaboration",
    context: "Connection / Collaboration",
    medium: "Contact record",
    color: "#6f8065",
    exploreLenses: ["self", "world"],
  },
] satisfies readonly CanonicalDirectArtifact[];

const directArtifactReferences = reservoirCollections.flatMap(
  ({ id: collectionId }) =>
  canonicalDirectArtifacts.map(
    (artifact): ReservoirArtifact => ({
      ...artifact,
      kind: "artifact",
      id: `${collectionId}:direct:${artifact.id}`,
      canonicalArtifactId: `direct-${artifact.id}`,
      collectionId,
      directArtifactId: artifact.id,
    }),
  ),
);

const inspectionArtifacts = [
  {
    id: "artifact-06",
    collectionId: activeCollectionId,
    exploreLenses: ["self"],
    type: "Personal Index",
    title: "Notes Toward a Working Practice",
    subtitle: "A provisional inventory of methods and attention",
    context: "Practice / Reflection",
    medium: "Text",
    color: "#916d61",
  },
  {
    id: "artifact-07",
    collectionId: activeCollectionId,
    exploreLenses: ["self", "world"],
    type: "Audio Essay",
    title: "A Voice in Public Space",
    context: "Identity / Place",
    medium: "Sound",
    color: "#657596",
  },
  {
    id: "artifact-08",
    collectionId: activeCollectionId,
    exploreLenses: ["work"],
    type: "System Study",
    title: "Archive Operations Manual",
    context: "Systems / Practice",
    medium: "Interface study",
    color: "#7a7752",
  },
  {
    id: "artifact-09",
    collectionId: activeCollectionId,
    exploreLenses: ["inquiry"],
    type: "Research Note",
    title: "Questions for an Unstable Index",
    context: "Classification / Research",
    medium: "Text",
    color: "#725f83",
  },
  {
    id: "work-artifact-03",
    collectionId: "collection-work",
    exploreLenses: ["self"],
    type: "Reflection",
    title: "Learning Through Systems",
    color: "#916d61",
  },
  {
    id: "work-artifact-04",
    collectionId: "collection-work",
    exploreLenses: ["world"],
    type: "Field Study",
    title: "Interfaces in Public",
    color: "#a77a24",
  },
  {
    id: "work-artifact-05",
    collectionId: "collection-work",
    exploreLenses: ["work", "inquiry"],
    type: "Prototype",
    title: "Relational Index Study",
    color: "#3d8062",
  },
  {
    id: "work-artifact-06",
    collectionId: "collection-work",
    exploreLenses: ["inquiry"],
    type: "Research Note",
    title: "On Persistent Context",
    color: "#6e5890",
  },
  {
    id: "studies-artifact-01",
    collectionId: "collection-work-studies",
    exploreLenses: ["inquiry"],
    type: "Study",
    title: "Unresolved Navigation Models",
    color: "#6e5890",
  },
  {
    id: "studies-artifact-02",
    collectionId: "collection-work-studies",
    exploreLenses: ["work", "inquiry"],
    type: "Prototype",
    title: "Threshold Behaviors",
    color: "#3d8062",
  },
  {
    id: "studies-artifact-03",
    collectionId: "collection-work-studies",
    exploreLenses: ["self"],
    type: "Reflection",
    title: "A Method for Staying Curious",
    color: "#916d61",
  },
  {
    id: "studies-artifact-04",
    collectionId: "collection-work-studies",
    exploreLenses: ["world"],
    type: "Observation",
    title: "Signals Beyond the Interface",
    color: "#a77a24",
  },
  {
    id: "field-artifact-01",
    collectionId: "collection-field-archive",
    exploreLenses: ["world"],
    type: "Field Note",
    title: "Weather at the Edge of the City",
    color: "#a77a24",
  },
  {
    id: "field-artifact-02",
    collectionId: "collection-field-archive",
    exploreLenses: ["world", "inquiry"],
    type: "Photo Essay",
    title: "Public Ground",
    color: "#28758c",
  },
  {
    id: "field-artifact-03",
    collectionId: "collection-field-archive",
    exploreLenses: ["self", "world"],
    type: "Audio Note",
    title: "Listening Position",
    color: "#916d61",
  },
  {
    id: "field-artifact-04",
    collectionId: "collection-field-archive",
    exploreLenses: ["inquiry"],
    type: "Research Note",
    title: "Who Owns the Horizon",
    color: "#6e5890",
  },
  {
    id: "inquiry-artifact-01",
    collectionId: "collection-inquiry-archive",
    exploreLenses: ["inquiry"],
    type: "Question",
    title: "What Can an Archive Remember",
    color: "#6e5890",
  },
  {
    id: "inquiry-artifact-02",
    collectionId: "collection-inquiry-archive",
    exploreLenses: ["work", "inquiry"],
    type: "Prototype",
    title: "Recursive Context Study",
    color: "#3d8062",
  },
  {
    id: "inquiry-artifact-03",
    collectionId: "collection-inquiry-archive",
    exploreLenses: ["self"],
    type: "Reflection",
    title: "The Researcher in the System",
    color: "#916d61",
  },
].map(
  (artifact): ReservoirArtifact => ({
    kind: "artifact",
    ...artifact,
    exploreLenses: artifact.exploreLenses as readonly ExploreLens[],
  }),
);

export const reservoirArtifacts: ReservoirArtifact[] = [
  ...canonicalReservoirArtifacts,
  ...directArtifactReferences,
  ...inspectionArtifacts,
];

const FORCE_DENSITY_TEST_MODE = false;
const DENSITY_TEST_NODE_COUNT = 24;

const DENSITY_TEST_TITLES = [
  "Still",
  "A Field Study at Dusk",
  "Notes on Repeated Motion and Quietly Changing Ground",
  "An Index of Small Signals Collected Between One Shoreline and the Next",
  "Trace",
  "Weather Systems for an Empty Room",
  "Observations from the Long Route Through a Landscape That Would Not Hold Still",
  "Drift",
  "Temporary Structures for Remembering Water",
  "A Working Archive of Peripheral Light, Interrupted Paths, and Other Minor Events",
  "Fold",
  "Instructions for Listening to Distance",
  "The Shape Left Behind When a Familiar Sequence Is Rearranged Without Warning",
  "Wake",
  "Material Notes from the Edge of the Frame",
  "A Catalogue of Nearly Invisible Boundaries and the Movements That Cross Them",
  "Signal",
  "Studies for a Room with No Fixed Center",
  "Fragments Gathered While the Horizon Continued Moving Beyond the Available View",
] as const;

const DENSITY_TEST_TYPES = [
  "Field Note",
  "Case Study",
  "Moving Image",
  "Web Experiment",
  "Photo Essay",
] as const;

const DENSITY_TEST_COLORS = [
  "#b9573f",
  "#28758c",
  "#6e5890",
  "#3d8062",
  "#a77a24",
  "#c76845",
  "#347e8f",
] as const;

export const reservoirDensityTestMode =
  process.env.NODE_ENV === "development" &&
  (FORCE_DENSITY_TEST_MODE ||
    process.env.NEXT_PUBLIC_RESERVOIR_DENSITY_TEST === "1");

function getDensityTestArtifactCount() {
  const activeCanonicalArtifacts = reservoirArtifacts.filter(
    (artifact) => artifact.collectionId === activeCollectionId,
  );
  return Math.max(0, DENSITY_TEST_NODE_COUNT - activeCanonicalArtifacts.length);
}

function createDensityTestArtifacts() {
  return Array.from(
    { length: getDensityTestArtifactCount() },
    (_, index): ReservoirArtifact => ({
      kind: "artifact",
      id: `density-artifact-${String(index + 1).padStart(2, "0")}`,
      collectionId: activeCollectionId,
      exploreLenses: ["inquiry"],
      type: DENSITY_TEST_TYPES[index % DENSITY_TEST_TYPES.length],
      title: DENSITY_TEST_TITLES[index],
      color: DENSITY_TEST_COLORS[index % DENSITY_TEST_COLORS.length],
    }),
  );
}

const densityTestArtifacts = reservoirDensityTestMode
  ? createDensityTestArtifacts()
  : [];

export const activeReservoirArtifacts = (
  reservoirDensityTestMode
    ? [...reservoirArtifacts, ...densityTestArtifacts]
    : reservoirArtifacts
).filter((artifact) => artifact.collectionId === activeCollectionId);

export function getReservoirArtifacts(collectionId: string) {
  const artifacts =
    reservoirDensityTestMode && collectionId === activeCollectionId
      ? [...reservoirArtifacts, ...densityTestArtifacts]
      : reservoirArtifacts;

  return artifacts.filter(
    (artifact) => artifact.collectionId === collectionId,
  );
}

export function prepareReservoirArtifactContent(
  artifact: ReservoirArtifact,
): PreparedArtifactContent {
  const details = [
    { label: "Date", value: artifact.date },
    { label: "Context", value: artifact.context },
    { label: "Medium", value: artifact.medium },
  ].filter(
    (detail): detail is { label: string; value: string } =>
      Boolean(detail.value),
  );

  return {
    artifactId: artifact.id,
    type: artifact.type,
    title: artifact.title,
    subtitle: artifact.subtitle,
    details,
    placeholderBody:
      artifact.subtitle ??
      `A prototype ${artifact.type.toLowerCase()} from the Digital Reservoir.`,
  };
}

export const reservoirDensityTestDiagnostics = {
  enabled: reservoirDensityTestMode,
  artifactCount: activeReservoirArtifacts.length,
  temporaryArtifactCount: densityTestArtifacts.length,
  artifactIds: activeReservoirArtifacts.map((artifact) => artifact.id),
};
