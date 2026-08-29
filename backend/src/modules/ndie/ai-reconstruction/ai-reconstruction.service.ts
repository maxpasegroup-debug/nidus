import crypto from "node:crypto";

import { callOpenAIJson } from "../../ai-engine/openai.service.js";
import { ndieProviderOrchestratorService } from "../provider-orchestrator/provider-orchestrator.service.js";
import { ndieUniversalExamBuilderService } from "../universal-exam-builder/universal-exam-builder.service.js";

type TeacherQuestionInput = {
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
  sourcePageNumber?: number;
  sourceReference?: string;
};

export type NdieAiReconstructionInput = {
  /** Deterministic document standardization is opt-in for upload reconstruction. */
  standardizationMode?: "DETERMINISTIC" | "AI_ALLOWED";
  batchId?: string;
  subject?: string;
  topic?: string;
  documentClass?: string;
  pipeline?: string;
  importJobIds?: string[];
  examUploadIds?: string[];
  confidenceThreshold?: number;
  extractionAudit?: unknown;
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
  };
  draft?: {
    schema?: string;
    questions?: TeacherQuestionInput[];
    quality?: Record<string, unknown>;
    overallQuality?: string;
    answerKeysLinked?: number;
    needsReview?: number;
  };
  questions?: TeacherQuestionInput[];
};

type ProfessionalQuestion = {
  number: number;
  questionText: string;
  marks?: number;
  options: Array<{ label: string; text: string }>;
  questionType: string;
  draftConfidence: number;
  reviewStatus: "READY" | "NEEDS_REVIEW" | "MISSING_OPTION" | "MISSING_FORMULA" | "MISSING_DIAGRAM" | "MISSING_ANSWER" | "MISSING_SOLUTION" | "MISSING_ASSET";
  linkedAssets: string[];
  linkedAnswer?: string;
  linkedSolution?: string;
  recoveredFormula?: string;
  sourceReference?: string;
  sourcePage?: number;
  boundingRegion?: unknown;
  originalCrop?: string;
  missingItems?: Array<"Option" | "Formula" | "Diagram" | "Answer" | "Solution">;
  originalCropRequired: boolean;
  notes: string[];
};

type ProfessionalDraft = {
  schema: "NIDUS_AI_RECONSTRUCTION_DRAFT_V1" | "NIDUS_AI_UNIVERSAL_EXAM_DRAFT_V1";
  questions: ProfessionalQuestion[];
  questionCount: number;
  questionTypes: string[];
  answerKeysLinked: number;
  solutionsLinked?: number;
  formulaReviewCount?: number;
  visualReviewCount?: number;
  needsReview: number;
  overallQuality: "High" | "Medium" | "Needs Review";
  quality: {
    formulaPreservation: "High" | "Medium" | "Needs Review";
    visualPreservation: "High" | "Medium" | "Needs Review";
    questionCompleteness: "High" | "Medium" | "Needs Review";
    answerCompleteness: "High" | "Medium" | "Needs Review";
    overall: "High" | "Medium" | "Needs Review";
  };
  message: string;
  createdAt: string;
};

export type NdieAiReconstructionResult = {
  engine: "NIDUS_AI_RECONSTRUCTION_ENGINE_V1";
  mode: "NDIE_PRIMARY" | "AI_RECONSTRUCTION" | "NDIE_FALLBACK";
  provider: string;
  draft: ProfessionalDraft;
  promptVersion: "NIDUS_AI_RECONSTRUCTION_PROMPT_V1";
  promptChecksum: string;
  responseChecksum: string;
  confidence: number;
  reviewFlags: string[];
  admin: {
    providerUsed: string;
    providerChain: string[];
    tokens: { estimatedInputTokens: number; estimatedOutputTokens: number };
    latencyMs: number;
    estimatedCostUsd: number;
    modelVersion: string;
    promptVersion: string;
    promptChecksum: string;
    responseChecksum: string;
    providerDiagnostics: Record<string, unknown>;
  };
};

const promptVersion = "NIDUS_AI_RECONSTRUCTION_PROMPT_V1" as const;

function checksum(value: unknown) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function compact(value: unknown, max = 16000) {
  const raw = JSON.stringify(value ?? {});
  return raw.length > max ? `${raw.slice(0, max)}...TRUNCATED_FOR_SAFETY` : raw;
}

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

function inferQuestionType(question: TeacherQuestionInput) {
  const text = cleanText(`${question.questionText} ${question.optionA} ${question.optionB} ${question.optionC} ${question.optionD}`).toLowerCase();
  if (/\b(assertion|reason)\b/.test(text)) return "ASSERTION_REASON";
  if (/\b(match the following|column i|column ii)\b/.test(text)) return "MATCH_FOLLOWING";
  if (/\b(case study|passage|paragraph|read the following)\b/.test(text)) return "PARAGRAPH_QUESTION";
  if (/\b(integer|numerical|calculate|find the value)\b/.test(text)) return "NUMERICAL";
  if (/\b(diagram|figure|graph|table|shown)\b/.test(text)) return "DIAGRAM_QUESTION";
  return "MCQ";
}

function labelQuality(ratio: number) {
  if (ratio >= 0.9) return "High";
  if (ratio >= 0.7) return "Medium";
  return "Needs Review";
}

function normalizedQuestions(input: NdieAiReconstructionInput) {
  const draftQuestions = Array.isArray(input.draft?.questions) ? input.draft.questions : [];
  const questions = draftQuestions.length ? draftQuestions : Array.isArray(input.questions) ? input.questions : [];
  return questions.slice(0, 120);
}

function buildDeterministicDraft(input: NdieAiReconstructionInput): ProfessionalDraft {
  const questions = normalizedQuestions(input).map((question, index): ProfessionalQuestion => {
    const number = Number(question.number || index + 1);
    const text = cleanText(question.questionText) || "Question text requires review against the preserved original paper.";
    const combined = `${question.questionText ?? ""} ${question.optionA ?? ""} ${question.optionB ?? ""} ${question.optionC ?? ""} ${question.optionD ?? ""}`;
    const formula = hasFormulaSignal(combined);
    const visual = Boolean(question.visualReviewRequired || /diagram|figure|graph|table|shown/i.test(combined));
    const linkedAssets = [formula ? "Formula" : "", visual ? "Visual source" : ""].filter(Boolean);
    const confidence = typeof question.aiConfidence === "number" ? Math.max(0, Math.min(1, question.aiConfidence)) : formula || visual ? 0.66 : 0.82;
    const missingAnswer = !question.correctAnswer;
    const needsReview = confidence < 0.8 || formula || visual || missingAnswer || String(question.reviewStatus || "").toUpperCase().includes("REVIEW");
    return {
      number,
      questionText: /[?.:]$/.test(text) ? text : `${text}?`,
      marks: typeof question.marks === "number" && Number.isFinite(question.marks) && question.marks > 0 ? question.marks : 1,
      options: [
        { label: "A", text: cleanText(question.optionA) || "Option A requires review" },
        { label: "B", text: cleanText(question.optionB) || "Option B requires review" },
        { label: "C", text: cleanText(question.optionC) || "Option C requires review" },
        { label: "D", text: cleanText(question.optionD) || "Option D requires review" }
      ],
      questionType: inferQuestionType(question),
      draftConfidence: confidence,
      reviewStatus: missingAnswer ? "MISSING_ANSWER" : needsReview ? "NEEDS_REVIEW" : "READY",
      linkedAssets,
      linkedAnswer: question.correctAnswer,
      linkedSolution: question.explanation,
      sourcePage: question.sourcePageNumber,
      sourceReference: question.sourceReference || (question.sourcePageNumber ? `Page ${question.sourcePageNumber}` : "Original paper"),
      recoveredFormula: formula ? cleanText(combined) : undefined,
      originalCropRequired: needsReview,
      notes: [
        formula ? "Formula content preserved for review." : "",
        visual ? "Visual content linked to original source." : "",
        missingAnswer ? "Answer key needs teacher confirmation." : ""
      ].filter(Boolean)
    };
  });
  if (!questions.length) {
    questions.push({
      number: 1,
      questionText: `${input.subject || "Exam"} paper preserved. NIDUS AI prepared this document for teacher review.`,
      options: [],
      questionType: "REVIEW_DRAFT",
      draftConfidence: 0.45,
      reviewStatus: "NEEDS_REVIEW",
      linkedAssets: ["Original document"],
      sourceReference: "Original paper",
      originalCropRequired: true,
      notes: ["No question was discarded. Review the preserved source before publishing."]
    });
  }
  const answerKeysLinked = questions.filter((question) => question.linkedAnswer).length;
  const needsReview = questions.filter((question) => question.reviewStatus !== "READY").length;
  const formulaRatio = questions.filter((question) => !question.recoveredFormula || question.linkedAssets.includes("Formula")).length / Math.max(1, questions.length);
  const visualRatio = questions.filter((question) => !question.linkedAssets.includes("Visual source") || question.sourceReference).length / Math.max(1, questions.length);
  const answerRatio = answerKeysLinked / Math.max(1, questions.length);
  const completenessRatio = questions.filter((question) => question.questionText && (question.options.length === 0 || question.options.every((option) => !/requires review/i.test(option.text)))).length / Math.max(1, questions.length);
  const overallRatio = Math.min(formulaRatio, visualRatio, input.draft?.overallQuality === "High" ? 0.92 : 0.72, completenessRatio, answerRatio || 1);
  const quality = {
    formulaPreservation: labelQuality(formulaRatio),
    visualPreservation: labelQuality(visualRatio),
    questionCompleteness: labelQuality(completenessRatio),
    answerCompleteness: input.draft?.answerKeysLinked || answerKeysLinked ? labelQuality(answerRatio) : "Needs Review",
    overall: needsReview ? "Needs Review" : labelQuality(overallRatio)
  } as ProfessionalDraft["quality"];
  return {
    schema: "NIDUS_AI_RECONSTRUCTION_DRAFT_V1",
    questions,
    questionCount: questions.length,
    questionTypes: Array.from(new Set(questions.map((question) => question.questionType))),
    answerKeysLinked,
    needsReview,
    quality,
    overallQuality: quality.overall,
    message: needsReview ? "NIDUS AI reconstructed the draft and marked uncertain content for review." : "NIDUS AI reconstructed a publish-ready draft for teacher approval.",
    createdAt: new Date().toISOString()
  };
}

function confidenceFromInput(input: NdieAiReconstructionInput) {
  const quality = String(input.draft?.overallQuality || input.draft?.quality?.overall || "").toUpperCase();
  const validation = input.ndieOutputs?.validation as { averageConfidence?: number; publishReady?: boolean } | undefined;
  if (validation?.publishReady && typeof validation.averageConfidence === "number") return validation.averageConfidence / 100;
  if (quality === "HIGH") return 0.9;
  if (quality === "MEDIUM") return 0.76;
  return 0.58;
}

export function buildAiReconstructionPrompt(input: NdieAiReconstructionInput) {
  const instructions = [
    "You are reconstructing an examination paper for NIDUS Academy.",
    "Use only the supplied NDIE structured outputs. Never invent questions, options, answers, formulas, diagrams, tables or graphs.",
    "Do not invent questions or academic content that is absent from the source evidence.",
    "Never silently discard uncertain content; preserve its source reference and mark it NEEDS_REVIEW.",
    "Preserve original numbering, section order, formulas, diagrams, tables, graphs, page references and answer mapping.",
    "If any item is uncertain, include it and mark reviewStatus as NEEDS_REVIEW.",
    "Never silently discard a question, option, formula, diagram, graph or table.",
    "Do not assume MCQ. Detect MCQ, multiple correct, numerical, true/false, assertion reason, matching, fill blank, short answer, long answer, case study, passage, diagram, table, graph, mixed exam or unknown.",
    "If reconstruction confidence is low, still create the draft and mark missing Option, Formula, Diagram, Answer or Solution for teacher review.",
    "Return strict JSON with draft, confidence, reviewFlags and providerDiagnostics.",
    "Draft questions must include number, questionText, options, questionType, draftConfidence, reviewStatus, linkedAssets, linkedAnswer, linkedSolution, recoveredFormula, sourceReference, sourcePage, boundingRegion, originalCrop, missingItems, originalCropRequired and notes."
  ].join("\n");
  const payload = {
    subject: input.subject,
    topic: input.topic,
    documentClass: input.documentClass,
    pipeline: input.pipeline,
    ocr: input.ndieOutputs?.ocr ?? null,
    layout: input.ndieOutputs?.layout ?? null,
    formula: input.ndieOutputs?.formula ?? null,
    visual: input.ndieOutputs?.visual ?? null,
    assessment: input.ndieOutputs?.assessment ?? null,
    evaluation: input.ndieOutputs?.evaluation ?? null,
    validation: input.ndieOutputs?.validation ?? null,
    stemIntelligence: input.ndieOutputs?.stemIntelligence ?? null,
    pageReferences: input.ndieOutputs?.pageReferences ?? null,
    boundingBoxes: input.ndieOutputs?.boundingBoxes ?? null,
    originalPageAssets: input.ndieOutputs?.originalPageAssets ?? null,
    questionRelationships: input.ndieOutputs?.questionRelationships ?? null,
    answerKey: input.ndieOutputs?.answerKey ?? null,
    currentDraft: input.draft ?? null,
    extractedQuestions: normalizedQuestions(input)
  };
  return { instructions, input: compact(payload) };
}

export const ndieAiReconstructionService = {
  shouldReconstruct(input: NdieAiReconstructionInput) {
    if (input.standardizationMode === "DETERMINISTIC") return false;
    const threshold = typeof input.confidenceThreshold === "number" ? input.confidenceThreshold : 0.82;
    return confidenceFromInput(input) < threshold || Number(input.draft?.needsReview ?? 0) > 0;
  },

  async reconstruct(input: NdieAiReconstructionInput): Promise<NdieAiReconstructionResult> {
    const started = Date.now();
    const route = ndieProviderOrchestratorService.router.route({
      type: "VALIDATION",
      documentType: input.documentClass,
      requiresFormula: /math|physics|chem|formula|stem/i.test(`${input.subject || ""} ${input.documentClass || ""}`),
      requiresDiagram: /diagram|visual|physics|chemistry/i.test(`${input.subject || ""} ${input.documentClass || ""}`),
      requiresTable: /table|chemistry/i.test(`${input.subject || ""} ${input.documentClass || ""}`),
      requiresQuestionDetection: true,
      mode: "ACCURACY_AWARE"
    });
    const providerChain = route.priorityChain.map((provider) => provider.id);
    const ndieDraft = ndieUniversalExamBuilderService.buildDraft(input) as ProfessionalDraft;
    const { instructions, input: promptInput } = buildAiReconstructionPrompt(input);
    const promptChecksum = checksum(`${instructions}\n${promptInput}`);
    const initialConfidence = confidenceFromInput(input);
    const shouldUseAi = this.shouldReconstruct(input);
    const aiAllowed = input.standardizationMode !== "DETERMINISTIC";
    const effectiveShouldUseAi = aiAllowed && shouldUseAi;
    let mode: NdieAiReconstructionResult["mode"] = effectiveShouldUseAi ? "AI_RECONSTRUCTION" : "NDIE_PRIMARY";
    let provider = route.selectedProvider?.id || "ai.rule-based";
    let aiPayload = {
      draft: ndieDraft,
      confidence: Math.max(initialConfidence, ndieDraft.questions.reduce((sum, question) => sum + question.draftConfidence, 0) / Math.max(1, ndieDraft.questions.length)),
      reviewFlags: ndieDraft.questions.filter((question) => question.reviewStatus !== "READY").map((question) => `Question ${question.number}: ${question.reviewStatus}`),
      providerDiagnostics: {
        selectedProvider: provider,
        fallbackChain: providerChain,
        rule: effectiveShouldUseAi ? "low-confidence-ai-reconstruction" : aiAllowed ? "ndie-primary-draft" : "deterministic-standardization"
      }
    };
    if (effectiveShouldUseAi && /openai/i.test(provider)) {
      aiPayload = await callOpenAIJson<typeof aiPayload>(instructions, promptInput, aiPayload);
    } else if (effectiveShouldUseAi && provider !== "ai.rule-based") {
      mode = "NDIE_FALLBACK";
    }
    const responseChecksum = checksum(aiPayload);
    return {
      engine: "NIDUS_AI_RECONSTRUCTION_ENGINE_V1",
      mode,
      provider,
      draft: aiPayload.draft,
      promptVersion,
      promptChecksum,
      responseChecksum,
      confidence: Math.round(Math.max(0, Math.min(1, aiPayload.confidence)) * 10000) / 10000,
      reviewFlags: aiPayload.reviewFlags,
      admin: {
        providerUsed: provider,
        providerChain,
        tokens: {
          estimatedInputTokens: Math.ceil((instructions.length + promptInput.length) / 4),
          estimatedOutputTokens: Math.ceil(JSON.stringify(aiPayload).length / 4)
        },
        latencyMs: Date.now() - started,
        estimatedCostUsd: route.selectedProvider?.estimatedCostUsd ?? 0,
        modelVersion: route.selectedProvider?.version ?? "rule-based-local",
        promptVersion,
        promptChecksum,
        responseChecksum,
        providerDiagnostics: aiPayload.providerDiagnostics
      }
    };
  }
};
