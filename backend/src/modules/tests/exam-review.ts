export type ReviewSeverity = "HIGH" | "MEDIUM" | "LOW";
export type ReviewIssueState = "OPEN" | "RESOLVED" | "APPROVED_AS_IS";
export type ReviewIssue = {
  id: string;
  type: string;
  severity: ReviewSeverity;
  state: ReviewIssueState;
  approvable: boolean;
  reason?: string;
  decidedById?: string;
  decidedAt?: string;
};

type StructuralQuestion = { questionText?: string; questionImage?: string | null; visualReviewRequired?: boolean; visualReviewNotes?: unknown; contentJson?: unknown; optionA?: string; optionB?: string; optionC?: string; optionD?: string; correctAnswer?: string; explanation?: string; marks?: number; negativeMarks?: number; sourcePageNumber?: number | null };

function ocrReviewNotes(question: StructuralQuestion) {
  if (!question.contentJson || typeof question.contentJson !== "object" || Array.isArray(question.contentJson)) return [] as string[];
  const metadata = (question.contentJson as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [] as string[];
  const item = metadata as { ocrReviewRequired?: unknown; ocrReviewNotes?: unknown };
  if (!item.ocrReviewRequired) return [] as string[];
  return Array.isArray(item.ocrReviewNotes) ? item.ocrReviewNotes.map(String) : ["OCR_TEXT_NEEDS_REVIEW"];
}

function hasRenderableVisual(question: StructuralQuestion) {
  if (!question.contentJson || typeof question.contentJson !== "object" || Array.isArray(question.contentJson)) return false;
  const blocks = (question.contentJson as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) && blocks.some((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return false;
    const item = block as { type?: unknown; assetUrl?: unknown; url?: unknown };
    return (item.type === "visual" || item.type === "image") && Boolean(String(item.assetUrl || item.url || "").trim());
  });
}

function visualNeedsAttachment(question: StructuralQuestion) {
  if (!question.visualReviewRequired || hasRenderableVisual(question) || question.questionImage?.trim()) return false;
  if (!Array.isArray(question.visualReviewNotes)) return true;
  return question.visualReviewNotes.some((note) => /visual|diagram|graph|table|figure|image/i.test(String(note || "")));
}

function visualNeedsReview(question: StructuralQuestion) {
  if (!question.contentJson || typeof question.contentJson !== "object" || Array.isArray(question.contentJson)) return false;
  const blocks = (question.contentJson as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) && blocks.some((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) return false;
    const item = block as { type?: unknown; reviewRequired?: unknown };
    return item.type === "visual" && item.reviewRequired === true;
  });
}

const definitions = [
  { id: "MISSING_QUESTION_TEXT", test: (q: StructuralQuestion) => !q.questionText?.trim(), severity: "HIGH", approvable: false },
  { id: "MISSING_REQUIRED_OPTIONS", test: (q: StructuralQuestion) => ![q.optionA, q.optionB, q.optionC, q.optionD].every((value) => value?.trim()), severity: "HIGH", approvable: false },
  { id: "INVALID_CORRECT_ANSWER", test: (q: StructuralQuestion) => !/^[A-D]$/.test(q.correctAnswer?.trim().toUpperCase() || ""), severity: "HIGH", approvable: false },
  { id: "MISSING_REQUIRED_VISUAL", test: visualNeedsAttachment, severity: "HIGH", approvable: false },
  { id: "VISUAL_SOURCE_NEEDS_REVIEW", test: visualNeedsReview, severity: "HIGH", approvable: false },
  { id: "OCR_TEXT_NEEDS_REVIEW", test: (q: StructuralQuestion) => ocrReviewNotes(q).includes("OCR_TEXT_NEEDS_REVIEW"), severity: "HIGH", approvable: false },
  { id: "MATH_OCR_NEEDS_REVIEW", test: (q: StructuralQuestion) => ocrReviewNotes(q).includes("MATH_OCR_NEEDS_REVIEW"), severity: "HIGH", approvable: false },
  { id: "OCR_REGION_UNREADABLE", test: (q: StructuralQuestion) => ocrReviewNotes(q).includes("OCR_REGION_UNREADABLE"), severity: "HIGH", approvable: false },
  // Explanations enrich post-exam learning but are not required to score a
  // single-choice question safely. Keep the omission visible without letting
  // it block review readiness or release.
  { id: "MISSING_EXPLANATION", test: (q: StructuralQuestion) => !q.explanation?.trim(), severity: "LOW", approvable: true },
  { id: "DUPLICATE_OPTIONS", test: (q: StructuralQuestion) => { const options = [q.optionA, q.optionB, q.optionC, q.optionD].map((value) => value?.trim()).filter(Boolean); return options.length === 4 && new Set(options).size !== 4; }, severity: "HIGH", approvable: false },
  { id: "INVALID_MARKS", test: (q: StructuralQuestion) => !Number.isFinite(Number(q.marks)) || Number(q.marks) <= 0 || !Number.isFinite(Number(q.negativeMarks ?? 0)) || Number(q.negativeMarks ?? 0) < 0, severity: "HIGH", approvable: false },
  { id: "SOURCE_COORDINATES_UNAVAILABLE", test: (q: StructuralQuestion) => !q.sourcePageNumber, severity: "LOW", approvable: true },
] as const;

export function deriveReviewIssues(question: StructuralQuestion, previous: ReviewIssue[] = []): ReviewIssue[] {
  const previousById = new Map(previous.map((issue) => [issue.id, issue]));
  return definitions.map((definition) => {
    const prior = previousById.get(definition.id);
    const detected = definition.test(question);
    if (!detected) return { id: definition.id, type: definition.id, severity: definition.severity, approvable: definition.approvable, state: "RESOLVED" as const };
    if (prior?.state === "APPROVED_AS_IS" && definition.approvable) return prior;
    return { id: definition.id, type: definition.id, severity: definition.severity, approvable: definition.approvable, state: "OPEN" as const };
  });
}

export function blockingIssues(issues: ReviewIssue[]) {
  return issues.filter((issue) => issue.severity === "HIGH" && issue.state === "OPEN");
}

export function reviewAnswerProgress(questions: StructuralQuestion[]) {
  const unresolvedAnswerCount = questions.filter((question) => !/^[A-D]$/.test(question.correctAnswer?.trim().toUpperCase() || "")).length;
  return {
    answeredQuestionCount: questions.length - unresolvedAnswerCount,
    unresolvedAnswerCount,
    missingExplanationCount: questions.filter((question) => !question.explanation?.trim()).length,
  };
}

export function reviewReadiness(input: { lifecycle: string; actualQuestionCount: number; authoritativeQuestionCount?: number | null; actualMarksTotal: number; authoritativeMarks: number; unresolvedHighIssueCount: number }) {
  const blockingReasons: string[] = [];
  if (input.unresolvedHighIssueCount) blockingReasons.push(`${input.unresolvedHighIssueCount} blocking question issue(s) remain.`);
  if (input.authoritativeQuestionCount !== input.actualQuestionCount) blockingReasons.push(`Authoritative count ${input.authoritativeQuestionCount ?? "not set"} does not match ${input.actualQuestionCount} persisted questions.`);
  if (Math.abs(input.authoritativeMarks - input.actualMarksTotal) > 0.0001) blockingReasons.push(`Authoritative marks ${input.authoritativeMarks} do not match ${input.actualMarksTotal} persisted marks.`);
  if (input.lifecycle !== "DRAFT") blockingReasons.push("Only a DRAFT can complete Build & Review.");
  return { reviewStatus: blockingReasons.length ? "REVIEW_REQUIRED" as const : "READY" as const, blockingReasons };
}

export function calculateExamEnd(examStartsAt: string | Date, duration: number) {
  const start = examStartsAt instanceof Date ? new Date(examStartsAt) : new Date(examStartsAt);
  if (Number.isNaN(start.getTime()) || !Number.isInteger(duration) || duration <= 0) throw Object.assign(new Error("Valid examStartsAt and duration are required."), { statusCode: 400 });
  return new Date(start.getTime() + duration * 60_000);
}
