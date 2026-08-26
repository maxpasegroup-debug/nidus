import { parseQuestionContentJson } from "../document-intelligence/question-content.schema.js";

export type PublishableQuestion = {
  questionText: string;
  questionImage?: string;
  visualReviewRequired?: boolean;
  visualReviewNotes?: unknown;
  contentJson?: unknown;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
  negativeMarks?: number;
  renderMode?: string;
  reviewStatus?: string;
};

export type PublishableExam = {
  title?: string | null;
  subject?: string | null;
  duration?: number | null;
  totalMarks?: number | null;
  questions?: PublishableQuestion[];
};

export function validatePublishableExam(exam: PublishableExam) {
  const errors: string[] = [];
  if (!exam.title?.trim()) errors.push("Exam title is required.");
  if (!exam.subject?.trim()) errors.push("Exam subject is required.");
  if (!Number.isFinite(Number(exam.duration)) || Number(exam.duration) <= 0) errors.push("Exam duration must be greater than zero.");
  if (!exam.questions?.length) errors.push("At least one approved question is required.");
  if (!Number.isFinite(Number(exam.totalMarks)) || Number(exam.totalMarks) <= 0) errors.push("Total marks must be greater than zero.");
  const questionMarks = (exam.questions ?? []).reduce((sum, question) => sum + Number(question.marks || 0), 0);
  if (exam.questions?.length && Math.abs(questionMarks - Number(exam.totalMarks)) > 0.0001) {
    errors.push(`Total marks (${exam.totalMarks}) do not match the approved question marks (${questionMarks}).`);
  }
  if (errors.length) {
    throw Object.assign(new Error(`Exam settings are not ready to publish. ${errors.join(" ")}`), { statusCode: 400 });
  }
  validatePublishedQuestions(exam.questions ?? []);
}

function visualNotesRequireImage(notes: unknown) {
  if (!Array.isArray(notes)) return false;
  return notes
    .map((note) => String(note || "").toLowerCase())
    .some((note) => note.includes("visual") || note.includes("table") || note.includes("graph"));
}

export function validatePublishedQuestions(questions: PublishableQuestion[]) {
  const errors: string[] = [];
  const seen = new Set<string>();

  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    const normalizedText = question.questionText?.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalizedText || normalizedText.length < 3) errors.push(`${label} has no readable question text.`);
    if (normalizedText && seen.has(normalizedText)) errors.push(`${label} duplicates an earlier question.`);
    if (normalizedText) seen.add(normalizedText);

    const options = [question.optionA, question.optionB, question.optionC, question.optionD].map((value) => value?.trim());
    if (options.some((value) => !value || /^option\s+[a-d]$/i.test(value))) {
      errors.push(`${label} must contain four real answer options.`);
    }
    if (new Set(options.filter(Boolean)).size !== options.filter(Boolean).length) {
      errors.push(`${label} contains duplicate answer options.`);
    }
    if (!/^[A-D]$/i.test(question.correctAnswer?.trim() || "")) {
      errors.push(`${label} has an invalid answer key.`);
    }
    if (!question.explanation?.trim() || /^(explanation (will be reviewed|pending)|teacher reviewed answer)/i.test(question.explanation.trim())) {
      errors.push(`${label} needs a reviewed answer explanation.`);
    }
    if (question.visualReviewRequired && visualNotesRequireImage(question.visualReviewNotes) && !question.questionImage?.trim()) {
      errors.push(`${label} needs the exact diagram, table or graph image attached before publishing.`);
    }
    if (question.reviewStatus !== "APPROVED") {
      errors.push(`${label} must be approved in teacher review before publishing.`);
    }
    if (question.contentJson) {
      const parsed = parseQuestionContentJson(question.contentJson);
      if (!parsed.success) {
        errors.push(`${label} has invalid NIDUS question content schema: ${parsed.error.issues[0]?.message || "unknown schema error"}.`);
      } else {
        if (parsed.data.questionType !== "SINGLE_CHOICE" || parsed.data.answer.type !== "SINGLE_CHOICE") {
          errors.push(`${label} uses ${parsed.data.questionType}, which this CBT publishing path cannot evaluate safely.`);
        }
        if (["AI_IMPORT", "TEACHER_IMPORT"].includes(parsed.data.source) && parsed.data.sourceReferences.length === 0) {
          errors.push(`${label} is imported content without source evidence.`);
        }
      }
    }
    if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) {
      errors.push(`${label} must have positive marks.`);
    }
    if (!Number.isFinite(Number(question.negativeMarks ?? 0)) || Number(question.negativeMarks ?? 0) < 0) {
      errors.push(`${label} must have non-negative negative marks.`);
    }
    if (question.renderMode && question.renderMode !== "LEGACY_MCQ") {
      errors.push(`${label} uses unsupported question rendering for this CBT path.`);
    }
  });

  if (errors.length) {
    const visible = errors.slice(0, 8).join(" ");
    const remaining = errors.length > 8 ? ` Plus ${errors.length - 8} more issue(s).` : "";
    throw Object.assign(new Error(`Exam paper is not ready to publish. ${visible}${remaining}`), { statusCode: 400 });
  }
}

export function validateDraftQuestions(questions: PublishableQuestion[]) {
  const errors: string[] = [];
  const seen = new Set<string>();
  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    const text = question.questionText?.trim().replace(/\s+/g, " ").toLowerCase();
    const options = [question.optionA, question.optionB, question.optionC, question.optionD].map((value) => value?.trim());
    if (!text || text.length < 3) errors.push(`${label} has no readable question text.`);
    if (text && seen.has(text)) errors.push(`${label} duplicates an earlier question.`);
    if (text) seen.add(text);
    if (options.some((value) => !value)) errors.push(`${label} must contain four answer options.`);
    if (new Set(options.filter(Boolean)).size !== options.filter(Boolean).length) errors.push(`${label} contains duplicate answer options.`);
    if (!/^[A-D]$/i.test(question.correctAnswer?.trim() || "")) errors.push(`${label} has an invalid answer key.`);
    if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0 || Number(question.marks) > 1000) errors.push(`${label} has invalid marks.`);
    if (!Number.isFinite(Number(question.negativeMarks ?? 0)) || Number(question.negativeMarks ?? 0) < 0 || Number(question.negativeMarks ?? 0) > 1000) errors.push(`${label} has invalid negative marks.`);
  });
  if (errors.length) throw Object.assign(new Error(`Exam questions are invalid. ${errors.slice(0, 8).join(" ")}`), { statusCode: 400 });
}
