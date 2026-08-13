import { useEffect, useRef } from "react";

const HOVER_EXIT_GRACE_MS = 140;

export function useReservoirNodeHover(
  nodeId: string,
  onHoverChange: (nodeId: string, hovered: boolean) => void,
) {
  const hoverExitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTargets = useRef(new Set<string>());

  useEffect(
    () => () => {
      if (hoverExitTimeout.current) clearTimeout(hoverExitTimeout.current);
      hoverTargets.current.clear();
    },
    [],
  );

  function beginHover(target: string) {
    hoverTargets.current.add(target);
    if (hoverExitTimeout.current) {
      clearTimeout(hoverExitTimeout.current);
      hoverExitTimeout.current = null;
    }
    onHoverChange(nodeId, true);
  }

  function endHover(target: string) {
    hoverTargets.current.delete(target);
    if (hoverTargets.current.size > 0) return;
    if (hoverExitTimeout.current) clearTimeout(hoverExitTimeout.current);
    hoverExitTimeout.current = setTimeout(() => {
      hoverExitTimeout.current = null;
      if (hoverTargets.current.size > 0) return;
      onHoverChange(nodeId, false);
    }, HOVER_EXIT_GRACE_MS);
  }

  return { beginHover, endHover };
}
