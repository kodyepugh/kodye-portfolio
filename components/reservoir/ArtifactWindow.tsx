import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { AnimationEvent, CSSProperties } from "react";
import type { Artifact, ArtifactContent } from "@/types/content";
import {
  getArtifactWindowDeployDuration,
  getArtifactWindowRetractDuration,
} from "@/lib/reservoir/reading";
import { getAssetById } from "@/lib/content/selectors";
import { BrandSymbol } from "../navigation/BrandSymbol";
import { ReservoirFooterContent } from "../navigation/ReservoirFooter";

type ArtifactWindowPhase = "deploying" | "reading" | "closing";

type ArtifactScrollPhase =
  | "content"
  | "revealingControlPlane"
  | "controlPlaneRevealed"
  | "revealingFooter"
  | "footerRevealed";

type ArtifactRevealMeasurements = {
  controlPlaneHeight: number;
  footerHeight: number;
};

type ArtifactWindowProps = {
  atmosphereBottom: number;
  artifact: Artifact;
  phase: ArtifactWindowPhase;
  reducedMotion: boolean;
  onDeployComplete: () => void;
  onClose: () => void;
  onFooterReachedChange: (reached: boolean) => void;
};

const INITIAL_REVEAL_MEASUREMENTS: ArtifactRevealMeasurements = {
  controlPlaneHeight: 0,
  footerHeight: 0,
};
const SCROLL_ENDPOINT_TOLERANCE = 1;
const POST_CONTENT_SCROLL_RATE = 1.2;

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function getDocumentScrollBottom() {
  return Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0,
  );
}

function getWheelDelta(event: globalThis.WheelEvent) {
  const deltaScale =
    event.deltaMode === globalThis.WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === globalThis.WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;

  return event.deltaY * deltaScale;
}

function renderArtifactContent(content: ArtifactContent | undefined) {
  if (!content) {
    return (
      <section>
        <p className="artifact-window__section-index">01 / Content</p>
        <h2>Unavailable content</h2>
        <p>
          This artifact is published in the semantic registry, but its
          approved content body has not been added yet.
        </p>
      </section>
    );
  }

  const placeholderNote =
    content.status === "placeholder" ? (
      <p>
        This entry is intentionally sparse until the approved source material
        is added to the registry.
      </p>
    ) : null;

  switch (content.kind) {
    case "rich-text":
      return (
        <section>
          <p className="artifact-window__section-index">01 / Overview</p>
          <h2>Reading copy</h2>
          {content.body.map((paragraph, index) => (
            <p key={`${index}-${paragraph}`}>{paragraph}</p>
          ))}
          {placeholderNote}
        </section>
      );
    case "external-link":
      return (
        <section>
          <p className="artifact-window__section-index">01 / Link</p>
          <h2>{content.label ?? "External reference"}</h2>
          <p>
            <a href={content.url} target="_blank" rel="noreferrer">
              {content.url}
            </a>
          </p>
          {placeholderNote}
        </section>
      );
    case "media": {
      const asset = getAssetById(content.assetId);
      return (
        <section>
          <p className="artifact-window__section-index">01 / Media</p>
          <h2>{asset?.filename ?? "Media asset"}</h2>
          {asset?.kind === "image" ? (
            <figure className="artifact-window__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.src}
                alt={asset.alt ?? asset.caption ?? ""}
              />
              {content.caption || asset.caption ? (
                <figcaption>{content.caption ?? asset.caption}</figcaption>
              ) : null}
            </figure>
          ) : (
            <p>{content.caption ?? asset?.caption ?? "Media available in the registry."}</p>
          )}
          {placeholderNote}
        </section>
      );
    }
    case "case-study":
      return (
        <>
          {content.sections.map((section, index) => (
            <section key={section.id} aria-labelledby={`${section.id}-heading`}>
              <p className="artifact-window__section-index">
                {String(index + 1).padStart(2, "0")} / {section.heading}
              </p>
              <h2 id={`${section.id}-heading`}>{section.heading}</h2>
              {section.body.map((paragraph, paragraphIndex) => (
                <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
              ))}
            </section>
          ))}
          {placeholderNote}
        </>
      );
    case "document":
      return (
        <section>
          <p className="artifact-window__section-index">01 / Document</p>
          <h2>Document record</h2>
          {content.assetId ? (
            <p>
              Supporting asset:{" "}
              <a href={getAssetById(content.assetId)?.src ?? "#"} target="_blank" rel="noreferrer">
                {getAssetById(content.assetId)?.filename ?? content.assetId}
              </a>
            </p>
          ) : null}
          {content.note ? <p>{content.note}</p> : null}
          {placeholderNote}
        </section>
      );
  }
}

function getArtifactScrollPhase(
  postContentOffset: number,
  measurements: ArtifactRevealMeasurements,
): ArtifactScrollPhase {
  if (postContentOffset <= 0) return "content";
  if (postContentOffset < measurements.controlPlaneHeight) {
    return "revealingControlPlane";
  }
  if (postContentOffset === measurements.controlPlaneHeight) {
    return "controlPlaneRevealed";
  }
  if (
    postContentOffset <
    measurements.controlPlaneHeight + measurements.footerHeight
  ) {
    return "revealingFooter";
  }
  return "footerRevealed";
}

export function ArtifactWindow({
  atmosphereBottom,
  artifact,
  phase,
  reducedMotion,
  onDeployComplete,
  onClose,
  onFooterReachedChange,
}: ArtifactWindowProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const controlPlaneRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const postContentOffsetRef = useRef(0);
  const revealMeasurementsRef =
    useRef<ArtifactRevealMeasurements>(INITIAL_REVEAL_MEASUREMENTS);
  const closeStartedRef = useRef(false);
  const [postContentOffset, setPostContentOffset] = useState(0);
  const [revealMeasurements, setRevealMeasurements] =
    useState<ArtifactRevealMeasurements>(INITIAL_REVEAL_MEASUREMENTS);
  const [closeScrollY, setCloseScrollY] = useState(0);
  const bodyId = `artifact-window-body-${artifact.id}`;
  const deployDuration = getArtifactWindowDeployDuration(reducedMotion);
  const retractDuration = getArtifactWindowRetractDuration(reducedMotion);
  const totalRevealDistance =
    revealMeasurements.controlPlaneHeight + revealMeasurements.footerHeight;
  const controlPlaneOffset = Math.max(
    postContentOffset - revealMeasurements.controlPlaneHeight,
    0,
  );
  const revealPhase = getArtifactScrollPhase(
    postContentOffset,
    revealMeasurements,
  );
  const controlPlaneProgress =
    revealMeasurements.controlPlaneHeight > 0
      ? clampProgress(
          postContentOffset / revealMeasurements.controlPlaneHeight,
        )
      : 0;
  const footerProgress =
    revealMeasurements.footerHeight > 0
      ? clampProgress(
          controlPlaneOffset / revealMeasurements.footerHeight,
        )
      : 0;
  const terminalVisible = postContentOffset > 0;
  const footerInteractive =
    phase === "reading" && revealPhase === "footerRevealed";
  const style = {
    "--artifact-window-deploy-duration": `${deployDuration}s`,
    "--artifact-window-retract-duration": `${retractDuration}s`,
    "--artifact-window-atmosphere-bottom": `${Math.ceil(atmosphereBottom)}px`,
    "--artifact-window-offset": `${postContentOffset}px`,
    "--artifact-control-plane-offset": `${controlPlaneOffset}px`,
    "--artifact-close-scroll-y": `${closeScrollY}px`,
  } as CSSProperties;

  const updatePostContentOffset = useCallback((next: number) => {
    postContentOffsetRef.current = next;
    setPostContentOffset(next);
  }, []);

  const beginClose = useCallback(() => {
    if (phase !== "reading" || closeStartedRef.current) return;
    closeStartedRef.current = true;
    setCloseScrollY(window.scrollY);
    onClose();
  }, [onClose, phase]);

  useEffect(() => {
    if (phase !== "reading") return;

    closeButtonRef.current?.focus({ preventScroll: true });

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      beginClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [beginClose, phase]);

  useLayoutEffect(() => {
    const controlPlane = controlPlaneRef.current;
    const footer = footerRef.current;
    if (!controlPlane || !footer) return;

    function measureTerminalLayers() {
      const previous = revealMeasurementsRef.current;
      const next = {
        controlPlaneHeight: controlPlane?.getBoundingClientRect().height ?? 0,
        footerHeight: footer?.getBoundingClientRect().height ?? 0,
      };
      const currentOffset = postContentOffsetRef.current;
      let resizedOffset = currentOffset;

      if (previous.controlPlaneHeight > 0) {
        if (currentOffset <= previous.controlPlaneHeight) {
          resizedOffset =
            (currentOffset / previous.controlPlaneHeight) *
            next.controlPlaneHeight;
        } else if (previous.footerHeight > 0) {
          resizedOffset =
            next.controlPlaneHeight +
            ((currentOffset - previous.controlPlaneHeight) /
              previous.footerHeight) *
              next.footerHeight;
        }
      }

      revealMeasurementsRef.current = next;
      setRevealMeasurements(next);
      updatePostContentOffset(
        Math.min(
          Math.max(resizedOffset, 0),
          next.controlPlaneHeight + next.footerHeight,
        ),
      );
    }

    measureTerminalLayers();
    const observer = new ResizeObserver(measureTerminalLayers);
    observer.observe(controlPlane);
    observer.observe(footer);
    window.addEventListener("resize", measureTerminalLayers);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureTerminalLayers);
    };
  }, [updatePostContentOffset]);

  useEffect(() => {
    onFooterReachedChange(controlPlaneOffset > 0);
  }, [controlPlaneOffset, onFooterReachedChange]);

  useEffect(() => {
    if (phase !== "reading") return;

    function pinRevealToScrollBottom() {
      if (postContentOffsetRef.current <= 0) return;
      const scrollBottom = getDocumentScrollBottom();
      if (Math.abs(window.scrollY - scrollBottom) <= SCROLL_ENDPOINT_TOLERANCE) {
        return;
      }
      window.scrollTo({ top: scrollBottom, left: 0, behavior: "instant" });
    }

    function consumeRevealWheel(event: globalThis.WheelEvent) {
      const currentOffset = postContentOffsetRef.current;
      const measurements = revealMeasurementsRef.current;
      const delta = getWheelDelta(event);
      const scrollBottom = getDocumentScrollBottom();
      const atScrollBottom =
        Math.abs(window.scrollY - scrollBottom) <= SCROLL_ENDPOINT_TOLERANCE;

      if (currentOffset <= 0) {
        if (delta <= 0 || !atScrollBottom) return;
      }

      event.preventDefault();
      event.stopPropagation();
      const totalDistance =
        measurements.controlPlaneHeight + measurements.footerHeight;
      if (totalDistance <= 0) return;
      const unboundedOffset =
        currentOffset + delta * POST_CONTENT_SCROLL_RATE;
      const nextOffset = Math.min(
        Math.max(unboundedOffset, 0),
        totalDistance,
      );
      updatePostContentOffset(nextOffset);

      if (unboundedOffset < 0) {
        window.scrollBy({
          top: unboundedOffset / POST_CONTENT_SCROLL_RATE,
          left: 0,
          behavior: "instant",
        });
      }
    }

    window.addEventListener("wheel", consumeRevealWheel, {
      capture: true,
      passive: false,
    });
    window.addEventListener("scroll", pinRevealToScrollBottom, {
      passive: true,
    });

    return () => {
      window.removeEventListener("wheel", consumeRevealWheel, true);
      window.removeEventListener("scroll", pinRevealToScrollBottom);
    };
  }, [phase, updatePostContentOffset]);

  useEffect(
    () => () => {
      onFooterReachedChange(false);
    },
    [onFooterReachedChange],
  );

  function completeDeployment(event: AnimationEvent<HTMLDivElement>) {
    if (phase !== "deploying" || event.target !== event.currentTarget) return;
    onDeployComplete();
  }

  return (
    <>
      <div className="artifact-reading-backdrop" aria-hidden="true" />
      <div
        className="artifact-reading-stage"
        data-artifact-window-phase={phase}
        data-artifact-scroll-phase={revealPhase}
        data-post-content-offset={postContentOffset.toFixed(3)}
        data-symbol-reveal-distance={revealMeasurements.controlPlaneHeight.toFixed(
          3,
        )}
        data-footer-reveal-distance={revealMeasurements.footerHeight.toFixed(3)}
        data-total-reveal-distance={totalRevealDistance.toFixed(3)}
        data-control-plane-progress={controlPlaneProgress.toFixed(4)}
        data-footer-progress={footerProgress.toFixed(4)}
        data-artifact-atmosphere-bottom={Math.ceil(atmosphereBottom)}
        data-artifact-top-rule="max(32svh, atmosphere bottom + responsive gap)"
        style={style}
      >
        <div
          className="artifact-terminal-layer"
          aria-hidden={!terminalVisible}
          data-artifact-footer-interactive={footerInteractive}
          data-artifact-terminal-visible={terminalVisible}
        >
          <footer
            ref={footerRef}
            className="reservoir-footer reservoir-footer--artifact"
            aria-label="Site footer"
            aria-hidden={!footerInteractive}
          >
            <ReservoirFooterContent interactive={footerInteractive} />
          </footer>
          <div
            ref={controlPlaneRef}
            className="artifact-terminal-layer__signature"
          >
            <BrandSymbol variant="artifact-terminal" />
          </div>
        </div>
        <div
          className="artifact-window-shell"
          data-artifact-window-phase={phase}
          data-artifact-id={artifact.id}
          onAnimationEnd={completeDeployment}
        >
          <article
            className="artifact-window"
            aria-label={`${artifact.title} artifact context`}
            data-phase={phase}
          >
            <button
              ref={closeButtonRef}
              className="artifact-window__close"
              type="button"
              disabled={phase !== "reading"}
              onClick={beginClose}
            >
              <span>Close artifact</span>
              <span aria-hidden="true">×</span>
            </button>

            <div id={bodyId} className="artifact-window__body">
              {renderArtifactContent(artifact.content)}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
