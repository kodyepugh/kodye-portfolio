import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  clampInspectionImageZoom,
  getInspectionImageGestureMode,
  getInspectionImageSequenceIndex,
  sortInspectionImageSequence,
  INSPECTION_IMAGE_MAX_ZOOM,
  INSPECTION_IMAGE_MIN_ZOOM,
} from "@/lib/reservoir/inspection-image-viewer";

export type InspectionImageDescriptor = {
  id: string;
  order: number;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
};

type InspectionImageViewerContextValue = {
  registerImage: (descriptor: InspectionImageDescriptor) => void;
  unregisterImage: (id: string) => void;
  openImage: (id: string, launcher: HTMLElement) => void;
};

const InspectionImageViewerContext = createContext<InspectionImageViewerContextValue | null>(
  null,
);

const SWIPE_DISTANCE = 48;
const PAN_DISTANCE = 4;

function getFocusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute("hidden"));
}

function getDistance(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getCenter(first: { x: number; y: number }, second: { x: number; y: number }) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function useInspectionImageLauncher(
  descriptor: InspectionImageDescriptor | null,
) {
  const context = useContext(InspectionImageViewerContext);

  useLayoutEffect(() => {
    if (!context || !descriptor) return;
    context.registerImage(descriptor);
    return () => context.unregisterImage(descriptor.id);
  }, [context, descriptor]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!context || !descriptor) return;
      context.openImage(descriptor.id, event.currentTarget);
    },
    [context, descriptor],
  );

  return {
    onClick: handleClick,
    "data-inspection-image-launcher": descriptor?.id,
  };
}

function InspectionImageViewer({
  descriptors,
  openId,
  onClose,
  onOpenImage,
}: {
  descriptors: readonly InspectionImageDescriptor[];
  openId: string | null;
  onClose: () => void;
  onOpenImage: (id: string) => void;
}) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerMapRef = useRef(new Map<number, { x: number; y: number; type: string }>());
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startZoom: number;
    pinchDistance: number | null;
    pinchZoom: number;
    pinchCenter: { x: number; y: number } | null;
    moved: boolean;
  } | null>(null);
  const currentIndex = openId
    ? getInspectionImageSequenceIndex(descriptors, openId)
    : -1;
  const current = currentIndex >= 0 ? descriptors[currentIndex] : null;
  const [zoom, setZoom] = useState(INSPECTION_IMAGE_MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [intrinsicSize, setIntrinsicSize] = useState(() => ({
    width: current?.width ?? 1200,
    height: current?.height ?? 800,
  }));
  const previouslyOpenRef = useRef<string | null>(null);
  const imageWidth = current?.width ?? intrinsicSize.width;
  const imageHeight = current?.height ?? intrinsicSize.height;
  const fitScale =
    viewport.width > 0 && viewport.height > 0
      ? Math.min(
          (viewport.width - 96) / imageWidth,
          (viewport.height - 150) / imageHeight,
          1,
        )
      : 1;
  const renderedWidth = imageWidth * fitScale * zoom;
  const renderedHeight = imageHeight * fitScale * zoom;
  const maxPanX = Math.max((renderedWidth - viewport.width) / 2, 0);
  const maxPanY = Math.max((renderedHeight - viewport.height) / 2, 0);
  const boundedPan = {
    x: Math.min(Math.max(pan.x, -maxPanX), maxPanX),
    y: Math.min(Math.max(pan.y, -maxPanY), maxPanY),
  };

  const setZoomAndCenter = useCallback((nextZoom: number) => {
    setZoom(clampInspectionImageZoom(nextZoom));
    if (nextZoom <= INSPECTION_IMAGE_MIN_ZOOM) setPan({ x: 0, y: 0 });
  }, []);

  const changeImage = useCallback(
    (nextIndex: number) => {
      const next = descriptors[nextIndex];
      if (!next) return;
      setZoom(INSPECTION_IMAGE_MIN_ZOOM);
      setPan({ x: 0, y: 0 });
      setIntrinsicSize({
        width: next.width ?? 1200,
        height: next.height ?? 800,
      });
      onOpenImage(next.id);
    },
    [descriptors, onOpenImage],
  );

  const changeBy = useCallback(
    (delta: number) => changeImage(currentIndex + delta),
    [changeImage, currentIndex],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !openId) return;

    const measure = () => {
      setViewport({ width: stage.clientWidth, height: stage.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [openId]);

  useEffect(() => {
    if (openId && openId !== previouslyOpenRef.current) {
      previouslyOpenRef.current = openId;
      requestAnimationFrame(() => {
        viewerRef.current
          ?.querySelector<HTMLButtonElement>(".inspection-image-viewer__close")
          ?.focus({ preventScroll: true });
      });
    }
    if (!openId && previouslyOpenRef.current) {
      previouslyOpenRef.current = null;
    }
  }, [openId]);

  if (!openId || !current || currentIndex < 0) return null;

  function handleViewerKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeBy(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeBy(1);
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoomAndCenter(zoom + 0.5);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      setZoomAndCenter(zoom - 0.5);
      return;
    }
    if (event.key !== "Tab" || !viewerRef.current) return;
    const focusable = getFocusableElements(viewerRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const currentFocus = document.activeElement;
    const currentFocusIndex = focusable.indexOf(currentFocus as HTMLElement);
    const nextFocusIndex = event.shiftKey
      ? currentFocusIndex <= 0
        ? focusable.length - 1
        : currentFocusIndex - 1
      : currentFocusIndex === -1 || currentFocusIndex === focusable.length - 1
        ? 0
        : currentFocusIndex + 1;
    event.preventDefault();
    focusable[nextFocusIndex]?.focus({ preventScroll: true });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointerMapRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointerMapRef.current.size >= 2) {
      const points = [...pointerMapRef.current.values()];
      const first = points[0];
      const second = points[1];
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        startZoom: zoom,
        pinchDistance: getDistance(first, second),
        pinchZoom: zoom,
        pinchCenter: getCenter(first, second),
        moved: false,
      };
      return;
    }
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      startZoom: zoom,
      pinchDistance: null,
      pinchZoom: zoom,
      pinchCenter: null,
      moved: false,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = pointerMapRef.current.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    const gesture = gestureRef.current;
    if (!gesture) return;
    const points = [...pointerMapRef.current.values()];
    if (points.length >= 2 && gesture.pinchDistance) {
      const distance = getDistance(points[0], points[1]);
      gesture.moved = true;
      setZoomAndCenter(
        gesture.pinchZoom * (distance / Math.max(gesture.pinchDistance, 1)),
      );
      return;
    }
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (Math.hypot(deltaX, deltaY) > PAN_DISTANCE) gesture.moved = true;
    if (getInspectionImageGestureMode(zoom) === "pan") {
      setPan({
        x: gesture.startPanX + deltaX,
        y: gesture.startPanY + deltaY,
      });
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const point = pointerMapRef.current.get(event.pointerId);
    pointerMapRef.current.delete(event.pointerId);
    if (!gesture || !point) return;
    if (pointerMapRef.current.size > 0) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (
      getInspectionImageGestureMode(zoom) === "swipe" &&
      gesture.moved &&
      Math.abs(deltaX) >= SWIPE_DISTANCE &&
      Math.abs(deltaX) > Math.abs(deltaY) &&
      descriptors.length > 1
    ) {
      changeBy(deltaX < 0 ? 1 : -1);
    }
    gestureRef.current = null;
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    setZoomAndCenter(zoom + (event.deltaY < 0 ? 0.25 : -0.25));
  }

  return (
    <div
      ref={viewerRef}
      className="inspection-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer for ${current.alt}`}
      data-inspection-image-viewer="true"
      onKeyDown={handleViewerKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="inspection-image-viewer__toolbar">
        <p className="inspection-image-viewer__position" aria-live="polite">
          {currentIndex + 1} / {descriptors.length}
        </p>
        <div className="inspection-image-viewer__actions">
          <button
            className="inspection-image-viewer__control"
            type="button"
            onClick={() => setZoomAndCenter(zoom - 0.5)}
            disabled={zoom <= INSPECTION_IMAGE_MIN_ZOOM}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            className="inspection-image-viewer__control"
            type="button"
            onClick={() => setZoomAndCenter(zoom + 0.5)}
            disabled={zoom >= INSPECTION_IMAGE_MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="inspection-image-viewer__close"
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
      <div
        ref={stageRef}
        className="inspection-image-viewer__stage"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() =>
          setZoomAndCenter(
            zoom === INSPECTION_IMAGE_MIN_ZOOM
              ? 2
              : INSPECTION_IMAGE_MIN_ZOOM,
          )
        }
      >
        {currentIndex > 0 ? (
          <button
            className="inspection-image-viewer__nav inspection-image-viewer__nav--previous"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => changeBy(-1)}
            aria-label="Previous image"
          >
            ‹
          </button>
        ) : null}
        <div className="inspection-image-viewer__image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="inspection-image-viewer__image"
            src={current.src}
            alt={current.alt}
            width={imageWidth}
            height={imageHeight}
            draggable={false}
            style={{
              width: `${imageWidth * fitScale}px`,
              height: `${imageHeight * fitScale}px`,
              transform: `translate3d(${boundedPan.x}px, ${boundedPan.y}px, 0) scale(${zoom})`,
            }}
            onLoad={(event) => {
              const image = event.currentTarget;
              if (!current.width && image.naturalWidth > 0 && image.naturalHeight > 0) {
                setIntrinsicSize({ width: image.naturalWidth, height: image.naturalHeight });
              }
            }}
          />
        </div>
        {currentIndex < descriptors.length - 1 ? (
          <button
            className="inspection-image-viewer__nav inspection-image-viewer__nav--next"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => changeBy(1)}
            aria-label="Next image"
          >
            ›
          </button>
        ) : null}
      </div>
      {current.caption ? (
        <p className="inspection-image-viewer__caption">{current.caption}</p>
      ) : null}
    </div>
  );
}

export function InspectionImageViewerProvider({ children }: { children: ReactNode }) {
  const [registeredImages, setRegisteredImages] = useState(
    () => new Map<string, InspectionImageDescriptor>(),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const launcherRef = useRef<HTMLElement | null>(null);

  const registerImage = useCallback((descriptor: InspectionImageDescriptor) => {
    setRegisteredImages((current) => {
      const next = new Map(current);
      next.set(descriptor.id, descriptor);
      return next;
    });
  }, []);
  const unregisterImage = useCallback((id: string) => {
    setRegisteredImages((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
    setOpenId((current) => (current === id ? null : current));
  }, []);
  const openImage = useCallback((id: string, launcher: HTMLElement) => {
    launcherRef.current = launcher;
    setOpenId(id);
  }, []);
  const closeImage = useCallback(() => {
    setOpenId(null);
    requestAnimationFrame(() => {
      launcherRef.current?.focus({ preventScroll: true });
      launcherRef.current = null;
    });
  }, []);
  const openImageById = useCallback((id: string) => setOpenId(id), []);
  const descriptors = useMemo(
    () => sortInspectionImageSequence(registeredImages.values()),
    [registeredImages],
  );

  const contextValue = useMemo(
    () => ({ registerImage, unregisterImage, openImage }),
    [openImage, registerImage, unregisterImage],
  );

  return (
    <InspectionImageViewerContext.Provider value={contextValue}>
      {children}
      <InspectionImageViewer
        key={openId ?? "closed"}
        descriptors={descriptors}
        openId={openId}
        onClose={closeImage}
        onOpenImage={openImageById}
      />
    </InspectionImageViewerContext.Provider>
  );
}
