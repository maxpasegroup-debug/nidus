export const UNIVERSAL_EXAM_ENGINE_SPEC_VERSION = "nuee-spec-1.0.0" as const;

export const UNIVERSAL_DOCUMENT_TYPES = [
  "PDF", "SCANNED_PDF", "DOC", "DOCX", "OFFICE_MATH", "JPG", "JPEG", "PNG", "WEBP", "TIFF", "HEIC", "TXT",
  "MOBILE_PHOTO", "PASTED_QUESTIONS", "ANSWER_KEY", "SOLUTION_DOCUMENT", "MIXED_DOCUMENT"
] as const;

export const UNIVERSAL_SUBJECTS = [
  "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "ENGINEERING", "HUMANITIES", "LANGUAGES"
] as const;

export const UNIVERSAL_QUESTION_TYPES = [
  "SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "NUMERICAL", "INTEGER", "TRUE_FALSE", "FILL_BLANK",
  "ASSERTION_REASON", "MATCHING", "ORDERING", "PASSAGE", "CASE_STUDY", "MULTI_PART", "DESCRIPTIVE",
  "PROGRAMMING", "DRAWING", "HOTSPOT", "FILE_RESPONSE", "VOICE_RESPONSE", "UNKNOWN_FUTURE"
] as const;

export const MATHEMATICAL_STRUCTURES = [
  "ARITHMETIC", "ALGEBRA", "FRACTION", "RADICAL", "POWER", "SUBSCRIPT", "SUPERSCRIPT", "LIMIT",
  "DERIVATIVE", "INTEGRAL", "SUMMATION", "PRODUCT", "MATRIX", "DETERMINANT", "PIECEWISE", "VECTOR",
  "TENSOR", "COMPLEX_NUMBER", "COORDINATE_GEOMETRY", "TRIGONOMETRY", "PROBABILITY", "STATISTICS",
  "DIFFERENTIAL_EQUATION", "LINEAR_ALGEBRA", "THREE_DIMENSIONAL_GEOMETRY", "HANDWRITTEN_EXPRESSION"
] as const;

export const SCIENTIFIC_STRUCTURES = [
  "CHEMICAL_FORMULA", "REACTION_EQUATION", "REACTION_ARROW", "CHARGE", "OXIDATION_STATE", "ISOTOPE",
  "LEWIS_STRUCTURE", "ORGANIC_STRUCTURE", "REACTION_MECHANISM", "STEREOCHEMISTRY", "COORDINATION_COMPOUND",
  "UNIT", "DIMENSION", "PHYSICS_EQUATION", "VECTOR_QUANTITY", "CIRCUIT", "FREE_BODY_DIAGRAM", "RAY_DIAGRAM",
  "WAVE_DIAGRAM", "EXPERIMENTAL_GRAPH", "LABORATORY_FIGURE"
] as const;

export const EDUCATIONAL_VISUAL_STRUCTURES = [
  "IMAGE", "DIAGRAM", "GEOMETRY_DIAGRAM", "GRAPH", "COORDINATE_SYSTEM", "TABLE", "CHART", "MAP",
  "CIRCUIT", "ENGINEERING_DRAWING", "BIOLOGY_DIAGRAM", "CHEMISTRY_STRUCTURE", "CAPTION", "AXIS", "LEGEND",
  "SCALE", "LABEL", "ARROW", "CONNECTOR", "SHARED_VISUAL", "IMAGE_OPTION"
] as const;

export const ANSWER_KEY_FORMATS = [
  "INLINE", "SEPARATE_DOCUMENT", "TABULAR", "LIST", "OMR_STYLE", "MULTI_VERSION", "ANSWER_WITH_EXPLANATION",
  "NUMERICAL_WITH_TOLERANCE", "RUBRIC", "UNKNOWN"
] as const;

export const SOLUTION_FORMATS = [
  "SHORT_EXPLANATION", "STEP_BY_STEP", "WORKED_EXAMPLE", "FORMULA_DERIVATION", "VISUAL_EXPLANATION",
  "MODEL_ANSWER", "VIDEO_REFERENCE", "MIXED", "UNKNOWN"
] as const;

export const MARKING_SCHEMES = [
  "POSITIVE", "NEGATIVE", "PARTIAL", "ALL_OR_NOTHING", "MULTI_CORRECT_PARTIAL", "NUMERICAL_TOLERANCE",
  "BONUS", "CANCELLED", "SECTION_RULE", "QUESTION_RULE", "RUBRIC", "MANUAL_MODERATION"
] as const;

export const EVALUATION_TYPES = [
  "EXACT_OPTION", "OPTION_SET", "BOOLEAN", "EXACT_TEXT", "NORMALIZED_TEXT", "NUMERIC_EXACT", "NUMERIC_TOLERANCE",
  "UNIT_AWARE_NUMERIC", "MATCHING", "ORDERING", "RUBRIC_ASSISTED", "PROGRAMMING_SANDBOX", "DRAWING_REVIEW",
  "HOTSPOT", "FILE_MANUAL", "VOICE_MANUAL", "MANUAL"
] as const;

export const CERTIFICATION_CLASSES = ["CERTIFIED", "CONTROLLED", "BLOCKED"] as const;
export type UniversalCertificationClass = typeof CERTIFICATION_CLASSES[number];

export const UNIVERSAL_ACCURACY_TARGETS = {
  sourcePreservation: 1,
  pagePreservation: 1,
  questionCountAndOrder: 0.9995,
  questionTypeAccuracy: 0.99,
  formulaPreservation: 0.995,
  formulaSemanticAccuracy: 0.99,
  requiredVisualPreservation: 1,
  answerMapping: 0.9999,
  deterministicScoring: 1,
  publishPackageIntegrity: 1,
  studentRenderingFidelity: 1,
  maximumSilentContentLoss: 0,
  maximumInventedAcademicContent: 0
} as const;

export const UNIVERSAL_EXAM_ENGINE_SPECIFICATION = {
  schemaVersion: UNIVERSAL_EXAM_ENGINE_SPEC_VERSION,
  status: "LOCKED_CORE_PROGRAM" as const,
  documentTypes: UNIVERSAL_DOCUMENT_TYPES,
  subjects: UNIVERSAL_SUBJECTS,
  questionTypes: UNIVERSAL_QUESTION_TYPES,
  mathematicalStructures: MATHEMATICAL_STRUCTURES,
  scientificStructures: SCIENTIFIC_STRUCTURES,
  educationalVisualStructures: EDUCATIONAL_VISUAL_STRUCTURES,
  answerKeyFormats: ANSWER_KEY_FORMATS,
  solutionFormats: SOLUTION_FORMATS,
  markingSchemes: MARKING_SCHEMES,
  evaluationTypes: EVALUATION_TYPES,
  certificationClasses: CERTIFICATION_CLASSES,
  accuracyTargets: UNIVERSAL_ACCURACY_TARGETS,
  sourceAndProvenance: {
    originalIsImmutable: true,
    everyAcademicObjectRequiresSourceReference: true,
    requiredReferenceFields: ["sourceDocumentId", "pageNumber", "coordinates", "sourceChecksum"],
    originalCropRequiredWhenConfidenceIsLow: true
  },
  confidenceAndUncertainty: {
    range: [0, 1],
    levels: ["ELEMENT", "RELATIONSHIP", "QUESTION", "PAGE", "DOCUMENT", "EXAM"],
    reasonsRequired: true,
    providerEvidenceRequired: true,
    uncertaintyMustNeverBeDiscarded: true
  },
  failurePolicy: {
    preserveOriginal: true,
    neverDiscardAcademicContentSilently: true,
    neverInventAcademicContent: true,
    uncertainContentOutcome: "CONTROLLED",
    unsafeOrCorruptOutcome: "BLOCKED"
  },
  versioning: {
    immutableOriginal: true,
    immutableTeacherRevisions: true,
    immutablePublishPackages: true,
    schemaVersionRequired: true,
    pipelineVersionRequired: true,
    providerVersionRequired: true,
    checksumsRequired: true
  },
  teacherReview: {
    sourceBesideReconstruction: true,
    formulaVisualAnswerVerification: true,
    immutableDecisionHistory: true,
    criticalIssuesRequireResolution: true,
    controlledClassRequiresReview: true
  },
  publishingSafety: {
    teacherAuthorityRequired: true,
    blockCriticalValidation: true,
    blockMissingRequiredAssets: true,
    blockBrokenRelationships: true,
    blockUnresolvedAnswers: true,
    packageIntegrityRequired: true
  },
  studentRendering: {
    exactApprovedContent: true,
    richFormulaFallbacks: true,
    requiredVisuals: true,
    responsive: true,
    accessible: true,
    packageChecksumVerification: true
  }
} as const;
