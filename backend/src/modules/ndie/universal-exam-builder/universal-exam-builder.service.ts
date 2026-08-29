type UniversalQuestionInput = {
  number?: number;
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  explanation?: string;
  marks?: number;
  visualReviewRequired?: boolean;
  visualReviewNotes?: unknown;
  aiConfidence?: number;
  reviewStatus?: string;
  boundingBoxes?: unknown;
  contentJson?: unknown;
};

export type UniversalExamBuilderInput = {
  subject?: string;
  topic?: string;
  documentClass?: string;
  ndieOutputs?: {
    ocr?: unknown;
    layout?: unknown;
    formula?: unknown;
    visual?: unknown;
    assessment?: unknown;
    evaluation?: unknown;
    validation?: unknown;
    stemIntelligence?: unknown;
    pageReferences?: unknown;
    boundingBoxes?: unknown;
    originalPageAssets?: unknown;
    questionRelationships?: unknown;
    answerKey?: unknown;
    solutions?: unknown;
  };
  draft?: {
    questions?: UniversalQuestionInput[];
    quality?: Record<string, unknown>;
    overallQuality?: string;
    answerKeysLinked?: number;
    needsReview?: number;
  };
  questions?: UniversalQuestionInput[];
};

type UniversalQuestionType =
  | "MCQ"
  | "MULTIPLE_CORRECT"
  | "NUMERICAL"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MATCH_FOLLOWING"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "CASE_STUDY"
  | "PASSAGE_BASED"
  | "DIAGRAM_BASED"
  | "TABLE_BASED"
  | "GRAPH_BASED"
  | "MIXED_EXAM"
  | "UNKNOWN";

type ReviewStatus = "READY" | "NEEDS_REVIEW" | "MISSING_OPTION" | "MISSING_FORMULA" | "MISSING_DIAGRAM" | "MISSING_ANSWER" | "MISSING_SOLUTION" | "MISSING_ASSET";

type ProfessionalQuestion = {
  number: number;
  questionText: string;
  marks: number;
  options: Array<{ label: string; text: string }>;
  questionType: UniversalQuestionType;
  draftConfidence: number;
  reviewStatus: ReviewStatus;
  linkedAssets: string[];
  linkedAnswer?: string;
  linkedSolution?: string;
  recoveredFormula?: string;
  sourceReference?: string;
  sourcePage?: number;
  boundingRegion?: unknown;
  originalCrop?: string;
  missingItems: Array<"Option" | "Formula" | "Diagram" | "Answer" | "Solution">;
  originalCropRequired: boolean;
  notes: string[];
  contentJson?: unknown;
};

type QualityLabel = "High" | "Medium" | "Needs Review";

export type UniversalExamDraft = {
  schema: "NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1";
  questions: ProfessionalQuestion[];
  questionCount: number;
  questionTypes: string[];
  answerKeysLinked: number;
  solutionsLinked: number;
  formulaReviewCount: number;
  visualReviewCount: number;
  needsReview: number;
  overallQuality: QualityLabel;
  quality: {
    formulaPreservation: QualityLabel;
    visualPreservation: QualityLabel;
    questionCompleteness: QualityLabel;
    answerCompleteness: QualityLabel;
    overall: QualityLabel;
  };
  message: string;
  createdAt: string;
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(w:t|w:r|m:oMath|xml)\b/gi, " ")
    .replace(/\s+([,.;:?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function hasFormulaSignal(value: string) {
  return /[∫√πθλΩ≈≤≥÷×∞Σµ₀-₉⁰-⁹]|\\(?:frac|sqrt|int|sum|lim|vec|begin)|\^|_\{|[a-z]\s*=\s*[^.,;]+/i.test(value);
}

function quality(ratio: number): QualityLabel {
  if (ratio >= 0.9) return "High";
  if (ratio >= 0.7) return "Medium";
  return "Needs Review";
}

function normalizedQuestions(input: UniversalExamBuilderInput) {
  const draftQuestions = Array.isArray(input.draft?.questions) ? input.draft.questions : [];
  const questions = draftQuestions.length ? draftQuestions : Array.isArray(input.questions) ? input.questions : [];
  return (questions.length ? questions : questionsFromDocumentUnderstanding(input)).slice(0, 200);
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textValue(value: unknown) {
  return cleanText(value);
}

function optionTextFromUnknown(value: unknown, label: "A" | "B" | "C" | "D") {
  const item = objectValue(value);
  if (!item) return "";
  const itemLabel = textValue(item.label || item.optionLabel || item.key).toUpperCase();
  if (itemLabel && itemLabel !== label) return "";
  return textValue(item.text || item.value || item.content || item.optionText);
}

function normalizeCandidateQuestion(value: unknown, index: number): UniversalQuestionInput | null {
  const item = objectValue(value);
  if (!item) return null;
  const options = arrayValue(item.options || item.optionBlocks || item.choices);
  const optionA = textValue(item.optionA) || optionTextFromUnknown(options[0], "A") || options.map((option) => optionTextFromUnknown(option, "A")).find(Boolean) || "";
  const optionB = textValue(item.optionB) || optionTextFromUnknown(options[1], "B") || options.map((option) => optionTextFromUnknown(option, "B")).find(Boolean) || "";
  const optionC = textValue(item.optionC) || optionTextFromUnknown(options[2], "C") || options.map((option) => optionTextFromUnknown(option, "C")).find(Boolean) || "";
  const optionD = textValue(item.optionD) || optionTextFromUnknown(options[3], "D") || options.map((option) => optionTextFromUnknown(option, "D")).find(Boolean) || "";
  const contentBlocks = arrayValue(item.blocks || item.contentBlocks || item.questionBlocks)
    .map((block) => textValue(objectValue(block)?.text || objectValue(block)?.content || block))
    .filter(Boolean)
    .join(" ");
  const questionText = textValue(item.questionText || item.text || item.prompt || item.stem || contentBlocks);
  if (!questionText && !optionA && !optionB && !optionC && !optionD) return null;
  return {
    number: Number(item.number || item.questionNumber || item.displayNumber || index + 1),
    questionText: questionText || "Question content preserved for teacher review.",
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer: textValue(item.correctAnswer || item.answer || item.linkedAnswer),
    explanation: textValue(item.explanation || item.solution || item.linkedSolution),
    visualReviewRequired: Boolean(item.visualReviewRequired || item.requiresVisualReview),
    visualReviewNotes: item.visualReviewNotes || item.diagnostics || item.notes,
    aiConfidence: typeof item.confidence === "number" ? item.confidence : typeof item.draftConfidence === "number" ? item.draftConfidence : undefined,
    reviewStatus: textValue(item.reviewStatus || item.status),
    boundingBoxes: item.boundingBoxes || item.boundingBox || item.sourceRegion,
  };
}

function candidateArrays(input: UniversalExamBuilderInput) {
  const assessment = objectValue(input.ndieOutputs?.assessment);
  const evaluation = objectValue(input.ndieOutputs?.evaluation);
  return [
    arrayValue(assessment?.questions),
    arrayValue(assessment?.questionCandidates),
    arrayValue(assessment?.candidates),
    arrayValue(assessment?.detectedQuestions),
    arrayValue(objectValue(assessment?.assessment)?.questions),
    arrayValue(evaluation?.questions),
  ].filter((items) => items.length);
}

function questionsFromDocumentUnderstanding(input: UniversalExamBuilderInput): UniversalQuestionInput[] {
  const candidates = candidateArrays(input)
    .flat()
    .map((candidate, index) => normalizeCandidateQuestion(candidate, index))
    .filter((candidate): candidate is UniversalQuestionInput => Boolean(candidate));
  if (candidates.length) return candidates;

  const formula = objectValue(input.ndieOutputs?.formula);
  const visual = objectValue(input.ndieOutputs?.visual);
  const formulaCount = Number(formula?.formulaCount || formula?.count || 0);
  const visualCount = Number(visual?.visualCount || visual?.count || 0);
  if (formulaCount || visualCount || originalPageAssets(input).length) {
    return [{
      number: 1,
      questionText: `${input.subject || "Exam"} document preserved. NIDUS AI created a review draft from page assets, formulas and visuals.`,
      visualReviewRequired: true,
      visualReviewNotes: { formulaCount, visualCount },
      aiConfidence: 0.32,
      reviewStatus: "NEEDS_REVIEW",
    }];
  }

  return [];
}

function originalPageAssets(input: UniversalExamBuilderInput) {
  const assets = input.ndieOutputs?.originalPageAssets;
  return Array.isArray(assets) ? assets as Array<{ id?: string; label?: string; pageNumber?: number; cropUrl?: string }> : [];
}

function pageForQuestion(input: UniversalExamBuilderInput, number: number, total: number) {
  const assets = originalPageAssets(input);
  if (!assets.length) return undefined;
  const index = Math.min(assets.length - 1, Math.max(0, Math.floor(((number - 1) / Math.max(1, total)) * assets.length)));
  return assets[index]?.pageNumber || index + 1;
}

function inferType(question: UniversalQuestionInput): UniversalQuestionType {
  const text = cleanText(`${question.questionText} ${question.optionA} ${question.optionB} ${question.optionC} ${question.optionD}`).toLowerCase();
  const optionCount = [question.optionA, question.optionB, question.optionC, question.optionD].filter((option) => cleanText(option)).length;
  if (/\b(graph|chart|axis|plot|curve)\b/.test(text)) return "GRAPH_BASED";
  if (/\b(table|tabular|column|row)\b/.test(text)) return "TABLE_BASED";
  if (/\b(diagram|figure|circuit|structure|map|shown)\b/.test(text)) return "DIAGRAM_BASED";
  if (/\b(assertion|reason)\b/.test(text)) return "ASSERTION_REASON";
  if (/\b(match the following|column i|column ii)\b/.test(text)) return "MATCH_FOLLOWING";
  if (/\b(case study)\b/.test(text)) return "CASE_STUDY";
  if (/\b(passage|paragraph|read the following)\b/.test(text)) return "PASSAGE_BASED";
  if (/\b(true|false)\b/.test(text) && optionCount <= 2) return "TRUE_FALSE";
  if (/\b(integer|numerical|calculate|find the value)\b/.test(text) && optionCount < 3) return "NUMERICAL";
  if (/\bfill in the blank|blank\b/.test(text)) return "FILL_BLANK";
  if (/\b(explain|describe|derive|prove|write short note)\b/.test(text)) return text.length > 220 ? "LONG_ANSWER" : "SHORT_ANSWER";
  if (optionCount >= 4) return /[, ]/.test(cleanText(question.correctAnswer)) ? "MULTIPLE_CORRECT" : "MCQ";
  return text ? "UNKNOWN" : "MIXED_EXAM";
}

function optionsFor(question: UniversalQuestionInput, questionType: UniversalQuestionType) {
  if (["NUMERICAL", "FILL_BLANK", "SHORT_ANSWER", "LONG_ANSWER", "UNKNOWN", "MIXED_EXAM"].includes(questionType)) return [];
  const options = [
    { label: "A", text: cleanText(question.optionA) || "Option A requires review" },
    { label: "B", text: cleanText(question.optionB) || "Option B requires review" },
    { label: "C", text: cleanText(question.optionC) || "Option C requires review" },
    { label: "D", text: cleanText(question.optionD) || "Option D requires review" },
  ];
  return questionType === "TRUE_FALSE" ? options.slice(0, 2) : options;
}

function reviewStatus(missingItems: ProfessionalQuestion["missingItems"], fallbackNeedsReview: boolean): ReviewStatus {
  if (missingItems.includes("Diagram")) return "MISSING_DIAGRAM";
  if (missingItems.includes("Formula")) return "MISSING_FORMULA";
  if (missingItems.includes("Option")) return "MISSING_OPTION";
  if (missingItems.includes("Answer")) return "MISSING_ANSWER";
  if (missingItems.includes("Solution")) return "MISSING_SOLUTION";
  return fallbackNeedsReview ? "NEEDS_REVIEW" : "READY";
}

export const ndieUniversalExamBuilderService = {
  buildDraft(input: UniversalExamBuilderInput): UniversalExamDraft {
    const sourceQuestions = normalizedQuestions(input);
    const assets = originalPageAssets(input);
    const questions = sourceQuestions.map((question, index): ProfessionalQuestion => {
      const number = Number(question.number || index + 1);
      const questionType = inferType(question);
      const combined = `${question.questionText ?? ""} ${question.optionA ?? ""} ${question.optionB ?? ""} ${question.optionC ?? ""} ${question.optionD ?? ""}`;
      const formula = hasFormulaSignal(combined);
      const visual = Boolean(question.visualReviewRequired || /diagram|figure|graph|table|circuit|shown/i.test(combined));
      const options = optionsFor(question, questionType);
      const missingItems: ProfessionalQuestion["missingItems"] = [
        options.length > 0 && options.some((option) => /requires review/i.test(option.text)) ? "Option" : "",
        formula && !cleanText((input.ndieOutputs?.formula as { latex?: string } | undefined)?.latex) ? "Formula" : "",
        visual && !assets.length ? "Diagram" : "",
        !cleanText(question.correctAnswer) ? "Answer" : "",
        cleanText(question.correctAnswer) && !cleanText(question.explanation) ? "Solution" : "",
      ].filter((item): item is ProfessionalQuestion["missingItems"][number] => Boolean(item));
      const confidence = typeof question.aiConfidence === "number" ? Math.max(0, Math.min(1, question.aiConfidence)) : formula || visual ? 0.62 : 0.8;
      const status = reviewStatus(missingItems, confidence < 0.8 || /review/i.test(String(question.reviewStatus || "")));
      const page = pageForQuestion(input, number, Math.max(1, sourceQuestions.length));
      return {
        number,
        questionText: cleanText(question.questionText) || "Question content preserved for teacher review.",
        marks: typeof question.marks === "number" && Number.isFinite(question.marks) && question.marks > 0 ? question.marks : 1,
        options,
        questionType,
        draftConfidence: confidence,
        reviewStatus: status,
        linkedAssets: [
          formula ? "Formula" : "",
          visual ? "Visual" : "",
          page ? `Page ${page}` : "",
        ].filter(Boolean),
        linkedAnswer: cleanText(question.correctAnswer) || undefined,
        linkedSolution: cleanText(question.explanation) || undefined,
        recoveredFormula: formula ? cleanText(combined) : undefined,
        sourceReference: page ? `Source page ${page}` : assets.length ? "Original paper" : undefined,
        sourcePage: page,
        boundingRegion: question.boundingBoxes,
        originalCrop: assets.find((asset) => asset.pageNumber === page)?.cropUrl,
        missingItems,
        originalCropRequired: status !== "READY",
        notes: [
          formula ? "Formula image/placeholder preserved for review." : "",
          visual ? "Visual asset preserved with source reference." : "",
          missingItems.length ? `Needs review: ${missingItems.join(", ")}` : "",
        ].filter(Boolean),
        ...(question.contentJson ? { contentJson: question.contentJson } : {}),
      };
    });

    if (!questions.length) {
      questions.push({
        number: 1,
        questionText: `${input.subject || "Exam"} document preserved. NIDUS AI created a review draft from the original source.`,
        marks: 1,
        options: [],
        questionType: "MIXED_EXAM",
        draftConfidence: 0.3,
        reviewStatus: "NEEDS_REVIEW",
        linkedAssets: assets.length ? assets.slice(0, 10).map((asset) => asset.pageNumber ? `Page ${asset.pageNumber}` : asset.label || "Original page") : ["Original document"],
        sourceReference: assets.length ? "Original paper" : undefined,
        sourcePage: assets[0]?.pageNumber,
        missingItems: ["Option", "Answer"],
        originalCropRequired: true,
        notes: ["Nothing was discarded. Teacher review is required before publishing."],
      });
    }

    const answerKeysLinked = questions.filter((question) => question.linkedAnswer).length;
    const solutionsLinked = questions.filter((question) => question.linkedSolution).length;
    const formulaReviewCount = questions.filter((question) => question.recoveredFormula || question.missingItems.includes("Formula")).length;
    const visualReviewCount = questions.filter((question) => question.linkedAssets.some((asset) => /visual|page|source/i.test(asset)) || question.missingItems.includes("Diagram")).length;
    const needsReview = questions.filter((question) => question.reviewStatus !== "READY").length;
    const formulaRatio = questions.filter((question) => !question.missingItems.includes("Formula")).length / Math.max(1, questions.length);
    const visualRatio = questions.filter((question) => !question.missingItems.includes("Diagram")).length / Math.max(1, questions.length);
    const questionRatio = questions.filter((question) => question.questionText && !question.missingItems.includes("Option")).length / Math.max(1, questions.length);
    const answerRatio = answerKeysLinked / Math.max(1, questions.length);
    const overall = needsReview ? "Needs Review" : quality(Math.min(formulaRatio, visualRatio, questionRatio, answerRatio || 1));

    return {
      schema: "NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1",
      questions,
      questionCount: questions.length,
      questionTypes: Array.from(new Set(questions.map((question) => question.questionType))),
      answerKeysLinked,
      solutionsLinked,
      formulaReviewCount,
      visualReviewCount,
      needsReview,
      quality: {
        formulaPreservation: quality(formulaRatio),
        visualPreservation: quality(visualRatio),
        questionCompleteness: quality(questionRatio),
        answerCompleteness: answerKeysLinked ? quality(answerRatio) : "Needs Review",
        overall,
      },
      overallQuality: overall,
      message: needsReview ? "AI built your draft and marked uncertain questions for review." : "AI built a clean draft for teacher approval.",
      createdAt: new Date().toISOString(),
    };
  },
};
