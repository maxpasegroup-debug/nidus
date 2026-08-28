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

const paragraphBlockSchema = baseBlockSchema.extend({
  type: z.literal("paragraph"),
  text: z.string().min(1),
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
    sourceReference: sourceReferenceSchema.optional(),
  }).strict()).length(4),
});

const explanationBlockSchema = baseBlockSchema.extend({
  type: z.literal("explanation"),
  text: z.string().min(1),
  latex: z.string().optional(),
});

export const questionContentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  formulaBlockSchema,
  imageBlockSchema,
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
    aiConfidence: z.number().min(0).max(1).optional(),
    reviewStatus: z.string().optional(),
  }).passthrough().default({}),
}).strict();

export type QuestionContent = z.infer<typeof questionContentSchema>;

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
}): QuestionContent {
  const sourceReference = question.sourceDocumentId ? { documentId: question.sourceDocumentId } : undefined;
  const correctOption = String(question.correctAnswer ?? "").trim().toUpperCase();
  const blocks: QuestionContent["blocks"] = [
    { id: blockId("paragraph", 0), type: "paragraph", text: question.questionText, sourceReference },
    ...(question.questionImage ? [{ id: blockId("image", 0), type: "image" as const, url: question.questionImage, assetRole: "QUESTION_IMAGE" as const, sourceReference }] : []),
    {
      id: blockId("options", 0),
      type: "options",
      options: [
        { key: "A", text: question.optionA },
        { key: "B", text: question.optionB },
        { key: "C", text: question.optionC },
        { key: "D", text: question.optionD },
      ],
    },
    ...(question.explanation?.trim() ? [{ id: blockId("explanation", 0), type: "explanation" as const, text: question.explanation }] : []),
  ];

  return questionContentSchema.parse({
    schemaVersion: 1,
    format: NIDUS_QUESTION_CONTENT_FORMAT,
    questionType: "SINGLE_CHOICE",
    source: "LEGACY_MIGRATION",
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
      blocks.push({ ...block, text: question.questionText });
      paragraphUpdated = true;
    } else if (block.type === "options" && !optionsUpdated) {
      blocks.push({
        ...block,
        options: [
          { ...block.options[0], key: "A", text: question.optionA },
          { ...block.options[1], key: "B", text: question.optionB },
          { ...block.options[2], key: "C", text: question.optionC },
          { ...block.options[3], key: "D", text: question.optionD },
        ],
      });
      optionsUpdated = true;
    } else if (block.type === "explanation") {
      if (explanation && !explanationUpdated) {
        blocks.push({ ...block, text: explanation });
        explanationUpdated = true;
      }
    } else {
      blocks.push(block);
    }
  }

  if (!paragraphUpdated) blocks.unshift({ id: "paragraph-edit-1", type: "paragraph", text: question.questionText });
  if (!optionsUpdated) blocks.push({
    id: "options-edit-1",
    type: "options",
    options: [
      { key: "A", text: question.optionA },
      { key: "B", text: question.optionB },
      { key: "C", text: question.optionC },
      { key: "D", text: question.optionD },
    ],
  });
  if (explanation && !explanationUpdated) blocks.push({ id: "explanation-edit-1", type: "explanation", text: explanation });

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
    },
  }) as Prisma.InputJsonValue;
}
