import { z } from "zod";
import { CERTIFICATION_CLASSES, UNIVERSAL_DOCUMENT_TYPES, UNIVERSAL_QUESTION_TYPES, UNIVERSAL_SUBJECTS } from "../../universal-specification/universal-exam-engine.spec.js";

export const CORPUS_PARTITIONS = ["DEVELOPMENT", "VALIDATION", "BLIND_CERTIFICATION"] as const;
export const EVIDENCE_CLASSES = ["REAL", "DEVELOPMENT_FIXTURE"] as const;

const coordinateSchema = z.object({ page: z.number().int().positive(), x: z.number().min(0), y: z.number().min(0), width: z.number().nonnegative(), height: z.number().nonnegative(), rotation: z.number().optional() });

export const seedCorpusManifestSchema = z.object({
  schemaVersion: z.literal("nuee-seed-manifest-1.0.0"),
  documentId: z.string().min(1),
  partition: z.enum(CORPUS_PARTITIONS),
  evidenceClass: z.enum(EVIDENCE_CLASSES),
  source: z.object({
    relativePath: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/),
    rightsBasis: z.enum(["INSTITUTION_OWNED", "TEACHER_PROVIDED_WITH_CONSENT", "PUBLICLY_LICENSED", "LEGACY_OWNED"]),
    anonymized: z.boolean(), collectedAt: z.string().datetime()
  }),
  subject: z.enum(UNIVERSAL_SUBJECTS),
  examType: z.string().min(1),
  documentType: z.enum(UNIVERSAL_DOCUMENT_TYPES),
  languageCodes: z.array(z.string().min(2)).min(1),
  pageCount: z.number().int().positive(),
  expectedQuestionCount: z.number().int().nonnegative().nullable(),
  difficultyTags: z.array(z.string()),
  riskTags: z.array(z.enum(["MULTI_COLUMN", "LOW_QUALITY", "ROTATED", "HANDWRITTEN", "FORMULA_HEAVY", "DIAGRAM_HEAVY", "GRAPH_HEAVY", "TABLE_HEAVY", "MULTI_PAGE_QUESTION", "MIXED_QUESTION_TYPES", "MOBILE_PHOTO", "OFFICE_MATH", "ANSWER_KEY", "SOLUTION_DOCUMENT", "MIXED_DOCUMENT"])),
  annotation: z.object({ status: z.enum(["NOT_STARTED", "IN_PROGRESS", "EXPERT_VERIFIED", "ADJUDICATED"]), expectedPath: z.string().min(1), expertCount: z.number().int().nonnegative(), agreement: z.number().min(0).max(1).nullable() })
}).superRefine((manifest, context) => {
  if (manifest.partition === "BLIND_CERTIFICATION" && manifest.annotation.expectedPath.includes("processing-input")) context.addIssue({ code: "custom", message: "Blind expected outputs must not be placed in processing-input paths." });
  if (manifest.evidenceClass === "REAL" && manifest.annotation.status === "EXPERT_VERIFIED" && manifest.annotation.expertCount < 2) context.addIssue({ code: "custom", message: "Real expert-verified evidence requires at least two experts." });
});

const annotatedObjectSchema = z.object({ id: z.string().min(1), type: z.string().min(1), sourceReferences: z.array(coordinateSchema).min(1), expectedRepresentation: z.record(z.string(), z.unknown()), required: z.boolean(), difficult: z.boolean(), expertNotes: z.array(z.string()) });

export const expertAnnotationSchema = z.object({
  schemaVersion: z.literal("nuee-expert-annotation-1.0.0"), documentId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "EXPERT_VERIFIED", "ADJUDICATED"]),
  document: z.object({ subject: z.enum(UNIVERSAL_SUBJECTS), examType: z.string(), sourceFormat: z.enum(UNIVERSAL_DOCUMENT_TYPES), pageCount: z.number().int().positive() }),
  questions: z.array(z.object({ id: z.string().min(1), number: z.string().min(1), order: z.number().int().nonnegative(), type: z.enum(UNIVERSAL_QUESTION_TYPES), parentQuestionId: z.string().nullable(), boundaries: z.array(coordinateSchema).min(1), formulaIds: z.array(z.string()), visualIds: z.array(z.string()), answerIds: z.array(z.string()), solutionIds: z.array(z.string()) })),
  formulas: z.array(annotatedObjectSchema), diagrams: z.array(annotatedObjectSchema), graphs: z.array(annotatedObjectSchema), tables: z.array(annotatedObjectSchema), answers: z.array(annotatedObjectSchema), solutions: z.array(annotatedObjectSchema), markingSchemes: z.array(annotatedObjectSchema),
  knownDifficultRegions: z.array(z.object({ sourceReference: coordinateSchema, reason: z.string().min(1) })),
  experts: z.array(z.object({ expertId: z.string().min(1), role: z.string().min(1), reviewedAt: z.string().datetime() })),
  agreement: z.object({ method: z.enum(["NONE", "PAIRWISE", "FLEISS_KAPPA", "KRIPPENDORFF_ALPHA"]), score: z.number().min(0).max(1).nullable(), adjudicatedBy: z.string().nullable() }),
  certificationClass: z.enum(CERTIFICATION_CLASSES).nullable()
});

export type SeedCorpusManifest = z.infer<typeof seedCorpusManifestSchema>;
export type ExpertAnnotation = z.infer<typeof expertAnnotationSchema>;

