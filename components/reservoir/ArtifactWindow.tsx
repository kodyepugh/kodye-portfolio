import type { Artifact } from "@/types/content";
import {
  InspectionWindow,
  type InspectionWindowPhase,
} from "./InspectionWindow";

type ArtifactWindowProps = {
  atmosphereBottom: number;
  artifact: Artifact;
  phase: InspectionWindowPhase;
  reducedMotion: boolean;
  onDeployComplete: () => void;
  onClose: () => void;
  onFooterReachedChange: (reached: boolean) => void;
  onNavigateToResource?: (resourceId: string) => void;
};

/**
 * Temporary compatibility entry point for older callers. New inspection
 * behavior belongs to the Resource-oriented InspectionWindow.
 */
export function ArtifactWindow({
  artifact,
  onNavigateToResource,
  ...props
}: ArtifactWindowProps) {
  return (
    <InspectionWindow
      resource={artifact}
      onNavigateToResource={onNavigateToResource ?? (() => {})}
      {...props}
    />
  );
}
