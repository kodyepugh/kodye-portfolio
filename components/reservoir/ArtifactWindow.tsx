import { useEffect, useRef } from "react";
import type { AnimationEvent, CSSProperties } from "react";
import {
  getArtifactWindowDeployDuration,
  getArtifactWindowRetractDuration,
} from "@/lib/reservoir/reading";
import type { PreparedArtifactContent } from "@/types/reservoir";

type ArtifactWindowPhase = "deploying" | "reading" | "closing";

type ArtifactWindowProps = {
  atmosphereBottom: number;
  content: PreparedArtifactContent;
  phase: ArtifactWindowPhase;
  reducedMotion: boolean;
  onDeployComplete: () => void;
  onClose: () => void;
};

export function ArtifactWindow({
  atmosphereBottom,
  content,
  phase,
  reducedMotion,
  onDeployComplete,
  onClose,
}: ArtifactWindowProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const bodyId = `artifact-window-body-${content.artifactId}`;
  const deployDuration = getArtifactWindowDeployDuration(reducedMotion);
  const retractDuration = getArtifactWindowRetractDuration(reducedMotion);
  const style = {
    "--artifact-window-deploy-duration": `${deployDuration}s`,
    "--artifact-window-retract-duration": `${retractDuration}s`,
    "--artifact-window-top": `${Math.ceil(atmosphereBottom)}px`,
  } as CSSProperties;

  useEffect(() => {
    if (phase !== "reading") return;

    closeButtonRef.current?.focus({ preventScroll: true });

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, phase]);

  function completeDeployment(event: AnimationEvent<HTMLDivElement>) {
    if (phase !== "deploying" || event.target !== event.currentTarget) return;
    onDeployComplete();
  }

  return (
    <>
      <div className="artifact-reading-backdrop" aria-hidden="true" />
      <div
        className="artifact-window-shell"
        data-artifact-window-phase={phase}
        data-artifact-id={content.artifactId}
        style={style}
        onAnimationEnd={completeDeployment}
      >
        <article
          className="artifact-window"
          aria-label={`${content.title} artifact context`}
          data-phase={phase}
        >
          <button
            ref={closeButtonRef}
            className="artifact-window__close"
            type="button"
            disabled={phase !== "reading"}
            onClick={onClose}
          >
            <span>Close artifact</span>
            <span aria-hidden="true">×</span>
          </button>

          <div id={bodyId} className="artifact-window__body">
          <section aria-labelledby={`${bodyId}-overview`}>
            <p className="artifact-window__section-index">01 / Overview</p>
            <h2 id={`${bodyId}-overview`}>A prepared context</h2>
            <p>{content.placeholderBody}</p>
            <p>
              This prototype surface keeps the artifact available before the
              frame enters, preserving a continuous transition from spatial
              exploration into ordinary reading. The final project narrative,
              media, and supporting evidence will replace this temporary copy.
            </p>
            <a href={`#${bodyId}-process`}>Continue to process notes</a>
          </section>

          <section aria-labelledby={`${bodyId}-observations`}>
            <p className="artifact-window__section-index">02 / Observations</p>
            <h2 id={`${bodyId}-observations`}>Signals gathered in context</h2>
            <p>
              The artifact is treated as a situated record rather than an
              isolated card. Its surrounding conditions, material decisions,
              and unresolved questions remain part of the reading experience.
            </p>
            <p>
              Placeholder passages deliberately extend the document so wheel,
              trackpad, keyboard navigation, text selection, and anchored links
              can be evaluated using the browser&apos;s normal page model.
            </p>
          </section>

          <section
            id={`${bodyId}-process`}
            aria-labelledby={`${bodyId}-process-heading`}
          >
            <p className="artifact-window__section-index">03 / Process</p>
            <h2 id={`${bodyId}-process-heading`}>Working notes</h2>
            <p>
              Future content can combine essays, images, data, or interactive
              fragments without changing the reservoir&apos;s opening and closing
              contract. For now, this section provides a durable semantic
              structure for testing the transition.
            </p>
            <blockquote>
              The context window is a reading layer above the reservoir, not a
              replacement for the spatial state preserved underneath it.
            </blockquote>
          </section>

          <section aria-labelledby={`${bodyId}-next`}>
            <p className="artifact-window__section-index">04 / Next</p>
            <h2 id={`${bodyId}-next`}>Prototype boundary</h2>
            <p>
              Production typography, media treatment, and case-study content
              remain intentionally open. Closing this window returns to the
              exact reservoir viewpoint captured before activation.
            </p>
            <a href={`#${bodyId}`}>Return to artifact body</a>
          </section>
          </div>
        </article>
      </div>
    </>
  );
}
