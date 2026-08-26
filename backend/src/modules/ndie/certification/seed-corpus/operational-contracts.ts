import { z } from "zod";
import { UNIVERSAL_DOCUMENT_TYPES, UNIVERSAL_SUBJECTS } from "../../universal-specification/universal-exam-engine.spec.js";

export const OPERATIONAL_CORPUS_PARTITIONS = ["DEVELOPMENT", "VALIDATION", "BLIND"] as const;
export const OPERATIONAL_EVIDENCE_CLASSES = ["REAL_SOURCE", "DEVELOPMENT_FIXTURE", "SYNTHETIC_FIXTURE", "TEXT_FIXTURE", "UNKNOWN_SOURCE"] as const;
export const OPERATIONAL_RIGHTS_BASES = ["RIGHTS_BASIS_PENDING", "INSTITUTION_OWNED", "TEACHER_PROVIDED_WITH_CONSENT", "PUBLICLY_LICENSED", "LEGACY_OWNED"] as const;
export const OPERATIONAL_ANONYMIZATION_STATUSES = ["NOT_REVIEWED", "PII_REVIEW_REQUIRED", "IN_PROGRESS", "COMPLETE", "NOT_APPLICABLE_CONFIRMED"] as const;
export const OPERATIONAL_ANNOTATION_STATUSES = ["ANNOTATION_PENDING", "ANNOTATION_IN_PROGRESS", "ANNOTATION_REVIEW", "ANNOTATED", "ADJUDICATED", "CERTIFICATION_READY"] as const;
export const OPERATIONAL_SOURCE_FORMATS = ["PDF", "DOC", "DOCX", "JPG", "JPEG", "PNG", "WEBP", "TIFF", "HEIC", "TXT"] as const;

export const sourceCoordinateSchema = z.object({
  page: z.number().int().positive(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  rotation: z.number().optional()
});

export const operationalCorpusManifestSchema = z.object({
  schemaVersion: z.literal("nuee-operational-manifest-1.0.0"),
  documentId: z.string().regex(/^[a-z0-9][a-z0-9-]{2,99}$/),
  originalFilename: z.string().min(1),
  subject: z.enum(UNIVERSAL_SUBJECTS),
  examType: z.string().min(1),
  educationLevel: z.string().min(1),
  institutionOrBoard: z.string().nullable(),
  countryOrRegion: z.string().nullable(),
  documentType: z.enum(UNIVERSAL_DOCUMENT_TYPES),
  sourceFormat: z.enum(OPERATIONAL_SOURCE_FORMATS),
  pageCount: z.number().int().positive().nullable(),
  fileSizeBytes: z.number().int().positive(),
  ingestedAt: z.string().datetime(),
  partition: z.enum(OPERATIONAL_CORPUS_PARTITIONS),
  evidenceClass: z.enum(OPERATIONAL_EVIDENCE_CLASSES),
  source: z.object({
    relativePath: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    rightsBasis: z.enum(OPERATIONAL_RIGHTS_BASES),
    rightsVerifiedBy: z.string().nullable(),
    rightsVerifiedAt: z.string().datetime().nullable(),
    anonymizationStatus: z.enum(OPERATIONAL_ANONYMIZATION_STATUSES),
    piiReported: z.boolean(),
    provenance: z.object({
      description: z.string().min(1),
      suppliedBy: z.string().nullable(),
      sourceUri: z.string().nullable(),
      collectedAt: z.string().datetime(),
      verificationStatus: z.enum(["PENDING", "VERIFIED"]),
      verifiedBy: z.string().nullable(),
      verifiedAt: z.string().datetime().nullable()
    })
  }),
  annotation: z.object({
    status: z.enum(OPERATIONAL_ANNOTATION_STATUSES),
    applicabilityPath: z.string().min(1),
    expertAComplete: z.boolean(),
    expertBComplete: z.boolean(),
    expertIds: z.array(z.string()),
    agreement: z.number().min(0).max(1).nullable(),
    adjudicationComplete: z.boolean()
  }),
  certificationStatus: z.enum(["NOT_EVALUATED", "BLOCKED", "READY_FOR_VALIDATION", "CERTIFIED", "CONTROLLED"])
}).superRefine((manifest, context) => {
  if (manifest.partition === "BLIND" && manifest.annotation.applicabilityPath.includes("processing-input")) {
    context.addIssue({ code: "custom", message: "Blind expected outputs must be isolated from processing inputs." });
  }
  if (new Set(manifest.annotation.expertIds).size !== manifest.annotation.expertIds.length) {
    context.addIssue({ code: "custom", message: "Expert A and Expert B must be different people." });
  }
  if (manifest.annotation.agreement !== null && !(manifest.annotation.expertAComplete && manifest.annotation.expertBComplete)) {
    context.addIssue({ code: "custom", message: "Agreement requires two completed independent annotations." });
  }
  if (manifest.annotation.status === "CERTIFICATION_READY") {
    if (manifest.evidenceClass !== "REAL_SOURCE") context.addIssue({ code: "custom", message: "Only REAL_SOURCE may become certification ready." });
    if (manifest.source.rightsBasis === "RIGHTS_BASIS_PENDING") context.addIssue({ code: "custom", message: "Rights must be confirmed before certification readiness." });
    if (!["COMPLETE", "NOT_APPLICABLE_CONFIRMED"].includes(manifest.source.anonymizationStatus)) context.addIssue({ code: "custom", message: "Privacy review must be complete before certification readiness." });
    if (!manifest.annotation.adjudicationComplete || manifest.annotation.expertIds.length < 2) context.addIssue({ code: "custom", message: "Two experts and adjudication are required before certification readiness." });
  }
  if (manifest.source.rightsBasis !== "RIGHTS_BASIS_PENDING" && (!manifest.source.rightsVerifiedBy || !manifest.source.rightsVerifiedAt)) {
    context.addIssue({ code: "custom", message: "Confirmed rights require verifier identity and timestamp." });
  }
  if (manifest.source.provenance.verificationStatus === "VERIFIED" && (!manifest.source.provenance.verifiedBy || !manifest.source.provenance.verifiedAt)) {
    context.addIssue({ code: "custom", message: "Verified provenance requires verifier identity and timestamp." });
  }
});

export const annotationApplicabilitySchema = z.object({
  questionBoundaries: z.boolean(), questionOrder: z.boolean(), questionTypes: z.boolean(), parentChildRelationships: z.boolean(),
  sourceCoordinates: z.boolean(), formulas: z.boolean(), diagrams: z.boolean(), graphs: z.boolean(), tables: z.boolean(),
  answers: z.boolean(), solutions: z.boolean(), markingScheme: z.boolean(), difficultRegions: z.boolean(), expectedRepresentation: z.boolean()
});

export const expertAnnotationSubmissionSchema = z.object({
  schemaVersion: z.literal("nuee-expert-submission-1.0.0"),
  submissionId: z.string().min(1),
  documentId: z.string().min(1),
  annotatorId: z.string().min(1),
  annotationVersion: z.number().int().positive(),
  submittedAt: z.string().datetime(),
  independentAttestation: z.literal(true),
  blindedFromOtherSubmission: z.literal(true),
  fieldsAnnotated: z.array(z.string()).min(1),
  annotationPath: z.string().min(1),
  annotationSha256: z.string().regex(/^[a-f0-9]{64}$/),
  applicability: annotationApplicabilitySchema
});

const annotatedAcademicObjectSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  sourceReferences: z.array(sourceCoordinateSchema).min(1),
  expectedRepresentation: z.record(z.string(), z.unknown()),
  required: z.boolean(),
  difficult: z.boolean(),
  notes: z.array(z.string())
});

export const expertAnnotationPayloadSchema = z.object({
  schemaVersion: z.literal("nuee-expert-payload-1.0.0"),
  documentId: z.string().min(1),
  annotatorId: z.string().min(1),
  annotationVersion: z.number().int().positive(),
  applicability: annotationApplicabilitySchema,
  questions: z.array(z.object({
    id: z.string().min(1), number: z.string().min(1), order: z.number().int().nonnegative(),
    type: z.string().min(1), parentQuestionId: z.string().nullable(), sourceReferences: z.array(sourceCoordinateSchema).min(1)
  })),
  formulas: z.array(annotatedAcademicObjectSchema),
  diagrams: z.array(annotatedAcademicObjectSchema),
  graphs: z.array(annotatedAcademicObjectSchema),
  tables: z.array(annotatedAcademicObjectSchema),
  answers: z.array(annotatedAcademicObjectSchema),
  solutions: z.array(annotatedAcademicObjectSchema),
  markingSchemes: z.array(annotatedAcademicObjectSchema),
  difficultRegions: z.array(z.object({ sourceReference: sourceCoordinateSchema, reason: z.string().min(1) }))
});

export const expertAgreementSchema = z.object({
  documentId: z.string().min(1),
  expertSubmissionIds: z.tuple([z.string().min(1), z.string().min(1)]),
  method: z.enum(["PAIRWISE", "FLEISS_KAPPA", "KRIPPENDORFF_ALPHA"]),
  score: z.number().min(0).max(1),
  disagreements: z.array(z.string()),
  measuredAt: z.string().datetime()
});

export const expertAdjudicationSchema = z.object({
  schemaVersion: z.literal("nuee-adjudication-1.0.0"),
  documentId: z.string().min(1),
  expertSubmissionIds: z.tuple([z.string().min(1), z.string().min(1)]),
  adjudicatorId: z.string().min(1),
  status: z.literal("COMPLETE"),
  resolvedDisagreements: z.array(z.string()),
  completedAt: z.string().datetime()
});

export type OperationalCorpusManifest = z.infer<typeof operationalCorpusManifestSchema>;
export type OperationalEvidenceClass = typeof OPERATIONAL_EVIDENCE_CLASSES[number];
export type OperationalCorpusPartition = typeof OPERATIONAL_CORPUS_PARTITIONS[number];
export type OperationalSourceFormat = typeof OPERATIONAL_SOURCE_FORMATS[number];
export type OperationalAnnotationStatus = typeof OPERATIONAL_ANNOTATION_STATUSES[number];
export type ExpertAnnotationSubmission = z.infer<typeof expertAnnotationSubmissionSchema>;
export type ExpertAgreement = z.infer<typeof expertAgreementSchema>;
export type ExpertAnnotationPayload = z.infer<typeof expertAnnotationPayloadSchema>;
export type ExpertAdjudication = z.infer<typeof expertAdjudicationSchema>;
