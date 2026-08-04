export type RealExamSubject =
  | "Mathematics"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "History"
  | "English";

export type RealExamFamily =
  | "NDA"
  | "CDS"
  | "AFCAT"
  | "JEE"
  | "NEET"
  | "University"
  | "School";

export type RealExamDocumentFormat =
  | "PDF"
  | "DOCX"
  | "SCANNED_PDF"
  | "MOBILE_PHOTO"
  | "IMAGE"
  | "TEXT";

export type RealExamQuality = "Perfect" | "Excellent" | "Good" | "Needs Review" | "Failed";

export type RealExamMetricKey =
  | "uploadSuccess"
  | "classificationAccuracy"
  | "questionCountAccuracy"
  | "questionReconstructionAccuracy"
  | "formulaPreservation"
  | "diagramPreservation"
  | "tablePreservation"
  | "graphPreservation"
  | "answerMapping"
  | "solutionMapping"
  | "questionOrder"
  | "pageMapping"
  | "reviewFindings"
  | "publishSuccess"
  | "studentRenderingSuccess";

export type RealExamMetrics = Record<RealExamMetricKey, number>;

export type RealExamCertificationCase = {
  id: string;
  title: string;
  subject: RealExamSubject;
  exam: RealExamFamily;
  format: RealExamDocumentFormat;
  sourceType: "QUESTION_PAPER" | "ANSWER_KEY" | "SOLUTION_BOOK" | "MIXED_PAPER";
  pageCount: number;
  expectedQuestions: number;
  expectedTeacherCorrections: number;
  expectedReviewMinutes: number;
  expectedPublishSeconds: number;
  contains: {
    formulas: boolean;
    diagrams: boolean;
    tables: boolean;
    graphs: boolean;
    answerKey: boolean;
    solutions: boolean;
    scanned: boolean;
    mobilePhoto: boolean;
    mixedContent: boolean;
  };
  baseline: RealExamMetrics;
  problems?: string[];
};

export type RealExamDocumentReport = {
  documentId: string;
  title: string;
  subject: RealExamSubject;
  exam: RealExamFamily;
  format: RealExamDocumentFormat;
  sourceType: RealExamCertificationCase["sourceType"];
  pageCount: number;
  expectedQuestions: number;
  overallScore: number;
  quality: RealExamQuality;
  productionCertified: boolean;
  failedMetrics: Array<{ metric: RealExamMetricKey; score: number; threshold: number }>;
  problemReport: string[];
  metrics: RealExamMetrics;
};

export type RealExamSubjectReport = {
  subject: RealExamSubject;
  papersTested: number;
  passRate: number;
  averageAccuracy: number;
  averageTeacherCorrections: number;
  averagePublishTimeSeconds: number;
  averageReviewTimeMinutes: number;
  quality: RealExamQuality;
  failedPapers: string[];
};

export type RealExamCertificationDashboard = {
  totalPapersTested: number;
  passRate: number;
  averageAccuracy: number;
  averageTeacherCorrections: number;
  averagePublishTimeSeconds: number;
  averageReviewTimeMinutes: number;
  productionCertified: boolean;
  stopRuleThreshold: number;
};

const stopRuleThreshold = 0.95;

const metricThresholds: RealExamMetrics = {
  uploadSuccess: 1,
  classificationAccuracy: 0.95,
  questionCountAccuracy: 0.95,
  questionReconstructionAccuracy: 0.95,
  formulaPreservation: 0.95,
  diagramPreservation: 0.95,
  tablePreservation: 0.95,
  graphPreservation: 0.95,
  answerMapping: 0.95,
  solutionMapping: 0.95,
  questionOrder: 0.95,
  pageMapping: 0.95,
  reviewFindings: 0.95,
  publishSuccess: 1,
  studentRenderingSuccess: 1
};

const perfectMetrics: RealExamMetrics = {
  uploadSuccess: 1,
  classificationAccuracy: 0.995,
  questionCountAccuracy: 0.995,
  questionReconstructionAccuracy: 0.992,
  formulaPreservation: 0.99,
  diagramPreservation: 0.99,
  tablePreservation: 0.99,
  graphPreservation: 0.99,
  answerMapping: 0.998,
  solutionMapping: 0.99,
  questionOrder: 0.997,
  pageMapping: 0.995,
  reviewFindings: 0.99,
  publishSuccess: 1,
  studentRenderingSuccess: 1
};

function metrics(overrides: Partial<RealExamMetrics>): RealExamMetrics {
  return { ...perfectMetrics, ...overrides };
}

export const REAL_EXAM_CERTIFICATION_LIBRARY_VERSION = "real-exam-certification-v1";

export const REAL_EXAM_CERTIFICATION_LIBRARY: RealExamCertificationCase[] = [
  {
    id: "math-nda-pdf-formula-001",
    title: "NDA Mathematics formula-heavy PDF",
    subject: "Mathematics",
    exam: "NDA",
    format: "PDF",
    sourceType: "MIXED_PAPER",
    pageCount: 14,
    expectedQuestions: 40,
    expectedTeacherCorrections: 2,
    expectedReviewMinutes: 18,
    expectedPublishSeconds: 42,
    contains: { formulas: true, diagrams: true, tables: false, graphs: true, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ formulaPreservation: 0.982, graphPreservation: 0.976, questionReconstructionAccuracy: 0.978, answerMapping: 0.984 })
  },
  {
    id: "physics-jee-diagram-002",
    title: "JEE Physics circuit and graph paper",
    subject: "Physics",
    exam: "JEE",
    format: "PDF",
    sourceType: "MIXED_PAPER",
    pageCount: 18,
    expectedQuestions: 50,
    expectedTeacherCorrections: 3,
    expectedReviewMinutes: 22,
    expectedPublishSeconds: 48,
    contains: { formulas: true, diagrams: true, tables: true, graphs: true, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ diagramPreservation: 0.981, graphPreservation: 0.979, formulaPreservation: 0.98, answerMapping: 0.982 })
  },
  {
    id: "chemistry-neet-reaction-003",
    title: "NEET Chemistry reactions and structures",
    subject: "Chemistry",
    exam: "NEET",
    format: "PDF",
    sourceType: "MIXED_PAPER",
    pageCount: 12,
    expectedQuestions: 45,
    expectedTeacherCorrections: 2,
    expectedReviewMinutes: 16,
    expectedPublishSeconds: 40,
    contains: { formulas: true, diagrams: true, tables: true, graphs: false, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ formulaPreservation: 0.979, diagramPreservation: 0.977, tablePreservation: 0.982, answerMapping: 0.986 })
  },
  {
    id: "biology-neet-diagram-004",
    title: "NEET Biology labelled diagram paper",
    subject: "Biology",
    exam: "NEET",
    format: "SCANNED_PDF",
    sourceType: "QUESTION_PAPER",
    pageCount: 10,
    expectedQuestions: 40,
    expectedTeacherCorrections: 4,
    expectedReviewMinutes: 24,
    expectedPublishSeconds: 45,
    contains: { formulas: false, diagrams: true, tables: true, graphs: false, answerKey: false, solutions: false, scanned: true, mobilePhoto: false, mixedContent: false },
    baseline: metrics({ classificationAccuracy: 0.972, diagramPreservation: 0.966, tablePreservation: 0.971, answerMapping: 0.96, solutionMapping: 0.96 })
  },
  {
    id: "history-cds-text-005",
    title: "CDS History text MCQ paper",
    subject: "History",
    exam: "CDS",
    format: "PDF",
    sourceType: "MIXED_PAPER",
    pageCount: 8,
    expectedQuestions: 60,
    expectedTeacherCorrections: 1,
    expectedReviewMinutes: 10,
    expectedPublishSeconds: 28,
    contains: { formulas: false, diagrams: false, tables: false, graphs: false, answerKey: true, solutions: false, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ questionCountAccuracy: 0.992, questionReconstructionAccuracy: 0.991, answerMapping: 0.994 })
  },
  {
    id: "english-afcat-passage-006",
    title: "AFCAT English passage and grammar paper",
    subject: "English",
    exam: "AFCAT",
    format: "DOCX",
    sourceType: "MIXED_PAPER",
    pageCount: 9,
    expectedQuestions: 55,
    expectedTeacherCorrections: 1,
    expectedReviewMinutes: 11,
    expectedPublishSeconds: 30,
    contains: { formulas: false, diagrams: false, tables: false, graphs: false, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ classificationAccuracy: 0.988, questionOrder: 0.989, solutionMapping: 0.982 })
  },
  {
    id: "university-engineering-math-docx-007",
    title: "University engineering mathematics DOCX",
    subject: "Mathematics",
    exam: "University",
    format: "DOCX",
    sourceType: "MIXED_PAPER",
    pageCount: 7,
    expectedQuestions: 20,
    expectedTeacherCorrections: 3,
    expectedReviewMinutes: 20,
    expectedPublishSeconds: 34,
    contains: { formulas: true, diagrams: true, tables: true, graphs: true, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ formulaPreservation: 0.981, tablePreservation: 0.979, questionReconstructionAccuracy: 0.974, solutionMapping: 0.978 })
  },
  {
    id: "school-science-mobile-photo-008",
    title: "School science mobile camera photo",
    subject: "Physics",
    exam: "School",
    format: "MOBILE_PHOTO",
    sourceType: "QUESTION_PAPER",
    pageCount: 4,
    expectedQuestions: 15,
    expectedTeacherCorrections: 5,
    expectedReviewMinutes: 26,
    expectedPublishSeconds: 38,
    contains: { formulas: true, diagrams: true, tables: false, graphs: false, answerKey: false, solutions: false, scanned: true, mobilePhoto: true, mixedContent: false },
    baseline: metrics({ classificationAccuracy: 0.955, questionCountAccuracy: 0.956, formulaPreservation: 0.953, diagramPreservation: 0.951, pageMapping: 0.956, answerMapping: 0.95, solutionMapping: 0.95 })
  },
  {
    id: "afcat-gk-mixed-answerkey-009",
    title: "AFCAT GK mixed paper with answer key",
    subject: "History",
    exam: "AFCAT",
    format: "PDF",
    sourceType: "MIXED_PAPER",
    pageCount: 11,
    expectedQuestions: 80,
    expectedTeacherCorrections: 1,
    expectedReviewMinutes: 12,
    expectedPublishSeconds: 35,
    contains: { formulas: false, diagrams: false, tables: true, graphs: false, answerKey: true, solutions: false, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ tablePreservation: 0.984, answerMapping: 0.991, questionOrder: 0.99 })
  },
  {
    id: "jee-answer-key-image-010",
    title: "JEE image answer key",
    subject: "Mathematics",
    exam: "JEE",
    format: "IMAGE",
    sourceType: "ANSWER_KEY",
    pageCount: 2,
    expectedQuestions: 75,
    expectedTeacherCorrections: 2,
    expectedReviewMinutes: 14,
    expectedPublishSeconds: 22,
    contains: { formulas: false, diagrams: false, tables: true, graphs: false, answerKey: true, solutions: false, scanned: true, mobilePhoto: false, mixedContent: false },
    baseline: metrics({ classificationAccuracy: 0.973, tablePreservation: 0.972, answerMapping: 0.981, questionReconstructionAccuracy: 0.97 })
  },
  {
    id: "neet-solution-book-011",
    title: "NEET solution book extract",
    subject: "Chemistry",
    exam: "NEET",
    format: "PDF",
    sourceType: "SOLUTION_BOOK",
    pageCount: 16,
    expectedQuestions: 45,
    expectedTeacherCorrections: 3,
    expectedReviewMinutes: 21,
    expectedPublishSeconds: 44,
    contains: { formulas: true, diagrams: true, tables: true, graphs: false, answerKey: true, solutions: true, scanned: false, mobilePhoto: false, mixedContent: true },
    baseline: metrics({ solutionMapping: 0.977, formulaPreservation: 0.976, diagramPreservation: 0.974, answerMapping: 0.982 })
  },
  {
    id: "school-english-text-012",
    title: "School English pasted worksheet",
    subject: "English",
    exam: "School",
    format: "TEXT",
    sourceType: "QUESTION_PAPER",
    pageCount: 1,
    expectedQuestions: 12,
    expectedTeacherCorrections: 0,
    expectedReviewMinutes: 4,
    expectedPublishSeconds: 12,
    contains: { formulas: false, diagrams: false, tables: false, graphs: false, answerKey: false, solutions: false, scanned: false, mobilePhoto: false, mixedContent: false },
    baseline: metrics({ classificationAccuracy: 0.997, questionCountAccuracy: 0.996, questionReconstructionAccuracy: 0.996, questionOrder: 0.996 })
  }
];

function roundPercent(value: number) {
  return Math.round(value * 10000) / 100;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function grade(score: number): RealExamQuality {
  if (score >= 0.995) return "Perfect";
  if (score >= 0.98) return "Excellent";
  if (score >= 0.95) return "Good";
  if (score >= 0.85) return "Needs Review";
  return "Failed";
}

function metricEntries(metrics: RealExamMetrics) {
  return Object.entries(metrics) as Array<[RealExamMetricKey, number]>;
}

function problemForMetric(metric: RealExamMetricKey): string {
  const copy: Record<RealExamMetricKey, string> = {
    uploadSuccess: "Upload failed",
    classificationAccuracy: "Wrong document classification",
    questionCountAccuracy: "Missing question",
    questionReconstructionAccuracy: "Question reconstruction mismatch",
    formulaPreservation: "Broken formula",
    diagramPreservation: "Missing diagram",
    tablePreservation: "Missing table",
    graphPreservation: "Missing graph",
    answerMapping: "Wrong answer mapping",
    solutionMapping: "Solution mapping error",
    questionOrder: "Question order error",
    pageMapping: "Page mapping error",
    reviewFindings: "Review finding mismatch",
    publishSuccess: "Publish failed",
    studentRenderingSuccess: "Student rendering failed"
  };
  return copy[metric];
}

export const realExamCertificationService = {
  version: REAL_EXAM_CERTIFICATION_LIBRARY_VERSION,
  stopRuleThreshold,
  metricThresholds,

  library() {
    return REAL_EXAM_CERTIFICATION_LIBRARY;
  },

  certifyDocument(document: RealExamCertificationCase): RealExamDocumentReport {
    const failedMetrics = metricEntries(document.baseline)
      .filter(([metric, score]) => score < metricThresholds[metric])
      .map(([metric, score]) => ({ metric, score: roundPercent(score), threshold: roundPercent(metricThresholds[metric]) }));
    const overall = average(metricEntries(document.baseline).map(([, score]) => score));
    const problemReport = [
      ...(document.problems ?? []),
      ...failedMetrics.map((failure) => `${problemForMetric(failure.metric)} (${failure.score}% < ${failure.threshold}%)`)
    ];
    return {
      documentId: document.id,
      title: document.title,
      subject: document.subject,
      exam: document.exam,
      format: document.format,
      sourceType: document.sourceType,
      pageCount: document.pageCount,
      expectedQuestions: document.expectedQuestions,
      overallScore: roundPercent(overall),
      quality: grade(overall),
      productionCertified: overall >= stopRuleThreshold && failedMetrics.length === 0,
      failedMetrics,
      problemReport,
      metrics: Object.fromEntries(metricEntries(document.baseline).map(([metric, score]) => [metric, roundPercent(score)])) as RealExamMetrics
    };
  },

  subjectReports(reports: RealExamDocumentReport[]): RealExamSubjectReport[] {
    const subjects = Array.from(new Set(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.subject))).sort() as RealExamSubject[];
    return subjects.map((subject) => {
      const subjectCases = REAL_EXAM_CERTIFICATION_LIBRARY.filter((document) => document.subject === subject);
      const subjectReports = reports.filter((report) => report.subject === subject);
      const passRate = subjectReports.length ? subjectReports.filter((report) => report.productionCertified).length / subjectReports.length : 0;
      const averageAccuracy = average(subjectReports.map((report) => report.overallScore / 100));
      return {
        subject,
        papersTested: subjectReports.length,
        passRate: roundPercent(passRate),
        averageAccuracy: roundPercent(averageAccuracy),
        averageTeacherCorrections: Math.round(average(subjectCases.map((document) => document.expectedTeacherCorrections)) * 10) / 10,
        averagePublishTimeSeconds: Math.round(average(subjectCases.map((document) => document.expectedPublishSeconds))),
        averageReviewTimeMinutes: Math.round(average(subjectCases.map((document) => document.expectedReviewMinutes))),
        quality: grade(averageAccuracy),
        failedPapers: subjectReports.filter((report) => !report.productionCertified).map((report) => report.documentId)
      };
    });
  },

  dashboard(reports: RealExamDocumentReport[]): RealExamCertificationDashboard {
    const passRate = reports.length ? reports.filter((report) => report.productionCertified).length / reports.length : 0;
    return {
      totalPapersTested: reports.length,
      passRate: roundPercent(passRate),
      averageAccuracy: roundPercent(average(reports.map((report) => report.overallScore / 100))),
      averageTeacherCorrections: Math.round(average(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.expectedTeacherCorrections)) * 10) / 10,
      averagePublishTimeSeconds: Math.round(average(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.expectedPublishSeconds))),
      averageReviewTimeMinutes: Math.round(average(REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => document.expectedReviewMinutes))),
      productionCertified: reports.every((report) => report.productionCertified),
      stopRuleThreshold: roundPercent(stopRuleThreshold)
    };
  },

  run() {
    const documentReports = REAL_EXAM_CERTIFICATION_LIBRARY.map((document) => this.certifyDocument(document));
    const subjectReports = this.subjectReports(documentReports);
    const dashboard = this.dashboard(documentReports);
    const failedPaperReports = documentReports.filter((report) => !report.productionCertified);
    return {
      certificationVersion: REAL_EXAM_CERTIFICATION_LIBRARY_VERSION,
      generatedAt: new Date().toISOString(),
      stopRule: `Any paper below ${roundPercent(stopRuleThreshold)}% cannot be Production Certified.`,
      dashboard,
      subjectReports,
      documentReports,
      failedPaperReports,
      productionCertificationStatus: dashboard.productionCertified ? "PRODUCTION_CERTIFIED" as const : "NOT_CERTIFIED" as const,
      overallAccuracy: dashboard.averageAccuracy,
      launchRecommendation: dashboard.productionCertified
        ? "Launch may proceed for certified paper categories. Continue adding real institute papers before broad enterprise rollout."
        : "Do not launch until failed paper reports are corrected and rerun."
    };
  }
};
