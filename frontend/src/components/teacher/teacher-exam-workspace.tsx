"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import Image from "next/image";
import { BookOpen, CheckCircle2, FileText, Pencil, Plus, Trophy, X } from "lucide-react";
import { NidusMathText } from "@/components/exam/nidus-math-renderer";
import { buildNidusQuestionContent, type NidusQuestionContent } from "@/components/exam/nidus-question-content";
import { ExamReportingPanel, ExaminationEngineBanner, ExaminationRoleActions, ExamTypePanel, QuestionBankHierarchyPanel, type ExaminationEngineRole } from "@/components/examination/examination-engine-workspace";

export type TeacherExamBatch = {
  id: string;
  name: string;
  program?: string;
  studentCount: number;
  subjects: string[];
};

export type TeacherExamRecord = {
  id: string;
  batchId?: string | null;
  batchName?: string | null;
  course?: string | null;
  subject?: string | null;
  title?: string;
  topic?: string | null;
  questionCount?: number;
  durationMinutes?: number;
  difficulty?: string | null;
  status?: string;
  createdAt?: string;
  attemptStats?: { attempts?: number; submitted?: number; averageScore?: number };
  draft?: {
    questions?: QuestionDraft[];
    formulaReviews?: Record<number, FormulaReviewEntry>;
    questionTypeOverrides?: Record<number, RichQuestionType>;
    questionTypeDistribution?: Record<string, number>;
    questionRelationshipPlan?: QuestionRelationshipPlan;
    importReplayManifest?: ImportReplayManifest;
    importReplayNotes?: string[];
  } | null;
  uploads?: ExamUploadRecord[];
};

type QuestionDraft = {
  questionText: string;
  questionImage?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficultyLevel: string;
  topic: string;
  contentJson?: unknown;
  sourceDocumentId?: string;
  sourcePageNumber?: number;
  boundingBoxes?: unknown;
  latex?: unknown;
  assets?: unknown;
  layout?: unknown;
  renderMode?: string;
  aiConfidence?: number;
  reviewStatus?: string;
  publishedVersion?: number;
};

type ExtractionReport = {
  fileName: string;
  sourceKind: "QUESTION_PAPER" | "ANSWER_KEY";
  status: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  draftStatus?: "DRAFT_READY" | "NEEDS_REVIEW" | "UNSUPPORTED_FILE" | "CORRUPTED_FILE" | "PASSWORD_PROTECTED";
  documentType?: TeacherDocumentType;
  pageCount?: number;
  confidence?: {
    document: number;
    question: number;
    answer: number;
    overall: number;
  };
  textCharacters: number;
  detectedQuestions: number;
  warnings: string[];
  blockers: string[];
  visualRisk: boolean;
  createdAt: string;
};

type TeacherDocumentType =
  | "TEXT_EXAM"
  | "MCQ_EXAM"
  | "MATHEMATICS_EXAM"
  | "PHYSICS_EXAM"
  | "CHEMISTRY_EXAM"
  | "BIOLOGY_EXAM"
  | "DIAGRAM_HEAVY"
  | "TABLE_HEAVY"
  | "GRAPH_HEAVY"
  | "SCANNED_DOCUMENT"
  | "ANSWER_KEY"
  | "SOLUTION_DOCUMENT"
  | "WORKSHEET"
  | "NOTES"
  | "MIXED_DOCUMENT"
  | "UNKNOWN";

type TeacherUploadState = "IDLE" | "ANALYZING_DOCUMENT" | "UNDERSTANDING_PAPER" | "BUILDING_AI_DRAFT" | "PREPARING_REVIEW" | "DRAFT_READY" | "NEEDS_REVIEW" | "READY_FOR_PUBLISH" | "PASSWORD_PROTECTED" | "CORRUPTED_FILE" | "UNSUPPORTED_DOCUMENT";

type ExamUploadRecord = {
  id: string;
  importJobId?: string | null;
  sourceKind: ExtractionReport["sourceKind"] | "EXPLANATION" | "SUPPORTING_ASSET";
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  documentClass?: string;
  pipeline?: string;
  classification?: unknown;
  signedUrl?: string;
  cloudinaryUrl?: string;
  localPreviewUrl?: string;
  extractionStatus?: string;
  extractionAudit?: ExtractionReport | null;
  manualReviewRequired?: boolean;
  manualReviewCompleted?: boolean;
  createdAt?: string;
};

type QuestionVisualAsset = {
  id: string;
  label: string;
  fileName: string;
  pageNumber?: number;
  dataUrl: string;
};

type VisualCropRegion = "FULL" | "TOP" | "MIDDLE" | "BOTTOM";

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SourceReviewMapping = {
  documentId?: string;
  uploadId?: string | null;
  importJobId?: string | null;
  fileName?: string;
  page: number;
  coordinates: CropBox;
  confidence: number;
  reviewStatus: "PENDING" | "TEACHER_CONFIRMED";
  note?: string;
  mappedAt: string;
};

type RichQuestionType = NidusQuestionContent["questionType"];

type FormulaReviewEntry = {
  latex: string;
  reviewStatus: "PENDING" | "TEACHER_CONFIRMED";
  updatedAt: string;
};

type QuestionRelationshipGroup = {
  id: string;
  type: "SHARED_PASSAGE" | "SHARED_DIAGRAM" | "SHARED_TABLE" | "SHARED_SOURCE_PAGE" | "SECTION";
  title: string;
  questionNumbers: number[];
  sourcePage?: number;
  sourceUploadId?: string | null;
  importJobId?: string | null;
  confidence: number;
  reviewStatus: "AUTO_DETECTED" | "TEACHER_REVIEWED";
  note?: string;
};

type QuestionRelationshipPlan = {
  schema: "NIDUS_QUESTION_RELATIONSHIPS_V1";
  groups: QuestionRelationshipGroup[];
  sharedAssetQuestions: number[];
  generatedAt: string;
};

type ImportReplayManifest = {
  schema: "NIDUS_IMPORT_REPLAY_V1";
  replayAvailable: boolean;
  sourceUploads: Array<{
    uploadId: string;
    importJobId?: string | null;
    originalName: string;
    sourceKind: string;
    documentClass?: string;
    pipeline?: string;
    extractionStatus?: string;
    manualReviewCompleted?: boolean;
  }>;
  lastKnownQuestionCount: number;
  preservedQuestionTextHash: string;
  sourceReviewCoverage: {
    confirmed: number;
    visualConfirmed: number;
    visualRequired: number;
  };
  replayModes: Array<"RECLASSIFY_DOCUMENT" | "REEXTRACT_TEXT" | "REBUILD_LAYOUT" | "REVALIDATE_AI" | "COMPARE_WITH_CURRENT_DRAFT">;
  createdAt: string;
};

type ImportQualityScore = {
  schema: "NIDUS_IMPORT_QUALITY_SCORE_V1";
  score: number;
  grade: "A" | "B" | "C" | "D";
  status: "PUBLISH_READY" | "REVIEW_REQUIRED" | "BLOCKED";
  subscores: {
    aiValidation: number;
    paperReadiness: number;
    visualSource: number;
    formulaReview: number;
    teacherApproval: number;
    relationshipModel: number;
    replayReadiness: number;
  };
  blockers: string[];
  warnings: string[];
  strengths: string[];
  generatedAt: string;
};

type AiDraftReviewStatus = "READY" | "NEEDS_REVIEW" | "MISSING_OPTION" | "MISSING_FORMULA" | "MISSING_DIAGRAM" | "MISSING_ANSWER" | "MISSING_SOLUTION" | "MISSING_ASSET" | "INCOMPLETE" | "REJECTED" | "APPROVED";

type UniversalQuestionType =
  | RichQuestionType
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "PASSAGE_BASED"
  | "TABLE_BASED"
  | "GRAPH_BASED"
  | "DIAGRAM_BASED"
  | "MIXED_EXAM"
  | "UNKNOWN";

type AiDraftQuestion = {
  number: number;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  questionType: UniversalQuestionType;
  draftConfidence: number;
  reviewStatus: AiDraftReviewStatus;
  linkedAssets: string[];
  linkedAnswer?: string;
  linkedSolution?: string;
  recoveredFormula?: string;
  sourceReference?: string;
  sourcePage?: number;
  boundingRegion?: CropBox;
  originalCrop?: string;
  missingItems: Array<"Option" | "Formula" | "Diagram" | "Answer" | "Solution">;
  originalCropRequired: boolean;
  notes: string[];
};

type AiDraftQuality = {
  formulaPreservation: "High" | "Medium" | "Needs Review";
  visualPreservation: "High" | "Medium" | "Needs Review";
  questionCompleteness: "High" | "Medium" | "Needs Review";
  answerCompleteness: "High" | "Medium" | "Needs Review";
  overall: "High" | "Medium" | "Needs Review";
};

type AiExamDraft = {
  schema: "NIDUS_AI_EXAM_DRAFT_V1" | "NIDUS_AI_RECONSTRUCTION_DRAFT_V1" | "NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1";
  questions: AiDraftQuestion[];
  questionCount: number;
  questionTypes: string[];
  answerKeysLinked: number;
  solutionsLinked?: number;
  formulaReviewCount?: number;
  visualReviewCount?: number;
  needsReview: number;
  quality: AiDraftQuality;
  overallQuality: AiDraftQuality["overall"];
  message: string;
  createdAt: string;
};

type AiReconstructionResult = {
  engine: "NIDUS_AI_RECONSTRUCTION_ENGINE_V1";
  mode: "NDIE_PRIMARY" | "AI_RECONSTRUCTION" | "NDIE_FALLBACK";
  provider: string;
  draft: AiExamDraft;
  confidence: number;
  reviewFlags: string[];
};

type ResultRow = {
  rank: number;
  attemptId: string;
  studentName?: string | null;
  studentEmail?: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  correct: number;
  wrong: number;
  timeTaken: number;
  submittedAt?: string | null;
};

type PaperUnderstandingReport = {
  inferredExamType: string;
  inferredSubject: string;
  inferredTopic: string;
  solutionMode: "ANSWER_KEY_ONLY" | "EXPLANATION_OPTIONAL" | "EXPLANATION_REQUIRED";
  markingScheme: {
    marksPerQuestion: number;
    negativeMarks: number;
    totalMarks: number;
    source: "DETECTED" | "FORM_DEFAULT";
  };
  sections: Array<{ title: string; startQuestion: number; questionCount: number }>;
  answerKey: {
    entries: number;
    missing: number[];
    extra: number[];
    withExplanations: number;
    mode: "WITH_EXPLANATIONS" | "ANSWER_KEY_ONLY" | "NOT_FOUND";
  };
  riskSignals: Array<{ type: string; count: number; severity: "LOW" | "MEDIUM" | "HIGH"; message: string }>;
  questionSignals: Array<{
    number: number;
    visualRequired: boolean;
    formulaRisk: boolean;
    tableRisk: boolean;
    graphRisk: boolean;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    notes: string[];
  }>;
  warnings: string[];
  blockers: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
};

type VisualFidelityReport = {
  sourcePreviewAvailable: boolean;
  visualQuestionCount: number;
  formulaQuestionCount: number;
  tableQuestionCount: number;
  graphQuestionCount: number;
  questionsNeedingSource: number[];
  questionsNeedingReview: number[];
  missingSourceForVisuals: boolean;
  warnings: string[];
  blockers: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
};

type ResultsPayload = {
  exam: TeacherExamRecord;
  released: boolean;
  releasedAt?: string;
  summary?: {
    assignedStudents: number;
    submitted: number;
    pending: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalMarks: number;
    releaseReady: boolean;
  };
  results: ResultRow[];
};

type ImportValidationPayload = {
  engine: string;
  provider: string;
  averageConfidence: number;
  publishReady: boolean;
  summary: {
    totalQuestions: number;
    autoApproved: number;
    needsReview: number;
    manualCorrection: number;
    documentClass?: string;
    pipeline?: string;
  };
  questionReports: Array<{
    number: number;
    confidence: number;
    status: "AUTO_APPROVED" | "NEEDS_REVIEW" | "MANUAL_CORRECTION_REQUIRED" | string;
    issues: string[];
    warnings: string[];
    riskTags: string[];
  }>;
  recommendations: string[];
  createdAt: string;
};

type ImportAnalyticsPayload = {
  totals: {
    importJobs: number;
    uploads: number;
    reviewRequired: number;
    autoClassified: number;
    visualRiskUploads: number;
    averageConfidence: number;
  };
  byDocumentClass: Record<string, number>;
  byPipeline: Record<string, number>;
  recentJobs: Array<{
    id: string;
    originalName: string;
    documentClass: string;
    pipeline: string;
    status: string;
    reviewStatus: string;
    confidence?: number | null;
    createdAt: string;
  }>;
};

type ConfidenceHeatTone = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

type Props = {
  batches: TeacherExamBatch[];
  selectedBatchId?: string | null;
  selectedSubject?: string | null;
  exams: TeacherExamRecord[];
  role?: Extract<ExaminationEngineRole, "ACADEMIC_HEAD" | "TEACHER">;
  loading?: boolean;
  autoOpenCreatorKey?: string | null;
  onSelectBatch: (id: string) => void;
  onRefresh: () => void | Promise<void>;
};

function resolveApiBase() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
  if (typeof window !== "undefined" && configured) {
    try {
      const configuredUrl = new URL(configured);
      if (window.location.hostname === "nidusacademy.in" && configuredUrl.hostname !== window.location.hostname) return "";
    } catch {
      return "";
    }
  }
  return configured;
}

const API_BASE = resolveApiBase();

const richQuestionTypes: Array<{ value: RichQuestionType; label: string; note: string }> = [
  { value: "SINGLE_CHOICE", label: "Single choice", note: "One correct option" },
  { value: "MULTIPLE_ANSWER", label: "Multiple answer", note: "More than one option" },
  { value: "NUMERICAL", label: "Numerical", note: "Number/value answer" },
  { value: "FILL_BLANK", label: "Fill blank", note: "Short text answer" },
  { value: "ASSERTION_REASON", label: "Assertion reason", note: "Statement pair" },
  { value: "CASE_STUDY", label: "Case study", note: "Shared passage set" },
  { value: "MATCHING", label: "Matching", note: "Column matching" },
  { value: "DIAGRAM_LABEL", label: "Diagram label", note: "Label on visual" },
  { value: "FILE_UPLOAD", label: "File upload", note: "Student uploads work" },
];

const initialForm = {
  title: "",
  topic: "",
  date: "",
  time: "",
  duration: "60",
  marks: "100",
  instructions: "",
};

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) return (payload as { data: T }).data;
  return payload as T;
}

function extractErrorMessage(raw: string, fallback: string) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string };
    return parsed.message || parsed.error || fallback;
  } catch {
    return raw;
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(extractErrorMessage(raw, `Request failed: ${response.status}`));
  }
  return unwrap<T>(await response.json());
}

function confidenceHeatTone(confidence?: number | null, status?: string): ConfidenceHeatTone {
  const normalizedStatus = String(status || "").toUpperCase();
  if (!normalizedStatus && typeof confidence !== "number") return "UNKNOWN";
  if (normalizedStatus === "MANUAL_CORRECTION_REQUIRED" || (typeof confidence === "number" && confidence < 70)) return "RED";
  if (normalizedStatus === "NEEDS_REVIEW" || (typeof confidence === "number" && confidence < 90)) return "YELLOW";
  return "GREEN";
}

function confidenceHeatLabel(tone: ConfidenceHeatTone) {
  if (tone === "GREEN") return "High";
  if (tone === "YELLOW") return "Review";
  if (tone === "RED") return "Fix";
  return "Pending";
}

function confidenceHeatBadgeClass(tone: ConfidenceHeatTone) {
  if (tone === "GREEN") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "YELLOW") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "RED") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function confidenceHeatButtonClass(tone: ConfidenceHeatTone, selected: boolean) {
  const selectedRing = selected ? "ring-2 ring-slate-950 ring-offset-2" : "";
  if (tone === "GREEN") return `border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-500 ${selectedRing}`;
  if (tone === "YELLOW") return `border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-500 ${selectedRing}`;
  if (tone === "RED") return `border-rose-400 bg-rose-50 text-rose-950 shadow-sm shadow-rose-100 hover:border-rose-600 ${selectedRing}`;
  return selected ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-[var(--border)] bg-white hover:border-slate-300 hover:bg-slate-50";
}

function buildConfidenceHeatMap(validation: ImportValidationPayload | null) {
  const reports = validation?.questionReports ?? [];
  return {
    high: reports.filter((report) => confidenceHeatTone(report.confidence, report.status) === "GREEN").map((report) => report.number),
    review: reports.filter((report) => confidenceHeatTone(report.confidence, report.status) === "YELLOW").map((report) => report.number),
    fix: reports.filter((report) => confidenceHeatTone(report.confidence, report.status) === "RED").map((report) => report.number),
  };
}

function normalizeCropBox(box?: CropBox | null): CropBox {
  return {
    x: Math.max(0, Math.min(1, box?.x ?? 0)),
    y: Math.max(0, Math.min(1, box?.y ?? 0)),
    width: Math.max(0.01, Math.min(1, box?.width ?? 1)),
    height: Math.max(0.01, Math.min(1, box?.height ?? 1)),
  };
}

function estimateQuestionPage(questionNumber: number, questionCount: number, assets: QuestionVisualAsset[]) {
  const pages = assets.filter((asset) => typeof asset.pageNumber === "number");
  if (!pages.length) return 1;
  const pageIndex = Math.min(pages.length - 1, Math.max(0, Math.floor(((questionNumber - 1) / Math.max(1, questionCount)) * pages.length)));
  return pages[pageIndex]?.pageNumber || pageIndex + 1;
}

function defaultSourceMapping(input: {
  questionNumber: number;
  questionCount: number;
  uploads: ExamUploadRecord[];
  assets: QuestionVisualAsset[];
  confidence?: number;
  status?: SourceReviewMapping["reviewStatus"];
}): SourceReviewMapping {
  const source = input.uploads.find((upload) => upload.sourceKind === "QUESTION_PAPER") ?? input.uploads[0];
  const page = estimateQuestionPage(input.questionNumber, input.questionCount, input.assets);
  return {
    documentId: source?.importJobId || source?.id,
    uploadId: source?.id || null,
    importJobId: source?.importJobId || null,
    fileName: source?.originalName || source?.fileName,
    page,
    coordinates: { x: 0, y: 0, width: 1, height: 1 },
    confidence: input.confidence ?? 0.5,
    reviewStatus: input.status || "PENDING",
    note: `Estimated page ${page}. Teacher should confirm exact source area before publishing rich visual papers.`,
    mappedAt: new Date().toISOString(),
  };
}

function sourceReferenceFromMapping(mapping?: SourceReviewMapping | null) {
  if (!mapping) return undefined;
  const coordinates = normalizeCropBox(mapping.coordinates);
  return {
    documentId: mapping.documentId,
    uploadId: mapping.uploadId || undefined,
    importJobId: mapping.importJobId || undefined,
    page: mapping.page,
    coordinates: {
      page: mapping.page,
      ...coordinates,
    },
    note: mapping.note,
  };
}

function inferRichQuestionType(question: QuestionDraft, signal?: PaperUnderstandingReport["questionSignals"][number]): RichQuestionType {
  const text = `${question.questionText} ${question.optionA} ${question.optionB} ${question.optionC} ${question.optionD}`.toLowerCase();
  if (signal?.visualRequired && /\b(label|identify|mark|diagram)\b/i.test(text)) return "DIAGRAM_LABEL";
  if (/\b(assertion|reason)\b/i.test(text)) return "ASSERTION_REASON";
  if (/\b(match\s+the\s+following|column\s+i|column\s+ii)\b/i.test(text)) return "MATCHING";
  if (/\b(case study|passage|read the following)\b/i.test(text)) return "CASE_STUDY";
  if (/\b(integer|numerical|value of|find the value|calculate)\b/i.test(text) && !/[A-D]\)/.test(question.questionText)) return "NUMERICAL";
  if (/\bfill in the blank|blank\b/i.test(text)) return "FILL_BLANK";
  return "SINGLE_CHOICE";
}

function questionTypeLabel(value: RichQuestionType) {
  return richQuestionTypes.find((type) => type.value === value)?.label || value.replace(/_/g, " ");
}

function inferUniversalQuestionType(question: QuestionDraft, signal?: PaperUnderstandingReport["questionSignals"][number]): UniversalQuestionType {
  const text = `${question.questionText} ${question.optionA} ${question.optionB} ${question.optionC} ${question.optionD}`.toLowerCase();
  const optionValues = [question.optionA, question.optionB, question.optionC, question.optionD].map((option) => cleanDraftText(option)).filter(Boolean);
  if (signal?.graphRisk || /\b(graph|chart|axis|plot|curve)\b/i.test(text)) return "GRAPH_BASED";
  if (signal?.tableRisk || /\b(table|tabular|column|row)\b/i.test(text)) return "TABLE_BASED";
  if (signal?.visualRequired || /\b(diagram|figure|circuit|structure|map|shown)\b/i.test(text)) return "DIAGRAM_BASED";
  if (/\b(assertion|reason)\b/i.test(text)) return "ASSERTION_REASON";
  if (/\b(match\s+the\s+following|column\s+i|column\s+ii)\b/i.test(text)) return "MATCHING";
  if (/\b(case study|passage|read the following|paragraph)\b/i.test(text)) return "PASSAGE_BASED";
  if (/\b(true|false)\b/i.test(text) && optionValues.length <= 2) return "TRUE_FALSE";
  if (/\b(integer|numerical|value of|find the value|calculate)\b/i.test(text) && optionValues.length < 3) return "NUMERICAL";
  if (/\bfill in the blank|blank\b/i.test(text)) return "FILL_BLANK";
  if (/\b(explain|describe|write short note|derive|prove)\b/i.test(text)) return text.length > 220 ? "LONG_ANSWER" : "SHORT_ANSWER";
  if (optionValues.filter((option) => !/^Option [A-D]$/i.test(option)).length >= 4) {
    const correct = question.correctAnswer.trim();
    return /[, ]/.test(correct) && correct.split(/[,\s]+/).filter(Boolean).length > 1 ? "MULTIPLE_ANSWER" : "SINGLE_CHOICE";
  }
  return text.trim() ? "UNKNOWN" : "MIXED_EXAM";
}

function universalQuestionTypeLabel(value: UniversalQuestionType | string) {
  const rich = richQuestionTypes.find((type) => type.value === value);
  if (rich) return rich.label;
  const labels: Record<string, string> = {
    TRUE_FALSE: "True / False",
    SHORT_ANSWER: "Short Answer",
    LONG_ANSWER: "Long Answer",
    PASSAGE_BASED: "Passage Based",
    TABLE_BASED: "Table Based",
    GRAPH_BASED: "Graph Based",
    DIAGRAM_BASED: "Diagram Based",
    MIXED_EXAM: "Mixed Exam",
    UNKNOWN: "Unknown",
  };
  return labels[value] || value.replace(/_/g, " ");
}

function optionsForUniversalQuestion(question: QuestionDraft, questionType: UniversalQuestionType) {
  if (questionType === "NUMERICAL" || questionType === "FILL_BLANK" || questionType === "SHORT_ANSWER" || questionType === "LONG_ANSWER" || questionType === "UNKNOWN" || questionType === "MIXED_EXAM") return [];
  const rawOptions = [
    { label: "A", text: cleanDraftOptionText(question.optionA, "A") },
    { label: "B", text: cleanDraftOptionText(question.optionB, "B") },
    { label: "C", text: cleanDraftOptionText(question.optionC, "C") },
    { label: "D", text: cleanDraftOptionText(question.optionD, "D") },
  ];
  if (questionType === "TRUE_FALSE") {
    const meaningful = rawOptions.filter((option) => !/^Option [A-D] requires review$/i.test(option.text));
    return meaningful.length ? meaningful.slice(0, 2) : [{ label: "A", text: "True" }, { label: "B", text: "False" }];
  }
  return rawOptions;
}

function reviewStatusFromMissingItems(missingItems: AiDraftQuestion["missingItems"], fallbackNeedsReview: boolean): AiDraftReviewStatus {
  if (missingItems.includes("Diagram")) return "MISSING_DIAGRAM";
  if (missingItems.includes("Formula")) return "MISSING_FORMULA";
  if (missingItems.includes("Option")) return "MISSING_OPTION";
  if (missingItems.includes("Answer")) return "MISSING_ANSWER";
  if (missingItems.includes("Solution")) return "MISSING_SOLUTION";
  return fallbackNeedsReview ? "NEEDS_REVIEW" : "READY";
}

function cleanDraftText(value: string) {
  return normalizeExtractedText(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(w:t|w:r|m:oMath|xml)\b/gi, " ")
    .replace(/\s+([,.;:?])/g, "$1")
    .replace(/\(\s+([A-D])\s+\)/g, "($1)")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDraftQuestionText(value: string) {
  const cleaned = cleanDraftText(value);
  if (!cleaned) return "Question text requires review against the preserved original paper.";
  return /[?.:]$/.test(cleaned) ? cleaned : `${cleaned}?`;
}

function cleanDraftOptionText(value: string, label: "A" | "B" | "C" | "D") {
  const cleaned = cleanDraftText(value).replace(new RegExp(`^\\(?${label}\\)?[\\).:-]?\\s*`, "i"), "").trim();
  return cleaned || `Option ${label} requires review`;
}

function aiQualityLabel(confidence: number, needsReview: number) {
  if (needsReview > 0 || confidence < 0.7) return "Needs Review";
  if (confidence < 0.85) return "Medium";
  return "High";
}

function qualityFromRatio(ratio: number) {
  if (ratio >= 0.9) return "High";
  if (ratio >= 0.7) return "Medium";
  return "Needs Review";
}

function hasStemNotation(value: string) {
  return /[∫√πθλΩ≈≤≥÷×∞Σµ₀-₉⁰-⁹]|\\(?:frac|sqrt|int|sum|lim|vec|begin)|\^|_\{|[a-z]\s*=\s*[^.,;]+/i.test(value);
}

function isFragmentedStemText(value: string) {
  const lines = value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const tinyFragments = lines.filter((line) => line.length <= 4 && /[a-z0-9=+\-*/()]/i.test(line)).length;
  return hasStemNotation(value) && tinyFragments >= 3;
}

function sourceReferenceLabel(mapping?: SourceReviewMapping) {
  if (!mapping) return undefined;
  return `Page ${mapping.page}`;
}

function buildUniversalExamDraft(input: {
  questions: QuestionDraft[];
  answerGuide: string;
  understanding: PaperUnderstandingReport;
  visualFidelity: VisualFidelityReport;
  importValidation: ImportValidationPayload | null;
  questionTypePlan: Array<{ number: number; selected: RichQuestionType }>;
  sourceReviewMappings: Record<number, SourceReviewMapping>;
  relationshipPlan: QuestionRelationshipPlan;
  readiness: ReturnType<typeof paperReadiness>;
  questionVisuals: Record<number, string>;
  visualAssets: QuestionVisualAsset[];
  formulaReviews: Record<number, FormulaReviewEntry>;
  uploadedQuestionPaper: string;
  questionSource: string;
  subject: string;
  stemOrFormulaPaperDetected: boolean;
}) {
  const answerMap = parseAnswerGuide(input.answerGuide);
  const validationMap = new Map((input.importValidation?.questionReports ?? []).map((report) => [report.number, report]));
  const draftQuestions: AiDraftQuestion[] = input.questions.map((question, index) => {
    const number = index + 1;
    const signal = input.understanding.questionSignals[index];
    const validation = validationMap.get(number);
    const answer = answerMap.get(number);
    const questionType = inferUniversalQuestionType(question, signal);
    const formulaReview = input.formulaReviews[number];
    const sourceMapping = input.sourceReviewMappings[number];
    const relationshipGroups = relationshipGroupsForQuestion(input.relationshipPlan, number);
    const stemText = `${question.questionText}\n${question.optionA}\n${question.optionB}\n${question.optionC}\n${question.optionD}`;
    const formulaRecovered = Boolean(formulaReview?.latex || (signal?.formulaRisk && hasStemNotation(stemText)));
    const formulaNeedsCrop = Boolean(signal?.formulaRisk && (!formulaReview?.latex || isFragmentedStemText(stemText)));
    const options = optionsForUniversalQuestion(question, questionType);
    const linkedAssets = [
      input.questionVisuals[number] ? "Question visual" : "",
      formulaRecovered ? "Formula" : "",
      signal?.tableRisk ? "Table" : "",
      signal?.graphRisk ? "Graph" : "",
      signal?.visualRequired ? "Diagram" : "",
      sourceMapping ? `Source page ${sourceMapping.page}` : "",
      relationshipGroups.length ? "Shared source" : "",
    ].filter(Boolean);
    const draftConfidence = typeof validation?.confidence === "number"
      ? Math.max(0, Math.min(1, validation.confidence / 100))
      : signal?.confidence === "HIGH" ? 0.92 : signal?.confidence === "MEDIUM" ? 0.74 : 0.52;
    const needsAsset = Boolean((signal?.visualRequired || signal?.tableRisk || signal?.graphRisk) && !input.questionVisuals[number] && input.visualAssets.length === 0);
    const missingItems: AiDraftQuestion["missingItems"] = [
      options.length > 0 && options.some((option) => /requires review/i.test(option.text)) ? "Option" : "",
      formulaNeedsCrop ? "Formula" : "",
      needsAsset || (signal?.visualRequired && !sourceMapping && !input.visualAssets.length) ? "Diagram" : "",
      input.answerGuide.trim() && !answer?.answer && !question.correctAnswer ? "Answer" : "",
      answer?.answer && !answer.explanation && !question.explanation ? "Solution" : "",
    ].filter((item): item is AiDraftQuestion["missingItems"][number] => Boolean(item));
    const missingAnswer = Boolean(input.answerGuide.trim() && !answer?.answer && !question.correctAnswer);
    const needsReview = draftConfidence < 0.8 || missingItems.length > 0 || formulaNeedsCrop || needsAsset || signal?.visualRequired || signal?.tableRisk || signal?.graphRisk || validation?.status === "MANUAL_CORRECTION_REQUIRED";
    const reviewStatus = reviewStatusFromMissingItems(missingItems, needsReview);
    const notes = [
      ...(signal?.notes ?? []),
      ...(validation?.issues ?? []),
      formulaNeedsCrop ? "Formula image and source crop preserved for review." : "",
      needsAsset ? "Diagram, graph or table source needs confirmation." : "",
      missingAnswer ? "Answer needs teacher confirmation." : "",
      relationshipGroups.length ? `${relationshipGroups.length} shared resource link(s) detected.` : "",
    ].filter(Boolean);

    return {
      number,
      questionText: cleanDraftQuestionText(question.questionText),
      options,
      questionType,
      draftConfidence,
      reviewStatus,
      linkedAssets,
      linkedAnswer: answer?.answer || question.correctAnswer || undefined,
      linkedSolution: answer?.explanation || question.explanation || undefined,
      recoveredFormula: formulaReview?.latex || (formulaRecovered ? cleanDraftText(stemText) : undefined),
      sourceReference: sourceReferenceLabel(sourceMapping) || (input.visualAssets.length ? "Original paper" : undefined),
      sourcePage: sourceMapping?.page || (input.visualAssets[0]?.pageNumber ?? undefined),
      boundingRegion: sourceMapping?.coordinates,
      originalCrop: input.questionVisuals[number],
      missingItems,
      originalCropRequired: reviewStatus !== "READY",
      notes: Array.from(new Set(notes)).slice(0, 4),
    };
  });

  if (!draftQuestions.length && (input.uploadedQuestionPaper || input.questionSource.trim())) {
    draftQuestions.push({
      number: 1,
      questionText: `${input.subject || "Exam"} paper preserved. NIDUS AI prepared this document for visual review before publishing.`,
      options: [],
      questionType: input.stemOrFormulaPaperDetected ? "MIXED_EXAM" : "UNKNOWN",
      draftConfidence: input.stemOrFormulaPaperDetected ? 0.58 : 0.45,
      reviewStatus: "NEEDS_REVIEW",
      linkedAssets: input.visualAssets.length ? input.visualAssets.slice(0, 8).map((asset) => asset.pageNumber ? `Page ${asset.pageNumber}` : asset.label) : ["Original document"],
      sourceReference: input.visualAssets.length ? "Original paper" : undefined,
      sourcePage: input.visualAssets[0]?.pageNumber,
      missingItems: ["Option", "Answer"],
      originalCropRequired: true,
      notes: ["No content was discarded. Open the review workspace to confirm the preserved source."],
    });
  }

  const answerKeysLinked = draftQuestions.filter((question) => question.linkedAnswer).length;
  const solutionsLinked = draftQuestions.filter((question) => question.linkedSolution).length;
  const needsReview = draftQuestions.filter((question) => question.reviewStatus !== "READY").length;
  const formulaReviewCount = draftQuestions.filter((question) => question.missingItems.includes("Formula") || question.recoveredFormula).length;
  const visualReviewCount = draftQuestions.filter((question) => question.missingItems.includes("Diagram") || question.linkedAssets.some((asset) => /diagram|graph|table|visual|page|source/i.test(asset))).length;
  const formulaTotal = Math.max(input.visualFidelity.formulaQuestionCount, input.understanding.questionSignals.filter((signal) => signal.formulaRisk).length);
  const formulaPreserved = draftQuestions.filter((question) => question.recoveredFormula || !input.understanding.questionSignals[question.number - 1]?.formulaRisk).length;
  const visualTotal = Math.max(input.visualFidelity.visualQuestionCount + input.visualFidelity.tableQuestionCount + input.visualFidelity.graphQuestionCount, input.understanding.questionSignals.filter((signal) => signal.visualRequired || signal.tableRisk || signal.graphRisk).length);
  const visualLinked = draftQuestions.filter((question) => {
    const signal = input.understanding.questionSignals[question.number - 1];
    return !(signal?.visualRequired || signal?.tableRisk || signal?.graphRisk) || question.linkedAssets.some((asset) => /visual|diagram|table|graph|source/i.test(asset));
  }).length;
  const questionCompletenessRatio = draftQuestions.length
    ? Math.max(0, 1 - ((input.readiness.missingOptions + input.readiness.duplicateQuestions.length) / Math.max(1, draftQuestions.length)))
    : 0;
  const answerCompletenessRatio = input.answerGuide.trim()
    ? answerKeysLinked / Math.max(1, draftQuestions.length)
    : 1;
  const averageConfidence = draftQuestions.length
    ? draftQuestions.reduce((total, question) => total + question.draftConfidence, 0) / draftQuestions.length
    : 0;
  const questionTypes = Array.from(new Set(draftQuestions.map((question) => universalQuestionTypeLabel(question.questionType))));
  const formulaRatio = formulaTotal ? formulaPreserved / Math.max(1, draftQuestions.length) : 1;
  const visualRatio = visualTotal ? visualLinked / Math.max(1, draftQuestions.length) : 1;
  const quality: AiDraftQuality = {
    formulaPreservation: qualityFromRatio(formulaRatio),
    visualPreservation: qualityFromRatio(visualRatio),
    questionCompleteness: qualityFromRatio(questionCompletenessRatio),
    answerCompleteness: qualityFromRatio(answerCompletenessRatio),
    overall: aiQualityLabel(Math.min(averageConfidence, formulaRatio, visualRatio, questionCompletenessRatio, answerCompletenessRatio), needsReview),
  };

  return {
    schema: "NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1",
    questions: draftQuestions,
    questionCount: draftQuestions.length,
    questionTypes: questionTypes.length ? questionTypes : ["Review Draft"],
    answerKeysLinked,
    solutionsLinked,
    formulaReviewCount,
    visualReviewCount,
    needsReview,
    quality,
    overallQuality: quality.overall,
    message: needsReview
      ? "AI built your draft and marked uncertain questions for review."
      : "AI built a clean draft for final teacher approval.",
    createdAt: new Date().toISOString(),
  } satisfies AiExamDraft;
}

function formulaReviewFromQuestion(question: QuestionDraft, signal?: PaperUnderstandingReport["questionSignals"][number]): FormulaReviewEntry | null {
  if (!signal?.formulaRisk) return null;
  return {
    latex: question.questionText,
    reviewStatus: "PENDING",
    updatedAt: new Date().toISOString(),
  };
}

function simpleTextHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function buildQuestionRelationshipPlan(input: {
  questions: QuestionDraft[];
  questionTypePlan: Array<{ number: number; selected: RichQuestionType }>;
  sections: PaperUnderstandingReport["sections"];
  sourceReviewMappings: Record<number, SourceReviewMapping>;
}): QuestionRelationshipPlan {
  const groups: QuestionRelationshipGroup[] = [];
  for (const section of input.sections) {
    const questionNumbers = Array.from({ length: section.questionCount }, (_, index) => section.startQuestion + index)
      .filter((number) => number >= 1 && number <= input.questions.length);
    if (questionNumbers.length > 1) {
      groups.push({
        id: `section-${section.startQuestion}`,
        type: "SECTION",
        title: section.title,
        questionNumbers,
        confidence: 0.88,
        reviewStatus: "AUTO_DETECTED",
      });
    }
  }

  const byPage = new Map<number, number[]>();
  for (const [numberRaw, mapping] of Object.entries(input.sourceReviewMappings)) {
    const number = Number(numberRaw);
    if (!number || !mapping.page) continue;
    byPage.set(mapping.page, [...(byPage.get(mapping.page) ?? []), number]);
  }
  for (const [page, questionNumbers] of byPage.entries()) {
    const uniqueNumbers = Array.from(new Set(questionNumbers)).sort((a, b) => a - b);
    if (uniqueNumbers.length > 1) {
      const firstMapping = input.sourceReviewMappings[uniqueNumbers[0]];
      groups.push({
        id: `source-page-${page}`,
        type: "SHARED_SOURCE_PAGE",
        title: `Source page ${page}`,
        questionNumbers: uniqueNumbers,
        sourcePage: page,
        sourceUploadId: firstMapping?.uploadId || null,
        importJobId: firstMapping?.importJobId || null,
        confidence: 0.82,
        reviewStatus: uniqueNumbers.every((number) => input.sourceReviewMappings[number]?.reviewStatus === "TEACHER_CONFIRMED") ? "TEACHER_REVIEWED" : "AUTO_DETECTED",
        note: "Questions share the same preserved source page and can be replayed together.",
      });
    }
  }

  const groupedTypes: Array<[RichQuestionType, QuestionRelationshipGroup["type"], string]> = [
    ["CASE_STUDY", "SHARED_PASSAGE", "Case study set"],
    ["DIAGRAM_LABEL", "SHARED_DIAGRAM", "Diagram label set"],
    ["MATCHING", "SHARED_TABLE", "Matching/table set"],
  ];
  for (const [questionType, groupType, title] of groupedTypes) {
    const questionNumbers = input.questionTypePlan.filter((item) => item.selected === questionType).map((item) => item.number);
    if (questionNumbers.length > 1) {
      groups.push({
        id: `${questionType.toLowerCase()}-${questionNumbers[0]}`,
        type: groupType,
        title,
        questionNumbers,
        confidence: 0.78,
        reviewStatus: "AUTO_DETECTED",
      });
    }
  }

  return {
    schema: "NIDUS_QUESTION_RELATIONSHIPS_V1",
    groups,
    sharedAssetQuestions: Array.from(new Set(groups.flatMap((group) => group.questionNumbers))).sort((a, b) => a - b),
    generatedAt: new Date().toISOString(),
  };
}

function relationshipGroupsForQuestion(plan: QuestionRelationshipPlan, questionNumber: number) {
  return plan.groups.filter((group) => group.questionNumbers.includes(questionNumber));
}

function buildImportReplayManifest(input: {
  uploads: ExamUploadRecord[];
  questions: QuestionDraft[];
  questionSource: string;
  sourceReviewCoverage: { confirmed: number; visualConfirmed: number; visualRequired: number };
}): ImportReplayManifest {
  const sourceUploads = input.uploads
    .filter((upload) => upload.sourceKind === "QUESTION_PAPER" || upload.sourceKind === "ANSWER_KEY")
    .map((upload) => ({
      uploadId: upload.id,
      importJobId: upload.importJobId || null,
      originalName: upload.originalName || upload.fileName,
      sourceKind: upload.sourceKind,
      documentClass: upload.documentClass,
      pipeline: upload.pipeline,
      extractionStatus: upload.extractionStatus,
      manualReviewCompleted: upload.manualReviewCompleted,
    }));
  return {
    schema: "NIDUS_IMPORT_REPLAY_V1",
    replayAvailable: sourceUploads.some((upload) => Boolean(upload.importJobId || upload.uploadId)),
    sourceUploads,
    lastKnownQuestionCount: input.questions.length,
    preservedQuestionTextHash: simpleTextHash(input.questionSource),
    sourceReviewCoverage: input.sourceReviewCoverage,
    replayModes: ["RECLASSIFY_DOCUMENT", "REEXTRACT_TEXT", "REBUILD_LAYOUT", "REVALIDATE_AI", "COMPARE_WITH_CURRENT_DRAFT"],
    createdAt: new Date().toISOString(),
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildImportQualityScore(input: {
  questionCount: number;
  readiness: ReturnType<typeof paperReadiness>;
  validation: ImportValidationPayload | null;
  visualFidelity: VisualFidelityReport;
  visualQuestionsWithoutAttachment: number[];
  sourceReviewCoverage: {
    publishReady: boolean;
    visualRequired: number;
    visualConfirmed: number;
  };
  formulaReviewCoverage: {
    required: number;
    confirmed: number;
    publishReady: boolean;
  };
  unapprovedQuestionNumbers: number[];
  extractionNeedsManualReview: boolean;
  manualPaperReview: boolean;
  relationshipPlan: QuestionRelationshipPlan;
  replayManifest: ImportReplayManifest;
}): ImportQualityScore {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];
  if (!input.questionCount) blockers.push("Review draft has no structured questions yet.");
  if (input.readiness.missingOptions) blockers.push(`${input.readiness.missingOptions} question(s) need valid options.`);
  if (input.readiness.missingAnswers) blockers.push(`${input.readiness.missingAnswers} question(s) need answer keys.`);
  if (input.readiness.duplicateQuestions.length) blockers.push(`${input.readiness.duplicateQuestions.length} duplicate question(s) found.`);
  if (!input.validation) blockers.push("NIDUS AI validation has not run.");
  if ((input.validation?.summary.manualCorrection ?? 0) > 0) blockers.push(`${input.validation?.summary.manualCorrection} question(s) need manual correction.`);
  if (input.visualFidelity.missingSourceForVisuals) blockers.push("Original source is missing for visual/table/graph questions.");
  if (input.visualQuestionsWithoutAttachment.length) blockers.push(`${input.visualQuestionsWithoutAttachment.length} visual question(s) need student-visible crops/images.`);
  if (!input.sourceReviewCoverage.publishReady) blockers.push("Original-paper source mapping is not fully confirmed.");
  if (!input.formulaReviewCoverage.publishReady) blockers.push("Formula rendering is not fully confirmed.");
  if (input.unapprovedQuestionNumbers.length) blockers.push(`${input.unapprovedQuestionNumbers.length} teacher-review question(s) are not approved.`);
  if (input.extractionNeedsManualReview && !input.manualPaperReview) blockers.push("Manual extraction review is not marked completed.");

  if ((input.validation?.summary.needsReview ?? 0) > 0) warnings.push(`${input.validation?.summary.needsReview} question(s) were flagged for review by AI.`);
  if (input.visualFidelity.questionsNeedingReview.length) warnings.push(`${input.visualFidelity.questionsNeedingReview.length} question(s) carry visual/formula/table review risk.`);
  if (!input.replayManifest.replayAvailable) warnings.push("Import replay is unavailable because preserved source metadata is incomplete.");
  if (!input.relationshipPlan.groups.length && input.questionCount > 8) warnings.push("No shared passage/diagram/section groups were detected.");

  if (input.validation?.publishReady) strengths.push("AI validation is publish-ready.");
  if (input.sourceReviewCoverage.publishReady) strengths.push("Source mapping is confirmed for visual risk.");
  if (input.formulaReviewCoverage.publishReady) strengths.push("Formula review is complete.");
  if (input.replayManifest.replayAvailable) strengths.push("Original paper can be reprocessed later.");
  if (input.relationshipPlan.groups.length) strengths.push("Related questions are grouped for rich exam replay.");

  const aiValidation = input.validation ? Math.max(0, Math.min(100, input.validation.averageConfidence - (input.validation.summary.manualCorrection * 18) - (input.validation.summary.needsReview * 4))) : 0;
  const paperReadiness = input.questionCount
    ? Math.max(0, 100 - (input.readiness.missingOptions * 20) - (input.readiness.missingAnswers * 22) - (input.readiness.duplicateQuestions.length * 30))
    : 0;
  const visualSource = input.visualFidelity.questionsNeedingReview.length
    ? Math.round((input.sourceReviewCoverage.visualConfirmed / Math.max(1, input.sourceReviewCoverage.visualRequired)) * 70) + (input.visualQuestionsWithoutAttachment.length ? 0 : 30)
    : 100;
  const formulaReview = input.formulaReviewCoverage.required
    ? Math.round((input.formulaReviewCoverage.confirmed / Math.max(1, input.formulaReviewCoverage.required)) * 100)
    : 100;
  const teacherApproval = input.unapprovedQuestionNumbers.length ? Math.max(0, 100 - input.unapprovedQuestionNumbers.length * 18) : 100;
  const relationshipModel = input.relationshipPlan.groups.length ? 100 : input.questionCount > 8 ? 78 : 92;
  const replayReadiness = input.replayManifest.replayAvailable ? 100 : 55;
  const score = clampScore(
    aiValidation * 0.24 +
    paperReadiness * 0.18 +
    visualSource * 0.16 +
    formulaReview * 0.12 +
    teacherApproval * 0.14 +
    relationshipModel * 0.07 +
    replayReadiness * 0.09
  );
  return {
    schema: "NIDUS_IMPORT_QUALITY_SCORE_V1",
    score,
    grade: score >= 92 ? "A" : score >= 82 ? "B" : score >= 70 ? "C" : "D",
    status: blockers.length ? "BLOCKED" : warnings.length ? "REVIEW_REQUIRED" : "PUBLISH_READY",
    subscores: {
      aiValidation: clampScore(aiValidation),
      paperReadiness: clampScore(paperReadiness),
      visualSource: clampScore(visualSource),
      formulaReview: clampScore(formulaReview),
      teacherApproval: clampScore(teacherApproval),
      relationshipModel: clampScore(relationshipModel),
      replayReadiness: clampScore(replayReadiness),
    },
    blockers,
    warnings,
    strengths,
    generatedAt: new Date().toISOString(),
  };
}

async function requestForm<T>(path: string, body: FormData) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(extractErrorMessage(raw, `Request failed: ${response.status}`));
  }
  return unwrap<T>(await response.json());
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseNumberedBlocks(text: string) {
  const normalized = (text
    ? normalizeExtractedText(text)
      .replace(/(^|\s)(Q\s*\d+\s*[\).])/gi, "\n$2")
      .replace(/\s+(?=\d+\s*[\).]\s+)/g, "\n")
    : "")
    .trim();
  if (!normalized) return [];
  const parts = normalized.split(/\n(?=\s*(?:Q\s*)?\d+\s*[\).])/gi);
  return parts
    .map((part) => part.trim())
    .filter((part) => /^(?:Q\s*)?\d+\s*[\).]/i.test(part));
}

function readUInt16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUInt32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

async function inflateZipEntry(bytes: Uint8Array, method: number) {
  if (method === 0) return bytes;
  if (method !== 8) throw new Error("Unsupported Word compression.");
  const Decompression = (globalThis as unknown as { DecompressionStream?: new (format: string) => TransformStream }).DecompressionStream;
  if (!Decompression) throw new Error("Word extraction is not supported in this browser.");
  const part = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const stream = new Blob([part]).stream().pipeThrough(new Decompression("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function xmlToPlainText(xml: string) {
  const paragraphs = xml
    .split(/<\/w:p>/i)
    .map((paragraph) => {
      const runs = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
        .map((match) => match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'"));
      return runs.join("");
    })
    .map((line) => line.trim())
    .filter(Boolean);
  return paragraphs.join("\n");
}

async function extractDocxText(file: File) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocdOffset = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(view, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("This Word file could not be opened.");

  const centralDirectorySize = readUInt32(view, eocdOffset + 12);
  const centralDirectoryOffset = readUInt32(view, eocdOffset + 16);
  const decoder = new TextDecoder();
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end && readUInt32(view, offset) === 0x02014b50) {
    const method = readUInt16(view, offset + 10);
    const compressedSize = readUInt32(view, offset + 20);
    const fileNameLength = readUInt16(view, offset + 28);
    const extraLength = readUInt16(view, offset + 30);
    const commentLength = readUInt16(view, offset + 32);
    const localHeaderOffset = readUInt32(view, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));

    if (name === "word/document.xml") {
      const localNameLength = readUInt16(view, localHeaderOffset + 26);
      const localExtraLength = readUInt16(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const uncompressed = await inflateZipEntry(compressed, method);
      return xmlToPlainText(decoder.decode(uncompressed));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error("No readable Word document body was found.");
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let previousY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y: number | null = Array.isArray(item.transform) ? Number(item.transform[5]) : previousY;
      if (previousY !== null && y !== null && Math.abs(y - previousY) > 2) lines.push("\n");
      lines.push(item.str, " ");
      previousY = y;
    }
    pages.push(lines.join("").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").trim());
  }
  return pages.join("\n\n");
}

async function renderPdfPageAssets(file: File): Promise<QuestionVisualAsset[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const assets: QuestionVisualAsset[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 12); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.35, 980 / Math.max(1, baseViewport.width));
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    assets.push({
      id: `${file.name}-${pageNumber}-${Date.now()}`,
      label: `Page ${pageNumber}`,
      fileName: file.name,
      pageNumber,
      dataUrl: canvas.toDataURL("image/jpeg", 0.78),
    });
  }
  return assets;
}

async function renderImageAsset(file: File): Promise<QuestionVisualAsset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
  return {
    id: `${file.name}-image-${Date.now()}`,
    label: "Image",
    fileName: file.name,
    dataUrl,
  };
}

function cropRegionLabel(region: VisualCropRegion) {
  if (region === "FULL") return "Full";
  if (region === "TOP") return "Top";
  if (region === "MIDDLE") return "Middle";
  return "Bottom";
}

function cropRegionBox(region: VisualCropRegion): CropBox {
  if (region === "TOP") return { x: 0, y: 0, width: 1, height: 1 / 3 };
  if (region === "MIDDLE") return { x: 0, y: 1 / 3, width: 1, height: 1 / 3 };
  if (region === "BOTTOM") return { x: 0, y: 2 / 3, width: 1, height: 1 / 3 };
  return { x: 0, y: 0, width: 1, height: 1 };
}

async function cropVisualAsset(dataUrl: string, region: VisualCropRegion): Promise<string> {
  if (region === "FULL") return dataUrl;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Unable to crop visual asset."));
    element.src = dataUrl;
  });
  const third = Math.floor(image.naturalHeight / 3);
  const sourceY = region === "TOP" ? 0 : region === "MIDDLE" ? third : third * 2;
  const sourceHeight = region === "BOTTOM" ? image.naturalHeight - sourceY : third;
  const outputWidth = Math.min(900, image.naturalWidth);
  const scale = outputWidth / Math.max(1, image.naturalWidth);
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function cropVisualAssetBox(dataUrl: string, box: CropBox): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Unable to crop selected visual area."));
    element.src = dataUrl;
  });
  const sourceX = Math.max(0, Math.round(box.x * image.naturalWidth));
  const sourceY = Math.max(0, Math.round(box.y * image.naturalHeight));
  const sourceWidth = Math.max(1, Math.round(box.width * image.naturalWidth));
  const sourceHeight = Math.max(1, Math.round(box.height * image.naturalHeight));
  const outputWidth = Math.min(1100, sourceWidth);
  const scale = outputWidth / Math.max(1, sourceWidth);
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", 0.86);
}

async function runOcrOnImage(dataUrl: string) {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(dataUrl, "eng");
  return result.data.text.trim();
}

function stripNumber(line: string) {
  return line.replace(/^\s*(?:Q\s*)?\d+\s*(?:[\).:-]|\u2013|\u2014)\s*/i, "").trim();
}

function stripQuestionNumber(line: string) {
  return line.replace(/^\s*(?:Q\s*)?(\d+)\s*[\).]\s*/i, "").trim();
}

function extractOptionText(block: string, option: "A" | "B" | "C" | "D") {
  const nextOption = option === "A" ? "B" : option === "B" ? "C" : option === "C" ? "D" : null;
  const pattern = nextOption
    ? new RegExp(`(?:^|\\s)[\\(\\[]?${option}[\\)\\].]\\s*([\\s\\S]*?)(?=\\s*[\\(\\[]?${nextOption}[\\)\\].]\\s*)`, "i")
    : new RegExp(`(?:^|\\s)[\\(\\[]?${option}[\\)\\].]\\s*([\\s\\S]*)$`, "i");
  const match = block.match(pattern);
  return match?.[1]?.trim().replace(/\s+/g, " ") || "";
}

function parseQuestionBlock(block: string, index: number) {
  const number = Number(block.match(/^\s*(?:Q\s*)?(\d+)\s*[\).]/i)?.[1] || index + 1);
  const normalized = block
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const withoutNumber = stripQuestionNumber(normalized);
  const firstOptionIndex = withoutNumber.search(/(?:^|\s)[\(\[]?A[\)\].]\s+/i);
  const questionText = (firstOptionIndex >= 0 ? withoutNumber.slice(0, firstOptionIndex) : withoutNumber)
    .trim()
    .replace(/\s+/g, " ");
  const optionText = firstOptionIndex >= 0 ? withoutNumber.slice(firstOptionIndex) : "";
  const optionA = extractOptionText(optionText, "A");
  const optionB = extractOptionText(optionText, "B");
  const optionC = extractOptionText(optionText, "C");
  const optionD = extractOptionText(optionText, "D");

  return { number, questionText, options: [optionA, optionB, optionC, optionD] };
}

function isWeakExtractedOption(option: string) {
  const cleaned = option.trim();
  if (!cleaned) return true;
  if (/^Option [A-D]$/i.test(cleaned)) return true;
  if (cleaned.length <= 2 && !/^\d+\s*\/\s*\d+$/.test(cleaned)) return true;
  return false;
}

function detectBrokenMathPdfExtraction(text: string) {
  const normalized = normalizeExtractedText(text);
  if (!normalized) return false;
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const shortMathFragments = lines.filter((line) => line.length <= 4 && /[a-z0-9=+\-*/()√]/i.test(line)).length;
  const mathSignals = /\b(mathematics|maths|algebra|geometry|trigonometry|calculus|direction cosines|direction ratios|vector|matrix|probability)\b|[√πθλΩ≈≤≥÷×∞Σµ]|\\frac|\b\d+\s*\/\s*\d+\b/i.test(normalized);
  const parsed = parseNumberedBlocks(normalized).map((block, index) => parseQuestionBlock(block, index));
  const weakOptionQuestions = parsed.filter((question) => question.options.filter((option) => !isWeakExtractedOption(option)).length < 2).length;
  return mathSignals && (shortMathFragments >= 6 || (parsed.length > 0 && weakOptionQuestions / parsed.length >= 0.4));
}

function parseAnswerGuide(text: string) {
  return parseAnswerGuideV2(text);
}

function parseAnswerGuideV2(text: string) {
  const map = new Map<number, { answer?: string; explanation?: string }>();
  const normalized = normalizeExtractedText(text)
    .replace(/\s+(?=Q\s*\d{1,3}\s*(?:[\).:-]|\u2013|\u2014))/gi, "\n")
    .replace(/\s+(?=\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)\s*\(?[A-D]\)?\b)/gi, "\n")
    .replace(
      /\s+(?=\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)\s*.{0,220}?\b(?:answer|ans|correct answer)\b\s*[:\-])/gi,
      "\n"
    )
    .trim();

  if (!normalized) return map;

  normalized
    .split(/\n(?=\s*(?:Q\s*)?\d{1,3}\s*(?:[\).:-]|\u2013|\u2014))/gi)
    .map((block) => block.trim())
    .filter((block) => /^(?:Q\s*)?\d{1,3}\s*(?:[\).:-]|\u2013|\u2014)/i.test(block))
    .forEach((block, index) => {
      const number = Number(block.match(/^\s*(?:Q\s*)?(\d+)/i)?.[1] || index + 1);
      const withoutNumber = stripNumber(block);
      const answerMatch = withoutNumber.match(/(?:^|\s)(?:answer|ans|correct answer)\s*[:\-]?\s*\(?([A-D])\)?\b/i)
        || withoutNumber.match(/^\s*\(?([A-D])\)?[\).:\-\s]/i);
      const answer = answerMatch?.[1]?.toUpperCase();
      const afterAnswer = answerMatch
        ? withoutNumber.slice((answerMatch.index || 0) + answerMatch[0].length)
        : withoutNumber;
      const explanationMatch = afterAnswer.match(/(?:explanation|reason)\s*[:\-]\s*([\s\S]*)/i);
      const explanation = (explanationMatch?.[1] || afterAnswer)
        .replace(/\s*(?:topic\/reference|reference|topic)\s*[:\-][\s\S]*$/i, "")
        .replace(/^\s*(?:[-:]|\u2013|\u2014)\s*/, "")
        .trim();

      if (answer || explanation) map.set(number, { answer, explanation });
    });

  if (map.size === 0) {
    [...normalized.matchAll(/(?:^|\s)(?:Q\s*)?(\d{1,3})\s*(?:[\).:\-]|\u2013|\u2014)?\s*\(?([A-D])\)?(?=\s|$)/gi)]
      .forEach((match) => {
        const number = Number(match[1]);
        const answer = match[2]?.toUpperCase();
        if (number && answer) map.set(number, { answer });
      });
  }

  return map;
}

function buildQuestions(source: string, answerGuide: string, topic: string, totalMarks: number): QuestionDraft[] {
  const answerGuideMap = parseAnswerGuide(answerGuide);
  const normalizedSource = normalizeExtractedText(source);
  const numberedBlocks = parseNumberedBlocks(normalizedSource);
  const blocks = numberedBlocks.length
    ? numberedBlocks
    : normalizedSource.trim()
      ? [normalizedSource.trim()]
      : [];
  const parsedQuestions = blocks.map((block, index) => {
    const parsed = parseQuestionBlock(block, index);
    const answerGuideEntry = answerGuideMap.get(parsed.number);
    return {
      questionText: parsed.questionText || block || "Question content preserved for teacher review.",
      optionA: parsed.options[0] || "",
      optionB: parsed.options[1] || "",
      optionC: parsed.options[2] || "",
      optionD: parsed.options[3] || "",
      correctAnswer: answerGuideEntry?.answer || "",
      explanation: answerGuideEntry?.explanation || "",
      marks: 1,
      negativeMarks: 0,
      difficultyLevel: "MEDIUM",
      topic: topic || "General",
      reviewStatus: parsed.options.filter((option) => !isWeakExtractedOption(option)).length >= 2 ? "APPROVED" : "NEEDS_REVIEW",
      aiConfidence: parsed.options.filter((option) => !isWeakExtractedOption(option)).length >= 2 ? 0.72 : 0.42,
    };
  });
  const perQuestionMarks = Math.max(1, Number(((Number.isFinite(totalMarks) ? totalMarks : 100) / Math.max(1, parsedQuestions.length)).toFixed(2)));
  return parsedQuestions.slice(0, 200).map((question) => ({ ...question, marks: perQuestionMarks }));
}

function inferSubjectFromText(source: string, fallback: string) {
  const text = source.toLowerCase();
  const signals: Array<[string, RegExp]> = [
    ["Mathematics", /\b(mathematics|maths|algebra|trigonometry|geometry|calculus|coordinate|probability|matrix|vector|quadratic)\b/i],
    ["Physics", /\b(physics|motion|force|velocity|acceleration|circuit|ray|lens|mirror|current|voltage|newton|projectile)\b/i],
    ["Chemistry", /\b(chemistry|mole|atomic|compound|reaction|acid|base|organic|periodic|valency)\b/i],
    ["English", /\b(english|grammar|synonym|antonym|passage|comprehension|sentence|idiom|vocabulary)\b/i],
    ["Reasoning", /\b(reasoning|series|coding|decoding|analogy|blood relation|direction|syllogism|venn)\b/i],
    ["General Studies", /\b(history|geography|polity|constitution|economics|current affairs|biology|science|gk)\b/i],
  ];
  return signals.find(([, pattern]) => pattern.test(text))?.[0] || fallback || "General";
}

function inferExamTypeFromText(source: string) {
  const upper = source.toUpperCase();
  for (const exam of ["NDA", "CDS", "AFCAT", "AGNIVEER", "SSB", "SSC", "RIMC", "AISSEE"]) {
    if (upper.includes(exam)) return exam;
  }
  if (/weekly\s+test/i.test(source)) return "Weekly Test";
  if (/scholarship/i.test(source)) return "Scholarship Exam";
  if (/mock\s+test/i.test(source)) return "Mock Test";
  return "Teacher Exam";
}

function detectMarkingScheme(source: string, questionCount: number, formTotalMarks: number) {
  const normalized = normalizeExtractedText(source);
  const perQuestionMatch = normalized.match(/(?:each question carries|each question|marks per question|marking)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:mark|marks)?/i)
    || normalized.match(/(\d+(?:\.\d+)?)\s*marks?\s*(?:each|per question)/i);
  const negativeMatch = normalized.match(/negative\s+mark(?:ing)?\s*[:\-]?\s*(\d+(?:\.\d+)?|1\/3|0\.33|0\.25|1\/4)/i)
    || normalized.match(/(?:minus|deduct(?:ion)?)\s*(\d+(?:\.\d+)?|1\/3|0\.33|0\.25|1\/4)/i);
  const marksPerQuestion = perQuestionMatch ? Number(perQuestionMatch[1]) : Math.max(1, Number((formTotalMarks / Math.max(1, questionCount)).toFixed(2)));
  const negativeRaw = negativeMatch?.[1];
  const negativeMarks = negativeRaw === "1/3" ? 0.33 : negativeRaw === "1/4" ? 0.25 : Number(negativeRaw || 0);
  return {
    marksPerQuestion: Number.isFinite(marksPerQuestion) ? marksPerQuestion : 1,
    negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : 0,
    totalMarks: formTotalMarks || Number((marksPerQuestion * questionCount).toFixed(2)),
    source: perQuestionMatch || negativeMatch ? "DETECTED" as const : "FORM_DEFAULT" as const,
  };
}

function detectSections(source: string, questionCount: number) {
  const lines = source.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const sections = lines
    .map((line) => {
      const match = line.match(/^(section|part)\s*[-:]?\s*([a-z0-9]+)?\s*[:\-]?\s*(.{0,80})$/i);
      if (!match) return null;
      const following = source.slice(source.indexOf(line));
      const nextQuestion = Number(following.match(/(?:Q\s*)?(\d+)\s*[\).]/i)?.[1] || 1);
      return { title: line.replace(/\s+/g, " "), startQuestion: nextQuestion, questionCount: 0 };
    })
    .filter((item): item is { title: string; startQuestion: number; questionCount: number } => Boolean(item));
  if (!sections.length) return [{ title: "Main Paper", startQuestion: 1, questionCount }];
  return sections.map((section, index) => {
    const next = sections[index + 1];
    return {
      ...section,
      questionCount: Math.max(0, (next?.startQuestion ?? questionCount + 1) - section.startQuestion),
    };
  });
}

function visualNotesForQuestion(question: QuestionDraft) {
  const text = [question.questionText, question.optionA, question.optionB, question.optionC, question.optionD].join(" ");
  const visualRequired = /\b(diagram|figure|fig\.|image|shown|following|above|below|circuit|ray diagram|map|triangle|triangles|geometry figure|geometrical figure|drawn|sketch)\b/i.test(text);
  const tableRisk = /\b(table|data table|tabular|column|row)\b/i.test(text);
  const graphRisk = /\b(graph|chart|bar graph|pie chart|line graph|plot)\b/i.test(text);
  const formulaRisk = /[∫√πθλΩ≈≤≥÷×∞Σµ]|\\frac|\^\s*\d|\b(sin|cos|tan|log|lim)\b|[a-z]\s*=\s*[^.,;]+/i.test(text);
  const notes = [
    visualRequired ? "Visual reference detected" : "",
    tableRisk ? "Table/data dependency detected" : "",
    graphRisk ? "Graph/chart dependency detected" : "",
    formulaRisk ? "Formula/symbol risk detected" : "",
  ].filter(Boolean);
  const confidence = visualRequired || tableRisk || graphRisk ? "LOW" : formulaRisk ? "MEDIUM" : "HIGH";
  return { visualRequired, formulaRisk, tableRisk, graphRisk, confidence: confidence as "HIGH" | "MEDIUM" | "LOW", notes };
}

function understandPaper(source: string, answerGuide: string, questions: QuestionDraft[], formTopic: string, formSubject: string, formMarks: number): PaperUnderstandingReport {
  const answerMap = parseAnswerGuide(answerGuide);
  const numbers = questions.map((_, index) => index + 1);
  const answerNumbers = Array.from(answerMap.keys()).sort((a, b) => a - b);
  const missing = numbers.filter((number) => !answerMap.has(number));
  const extra = answerNumbers.filter((number) => number > questions.length);
  const withExplanations = answerNumbers.filter((number) => Boolean(answerMap.get(number)?.explanation?.trim())).length;
  const questionSignals = questions.map((question, index) => ({ number: index + 1, ...visualNotesForQuestion(question) }));
  const visualCount = questionSignals.filter((signal) => signal.visualRequired).length;
  const formulaCount = questionSignals.filter((signal) => signal.formulaRisk).length;
  const tableCount = questionSignals.filter((signal) => signal.tableRisk).length;
  const graphCount = questionSignals.filter((signal) => signal.graphRisk).length;
  const warnings = [
    missing.length ? `${missing.length} question(s) do not have a parsed answer key.` : "",
    extra.length ? `${extra.length} answer key item(s) do not match extracted questions.` : "",
    visualCount ? `${visualCount} question(s) refer to diagrams/images that must be checked against the original paper.` : "",
    tableCount || graphCount ? `${tableCount + graphCount} question(s) may depend on tables, charts or graphs.` : "",
    formulaCount ? `${formulaCount} formula/symbol-heavy question(s) need faculty review.` : "",
  ].filter(Boolean);
  const blockers = [
    questions.length === 0 ? "Questions need teacher review before publishing." : "",
    missing.length === questions.length && questions.length > 0 ? "No answer key uploaded yet." : "",
  ].filter(Boolean);
  const solutionMode = answerNumbers.length && withExplanations === 0
    ? "ANSWER_KEY_ONLY"
    : withExplanations < answerNumbers.length
      ? "EXPLANATION_OPTIONAL"
      : "EXPLANATION_REQUIRED";
  const highRisk = blockers.length > 0 || visualCount + tableCount + graphCount > 0;
  const riskSignals: PaperUnderstandingReport["riskSignals"] = [];
  if (visualCount) riskSignals.push({ type: "VISUAL_REFERENCE", count: visualCount, severity: "HIGH", message: "Diagrams/images must be preserved or manually rebuilt." });
  if (tableCount) riskSignals.push({ type: "TABLE", count: tableCount, severity: "HIGH", message: "Table-based questions must be checked against source layout." });
  if (graphCount) riskSignals.push({ type: "GRAPH", count: graphCount, severity: "HIGH", message: "Graph/chart questions must be checked against source layout." });
  if (formulaCount) riskSignals.push({ type: "FORMULA", count: formulaCount, severity: "MEDIUM", message: "Formula rendering should be reviewed before publishing." });
  return {
    inferredExamType: inferExamTypeFromText(source),
    inferredSubject: inferSubjectFromText(source, formSubject),
    inferredTopic: inferExamTopic(source, formTopic),
    solutionMode,
    markingScheme: detectMarkingScheme(source, questions.length, formMarks),
    sections: detectSections(source, questions.length),
    answerKey: {
      entries: answerNumbers.length,
      missing,
      extra,
      withExplanations,
      mode: answerNumbers.length ? withExplanations ? "WITH_EXPLANATIONS" : "ANSWER_KEY_ONLY" : "NOT_FOUND",
    },
    riskSignals,
    questionSignals,
    warnings,
    blockers,
    confidence: blockers.length || highRisk ? "LOW" : warnings.length ? "MEDIUM" : "HIGH",
    createdAt: new Date().toISOString(),
  };
}

function buildVisualFidelityReport(report: PaperUnderstandingReport, uploads: ExamUploadRecord[]): VisualFidelityReport {
  const visualSignals = report.questionSignals.filter((signal) => signal.visualRequired);
  const formulaSignals = report.questionSignals.filter((signal) => signal.formulaRisk);
  const tableSignals = report.questionSignals.filter((signal) => signal.tableRisk);
  const graphSignals = report.questionSignals.filter((signal) => signal.graphRisk);
  const reviewSignals = report.questionSignals.filter((signal) => signal.visualRequired || signal.formulaRisk || signal.tableRisk || signal.graphRisk);
  const sourceUpload = uploads.find((upload) => upload.sourceKind === "QUESTION_PAPER") ?? null;
  const sourcePreviewAvailable = Boolean(sourceUpload?.localPreviewUrl || sourceUpload?.signedUrl || sourceUpload?.cloudinaryUrl);
  const questionsNeedingSource = Array.from(new Set([...visualSignals, ...tableSignals, ...graphSignals].map((signal) => signal.number))).sort((a, b) => a - b);
  const questionsNeedingReview = Array.from(new Set(reviewSignals.map((signal) => signal.number))).sort((a, b) => a - b);
  const missingSourceForVisuals = questionsNeedingSource.length > 0 && !sourcePreviewAvailable;
  const warnings = [
    visualSignals.length ? `${visualSignals.length} question(s) refer to a diagram, figure or image.` : "",
    tableSignals.length ? `${tableSignals.length} question(s) depend on table layout or tabular data.` : "",
    graphSignals.length ? `${graphSignals.length} question(s) depend on a graph or chart.` : "",
    formulaSignals.length ? `${formulaSignals.length} question(s) include formula or symbol risk.` : "",
  ].filter(Boolean);
  const blockers = [
    missingSourceForVisuals ? "Upload or preserve the original question paper before publishing visual/table/graph based questions." : "",
  ].filter(Boolean);
  return {
    sourcePreviewAvailable,
    visualQuestionCount: visualSignals.length,
    formulaQuestionCount: formulaSignals.length,
    tableQuestionCount: tableSignals.length,
    graphQuestionCount: graphSignals.length,
    questionsNeedingSource,
    questionsNeedingReview,
    missingSourceForVisuals,
    warnings,
    blockers,
    confidence: blockers.length ? "LOW" : questionsNeedingReview.length ? "MEDIUM" : "HIGH",
    createdAt: new Date().toISOString(),
  };
}

function detectTeacherDocumentType(file: File, text: string, sourceKind: ExtractionReport["sourceKind"], pageCount: number): TeacherDocumentType {
  const normalized = normalizeExtractedText(`${file.name}\n${text}`).toLowerCase();
  if (sourceKind === "ANSWER_KEY") return /solution|explanation|worked|steps?/i.test(normalized) ? "SOLUTION_DOCUMENT" : "ANSWER_KEY";
  if (!text.trim() && (pageCount > 0 || file.type.startsWith("image/"))) return "SCANNED_DOCUMENT";
  if (/\b(worksheet|practice sheet|exercise sheet|homework)\b/i.test(normalized)) return "WORKSHEET";
  if (/\b(notes|study material|handout|chapter summary)\b/i.test(normalized)) return "NOTES";
  if (/\b(chemistry|reaction|molecule|organic|inorganic|ionic|acid|base|chemical)\b/i.test(normalized)) return "CHEMISTRY_EXAM";
  if (/\b(physics|force|motion|current|circuit|optics|velocity|acceleration|thermodynamics|magnetic)\b/i.test(normalized)) return "PHYSICS_EXAM";
  if (/\b(biology|botany|zoology|cell|organism|genetics|human body)\b/i.test(normalized)) return "BIOLOGY_EXAM";
  if (/\b(math|mathematics|algebra|calculus|geometry|trigonometry|matrix|determinant|integral|derivative)\b|\\frac|√|∫|Σ|\^/i.test(normalized)) return "MATHEMATICS_EXAM";
  if (/\b(diagram|figure|shown|image|circuit|ray diagram|map)\b/i.test(normalized)) return "DIAGRAM_HEAVY";
  if (/\b(table|tabular|row|column)\b/i.test(normalized)) return "TABLE_HEAVY";
  if (/\b(graph|chart|plot|axis|axes)\b/i.test(normalized)) return "GRAPH_HEAVY";
  if (parseNumberedBlocks(text).length > 0) return "MCQ_EXAM";
  if (text.trim()) return "TEXT_EXAM";
  return "UNKNOWN";
}

function teacherDocumentLabel(type?: TeacherDocumentType) {
  const labels: Record<TeacherDocumentType, string> = {
    TEXT_EXAM: "Text Examination",
    MCQ_EXAM: "MCQ Examination",
    MATHEMATICS_EXAM: "Mathematics Examination",
    PHYSICS_EXAM: "Physics Examination",
    CHEMISTRY_EXAM: "Chemistry Examination",
    BIOLOGY_EXAM: "Biology Examination",
    DIAGRAM_HEAVY: "Diagram-heavy Paper",
    TABLE_HEAVY: "Table-heavy Paper",
    GRAPH_HEAVY: "Graph-heavy Paper",
    SCANNED_DOCUMENT: "Scanned Document",
    ANSWER_KEY: "Answer Key",
    SOLUTION_DOCUMENT: "Solution Document",
    WORKSHEET: "Worksheet",
    NOTES: "Notes",
    MIXED_DOCUMENT: "Mixed Examination",
    UNKNOWN: "Examination Document",
  };
  return labels[type || "UNKNOWN"];
}

function teacherPaperStyle(input: { text: string; report?: ExtractionReport; understanding: PaperUnderstandingReport; visualFidelity: VisualFidelityReport }) {
  const haystack = normalizeExtractedText(`${input.text} ${(input.report?.warnings ?? []).join(" ")}`).toLowerCase();
  if (input.visualFidelity.formulaQuestionCount || /\b(formula|fraction|matrix|integral|calculus|equation)\b|\\frac|√|∫|Σ/i.test(haystack)) return "Formula Heavy";
  if (input.visualFidelity.graphQuestionCount || /\b(graph|chart|axis|coordinate)\b/i.test(haystack)) return "Graph Heavy";
  if (input.visualFidelity.tableQuestionCount || /\b(table|tabular|row|column)\b/i.test(haystack)) return "Table Heavy";
  if (input.visualFidelity.visualQuestionCount || /\b(diagram|figure|circuit|map|structure)\b/i.test(haystack)) return "Diagram Heavy";
  if (/\b(case study|caselet)\b/i.test(haystack)) return "Case Study";
  if (/\b(passage|read the following|paragraph)\b/i.test(haystack)) return "Passage";
  if (input.understanding.answerKey.mode === "NOT_FOUND" && input.understanding.questionSignals.some((signal) => signal.confidence !== "HIGH")) return "Mixed";
  if (input.understanding.questionSignals.length && input.understanding.questionSignals.every((signal) => signal.confidence === "HIGH")) return "MCQ";
  return "Mixed";
}

function teacherDifficultyEstimate(input: { subject: string; style: string; visualFidelity: VisualFidelityReport; questionCount: number }) {
  if (/formula|graph|diagram|table/i.test(input.style) || isStemOrFormulaHeavySubject(input.subject)) return "Advanced";
  if (input.questionCount >= 80 || input.visualFidelity.questionsNeedingReview.length >= 5) return "High";
  if (input.questionCount >= 25) return "Moderate";
  return "Standard";
}

function confidenceLabel(value?: number) {
  if (!value) return "Pending";
  if (value >= 85) return "High";
  if (value >= 65) return "Medium";
  return "Needs Review";
}

function buildTeacherConfidence(sourceKind: ExtractionReport["sourceKind"], detectedQuestions: number, answerEntries: number, normalizedLength: number, visualRisk: boolean, pageCount: number) {
  const document = Math.max(45, Math.min(96, (normalizedLength ? 72 : 48) + (pageCount ? 8 : 0) - (visualRisk ? 8 : 0)));
  const question = sourceKind === "QUESTION_PAPER"
    ? Math.max(35, Math.min(96, detectedQuestions ? 70 + Math.min(20, detectedQuestions) - (visualRisk ? 8 : 0) : visualRisk || pageCount ? 58 : 42))
    : 0;
  const answer = sourceKind === "ANSWER_KEY"
    ? Math.max(35, Math.min(96, answerEntries ? 72 + Math.min(18, answerEntries) : normalizedLength ? 55 : 40))
    : 0;
  const relevant = sourceKind === "ANSWER_KEY" ? [document, answer] : [document, question];
  return {
    document,
    question,
    answer,
    overall: Math.round(relevant.reduce((sum, item) => sum + item, 0) / relevant.length),
  };
}

function auditExtractedSource(file: File, text: string, sourceKind: ExtractionReport["sourceKind"], isPdf: boolean, pageCount = 0): ExtractionReport {
  const normalized = normalizeExtractedText(text);
  const detectedQuestions = sourceKind === "QUESTION_PAPER" ? parseNumberedBlocks(normalized).length : parseAnswerGuide(normalized).size;
  const warnings: string[] = [];
  const blockers: string[] = [];
  const hasVisualReferences = /\b(diagram|figure|fig\.|graph|chart|table|circuit|image|shown|following|above|below|ray diagram|bar graph|pie chart|map|data table)\b/i.test(normalized);
  const hasFormulaSignals = /[∫√πθλΩ≈≤≥÷×∞Σµ]|\\frac|\^\s*\d|\b(sin|cos|tan|log|lim)\b|[a-z]\s*=\s*[^.,;]+/i.test(normalized);
  const brokenMathExtraction = sourceKind === "QUESTION_PAPER" && isPdf && detectBrokenMathPdfExtraction(text);
  const visualRisk = isPdf && (hasVisualReferences || hasFormulaSignals || brokenMathExtraction);
  const documentType = detectTeacherDocumentType(file, text, sourceKind, pageCount);
  const confidence = buildTeacherConfidence(sourceKind, sourceKind === "QUESTION_PAPER" ? detectedQuestions : 0, sourceKind === "ANSWER_KEY" ? detectedQuestions : 0, normalized.length, visualRisk, pageCount);

  if (!normalized) warnings.push("The original paper was preserved and needs review.");
  if (sourceKind === "QUESTION_PAPER" && normalized.length < 350) warnings.push("Some parts need teacher review before publishing.");
  if (sourceKind === "QUESTION_PAPER" && detectedQuestions === 0) warnings.push("Question draft needs review.");
  if (brokenMathExtraction) warnings.push("Formula-heavy paper detected. Review before publishing.");
  if (visualRisk) warnings.push("Diagram, formula, chart or table content needs review.");
  if (isPdf && /[^\x00-\x7F]/.test(normalized)) warnings.push("Special symbols were detected. Check formulas and units carefully.");
  if (isPdf && detectedQuestions > 0 && detectedQuestions < 5 && sourceKind === "QUESTION_PAPER") warnings.push("Only a few questions were detected from the PDF.");
  if (sourceKind === "ANSWER_KEY" && detectedQuestions === 0) warnings.push("Answer key needs review.");

  return {
    fileName: file.name,
    sourceKind,
    status: blockers.length ? "BLOCKED" : warnings.length ? "REVIEW_REQUIRED" : "READY",
    draftStatus: blockers.length ? "NEEDS_REVIEW" : warnings.length ? "NEEDS_REVIEW" : "DRAFT_READY",
    documentType,
    pageCount,
    confidence,
    textCharacters: normalized.length,
    detectedQuestions,
    warnings,
    blockers,
    visualRisk,
    createdAt: new Date().toISOString(),
  };
}

function shouldPreservePdfAsVisualReview(report: ExtractionReport, subject: string, text: string) {
  if (report.sourceKind !== "QUESTION_PAPER") return false;
  const documentType = report.documentType || "UNKNOWN";
  const stemDocument = ["MATHEMATICS_EXAM", "PHYSICS_EXAM", "CHEMISTRY_EXAM", "DIAGRAM_HEAVY", "TABLE_HEAVY", "GRAPH_HEAVY", "SCANNED_DOCUMENT"].includes(documentType);
  const stemSubject = isStemOrFormulaHeavySubject(subject);
  const formulaOrVisualRisk = report.visualRisk || detectBrokenMathPdfExtraction(text) || /[∫√πθλΩ≈≤≥÷×∞Σµ]|\\(?:frac|sqrt|int|sum|lim|vec|begin)|\b(matrix|determinant|circuit|diagram|graph|reaction|organic|coordinate|vector)\b/i.test(text);
  return stemDocument || stemSubject || formulaOrVisualRisk;
}

function preservedPdfReviewDraft(report: ExtractionReport, subject: string) {
  return [
    `${teacherDocumentLabel(report.documentType)} preserved for teacher review.`,
    `${subject || "STEM"} PDF detected. NIDUS will not trust the PDF text layer as the final question draft.`,
    "Review the original pages beside the AI draft so formulas, diagrams, tables, graphs, units and answer relationships stay correct.",
  ].join("\n");
}

function normalizeQuestionText(value?: string) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() || "";
}

function paperReadiness(questions: QuestionDraft[]) {
  const missingOptions = questions.filter((question) => [question.optionA, question.optionB, question.optionC, question.optionD]
    .some((option) => !option || /^Option [A-D]$/i.test(option))).length;
  const missingAnswers = questions.filter((question) => !/^[A-D]$/i.test(question.correctAnswer)).length;
  const missingExplanations = questions.filter((question) => !question.explanation || /^Explanation will be reviewed/i.test(question.explanation)).length;
  const seenQuestions = new Map<string, number>();
  const duplicateQuestions = questions.flatMap((question, index) => {
    const normalizedText = normalizeQuestionText(question.questionText);
    if (!normalizedText) return [];
    const firstIndex = seenQuestions.get(normalizedText);
    if (firstIndex !== undefined) return [{ index, firstIndex }];
    seenQuestions.set(normalizedText, index);
    return [];
  });
  return {
    missingOptions,
    missingAnswers,
    missingExplanations,
    duplicateQuestions,
    ready: questions.length > 0 && missingOptions === 0 && missingAnswers === 0 && missingExplanations === 0 && duplicateQuestions.length === 0,
  };
}

function statusLabel(status?: string) {
  const value = String(status || "DRAFT").replace(/_/g, " ").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function optionText(question: QuestionDraft, option: "A" | "B" | "C" | "D") {
  if (option === "A") return question.optionA;
  if (option === "B") return question.optionB;
  if (option === "C") return question.optionC;
  return question.optionD;
}

function inferExamTitle(source: string, subject: string, batchName?: string) {
  const upperSource = source.toUpperCase();
  const subjectTitle = subject && subject !== "General" ? subject : "Exam";
  if (upperSource.includes("MATHEMATICS MOCK TEST")) return "Mathematics Mock Test";
  const mockLine = source.split(/\n+/).map((line) => line.trim()).find((line) => /mock\s+test/i.test(line));
  if (mockLine) return mockLine.replace(/\s+/g, " ");
  return batchName ? `${subjectTitle} Test - ${batchName}` : `${subjectTitle} Test`;
}

function defaultExamTitle(subject: string, batchName?: string) {
  const subjectTitle = subject && subject !== "General" ? subject : "Exam";
  return batchName ? `${subjectTitle} Test - ${batchName}` : `${subjectTitle} Test`;
}

function isStemOrFormulaHeavySubject(subject: string) {
  return /\b(math|mathematics|physics|chemistry|engineering|jee|neet|mechanics|calculus|algebra|geometry|trigonometry|science)\b/i.test(subject);
}

function inferExamTopic(source: string, fallback: string) {
  const match = source.match(/Topics?\s*:\s*([\s\S]*?)(?=\n\s*(?:Q\s*)?\d+[\).]|\s+(?:Q\s*)?1[\).])/i);
  const topic = match?.[1]?.replace(/\s+/g, " ").trim();
  return topic || fallback || "General";
}

export function TeacherExamWorkspace({ batches, selectedBatchId, selectedSubject, exams, role = "TEACHER", loading, autoOpenCreatorKey, onSelectBatch, onRefresh }: Props) {
  const [activeBatchId, setActiveBatchId] = useState(selectedBatchId || batches[0]?.id || "");
  const activeBatch = useMemo(() => batches.find((batch) => batch.id === activeBatchId) || batches[0] || null, [activeBatchId, batches]);
  const subjectOptions = useMemo(() => {
    const options = Array.from(new Set((activeBatch?.subjects ?? []).map((item) => item.trim()).filter(Boolean)));
    return options.length ? options : ["General"];
  }, [activeBatch?.subjects]);
  const [targetBatchIds, setTargetBatchIds] = useState<string[]>(activeBatch?.id ? [activeBatch.id] : []);
  const [subject, setSubject] = useState(subjectOptions[0] || "General");
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [questionSource, setQuestionSource] = useState("");
  const [answerGuide, setAnswerGuide] = useState("");
  const [uploadedQuestionPaper, setUploadedQuestionPaper] = useState("");
  const [uploadedAnswerGuide, setUploadedAnswerGuide] = useState("");
  const [examUploads, setExamUploads] = useState<ExamUploadRecord[]>([]);
  const uploadPreviewUrlsRef = useRef<string[]>([]);
  const [visualAssets, setVisualAssets] = useState<QuestionVisualAsset[]>([]);
  const [questionVisuals, setQuestionVisuals] = useState<Record<number, string>>({});
  const [sourceReviewMappings, setSourceReviewMappings] = useState<Record<number, SourceReviewMapping>>({});
  const [formulaReviews, setFormulaReviews] = useState<Record<number, FormulaReviewEntry>>({});
  const [questionTypeOverrides, setQuestionTypeOverrides] = useState<Record<number, RichQuestionType>>({});
  const [extractionReports, setExtractionReports] = useState<ExtractionReport[]>([]);
  const [manualPaperReview, setManualPaperReview] = useState(false);
  const [questionReviewStatus, setQuestionReviewStatus] = useState<Record<number, "APPROVED" | "NEEDS_REVIEW">>({});
  const [ocrBusy, setOcrBusy] = useState(false);
  const [uploadState, setUploadState] = useState<TeacherUploadState>("IDLE");
  const [validationBusy, setValidationBusy] = useState(false);
  const [reconstructionBusy, setReconstructionBusy] = useState(false);
  const [importValidation, setImportValidation] = useState<ImportValidationPayload | null>(null);
  const [aiReconstruction, setAiReconstruction] = useState<AiReconstructionResult | null>(null);
  const [importAnalytics, setImportAnalytics] = useState<ImportAnalyticsPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultsExam, setResultsExam] = useState<TeacherExamRecord | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [editingExam, setEditingExam] = useState<TeacherExamRecord | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [handledAutoOpenKey, setHandledAutoOpenKey] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (selectedBatchId && selectedBatchId !== activeBatchId) setActiveBatchId(selectedBatchId);
  }, [activeBatchId, selectedBatchId]);

  useEffect(() => {
    if (activeBatch?.id && !targetBatchIds.length) setTargetBatchIds([activeBatch.id]);
  }, [activeBatch?.id, targetBatchIds.length]);

  useEffect(() => {
    if (subjectOptions.length && !subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
      setSubjectTouched(false);
    }
  }, [subject, subjectOptions]);

  useEffect(() => {
    if (!subjectTouched && selectedSubject && subjectOptions.includes(selectedSubject)) {
      setSubject(selectedSubject);
    }
  }, [selectedSubject, subjectOptions, subjectTouched]);

  const batchExams = useMemo(() => {
    if (!activeBatch) return [];
    return exams.filter((exam) => exam.batchId === activeBatch.id || exam.batchName === activeBatch.name);
  }, [activeBatch, exams]);
  const liveExamCount = batchExams.filter((exam) => !["ARCHIVED", "CANCELLED"].includes(String(exam.status || "").toUpperCase())).length;
  const submittedCount = batchExams.reduce((total, exam) => total + Number(exam.attemptStats?.submitted ?? 0), 0);
  const averageScoreSource = batchExams.filter((exam) => typeof exam.attemptStats?.averageScore === "number");
  const averageScore = averageScoreSource.length ? averageScoreSource.reduce((total, exam) => total + Number(exam.attemptStats?.averageScore ?? 0), 0) / averageScoreSource.length : 0;

  const questions = useMemo(() => buildQuestions(questionSource, answerGuide, form.topic, Number(form.marks)), [answerGuide, form.marks, form.topic, questionSource]);
  const readiness = useMemo(() => paperReadiness(questions), [questions]);
  const understanding = useMemo(
    () => understandPaper(questionSource, answerGuide, questions, form.topic, subject, Number(form.marks)),
    [answerGuide, form.marks, form.topic, questionSource, questions, subject]
  );
  const visualFidelity = useMemo(() => buildVisualFidelityReport(understanding, examUploads), [examUploads, understanding]);
  const persistedExamUploads = useMemo(() => examUploads.map(({ localPreviewUrl, ...upload }) => upload), [examUploads]);
  const visualQuestionsWithoutAttachment = useMemo(() => understanding.questionSignals
    .filter((signal) => (signal.visualRequired || signal.tableRisk || signal.graphRisk) && !questionVisuals[signal.number])
    .map((signal) => signal.number), [questionVisuals, understanding.questionSignals]);
  const reviewRequiredQuestionNumbers = useMemo(() => understanding.questionSignals
    .filter((signal) => signal.confidence !== "HIGH" || signal.visualRequired || signal.formulaRisk || signal.tableRisk || signal.graphRisk)
    .map((signal) => signal.number), [understanding.questionSignals]);
  const unapprovedQuestionNumbers = useMemo(() => reviewRequiredQuestionNumbers
    .filter((number) => questionReviewStatus[number] !== "APPROVED" && !manualPaperReview), [manualPaperReview, questionReviewStatus, reviewRequiredQuestionNumbers]);
  const blockingExtractionReports = useMemo(() => extractionReports.filter((report) => report.status === "BLOCKED" && report.sourceKind === "QUESTION_PAPER"), [extractionReports]);
  const reviewExtractionReports = useMemo(() => extractionReports.filter((report) => report.status !== "READY"), [extractionReports]);
  const questionPaperReport = useMemo(() => [...extractionReports].reverse().find((report) => report.sourceKind === "QUESTION_PAPER"), [extractionReports]);
  const answerKeyReport = useMemo(() => [...extractionReports].reverse().find((report) => report.sourceKind === "ANSWER_KEY"), [extractionReports]);
  const extractionNeedsManualReview = blockingExtractionReports.length > 0 || extractionReports.some((report) => report.visualRisk) || understanding.confidence === "LOW" || visualFidelity.confidence === "LOW";
  const stemOrFormulaPaperDetected = useMemo(() => (
    isStemOrFormulaHeavySubject(subject)
    || extractionReports.some((report) => report.visualRisk || /formula|math|layout|scanned/i.test([...report.warnings, ...report.blockers].join(" ")))
    || examUploads.some((upload) => /MATH|FORMULA|VISUAL|SCANNED|STEM/i.test(`${upload.documentClass || ""} ${upload.pipeline || ""}`))
  ), [examUploads, extractionReports, subject]);
  const validationRequired = questions.length > 0 && !editingExam;
  const validationBlocksPublish = validationRequired && (!importValidation || importValidation.summary.manualCorrection > 0);
  const validationReportMap = useMemo(() => new Map((importValidation?.questionReports ?? []).map((report) => [report.number, report])), [importValidation?.questionReports]);
  const validationHeatMap = useMemo(() => buildConfidenceHeatMap(importValidation), [importValidation]);
  const reviewImportId = useMemo(() => examUploads.find((upload) => upload.importJobId)?.importJobId || examUploads.find((upload) => upload.id)?.id || "", [examUploads]);
  const reviewWorkspaceUrl = reviewImportId ? `/dashboard/teacher/ndie-review?importId=${encodeURIComponent(reviewImportId)}` : "";
  const sourceReviewCoverage = useMemo(() => {
    const mappings = Object.values(sourceReviewMappings);
    const confirmed = mappings.filter((mapping) => mapping.reviewStatus === "TEACHER_CONFIRMED").length;
    const visualQuestions = new Set([...visualFidelity.questionsNeedingReview, ...visualQuestionsWithoutAttachment]);
    const confirmedVisual = Array.from(visualQuestions).filter((number) => sourceReviewMappings[number]?.reviewStatus === "TEACHER_CONFIRMED").length;
    return {
      totalMapped: mappings.length,
      confirmed,
      pending: Math.max(0, mappings.length - confirmed),
      visualRequired: visualQuestions.size,
      visualConfirmed: confirmedVisual,
      publishReady: visualQuestions.size === 0 || confirmedVisual >= visualQuestions.size,
    };
  }, [sourceReviewMappings, visualFidelity.questionsNeedingReview, visualQuestionsWithoutAttachment]);
  const formulaReviewCoverage = useMemo(() => {
    const formulaQuestions = understanding.questionSignals.filter((signal) => signal.formulaRisk).map((signal) => signal.number);
    const confirmed = formulaQuestions.filter((number) => formulaReviews[number]?.reviewStatus === "TEACHER_CONFIRMED").length;
    return {
      formulaQuestions,
      required: formulaQuestions.length,
      confirmed,
      pending: Math.max(0, formulaQuestions.length - confirmed),
      publishReady: formulaQuestions.length === 0 || confirmed >= formulaQuestions.length,
    };
  }, [formulaReviews, understanding.questionSignals]);
  const questionTypePlan = useMemo(() => questions.map((question, index) => {
    const number = index + 1;
    const inferred = inferRichQuestionType(question, understanding.questionSignals[index]);
    return {
      number,
      inferred,
      selected: questionTypeOverrides[number] || inferred,
    };
  }), [questionTypeOverrides, questions, understanding.questionSignals]);
  const questionTypeDistribution = useMemo(() => questionTypePlan.reduce<Record<string, number>>((acc, item) => {
    acc[item.selected] = (acc[item.selected] || 0) + 1;
    return acc;
  }, {}), [questionTypePlan]);
  const questionRelationshipPlan = useMemo(() => buildQuestionRelationshipPlan({
    questions,
    questionTypePlan,
    sections: understanding.sections,
    sourceReviewMappings,
  }), [questionTypePlan, questions, sourceReviewMappings, understanding.sections]);
  const importReplayManifest = useMemo(() => buildImportReplayManifest({
    uploads: persistedExamUploads,
    questions,
    questionSource,
    sourceReviewCoverage,
  }), [persistedExamUploads, questionSource, questions, sourceReviewCoverage]);
  const importQualityScore = useMemo(() => buildImportQualityScore({
    questionCount: questions.length,
    readiness,
    validation: importValidation,
    visualFidelity,
    visualQuestionsWithoutAttachment,
    sourceReviewCoverage,
    formulaReviewCoverage,
    unapprovedQuestionNumbers,
    extractionNeedsManualReview,
    manualPaperReview,
    relationshipPlan: questionRelationshipPlan,
    replayManifest: importReplayManifest,
  }), [extractionNeedsManualReview, formulaReviewCoverage, importReplayManifest, importValidation, manualPaperReview, questionRelationshipPlan, questions.length, readiness, sourceReviewCoverage, unapprovedQuestionNumbers, visualFidelity, visualQuestionsWithoutAttachment]);
  const importQualityDraft = useMemo(() => importValidation ? {
    schema: "NIDUS_IMPORT_QUALITY_V1",
    qualityScore: importQualityScore,
    averageConfidence: importValidation.averageConfidence,
    highConfidenceQuestions: validationHeatMap.high,
    reviewQuestions: validationHeatMap.review,
    manualFixQuestions: validationHeatMap.fix,
    sourceReviewCoverage,
    formulaReviewCoverage,
    questionTypeDistribution,
    relationshipGroups: questionRelationshipPlan.groups.length,
    replayAvailable: importReplayManifest.replayAvailable,
    publishReady: importValidation.publishReady,
    generatedAt: importValidation.createdAt,
  } : {
    schema: "NIDUS_IMPORT_QUALITY_V1",
    qualityScore: importQualityScore,
    averageConfidence: 0,
    highConfidenceQuestions: [],
    reviewQuestions: [],
    manualFixQuestions: [],
    sourceReviewCoverage,
    formulaReviewCoverage,
    questionTypeDistribution,
    relationshipGroups: questionRelationshipPlan.groups.length,
    replayAvailable: importReplayManifest.replayAvailable,
    publishReady: false,
    generatedAt: importQualityScore.generatedAt,
  }, [formulaReviewCoverage, importQualityScore, importReplayManifest.replayAvailable, importValidation, questionRelationshipPlan.groups.length, questionTypeDistribution, sourceReviewCoverage, validationHeatMap]);
  const aiExamDraft = useMemo(() => buildUniversalExamDraft({
    questions,
    answerGuide,
    understanding,
    visualFidelity,
    importValidation,
    questionTypePlan,
    sourceReviewMappings,
    relationshipPlan: questionRelationshipPlan,
    readiness,
    questionVisuals,
    visualAssets,
    formulaReviews,
    uploadedQuestionPaper,
    questionSource,
    subject,
    stemOrFormulaPaperDetected,
  }), [answerGuide, formulaReviews, importValidation, questionRelationshipPlan, questionSource, questionTypePlan, questionVisuals, questions, readiness, sourceReviewMappings, stemOrFormulaPaperDetected, subject, understanding, uploadedQuestionPaper, visualAssets, visualFidelity]);
  const effectiveAiDraft = aiReconstruction?.draft ?? aiExamDraft;
  const reconstructionRecommended = aiExamDraft.overallQuality !== "High" || aiExamDraft.needsReview > 0 || (importValidation ? importValidation.averageConfidence < 82 || !importValidation.publishReady : false);
  const teacherDetectedStyle = useMemo(() => teacherPaperStyle({
    text: questionSource,
    report: questionPaperReport,
    understanding,
    visualFidelity,
  }), [questionPaperReport, questionSource, understanding, visualFidelity]);
  const teacherDifficulty = useMemo(() => teacherDifficultyEstimate({
    subject,
    style: teacherDetectedStyle,
    visualFidelity,
    questionCount: effectiveAiDraft.questionCount || questions.length,
  }), [effectiveAiDraft.questionCount, questions.length, subject, teacherDetectedStyle, visualFidelity]);
  const teacherReviewConfidence = questionPaperReport?.confidence?.overall ?? (effectiveAiDraft.overallQuality === "High" ? 88 : effectiveAiDraft.overallQuality === "Medium" ? 72 : questions.length ? 58 : undefined);
  const canPublishPaper = questions.length > 0 && readiness.missingOptions === 0 && readiness.missingAnswers === 0 && !visualFidelity.missingSourceForVisuals && visualQuestionsWithoutAttachment.length === 0 && sourceReviewCoverage.publishReady && formulaReviewCoverage.publishReady && unapprovedQuestionNumbers.length === 0 && !validationBlocksPublish && (!extractionNeedsManualReview || manualPaperReview || reviewRequiredQuestionNumbers.length === 0);
  const effectiveTopic = useMemo(() => inferExamTopic(questionSource, form.topic), [form.topic, questionSource]);
  const effectiveTitle = useMemo(() => form.title.trim() || inferExamTitle(questionSource, subject, activeBatch?.name), [activeBatch?.name, form.title, questionSource, subject]);
  const questionsForPublish = useMemo(() => questions.map((question, index) => {
    const signal = understanding.questionSignals[index];
    const validationReport = validationReportMap.get(index + 1);
    const visualReviewNotes = signal?.notes ?? [];
    const sourceUpload = examUploads.find((upload) => upload.sourceKind === "QUESTION_PAPER");
    const sourceDocumentId = sourceUpload?.importJobId || sourceUpload?.id;
    const aiConfidence = typeof validationReport?.confidence === "number" ? validationReport.confidence / 100 : signal?.confidence === "HIGH" ? 0.92 : signal?.confidence === "MEDIUM" ? 0.72 : 0.48;
    const sourceMapping = sourceReviewMappings[index + 1] || defaultSourceMapping({
      questionNumber: index + 1,
      questionCount: questions.length,
      uploads: examUploads,
      assets: visualAssets,
      confidence: aiConfidence,
    });
    const sourceReference = sourceReferenceFromMapping(sourceMapping);
    const selectedQuestionType = questionTypeOverrides[index + 1] || inferRichQuestionType(question, signal);
    const formulaReview = formulaReviews[index + 1] || formulaReviewFromQuestion(question, signal);
    const relationshipGroups = relationshipGroupsForQuestion(questionRelationshipPlan, index + 1);
    const reviewStatus = validationReport?.status === "MANUAL_CORRECTION_REQUIRED"
      ? "NEEDS_REVIEW"
      : manualPaperReview || validationReport?.status === "AUTO_APPROVED" || !signal || signal.confidence === "HIGH" || questionReviewStatus[index + 1] === "APPROVED" ? "APPROVED" : "NEEDS_REVIEW";
    const reconstructedQuestion = cleanDraftQuestionText(question.questionText);
    const reconstructedOptionA = cleanDraftOptionText(question.optionA, "A");
    const reconstructedOptionB = cleanDraftOptionText(question.optionB, "B");
    const reconstructedOptionC = cleanDraftOptionText(question.optionC, "C");
    const reconstructedOptionD = cleanDraftOptionText(question.optionD, "D");
    const reviewedExplanation = question.explanation && !/^Explanation will be reviewed/i.test(question.explanation)
      ? cleanDraftText(question.explanation)
      : `The correct answer is option ${question.correctAnswer}. Review this answer against the uploaded faculty key and topic notes.`;
    return {
      ...question,
      questionText: reconstructedQuestion,
      optionA: reconstructedOptionA,
      optionB: reconstructedOptionB,
      optionC: reconstructedOptionC,
      optionD: reconstructedOptionD,
      questionImage: questionVisuals[index + 1] || question.questionImage,
      visualReviewRequired: Boolean(signal && (signal.visualRequired || signal.tableRisk || signal.graphRisk || signal.formulaRisk)),
      visualReviewNotes,
      contentJson: buildNidusQuestionContent({
        questionText: reconstructedQuestion,
        questionImage: questionVisuals[index + 1] || question.questionImage,
        optionA: reconstructedOptionA,
        optionB: reconstructedOptionB,
        optionC: reconstructedOptionC,
        optionD: reconstructedOptionD,
        correctAnswer: question.correctAnswer,
        explanation: reviewedExplanation,
        questionType: selectedQuestionType,
        formulaLatex: formulaReview?.latex,
        formulaReviewStatus: formulaReview?.reviewStatus,
        sourceDocumentId,
        sourceUploadId: sourceUpload?.id || null,
        importJobId: sourceUpload?.importJobId || null,
        page: sourceMapping.page,
        sourceReference,
        subject,
        topic: effectiveTopic,
        difficulty: question.difficultyLevel,
        marks: understanding.markingScheme.marksPerQuestion || question.marks,
        negativeMarks: understanding.markingScheme.negativeMarks,
        aiConfidence,
        reviewStatus,
        visualReviewNotes,
        relationshipGroups,
        importReplay: {
          available: importReplayManifest.replayAvailable,
          sourceUploadIds: importReplayManifest.sourceUploads.map((upload) => upload.uploadId),
          sourceHash: importReplayManifest.preservedQuestionTextHash,
        },
        importQualityScore: {
          score: importQualityScore.score,
          grade: importQualityScore.grade,
          status: importQualityScore.status,
        },
      }),
      sourceDocumentId,
      sourcePageNumber: sourceMapping.page,
      boundingBoxes: {
        schema: "NIDUS_PAGE_COORDINATES_V1",
        question: {
          page: sourceMapping.page,
          ...normalizeCropBox(sourceMapping.coordinates),
        },
        sourceReview: sourceMapping,
      },
      latex: {},
      assets: {
        questionImage: questionVisuals[index + 1] || question.questionImage || null,
        sourceUploadId: sourceUpload?.id || null,
        importJobId: sourceUpload?.importJobId || null,
        sourceReference,
        formulaReview,
        sourceReview: sourceMapping,
        relationshipGroups,
        importReplay: {
          available: importReplayManifest.replayAvailable,
          sourceUploadIds: importReplayManifest.sourceUploads.map((upload) => upload.uploadId),
          sourceHash: importReplayManifest.preservedQuestionTextHash,
        },
        importQualityScore: {
          score: importQualityScore.score,
          grade: importQualityScore.grade,
          status: importQualityScore.status,
        },
      },
      layout: {
        documentClass: sourceUpload?.documentClass || "UNKNOWN",
        pipeline: sourceUpload?.pipeline || "UNCLASSIFIED",
        schema: "NIDUS_QUESTION_CONTENT_V1",
        confidenceHeat: confidenceHeatTone(validationReport?.confidence, validationReport?.status),
        pageCoordinateSystem: "NORMALIZED_0_1",
        sourceReviewStatus: sourceMapping.reviewStatus,
        intendedQuestionType: selectedQuestionType,
        formulaReviewStatus: formulaReview?.reviewStatus || "NOT_REQUIRED",
        relationshipGroupIds: relationshipGroups.map((group) => group.id),
        importReplaySchema: importReplayManifest.schema,
        importQualityScore: importQualityScore.score,
        importQualityGrade: importQualityScore.grade,
      },
      renderMode: selectedQuestionType !== "SINGLE_CHOICE" ? "RICH_QUESTION_TYPE_COMPAT" : signal?.formulaRisk ? "RICH_MATH_REVIEWED" : questionVisuals[index + 1] ? "RICH_VISUAL_MCQ" : "LEGACY_MCQ",
      aiConfidence,
      reviewStatus,
      publishedVersion: 1,
      explanation: reviewedExplanation,
      marks: understanding.markingScheme.marksPerQuestion || question.marks,
      negativeMarks: understanding.markingScheme.negativeMarks,
    };
  }), [effectiveTopic, examUploads, formulaReviews, importQualityScore, importReplayManifest, manualPaperReview, questionRelationshipPlan, questionReviewStatus, questionTypeOverrides, questionVisuals, questions, sourceReviewMappings, subject, understanding.markingScheme.marksPerQuestion, understanding.markingScheme.negativeMarks, understanding.questionSignals, validationReportMap, visualAssets]);
  const duplicateQuestionIndexes = useMemo(() => new Set(readiness.duplicateQuestions.flatMap((item) => [item.firstIndex, item.index])), [readiness.duplicateQuestions]);

  useEffect(() => () => {
    uploadPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    uploadPreviewUrlsRef.current = [];
  }, []);

  useEffect(() => {
    if (subjectTouched || !questionSource || !subjectOptions.length) return;
    if (subjectOptions.includes(understanding.inferredSubject) && subject !== understanding.inferredSubject) {
      setSubject(understanding.inferredSubject);
    }
  }, [questionSource, subject, subjectOptions, subjectTouched, understanding.inferredSubject]);

  function chooseSubject(nextSubject: string) {
    const previousAutoTitle = defaultExamTitle(subject, activeBatch?.name);
    const nextAutoTitle = defaultExamTitle(nextSubject, activeBatch?.name);
    setSubject(nextSubject);
    setSubjectTouched(true);
    setForm((current) => ({
      ...current,
      title: !current.title.trim() || current.title === previousAutoTitle ? nextAutoTitle : current.title,
      topic: current.topic === subject ? nextSubject : current.topic,
    }));
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("subject", nextSubject);
      window.history.replaceState(null, "", url.toString());
    }
  }

  useEffect(() => {
    if (!autoOpenCreatorKey || autoOpenCreatorKey === handledAutoOpenKey || !activeBatch) return;
    setHandledAutoOpenKey(autoOpenCreatorKey);
    openCreator();
  }, [activeBatch, autoOpenCreatorKey, handledAutoOpenKey]);

  function openBatch(batchId: string) {
    setActiveBatchId(batchId);
    setSubjectTouched(false);
    setTargetBatchIds((ids) => ids.length ? Array.from(new Set([...ids, batchId])) : [batchId]);
    onSelectBatch(batchId);
  }

  function toggleTargetBatch(batchId: string) {
    setTargetBatchIds((ids) => ids.includes(batchId) ? ids.filter((id) => id !== batchId) : [...ids, batchId]);
  }

  async function refreshImportAnalytics(batchId = activeBatch?.id) {
    if (!batchId) return;
    try {
      const result = await requestJson<{ analytics: ImportAnalyticsPayload }>(`/api/academy/exams/import/analytics?batchId=${encodeURIComponent(batchId)}`);
      setImportAnalytics(result.analytics);
    } catch {
      setImportAnalytics(null);
    }
  }

  useEffect(() => {
    if (!activeBatch?.id) return;
    let cancelled = false;
    requestJson<{ analytics: ImportAnalyticsPayload }>(`/api/academy/exams/import/analytics?batchId=${encodeURIComponent(activeBatch.id)}`)
      .then((result) => {
        if (!cancelled) setImportAnalytics(result.analytics);
      })
      .catch(() => {
        if (!cancelled) setImportAnalytics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeBatch?.id]);

  async function preserveExamSource(file: File, sourceKind: ExtractionReport["sourceKind"], report: ExtractionReport) {
    if (!activeBatch?.id) throw new Error("Select a batch before uploading exam source files.");
    const body = new FormData();
    body.append("file", file);
    body.append("batchId", activeBatch.id);
    body.append("subject", subject);
    body.append("topic", form.topic || effectiveTopic || "General");
    body.append("sourceKind", sourceKind);
    body.append("extractionStatus", report.status);
    body.append("documentClass", report.documentType || (report.textCharacters === 0 ? "SCANNED_DOCUMENT" : report.visualRisk ? "MATH_VISUAL_DOCUMENT" : "TEXT_DOCUMENT"));
    body.append("pipeline", report.textCharacters === 0 ? "OCR_REVIEW" : report.visualRisk ? "MATH_LAYOUT_REVIEW" : "TEXT_EXTRACTION_REVIEW");
    body.append("manualReviewRequired", String(report.status === "BLOCKED" || report.visualRisk));
    body.append("manualReviewCompleted", String(manualPaperReview));
    body.append("extractionAudit", JSON.stringify({ ...report, paperUnderstanding: understanding, visualFidelity }));
    const result = await requestForm<{ upload: ExamUploadRecord }>("/api/academy/exams/uploads", body);
    const localPreviewUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : undefined;
    if (localPreviewUrl) uploadPreviewUrlsRef.current.push(localPreviewUrl);
    const uploadWithPreview = { ...result.upload, localPreviewUrl };
    setExamUploads((uploads) => [
      ...uploads.filter((upload) => !(upload.sourceKind === sourceKind && upload.originalName === file.name)),
      uploadWithPreview,
    ]);
    void refreshImportAnalytics(activeBatch.id);
    return uploadWithPreview;
  }

  async function appendFileText(file: File | null, setter: (value: string) => void, current: string, sourceKind: ExtractionReport["sourceKind"], setUploadedName?: (value: string) => void) {
    if (!file) return;
    setUploadedName?.(file.name);
    setUploadState("ANALYZING_DOCUMENT");
    try {
      const fileName = file.name.toLowerCase();
      const isTxt = file.type.startsWith("text/") || fileName.endsWith(".txt");
      const isDocx = fileName.endsWith(".docx");
      const isLegacyDoc = fileName.endsWith(".doc");
      const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";
      const isBrowserImage = /\.(jpe?g|png|webp)$/i.test(fileName) || /image\/(jpeg|png|webp)/i.test(file.type);
      const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|tiff?|heic|heif)$/i.test(fileName);
      if (!isTxt && !isDocx && !isLegacyDoc && !isPdf && !isImage) {
        setUploadState("UNSUPPORTED_DOCUMENT");
        setMessage("Unsupported File. Please upload a PDF, Word document, TXT, JPG, PNG, WEBP, TIFF or HEIC file.");
        return;
      }
      let renderedPageCount = isImage ? 1 : 0;
      if (sourceKind === "QUESTION_PAPER" && isPdf) {
        const assets = await renderPdfPageAssets(file).catch(() => []);
        renderedPageCount = assets.length;
        if (assets.length) setVisualAssets((current) => [...current.filter((asset) => asset.fileName !== file.name), ...assets]);
      }
      if (sourceKind === "QUESTION_PAPER" && isBrowserImage) {
        const asset = await renderImageAsset(file);
        setVisualAssets((current) => [...current.filter((item) => item.fileName !== file.name), asset]);
      }
      setUploadState("UNDERSTANDING_PAPER");
      let text = isDocx ? await extractDocxText(file) : isPdf ? await extractPdfText(file) : isTxt ? await file.text().catch(() => "") : "";
      if (!text.trim() && (isPdf || isBrowserImage)) {
        const ocrAssets = isBrowserImage ? [await renderImageAsset(file)] : await renderPdfPageAssets(file).catch(() => []);
        if (ocrAssets.length) {
          setOcrBusy(true);
          setMessage("Understanding paper...");
          const ocrText = await Promise.all(ocrAssets.slice(0, 8).map(async (asset) => {
            const pageText = await runOcrOnImage(asset.dataUrl).catch(() => "");
            return pageText ? `Page ${asset.pageNumber || 1}\n${pageText}` : "";
          }));
          text = ocrText.filter(Boolean).join("\n\n");
          setOcrBusy(false);
          renderedPageCount = Math.max(renderedPageCount, ocrAssets.length);
          if (sourceKind === "QUESTION_PAPER" && ocrAssets.length) setVisualAssets((current) => [...current.filter((asset) => asset.fileName !== file.name), ...ocrAssets]);
        }
      }
      const pageCount = renderedPageCount;
      let report = auditExtractedSource(file, text, sourceKind, isPdf, pageCount);
      const preservePdfAsVisualReview = isPdf && shouldPreservePdfAsVisualReview(report, subject, text);
      if (preservePdfAsVisualReview) {
        report = {
          ...report,
          status: "REVIEW_REQUIRED",
          draftStatus: "NEEDS_REVIEW",
          visualRisk: true,
          warnings: Array.from(new Set([
            ...report.warnings,
            "STEM PDF detected. Review against original pages before publishing.",
          ])),
        };
      }
      setUploadState("BUILDING_AI_DRAFT");
      setExtractionReports((reports) => [...reports.filter((item) => !(item.sourceKind === sourceKind && item.fileName === file.name)), report]);
      let preserved = false;
      try {
        await preserveExamSource(file, sourceKind, report);
        preserved = true;
      } catch (uploadError) {
        setMessage(uploadError instanceof Error ? `NIDUS could not save this upload yet: ${uploadError.message}` : "NIDUS could not save this upload yet. Please try again.");
      }
      if (sourceKind === "QUESTION_PAPER") {
        setManualPaperReview(false);
        setSourceReviewMappings({});
        setFormulaReviews({});
        setQuestionTypeOverrides({});
      }
      if (!text.trim() || preservePdfAsVisualReview) {
        if (sourceKind === "QUESTION_PAPER") {
          const preservedDraft = preservePdfAsVisualReview
            ? preservedPdfReviewDraft(report, subject)
            : [
                `${teacherDocumentLabel(report.documentType)} preserved for teacher review.`,
                "NIDUS AI could not confidently read structured text from this upload.",
                "Use the preserved original page/image in Review to rebuild questions, formulas, diagrams and answer relationships.",
              ].join("\n");
          setter([current, preservedDraft].filter(Boolean).join("\n\n"));
        }
        setImportValidation(null);
        setAiReconstruction(null);
        setUploadState("NEEDS_REVIEW");
        setMessage(preservePdfAsVisualReview
          ? "Maths, Physics or Chemistry PDF detected. NIDUS preserved the original pages and prepared it for review instead of trusting broken PDF text."
          : "NIDUS AI preserved your original paper and created a review draft. Please review the detected content before publishing.");
        return;
      }
      setter([current, text].filter(Boolean).join("\n\n"));
      setImportValidation(null);
      setAiReconstruction(null);
      setUploadState(report.status === "READY" ? "DRAFT_READY" : "NEEDS_REVIEW");
      setMessage(report.status === "BLOCKED"
        ? `${file.name} ${preserved ? "was preserved and" : ""} is ready for review.`
        : report.status === "REVIEW_REQUIRED"
          ? `${file.name} ${preserved ? "was preserved and" : "was"} prepared for review.`
          : "Upload completed. Draft Ready.");
    } catch (error) {
      setOcrBusy(false);
      const errorText = error instanceof Error ? `${error.name} ${error.message}` : "";
      const passwordProtected = /password|encrypted/i.test(errorText);
      setUploadState(passwordProtected ? "PASSWORD_PROTECTED" : "CORRUPTED_FILE");
      const report: ExtractionReport = {
        fileName: file.name,
        sourceKind,
        status: "BLOCKED",
        draftStatus: passwordProtected ? "PASSWORD_PROTECTED" : "CORRUPTED_FILE",
        documentType: passwordProtected ? "UNKNOWN" : sourceKind === "ANSWER_KEY" ? "ANSWER_KEY" : "UNKNOWN",
        pageCount: 0,
        confidence: { document: 0, question: 0, answer: 0, overall: 0 },
        textCharacters: 0,
        detectedQuestions: 0,
        warnings: [],
        blockers: [passwordProtected ? "Password Protected" : "Corrupted File"],
        visualRisk: false,
        createdAt: new Date().toISOString(),
      };
      setExtractionReports((reports) => [...reports.filter((item) => !(item.sourceKind === sourceKind && item.fileName === file.name)), report]);
      try {
        await preserveExamSource(file, sourceKind, report);
      } catch {
        // The teacher-facing message below intentionally stays simple.
      }
      setMessage(passwordProtected
        ? "Password Protected. Please upload an unlocked copy of this paper."
        : "Corrupted File. NIDUS could not open this file. Please upload a fresh copy.");
      return;
    }
  }

  function openCreator() {
    setEditingExam(null);
    setSubjectTouched(false);
    setForm({
      ...initialForm,
      title: activeBatch && subject ? defaultExamTitle(subject, activeBatch.name) : "",
      date: new Date().toISOString().slice(0, 10),
    });
    setQuestionSource("");
    setAnswerGuide("");
    setUploadedQuestionPaper("");
    setUploadedAnswerGuide("");
    setExamUploads([]);
    setVisualAssets([]);
    setQuestionVisuals({});
    setSourceReviewMappings({});
    setFormulaReviews({});
    setQuestionTypeOverrides({});
    setExtractionReports([]);
    setManualPaperReview(false);
    setQuestionReviewStatus({});
    setImportValidation(null);
    setAiReconstruction(null);
    setUploadState("IDLE");
    setTargetBatchIds(activeBatch?.id ? [activeBatch.id] : []);
    setStep(1);
    setPreviewIndex(0);
    setMessage("");
    setShowCreator(true);
  }

  function openEditor(exam: TeacherExamRecord) {
    if (exam.batchId && exam.batchId !== activeBatchId) openBatch(exam.batchId);
    setEditingExam(exam);
    setSubjectTouched(true);
    setSubject(exam.subject || subject || activeBatch?.subjects[0] || "General");
    setForm({
      title: exam.title || "",
      topic: exam.topic || "",
      date: exam.createdAt ? new Date(exam.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      time: "",
      duration: String(exam.durationMinutes ?? 60),
      marks: "100",
      instructions: "",
    });
    const savedQuestions = Array.isArray(exam.draft?.questions) ? exam.draft.questions : [];
    setQuestionVisuals(savedQuestions.reduce<Record<number, string>>((acc, question, index) => {
      if (question.questionImage) acc[index + 1] = question.questionImage;
      return acc;
    }, {}));
    setSourceReviewMappings(savedQuestions.reduce<Record<number, SourceReviewMapping>>((acc, question, index) => {
      const layout = question.layout && typeof question.layout === "object" ? question.layout as { sourceReview?: SourceReviewMapping } : null;
      const boxes = question.boundingBoxes && typeof question.boundingBoxes === "object" ? question.boundingBoxes as { sourceReview?: SourceReviewMapping } : null;
      const mapping = layout?.sourceReview || boxes?.sourceReview;
      if (mapping?.page) acc[index + 1] = mapping;
      return acc;
    }, {}));
    setFormulaReviews(exam.draft?.formulaReviews ?? savedQuestions.reduce<Record<number, FormulaReviewEntry>>((acc, question, index) => {
      const content = question.contentJson && typeof question.contentJson === "object" ? question.contentJson as { metadata?: { formulaLatex?: string; formulaReviewStatus?: FormulaReviewEntry["reviewStatus"] } } : null;
      if (content?.metadata?.formulaLatex) {
        acc[index + 1] = {
          latex: content.metadata.formulaLatex,
          reviewStatus: content.metadata.formulaReviewStatus || "PENDING",
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    }, {}));
    setQuestionTypeOverrides(exam.draft?.questionTypeOverrides ?? savedQuestions.reduce<Record<number, RichQuestionType>>((acc, question, index) => {
      const content = question.contentJson && typeof question.contentJson === "object" ? question.contentJson as { questionType?: RichQuestionType } : null;
      if (content?.questionType && content.questionType !== "SINGLE_CHOICE") acc[index + 1] = content.questionType;
      return acc;
    }, {}));
    setVisualAssets(savedQuestions
      .map((question, index) => question.questionImage ? {
        id: `saved-question-${index + 1}`,
        label: `Saved Q${index + 1}`,
        fileName: "Saved question image",
        dataUrl: question.questionImage,
      } : null)
      .filter((asset): asset is QuestionVisualAsset => Boolean(asset)));
    setQuestionSource(savedQuestions.map((question, index) => [
      `Q${index + 1}. ${question.questionText}`,
      `(A) ${question.optionA}`,
      `(B) ${question.optionB}`,
      `(C) ${question.optionC}`,
      `(D) ${question.optionD}`,
    ].join("\n")).join("\n\n"));
    setAnswerGuide(savedQuestions.map((question, index) => `${index + 1} - ${question.correctAnswer}\nExplanation: ${question.explanation}`).join("\n\n"));
    setUploadedQuestionPaper("");
    setUploadedAnswerGuide("");
    setExamUploads(exam.uploads ?? []);
    const savedReports = (exam.uploads ?? [])
      .map((upload) => upload.extractionAudit)
      .filter((report): report is ExtractionReport => Boolean(report));
    setExtractionReports(savedReports);
    setManualPaperReview((exam.uploads ?? []).some((upload) => upload.manualReviewCompleted));
    setQuestionReviewStatus(savedQuestions.reduce<Record<number, "APPROVED" | "NEEDS_REVIEW">>((acc, question, index) => {
      acc[index + 1] = question.reviewStatus === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "APPROVED";
      return acc;
    }, {}));
    setImportValidation(null);
    setAiReconstruction(null);
    setUploadState(savedReports.length || savedQuestions.length ? "DRAFT_READY" : "IDLE");
    setStep(1);
    setPreviewIndex(0);
    setMessage("");
    setShowCreator(true);
  }

  async function publishExam() {
    if (!activeBatch) return;
    const firstDuplicate = readiness.duplicateQuestions[0];
    if (!editingExam && firstDuplicate) {
      setPreviewIndex(firstDuplicate.index);
      setStep(3);
      setMessage(`Duplicate question found: Question ${firstDuplicate.index + 1} repeats Question ${firstDuplicate.firstIndex + 1}. Please edit the uploaded paper before publishing.`);
      return;
    }
    const selectedBatches = (targetBatchIds.length ? targetBatchIds : [activeBatch.id])
      .map((id) => batches.find((batch) => batch.id === id))
      .filter((batch): batch is TeacherExamBatch => Boolean(batch));
    if (!selectedBatches.length) {
      setMessage("Select at least one assigned batch.");
      return;
    }
    if (!editingExam && !canPublishPaper) {
      setMessage(visualFidelity.missingSourceForVisuals
        ? "Original question paper source is required before publishing diagram, table or graph based questions."
        : visualQuestionsWithoutAttachment.length
        ? `Attach the exact diagram/table/graph image for question(s) ${visualQuestionsWithoutAttachment.join(", ")} before publishing.`
        : validationBlocksPublish && !importValidation
        ? "Analyze the draft before publishing."
        : validationBlocksPublish
        ? "Some questions still need review. Open the review workspace, then analyze again."
        : !sourceReviewCoverage.publishReady
        ? "Confirm visual or formula questions in review before publishing."
        : !formulaReviewCoverage.publishReady
        ? "Confirm formula-heavy questions in review before publishing."
        : unapprovedQuestionNumbers.length
        ? `Approve teacher-review question(s) ${unapprovedQuestionNumbers.join(", ")} before publishing.`
        : extractionNeedsManualReview && !manualPaperReview
        ? "Manual review is required for this uploaded paper before publishing. Check/correct every question, then tick manual review completed."
        : `Paper is incomplete: ${readiness.missingOptions} question(s) need options and ${readiness.missingAnswers} question(s) need answer keys before publishing.`);
      return;
    }
    if (!effectiveTitle.trim() || !effectiveTopic.trim()) {
      setMessage("Enter or upload an exam name and topic before publishing.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (editingExam) {
        if (questionSource && !canPublishPaper) {
          setMessage(`Paper is incomplete: ${readiness.missingOptions} question(s) need options and ${readiness.missingAnswers} question(s) need answer keys before saving.`);
          return;
        }
        await requestJson(`/api/academy/exams/${editingExam.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            subject,
            title: effectiveTitle,
            topic: effectiveTopic,
            durationMinutes: Number(form.duration),
            difficulty: editingExam.difficulty || "MEDIUM",
            instructions: form.instructions,
            status: editingExam.status || "PUBLISHED",
            examUploadIds: persistedExamUploads.map((upload) => upload.id),
            draft: canPublishPaper ? {
              title: effectiveTitle,
              subject,
              topic: effectiveTopic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions: questionsForPublish,
              extractionAudit: extractionReports,
              examUploads: persistedExamUploads,
              paperUnderstanding: understanding,
              visualFidelity: { ...visualFidelity, questionImageAssignments: Object.keys(questionVisuals).length, visualQuestionsWithoutAttachment },
              importValidation,
              importQuality: importQualityDraft,
              sourceReviewMappings,
              sourceReviewCoverage,
              formulaReviews,
              formulaReviewCoverage,
              questionTypeOverrides,
              questionTypeDistribution,
              questionRelationshipPlan,
              importReplayManifest,
              manualPaperReview,
            } : undefined,
          }),
        });
        setShowCreator(false);
        setEditingExam(null);
        await onRefresh();
        return;
      }
      const publishAt = form.date && form.time
        ? new Date(`${form.date}T${form.time}:00`).toISOString()
        : undefined;
      await Promise.all(selectedBatches.map((targetBatch) =>
        requestJson("/api/academy/exams", {
          method: "POST",
          body: JSON.stringify({
            batchId: targetBatch.id,
            batchName: targetBatch.name,
            course: targetBatch.program,
            subject,
            title: effectiveTitle,
            topic: effectiveTopic,
            questionCount: questionsForPublish.length,
            durationMinutes: Number(form.duration),
            difficulty: "MEDIUM",
            instructions: [
              form.instructions,
              selectedBatches.length > 1 ? `Common exam published to: ${selectedBatches.map((batch) => batch.name).join(", ")}` : "",
            ].filter(Boolean).join("\n"),
            publishDate: form.date,
            publishTime: form.time,
            publishAt,
            examUploadIds: persistedExamUploads.map((upload) => upload.id),
            draft: {
              title: effectiveTitle,
              description: form.instructions || `Faculty published ${subject} exam for ${targetBatch.name}.`,
              examType: "Teacher Exam",
              category: "Defence LMS",
              subject,
              topic: effectiveTopic,
              duration: Number(form.duration),
              totalMarks: Number(form.marks),
              questions: questionsForPublish,
              extractionAudit: extractionReports,
              examUploads: persistedExamUploads,
              paperUnderstanding: understanding,
              visualFidelity: { ...visualFidelity, questionImageAssignments: Object.keys(questionVisuals).length, visualQuestionsWithoutAttachment },
              importValidation,
              importQuality: importQualityDraft,
              sourceReviewMappings,
              sourceReviewCoverage,
              formulaReviews,
              formulaReviewCoverage,
              questionTypeOverrides,
              questionTypeDistribution,
              questionRelationshipPlan,
              importReplayManifest,
              manualPaperReview,
            },
          }),
        }),
      ));
      setShowCreator(false);
      setMessage(`Exam published to ${selectedBatches.length} batch(es).`);
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : editingExam ? "Unable to update exam." : "Unable to publish exam.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelExam(exam: TeacherExamRecord) {
    if (!window.confirm(`Cancel ${exam.title || "this exam"}? Students will no longer see it.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`/api/academy/exams/${exam.id}/archive`, { method: "POST", body: JSON.stringify({}) });
      setMessage("Exam cancelled.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel exam.");
    } finally {
      setBusy(false);
    }
  }

  async function publishChanges(exam: TeacherExamRecord) {
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`/api/academy/exams/${exam.id}/publish`, { method: "POST", body: JSON.stringify({}) });
      setMessage("Exam changes published.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish exam changes.");
    } finally {
      setBusy(false);
    }
  }

  async function openResults(exam: TeacherExamRecord) {
    setResultsExam(exam);
    setResults(null);
    setMessage("");
    try {
      setResults(await requestJson<ResultsPayload>(`/api/academy/exams/${exam.id}/results`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load results.");
    }
  }

  async function releaseResults() {
    if (!resultsExam) return;
    if (!results?.results.length) {
      setMessage("At least one submitted attempt is required before releasing results.");
      return;
    }
    if (!window.confirm("Release official results now? Students will immediately see scores, ranks, answer keys and explanations.")) return;
    setBusy(true);
    try {
      setResults(await requestJson<ResultsPayload>(`/api/academy/exams/${resultsExam.id}/release-results`, { method: "POST", body: JSON.stringify({}) }));
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to release results.");
    } finally {
      setBusy(false);
    }
  }

  function approveQuestion(number: number) {
    setQuestionReviewStatus((current) => ({ ...current, [number]: "APPROVED" }));
  }

  function markQuestionNeedsReview(number: number) {
    setQuestionReviewStatus((current) => ({ ...current, [number]: "NEEDS_REVIEW" }));
  }

  function markReviewCompleted() {
    setManualPaperReview(true);
    setUploadState("READY_FOR_PUBLISH");
    setQuestionReviewStatus((current) => {
      const next = { ...current };
      reviewRequiredQuestionNumbers.forEach((number) => {
        next[number] = "APPROVED";
      });
      return next;
    });
    setSourceReviewMappings((current) => {
      const next = { ...current };
      visualFidelity.questionsNeedingReview.forEach((number) => {
        next[number] = {
          documentId: current[number]?.documentId,
          uploadId: current[number]?.uploadId,
          importJobId: current[number]?.importJobId,
          fileName: current[number]?.fileName,
          page: current[number]?.page || 1,
          coordinates: current[number]?.coordinates || { x: 0, y: 0, width: 1, height: 1 },
          reviewStatus: "TEACHER_CONFIRMED",
          confidence: current[number]?.confidence || 85,
          note: current[number]?.note || `Teacher reviewed question ${number}`,
          mappedAt: new Date().toISOString(),
        };
      });
      return next;
    });
    setFormulaReviews((current) => {
      const next = { ...current };
      formulaReviewCoverage.formulaQuestions.forEach((number) => {
        next[number] = {
          latex: current[number]?.latex || questions[number - 1]?.questionText || "",
          reviewStatus: "TEACHER_CONFIRMED",
          updatedAt: new Date().toISOString(),
        };
      });
      return next;
    });
    setMessage("Review marked completed. Continue to publish when the checklist is ready.");
  }

  function updateFormulaReview(number: number, latex: string, reviewStatus: FormulaReviewEntry["reviewStatus"] = "PENDING") {
    setFormulaReviews((current) => ({
      ...current,
      [number]: {
        latex,
        reviewStatus,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function chooseQuestionType(number: number, questionType: RichQuestionType) {
    setQuestionTypeOverrides((current) => ({ ...current, [number]: questionType }));
    setMessage(`${questionTypeLabel(questionType)} saved for Question ${number}. Current CBT remains MCQ-compatible while rich type metadata is preserved.`);
  }

  function approveReadyQuestions() {
    const next = understanding.questionSignals.reduce<Record<number, "APPROVED" | "NEEDS_REVIEW">>((acc, signal) => {
      acc[signal.number] = signal.confidence === "HIGH" && !signal.visualRequired && !signal.formulaRisk && !signal.tableRisk && !signal.graphRisk
        ? "APPROVED"
        : questionReviewStatus[signal.number] ?? "NEEDS_REVIEW";
      return acc;
    }, {});
    setQuestionReviewStatus(next);
    setMessage("High-confidence questions approved. Review the remaining flagged questions before publishing.");
  }

  async function validateImportWithAi() {
    if (!activeBatch) return;
    if (!questions.length) {
      setUploadState("NEEDS_REVIEW");
      setMessage("NIDUS AI preserved your original paper and prepared it for review.");
      return;
    }
    setValidationBusy(true);
    setUploadState("PREPARING_REVIEW");
    setMessage("");
    try {
      const sourceUpload = examUploads.find((upload) => upload.sourceKind === "QUESTION_PAPER");
      const result = await requestJson<{ validation: ImportValidationPayload }>("/api/academy/exams/import/validate", {
        method: "POST",
        body: JSON.stringify({
          batchId: activeBatch.id,
          subject,
          topic: effectiveTopic,
          documentClass: sourceUpload?.documentClass,
          pipeline: sourceUpload?.pipeline,
          importJobIds: examUploads.map((upload) => upload.importJobId).filter(Boolean),
          examUploadIds: examUploads.map((upload) => upload.id).filter(Boolean),
          extractionAudit: {
            extractionReports,
            paperUnderstanding: understanding,
            visualFidelity,
          },
          questions: questionsForPublish.map((question, index) => ({
            number: index + 1,
            questionText: question.questionText,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            visualReviewRequired: question.visualReviewRequired,
            visualReviewNotes: question.visualReviewNotes,
            aiConfidence: question.aiConfidence,
            reviewStatus: question.reviewStatus,
          })),
        }),
      });
      setImportValidation(result.validation);
      setUploadState(result.validation.publishReady ? "DRAFT_READY" : "NEEDS_REVIEW");
      setQuestionReviewStatus((current) => {
        const next = { ...current };
        for (const report of result.validation.questionReports) {
          if (report.status === "AUTO_APPROVED") next[report.number] = "APPROVED";
          if (report.status === "NEEDS_REVIEW" && !next[report.number]) next[report.number] = "NEEDS_REVIEW";
          if (report.status === "MANUAL_CORRECTION_REQUIRED") next[report.number] = "NEEDS_REVIEW";
        }
        return next;
      });
      if (!result.validation.publishReady || result.validation.averageConfidence < 82) {
        await requestAiReconstruction(result.validation);
      }
      setMessage(result.validation.publishReady
        ? "NIDUS AI validation passed. Review the preview once and publish."
        : "NIDUS AI rebuilt a cleaner draft for review. Open flagged questions and approve them before publishing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to validate this import.");
    } finally {
      setValidationBusy(false);
    }
  }

  async function requestAiReconstruction(validationOverride: ImportValidationPayload | null = importValidation) {
    if (!activeBatch) return;
    const hasPreservedSource = Boolean(
      questions.length ||
      uploadedQuestionPaper ||
      questionSource.trim() ||
      examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER") ||
      visualAssets.length ||
      extractionReports.some((report) => report.sourceKind === "QUESTION_PAPER")
    );
    if (!hasPreservedSource) {
      setMessage("Upload or paste the question paper before rebuilding the draft.");
      return;
    }
    setReconstructionBusy(true);
    setUploadState("BUILDING_AI_DRAFT");
    try {
      const result = await requestJson<{ reconstruction: AiReconstructionResult }>("/api/academy/exams/import/reconstruct", {
        method: "POST",
        body: JSON.stringify({
          batchId: activeBatch.id,
          subject,
          topic: effectiveTopic,
          documentClass: questionPaperReport?.documentType || examUploads.find((upload) => upload.sourceKind === "QUESTION_PAPER")?.documentClass,
          pipeline: examUploads.find((upload) => upload.sourceKind === "QUESTION_PAPER")?.pipeline,
          importJobIds: examUploads.map((upload) => upload.importJobId).filter(Boolean),
          examUploadIds: examUploads.map((upload) => upload.id).filter(Boolean),
          confidenceThreshold: 0.82,
          extractionAudit: {
            extractionReports,
            paperUnderstanding: understanding,
            visualFidelity,
          },
          ndieOutputs: {
            ocr: { available: Boolean(questionSource.trim()), extractedQuestionCount: questions.length },
            layout: { sections: understanding.sections, sourceReviewMappings },
            formula: { formulaReviews, formulaQuestionCount: visualFidelity.formulaQuestionCount },
            visual: { visualFidelity, visualAssets, questionVisuals },
            assessment: { questions: questionsForPublish, questionTypePlan, relationships: questionRelationshipPlan },
            evaluation: { answerEntries: understanding.answerKey.entries, answerKeyMode: understanding.answerKey.mode },
            validation: validationOverride,
            stemIntelligence: { subject, inferredSubject: understanding.inferredSubject, riskSignals: understanding.riskSignals },
            pageReferences: sourceReviewMappings,
            boundingBoxes: questionsForPublish.map((question) => question.boundingBoxes).filter(Boolean),
            originalPageAssets: visualAssets.map((asset) => ({ id: asset.id, label: asset.label, pageNumber: asset.pageNumber })),
            questionRelationships: questionRelationshipPlan,
            answerKey: { entries: understanding.answerKey.entries, missing: understanding.answerKey.missing, mode: understanding.answerKey.mode },
          },
          draft: aiExamDraft,
          questions: questionsForPublish.map((question, index) => ({
            number: index + 1,
            questionText: question.questionText,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            visualReviewRequired: question.visualReviewRequired,
            visualReviewNotes: question.visualReviewNotes,
            aiConfidence: question.aiConfidence,
            reviewStatus: question.reviewStatus,
          })),
        }),
      });
      setAiReconstruction(result.reconstruction);
      setUploadState(result.reconstruction.draft.needsReview ? "NEEDS_REVIEW" : "DRAFT_READY");
      setMessage(result.reconstruction.draft.needsReview
        ? "NIDUS AI rebuilt the draft and marked uncertain content for review."
        : "NIDUS AI rebuilt a clean draft for teacher approval.");
    } catch {
      setAiReconstruction(null);
      setMessage("NIDUS kept the current draft ready for review. You can continue without waiting for AI reconstruction.");
    } finally {
      setReconstructionBusy(false);
    }
  }

  function goNextStep() {
    if (step === 1) {
      if (!(targetBatchIds.length || activeBatch?.id)) {
        setMessage("Select at least one batch.");
        return;
      }
      if (!subject) {
        setMessage("Select a subject.");
        return;
      }
      if (!effectiveTitle.trim()) {
        setMessage("Enter an exam name.");
        return;
      }
      if (Number(form.duration) <= 0 || Number(form.marks) <= 0) {
        setMessage("Duration and total marks must be greater than zero.");
        return;
      }
    }
    if (step === 2 && !editingExam && !questionSource.trim() && !uploadedQuestionPaper && !examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER")) {
      setMessage("Upload or paste the question paper first.");
      return;
    }
    if (step === 4 && !editingExam && questions.length === 0) {
      setMessage(stemOrFormulaPaperDetected
        ? `${subject || "STEM"} paper detected. AI has prepared this paper for review.`
        : "NIDUS AI preserved your original paper. Please review the draft before publishing.");
    }
    if (step === 4 && !editingExam && readiness.missingAnswers > 0 && answerGuide.trim()) {
      setMessage(`Answer key review required: ${readiness.missingAnswers} question(s) need answer keys before preview.`);
      return;
    }
    if (step === 4 && !editingExam && visualFidelity.missingSourceForVisuals) {
      setMessage("Upload the original question paper/source so diagram, table and graph questions can be verified beside the extracted preview.");
      return;
    }
    if (step === 4 && !editingExam && readiness.duplicateQuestions.length > 0) {
      const firstDuplicate = readiness.duplicateQuestions[0];
      setPreviewIndex(firstDuplicate.index);
      setMessage(`Preview opened with duplicate questions flagged. Question ${firstDuplicate.index + 1} repeats Question ${firstDuplicate.firstIndex + 1}; fix it before publishing.`);
    } else if (step === 4 && !editingExam && (readiness.missingOptions > 0 || readiness.missingExplanations > 0)) {
      setMessage(`Preview opened with ${questions.length} valid question(s). Review ${readiness.missingOptions} option issue(s) and ${readiness.missingExplanations} explanation issue(s) before publishing.`);
    } else if (step === 4 && !editingExam && questions.length > 0 && !importValidation) {
      setMessage("Analyze the draft before opening the final publish screen.");
      return;
    } else if (step === 4 && !editingExam && importValidation && importValidation.summary.manualCorrection > 0) {
      const firstManual = importValidation.questionReports.find((report) => report.status === "MANUAL_CORRECTION_REQUIRED");
      if (firstManual) setPreviewIndex(Math.max(0, firstManual.number - 1));
      setMessage("Some questions still need review. Open the review workspace, then analyze again.");
      return;
    } else if (step === 4 && !editingExam && unapprovedQuestionNumbers.length > 0) {
      setPreviewIndex(Math.max(0, unapprovedQuestionNumbers[0] - 1));
      setMessage(`Approve question(s) ${unapprovedQuestionNumbers.join(", ")} before opening the final publish screen.`);
      return;
    } else if (step === 4 && !editingExam && !sourceReviewCoverage.publishReady) {
      const firstUnconfirmed = visualFidelity.questionsNeedingReview.find((number) => sourceReviewMappings[number]?.reviewStatus !== "TEACHER_CONFIRMED") || visualQuestionsWithoutAttachment.find((number) => sourceReviewMappings[number]?.reviewStatus !== "TEACHER_CONFIRMED");
      if (firstUnconfirmed) setPreviewIndex(Math.max(0, firstUnconfirmed - 1));
      setMessage("Confirm the visual or formula questions in review before publishing.");
      return;
    } else if (step === 4 && !editingExam && !formulaReviewCoverage.publishReady) {
      const firstFormula = formulaReviewCoverage.formulaQuestions.find((number) => formulaReviews[number]?.reviewStatus !== "TEACHER_CONFIRMED");
      if (firstFormula) setPreviewIndex(Math.max(0, firstFormula - 1));
      setMessage("Confirm formula-heavy questions in review before publishing.");
      return;
    } else {
      setMessage("");
    }
    setStep((value) => Math.min(5, value + 1));
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)]">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Exams</p>
              <h2 className="mt-1 text-2xl font-black">Create exam and check results</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted-blue)]">Choose a batch, add the question paper, check once, and publish to students.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="hidden min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-4 py-3 text-sm font-black">
              {showAdvanced ? "Hide engine details" : "Engine details"}
            </button>
            <button type="button" onClick={openCreator} disabled={!activeBatch} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
              <Plus size={18} /> New Exam
            </button>
          </div>
        </div>
      </div>

      {showAdvanced ? (
        <div className="grid gap-4">
          <ExaminationEngineBanner
            role={role}
            title={role === "ACADEMIC_HEAD" ? "Academic Head Examination Engine" : "Teacher Examination Engine"}
            description="Approved hosting engine, question bank structure, CBT results and reporting controls."
            metrics={[
              { label: "Question Bank", value: batchExams.length, tone: "success" },
              { label: "Published Tests", value: liveExamCount, tone: liveExamCount ? "info" : "default" },
              { label: "Submitted Attempts", value: submittedCount, tone: submittedCount ? "success" : "default" },
              { label: "Average Score", value: `${Math.round(averageScore)}%`, tone: averageScore ? "info" : "default" },
            ]}
          />
          <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
            <ExaminationRoleActions role={role} />
            <ExamReportingPanel attempts={submittedCount} averageScore={averageScore} reports={submittedCount} />
          </section>
          <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
            <QuestionBankHierarchyPanel questionCount={batchExams.reduce((total, exam) => total + Number(exam.questionCount ?? exam.draft?.questions?.length ?? 0), 0)} />
            <ExamTypePanel />
          </section>
        </div>
      ) : null}

      {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{message}</div> : null}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Step 1</p>
            <h3 className="mt-1 text-xl font-black">Select batch</h3>
          </div>
          <span className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-black">{batches.length} batch(es)</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {batches.map((batch) => (
            <button key={batch.id} type="button" onClick={() => openBatch(batch.id)} className={`rounded-xl border p-3 text-left transition ${activeBatch?.id === batch.id ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--ink)] hover:-translate-y-0.5"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-base font-black">{batch.name}</p>
                {activeBatch?.id === batch.id ? <span className="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black text-slate-950">Selected</span> : null}
              </div>
              <p className={`mt-2 text-xs ${activeBatch?.id === batch.id ? "text-white/75" : "text-[var(--muted-blue)]"}`}>{batch.studentCount} students / {batch.subjects.length} subjects</p>
            </button>
          ))}
        </div>
      </div>

      {activeBatch ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--gold-dark)]">Published Exams</p>
              <h3 className="mt-1 text-xl font-black">{activeBatch.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted-blue)]">{activeBatch.studentCount} students receive exams published here.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:min-w-[440px]">
              <Summary label="Live Exams" value={String(liveExamCount)} />
              <Summary label="Submitted" value={String(submittedCount)} />
              <label className="grid gap-2 text-sm font-black">
                Subject
                <select value={subject} onChange={(event) => chooseSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
                  {subjectOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {loading ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">Loading exams...</p> : null}
            {!loading && !batchExams.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm">No exams published for this batch yet.</p> : null}
            {batchExams.map((exam) => (
              <article key={exam.id} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--ink)]">{statusLabel(exam.status)}</span>
                      <span className="text-xs font-black text-[var(--muted-blue)]">{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                    <h4 className="mt-2 truncate text-lg font-black">{exam.title || "Exam"}</h4>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{exam.subject || subject} / {exam.topic || "Topic"} / {exam.questionCount ?? 0} Qs / {exam.durationMinutes ?? 0} min / {exam.attemptStats?.submitted ?? 0} submitted</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button type="button" onClick={() => openEditor(exam)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black text-slate-950">
                      <Pencil size={16} /> Edit
                    </button>
                    <button type="button" onClick={() => void openResults(exam)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-950 bg-white px-3 text-sm font-black text-slate-950">
                      <Trophy size={16} /> Results
                    </button>
                    <details className="relative">
                      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">More</summary>
                      <div className="absolute right-0 z-20 mt-2 grid min-w-40 gap-1 rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl">
                        <button type="button" onClick={() => void publishChanges(exam)} disabled={busy} className="rounded-lg px-3 py-2 text-left text-xs font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Publish changes</button>
                        <button type="button" onClick={() => void cancelExam(exam)} disabled={busy} className="rounded-lg px-3 py-2 text-left text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel exam</button>
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {showCreator ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-4 sm:px-8">
              <div className="mx-auto max-w-7xl">
              <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">{editingExam ? "Edit Exam" : "New Exam"}</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">{activeBatch?.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">Step {step} of 5. Complete only what is shown on this screen.</p>
              </div>
              <button type="button" onClick={() => setShowCreator(false)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)]">
                <X size={18} />
              </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                {["Details", "Question Paper", "Answer Key", "AI Review", "Publish"].map((label, index) => (
                  <button key={label} type="button" onClick={() => index + 1 < step && setStep(index + 1)} className={`min-h-10 rounded-xl border px-2 text-xs font-black sm:text-sm ${step === index + 1 ? "border-slate-950 bg-slate-950 text-white" : index + 1 < step ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[var(--border)] bg-white text-[var(--muted-blue)]"}`}>{index + 1}. {label}</button>
                ))}
              </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
              <div className="mx-auto max-w-7xl">
              {step === 1 ? (
                <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
                  <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm md:col-span-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Exam details</p>
                    <h4 className="mt-2 text-2xl font-black">Set up the exam</h4>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">Only the basic details are needed. NIDUS will understand the paper automatically.</p>
                  </div>
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5 md:col-span-2">
                    <p className="text-sm font-black">Batch / Class</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {batches.map((batch) => (
                        <label key={batch.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-black ${targetBatchIds.includes(batch.id) ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-[var(--border)] bg-white text-[var(--ink)]"}`}>
                          <input type="checkbox" checked={targetBatchIds.includes(batch.id)} onChange={() => toggleTargetBatch(batch.id)} />
                          <span>{batch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Field label="Exam name" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
                  <label className="grid gap-2 text-sm font-black">
                    Subject
                    <select value={subject} onChange={(event) => chooseSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4">
                      {Array.from(new Set(targetBatchIds.flatMap((id) => {
                        const options = batches.find((batch) => batch.id === id)?.subjects ?? [];
                        return options.length ? options : ["General"];
                      }).concat(subjectOptions))).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <Field label="Chapter / Topic (optional)" value={form.topic} onChange={(value) => setForm((current) => ({ ...current, topic: value }))} placeholder="Algebra, Constitution, Motion..." />
                  <Field label="Exam date (optional)" type="date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
                  <Field label="Duration in minutes" type="number" value={form.duration} onChange={(value) => setForm((current) => ({ ...current, duration: value }))} />
                  <Field label="Total marks" type="number" value={form.marks} onChange={(value) => setForm((current) => ({ ...current, marks: value }))} />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mx-auto grid max-w-5xl gap-5">
                  <ExamInputCard title="Upload Question Paper" description="PDF, Word, image, text or pasted questions. NIDUS detects the paper type automatically.">
                    <FileUploadRow
                      label="Drop question paper here or choose file"
                      fileName={uploadedQuestionPaper}
                      accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={(file) => void appendFileText(file, setQuestionSource, questionSource, "QUESTION_PAPER", setUploadedQuestionPaper)}
                    />
                    <div className="my-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">
                      <span className="h-px flex-1 bg-[var(--border)]" />
                      Paste questions
                      <span className="h-px flex-1 bg-[var(--border)]" />
                    </div>
                    <textarea value={questionSource} onChange={(event) => {
                      setQuestionSource(event.target.value);
                      setImportValidation(null);
                      setAiReconstruction(null);
                      setUploadState(event.target.value.trim() ? "BUILDING_AI_DRAFT" : "IDLE");
                    }} rows={10} className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6" placeholder={"1. Question...\nA. Option\nB. Option\nC. Option\nD. Option"} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-950">
                      <div>
                        <p className="text-sm font-black">{uploadedQuestionPaper || questionSource.trim() ? "Question Paper Uploaded" : "Waiting for question paper"}</p>
                        <p className="mt-1 text-xs font-bold opacity-75">
                          {stemOrFormulaPaperDetected ? `NIDUS AI detected: ${subject || "Mathematics"} Paper` : "NIDUS AI will detect the paper after upload."}
                        </p>
                        <p className="mt-1 text-xs font-bold opacity-75">Pages: {visualAssets.length || "Pending"}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-black">
                        {uploadedQuestionPaper || questionSource.trim() ? "Ready for Analysis" : "Upload Required"}
                      </span>
                    </div>
                  </ExamInputCard>
                  {ocrBusy ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-950 lg:col-span-2">
                      NIDUS AI is reading the scanned paper. Your original file is preserved.
                    </div>
                  ) : null}
                  <TeacherUploadProgressCard state={uploadState} busy={ocrBusy || reconstructionBusy || validationBusy} />
                  <TeacherDocumentUnderstandingCard
                    questionReport={questionPaperReport}
                    answerReport={answerKeyReport}
                    subject={subject}
                    paperStyle={teacherDetectedStyle}
                    difficulty={teacherDifficulty}
                    questionsDetected={effectiveAiDraft.questionCount || questions.length}
                    pages={questionPaperReport?.pageCount || visualAssets.length}
                    formulaCount={visualFidelity.formulaQuestionCount}
                    diagramCount={visualFidelity.visualQuestionCount}
                    graphCount={visualFidelity.graphQuestionCount}
                    tableCount={visualFidelity.tableQuestionCount}
                    reviewConfidence={teacherReviewConfidence}
                    answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim() || answerKeyReport)}
                  />
                  <ExamStatusCard
                    questionPaperUploaded={Boolean(uploadedQuestionPaper || questionSource.trim() || examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER"))}
                    answerKeyUploaded={Boolean(uploadedAnswerGuide || answerGuide.trim() || examUploads.some((upload) => upload.sourceKind === "ANSWER_KEY"))}
                    analysisComplete={Boolean(importValidation || questions.length || reviewExtractionReports.length)}
                    questionsDetected={questions.length}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questions.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                    readyToPublish={canPublishPaper}
                    subject={subject}
                    stemDetected={stemOrFormulaPaperDetected}
                  />
                  <DraftImportSummary
                    questionReport={questionPaperReport}
                    answerReport={answerKeyReport}
                    questionsDetected={questions.length}
                    answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim())}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questions.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mx-auto grid max-w-5xl gap-5">
                  <ExamInputCard title="Upload Answer Key" description="Optional. You can upload it now or add it later during review.">
                    <FileUploadRow
                      label="Drop answer key here or choose file"
                      fileName={uploadedAnswerGuide}
                      accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={(file) => void appendFileText(file, setAnswerGuide, answerGuide, "ANSWER_KEY", setUploadedAnswerGuide)}
                    />
                    <div className="my-4 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">
                      <span className="h-px flex-1 bg-[var(--border)]" />
                      Paste answer key
                      <span className="h-px flex-1 bg-[var(--border)]" />
                    </div>
                    <textarea value={answerGuide} onChange={(event) => {
                      setAnswerGuide(event.target.value);
                      setImportValidation(null);
                      setAiReconstruction(null);
                      if (event.target.value.trim()) setUploadState("BUILDING_AI_DRAFT");
                    }} rows={9} className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6" placeholder={"1 - A\nExplanation: Optional\n\n2 - C"} />
                    {!answerGuide.trim() && !uploadedAnswerGuide ? (
                      <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-black text-[var(--muted-blue)]">
                        You can add the answer key later during review.
                      </p>
                    ) : null}
                  </ExamInputCard>
                  <TeacherUploadProgressCard state={uploadState} busy={ocrBusy || reconstructionBusy || validationBusy} />
                  <TeacherDocumentUnderstandingCard
                    questionReport={questionPaperReport}
                    answerReport={answerKeyReport}
                    subject={subject}
                    paperStyle={teacherDetectedStyle}
                    difficulty={teacherDifficulty}
                    questionsDetected={effectiveAiDraft.questionCount || questions.length}
                    pages={questionPaperReport?.pageCount || visualAssets.length}
                    formulaCount={visualFidelity.formulaQuestionCount}
                    diagramCount={visualFidelity.visualQuestionCount}
                    graphCount={visualFidelity.graphQuestionCount}
                    tableCount={visualFidelity.tableQuestionCount}
                    reviewConfidence={teacherReviewConfidence}
                    answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim() || answerKeyReport)}
                  />
                  <ExamStatusCard
                    questionPaperUploaded={Boolean(uploadedQuestionPaper || questionSource.trim() || examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER"))}
                    answerKeyUploaded={Boolean(uploadedAnswerGuide || answerGuide.trim() || examUploads.some((upload) => upload.sourceKind === "ANSWER_KEY"))}
                    analysisComplete={Boolean(importValidation || questions.length || reviewExtractionReports.length)}
                    questionsDetected={questions.length}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questions.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                    readyToPublish={canPublishPaper}
                    subject={subject}
                    stemDetected={stemOrFormulaPaperDetected}
                  />
                  <DraftImportSummary
                    questionReport={questionPaperReport}
                    answerReport={answerKeyReport}
                    questionsDetected={questions.length}
                    answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim())}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questions.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                  />
                </div>
              ) : null}

              {step === 4 ? (
                <div className="mx-auto grid max-w-5xl gap-5">
                  <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">AI Review Draft</p>
                    <h4 className="mt-3 text-2xl font-black">NIDUS AI has analyzed your document.</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-blue)]">
                      {effectiveAiDraft.questionCount
                        ? effectiveAiDraft.message
                        : "NIDUS AI preserved your original paper and created a review draft. Please review the detected content."}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Summary label="Questions Reconstructed" value={String(effectiveAiDraft.questionCount || "Review")} />
                      <Summary label="Question Types" value={effectiveAiDraft.questionTypes.slice(0, 2).join(", ")} />
                      <Summary label="Formula Review" value={String(effectiveAiDraft.formulaReviewCount ?? visualFidelity.formulaQuestionCount)} />
                      <Summary label="Diagram Review" value={String(effectiveAiDraft.visualReviewCount ?? visualFidelity.visualQuestionCount)} />
                      <Summary label="Ready for Publish" value={effectiveAiDraft.needsReview ? "Review" : "Ready"} />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Summary label="Questions needing review" value={String(effectiveAiDraft.needsReview)} />
                      <Summary label="Answer review" value={`${effectiveAiDraft.answerKeysLinked}/${effectiveAiDraft.questionCount || 1}`} />
                      <Summary label="Solution links" value={String(effectiveAiDraft.solutionsLinked ?? 0)} />
                    </div>
                    <DraftQualitySummary quality={effectiveAiDraft.quality} />
                    {aiReconstruction ? (
                      <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-900">
                        NIDUS AI reconstructed this draft from the preserved document structure.
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3">
                      {reviewWorkspaceUrl ? (
                        <a href={reviewWorkspaceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-950 bg-slate-950 px-6 text-sm font-black text-white">
                          Review Questions
                        </a>
                      ) : (
                        <button type="button" onClick={() => setMessage("The paper is preserved. Continue with the review checklist here, or reopen after upload sync completes.")} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-950 bg-slate-950 px-6 text-sm font-black text-white">
                          Review Questions
                        </button>
                      )}
                      <button type="button" onClick={() => void validateImportWithAi()} disabled={validationBusy || !questions.length} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-black disabled:opacity-50">
                        {validationBusy ? "Analyzing..." : importValidation ? "Analyze Again" : "Analyze"}
                      </button>
                      <button type="button" onClick={() => void requestAiReconstruction()} disabled={reconstructionBusy || (!questions.length && !uploadedQuestionPaper && !questionSource.trim())} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-6 text-sm font-black disabled:opacity-50">
                        {reconstructionBusy ? "Rebuilding..." : reconstructionRecommended ? "Rebuild Draft" : "Recheck Draft"}
                      </button>
                      <button type="button" onClick={markReviewCompleted} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-700 bg-emerald-700 px-6 text-sm font-black text-white">
                        Mark Review Completed
                      </button>
                    </div>
                  </div>
                  <AiDraftPreview draft={effectiveAiDraft} />
                  <ExamStatusCard
                    questionPaperUploaded={Boolean(uploadedQuestionPaper || questionSource.trim() || examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER"))}
                    answerKeyUploaded={Boolean(uploadedAnswerGuide || answerGuide.trim() || examUploads.some((upload) => upload.sourceKind === "ANSWER_KEY"))}
                    analysisComplete={Boolean(importValidation || questions.length || reviewExtractionReports.length)}
                    questionsDetected={questionsForPublish.length}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questionsForPublish.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                    readyToPublish={canPublishPaper}
                    subject={subject}
                    stemDetected={stemOrFormulaPaperDetected}
                  />
                  <DraftImportSummary
                    questionReport={questionPaperReport}
                    answerReport={answerKeyReport}
                    questionsDetected={questionsForPublish.length}
                    answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim())}
                    reviewRequired={Boolean(stemOrFormulaPaperDetected && !questionsForPublish.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                  />
                </div>
              ) : null}

              {step === 5 ? (
                <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-5 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Summary label="Batches" value={String((targetBatchIds.length ? targetBatchIds : activeBatch?.id ? [activeBatch.id] : []).length)} />
                    <Summary label="Subject" value={subject} />
                    <Summary label="Questions" value={String(editingExam?.questionCount ?? questionsForPublish.length)} />
                    <Summary label="Timer" value={`${form.duration} min`} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">Exam</p>
                    <p className="mt-2 text-lg font-black">{effectiveTitle}</p>
                    <p className="mt-1 text-sm text-[var(--muted-blue)]">{effectiveTopic}</p>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <p><b>Date:</b> {form.date || "Not set"}</p><p><b>Answer key:</b> {uploadedAnswerGuide || answerGuide.trim() ? "Added" : "Can be added later"}</p>
                      <p><b>Duration:</b> {form.duration} minutes</p><p><b>Total marks:</b> {form.marks}</p>
                    </div>
                  </div>
                  <div className={`mt-4 rounded-2xl border p-4 ${unapprovedQuestionNumbers.length ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
                    <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Teacher review</p>
                    <p className="mt-2 text-sm font-black">
                      {unapprovedQuestionNumbers.length
                        ? `Pending approval: question(s) ${unapprovedQuestionNumbers.join(", ")}`
                        : `${reviewRequiredQuestionNumbers.length} flagged question(s) approved. Ready for final publish.`}
                    </p>
                  </div>
                  <div className="mt-4">
                    <ExamStatusCard
                      questionPaperUploaded={Boolean(uploadedQuestionPaper || questionSource.trim() || examUploads.some((upload) => upload.sourceKind === "QUESTION_PAPER"))}
                      answerKeyUploaded={Boolean(uploadedAnswerGuide || answerGuide.trim() || examUploads.some((upload) => upload.sourceKind === "ANSWER_KEY"))}
                      analysisComplete={Boolean(importValidation || questions.length || reviewExtractionReports.length)}
                      questionsDetected={questionsForPublish.length}
                      reviewRequired={Boolean(stemOrFormulaPaperDetected && !questionsForPublish.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                      readyToPublish={canPublishPaper}
                      subject={subject}
                      stemDetected={stemOrFormulaPaperDetected}
                    />
                    <DraftImportSummary
                      questionReport={questionPaperReport}
                      answerReport={answerKeyReport}
                      questionsDetected={questionsForPublish.length}
                      answerKeyAdded={Boolean(uploadedAnswerGuide || answerGuide.trim())}
                      reviewRequired={Boolean(stemOrFormulaPaperDetected && !questionsForPublish.length) || extractionNeedsManualReview || unapprovedQuestionNumbers.length > 0 || readiness.missingOptions > 0 || readiness.missingAnswers > 0}
                    />
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[var(--muted-blue)]">Publishing sends this exam to students. They can open it from their Student dashboard.</p>
                  {readiness.duplicateQuestions.length ? (
                    <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-800">
                      Fix {readiness.duplicateQuestions.length} duplicate question(s) before publishing. Question {readiness.duplicateQuestions[0].index + 1} repeats Question {readiness.duplicateQuestions[0].firstIndex + 1}.
                    </p>
                  ) : null}
                  {visualQuestionsWithoutAttachment.length ? (
                    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-black text-amber-900">
                      Review reminder: question(s) {visualQuestionsWithoutAttachment.join(", ")} need the original paper checked before publishing.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {message ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-700">{message}</p> : null}
              </div>
            </div>
            <div className="grid shrink-0 gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex sm:justify-between sm:p-5">
              <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="min-h-12 rounded-xl border border-[var(--border)] px-5 font-black">Back</button>
              {step < 5 ? (
                <button type="button" onClick={goNextStep} className="min-h-12 rounded-xl border border-slate-950 bg-slate-950 px-6 font-black text-white">
                  {step === 1 ? "Next: Upload Paper" : step === 2 ? "Next: Answer Key" : step === 3 ? "Next: AI Review" : "Next: Publish"}
                </button>
              ) : (
                <button type="button" onClick={() => void publishExam()} disabled={busy || (!editingExam && !canPublishPaper)} className="min-h-12 rounded-xl border border-emerald-700 bg-emerald-700 px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? (editingExam ? "Saving..." : "Publishing...") : editingExam ? "Save changes" : "Publish to students"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {resultsExam ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-3">
          <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-slate-950 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] p-4 sm:p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold-dark)]">Result Review</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">{resultsExam.title}</h3>
              </div>
              <button type="button" onClick={() => setResultsExam(null)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)]">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {!results ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5">Loading results...</p> : null}
              {results ? (
                <>
                <ResultReleasePanel payload={results} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black">{results.results.length} submitted / {results.released ? "Released" : "Not released"}</p>
                  <button type="button" onClick={() => void releaseResults()} disabled={busy || results.released || !results.results.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-50">
                    <CheckCircle2 size={16} /> Release Results
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  {results.results.map((row) => (
                    <div key={row.attemptId} className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[80px_1fr_120px_120px] md:items-center">
                      <span className="text-2xl font-black">#{row.rank}</span>
                      <div>
                        <p className="font-black">{row.studentName || row.studentEmail || "Student"}</p>
                        <p className="text-sm text-[var(--muted-blue)]">{row.correct} correct / {row.wrong} wrong</p>
                      </div>
                      <span className="font-black">{row.score}/{row.totalMarks}</span>
                      <span className="font-black">{row.percentage}%</span>
                    </div>
                  ))}
                  {!results.results.length ? <p className="rounded-2xl border border-dashed border-[var(--border)] p-5">No submitted attempts yet.</p> : null}
                </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type ExamPaperReviewStatus = "Ready" | "Needs Review" | "Missing Answer" | "Missing Formula" | "Missing Diagram" | "Incomplete" | "Rejected" | "Approved";
type SmartReviewFilter = "ALL" | "READY" | "NEEDS_REVIEW" | "MISSING_ANSWERS" | "FORMULA_ISSUES" | "DIAGRAM_ISSUES" | "LOW_CONFIDENCE" | "DUPLICATES" | "INCOMPLETE" | "REJECTED";
type ReviewFindingSeverity = "READY" | "LOW" | "MEDIUM" | "HIGH";
type ReviewFinding = {
  id: string;
  questionNumber: number;
  title: string;
  detail: string;
  severity: ReviewFindingSeverity;
  filter: SmartReviewFilter;
};
type AiReviewReport = {
  findings: ReviewFinding[];
  ready: number;
  attention: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  publishReadiness: number;
  reasons: string[];
};

function displayReviewStatus(question: AiDraftQuestion): ExamPaperReviewStatus {
  if (question.reviewStatus === "APPROVED") return "Approved";
  if (question.reviewStatus === "REJECTED") return "Rejected";
  if (question.reviewStatus === "READY") return "Ready";
  if (question.reviewStatus === "MISSING_ANSWER" || question.missingItems.includes("Answer")) return "Missing Answer";
  if (question.reviewStatus === "MISSING_FORMULA" || question.missingItems.includes("Formula")) return "Missing Formula";
  if (question.reviewStatus === "MISSING_DIAGRAM" || question.reviewStatus === "MISSING_ASSET" || question.missingItems.includes("Diagram")) return "Missing Diagram";
  if (question.reviewStatus === "MISSING_OPTION" || question.missingItems.includes("Option") || question.reviewStatus === "MISSING_SOLUTION" || question.missingItems.includes("Solution") || question.reviewStatus === "INCOMPLETE") return "Incomplete";
  return "Needs Review";
}

function reviewStatusTone(status: ExamPaperReviewStatus) {
  if (status === "Approved" || status === "Ready") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "Rejected") return "border-rose-200 bg-rose-50 text-rose-900";
  if (status === "Missing Answer" || status === "Missing Formula" || status === "Missing Diagram" || status === "Incomplete") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-900";
}

function reviewSeverityTone(severity: ReviewFindingSeverity) {
  if (severity === "READY") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (severity === "HIGH") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "MEDIUM") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-900";
}

function normalizeQuestionForPreview(question: AiDraftQuestion, index: number): AiDraftQuestion {
  const nextNumber = Number.isFinite(question.number) && question.number > 0 ? question.number : index + 1;
  return {
    ...question,
    number: nextNumber,
    questionText: cleanDraftQuestionText(question.questionText),
    options: question.options.map((option, optionIndex) => ({
      label: option.label?.trim() || String.fromCharCode(65 + optionIndex),
      text: cleanDraftText(option.text) || `Option ${String.fromCharCode(65 + optionIndex)} requires review`,
    })),
    linkedAnswer: question.linkedAnswer ? cleanDraftText(question.linkedAnswer) : undefined,
    linkedSolution: question.linkedSolution ? cleanDraftText(question.linkedSolution) : undefined,
    recoveredFormula: question.recoveredFormula ? cleanDraftText(question.recoveredFormula) : undefined,
  };
}

function questionMatchesSmartFilter(question: AiDraftQuestion, filter: SmartReviewFilter, findings: ReviewFinding[]) {
  if (filter === "ALL") return true;
  const status = displayReviewStatus(question);
  const questionFindings = findings.filter((finding) => finding.questionNumber === question.number);
  if (filter === "READY") return status === "Ready" || status === "Approved";
  if (filter === "NEEDS_REVIEW") return status === "Needs Review" || questionFindings.some((finding) => finding.filter === "NEEDS_REVIEW");
  if (filter === "MISSING_ANSWERS") return questionFindings.some((finding) => finding.filter === "MISSING_ANSWERS");
  if (filter === "FORMULA_ISSUES") return questionFindings.some((finding) => finding.filter === "FORMULA_ISSUES");
  if (filter === "DIAGRAM_ISSUES") return questionFindings.some((finding) => finding.filter === "DIAGRAM_ISSUES");
  if (filter === "LOW_CONFIDENCE") return questionFindings.some((finding) => finding.filter === "LOW_CONFIDENCE");
  if (filter === "DUPLICATES") return questionFindings.some((finding) => finding.filter === "DUPLICATES");
  if (filter === "INCOMPLETE") return status === "Incomplete" || questionFindings.some((finding) => finding.filter === "INCOMPLETE");
  if (filter === "REJECTED") return status === "Rejected";
  return true;
}

function reviewGroups(draft: AiExamDraft, filter: SmartReviewFilter, report: AiReviewReport) {
  const normalized = draft.questions.map(normalizeQuestionForPreview);
  const filtered = normalized.filter((question) => questionMatchesSmartFilter(question, filter, report.findings));
  const groups = [
    { title: "High Confidence", questions: filtered.filter((question) => ["Ready", "Approved"].includes(displayReviewStatus(question))) },
    { title: "Needs Review", questions: filtered.filter((question) => displayReviewStatus(question) === "Needs Review") },
    { title: "Incomplete Questions", questions: filtered.filter((question) => ["Missing Answer", "Missing Formula", "Missing Diagram", "Incomplete"].includes(displayReviewStatus(question))) },
    { title: "Rejected", questions: filtered.filter((question) => displayReviewStatus(question) === "Rejected") },
  ];
  return groups.filter((group) => group.questions.length);
}

function buildAiReviewReport(draft: AiExamDraft): AiReviewReport {
  const questions = draft.questions.map(normalizeQuestionForPreview);
  const normalizedText = (value: string) => cleanDraftText(value).toLowerCase();
  const firstSeen = new Map<string, number>();
  const duplicateNumbers = new Set<number>();
  for (const question of questions) {
    const key = normalizedText(question.questionText);
    if (!key || key.length < 12) continue;
    const first = firstSeen.get(key);
    if (first) duplicateNumbers.add(question.number);
    else firstSeen.set(key, question.number);
  }
  const findings: ReviewFinding[] = [];
  for (const question of questions) {
    const status = displayReviewStatus(question);
    const optionMissing = question.missingItems.includes("Option") || question.options.some((option) => /requires review/i.test(option.text));
    const formulaMissing = question.missingItems.includes("Formula");
    const diagramMissing = question.missingItems.includes("Diagram");
    const answerMissing = question.missingItems.includes("Answer") || !question.linkedAnswer;
    const solutionMissing = question.missingItems.includes("Solution") || !question.linkedSolution;
    const lowConfidence = question.draftConfidence < 0.7;
    const sourceMissing = !question.sourcePage && !question.sourceReference;
    const duplicate = duplicateNumbers.has(question.number);

    if (status === "Ready" || status === "Approved") {
      findings.push({ id: `ready-${question.number}`, questionNumber: question.number, title: "Ready", detail: "Question looks ready for teacher approval.", severity: "READY", filter: "READY" });
    }
    if (optionMissing) findings.push({ id: `option-${question.number}`, questionNumber: question.number, title: "Missing option", detail: "One or more options need teacher review.", severity: "HIGH", filter: "INCOMPLETE" });
    if (formulaMissing) findings.push({ id: `formula-${question.number}`, questionNumber: question.number, title: "Formula should be reviewed", detail: "Formula preview needs teacher confirmation.", severity: "MEDIUM", filter: "FORMULA_ISSUES" });
    if (diagramMissing) findings.push({ id: `diagram-${question.number}`, questionNumber: question.number, title: "Diagram appears incomplete", detail: "Diagram, graph or table source needs review.", severity: "MEDIUM", filter: "DIAGRAM_ISSUES" });
    if (answerMissing) findings.push({ id: `answer-${question.number}`, questionNumber: question.number, title: "Missing answer key", detail: "Correct answer is not confidently linked.", severity: "HIGH", filter: "MISSING_ANSWERS" });
    if (solutionMissing && question.linkedAnswer) findings.push({ id: `solution-${question.number}`, questionNumber: question.number, title: "Solution not linked", detail: "No solution preview is linked.", severity: "LOW", filter: "NEEDS_REVIEW" });
    if (lowConfidence) findings.push({ id: `confidence-${question.number}`, questionNumber: question.number, title: "Confidence low", detail: "AI is not fully confident about this question.", severity: "MEDIUM", filter: "LOW_CONFIDENCE" });
    if (sourceMissing) findings.push({ id: `source-${question.number}`, questionNumber: question.number, title: "Source crop missing", detail: "Original source reference is not linked yet.", severity: "LOW", filter: "NEEDS_REVIEW" });
    if (duplicate) findings.push({ id: `duplicate-${question.number}`, questionNumber: question.number, title: `Duplicate Question ${question.number}`, detail: "This question appears similar to an earlier question.", severity: "HIGH", filter: "DUPLICATES" });
    if (status === "Rejected") findings.push({ id: `rejected-${question.number}`, questionNumber: question.number, title: "Rejected", detail: "Question is marked rejected.", severity: "HIGH", filter: "REJECTED" });
    if (status === "Needs Review" && !findings.some((finding) => finding.questionNumber === question.number && finding.severity !== "READY")) {
      findings.push({ id: `review-${question.number}`, questionNumber: question.number, title: "Needs Review", detail: "Teacher confirmation is needed.", severity: "MEDIUM", filter: "NEEDS_REVIEW" });
    }
  }
  const ready = questions.filter((question) => ["Ready", "Approved"].includes(displayReviewStatus(question))).length;
  const highRisk = findings.filter((finding) => finding.severity === "HIGH").length;
  const mediumRisk = findings.filter((finding) => finding.severity === "MEDIUM").length;
  const lowRisk = findings.filter((finding) => finding.severity === "LOW").length;
  const attention = Array.from(new Set(findings.filter((finding) => finding.severity !== "READY").map((finding) => finding.questionNumber))).length;
  const publishReadiness = questions.length ? Math.max(0, Math.min(100, Math.round((ready / questions.length) * 100) - highRisk * 4 - mediumRisk * 2 - lowRisk)) : 0;
  const reasons = [
    answerIssueCount(findings) ? `${answerIssueCount(findings)} question(s) missing answers` : "",
    findings.filter((finding) => finding.filter === "FORMULA_ISSUES").length ? `${findings.filter((finding) => finding.filter === "FORMULA_ISSUES").length} formula review pending` : "",
    findings.filter((finding) => finding.filter === "DIAGRAM_ISSUES").length ? `${findings.filter((finding) => finding.filter === "DIAGRAM_ISSUES").length} diagram review pending` : "",
    findings.filter((finding) => finding.filter === "DUPLICATES").length ? `${findings.filter((finding) => finding.filter === "DUPLICATES").length} duplicate question(s)` : "",
  ].filter(Boolean);
  return { findings, ready, attention, highRisk, mediumRisk, lowRisk, publishReadiness, reasons };
}

function answerIssueCount(findings: ReviewFinding[]) {
  return findings.filter((finding) => finding.filter === "MISSING_ANSWERS").length;
}

function ReviewSummaryStrip({ report }: { report: AiReviewReport }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      <MiniFact label="Ready" value={report.ready} />
      <MiniFact label="Needs Attention" value={report.attention} />
      <MiniFact label="High Risk" value={report.highRisk} />
      <MiniFact label="Medium Risk" value={report.mediumRisk} />
      <MiniFact label="Low Risk" value={report.lowRisk} />
      <MiniFact label="Publish Readiness" value={`${report.publishReadiness}%`} />
    </div>
  );
}

const smartReviewFilters: Array<{ id: SmartReviewFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "READY", label: "Ready" },
  { id: "NEEDS_REVIEW", label: "Needs Review" },
  { id: "MISSING_ANSWERS", label: "Missing Answers" },
  { id: "FORMULA_ISSUES", label: "Formula Issues" },
  { id: "DIAGRAM_ISSUES", label: "Diagram Issues" },
  { id: "LOW_CONFIDENCE", label: "Low Confidence" },
  { id: "DUPLICATES", label: "Duplicates" },
  { id: "INCOMPLETE", label: "Incomplete" },
  { id: "REJECTED", label: "Rejected" },
];

function smartFilterCount(filter: SmartReviewFilter, draft: AiExamDraft, report: AiReviewReport) {
  const questions = draft.questions.map(normalizeQuestionForPreview);
  return questions.filter((question) => questionMatchesSmartFilter(question, filter, report.findings)).length;
}

function SmartReviewFilters({ activeFilter, draft, onChange, report }: { activeFilter: SmartReviewFilter; draft: AiExamDraft; onChange: (filter: SmartReviewFilter) => void; report: AiReviewReport }) {
  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
      {smartReviewFilters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
            activeFilter === filter.id
              ? "border-[var(--navy)] bg-[var(--navy)] text-white"
              : "border-[var(--border)] bg-white text-[var(--muted-blue)] hover:border-[var(--navy)] hover:text-[var(--navy)]"
          }`}
        >
          {filter.label} <span className="ml-1 opacity-75">{smartFilterCount(filter.id, draft, report)}</span>
        </button>
      ))}
    </div>
  );
}

function AiReviewAssistantPanel({ onOpenFinding, report }: { onOpenFinding: (finding: ReviewFinding) => void; report: AiReviewReport }) {
  const attentionFindings = report.findings.filter((finding) => finding.severity !== "READY");
  const visibleFindings = attentionFindings.slice(0, 8);
  return (
    <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold-dark)]">AI Review Report</p>
          <h5 className="mt-1 text-lg font-black">Review only what needs attention</h5>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-black ${report.publishReadiness >= 90 ? "bg-emerald-50 text-emerald-800" : report.publishReadiness >= 75 ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-900"}`}>
          {report.publishReadiness}% Publish Readiness
        </span>
      </div>
      {report.reasons.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-950">{reason}</span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {visibleFindings.length ? visibleFindings.map((finding) => (
          <button
            key={finding.id}
            type="button"
            onClick={() => onOpenFinding(finding)}
            className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${reviewSeverityTone(finding.severity)}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black">Question {finding.questionNumber}: {finding.title}</p>
              <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">{finding.severity === "HIGH" ? "High Risk" : finding.severity === "MEDIUM" ? "Medium Risk" : "Low Risk"}</span>
            </div>
            <p className="mt-1 text-xs font-bold opacity-80">{finding.detail}</p>
          </button>
        )) : (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900">
            Every question looks ready. Teacher approval can move quickly.
          </p>
        )}
      </div>
    </div>
  );
}

function VisualPreview({ question }: { question: AiDraftQuestion }) {
  const hasVisual = question.originalCrop || question.linkedAssets.some((asset) => /diagram|graph|table|visual|page|source/i.test(asset));
  if (!hasVisual) return null;
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-950">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Diagram / Table / Graph Preview</p>
      {question.originalCrop ? (
        <Image src={question.originalCrop} alt={`Question ${question.number} visual preview`} width={960} height={540} unoptimized className="mt-3 max-h-72 w-full rounded-xl border border-blue-100 object-contain" />
      ) : (
        <p className="mt-2 rounded-xl border border-blue-100 bg-white p-3 text-sm font-bold">
          Visual preserved from {question.sourceReference || "the original paper"}. Open Review Questions to inspect the exact crop.
        </p>
      )}
    </div>
  );
}

function ExamPaperQuestionCard({ active, question }: { active?: boolean; question: AiDraftQuestion }) {
  const status = displayReviewStatus(question);
  return (
    <article id={`exam-review-question-${question.number}`} className={`rounded-3xl border bg-white p-5 shadow-sm transition ${active ? "border-[var(--gold)] ring-4 ring-[rgba(185,138,48,0.18)]" : "border-[var(--border)]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--gold-dark)]">Question {question.number}</p>
          <h5 className="mt-1 text-lg font-black">{universalQuestionTypeLabel(question.questionType)}</h5>
        </div>
        <span className={`rounded-full border px-4 py-2 text-xs font-black ${reviewStatusTone(status)}`}>
          {status}
        </span>
      </div>
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-base font-black leading-7 text-slate-950">
        <NidusMathText text={question.questionText} />
      </div>
      {question.options.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {question.options.map((option) => (
            <p key={`${question.number}-${option.label}`} className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm font-bold text-[var(--ink)]">
              <b>{option.label}.</b> <NidusMathText text={option.text} />
            </p>
          ))}
        </div>
      ) : null}
      {question.recoveredFormula ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-950">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Formula Preview</span>
          <NidusMathText text={question.recoveredFormula} />
        </div>
      ) : null}
      <VisualPreview question={question} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-950">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Answer Preview</p>
          <p className="mt-1 text-sm font-black">{question.linkedAnswer || "No answer linked."}</p>
          <p className="mt-1 text-xs font-bold opacity-75">Confidence: {confidenceLabel(Math.round(question.draftConfidence * 100))}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">Solution Preview</p>
          <p className="mt-1 text-sm font-bold leading-5 text-slate-950">{question.linkedSolution || "No solution linked."}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[var(--muted-blue)]">Confidence: {confidenceLabel(Math.round(question.draftConfidence * 100))}</span>
        {question.sourcePage ? <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[var(--muted-blue)]">Source Page {question.sourcePage}</span> : null}
        {question.sourceReference ? <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-[var(--muted-blue)]">{question.sourceReference}</span> : null}
        {question.missingItems.map((item) => (
          <span key={item} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-950">Missing {item}</span>
        ))}
      </div>
      {question.notes.length ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          {question.notes.join(" ")}
        </p>
      ) : null}
    </article>
  );
}

function AiDraftPreview({ draft }: { draft: AiExamDraft }) {
  const [activeFilter, setActiveFilter] = useState<SmartReviewFilter>("ALL");
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const report = useMemo(() => buildAiReviewReport(draft), [draft]);
  const groups = useMemo(() => reviewGroups(draft, activeFilter, report), [activeFilter, draft, report]);
  const openFinding = (finding: ReviewFinding) => {
    setActiveFilter(finding.filter);
    setActiveQuestion(finding.questionNumber);
    window.setTimeout(() => {
      document.getElementById(`exam-review-question-${finding.questionNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Exam paper preview</p>
          <h4 className="mt-1 text-xl font-black">Review the paper students will see</h4>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--muted-blue)]">Auto-fixed numbering, option labels and spacing are shown here without changing teacher meaning.</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-black ${draft.needsReview ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
          {draft.needsReview ? "Teacher Review Needed" : "Draft Ready"}
        </span>
      </div>
      <ReviewSummaryStrip report={report} />
      <AiReviewAssistantPanel report={report} onOpenFinding={openFinding} />
      <SmartReviewFilters activeFilter={activeFilter} draft={draft} report={report} onChange={setActiveFilter} />
      <div className="mt-5 grid gap-5">
        {groups.map((group) => (
          <section key={group.title} className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h5 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--muted-blue)]">{group.title}</h5>
              <span className="rounded-full bg-[var(--page-bg)] px-3 py-1 text-xs font-black text-[var(--muted-blue)]">{group.questions.length}</span>
            </div>
            {group.questions.map((question) => <ExamPaperQuestionCard key={`${group.title}-${question.number}`} question={question} active={activeQuestion === question.number} />)}
          </section>
        ))}
        {!groups.length ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-5 text-sm font-black text-[var(--muted-blue)]">
            {draft.questions.length ? "No questions match this review filter." : "Upload a question paper to generate the exam paper preview."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function DraftQualitySummary({ quality }: { quality: AiDraftQuality }) {
  const items = [
    { label: "Formula Preservation", value: quality.formulaPreservation },
    { label: "Visual Preservation", value: quality.visualPreservation },
    { label: "Question Completeness", value: quality.questionCompleteness },
    { label: "Answer Completeness", value: quality.answerCompleteness },
    { label: "Overall Draft Quality", value: quality.overall },
  ];
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.value === "High" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : item.value === "Medium" ? "border-blue-200 bg-blue-50 text-blue-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">{item.label}</p>
          <p className="mt-1 text-sm font-black">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function TeacherUploadProgressCard({ state, busy }: { state: TeacherUploadState; busy: boolean }) {
  const copy: Record<TeacherUploadState, { title: string; detail: string; tone: string }> = {
    IDLE: { title: "Waiting for upload", detail: "Upload a question paper to begin.", tone: "border-[var(--border)] bg-white text-[var(--muted-blue)]" },
    ANALYZING_DOCUMENT: { title: "Analyzing document...", detail: "NIDUS AI is checking the file.", tone: "border-blue-200 bg-blue-50 text-blue-950" },
    UNDERSTANDING_PAPER: { title: "Understanding paper...", detail: "The original paper is preserved while the draft is prepared.", tone: "border-blue-200 bg-blue-50 text-blue-950" },
    BUILDING_AI_DRAFT: { title: "Building AI draft...", detail: "Questions, formulas and visuals are being organized for review.", tone: "border-blue-200 bg-blue-50 text-blue-950" },
    PREPARING_REVIEW: { title: "Preparing review...", detail: "The draft is being prepared for teacher review.", tone: "border-blue-200 bg-blue-50 text-blue-950" },
    DRAFT_READY: { title: "Draft Ready", detail: "The paper is ready for review.", tone: "border-emerald-200 bg-emerald-50 text-emerald-950" },
    NEEDS_REVIEW: { title: "Needs Review", detail: "Some parts need teacher confirmation before publishing.", tone: "border-amber-200 bg-amber-50 text-amber-950" },
    READY_FOR_PUBLISH: { title: "Ready for Publish", detail: "The draft has passed the teacher checklist.", tone: "border-emerald-200 bg-emerald-50 text-emerald-950" },
    PASSWORD_PROTECTED: { title: "Password protected PDF", detail: "Please upload an unlocked copy of this paper.", tone: "border-rose-200 bg-rose-50 text-rose-950" },
    CORRUPTED_FILE: { title: "Corrupted file", detail: "NIDUS could not open this file. Please upload a fresh copy.", tone: "border-rose-200 bg-rose-50 text-rose-950" },
    UNSUPPORTED_DOCUMENT: { title: "Unsupported document", detail: "Please upload PDF, Word, TXT, JPG, PNG, WEBP, TIFF or HEIC.", tone: "border-rose-200 bg-rose-50 text-rose-950" },
  };
  const item = copy[state];
  const active = busy || state === "ANALYZING_DOCUMENT" || state === "UNDERSTANDING_PAPER" || state === "BUILDING_AI_DRAFT" || state === "PREPARING_REVIEW";
  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${item.tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">Upload status</p>
          <h4 className="mt-1 text-lg font-black">{item.title}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">{item.detail}</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-black">{active ? "Working" : "Updated"}</span>
      </div>
      {active ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/75">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-current opacity-35" />
        </div>
      ) : null}
    </section>
  );
}

function TeacherDocumentUnderstandingCard({
  questionReport,
  answerReport,
  subject,
  paperStyle,
  difficulty,
  questionsDetected,
  pages,
  formulaCount,
  diagramCount,
  graphCount,
  tableCount,
  reviewConfidence,
  answerKeyAdded,
}: {
  questionReport?: ExtractionReport;
  answerReport?: ExtractionReport;
  subject: string;
  paperStyle: string;
  difficulty: string;
  questionsDetected: number;
  pages?: number;
  formulaCount: number;
  diagramCount: number;
  graphCount: number;
  tableCount: number;
  reviewConfidence?: number;
  answerKeyAdded: boolean;
}) {
  const hasPaper = Boolean(questionReport);
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Document understanding</p>
          <h4 className="mt-1 text-xl font-black">{hasPaper ? "NIDUS AI understood the paper" : "Upload a paper to see the summary"}</h4>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-black ${hasPaper ? "bg-emerald-50 text-emerald-800" : "bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>
          {hasPaper ? "Draft Created" : "Pending"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TeacherMetric label="Document Type" value={teacherDocumentLabel(questionReport?.documentType)} />
        <TeacherMetric label="Subject" value={subject || "General"} />
        <TeacherMetric label="Paper Style" value={paperStyle} />
        <TeacherMetric label="Difficulty" value={difficulty} />
        <TeacherMetric label="Questions detected" value={String(questionsDetected || questionReport?.detectedQuestions || "Review draft")} />
        <TeacherMetric label="Pages" value={String(pages || questionReport?.pageCount || "Pending")} />
        <TeacherMetric label="Formula count" value={String(formulaCount)} />
        <TeacherMetric label="Diagram count" value={String(diagramCount)} />
        <TeacherMetric label="Graph count" value={String(graphCount)} />
        <TeacherMetric label="Table count" value={String(tableCount)} />
        <TeacherMetric label="Review confidence" value={confidenceLabel(reviewConfidence)} />
        <TeacherMetric label="Answer Key" value={answerKeyAdded || answerReport ? "Uploaded" : "No answer key uploaded yet"} />
      </div>
    </section>
  );
}

function TeacherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function ExamStatusCard({
  questionPaperUploaded,
  answerKeyUploaded,
  analysisComplete,
  questionsDetected,
  reviewRequired,
  readyToPublish,
  subject,
  stemDetected,
}: {
  questionPaperUploaded: boolean;
  answerKeyUploaded: boolean;
  analysisComplete: boolean;
  questionsDetected: number;
  reviewRequired: boolean;
  readyToPublish: boolean;
  subject: string;
  stemDetected: boolean;
}) {
  const items = [
    { label: "Question Paper Uploaded", done: questionPaperUploaded },
    { label: "Answer Key Uploaded", done: answerKeyUploaded },
    { label: "AI Analysis Complete", done: analysisComplete },
    { label: questionsDetected ? `${questionsDetected} Questions Detected` : "Questions Detected", done: questionsDetected > 0 },
    { label: reviewRequired ? "Review Required" : "Review Not Required", done: reviewRequired || (analysisComplete && questionsDetected > 0) },
    { label: "Ready to Publish", done: readyToPublish },
  ];
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Exam status</p>
          <h4 className="mt-1 text-lg font-black">{readyToPublish ? "Ready for final check" : "Complete these steps"}</h4>
        </div>
        {stemDetected ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
            {subject || "STEM"} review
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-black ${item.done ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-[var(--border)] bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>
            <CheckCircle2 size={17} className={item.done ? "text-emerald-700" : "text-slate-300"} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {stemDetected && !questionsDetected ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
          Mathematics or formula-heavy paper detected. AI has prepared this paper for review, so the teacher can check the source before publishing.
        </p>
      ) : null}
    </section>
  );
}

function DraftImportSummary({
  questionReport,
  answerReport,
  questionsDetected,
  answerKeyAdded,
  reviewRequired,
}: {
  questionReport?: ExtractionReport;
  answerReport?: ExtractionReport;
  questionsDetected: number;
  answerKeyAdded: boolean;
  reviewRequired: boolean;
}) {
  const overallConfidence = questionReport?.confidence?.overall || answerReport?.confidence?.overall;
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Import summary</p>
          <h4 className="mt-1 text-xl font-black">{questionReport ? "Draft Created" : "Waiting for upload"}</h4>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-black ${reviewRequired ? "bg-amber-50 text-amber-900" : questionReport ? "bg-emerald-50 text-emerald-800" : "bg-[var(--page-bg)] text-[var(--muted-blue)]"}`}>
          {reviewRequired ? "Needs Review" : questionReport ? "Draft Ready" : "Upload Paper"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">Question Paper</p>
          <p className="mt-2 text-lg font-black">{questionReport ? "Uploaded" : "Pending"}</p>
          <div className="mt-3 grid gap-2 text-sm font-bold text-[var(--muted-blue)]">
            <p>Detected: <span className="text-slate-950">{teacherDocumentLabel(questionReport?.documentType)}</span></p>
            <p>Pages: <span className="text-slate-950">{questionReport?.pageCount || "Pending"}</span></p>
            <p>Questions detected: <span className="text-slate-950">{questionsDetected || questionReport?.detectedQuestions || "Review draft"}</span></p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted-blue)]">Answer Key</p>
          <p className="mt-2 text-lg font-black">{answerKeyAdded || answerReport ? "Detected" : "No answer key uploaded yet"}</p>
          <div className="mt-3 grid gap-2 text-sm font-bold text-[var(--muted-blue)]">
            <p>Answer Confidence: <span className="text-slate-950">{confidenceLabel(answerReport?.confidence?.answer)}</span></p>
            <p>Document Confidence: <span className="text-slate-950">{confidenceLabel(questionReport?.confidence?.document)}</span></p>
            <p>Overall Confidence: <span className="text-slate-950">{confidenceLabel(overallConfidence)}</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StemReviewNotice({ subject }: { subject: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em]">Review workspace</p>
      <h4 className="mt-2 text-xl font-black">{subject || "Mathematics"} paper detected</h4>
      <p className="mt-2 max-w-2xl text-sm font-bold leading-6">
        AI has prepared this paper for review. Check the preserved source, formulas, diagrams and answer key before publishing.
      </p>
    </section>
  );
}

function ImportValidationPanel({
  validation,
  busy,
  onValidate,
  onOpenQuestion,
  compact = false,
}: {
  validation: ImportValidationPayload | null;
  busy: boolean;
  onValidate: () => void;
  onOpenQuestion: (number: number) => void;
  compact?: boolean;
}) {
  const tone = !validation
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : validation.summary.manualCorrection > 0
      ? "border-rose-200 bg-rose-50 text-rose-950"
        : validation.summary.needsReview > 0
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950";
  const flagged = validation?.questionReports.filter((report) => report.status !== "AUTO_APPROVED") ?? [];
  const heatMap = buildConfidenceHeatMap(validation);
  return (
    <section className={`rounded-2xl border p-4 ${tone} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">NIDUS AI validation</p>
          <h4 className="mt-1 text-lg font-black">
            {!validation ? "Run before publishing" : validation.publishReady ? "Import validated" : "Review flagged questions"}
          </h4>
          <p className="mt-1 text-sm font-bold opacity-75">
            {validation ? "Review the flagged items, then continue to publish." : "Checks the paper, answer key and questions before students see the exam."}
          </p>
        </div>
        <button type="button" onClick={onValidate} disabled={busy} className="min-h-10 rounded-xl border border-slate-950 bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60">
          {busy ? "Validating..." : validation ? "Re-run" : "Run validation"}
        </button>
      </div>
      {validation ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MiniFact label="Approved" value={heatMap.high.length || validation.summary.autoApproved} />
            <MiniFact label="Review" value={heatMap.review.length || validation.summary.needsReview} />
            <MiniFact label="Fix" value={heatMap.fix.length || validation.summary.manualCorrection} />
            <MiniFact label="Ready" value={validation.publishReady ? "Yes" : "No"} />
          </div>
          <ConfidenceHeatMap reports={validation.questionReports} onOpenQuestion={onOpenQuestion} compact={compact} />
          {flagged.length ? (
            <div className="mt-3 grid gap-2">
              {flagged.slice(0, compact ? 5 : 10).map((report) => (
                <button key={report.number} type="button" onClick={() => onOpenQuestion(report.number)} className={`rounded-xl border p-3 text-left text-xs font-bold leading-5 ${confidenceHeatBadgeClass(confidenceHeatTone(report.confidence, report.status))}`}>
                  <span className="font-black">Q{report.number}: {confidenceHeatLabel(confidenceHeatTone(report.confidence, report.status))} / {report.confidence}% / {report.status.replace(/_/g, " ")}</span>
                  {[...report.issues, ...report.warnings].length ? <span className="mt-1 block opacity-80">{[...report.issues, ...report.warnings].slice(0, 3).join(" ")}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black">No AI validation issues found.</p>
          )}
          {validation.recommendations.length ? (
            <ul className="mt-3 grid gap-1 text-xs font-bold leading-5">
              {validation.recommendations.slice(0, compact ? 2 : 4).map((item) => <li key={item}>- {item}</li>)}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
          Publishing is locked until validation runs. This keeps mathematics, physics, diagrams, tables and answer keys from slipping through silently.
        </p>
      )}
    </section>
  );
}

function ConfidenceHeatMap({
  reports,
  onOpenQuestion,
  compact = false,
}: {
  reports: ImportValidationPayload["questionReports"];
  onOpenQuestion: (number: number) => void;
  compact?: boolean;
}) {
  const visibleReports = compact ? reports.slice(0, 40) : reports;
  return (
    <div className="mt-3 rounded-xl border border-current/10 bg-white/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">Review map</p>
        <div className="flex flex-wrap gap-1 text-[10px] font-black uppercase tracking-[0.12em]">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-900">Approved</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900">Review</span>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-900">Fix</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
        {visibleReports.map((report) => {
          const tone = confidenceHeatTone(report.confidence, report.status);
          return (
            <button
              key={report.number}
              type="button"
              title={`Q${report.number}: ${confidenceHeatLabel(tone)} / ${report.confidence}% / ${report.status.replace(/_/g, " ")}`}
              onClick={() => onOpenQuestion(report.number)}
              className={`grid h-9 place-items-center rounded-lg border text-xs font-black transition ${confidenceHeatButtonClass(tone, false)}`}
            >
              {report.number}
            </button>
          );
        })}
      </div>
      {compact && reports.length > visibleReports.length ? (
        <p className="mt-2 text-xs font-bold opacity-75">{reports.length - visibleReports.length} more question(s) are available in the full check view.</p>
      ) : null}
    </div>
  );
}

function SourceReviewCoveragePanel({
  coverage,
  mappings,
}: {
  coverage: {
    totalMapped: number;
    confirmed: number;
    pending: number;
    visualRequired: number;
    visualConfirmed: number;
    publishReady: boolean;
  };
  mappings: Record<number, SourceReviewMapping>;
}) {
  const tone = coverage.publishReady ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950";
  const confirmedNumbers = Object.entries(mappings)
    .filter(([, mapping]) => mapping.reviewStatus === "TEACHER_CONFIRMED")
    .map(([number]) => Number(number))
    .sort((a, b) => a - b);
  return (
    <section className={`mt-4 rounded-2xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Source review mapping</p>
          <h4 className="mt-1 text-lg font-black">{coverage.publishReady ? "Original paper linkage ready" : "Confirm visual source areas"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Each confirmed mapping stores page and normalized coordinates for audit, replay and future PDF overlays.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{coverage.confirmed} confirmed</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Mapped" value={coverage.totalMapped} />
        <MiniFact label="Confirmed" value={coverage.confirmed} />
        <MiniFact label="Visual Need" value={coverage.visualRequired} />
        <MiniFact label="Visual Confirmed" value={coverage.visualConfirmed} />
      </div>
      {confirmedNumbers.length ? (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
          Confirmed question(s): {confirmedNumbers.slice(0, 30).join(", ")}{confirmedNumbers.length > 30 ? "..." : ""}
        </p>
      ) : (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
          No exact source coordinates confirmed yet. Step 3 can still use estimated full-page mapping, but visual STEM papers should be confirmed question by question.
        </p>
      )}
    </section>
  );
}

function ImportQualityScorePanel({ quality }: { quality: ImportQualityScore }) {
  const tone = quality.status === "PUBLISH_READY"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : quality.status === "REVIEW_REQUIRED"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  const visibleIssues = quality.blockers.length ? quality.blockers : quality.warnings;
  return (
    <section className={`mt-4 rounded-2xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Import quality score</p>
          <h4 className="mt-1 text-2xl font-black">{quality.score}% / Grade {quality.grade}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">{quality.status.replace(/_/g, " ")}</p>
        </div>
        <div className="min-w-36 rounded-2xl border border-current/10 bg-white/80 p-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">NDIE Rating</p>
          <p className="mt-1 text-3xl font-black">{quality.grade}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MiniFact label="AI" value={quality.subscores.aiValidation} />
        <MiniFact label="Paper" value={quality.subscores.paperReadiness} />
        <MiniFact label="Visual" value={quality.subscores.visualSource} />
        <MiniFact label="Formula" value={quality.subscores.formulaReview} />
        <MiniFact label="Teacher" value={quality.subscores.teacherApproval} />
        <MiniFact label="Relations" value={quality.subscores.relationshipModel} />
        <MiniFact label="Replay" value={quality.subscores.replayReadiness} />
      </div>
      {visibleIssues.length ? (
        <ul className="mt-3 grid gap-1 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-bold leading-5">
          {visibleIssues.slice(0, 6).map((issue) => <li key={issue}>- {issue}</li>)}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black">No blockers or warnings remain in the import quality score.</p>
      )}
      {quality.strengths.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {quality.strengths.slice(0, 5).map((strength) => (
            <span key={strength} className="rounded-full border border-current/10 bg-white/80 px-3 py-1 text-xs font-black">{strength}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FormulaReviewCoveragePanel({
  coverage,
}: {
  coverage: {
    formulaQuestions: number[];
    required: number;
    confirmed: number;
    pending: number;
    publishReady: boolean;
  };
}) {
  if (!coverage.required) return null;
  return (
    <section className={`mt-4 rounded-2xl border p-4 ${coverage.publishReady ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Formula editor</p>
          <h4 className="mt-1 text-lg font-black">{coverage.publishReady ? "Formula rendering confirmed" : "Formula review pending"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Fractions, radicals, powers and symbols are reviewed before the paper reaches students.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{coverage.confirmed}/{coverage.required}</span>
      </div>
      <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
        Formula question(s): {coverage.formulaQuestions.join(", ")}
      </p>
    </section>
  );
}

function QuestionTypeDistributionPanel({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution).filter(([, count]) => count > 0);
  if (!entries.length) return null;
  return (
    <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-950">
      <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Rich question type plan</p>
      <h4 className="mt-1 text-lg font-black">Enterprise question model ready</h4>
      <p className="mt-1 text-sm font-bold opacity-75">These types are stored in rich JSON while the current CBT remains MCQ-compatible.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map(([type, count]) => (
          <span key={type} className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black">
            {questionTypeLabel(type as RichQuestionType)}: {count}
          </span>
        ))}
      </div>
    </section>
  );
}

function QuestionRelationshipPanel({ plan }: { plan: QuestionRelationshipPlan }) {
  if (!plan.groups.length) return null;
  return (
    <section className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Question relationships</p>
          <h4 className="mt-1 text-lg font-black">Shared passages and source groups detected</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Related questions keep one common source, passage, diagram or section reference for future rich exams.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{plan.groups.length} group(s)</span>
      </div>
      <div className="mt-3 grid gap-2">
        {plan.groups.slice(0, 8).map((group) => (
          <div key={group.id} className="rounded-xl border border-indigo-100 bg-white/85 p-3 text-xs font-bold leading-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black">{group.title}</span>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 font-black">{group.type.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1">Question(s): {group.questionNumbers.join(", ")}{group.sourcePage ? ` / Page ${group.sourcePage}` : ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImportReplayPanel({ manifest }: { manifest: ImportReplayManifest }) {
  return (
    <section className={`mt-4 rounded-2xl border p-4 ${manifest.replayAvailable ? "border-cyan-200 bg-cyan-50 text-cyan-950" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-75">Original paper backup</p>
          <h4 className="mt-1 text-lg font-black">{manifest.replayAvailable ? "Original paper is safely preserved" : "Original paper backup needs attention"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Future improvements can compare a new draft with the current teacher-approved paper.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{manifest.sourceUploads.length} source file(s)</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Questions" value={manifest.lastKnownQuestionCount} />
        <MiniFact label="Backup ID" value={manifest.preservedQuestionTextHash} />
        <MiniFact label="Visuals Checked" value={`${manifest.sourceReviewCoverage.visualConfirmed}/${manifest.sourceReviewCoverage.visualRequired}`} />
        <MiniFact label="Review Options" value={manifest.replayModes.length} />
      </div>
      {manifest.sourceUploads.length ? (
        <div className="mt-3 grid gap-2">
          {manifest.sourceUploads.slice(0, 5).map((upload) => (
            <div key={upload.uploadId} className="rounded-xl border border-current/10 bg-white/80 p-3 text-xs font-bold leading-5">
              <p className="font-black">{upload.originalName}</p>
              <p className="mt-1 opacity-80">{upload.sourceKind.replace(/_/g, " ")} / {upload.documentClass || "UNKNOWN"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-4" />
    </label>
  );
}

function ResultReleasePanel({ payload }: { payload: ResultsPayload }) {
  const summary = payload.summary ?? {
    assignedStudents: payload.results.length,
    submitted: payload.results.length,
    pending: 0,
    averageScore: payload.results.length ? Math.round(payload.results.reduce((sum, row) => sum + row.score, 0) / payload.results.length) : 0,
    highestScore: payload.results.length ? Math.max(...payload.results.map((row) => row.score)) : 0,
    lowestScore: payload.results.length ? Math.min(...payload.results.map((row) => row.score)) : 0,
    totalMarks: payload.results[0]?.totalMarks ?? 0,
    releaseReady: payload.results.length > 0,
  };
  const tone = payload.released
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : summary.releaseReady
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <section className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Result release audit</p>
          <h4 className="mt-1 text-lg font-black">{payload.released ? "Official result published" : summary.releaseReady ? "Ready for faculty release" : "Waiting for submissions"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Release unlocks score, rank, solved paper, answer key and explanations for students.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{payload.released ? "Released" : "Locked"}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Submitted" value={`${summary.submitted}/${summary.assignedStudents || summary.submitted}`} />
        <MiniFact label="Pending" value={summary.pending} />
        <MiniFact label="Average" value={`${summary.averageScore}/${summary.totalMarks || "-"}`} />
        <MiniFact label="Top Score" value={`${summary.highestScore}/${summary.totalMarks || "-"}`} />
      </div>
    </section>
  );
}

function VisualFidelityPanel({ report, compact = false }: { report: VisualFidelityReport; compact?: boolean }) {
  const tone = report.confidence === "HIGH"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : report.confidence === "MEDIUM"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <div className={`rounded-2xl border p-4 ${tone} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Visual fidelity</p>
          <h4 className="mt-1 text-lg font-black">{report.sourcePreviewAvailable ? "Source preview attached" : "Source preview not attached"}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">Diagrams, tables, graphs and formula-heavy questions are checked before publish.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{report.confidence} confidence</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Visual" value={report.visualQuestionCount} />
        <MiniFact label="Tables" value={report.tableQuestionCount} />
        <MiniFact label="Graphs" value={report.graphQuestionCount} />
        <MiniFact label="Formula" value={report.formulaQuestionCount} />
      </div>
      {report.questionsNeedingReview.length ? (
        <p className="mt-3 rounded-xl border border-current/10 bg-white/75 p-3 text-xs font-black leading-5">
          Review question(s): {report.questionsNeedingReview.slice(0, compact ? 12 : 24).join(", ")}
          {report.questionsNeedingReview.length > (compact ? 12 : 24) ? "..." : ""}
        </p>
      ) : null}
      {[...report.blockers, ...report.warnings].length ? (
        <ul className="mt-3 grid gap-1 text-xs font-bold leading-5">
          {[...report.blockers, ...report.warnings].slice(0, compact ? 4 : 8).map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-bold opacity-75">No visual fidelity risk detected in the extracted questions.</p>
      )}
    </div>
  );
}

function QuestionFidelityNotice({ signal }: { signal?: PaperUnderstandingReport["questionSignals"][number] }) {
  if (!signal || !signal.notes.length) return null;
  const tone = signal.confidence === "LOW" ? "border-amber-300 bg-amber-50 text-amber-950" : "border-blue-200 bg-blue-50 text-blue-950";
  return (
    <div className={`mt-4 rounded-2xl border p-4 text-sm ${tone}`}>
      <p className="font-black">Faculty visual review needed</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {signal.notes.map((note) => (
          <span key={note} className="rounded-full border border-current/10 bg-white/75 px-3 py-1 text-xs font-black">{note}</span>
        ))}
      </div>
    </div>
  );
}

function VisualSourcePreviewPanel({
  uploads,
  report,
  activeIndex,
  assets = [],
  attachedImage,
  questionCount,
  sourceMapping,
  onAttachVisual,
  onSourceMappingChange,
}: {
  uploads: ExamUploadRecord[];
  report: PaperUnderstandingReport;
  activeIndex: number;
  assets?: QuestionVisualAsset[];
  attachedImage?: string;
  questionCount: number;
  sourceMapping?: SourceReviewMapping;
  onAttachVisual?: (dataUrl: string) => void;
  onSourceMappingChange?: (mapping: SourceReviewMapping) => void;
}) {
  const source = uploads.find((upload) => upload.sourceKind === "QUESTION_PAPER") ?? uploads[0];
  const sourceUrl = source?.localPreviewUrl || source?.signedUrl || source?.cloudinaryUrl || "";
  const fileType = source?.fileType || "";
  const fileName = (source?.originalName || source?.fileName || "").toLowerCase();
  const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
  const isImage = fileType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const signal = report.questionSignals[activeIndex];
  const [cropMessage, setCropMessage] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || "");
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<CropBox | null>(null);
  const currentQuestionNumber = activeIndex + 1;
  const mappedPage = sourceMapping?.page || selectedAsset?.pageNumber || estimateQuestionPage(currentQuestionNumber, questionCount, assets);

  useEffect(() => {
    if (!selectedAssetId && assets[0]?.id) setSelectedAssetId(assets[0].id);
  }, [assets, selectedAssetId]);

  async function attachRegion(asset: QuestionVisualAsset, region: VisualCropRegion) {
    if (!onAttachVisual) return;
    setCropMessage("");
    try {
      const dataUrl = await cropVisualAsset(asset.dataUrl, region);
      onAttachVisual(dataUrl);
      confirmSourceMapping(cropRegionBox(region), `${cropRegionLabel(region)} source region confirmed by teacher.`, asset);
      setCropMessage(`${cropRegionLabel(region)} region attached to Question ${activeIndex + 1}.`);
    } catch (error) {
      setCropMessage(error instanceof Error ? error.message : "Unable to attach cropped visual.");
    }
  }

  function pointerPosition(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))),
    };
  }

  function beginSelection(event: PointerEvent<HTMLDivElement>) {
    if (!selectedAsset) return;
    const position = pointerPosition(event);
    setDragStart(position);
    setSelection({ x: position.x, y: position.y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateSelection(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const position = pointerPosition(event);
    setSelection({
      x: Math.min(dragStart.x, position.x),
      y: Math.min(dragStart.y, position.y),
      width: Math.abs(position.x - dragStart.x),
      height: Math.abs(position.y - dragStart.y),
    });
  }

  function endSelection() {
    setDragStart(null);
  }

  async function attachSelection() {
    if (!selectedAsset || !selection || selection.width < 0.03 || selection.height < 0.03 || !onAttachVisual) {
      setCropMessage("Drag a larger box around the exact diagram/table/formula area first.");
      return;
    }
    const dataUrl = await cropVisualAssetBox(selectedAsset.dataUrl, selection);
    onAttachVisual(dataUrl);
    confirmSourceMapping(selection, "Selected source area confirmed by teacher.");
    setCropMessage(`Selected area from ${selectedAsset.label} attached to Question ${activeIndex + 1}.`);
  }

  function confirmSourceMapping(box?: CropBox | null, note = "Full source page confirmed by teacher.", assetOverride?: QuestionVisualAsset) {
    const coordinates = normalizeCropBox(box || { x: 0, y: 0, width: 1, height: 1 });
    const page = assetOverride?.pageNumber || selectedAsset?.pageNumber || mappedPage || 1;
    onSourceMappingChange?.({
      documentId: source?.importJobId || source?.id,
      uploadId: source?.id || null,
      importJobId: source?.importJobId || null,
      fileName: source?.originalName || source?.fileName,
      page,
      coordinates,
      confidence: box ? 0.96 : 0.82,
      reviewStatus: "TEACHER_CONFIRMED",
      note,
      mappedAt: new Date().toISOString(),
    });
    setCropMessage(`Source mapping saved for Question ${currentQuestionNumber}: page ${page}, ${Math.round(coordinates.width * 100)}% x ${Math.round(coordinates.height * 100)}% area.`);
  }

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100dvh-22rem)] xl:min-h-[24rem] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">Original source</p>
          <h4 className="mt-1 text-sm font-black">{source?.originalName || source?.fileName || "No question paper source"}</h4>
        </div>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-black">
            Open
          </a>
        ) : null}
      </div>
      <div className="mt-3 min-h-[22rem] overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        {sourceUrl && isPdf ? (
          <iframe src={sourceUrl} title="Original question paper preview" className="h-[28rem] w-full" />
        ) : sourceUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sourceUrl} alt="Original question paper preview" className="h-auto min-h-[22rem] w-full object-contain" />
        ) : sourceUrl ? (
          <div className="grid min-h-[22rem] place-items-center p-5 text-center text-sm font-bold text-[var(--muted-blue)]">
            This source file is preserved. Open it in a new tab to compare the original layout.
          </div>
        ) : (
          <div className="grid min-h-[22rem] place-items-center p-5 text-center text-sm font-bold text-[var(--muted-blue)]">
            Upload a question paper PDF or image to compare diagrams, tables and graphs beside this preview.
          </div>
        )}
      </div>
      {signal?.notes.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-950">
          <p className="font-black">Question {signal.number} source check</p>
          <p className="mt-1">{signal.notes.join(" / ")}</p>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-950">
          This question has no detected visual dependency.
        </p>
      )}
      <div className={`mt-3 rounded-xl border p-3 text-xs font-bold leading-5 ${sourceMapping?.reviewStatus === "TEACHER_CONFIRMED" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-black">Side-by-side source mapping</p>
            <p className="mt-1">
              Page {sourceMapping?.page || mappedPage} / {sourceMapping?.reviewStatus === "TEACHER_CONFIRMED" ? "Teacher confirmed" : "Estimated until confirmed"}
            </p>
          </div>
          <button type="button" onClick={() => confirmSourceMapping()} className="min-h-9 rounded border border-current/20 bg-white px-3 text-xs font-black">
            Confirm Full Page
          </button>
        </div>
        {sourceMapping?.coordinates ? (
          <p className="mt-2 rounded-lg border border-current/10 bg-white/75 p-2">
            Coordinates: x {sourceMapping.coordinates.x.toFixed(2)}, y {sourceMapping.coordinates.y.toFixed(2)}, w {sourceMapping.coordinates.width.toFixed(2)}, h {sourceMapping.coordinates.height.toFixed(2)}
          </p>
        ) : null}
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Question visual assets</p>
          <span className="rounded-full bg-[var(--page-bg)] px-2 py-1 text-[10px] font-black text-[var(--muted-blue)]">{assets.length} ready</span>
        </div>
        {assets.length ? (
          <div className="mt-3 grid gap-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">Interactive crop</p>
                <select value={selectedAsset?.id || ""} onChange={(event) => {
                  setSelectedAssetId(event.target.value);
                  setSelection(null);
                }} className="min-h-9 rounded border border-[var(--border)] bg-white px-2 text-xs font-black">
                  {assets.slice(0, 12).map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.label}</option>
                  ))}
                </select>
              </div>
              {selectedAsset ? (
                <div className="mt-3">
                  <div
                    role="img"
                    aria-label={`Selectable source area for ${selectedAsset.label}`}
                    onPointerDown={beginSelection}
                    onPointerMove={updateSelection}
                    onPointerUp={endSelection}
                    onPointerCancel={endSelection}
                    className="relative cursor-crosshair select-none overflow-hidden rounded-lg border border-[var(--border)] bg-white touch-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedAsset.dataUrl} alt="" draggable={false} className="max-h-[28rem] w-full object-contain" />
                    {selection ? (
                      <div
                        className="pointer-events-none absolute border-2 border-emerald-500 bg-emerald-300/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.28)]"
                        style={{
                          left: `${selection.x * 100}%`,
                          top: `${selection.y * 100}%`,
                          width: `${selection.width * 100}%`,
                          height: `${selection.height * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={() => void attachSelection()} className="min-h-9 rounded border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800">
                      Attach Selected Area
                    </button>
                    <button type="button" onClick={() => {
                      if (!selection || selection.width < 0.03 || selection.height < 0.03) {
                        setCropMessage("Drag a source box before saving the exact source area.");
                        return;
                      }
                      confirmSourceMapping(selection, "Selected source area confirmed without attaching a crop.");
                    }} className="min-h-9 rounded border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-900">
                      Save Source Box
                    </button>
                    <button type="button" onClick={() => setSelection(null)} className="min-h-9 rounded border border-[var(--border)] bg-white px-3 text-xs font-black text-[var(--muted-blue)]">
                      Clear Box
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {assets.slice(0, 12).map((asset) => (
              <div
                key={asset.id}
                className={`grid gap-2 rounded-lg border p-2 text-left transition ${attachedImage === asset.dataUrl ? "border-emerald-300 bg-emerald-50" : "border-[var(--border)] bg-white"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.dataUrl} alt="" className="h-28 w-full rounded border border-[var(--border)] object-contain" />
                <span className="text-xs font-black">{asset.label} / {asset.fileName}</span>
                <div className="grid grid-cols-4 gap-1">
                  {(["FULL", "TOP", "MIDDLE", "BOTTOM"] as VisualCropRegion[]).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => void attachRegion(asset, region)}
                      className="min-h-8 rounded border border-[var(--border)] bg-[var(--page-bg)] px-2 text-[10px] font-black text-[var(--ink)] transition hover:border-[var(--gold-border)] hover:bg-[var(--gold-soft)]"
                    >
                      {cropRegionLabel(region)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs font-bold leading-5 text-[var(--muted-blue)]">
            Upload a PDF or image question paper to create attachable page snapshots for diagram questions.
          </p>
        )}
        {cropMessage ? <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] p-2 text-xs font-black text-[var(--muted-blue)]">{cropMessage}</p> : null}
      </div>
    </aside>
  );
}

function PaperUnderstandingPanel({ report, compact = false }: { report: PaperUnderstandingReport; compact?: boolean }) {
  const tone = report.confidence === "HIGH"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : report.confidence === "MEDIUM"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";
  return (
    <div className={`rounded-2xl border p-4 ${tone} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">Paper understanding</p>
          <h4 className="mt-1 text-lg font-black">{report.inferredExamType} / {report.inferredSubject}</h4>
          <p className="mt-1 text-sm font-bold opacity-75">{report.inferredTopic} / {report.solutionMode.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{report.confidence} confidence</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <MiniFact label="Sections" value={report.sections.length} />
        <MiniFact label="Answers" value={`${report.answerKey.entries}/${report.answerKey.entries + report.answerKey.missing.length}`} />
        <MiniFact label="Marks/Q" value={report.markingScheme.marksPerQuestion} />
        <MiniFact label="Negative" value={report.markingScheme.negativeMarks} />
      </div>
      {report.riskSignals.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.riskSignals.map((risk) => (
            <span key={risk.type} className="rounded-full border border-current/10 bg-white/75 px-3 py-1 text-xs font-black">
              {risk.type.replace(/_/g, " ")}: {risk.count}
            </span>
          ))}
        </div>
      ) : null}
      {[...report.blockers, ...report.warnings].length ? (
        <ul className="mt-3 grid gap-1 text-xs font-bold leading-5">
          {[...report.blockers, ...report.warnings].slice(0, compact ? 4 : 8).map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-bold opacity-75">No paper-structure issues detected. Still review the student preview before publishing.</p>
      )}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-current/10 bg-white/75 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function RichQuestionTypePanel({
  questionNumber,
  selected,
  inferred,
  onChange,
}: {
  questionNumber: number;
  selected: RichQuestionType;
  inferred: RichQuestionType;
  onChange: (questionType: RichQuestionType) => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-900">Question type</p>
          <p className="mt-1 text-sm font-bold text-blue-950">Stored for the rich exam engine. Current student CBT remains MCQ-compatible.</p>
        </div>
        <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-900">
          Q{questionNumber} / {questionTypeLabel(selected)}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <select
          value={selected}
          onChange={(event) => onChange(event.target.value as RichQuestionType)}
          className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm font-black text-blue-950"
        >
          {richQuestionTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label} - {type.note}</option>
          ))}
        </select>
        <span className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-900">
          Suggested: {questionTypeLabel(inferred)}
        </span>
      </div>
    </div>
  );
}

function FormulaReviewPanel({
  questionNumber,
  signal,
  entry,
  sourceText,
  onChange,
  onConfirm,
}: {
  questionNumber: number;
  signal?: PaperUnderstandingReport["questionSignals"][number];
  entry: FormulaReviewEntry | null;
  sourceText: string;
  onChange: (latex: string) => void;
  onConfirm: (latex: string) => void;
}) {
  if (!signal?.formulaRisk && !entry?.latex) return null;
  const latex = entry?.latex || sourceText;
  const confirmed = entry?.reviewStatus === "TEACHER_CONFIRMED";
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">Formula review</p>
          <h4 className="mt-1 text-sm font-black">{confirmed ? "Formula rendering confirmed" : "Confirm formula rendering"}</h4>
          <p className="mt-1 text-xs font-bold opacity-75">Edit with LaTeX when PDF extraction breaks fractions, radicals, powers or symbols.</p>
        </div>
        <span className="rounded-full border border-current/10 bg-white/80 px-3 py-1 text-xs font-black">
          Q{questionNumber}
        </span>
      </div>
      <div className="mt-3 grid gap-3">
        <textarea
          value={latex}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-current/10 bg-white p-3 text-sm font-bold leading-6 text-slate-950"
          placeholder="Example: \\frac{\\sqrt{5}}{3}"
        />
        <div className="rounded-xl border border-current/10 bg-white/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Preview</p>
          <div className="mt-2 overflow-x-auto text-base font-bold">
            <NidusMathText text={latex.includes("$") ? latex : `$$${latex}$$`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onConfirm(latex)} className="min-h-10 rounded-xl border border-emerald-700 bg-emerald-700 px-4 text-sm font-black text-white">
            Confirm Formula
          </button>
          <button type="button" onClick={() => onChange(sourceText)} className="min-h-10 rounded-xl border border-current/10 bg-white px-4 text-sm font-black">
            Reset From Question
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtractionAuditPanel({ reports, manualReview, onManualReviewChange, compact = false }: { reports: ExtractionReport[]; manualReview: boolean; onManualReviewChange: (value: boolean) => void; compact?: boolean }) {
  const hasBlocker = reports.some((report) => report.status === "BLOCKED");
  const friendlyNote = (item: string) => item
    .replace(/No numbered MCQ questions were detected\./i, "Questions need review in the next step.")
    .replace(/Maths\/formula PDF extraction is fragmented\. The source paper was preserved, but auto-created questions would be inaccurate\./i, "Formula-heavy layout needs teacher review.")
    .replace(/Only a few questions were detected from the PDF\./i, "Only part of the paper was detected automatically.");
  return (
    <div className={`rounded-2xl border p-4 ${hasBlocker ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"} ${compact ? "" : "lg:col-span-2"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.24em] ${hasBlocker ? "text-amber-800" : "text-blue-800"}`}>Paper digitizing check</p>
          <h4 className="mt-1 text-lg font-black">{hasBlocker ? "Manual review required" : "Review recommended"}</h4>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-blue)]">This paper may contain formulas, diagrams, tables or scanned pages. Check it once before publishing.</p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-black">
          <input type="checkbox" checked={manualReview} onChange={(event) => onManualReviewChange(event.target.checked)} />
          Manual review completed
        </label>
      </div>
      <div className="mt-3 grid gap-2">
        {reports.map((report) => (
          <div key={`${report.sourceKind}-${report.fileName}`} className="rounded-xl border border-white/80 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black">{report.fileName}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${report.status === "BLOCKED" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}>{report.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{report.detectedQuestions || "Review"} detected item(s)</p>
            {[...report.blockers, ...report.warnings].length ? (
              <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-slate-700">
                {[...report.blockers, ...report.warnings].slice(0, 3).map((item) => <li key={item}>- {friendlyNote(item)}</li>)}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseTimeValue(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return { hour: "", minute: "", meridiem: "AM" as const };
  const [hourRaw, minuteRaw] = value.split(":");
  const hour24 = Number(hourRaw);
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12).padStart(2, "0"), minute: minuteRaw, meridiem: meridiem as "AM" | "PM" };
}

function buildTimeValue(hour: string, minute: string, meridiem: "AM" | "PM") {
  if (!hour || !minute) return "";
  const hourNumber = Math.min(12, Math.max(1, Number(hour) || 0));
  const minuteNumber = Math.min(59, Math.max(0, Number(minute) || 0));
  let hour24 = hourNumber;
  if (meridiem === "AM" && hour24 === 12) hour24 = 0;
  if (meridiem === "PM" && hour24 !== 12) hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minuteNumber).padStart(2, "0")}`;
}

function displayTimeValue(value: string) {
  const parsed = parseTimeValue(value);
  if (!parsed.hour || !parsed.minute) return "Select exam start time";
  return `${parsed.hour}:${parsed.minute} ${parsed.meridiem}`;
}

function TimePickerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = parseTimeValue(value);
  const [draft, setDraft] = useState(parsed);

  useEffect(() => {
    setDraft(parseTimeValue(value));
  }, [value]);

  function update(next: Partial<typeof draft>) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    if (merged.hour && merged.minute) {
      onChange(buildTimeValue(merged.hour, merged.minute, merged.meridiem));
    } else if (!merged.hour && !merged.minute) {
      onChange("");
    }
  }

  function updateNumber(kind: "hour" | "minute", rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 2);
    if (!digits) {
      update({ [kind]: "" });
      return;
    }
    const max = kind === "hour" ? 12 : 59;
    const min = kind === "hour" ? 1 : 0;
    const bounded = Math.min(max, Math.max(min, Number(digits)));
    update({ [kind]: String(bounded) });
  }

  return (
    <label className="grid gap-2 text-sm font-black">
      {label}
      <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-2xl border border-[var(--border)] bg-white p-2">
        <input
          inputMode="numeric"
          value={draft.hour}
          onChange={(event) => updateNumber("hour", event.target.value)}
          placeholder="HH"
          className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-center font-black outline-none focus:border-[var(--ink)]"
        />
        <span className="font-black text-[var(--muted-blue)]">:</span>
        <input
          inputMode="numeric"
          value={draft.minute}
          onChange={(event) => updateNumber("minute", event.target.value)}
          placeholder="MM"
          className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3 text-center font-black outline-none focus:border-[var(--ink)]"
        />
        <div className="grid grid-cols-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-1">
          {(["AM", "PM"] as const).map((meridiem) => (
            <button
              key={meridiem}
              type="button"
              onClick={() => update({ meridiem })}
              className={`rounded-lg px-3 py-2 text-xs font-black transition ${draft.meridiem === meridiem ? "bg-[var(--ink)] text-white" : "text-[var(--ink)] hover:bg-white"}`}
            >
              {meridiem}
            </button>
          ))}
        </div>
      </div>
      <span className="text-xs font-bold text-[var(--muted-blue)]">{displayTimeValue(value)}</span>
    </label>
  );
}

function examConversionPrompt(subject: string) {
  return `You are an expert examination digitization assistant. Convert the attached ${subject || "subject"} question paper into the exact NIDUS exam import format below.

Rules:
1. Preserve the original meaning of every question. Do not invent, simplify or solve questions.
2. For Mathematics and Physics, rewrite formulas clearly using Unicode or LaTeX-style text. Example: l = 2/3, m = 1/3, n = ? or sqrt(5)/3.
3. If a question needs a diagram, triangle, circuit, graph, chart, table, figure or image, write [IMAGE REQUIRED: describe the exact visual here] inside the question text.
4. Keep each MCQ as exactly one question with four options A, B, C and D.
5. Do not merge two questions. Do not split one question into fragments.
6. Remove headers, footers, page numbers, watermarks and repeated institute text.
7. If any question is unreadable, write [REVIEW REQUIRED] in that question text.
8. Output only in this format. No markdown table.

QUESTION PAPER FORMAT:
1. Question text here
A. Option A
B. Option B
C. Option C
D. Option D

2. Question text here
A. Option A
B. Option B
C. Option C
D. Option D

ANSWER KEY FORMAT:
1 - A
Explanation: Optional. If explanation is not available, write: Answer key only.

2 - C
Explanation: Optional. If explanation is not available, write: Answer key only.

Now convert the attached paper completely.`;
}

function ExamConversionPrompt({ subject }: { subject: string }) {
  const prompt = examConversionPrompt(subject);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mb-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-black text-amber-950">
        Copy AI Prompt
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-950 bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--gold-dark)]">AI prompt</p>
                <h4 className="mt-1 text-lg font-black">Maths / Physics conversion prompt</h4>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--muted-blue)]">Use only when a PDF contains formulas, diagrams, graphs or tables.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)]">
                <X size={17} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <pre className="max-h-[54dvh] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-xs leading-5 text-slate-900 whitespace-pre-wrap">{prompt}</pre>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[var(--border)] p-4">
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black">Close</button>
              <button type="button" onClick={() => void copyPrompt()} className="min-h-11 rounded-xl border border-slate-950 bg-slate-950 px-4 text-sm font-black text-white">
                {copied ? "Copied" : "Copy Prompt"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ExamInputCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--page-bg)]">
          <FileText size={18} />
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FileUploadRow({ label, fileName, accept, onChange }: { label: string; fileName: string; accept: string; onChange: (file: File | null) => void }) {
  return (
    <div className="mt-3 rounded-3xl border border-[var(--border)] bg-white p-3">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onChange(event.dataTransfer.files?.[0] ?? null);
        }}
        className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/60 px-5 py-8 text-center transition hover:border-rose-500 hover:bg-rose-50"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-200 bg-white text-rose-700">
          <FileText size={24} />
        </span>
        <span className="mt-4 text-lg font-black text-slate-950">{label}</span>
        <span className="mt-2 text-sm font-bold text-[var(--muted-blue)]">PDF, Word, JPG, PNG, WEBP, TIFF, HEIC or TXT</span>
        <span className="mt-4 rounded-full bg-slate-950 px-5 py-2 text-xs font-black text-white">Choose File</span>
        <input type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      <div className="mt-2 flex min-h-7 items-center justify-between gap-2 text-xs">
        <span className="truncate font-black text-[var(--ink)]">{fileName || "No document selected"}</span>
        {fileName ? <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-700">Attached</span> : null}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
