import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.js";
import { richSegmentSchema } from "./question-content.schema.js";

export const UNIVERSAL_QUESTION_FORMAT = "NIDUS_UNIVERSAL_QUESTION_V1";

export const universalQuestionTypeSchema = z.enum([
  "SINGLE_CHOICE", "MULTIPLE_CHOICE", "NUMERICAL", "TRUE_FALSE", "TEXT",
  "MATCHING", "SEQUENCE", "ASSERTION_REASON", "PASSAGE_CHILD", "CASE_CHILD",
  "DESCRIPTIVE", "FILE_RESPONSE",
]);

export const questionStructureSchema = z.enum([
  "STANDARD", "STATEMENT_COMBINATION", "MULTIPLE_STATEMENT", "ASSERTION_REASON",
  "MATCH_THE_FOLLOWING", "SEQUENCE", "PASSAGE_BASED", "CASE_BASED", "IMAGE_BASED",
  "GRAPH_BASED", "TABLE_BASED", "NUMERICAL", "FORMULA_BASED",
]);

const normalizedBoxSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
}).strict();

export const sourceEvidenceSchema = z.object({
  documentId: z.string().min(1).optional(),
  uploadId: z.string().min(1).optional(),
  importJobId: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  pageNumbers: z.array(z.number().int().positive()).default([]),
  boundingBoxes: z.array(normalizedBoxSchema).default([]),
  sourceText: z.string().optional(),
  assetIds: z.array(z.string().min(1)).default([]),
}).strict();

const contentTextSchema = z.object({
  text: z.string(),
  segments: z.array(richSegmentSchema).optional(),
}).strict();

const choiceSchema = z.object({
  id: z.string().min(1),
  content: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("paragraph"), text: z.string(), segments: z.array(richSegmentSchema).optional() }).strict(),
    z.object({ type: z.literal("formula"), latex: z.string().min(1), sourceText: z.string().optional(), displayMode: z.boolean().default(false) }).strict(),
    z.object({ type: z.literal("asset"), assetId: z.string().min(1), role: z.string().min(1), alt: z.string().optional() }).strict(),
  ])).min(1),
  sourceEvidence: sourceEvidenceSchema.optional(),
}).strict();

export const universalContentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), ...contentTextSchema.shape }).strict(),
  z.object({ type: z.literal("statementList"), items: z.array(contentTextSchema).min(1), ordered: z.boolean().default(true) }).strict(),
  z.object({ type: z.literal("formula"), latex: z.string().min(1), sourceText: z.string().optional(), displayMode: z.boolean().default(false) }).strict(),
  z.object({ type: z.literal("asset"), assetId: z.string().min(1), role: z.enum(["IMAGE", "DIAGRAM", "GRAPH", "TABLE", "EQUATION_IMAGE", "UNKNOWN_VISUAL"]), alt: z.string().optional() }).strict(),
  z.object({ type: z.literal("table"), rows: z.array(z.array(contentTextSchema).min(1)).min(1), caption: z.string().optional() }).strict(),
  z.object({ type: z.literal("passage"), ...contentTextSchema.shape, groupId: z.string().min(1).optional() }).strict(),
  z.object({ type: z.literal("case"), ...contentTextSchema.shape, groupId: z.string().min(1).optional() }).strict(),
  z.object({ type: z.literal("instruction"), ...contentTextSchema.shape }).strict(),
  z.object({ type: z.literal("matchingColumns"), left: z.array(contentTextSchema).min(1), right: z.array(contentTextSchema).min(1) }).strict(),
  z.object({ type: z.literal("sequence"), items: z.array(contentTextSchema).min(1) }).strict(),
  z.object({ type: z.literal("subquestion"), childQuestionId: z.string().min(1), label: z.string().optional() }).strict(),
]);

export const responseSpecSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SINGLE_CHOICE"), choiceIds: z.array(z.string().min(1)).min(2) }).strict(),
  z.object({ type: z.literal("MULTIPLE_CHOICE"), choiceIds: z.array(z.string().min(1)).min(2), minSelections: z.number().int().positive().default(1), maxSelections: z.number().int().positive().optional() }).strict(),
  z.object({ type: z.literal("NUMERICAL"), allowDecimal: z.boolean().default(true), unit: z.string().optional() }).strict(),
  z.object({ type: z.literal("TRUE_FALSE") }).strict(),
  z.object({ type: z.literal("TEXT"), caseSensitive: z.boolean().default(false) }).strict(),
  z.object({ type: z.literal("MATCHING"), leftIds: z.array(z.string().min(1)).min(1), rightIds: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ type: z.literal("SEQUENCE"), itemIds: z.array(z.string().min(1)).min(2) }).strict(),
  z.object({ type: z.literal("DESCRIPTIVE"), manualEvaluation: z.literal(true) }).strict(),
  z.object({ type: z.literal("FILE_RESPONSE"), manualEvaluation: z.literal(true), acceptedMimeTypes: z.array(z.string().min(1)).optional() }).strict(),
]);

export const evaluationSpecSchema = z.discriminatedUnion("strategy", [
  z.object({ strategy: z.literal("EXACT_OPTION"), correctChoiceId: z.string().min(1) }).strict(),
  z.object({ strategy: z.literal("OPTION_SET"), correctChoiceIds: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ strategy: z.literal("BOOLEAN"), value: z.boolean() }).strict(),
  z.object({ strategy: z.literal("NUMERIC_TOLERANCE"), value: z.number(), absoluteTolerance: z.number().nonnegative().default(0), relativeTolerance: z.number().nonnegative().default(0) }).strict(),
  z.object({ strategy: z.literal("TEXT_MATCH"), acceptedValues: z.array(z.string().min(1)).min(1), caseSensitive: z.boolean().default(false) }).strict(),
  z.object({ strategy: z.literal("PAIR_MATCH"), pairs: z.record(z.string(), z.string().min(1)) }).strict(),
  z.object({ strategy: z.literal("ORDERED"), itemIds: z.array(z.string().min(1)).min(2) }).strict(),
  z.object({ strategy: z.literal("MANUAL_RUBRIC"), rubric: z.string().optional() }).strict(),
  z.object({ strategy: z.literal("UNRESOLVED"), reason: z.string().min(1) }).strict(),
]);

export const extractionConfidenceSchema = z.object({
  boundaryConfidence: z.number().min(0).max(1).optional(),
  questionTypeConfidence: z.number().min(0).max(1).optional(),
  stemConfidence: z.number().min(0).max(1).optional(),
  optionConfidence: z.number().min(0).max(1).optional(),
  answerConfidence: z.number().min(0).max(1).optional(),
  mathConfidence: z.number().min(0).max(1).optional(),
  visualConfidence: z.number().min(0).max(1).optional(),
  sourceCompletenessConfidence: z.number().min(0).max(1).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one evidence-based confidence value is required");

export const universalReviewIssueSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  message: z.string().min(1),
  state: z.enum(["OPEN", "RESOLVED", "APPROVED_AS_IS"]).default("OPEN"),
  sourceEvidence: sourceEvidenceSchema.optional(),
}).strict();

export const universalQuestionSchema = z.object({
  schemaVersion: z.literal(1),
  format: z.literal(UNIVERSAL_QUESTION_FORMAT),
  displayOrder: z.number().int().positive(),
  sourceQuestionNumber: z.string().min(1).optional(),
  questionType: universalQuestionTypeSchema,
  questionStructure: questionStructureSchema,
  sectionId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  parentQuestionId: z.string().min(1).optional(),
  content: z.array(universalContentBlockSchema).min(1),
  choices: z.array(choiceSchema).default([]),
  responseSpec: responseSpecSchema,
  evaluationSpec: evaluationSpecSchema,
  sourceEvidence: sourceEvidenceSchema.optional(),
  extractionConfidence: extractionConfidenceSchema.optional(),
  reviewIssues: z.array(universalReviewIssueSchema).default([]),
}).strict().superRefine((question, context) => {
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ASSERTION_REASON"].includes(question.questionType) && question.choices.length < 2) {
    context.addIssue({ code: "custom", path: ["choices"], message: "Choice questions require at least two choices" });
  }
  if (question.responseSpec.type === "SINGLE_CHOICE" && !question.responseSpec.choiceIds.every((id) => question.choices.some((choice) => choice.id === id))) {
    context.addIssue({ code: "custom", path: ["responseSpec", "choiceIds"], message: "Response choices must reference canonical choices" });
  }
});

export type UniversalQuestion = z.infer<typeof universalQuestionSchema>;

export function legacySingleChoiceFoundation(input: {
  displayOrder: number;
  sourceQuestionNumber?: string | number;
  correctAnswer?: string;
  sourceDocumentId?: string;
  sourcePageNumber?: number;
}) {
  const correctChoiceId = String(input.correctAnswer ?? "").trim().toUpperCase();
  const responseSpec = responseSpecSchema.parse({ type: "SINGLE_CHOICE", choiceIds: ["A", "B", "C", "D"] });
  const evaluationSpec = evaluationSpecSchema.parse(/^[A-D]$/.test(correctChoiceId)
    ? { strategy: "EXACT_OPTION", correctChoiceId }
    : { strategy: "UNRESOLVED", reason: "Correct answer has not been confirmed." });
  const sourceEvidence = input.sourceDocumentId || input.sourcePageNumber
    ? sourceEvidenceSchema.parse({
      documentId: input.sourceDocumentId,
      pageNumbers: input.sourcePageNumber ? [input.sourcePageNumber] : [],
      boundingBoxes: [],
      assetIds: [],
    })
    : undefined;
  return {
    displayOrder: input.displayOrder,
    questionType: "SINGLE_CHOICE" as const,
    questionStructure: "STANDARD" as const,
    sourceQuestionNumber: input.sourceQuestionNumber == null ? undefined : String(input.sourceQuestionNumber),
    responseSpec: responseSpec as unknown as Prisma.InputJsonValue,
    evaluationSpec: evaluationSpec as unknown as Prisma.InputJsonValue,
    sourceEvidence: sourceEvidence as Prisma.InputJsonValue | undefined,
  };
}
