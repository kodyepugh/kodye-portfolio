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
  getPublishedResourceCollections,
  getPublishedResourceContext,
} from "@/lib/content/selectors";
import { BrandSymbol } from "../navigation/BrandSymbol";
import { ReservoirFooterContent } from "../navigation/ReservoirFooter";
import { InspectionContextTray } from "./InspectionContextTray";
import { InspectionWindowBody } from "./InspectionWindowBody";
import {
  createInspectionReturnFrame,
  getInspectionReturnPostContentOffset,
  getInspectionReturnScrollY,
  type InspectionReturnFrame,
} from "@/lib/reservoir/inspection-return";
import {
  getInspectionWindowDeployDuration,
  getInspectionWindowRetractDuration,
} from "@/lib/reservoir/reading";

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
  exitIntent:
    | "close"
    | "support-resource-navigation"
    | "collection-navigation";
  initialReturnFrame: InspectionReturnFrame | null;
  phase: InspectionWindowPhase;
  reducedMotion: boolean;
  onDeployComplete: () => void;
  onClose: () => void;
  onFooterReachedChange: (reached: boolean) => void;
  onNavigateToResource: (
    resourceId: string,
    returnFrame: InspectionReturnFrame,
  ) => void;
  onNavigateToCollection: (
    collectionId: string,
    returnFrame: InspectionReturnFrame,
  ) => void;
  onReadingStateRestored: (frame: InspectionReturnFrame) => void;
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
  exitIntent,
  initialReturnFrame,
  onDeployComplete,
  onClose,
  onFooterReachedChange,
  onNavigateToResource,
  onNavigateToCollection,
  onReadingStateRestored,
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
  const closeClickCountRef = useRef(0);
  const closeRequestCountRef = useRef(0);
  const closeRequestPendingRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const closeIntentRef = useRef<InspectionWindowProps["exitIntent"]>(exitIntent);
  const readingStateRestoredRef = useRef(false);
  const [postContentOffset, setPostContentOffset] = useState(0);
  const [revealMeasurements, setRevealMeasurements] =
    useState<InspectionRevealMeasurements>(INITIAL_REVEAL_MEASUREMENTS);
  const [closeScrollY, setCloseScrollY] = useState(0);
  const titleId = `inspection-window-title-${resource.id}`;
  const bodyId = `inspection-window-body-${resource.id}`;
  const resources = getPublishedResourceContext(resource.id);
  const collections = getPublishedResourceCollections(resource.id);
  const deployDuration = getInspectionWindowDeployDuration(reducedMotion);
  const retractDuration = getInspectionWindowRetractDuration(reducedMotion);
  const contextTrayVisible =
    resources.length > 0 || collections.length > 0;
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

  useLayoutEffect(() => {
    closeIntentRef.current = exitIntent;
  }, [exitIntent]);

  const beginClose = useCallback(() => {
    const stage = stageRef.current;
    if (phase !== "reading") return;
    closeRequestCountRef.current += 1;
    closeRequestPendingRef.current = true;
    if (stage) {
      stage.dataset.inspectionCloseRequestCount = String(
        closeRequestCountRef.current,
      );
      stage.dataset.inspectionCloseRequestSentAt = String(performance.now());
      stage.dataset.inspectionCloseTransitionAccepted = "pending";
    }
    setCloseScrollY(window.scrollY);
    onClose();
  }, [onClose, phase]);

  const markClosePointer = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.inspectionClosePointerCount = String(
      Number(stage.dataset.inspectionClosePointerCount ?? 0) + 1,
    );
    stage.dataset.inspectionClosePointerReceivedAt = String(performance.now());
  }, []);

  const markCloseClick = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    closeClickCountRef.current += 1;
    stage.dataset.inspectionCloseClickCount = String(
      closeClickCountRef.current,
    );
    stage.dataset.inspectionCloseClickReceivedAt = String(performance.now());
  }, []);

  const markClosePointerUp = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.inspectionClosePointerUpCount = String(
      Number(stage.dataset.inspectionClosePointerUpCount ?? 0) + 1,
    );
    stage.dataset.inspectionClosePointerUpReceivedAt = String(performance.now());
  }, []);

  const markClosePointerCancel = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.inspectionClosePointerCancelCount = String(
      Number(stage.dataset.inspectionClosePointerCancelCount ?? 0) + 1,
    );
    stage.dataset.inspectionClosePointerCancelReceivedAt = String(
      performance.now(),
    );
  }, []);

  const handleBackToTop = useCallback(() => {
    updatePostContentOffset(0);

    const returnToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion ? "instant" : "smooth",
      });
      closeButtonRef.current?.focus({ preventScroll: true });
    };

    if (reducedMotion) {
      returnToTop();
      return;
    }

    requestAnimationFrame(returnToTop);
  }, [reducedMotion, updatePostContentOffset]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !closeRequestPendingRef.current) return;

    if (phase === "closing") {
      closeRequestPendingRef.current = false;
      stage.dataset.inspectionCloseTransitionAccepted = "true";
      stage.dataset.inspectionCloseClosingPhaseEnteredAt = String(
        performance.now(),
      );
    } else if (phase === "reading") {
      stage.dataset.inspectionCloseTransitionAccepted = "pending";
    }
  }, [phase]);

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
      if (closeIntentRef.current === "close") {
        previouslyFocusedRef.current?.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "reading") return;

    closeButtonRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (
      phase !== "reading" ||
      !initialReturnFrame ||
      readingStateRestoredRef.current
    ) {
      return;
    }

    let alignmentFrameId = 0;
    const measurementFrameId = requestAnimationFrame(() => {
      const measurements = revealMeasurementsRef.current;
      const measuredRevealDistance =
        measurements.controlPlaneHeight + measurements.footerHeight;
      const restoredPostContentOffset =
        getInspectionReturnPostContentOffset(
          initialReturnFrame,
          measuredRevealDistance,
        );
      updatePostContentOffset(restoredPostContentOffset);

      alignmentFrameId = requestAnimationFrame(() => {
        const restoredScrollY = getInspectionReturnScrollY(
          initialReturnFrame,
          getDocumentScrollBottom(),
        );
        window.scrollTo({
          top: restoredScrollY,
          left: 0,
          behavior: "instant",
        });
        readingStateRestoredRef.current = true;
        onReadingStateRestored(
          createInspectionReturnFrame(
            initialReturnFrame.resourceId,
            restoredScrollY,
            measuredRevealDistance > 0
              ? restoredPostContentOffset / measuredRevealDistance
              : 0,
          ),
        );
      });
    });

    return () => {
      cancelAnimationFrame(measurementFrameId);
      cancelAnimationFrame(alignmentFrameId);
    };
  }, [
    initialReturnFrame,
    onReadingStateRestored,
    phase,
    updatePostContentOffset,
  ]);

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

  function navigateToSupportingResource(resourceId: string) {
    onNavigateToResource(resourceId, createCurrentInspectionReturnFrame());
  }

  function createCurrentInspectionReturnFrame() {
    const measurements = revealMeasurementsRef.current;
    const measuredRevealDistance =
      measurements.controlPlaneHeight + measurements.footerHeight;
    return createInspectionReturnFrame(
      resource.id,
      window.scrollY,
      measuredRevealDistance > 0
        ? postContentOffsetRef.current / measuredRevealDistance
        : 0,
    );
  }

  function navigateToCollection(collectionId: string) {
    onNavigateToCollection(collectionId, createCurrentInspectionReturnFrame());
  }

  return (
    <>
      <div
        ref={backdropRef}
        className="inspection-reading-backdrop"
        aria-hidden="true"
        data-inspection-window-phase={phase}
      />
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
        data-inspection-top-rule="max(18svh, atmosphere bottom + responsive gap)"
        data-artifact-top-rule="max(18svh, atmosphere bottom + responsive gap)"
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
            <div className="inspection-window__close-row">
              <button
                ref={closeButtonRef}
                className="artifact-window__close inspection-window__close"
                type="button"
                disabled={phase !== "reading"}
                onPointerDown={markClosePointer}
                onPointerUp={markClosePointerUp}
                onPointerCancel={markClosePointerCancel}
                onClick={() => {
                  markCloseClick();
                  beginClose();
                }}
                aria-label="Close inspection"
                title="Close inspection"
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">Close inspection</span>
              </button>
            </div>
            <h1 id={titleId} className="sr-only">
              {resource.title}
            </h1>
            <div
              id={bodyId}
              className="artifact-window__body inspection-window__body-layout"
              data-context-tray-visible={contextTrayVisible}
              data-context-tray-interactive={phase === "reading"}
              data-context-resources-count={resources.length}
              data-context-collections-count={collections.length}
            >
              <div className="inspection-window__primary-body">
                <InspectionWindowBody resource={resource} />
              </div>
              <InspectionContextTray
                phase={phase}
                resources={resources}
                collections={collections}
                onNavigateToResource={navigateToSupportingResource}
                onNavigateToCollection={navigateToCollection}
              />
              <button
                className="inspection-window__back-to-top"
                type="button"
                disabled={phase !== "reading"}
                onClick={handleBackToTop}
                aria-label="Back to top"
                title="Back to top"
              >
                <span aria-hidden="true">↑</span>
                <span>Back to top</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
