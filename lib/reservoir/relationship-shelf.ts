export const RELATIONSHIP_SHELF_ROW_COUNT = 4;

export function distributeRelationshipShelfItems<T>(
  items: readonly T[],
  rowCount = RELATIONSHIP_SHELF_ROW_COUNT,
) {
  if (!Number.isInteger(rowCount) || rowCount < 1) {
    throw new Error("Relationship shelf row count must be a positive integer.");
  }

  const rows = Array.from({ length: rowCount }, () => [] as T[]);
  items.forEach((item, index) => rows[index % rowCount].push(item));
  return rows;
}

export function getRelationshipShelfWheelDelta(
  event: Pick<WheelEvent, "deltaX" | "deltaY" | "deltaMode">,
  lineSize: number,
  pageSize: number,
) {
  const rawDelta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  const scale =
    event.deltaMode === 1 ? lineSize : event.deltaMode === 2 ? pageSize : 1;
  return rawDelta * scale;
}

export function canConsumeRelationshipShelfWheel(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  delta: number,
) {
  const maximum = Math.max(scrollWidth - clientWidth, 0);
  if (delta > 0) return scrollLeft < maximum - 0.5;
  if (delta < 0) return scrollLeft > 0.5;
  return false;
}
