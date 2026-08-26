import { createHash } from "node:crypto";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, canonical(item)]));
}

function stableSourceMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const coordinates = source.coordinates && typeof source.coordinates === "object" && !Array.isArray(source.coordinates)
    ? source.coordinates as Record<string, unknown>
    : {};
  const normalized = coordinates.normalized && typeof coordinates.normalized === "object" && !Array.isArray(coordinates.normalized)
    ? coordinates.normalized as Record<string, unknown>
    : coordinates;
  const numeric = (key: string) => typeof normalized[key] === "number" ? Number(Number(normalized[key]).toFixed(6)) : null;
  return {
    firstPage: typeof source.firstPage === "number" ? source.firstPage : null,
    lastPage: typeof source.lastPage === "number" ? source.lastPage : null,
    page: typeof coordinates.page === "number" ? coordinates.page : null,
    coordinates: { x: numeric("x"), y: numeric("y"), width: numeric("width"), height: numeric("height") }
  };
}

export function ndieQuestionSourceFingerprint(input: {
  sourceElementIds?: string[];
  sourceMap?: unknown;
  normalizedQuestionId?: string | null;
  sectionId?: string | null;
  questionNumber?: string | null;
  text?: string | null;
}) {
  const sourceMap = stableSourceMap(input.sourceMap);
  const hasSpatialSource = Boolean(sourceMap && (sourceMap.firstPage !== null || sourceMap.page !== null));
  const hasStableSource = Boolean(input.normalizedQuestionId || hasSpatialSource || input.sourceElementIds?.length);
  const sourceIdentity = {
    sourceElementIds: input.normalizedQuestionId || hasSpatialSource ? [] : [...new Set(input.sourceElementIds ?? [])].sort(),
    sourceMap: canonical(sourceMap),
    normalizedQuestionId: input.normalizedQuestionId ?? null,
    sectionId: input.sectionId ?? null,
    questionNumber: input.questionNumber ?? null,
    textFallback: hasStableSource ? null : String(input.text ?? "").replace(/\s+/g, " ").trim()
  };
  return createHash("sha256").update(JSON.stringify(sourceIdentity)).digest("hex");
}
