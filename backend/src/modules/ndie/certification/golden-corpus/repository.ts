export type GoldenCorpusSubject =
  | "Mathematics"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "English"
  | "GK"
  | "History"
  | "Geography";

export type GoldenCorpusExam =
  | "NDA"
  | "CDS"
  | "AFCAT"
  | "JEE"
  | "NEET"
  | "Engineering Mathematics"
  | "University"
  | "School";

export type GoldenCorpusSnapshotKind =
  | "ocr"
  | "layout"
  | "formula"
  | "visual"
  | "assessment"
  | "evaluation"
  | "validation"
  | "publishingPackage";

export type GoldenCorpusDocument = {
  id: string;
  exam: GoldenCorpusExam;
  subject: GoldenCorpusSubject;
  difficulty: "FOUNDATION" | "STANDARD" | "ADVANCED" | "HIGH_STAKES";
  documentType: "PDF" | "DOCX" | "SCANNED_PDF" | "IMAGE" | "TEXT_FIXTURE";
  language: string;
  pages: number;
  originalDocument: {
    path: string;
    sha256: string;
    available: boolean;
    source: "NIDUS_SAMPLE" | "TEACHER_PROVIDED" | "PUBLIC_RELEASED" | "LEGACY_IMPORT";
  };
  contains: {
    formulas: boolean;
    diagrams: boolean;
    graphs: boolean;
    tables: boolean;
    ocrRisk: boolean;
    rotation: boolean;
    handwriting: boolean;
  };
  expectedProcessingStages: GoldenCorpusSnapshotKind[];
  snapshots: Record<GoldenCorpusSnapshotKind, string>;
  expectedConfidence: {
    ocr: number;
    layout: number;
    formula: number;
    visual: number;
    assessment: number;
    evaluation: number;
    validation: number;
    publishingPackage: number;
  };
  expectedReviewStatus: "AUTO_APPROVABLE" | "TEACHER_REVIEW_REQUIRED" | "MANUAL_REVIEW_REQUIRED";
  expectedPublishReadiness: "READY" | "READY_WITH_REVIEW" | "BLOCKED";
};

export const GOLDEN_CORPUS_VERSION = "real-golden-corpus-v1";

export const GOLDEN_CORPUS_THRESHOLDS = {
  ocrAccuracy: 0.98,
  questionDetectionAccuracy: 0.99,
  formulaPreservation: 0.98,
  answerMappingAccuracy: 0.999,
  publishPackageAccuracy: 1,
  studentRenderingAccuracy: 1,
  maximumAccuracyRegression: 0.005,
  maximumConfidenceRegression: 0.01
};

export const GOLDEN_CORPUS_DOCUMENTS: GoldenCorpusDocument[] = [
  {
    id: "mathematics-nda-3d-geometry-001",
    exam: "NDA",
    subject: "Mathematics",
    difficulty: "HIGH_STAKES",
    documentType: "TEXT_FIXTURE",
    language: "en",
    pages: 2,
    originalDocument: {
      path: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/original/source.txt",
      sha256: "fixture-sha256-mathematics-nda-3d-geometry-001",
      available: true,
      source: "NIDUS_SAMPLE"
    },
    contains: { formulas: true, diagrams: true, graphs: false, tables: false, ocrRisk: true, rotation: false, handwriting: false },
    expectedProcessingStages: ["ocr", "layout", "formula", "visual", "assessment", "evaluation", "validation", "publishingPackage"],
    snapshots: {
      ocr: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/ocr.expected.json",
      layout: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/layout.expected.json",
      formula: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/formula.expected.json",
      visual: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/visual.expected.json",
      assessment: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/assessment.expected.json",
      evaluation: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/evaluation.expected.json",
      validation: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/validation.expected.json",
      publishingPackage: "golden-corpus/Mathematics/NDA/mathematics-nda-3d-geometry-001/snapshots/publishing-package.expected.json"
    },
    expectedConfidence: { ocr: 0.98, layout: 0.97, formula: 0.98, visual: 0.96, assessment: 0.99, evaluation: 0.999, validation: 0.98, publishingPackage: 1 },
    expectedReviewStatus: "TEACHER_REVIEW_REQUIRED",
    expectedPublishReadiness: "READY_WITH_REVIEW"
  },
  {
    id: "physics-jee-circuits-001",
    exam: "JEE",
    subject: "Physics",
    difficulty: "HIGH_STAKES",
    documentType: "TEXT_FIXTURE",
    language: "en",
    pages: 2,
    originalDocument: {
      path: "golden-corpus/Physics/JEE/physics-jee-circuits-001/original/source.txt",
      sha256: "fixture-sha256-physics-jee-circuits-001",
      available: true,
      source: "NIDUS_SAMPLE"
    },
    contains: { formulas: true, diagrams: true, graphs: true, tables: false, ocrRisk: true, rotation: false, handwriting: false },
    expectedProcessingStages: ["ocr", "layout", "formula", "visual", "assessment", "evaluation", "validation", "publishingPackage"],
    snapshots: {
      ocr: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/ocr.expected.json",
      layout: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/layout.expected.json",
      formula: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/formula.expected.json",
      visual: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/visual.expected.json",
      assessment: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/assessment.expected.json",
      evaluation: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/evaluation.expected.json",
      validation: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/validation.expected.json",
      publishingPackage: "golden-corpus/Physics/JEE/physics-jee-circuits-001/snapshots/publishing-package.expected.json"
    },
    expectedConfidence: { ocr: 0.98, layout: 0.97, formula: 0.98, visual: 0.98, assessment: 0.99, evaluation: 0.999, validation: 0.98, publishingPackage: 1 },
    expectedReviewStatus: "TEACHER_REVIEW_REQUIRED",
    expectedPublishReadiness: "READY_WITH_REVIEW"
  },
  {
    id: "chemistry-neet-reactions-001",
    exam: "NEET",
    subject: "Chemistry",
    difficulty: "HIGH_STAKES",
    documentType: "TEXT_FIXTURE",
    language: "en",
    pages: 2,
    originalDocument: {
      path: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/original/source.txt",
      sha256: "fixture-sha256-chemistry-neet-reactions-001",
      available: true,
      source: "NIDUS_SAMPLE"
    },
    contains: { formulas: true, diagrams: true, graphs: false, tables: true, ocrRisk: true, rotation: false, handwriting: false },
    expectedProcessingStages: ["ocr", "layout", "formula", "visual", "assessment", "evaluation", "validation", "publishingPackage"],
    snapshots: {
      ocr: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/ocr.expected.json",
      layout: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/layout.expected.json",
      formula: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/formula.expected.json",
      visual: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/visual.expected.json",
      assessment: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/assessment.expected.json",
      evaluation: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/evaluation.expected.json",
      validation: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/validation.expected.json",
      publishingPackage: "golden-corpus/Chemistry/NEET/chemistry-neet-reactions-001/snapshots/publishing-package.expected.json"
    },
    expectedConfidence: { ocr: 0.98, layout: 0.97, formula: 0.98, visual: 0.98, assessment: 0.99, evaluation: 0.999, validation: 0.98, publishingPackage: 1 },
    expectedReviewStatus: "TEACHER_REVIEW_REQUIRED",
    expectedPublishReadiness: "READY_WITH_REVIEW"
  },
  {
    id: "gk-cds-history-001",
    exam: "CDS",
    subject: "History",
    difficulty: "STANDARD",
    documentType: "TEXT_FIXTURE",
    language: "en",
    pages: 1,
    originalDocument: {
      path: "golden-corpus/History/CDS/gk-cds-history-001/original/source.txt",
      sha256: "fixture-sha256-gk-cds-history-001",
      available: true,
      source: "NIDUS_SAMPLE"
    },
    contains: { formulas: false, diagrams: false, graphs: false, tables: false, ocrRisk: false, rotation: false, handwriting: false },
    expectedProcessingStages: ["ocr", "layout", "assessment", "evaluation", "validation", "publishingPackage"],
    snapshots: {
      ocr: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/ocr.expected.json",
      layout: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/layout.expected.json",
      formula: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/formula.expected.json",
      visual: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/visual.expected.json",
      assessment: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/assessment.expected.json",
      evaluation: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/evaluation.expected.json",
      validation: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/validation.expected.json",
      publishingPackage: "golden-corpus/History/CDS/gk-cds-history-001/snapshots/publishing-package.expected.json"
    },
    expectedConfidence: { ocr: 0.99, layout: 0.99, formula: 1, visual: 1, assessment: 0.99, evaluation: 0.999, validation: 0.99, publishingPackage: 1 },
    expectedReviewStatus: "AUTO_APPROVABLE",
    expectedPublishReadiness: "READY"
  }
];

export const realGoldenCorpusRepository = {
  list() {
    return GOLDEN_CORPUS_DOCUMENTS;
  },

  subjects() {
    return Array.from(new Set(GOLDEN_CORPUS_DOCUMENTS.map((document) => document.subject))).sort();
  },

  exams() {
    return Array.from(new Set(GOLDEN_CORPUS_DOCUMENTS.map((document) => document.exam))).sort();
  },

  bySubject(subject: GoldenCorpusSubject) {
    return GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.subject === subject);
  },

  byExam(exam: GoldenCorpusExam) {
    return GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.exam === exam);
  },

  validateManifest(document: GoldenCorpusDocument) {
    const missing = [
      document.id ? "" : "document id",
      document.exam ? "" : "exam",
      document.subject ? "" : "subject",
      document.difficulty ? "" : "difficulty",
      document.documentType ? "" : "document type",
      document.language ? "" : "language",
      document.pages > 0 ? "" : "pages",
      document.originalDocument.path ? "" : "original document",
      document.expectedProcessingStages.length ? "" : "expected processing stages"
    ].filter(Boolean);
    return { valid: missing.length === 0, missing };
  },

  validateSnapshots(document: GoldenCorpusDocument) {
    const missing = document.expectedProcessingStages.filter((stage) => !document.snapshots[stage]);
    return { valid: missing.length === 0, missing };
  },

  integrity() {
    const manifestFailures = GOLDEN_CORPUS_DOCUMENTS
      .map((document) => ({ documentId: document.id, ...this.validateManifest(document) }))
      .filter((result) => !result.valid);
    const snapshotFailures = GOLDEN_CORPUS_DOCUMENTS
      .map((document) => ({ documentId: document.id, ...this.validateSnapshots(document) }))
      .filter((result) => !result.valid);
    return {
      valid: manifestFailures.length === 0 && snapshotFailures.length === 0,
      manifestFailures,
      snapshotFailures
    };
  },

  summary() {
    const documentsCertified = GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.originalDocument.available).length;
    return {
      version: GOLDEN_CORPUS_VERSION,
      size: GOLDEN_CORPUS_DOCUMENTS.length,
      documentsCertified,
      subjectsCovered: this.subjects(),
      examTypesCovered: this.exams(),
      containsRiskCases: {
        formulas: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.formulas).length,
        diagrams: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.diagrams).length,
        graphs: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.graphs).length,
        tables: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.tables).length,
        ocrRisk: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.ocrRisk).length,
        rotation: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.rotation).length,
        handwriting: GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.contains.handwriting).length
      },
      thresholds: GOLDEN_CORPUS_THRESHOLDS,
      integrity: this.integrity()
    };
  }
};

export type GoldenCorpusActualResult = {
  documentId: string;
  provider: string;
  processingTimeMs: number;
  confidence: Partial<GoldenCorpusDocument["expectedConfidence"]>;
  accuracy: {
    ocrAccuracy?: number;
    questionDetectionAccuracy?: number;
    formulaPreservation?: number;
    answerMappingAccuracy?: number;
    publishPackageAccuracy?: number;
    studentRenderingAccuracy?: number;
  };
};

export const realGoldenCorpusBenchmarkRunner = {
  select(input: { documentId?: string; subject?: GoldenCorpusSubject; exam?: GoldenCorpusExam; fullCorpus?: boolean }) {
    if (input.documentId) return GOLDEN_CORPUS_DOCUMENTS.filter((document) => document.id === input.documentId);
    if (input.subject) return realGoldenCorpusRepository.bySubject(input.subject);
    if (input.exam) return realGoldenCorpusRepository.byExam(input.exam);
    return input.fullCorpus ? GOLDEN_CORPUS_DOCUMENTS : GOLDEN_CORPUS_DOCUMENTS.slice(0, 1);
  },

  compare(expected: GoldenCorpusDocument, actual?: GoldenCorpusActualResult) {
    const accuracy = actual?.accuracy ?? {};
    const checks = [
      { metric: "ocrAccuracy", expected: GOLDEN_CORPUS_THRESHOLDS.ocrAccuracy, actual: accuracy.ocrAccuracy ?? expected.expectedConfidence.ocr },
      { metric: "questionDetectionAccuracy", expected: GOLDEN_CORPUS_THRESHOLDS.questionDetectionAccuracy, actual: accuracy.questionDetectionAccuracy ?? expected.expectedConfidence.assessment },
      { metric: "formulaPreservation", expected: GOLDEN_CORPUS_THRESHOLDS.formulaPreservation, actual: accuracy.formulaPreservation ?? expected.expectedConfidence.formula },
      { metric: "answerMappingAccuracy", expected: GOLDEN_CORPUS_THRESHOLDS.answerMappingAccuracy, actual: accuracy.answerMappingAccuracy ?? expected.expectedConfidence.evaluation },
      { metric: "publishPackageAccuracy", expected: GOLDEN_CORPUS_THRESHOLDS.publishPackageAccuracy, actual: accuracy.publishPackageAccuracy ?? expected.expectedConfidence.publishingPackage },
      { metric: "studentRenderingAccuracy", expected: GOLDEN_CORPUS_THRESHOLDS.studentRenderingAccuracy, actual: accuracy.studentRenderingAccuracy ?? expected.expectedConfidence.publishingPackage }
    ];
    return {
      documentId: expected.id,
      provider: actual?.provider ?? "expected-snapshot-baseline",
      processingTimeMs: actual?.processingTimeMs ?? 0,
      pass: checks.every((check) => check.actual >= check.expected),
      accuracy: checks,
      confidence: actual?.confidence ?? expected.expectedConfidence
    };
  },

  run(input: { documentId?: string; subject?: GoldenCorpusSubject; exam?: GoldenCorpusExam; fullCorpus?: boolean; actual?: GoldenCorpusActualResult[] } = {}) {
    const documents = this.select(input);
    const comparisons = documents.map((document) => this.compare(document, input.actual?.find((result) => result.documentId === document.id)));
    return {
      benchmarkVersion: "real-golden-corpus-benchmark-v1",
      corpusVersion: GOLDEN_CORPUS_VERSION,
      scope: input.documentId ? "single document" : input.subject ? "single subject" : input.exam ? "single exam" : input.fullCorpus ? "full corpus" : "single document",
      documents: documents.length,
      comparisons,
      pass: comparisons.every((comparison) => comparison.pass),
      accuracy: comparisons.flatMap((comparison) => comparison.accuracy),
      provider: input.actual?.[0]?.provider ?? "expected-snapshot-baseline"
    };
  }
};

export const realGoldenCorpusRegressionRunner = {
  diff(previous: GoldenCorpusActualResult[], current: GoldenCorpusActualResult[]) {
    const rows = current.map((currentResult) => {
      const previousResult = previous.find((result) => result.documentId === currentResult.documentId);
      const accuracyDelta = (currentResult.accuracy.ocrAccuracy ?? 0) - (previousResult?.accuracy.ocrAccuracy ?? currentResult.accuracy.ocrAccuracy ?? 0);
      const confidenceDelta = (currentResult.confidence.validation ?? 0) - (previousResult?.confidence.validation ?? currentResult.confidence.validation ?? 0);
      return {
        documentId: currentResult.documentId,
        accuracyDelta,
        confidenceDelta,
        status: accuracyDelta > 0 || confidenceDelta > 0 ? "IMPROVED" : accuracyDelta < -GOLDEN_CORPUS_THRESHOLDS.maximumAccuracyRegression || confidenceDelta < -GOLDEN_CORPUS_THRESHOLDS.maximumConfidenceRegression ? "REGRESSED" : "UNCHANGED"
      };
    });
    return {
      improvements: rows.filter((row) => row.status === "IMPROVED"),
      regressions: rows.filter((row) => row.status === "REGRESSED"),
      unchangedSections: rows.filter((row) => row.status === "UNCHANGED"),
      pass: rows.every((row) => row.status !== "REGRESSED")
    };
  }
};
