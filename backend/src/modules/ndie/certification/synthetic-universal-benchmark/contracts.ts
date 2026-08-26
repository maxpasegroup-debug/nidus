import { z } from "zod";
import { UNIVERSAL_SUBJECTS } from "../../universal-specification/universal-exam-engine.spec.js";

export const SYNTHETIC_BENCHMARK_VERSION = "nuee-synthetic-universal-benchmark-1.0.0" as const;
export const SYNTHETIC_BENCHMARK_SOURCE_TYPE = "SYNTHETIC_BENCHMARK" as const;

export const BENCHMARK_DOMAINS = [
  "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ENGLISH", "UNIVERSAL_ASSESSMENT",
  "FORMULA_RECOGNITION", "VISUAL_RECOGNITION", "DOCUMENT_LAYOUT", "ANSWER_MAPPING", "FAILURE_HANDLING"
] as const;

export const BENCHMARK_QUESTION_TYPES = [
  "SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "NUMERICAL", "INTEGER", "TRUE_FALSE", "FILL_BLANK",
  "ASSERTION_REASON", "MATCHING", "ORDERING", "SHORT_ANSWER", "LONG_ANSWER", "DESCRIPTIVE", "PASSAGE",
  "CASE_STUDY", "MULTI_PART", "DIAGRAM_BASED", "GRAPH_BASED", "TABLE_BASED", "IMAGE_BASED", "HOTSPOT",
  "PROGRAMMING", "DRAWING", "FILE_RESPONSE", "VOICE_RESPONSE", "UNKNOWN_FUTURE"
] as const;

export const BENCHMARK_DIFFICULTIES = ["FOUNDATIONAL", "STANDARD", "ADVANCED", "OLYMPIAD", "ADVERSARIAL"] as const;
export const BENCHMARK_LAYOUT_TYPES = [
  "SINGLE_COLUMN", "TWO_COLUMN", "THREE_COLUMN", "MIXED_COLUMN", "HEADER_FOOTER", "PAGE_NUMBERS", "FOOTNOTES",
  "CAPTIONS", "TABLES", "FLOATING_FIGURES", "SIDE_BY_SIDE_OPTIONS", "ROTATED_CONTENT", "SKEWED_SCAN",
  "LOW_QUALITY_SCAN", "MOBILE_PHOTOGRAPH", "PAGE_BREAK", "MULTI_PAGE_QUESTION", "MULTI_PAGE_TABLE",
  "MULTI_PAGE_PASSAGE", "MIXED_QUESTION_FORMATS"
] as const;

const boundingBoxSchema = z.object({ page: z.number().int().positive(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) });

const formulaExpectationSchema = z.object({
  formulaId: z.string().min(1), structureType: z.string().min(1), originalExpression: z.string().min(1), latex: z.string().min(1),
  mathML: z.string().min(1).nullable(), semanticRepresentation: z.record(z.string(), z.unknown()), plainTextFallback: z.string().min(1),
  renderingExpectation: z.enum(["INLINE", "DISPLAY", "MULTILINE", "SOURCE_CROP_FALLBACK"])
});

const visualExpectationSchema = z.object({
  visualId: z.string().min(1), boundingBox: boundingBoxSchema, objectType: z.string().min(1), labels: z.array(z.string()),
  relationships: z.array(z.object({ type: z.string().min(1), targetId: z.string().min(1) })), expectedCrop: z.object({ required: z.boolean(), description: z.string().min(1) }),
  expectedReadingOrder: z.number().int().nonnegative()
});

export const syntheticBenchmarkCaseSchema = z.object({
  schemaVersion: z.literal(SYNTHETIC_BENCHMARK_VERSION),
  benchmarkId: z.string().regex(/^sub-v1-[a-z0-9-]+-\d{4}$/),
  sourceType: z.literal(SYNTHETIC_BENCHMARK_SOURCE_TYPE),
  certificationContribution: z.literal(false),
  benchmarkDomain: z.enum(BENCHMARK_DOMAINS),
  subject: z.enum(UNIVERSAL_SUBJECTS),
  topic: z.string().min(1),
  difficulty: z.enum(BENCHMARK_DIFFICULTIES),
  questionType: z.enum(BENCHMARK_QUESTION_TYPES),
  inputRepresentation: z.object({
    format: z.enum(["STRUCTURED_TEXT", "SYNTHETIC_PAGE_MODEL", "SYNTHETIC_IMAGE_MODEL", "CORRUPT_BINARY_MODEL"]),
    content: z.string(), layoutType: z.enum(BENCHMARK_LAYOUT_TYPES), languageCodes: z.array(z.string().min(2)).min(1),
    pageCount: z.number().int().nonnegative(), features: z.array(z.string()), degradation: z.array(z.string())
  }),
  expectedQuestionStructure: z.object({
    questionId: z.string().min(1), stem: z.string(), optionIds: z.array(z.string()), childQuestionIds: z.array(z.string()),
    sourcePages: z.array(z.number().int().positive()), preserveIncompleteContent: z.boolean()
  }),
  expectedFormula: z.array(formulaExpectationSchema),
  expectedMathML: z.array(z.string()),
  expectedVisualStructure: z.array(visualExpectationSchema),
  expectedAnswer: z.object({ answerId: z.string().min(1), kind: z.string().min(1), value: z.unknown(), tolerance: z.number().nonnegative().nullable(), unit: z.string().nullable(), status: z.enum(["KNOWN", "MISSING", "CONFLICTING", "MANUAL_REVIEW"]) }).nullable(),
  expectedSolution: z.object({ solutionId: z.string().min(1), kind: z.string().min(1), steps: z.array(z.string()), status: z.enum(["KNOWN", "MISSING", "MANUAL_REVIEW"]) }).nullable(),
  expectedRelationships: z.array(z.object({ relationshipId: z.string().min(1), sourceId: z.string().min(1), targetId: z.string().min(1), type: z.string().min(1), required: z.boolean() })),
  expectedReadingOrder: z.array(z.string()),
  expectedConfidenceRules: z.object({ minimum: z.number().min(0).max(1), maximum: z.number().min(0).max(1), requiredReasons: z.array(z.string()), outcome: z.enum(["AUTO_CONTINUE", "NEEDS_REVIEW", "BLOCK"]), neverInvent: z.literal(true) }),
  expectedFailureMode: z.object({ code: z.string().min(1), disposition: z.enum(["PRESERVE_AND_REVIEW", "BLOCK"]), preserveOriginal: z.literal(true), inventedContentAllowed: z.literal(false) }).nullable()
}).superRefine((benchmarkCase, context) => {
  if (benchmarkCase.expectedConfidenceRules.minimum > benchmarkCase.expectedConfidenceRules.maximum) context.addIssue({ code: "custom", message: "Confidence minimum cannot exceed maximum." });
  if (benchmarkCase.expectedMathML.length !== benchmarkCase.expectedFormula.filter((formula) => formula.mathML !== null).length) context.addIssue({ code: "custom", message: "Expected MathML must mirror formula MathML entries." });
  if (benchmarkCase.expectedFailureMode && benchmarkCase.expectedConfidenceRules.outcome === "AUTO_CONTINUE") context.addIssue({ code: "custom", message: "Failure cases cannot auto-continue." });
});

export type SyntheticBenchmarkCase = z.infer<typeof syntheticBenchmarkCaseSchema>;
export type BenchmarkDomain = typeof BENCHMARK_DOMAINS[number];
export type BenchmarkQuestionType = typeof BENCHMARK_QUESTION_TYPES[number];
export type BenchmarkLayoutType = typeof BENCHMARK_LAYOUT_TYPES[number];

