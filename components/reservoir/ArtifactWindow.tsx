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
  initialScrollTop?: number;
  onDeployComplete: () => void;
  onClose: () => void;
  onSupportingResourceSelect?: (resourceId: string) => void;
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
      exitIntent="close"
      initialReturnFrame={null}
      resource={artifact}
      onNavigateToResource={(resourceId) =>
        onNavigateToResource?.(resourceId)
      }
      onNavigateToCollection={() => {}}
      onReadingStateRestored={() => {}}
      {...props}
    />
  );
}
