import type {
  Resource,
  ResourceExternalRepresentation,
} from "../../types/content";

export type ExternalLinkInspectionTarget = {
  url: string;
  label: string;
  hostname: string;
  pathname: string;
  protocol: string;
  sourceLabel?: string;
};

export type ExternalLinkInspectionResolution =
  | {
      status: "ready";
      source: "representation" | "content";
      target: ExternalLinkInspectionTarget;
      representation?: ResourceExternalRepresentation;
    }
  | {
      status: "unavailable";
      reason: string;
      details: readonly string[];
    };

function compareRepresentations(
  a: { order?: number; id: string },
  b: { order?: number; id: string },
) {
  return (
    (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER) ||
    a.id.localeCompare(b.id)
  );
}

function hasUsableExternalUrl(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveTarget(url: string, label: string, sourceLabel?: string) {
  const resolved = new URL(url.trim());
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new Error(
      `Unsupported external-link protocol ${resolved.protocol}`,
    );
  }

  return {
    url: resolved.toString(),
    label,
    hostname: resolved.hostname,
    pathname: resolved.pathname || "/",
    protocol: resolved.protocol.replace(/:$/, ""),
    sourceLabel,
  };
}

export function getPublishedExternalLinkRepresentations(
  resource: Pick<Resource, "representations">,
) {
  return (resource.representations ?? [])
    .filter(
      (
        representation,
      ): representation is ResourceExternalRepresentation =>
        representation.kind === "external" && representation.published !== false,
    )
    .slice()
    .sort(compareRepresentations);
}

export function resolveExternalLinkInspection(
  resource: Pick<Resource, "content" | "representations" | "title" | "id">,
): ExternalLinkInspectionResolution {
  const details: string[] = [];

  for (const representation of getPublishedExternalLinkRepresentations(resource)) {
    if (!hasUsableExternalUrl(representation.url)) {
      details.push(
        `Published external-link representation ${representation.id} does not expose a usable URL.`,
      );
      continue;
    }

    try {
      return {
        status: "ready",
        source: "representation",
        target: resolveTarget(
          representation.url,
          representation.label?.trim() ||
            representation.sourceLabel?.trim() ||
            resource.title,
          representation.sourceLabel?.trim(),
        ),
        representation,
      };
    } catch (error) {
      details.push(
        error instanceof Error && error.message.includes("protocol")
          ? `Published external-link representation ${representation.id} uses an unsupported URL protocol.`
          : `Published external-link representation ${representation.id} has an invalid URL ${representation.url}.`,
      );
    }
  }

  if (resource.content?.kind === "external-link") {
    if (!hasUsableExternalUrl(resource.content.url)) {
      details.push(
        `External-link content for Resource ${resource.id} does not expose a usable URL.`,
      );
    } else {
      try {
        return {
          status: "ready",
          source: "content",
          target: resolveTarget(
            resource.content.url,
            resource.content.label?.trim() || resource.title,
          ),
        };
      } catch (error) {
        details.push(
          error instanceof Error && error.message.includes("protocol")
            ? `External-link content for Resource ${resource.id} uses an unsupported URL protocol.`
            : `External-link content for Resource ${resource.id} has an invalid URL ${resource.content.url}.`,
        );
      }
    }
  }

  const reason =
    getPublishedExternalLinkRepresentations(resource).length > 0
      ? "The published external link target is unavailable."
      : resource.content?.kind === "external-link"
        ? "The external-link content fallback is unavailable."
        : "This Resource does not currently expose a published external link target.";

  return {
    status: "unavailable",
    reason,
    details,
  };
}
