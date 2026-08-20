import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { AnimationEvent, CSSProperties } from "react";
import type { Resource } from "@/types/content";
import {
  getInspectionWindowDeployDuration,
  getInspectionWindowRetractDuration,
} from "@/lib/reservoir/reading";
import { BrandSymbol } from "../navigation/BrandSymbol";
import { ReservoirFooterContent } from "../navigation/ReservoirFooter";
import { InspectionWindowBody } from "./InspectionWindowBody";

export type InspectionWindowPhase = "deploying" | "reading" | "closing";

type InspectionScrollPhase =
  | "content"
  | "revealingControlPlane"
  | "controlPlaneRevealed"
  | "revealingFooter"
  | "footerRevealed";

type InspectionRevealMeasurements = {
  controlPlaneHeight: number;
  footerHeight: number;
};

export type InspectionWindowProps = {
  atmosphereBottom: number;
  resource: Resource;
  phase: InspectionWindowPhase;
  reducedMotion: boolean;
  onDeployComplete: () => void;
  onClose: () => void;
  onFooterReachedChange: (reached: boolean) => void;
};

const INITIAL_REVEAL_MEASUREMENTS: InspectionRevealMeasurements = {
  controlPlaneHeight: 0,
  footerHeight: 0,
};
const SCROLL_ENDPOINT_TOLERANCE = 1;
const POST_CONTENT_SCROLL_RATE = 1.2;

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function getDocumentScrollBottom() {
  return Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
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

function getInspectionScrollPhase(
  postContentOffset: number,
  measurements: InspectionRevealMeasurements,
): InspectionScrollPhase {
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

function getFocusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute("hidden"));
}

export function InspectionWindow({
  atmosphereBottom,
  resource,
  phase,
  reducedMotion,
  onDeployComplete,
  onClose,
  onFooterReachedChange,
}: InspectionWindowProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const controlPlaneRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const postContentOffsetRef = useRef(0);
  const revealMeasurementsRef =
    useRef<InspectionRevealMeasurements>(INITIAL_REVEAL_MEASUREMENTS);
  const closeStartedRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [postContentOffset, setPostContentOffset] = useState(0);
  const [revealMeasurements, setRevealMeasurements] =
    useState<InspectionRevealMeasurements>(INITIAL_REVEAL_MEASUREMENTS);
  const [closeScrollY, setCloseScrollY] = useState(0);
  const titleId = `inspection-window-title-${resource.id}`;
  const bodyId = `inspection-window-body-${resource.id}`;
  const deployDuration = getInspectionWindowDeployDuration(reducedMotion);
  const retractDuration = getInspectionWindowRetractDuration(reducedMotion);
  const totalRevealDistance =
    revealMeasurements.controlPlaneHeight + revealMeasurements.footerHeight;
  const controlPlaneOffset = Math.max(
    postContentOffset - revealMeasurements.controlPlaneHeight,
    0,
  );
  const revealPhase = getInspectionScrollPhase(
    postContentOffset,
    revealMeasurements,
  );
  const controlPlaneProgress =
    revealMeasurements.controlPlaneHeight > 0
      ? clampProgress(postContentOffset / revealMeasurements.controlPlaneHeight)
      : 0;
  const footerProgress =
    revealMeasurements.footerHeight > 0
      ? clampProgress(controlPlaneOffset / revealMeasurements.footerHeight)
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
    const stage = stageRef.current;
    const backdrop = backdropRef.current;
    const root = stage?.closest<HTMLElement>(".reservoir-study");
    if (!stage || !root) return;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const restored = [...root.children].flatMap((child) => {
      if (!(child instanceof HTMLElement)) return [];
      if (child === stage || child === backdrop || child.contains(stage)) return [];
      const previous = {
        element: child,
        inert: child.inert,
        ariaHidden: child.getAttribute("aria-hidden"),
      };
      child.inert = true;
      child.setAttribute("aria-hidden", "true");
      return [previous];
    });

    return () => {
      for (const previous of restored) {
        previous.element.inert = previous.inert;
        if (previous.ariaHidden === null) {
          previous.element.removeAttribute("aria-hidden");
        } else {
          previous.element.setAttribute("aria-hidden", previous.ariaHidden);
        }
      }
      previouslyFocusedRef.current?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (phase !== "reading") return;

    closeButtonRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "reading") return;

    function handleDialogKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        beginClose();
        return;
      }
      if (event.key !== "Tab" || !stageRef.current || !contentRef.current) return;

      const focusable = [
        ...getFocusableElements(contentRef.current),
        ...(footerInteractive && footerRef.current
          ? getFocusableElements(footerRef.current)
          : []),
      ];
      if (focusable.length === 0) {
        event.preventDefault();
        closeButtonRef.current?.focus({ preventScroll: true });
        return;
      }
      const currentElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const currentIndex =
        currentElement === null ? -1 : focusable.indexOf(currentElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusable.length - 1
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === focusable.length - 1
          ? 0
          : currentIndex + 1;
      event.preventDefault();
      focusable[nextIndex]?.focus({ preventScroll: true });
    }

    window.addEventListener("keydown", handleDialogKeyboard);
    return () => window.removeEventListener("keydown", handleDialogKeyboard);
  }, [beginClose, footerInteractive, phase]);

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

      if (currentOffset <= 0 && (delta <= 0 || !atScrollBottom)) return;

      event.preventDefault();
      event.stopPropagation();
      const totalDistance =
        measurements.controlPlaneHeight + measurements.footerHeight;
      if (totalDistance <= 0) return;
      const unboundedOffset = currentOffset + delta * POST_CONTENT_SCROLL_RATE;
      const nextOffset = Math.min(Math.max(unboundedOffset, 0), totalDistance);
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
      <div ref={backdropRef} className="artifact-reading-backdrop" aria-hidden="true" />
      <div
        ref={stageRef}
        className="artifact-reading-stage inspection-reading-stage"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-inspection-window-phase={phase}
        data-artifact-window-phase={phase}
        data-inspection-scroll-phase={revealPhase}
        data-artifact-scroll-phase={revealPhase}
        aria-busy={phase !== "reading"}
        data-post-content-offset={postContentOffset.toFixed(3)}
        data-symbol-reveal-distance={revealMeasurements.controlPlaneHeight.toFixed(3)}
        data-footer-reveal-distance={revealMeasurements.footerHeight.toFixed(3)}
        data-total-reveal-distance={totalRevealDistance.toFixed(3)}
        data-control-plane-progress={controlPlaneProgress.toFixed(4)}
        data-footer-progress={footerProgress.toFixed(4)}
        data-inspection-atmosphere-bottom={Math.ceil(atmosphereBottom)}
        data-artifact-atmosphere-bottom={Math.ceil(atmosphereBottom)}
        data-inspection-top-rule="max(32svh, atmosphere bottom + responsive gap)"
        data-artifact-top-rule="max(32svh, atmosphere bottom + responsive gap)"
        style={style}
      >
        <div
          className="artifact-terminal-layer"
          aria-hidden={!terminalVisible}
          data-inspection-footer-interactive={footerInteractive}
          data-inspection-terminal-visible={terminalVisible}
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
          <div ref={controlPlaneRef} className="artifact-terminal-layer__signature">
            <BrandSymbol variant="artifact-terminal" />
          </div>
        </div>
        <div
          className="artifact-window-shell inspection-window-shell"
          data-inspection-window-phase={phase}
          data-artifact-window-phase={phase}
          data-inspected-resource-id={resource.id}
          data-artifact-id={resource.isArtifact ? resource.id : ""}
          onAnimationEnd={completeDeployment}
        >
          <article
            ref={contentRef}
            className="artifact-window inspection-window"
            data-phase={phase}
            data-inspection-kind={resource.inspectionKind}
            data-artifact-status={resource.isArtifact}
          >
            <h1 id={titleId} className="sr-only">{resource.title}</h1>
            <button
              ref={closeButtonRef}
              className="artifact-window__close inspection-window__close"
              type="button"
              disabled={phase !== "reading"}
              onClick={beginClose}
            >
              <span>Close inspection</span>
              <span aria-hidden="true">×</span>
            </button>

            <div id={bodyId} className="artifact-window__body inspection-window__body-layout">
              <div className="inspection-window__primary-body">
                <InspectionWindowBody resource={resource} />
              </div>
              <aside
                className="inspection-window__support-region"
                data-supporting-resource-region="deferred"
                aria-hidden="true"
                hidden
              />
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
