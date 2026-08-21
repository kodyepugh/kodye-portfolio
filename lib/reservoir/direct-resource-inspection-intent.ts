export type DirectResourceInspectionIntent = {
  resourceId: string;
  queryContextKey: string;
  queryRevision: number;
};

export function createDirectResourceInspectionIntent(
  resourceId: string,
  queryContextKey: string,
  queryRevision: number,
): DirectResourceInspectionIntent {
  return { resourceId, queryContextKey, queryRevision };
}

export function canConsumeDirectResourceInspectionIntent(
  intent: DirectResourceInspectionIntent,
  settledContextKey: string,
  currentQueryRevision: number,
  resultIds: readonly string[],
) {
  return (
    intent.queryRevision === currentQueryRevision &&
    intent.queryContextKey === settledContextKey &&
    resultIds.length === 1 &&
    resultIds[0] === intent.resourceId
  );
}

export function isDirectResourceInspectionIntentStale(
  intent: DirectResourceInspectionIntent,
  settledContextKey: string,
  currentQueryRevision: number,
) {
  return (
    intent.queryRevision !== currentQueryRevision ||
    intent.queryContextKey !== settledContextKey
  );
}
