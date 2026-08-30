import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";

export const NIDUS_QUESTION_CONTENT_FORMAT = "NIDUS_QUESTION_CONTENT_V1";

const coordinateSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).strict();

const sourceReferenceSchema = z.object({
  documentId: z.string().optional(),
  uploadId: z.string().optional(),
  importJobId: z.string().optional(),
  page: z.number().int().positive().optional(),
  coordinates: coordinateSchema.optional(),
  note: z.string().optional(),
}).strict();

const baseBlockSchema = z.object({
  id: z.string().min(1),
  sourceReference: sourceReferenceSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  reviewStatus: z.enum(["AUTO_APPROVED", "APPROVED", "NEEDS_REVIEW", "MANUAL_CORRECTION_REQUIRED"]).optional(),
}).strict();

/**
 * Version-1 inline content contract.  Math is explicit data, never inferred
 * by a consumer from an arbitrary text string.  The sourceText is retained so
 * later extractors can improve normalization without losing the source.
 */
export const mathOriginSchema = z.enum(["OMML", "EXPLICIT_LATEX", "UNICODE", "NORMALIZED_SOURCE", "OCR", "MANUAL"]);
export const mathConversionWarningSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
}).strict();
export type MathConversionWarning = z.infer<typeof mathConversionWarningSchema>;
const mathBoundingBoxSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).strict();
const safeSegmentText = z.string().refine((value) => !/<\/?[a-z][^>]*>/i.test(value), "HTML markup is not allowed in canonical content segments");
export const richSegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: safeSegmentText }).strict(),
  z.object({
    type: z.literal("math"),
    latex: z.string().min(1).refine((value) => !/<\/?[a-z][^>]*>/i.test(value), "HTML markup is not allowed in canonical content segments"),
    sourceText: safeSegmentText.optional(),
    confidence: z.number().min(0).max(1).optional(),
    origin: mathOriginSchema.optional(),
    warnings: z.array(mathConversionWarningSchema).optional(),
    boundingBox: mathBoundingBoxSchema.optional(),
  }).strict(),
]);

export type RichSegment = z.infer<typeof richSegmentSchema>;

const richSegmentsSchema = z.array(richSegmentSchema).min(1);

const paragraphBlockSchema = baseBlockSchema.extend({
  type: z.literal("paragraph"),
  text: z.string().min(1),
  segments: richSegmentsSchema.optional(),
});

const formulaBlockSchema = baseBlockSchema.extend({
  type: z.literal("formula"),
  latex: z.string().min(1),
  text: z.string().optional(),
  displayMode: z.boolean().default(false),
});

const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal("image"),
  url: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  assetRole: z.enum(["QUESTION_IMAGE", "DIAGRAM", "GRAPH", "CHART", "TABLE_IMAGE", "TEACHER_ATTACHED_VISUAL"]).default("QUESTION_IMAGE"),
});

const tableBlockSchema = baseBlockSchema.extend({
  type: z.literal("table"),
  rows: z.array(z.array(z.string())).min(1),
  caption: z.string().optional(),
});

const diagramBlockSchema = baseBlockSchema.extend({
  type: z.literal("diagram"),
  url: z.string().optional(),
  description: z.string().min(1),
  labels: z.array(z.string()).optional(),
});

const graphBlockSchema = baseBlockSchema.extend({
  type: z.literal("graph"),
  url: z.string().optional(),
  description: z.string().min(1),
  graphType: z.string().optional(),
});

const optionsBlockSchema = baseBlockSchema.extend({
  type: z.literal("options"),
  options: z.array(z.object({
    key: z.enum(["A", "B", "C", "D"]),
    // Imported drafts may preserve an option slot whose text could not be
    // reconstructed. The publishing/review gate remains responsible for
    // rejecting those blanks; accepting them here lets the director repair
    // the draft instead of losing the import to a serialization error.
    text: z.string(),
    latex: z.string().optional(),
    segments: richSegmentsSchema.optional(),
    sourceReference: sourceReferenceSchema.optional(),
  }).strict()).length(4),
});

const explanationBlockSchema = baseBlockSchema.extend({
  type: z.literal("explanation"),
  text: z.string().min(1),
  latex: z.string().optional(),
  segments: richSegmentsSchema.optional(),
});

// Visual evidence extracted from a source document. The URL is optional while
// an import is pending storage; retaining the page/box still lets Build &
// Review explain exactly which source region needs confirmation.
const visualBlockSchema = baseBlockSchema.extend({
  type: z.literal("visual"),
  assetId: z.string().min(1),
  assetUrl: z.string().url().optional(),
  assetRole: z.enum(["DIAGRAM", "GRAPH", "FIGURE", "TABLE", "EQUATION_IMAGE", "UNKNOWN_VISUAL"]).default("UNKNOWN_VISUAL"),
  pageNumber: z.number().int().positive(),
  boundingBox: mathBoundingBoxSchema,
  reviewRequired: z.boolean().default(false),
});

export const questionContentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  formulaBlockSchema,
  imageBlockSchema,
  visualBlockSchema,
  tableBlockSchema,
  diagramBlockSchema,
  graphBlockSchema,
  optionsBlockSchema,
  explanationBlockSchema,
]);

export const questionContentSchema = z.object({
  schemaVersion: z.literal(1),
  format: z.literal(NIDUS_QUESTION_CONTENT_FORMAT),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_ANSWER", "NUMERICAL", "FILL_BLANK", "ASSERTION_REASON", "CASE_STUDY", "MATCHING", "DIAGRAM_LABEL", "FILE_UPLOAD"]).default("SINGLE_CHOICE"),
  source: z.enum(["TEACHER_IMPORT", "AI_IMPORT", "LEGACY_MIGRATION", "MANUAL_ENTRY"]),
  blocks: z.array(questionContentBlockSchema).min(2),
  answer: z.object({
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_ANSWER", "NUMERICAL", "TEXT"]),
    correctOption: z.enum(["A", "B", "C", "D"]).optional(),
    correctOptions: z.array(z.enum(["A", "B", "C", "D"])).optional(),
    value: z.string().optional(),
  }).strict(),
  sourceReferences: z.array(sourceReferenceSchema).default([]),
  metadata: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.string().optional(),
    marks: z.number().optional(),
    negativeMarks: z.number().optional(),
    importJobId: z.string().nullable().optional(),
    uploadId: z.string().nullable().optional(),
    // Historical/imported questions may persist an unknown confidence as
    // JSON null. Treat that as absent rather than making an otherwise valid
    // Director edit impossible to save.
    aiConfidence: z.preprocess(
      (value) => value === null ? undefined : value,
      z.number().min(0).max(1).optional(),
    ),
    reviewStatus: z.string().optional(),
  }).passthrough().default({}),
}).strict();

export type QuestionContent = z.infer<typeof questionContentSchema>;

export type MathSegmentHint = {
  sourceText: string;
  /** Internal match token used by extractors; never exposed in the segment. */
  matchText?: string;
  latex: string;
  origin?: z.infer<typeof mathOriginSchema>;
  confidence?: number;
  warnings?: MathConversionWarning[];
  boundingBox?: z.infer<typeof mathBoundingBoxSchema>;
};

const explicitMathPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

function stripMathDelimiters(value: string) {
  if (value.startsWith("$$") && value.endsWith("$$")) return value.slice(2, -2).trim();
  if (value.startsWith("\\[") && value.endsWith("\\]")) return value.slice(2, -2).trim();
  if (value.startsWith("\\(") && value.endsWith("\\)")) return value.slice(2, -2).trim();
  if (value.startsWith("$") && value.endsWith("$")) return value.slice(1, -1).trim();
  return value.trim();
}

/** Build segments only from explicit delimiters or trusted extractor hints. */
export function buildRichSegments(value: string, hints: MathSegmentHint[] = []): RichSegment[] {
  const source = String(value ?? "");
  const trusted = hints.filter((hint) => hint.sourceText && hint.latex);
  const tokens: Array<{ start: number; end: number; segment: RichSegment }> = [];
  for (const match of source.matchAll(explicitMathPattern)) {
    const raw = match[0];
    const start = match.index ?? 0;
    tokens.push({ start, end: start + raw.length, segment: { type: "math", latex: stripMathDelimiters(raw), sourceText: raw, origin: "EXPLICIT_LATEX" } });
  }
  for (const hint of trusted) {
    const matchText = hint.matchText || hint.sourceText;
    let cursor = 0;
    while (cursor < source.length) {
      const start = source.indexOf(matchText, cursor);
      if (start < 0) break;
      tokens.push({ start, end: start + matchText.length, segment: { type: "math", latex: hint.latex, sourceText: hint.sourceText, origin: hint.origin, confidence: hint.confidence, warnings: hint.warnings, boundingBox: hint.boundingBox } });
      cursor = start + matchText.length;
    }
  }
  const ordered = tokens.filter((token, index) => tokens.findIndex((candidate) => candidate.start === token.start && candidate.end === token.end) === index).sort((a, b) => a.start - b.start || a.end - b.end);
  const segments: RichSegment[] = [];
  let cursor = 0;
  for (const token of ordered) {
    if (token.start < cursor) continue;
    if (token.start > cursor) segments.push({ type: "text", text: source.slice(cursor, token.start) });
    segments.push(token.segment);
    cursor = token.end;
  }
  if (cursor < source.length || !segments.length) segments.push({ type: "text", text: source.slice(cursor) });
  return segments;
}

function structuredSegments(value: string, hints: MathSegmentHint[] = []) {
  const segments = buildRichSegments(value, hints);
  return segments.some((segment) => segment.type === "math") ? segments : undefined;
}

function blockId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function buildLegacyQuestionContent(question: {
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  topic?: string;
  difficultyLevel?: string;
  marks?: number;
  negativeMarks?: number;
  sourceDocumentId?: string;
  aiConfidence?: number;
  reviewStatus?: string;
  mathSegments?: {
    question?: MathSegmentHint[];
    optionA?: MathSegmentHint[];
    optionB?: MathSegmentHint[];
    optionC?: MathSegmentHint[];
    optionD?: MathSegmentHint[];
    explanation?: MathSegmentHint[];
  };
  visualAssets?: Array<{
    id: string;
    assetUrl?: string;
    sourceType: "DIAGRAM" | "GRAPH" | "FIGURE" | "TABLE" | "EQUATION_IMAGE" | "UNKNOWN_VISUAL";
    pageNumber: number;
    boundingBox: { page: number; x: number; y: number; width: number; height: number };
    confidence?: number;
    reviewRequired?: boolean;
    sourceReference?: string;
  }>;
  ocrReviewRequired?: boolean;
  ocrReviewNotes?: string[];
  ocrConfidence?: number | null;
  contentSource?: "TEACHER_IMPORT" | "AI_IMPORT" | "LEGACY_MIGRATION" | "MANUAL_ENTRY";
}): QuestionContent {
  const sourceReference = question.sourceDocumentId ? { documentId: question.sourceDocumentId } : undefined;
  const correctOption = String(question.correctAnswer ?? "").trim().toUpperCase();
  const math = question.mathSegments;
  const visualAssets = question.visualAssets || [];
  const blocks: QuestionContent["blocks"] = [
    { id: blockId("paragraph", 0), type: "paragraph", text: question.questionText, ...(structuredSegments(question.questionText, math?.question) ? { segments: structuredSegments(question.questionText, math?.question) } : {}), sourceReference },
    ...(question.questionImage ? [{ id: blockId("image", 0), type: "image" as const, url: question.questionImage, assetRole: "QUESTION_IMAGE" as const, sourceReference }] : []),
    ...visualAssets.map((asset, index) => ({
      id: blockId("visual", index),
      type: "visual" as const,
      assetId: asset.id,
      ...(asset.assetUrl ? { assetUrl: asset.assetUrl } : {}),
      assetRole: asset.sourceType,
      pageNumber: asset.pageNumber,
      boundingBox: asset.boundingBox,
      ...(asset.sourceReference ? { sourceReference: { ...sourceReference, note: asset.sourceReference } } : sourceReference ? { sourceReference } : {}),
      confidence: asset.confidence,
      reviewRequired: Boolean(asset.reviewRequired),
    })),
    {
      id: blockId("options", 0),
      type: "options",
      options: [
        { key: "A", text: question.optionA, ...(structuredSegments(question.optionA, math?.optionA) ? { segments: structuredSegments(question.optionA, math?.optionA) } : {}) },
        { key: "B", text: question.optionB, ...(structuredSegments(question.optionB, math?.optionB) ? { segments: structuredSegments(question.optionB, math?.optionB) } : {}) },
        { key: "C", text: question.optionC, ...(structuredSegments(question.optionC, math?.optionC) ? { segments: structuredSegments(question.optionC, math?.optionC) } : {}) },
        { key: "D", text: question.optionD, ...(structuredSegments(question.optionD, math?.optionD) ? { segments: structuredSegments(question.optionD, math?.optionD) } : {}) },
      ],
    },
    ...(question.explanation?.trim() ? [{ id: blockId("explanation", 0), type: "explanation" as const, text: question.explanation, ...(structuredSegments(question.explanation, math?.explanation) ? { segments: structuredSegments(question.explanation, math?.explanation) } : {}) }] : []),
  ];

  return questionContentSchema.parse({
    schemaVersion: 1,
    format: NIDUS_QUESTION_CONTENT_FORMAT,
    questionType: "SINGLE_CHOICE",
    source: question.contentSource || "LEGACY_MIGRATION",
    blocks,
    answer: {
      type: "SINGLE_CHOICE",
      ...(/^[A-D]$/.test(correctOption) ? { correctOption } : {}),
    },
    sourceReferences: sourceReference ? [sourceReference] : [],
    metadata: {
      topic: question.topic,
      difficulty: question.difficultyLevel,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      aiConfidence: question.aiConfidence,
      reviewStatus: question.reviewStatus,
      ...(question.ocrReviewRequired ? { ocrReviewRequired: true } : {}),
      ...(question.ocrReviewNotes?.length ? { ocrReviewNotes: question.ocrReviewNotes } : {}),
      ...(question.ocrConfidence != null ? { ocrConfidence: question.ocrConfidence } : {}),
    },
  });
}

export function parseQuestionContentJson(value: unknown) {
  return questionContentSchema.safeParse(value);
}

export function normalizeQuestionContentJson(question: Parameters<typeof buildLegacyQuestionContent>[0] & { contentJson?: unknown }): Prisma.InputJsonValue {
  if (question.contentJson) {
    const parsed = parseQuestionContentJson(question.contentJson);
    if (parsed.success) return parsed.data as Prisma.InputJsonValue;
    throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".") || "contentJson"}: ${issue.message}`).join("; "));
  }
  return buildLegacyQuestionContent(question) as Prisma.InputJsonValue;
}

export function synchronizeEditableQuestionContentJson(question: Parameters<typeof buildLegacyQuestionContent>[0] & { contentJson?: unknown }): Prisma.InputJsonValue {
  if (!question.contentJson) return buildLegacyQuestionContent(question) as Prisma.InputJsonValue;
  const parsed = parseQuestionContentJson(question.contentJson);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".") || "contentJson"}: ${issue.message}`).join("; "));
  }
  if (parsed.data.questionType !== "SINGLE_CHOICE") {
    throw Object.assign(new Error("Only single-choice structured questions can be edited in this exam editor."), { statusCode: 400 });
  }

  const explanation = question.explanation?.trim() || "";
  const correctOption = question.correctAnswer.trim().toUpperCase();
  let paragraphUpdated = false;
  let optionsUpdated = false;
  let explanationUpdated = false;
  const blocks: QuestionContent["blocks"] = [];

  for (const block of parsed.data.blocks) {
    if (block.type === "paragraph" && !paragraphUpdated) {
      const segments = question.questionText === block.text ? block.segments : structuredSegments(question.questionText, question.mathSegments?.question);
      blocks.push({ ...block, text: question.questionText, ...(segments ? { segments } : {}) });
      paragraphUpdated = true;
    } else if (block.type === "options" && !optionsUpdated) {
      blocks.push({
        ...block,
        options: [
          { ...block.options[0], key: "A", text: question.optionA, ...(question.optionA === block.options[0].text ? (block.options[0].segments ? { segments: block.options[0].segments } : {}) : (structuredSegments(question.optionA, question.mathSegments?.optionA) ? { segments: structuredSegments(question.optionA, question.mathSegments?.optionA) } : {})) },
          { ...block.options[1], key: "B", text: question.optionB, ...(question.optionB === block.options[1].text ? (block.options[1].segments ? { segments: block.options[1].segments } : {}) : (structuredSegments(question.optionB, question.mathSegments?.optionB) ? { segments: structuredSegments(question.optionB, question.mathSegments?.optionB) } : {})) },
          { ...block.options[2], key: "C", text: question.optionC, ...(question.optionC === block.options[2].text ? (block.options[2].segments ? { segments: block.options[2].segments } : {}) : (structuredSegments(question.optionC, question.mathSegments?.optionC) ? { segments: structuredSegments(question.optionC, question.mathSegments?.optionC) } : {})) },
          { ...block.options[3], key: "D", text: question.optionD, ...(question.optionD === block.options[3].text ? (block.options[3].segments ? { segments: block.options[3].segments } : {}) : (structuredSegments(question.optionD, question.mathSegments?.optionD) ? { segments: structuredSegments(question.optionD, question.mathSegments?.optionD) } : {})) },
        ],
      });
      optionsUpdated = true;
    } else if (block.type === "explanation") {
      if (explanation && !explanationUpdated) {
        const segments = explanation === block.text ? block.segments : structuredSegments(explanation, question.mathSegments?.explanation);
        blocks.push({ ...block, text: explanation, ...(segments ? { segments } : {}) });
        explanationUpdated = true;
      }
    } else {
      blocks.push(block);
    }
  }

  if (!paragraphUpdated) blocks.unshift({ id: "paragraph-edit-1", type: "paragraph", text: question.questionText, ...(structuredSegments(question.questionText, question.mathSegments?.question) ? { segments: structuredSegments(question.questionText, question.mathSegments?.question) } : {}) });
  if (!optionsUpdated) blocks.push({
    id: "options-edit-1",
    type: "options",
    options: [
      { key: "A", text: question.optionA, ...(structuredSegments(question.optionA, question.mathSegments?.optionA) ? { segments: structuredSegments(question.optionA, question.mathSegments?.optionA) } : {}) },
      { key: "B", text: question.optionB, ...(structuredSegments(question.optionB, question.mathSegments?.optionB) ? { segments: structuredSegments(question.optionB, question.mathSegments?.optionB) } : {}) },
      { key: "C", text: question.optionC, ...(structuredSegments(question.optionC, question.mathSegments?.optionC) ? { segments: structuredSegments(question.optionC, question.mathSegments?.optionC) } : {}) },
      { key: "D", text: question.optionD, ...(structuredSegments(question.optionD, question.mathSegments?.optionD) ? { segments: structuredSegments(question.optionD, question.mathSegments?.optionD) } : {}) },
    ],
  });
  if (explanation && !explanationUpdated) blocks.push({ id: "explanation-edit-1", type: "explanation", text: explanation, ...(structuredSegments(explanation, question.mathSegments?.explanation) ? { segments: structuredSegments(explanation, question.mathSegments?.explanation) } : {}) });

  return questionContentSchema.parse({
    ...parsed.data,
    blocks,
    answer: {
      type: "SINGLE_CHOICE",
      ...(/^[A-D]$/.test(correctOption) ? { correctOption } : {}),
    },
    metadata: {
      ...parsed.data.metadata,
      topic: question.topic,
      difficulty: question.difficultyLevel,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      aiConfidence: question.aiConfidence,
      reviewStatus: question.reviewStatus,
      ...(question.ocrReviewRequired ? { ocrReviewRequired: true } : {}),
      ...(question.ocrReviewNotes?.length ? { ocrReviewNotes: question.ocrReviewNotes } : {}),
      ...(question.ocrConfidence != null ? { ocrConfidence: question.ocrConfidence } : {}),
    },
  }) as Prisma.InputJsonValue;
}
