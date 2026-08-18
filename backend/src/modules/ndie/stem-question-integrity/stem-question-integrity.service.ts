import type { NdieStemQuestionIntegrityInput, NdieStemQuestionIntegrityIssue, NdieStemQuestionIntegrityQuestionInput, NdieStemQuestionIntegrityQuestionResult, NdieStemQuestionIntegrityResult, NdieStemQuestionIntegritySeverity } from "../contracts/stem-question-integrity-result.js";

const engineVersion = "ndie-stem-question-integrity-v1" as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function issue(code: NdieStemQuestionIntegrityIssue["code"], severity: NdieStemQuestionIntegritySeverity, message: string, recommendedAction: string): NdieStemQuestionIntegrityIssue {
  return { code, severity, message, recommendedAction };
}

function isObjectiveQuestion(type: string) {
  return /MCQ|MULTIPLE|TRUE_FALSE|ASSERTION|MATCH/i.test(type);
}

function isStemOrVisualQuestion(question: NdieStemQuestionIntegrityQuestionInput, subject: string | null | undefined) {
  const text = `${subject ?? ""} ${question.questionType ?? ""} ${question.questionText ?? ""}`;
  return /math|physics|chemistry|formula|diagram|graph|table|coordinate|circuit|structure|reaction|numerical|matrix|integral|vector/i.test(text);
}

function normalizedOptionCount(question: NdieStemQuestionIntegrityQuestionInput) {
  return (question.options ?? []).filter((option) => String(option.text ?? "").trim() && !/requires review/i.test(String(option.text ?? ""))).length;
}

function normalizedOptionLabels(question: NdieStemQuestionIntegrityQuestionInput) {
  return (question.options ?? []).map((option) => String(option.label ?? "").trim().toUpperCase()).filter(Boolean);
}

function normalizedOptionTexts(question: NdieStemQuestionIntegrityQuestionInput) {
  return (question.options ?? []).map((option) => String(option.text ?? "").trim().toLowerCase()).filter(Boolean);
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function answerOptionMismatch(question: NdieStemQuestionIntegrityQuestionInput) {
  const answer = String(question.linkedAnswer ?? "").trim();
  if (!answer) return false;
  const labels = new Set(normalizedOptionLabels(question));
  const texts = new Set(normalizedOptionTexts(question));
  if (!labels.size && !texts.size) return false;
  if (texts.has(answer.toLowerCase())) return false;
  const answerLabels = answer.toUpperCase().match(/[A-Z]+/g) ?? [];
  return answerLabels.length > 0 && answerLabels.some((label) => !labels.has(label));
}

function questionIssues(input: { question: NdieStemQuestionIntegrityQuestionInput; subject?: string | null; duplicateNumbers: Set<string>; expectedNumber: number }): NdieStemQuestionIntegrityIssue[] {
  const { question, subject, duplicateNumbers, expectedNumber } = input;
  const issues: NdieStemQuestionIntegrityIssue[] = [];
  const type = String(question.questionType ?? "UNKNOWN");
  const text = String(question.questionText ?? "").trim();
  const number = String(question.number ?? "").trim();
  const missingItems = new Set((question.missingItems ?? []).map((item) => item.toUpperCase()));
  const options = question.options ?? [];
  const optionLabels = normalizedOptionLabels(question);
  const optionTexts = normalizedOptionTexts(question);

  if (!text || /content preserved for teacher review/i.test(text)) issues.push(issue("EMPTY_QUESTION_TEXT", "CRITICAL", "Question text is not confidently reconstructed.", "Open the preserved source page and complete the question in review."));
  if (!number) issues.push(issue("MISSING_QUESTION_NUMBER", "HIGH", "Question number is missing.", "Confirm the question order and restore its source number."));
  if (number && duplicateNumbers.has(number)) issues.push(issue("DUPLICATE_QUESTION_NUMBER", "HIGH", `Question number ${number} appears more than once.`, "Confirm numbering and split or merge the affected questions."));
  if (Number(number) && Number(number) !== expectedNumber) issues.push(issue("BROKEN_NUMBERING", "MEDIUM", `Question numbering jumps near ${number}.`, "Review question order and confirm the intended numbering."));
  if (isObjectiveQuestion(type) && normalizedOptionCount(question) < 2) issues.push(issue("INCOMPLETE_OPTIONS", "HIGH", "Objective question options are incomplete.", "Review the original paper and restore missing options."));
  if (isObjectiveQuestion(type) && options.some((option) => String(option.text ?? "").trim() && !String(option.label ?? "").trim())) issues.push(issue("MISSING_OPTION_LABEL", "MEDIUM", "One or more answer options have no label.", "Confirm and restore the option labels from the source paper."));
  if (isObjectiveQuestion(type) && hasDuplicates(optionLabels)) issues.push(issue("DUPLICATE_OPTION_LABEL", "HIGH", "Two or more answer options use the same label.", "Correct option lettering before publishing."));
  if (isObjectiveQuestion(type) && hasDuplicates(optionTexts)) issues.push(issue("DUPLICATE_OPTION_TEXT", "HIGH", "Two or more answer options contain identical text.", "Compare the duplicated options with the source paper."));
  if (!question.linkedAnswer && isObjectiveQuestion(type)) issues.push(issue("MISSING_ANSWER", "HIGH", "No answer is linked to this objective question.", "Upload or review the answer key before publishing."));
  if (isObjectiveQuestion(type) && answerOptionMismatch(question)) issues.push(issue("ANSWER_OPTION_MISMATCH", "CRITICAL", "The linked answer does not match any available option.", "Correct the answer mapping before publishing."));
  if (missingItems.has("FORMULA") || (/formula|math|physics|chemistry|numerical|integral|matrix|vector/i.test(`${type} ${text}`) && !question.recoveredFormula && !(question.linkedAssets ?? []).some((asset) => /formula/i.test(asset)))) issues.push(issue("MISSING_FORMULA_REFERENCE", "HIGH", "Formula content may be missing or needs confirmation.", "Compare with the source crop and verify the formula."));
  if (missingItems.has("DIAGRAM") || (/diagram|graph|table|circuit|structure|shown|figure/i.test(`${type} ${text}`) && !(question.linkedAssets ?? []).length)) issues.push(issue("MISSING_VISUAL_REFERENCE", "HIGH", "A required visual is not linked to the question.", "Attach the correct diagram, graph, table, or image from the source page."));
  if (Number(question.draftConfidence ?? 1) < 0.72) issues.push(issue("LOW_DRAFT_CONFIDENCE", "MEDIUM", "AI confidence is below the launch threshold.", "Review the reconstructed question before publishing."));
  if (/NEEDS|MISSING|INCOMPLETE/i.test(String(question.reviewStatus ?? ""))) issues.push(issue("QUESTION_NEEDS_REVIEW", "MEDIUM", "This question is already marked for teacher review.", "Resolve the review status before final publishing."));
  if (!question.sourcePage) issues.push(issue("SOURCE_PAGE_MISSING", "MEDIUM", "Source page reference is missing.", "Relink the question to its original page before certification."));
  if (isStemOrVisualQuestion(question, subject) && !question.originalCrop) issues.push(issue("SOURCE_CROP_MISSING", "MEDIUM", "Original crop is missing for a STEM or visual-heavy question.", "Preserve a source crop so the teacher can verify the extraction."));
  return issues;
}

function externalIssues(input: NdieStemQuestionIntegrityInput): NdieStemQuestionIntegrityIssue[] {
  const issues: NdieStemQuestionIntegrityIssue[] = [];
  const formulaReview = Number(input.formulaPerfection?.summary?.teacherReviewRequired ?? 0);
  const visualReview = Number(input.visualSemantics?.summary?.teacherReviewRequired ?? 0);
  const chemistryReview = Number(input.chemistryStructure?.summary?.teacherReviewRequired ?? 0);
  if (formulaReview > 0) issues.push(issue("FORMULA_REVIEW_REQUIRED", "HIGH", `${formulaReview} formula item(s) need review.`, "Review formula previews and source crops."));
  if (visualReview > 0) issues.push(issue("VISUAL_REVIEW_REQUIRED", "HIGH", `${visualReview} visual item(s) need review.`, "Review diagrams, graphs, tables and source crops."));
  if (chemistryReview > 0) issues.push(issue("CHEMISTRY_STRUCTURE_REVIEW_REQUIRED", "HIGH", `${chemistryReview} chemistry structure item(s) need review.`, "Review chemistry structures and reaction relationships."));
  return issues;
}

function readiness(issues: NdieStemQuestionIntegrityIssue[]) {
  if (issues.some((item) => item.severity === "CRITICAL")) return "BLOCKED" as const;
  if (issues.length) return "NEEDS_REVIEW" as const;
  return "READY" as const;
}

function confidence(question: NdieStemQuestionIntegrityQuestionInput, issues: NdieStemQuestionIntegrityIssue[]) {
  const base = Number(question.draftConfidence ?? 0.82);
  const penalty = issues.reduce((sum, item) => sum + (item.severity === "CRITICAL" ? 0.35 : item.severity === "HIGH" ? 0.18 : item.severity === "MEDIUM" ? 0.1 : 0.04), 0);
  return clamp01(base - penalty);
}

export const stemQuestionIntegrityService = {
  version: engineVersion,

  evaluate(input: NdieStemQuestionIntegrityInput): NdieStemQuestionIntegrityResult {
    const counts = new Map<string, number>();
    input.questions.forEach((question) => counts.set(String(question.number), (counts.get(String(question.number)) ?? 0) + 1));
    const duplicateNumbers = new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([number]) => number));
    const globalIssues = externalIssues(input);
    const questions: NdieStemQuestionIntegrityQuestionResult[] = input.questions.map((question, index) => {
      const localIssues = questionIssues({ question, subject: input.subject, duplicateNumbers, expectedNumber: index + 1 });
      const relevantGlobalIssues = globalIssues.filter((item) => {
        const text = `${question.questionType ?? ""} ${question.questionText ?? ""}`;
        if (item.code === "FORMULA_REVIEW_REQUIRED") return /formula|math|physics|chemistry|numerical|integral|matrix|vector/i.test(text) || Boolean(question.recoveredFormula);
        if (item.code === "VISUAL_REVIEW_REQUIRED") return /diagram|graph|table|circuit|structure|shown|figure/i.test(text) || Boolean((question.linkedAssets ?? []).length);
        if (item.code === "CHEMISTRY_STRUCTURE_REVIEW_REQUIRED") return /chemistry|reaction|organic|lewis|structure/i.test(`${input.subject ?? ""} ${text}`);
        return false;
      });
      const issues = [...localIssues, ...relevantGlobalIssues];
      return {
        questionId: question.questionId ?? `question-${question.number || index + 1}`,
        number: String(question.number || index + 1),
        readiness: readiness(issues),
        confidence: confidence(question, issues),
        issues,
        guarantees: {
          questionPreserved: true,
          uncertaintyPreserved: true,
          noAutoPublishWhenCritical: true
        }
      };
    });
    const criticalIssues = questions.flatMap((question) => question.issues).filter((item) => item.severity === "CRITICAL").length;
    const highIssues = questions.flatMap((question) => question.issues).filter((item) => item.severity === "HIGH").length;
    const blocked = questions.filter((question) => question.readiness === "BLOCKED").length;
    const needsReview = questions.filter((question) => question.readiness === "NEEDS_REVIEW").length;
    const ready = questions.filter((question) => question.readiness === "READY").length;
    const averageConfidence = clamp01(questions.reduce((sum, question) => sum + question.confidence, 0) / Math.max(1, questions.length));
    return {
      schemaVersion: "ndie-stem-question-integrity-v1",
      engineVersion,
      importJobId: input.importJobId,
      subject: input.subject ?? null,
      questions,
      summary: {
        totalQuestions: questions.length,
        ready,
        needsReview,
        blocked,
        criticalIssues,
        highIssues,
        averageConfidence,
        publishReadiness: blocked || criticalIssues ? "BLOCKED" : needsReview || highIssues ? "READY_WITH_REVIEW" : "READY",
        readinessScore: clamp01((ready + needsReview * 0.55) / Math.max(1, questions.length))
      }
    };
  },

  health() {
    return {
      status: "ready",
      version: engineVersion,
      supports: ["question completeness", "option completeness", "answer completeness", "formula references", "visual references", "source page checks", "source crop checks", "duplicate numbering", "publish readiness"],
      guarantees: ["question preserved", "uncertainty preserved", "no auto-publish when critical", "teacher review for incomplete STEM questions"]
    };
  }
};
