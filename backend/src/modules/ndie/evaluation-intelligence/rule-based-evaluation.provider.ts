import { createHash } from "node:crypto";
import { env } from "../../../config/env.js";
import type { NdieAssessmentDocument, NdieNormalizedQuestion } from "../contracts/assessment-result.js";
import type {
  NdieEvaluationDiagnostics,
  NdieEvaluationDocument,
  NdieEvaluationRelationship,
  NdieEvaluationResult,
  NdieMarkingRule,
  NdieNormalizedAnswer,
  NdieNormalizedEvaluation,
  NdieNormalizedSolution,
  NdieRubric,
  NdieSolutionKind
} from "../contracts/evaluation-result.js";
import type { EvaluationProvider } from "../contracts/providers.js";
import type { NdieLayoutBox } from "../contracts/layout-result.js";

type SourceElement = {
  id: string;
  pageNumber: number;
  elementType: string;
  text?: string | null;
  normalizedText?: string | null;
  coordinates: unknown;
  readingOrder?: number | null;
  confidence?: number | null;
  metadata?: unknown;
};

const answerPattern = /(?:^|\s)(?:Q?\.?\s*)?(\d{1,4})\s*[\-:.)]\s*([A-E](?:\s*[,/]\s*[A-E])*)\b/gi;
const inlineAnswerPattern = /(?:answer|ans\.?|correct option)\s*[:\-]\s*([A-E](?:\s*[,/]\s*[A-E])*)/i;
const solutionPattern = /(?:^|\s)(?:solution|explanation|sol\.?)\s*(?:for)?\s*(?:Q?\.?\s*)?(\d{1,4})\s*[:.)-]\s*(.+)/i;
const markingPattern = /(?:\+|positive\s*)?(\d+(?:\.\d+)?)\s*(?:marks?|mark)\b/i;
const negativePattern = /(?:negative|minus|\-)\s*(\d+(?:\.\d+)?)\s*(?:marks?|mark)?/i;

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function asBox(value: unknown): NdieLayoutBox | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const x = Number(record.x ?? 0);
  const y = Number(record.y ?? 0);
  const width = Number(record.width ?? 0);
  const height = Number(record.height ?? 0);
  return {
    page: Number(record.page ?? record.pageNumber ?? 1),
    x,
    y,
    width,
    height,
    rotation: Number(record.rotation ?? 0),
    normalized: {
      x: Number(record.normalizedX ?? x),
      y: Number(record.normalizedY ?? y),
      width: Number(record.normalizedWidth ?? width),
      height: Number(record.normalizedHeight ?? height)
    },
    polygon: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
  };
}

function elementText(element: SourceElement) {
  return String(element.normalizedText || element.text || "").trim();
}

function splitOptions(value: string) {
  return value
    .split(/[,/]/)
    .map((option) => option.trim().toUpperCase())
    .filter((option) => /^[A-E]$/.test(option));
}

function defaultMarkingRule(question?: NdieNormalizedQuestion, nearbyText = ""): NdieMarkingRule {
  const positive = nearbyText.match(markingPattern);
  const negative = nearbyText.match(negativePattern);
  const noNegative = /no\s+negative|without\s+negative|no\s+minus/i.test(nearbyText);
  return {
    positiveMarks: positive ? Number(positive[1]) : question?.marks ?? null,
    negativeMarks: noNegative ? 0 : negative ? Number(negative[1]) : null,
    partialMarks: /partial|proportional|step\s+mark/i.test(nearbyText),
    bonusMarks: /bonus|grace/i.test(nearbyText) ? 1 : null,
    noNegative,
    sectionRule: /section[-\s]wise|section/i.test(nearbyText) ? nearbyText.slice(0, 180) : null,
    questionRule: /question[-\s]wise|each question/i.test(nearbyText) ? nearbyText.slice(0, 180) : null,
    multiCorrectScoring: /partial/i.test(nearbyText) ? "PARTIAL" : /all\s+or\s+nothing|only if all/i.test(nearbyText) ? "ALL_OR_NOTHING" : "UNKNOWN"
  };
}

function blankDiagnostics(): NdieEvaluationDiagnostics {
  return {
    missingAnswer: false,
    duplicateAnswer: false,
    answerMismatch: false,
    questionMismatch: false,
    solutionMismatch: false,
    missingExplanation: false,
    brokenNumbering: false,
    orphanSolutions: false,
    conflictingMarking: false,
    lowConfidence: false,
    issues: []
  };
}

function solutionKind(text: string): NdieSolutionKind {
  if (/step|therefore|hence|=>|⇒/i.test(text)) return "STEP_BY_STEP";
  if (/derivat|differentiat|integrat|formula/i.test(text)) return "FORMULA_DERIVATION";
  if (/diagram|figure|graph|chart/i.test(text)) return "DIAGRAM_EXPLANATION";
  if (/table|row|column/i.test(text)) return "TABLE_EXPLANATION";
  if (text.length > 220) return "LONG_EXPLANATION";
  return "SHORT_EXPLANATION";
}

function findQuestion(assessment: NdieAssessmentDocument | null, questionNumber: string) {
  return assessment?.questions.find((question) => question.questionNumber === questionNumber) ?? null;
}

function relatedIds(elements: unknown[], pageNumber: number, elementTypes: string[]) {
  return elements
    .filter((element) => {
      if (!element || typeof element !== "object") return false;
      const record = element as Record<string, unknown>;
      return Number(record.pageNumber) === pageNumber && elementTypes.includes(String(record.elementType));
    })
    .map((element) => String((element as Record<string, unknown>).id))
    .filter(Boolean);
}

export class RuleBasedEvaluationProvider implements EvaluationProvider {
  readonly id = "evaluation.rule-based";
  readonly kind = "EVALUATION" as const;
  readonly displayName = "NDIE Rule-Based Evaluation Intelligence";
  readonly version = "1.0-gate9";

  isEnabled() {
    return true;
  }

  health() {
    return {
      id: this.id,
      kind: this.kind,
      enabled: true,
      configured: true,
      status: "READY" as const
    };
  }

  async evaluate(input: {
    importJobId: string;
    sourceKind: string;
    assessment: NdieAssessmentDocument | null;
    elements: SourceElement[];
    ocrPages?: unknown[];
    layoutPages?: unknown[];
    formulaElements?: unknown[];
    visualElements?: unknown[];
  }): Promise<NdieEvaluationResult> {
    const startedAt = Date.now();
    const sourceLooksLikeKey = /ANSWER|KEY|SOLUTION/i.test(input.sourceKind);
    const answersByQuestion = new Map<string, NdieNormalizedAnswer[]>();
    const solutions: NdieNormalizedSolution[] = [];
    const rubrics: NdieRubric[] = [];
    const relationships: NdieEvaluationRelationship[] = [];

    for (const element of input.elements) {
      const text = elementText(element);
      if (!text) continue;

      for (const match of text.matchAll(answerPattern)) {
        const questionNumber = match[1];
        const question = findQuestion(input.assessment, questionNumber);
        const correctOptions = splitOptions(match[2]);
        const answer: NdieNormalizedAnswer = {
          answerId: `answer-${input.importJobId}-${questionNumber}-${answersByQuestion.get(questionNumber)?.length ?? 0}`,
          questionId: question?.questionId ?? null,
          questionNumber,
          answerKind: sourceLooksLikeKey ? "SEPARATE_ANSWER_KEY_DOCUMENT" : "INLINE_ANSWER_KEY",
          correctOptions,
          rawAnswer: match[2],
          versionLabel: null,
          sourceElementIds: [element.id],
          boundingBoxes: [asBox(element.coordinates)].filter((box): box is NdieLayoutBox => Boolean(box)),
          confidence: sourceLooksLikeKey ? 0.82 : 0.58
        };
        answersByQuestion.set(questionNumber, [...(answersByQuestion.get(questionNumber) ?? []), answer]);
      }

      const inlineAnswer = text.match(inlineAnswerPattern);
      const nearbyQuestion = text.match(/(?:^|\s)Q?\.?\s*(\d{1,4})\b/i);
      if (inlineAnswer && nearbyQuestion) {
        const questionNumber = nearbyQuestion[1];
        const question = findQuestion(input.assessment, questionNumber);
        const answer: NdieNormalizedAnswer = {
          answerId: `answer-${input.importJobId}-${questionNumber}-inline`,
          questionId: question?.questionId ?? null,
          questionNumber,
          answerKind: "INLINE_ANSWER_KEY",
          correctOptions: splitOptions(inlineAnswer[1]),
          rawAnswer: inlineAnswer[1],
          versionLabel: null,
          sourceElementIds: [element.id],
          boundingBoxes: [asBox(element.coordinates)].filter((box): box is NdieLayoutBox => Boolean(box)),
          confidence: 0.62
        };
        answersByQuestion.set(questionNumber, [...(answersByQuestion.get(questionNumber) ?? []), answer]);
      }

      const solutionMatch = text.match(solutionPattern);
      if (solutionMatch) {
        const questionNumbers = [solutionMatch[1]];
        const question = findQuestion(input.assessment, solutionMatch[1]);
        const formulaLinks = relatedIds(input.formulaElements ?? [], element.pageNumber, ["FORMULA"]);
        const visualLinks = relatedIds(input.visualElements ?? [], element.pageNumber, ["DIAGRAM", "GRAPH", "TABLE", "IMAGE"]);
        const solution: NdieNormalizedSolution = {
          solutionId: `solution-${input.importJobId}-${solutionMatch[1]}-${solutions.length}`,
          questionIds: question ? [question.questionId] : [],
          questionNumbers,
          solutionKind: solutionKind(solutionMatch[2]),
          text: solutionMatch[2].trim(),
          formulaLinks,
          visualLinks,
          sourceElementIds: [element.id],
          boundingBoxes: [asBox(element.coordinates)].filter((box): box is NdieLayoutBox => Boolean(box)),
          confidence: formulaLinks.length || visualLinks.length ? 0.74 : 0.66
        };
        solutions.push(solution);
      }

      if (/rubric|scoring criteria|keywords?|model answer|expected concepts?/i.test(text)) {
        const questionNumber = text.match(/Q?\.?\s*(\d{1,4})/i)?.[1] ?? "";
        const question = questionNumber ? findQuestion(input.assessment, questionNumber) : null;
        rubrics.push({
          rubricId: `rubric-${input.importJobId}-${rubrics.length + 1}`,
          questionId: question?.questionId ?? null,
          criteria: text.split(/[.;]/).map((part) => part.trim()).filter(Boolean).slice(0, 8),
          keywords: [...text.matchAll(/keywords?\s*[:\-]\s*([^.;]+)/gi)].flatMap((match) => match[1].split(",").map((item) => item.trim())).filter(Boolean),
          expectedConcepts: [...text.matchAll(/concepts?\s*[:\-]\s*([^.;]+)/gi)].flatMap((match) => match[1].split(",").map((item) => item.trim())).filter(Boolean),
          modelAnswer: /model answer/i.test(text) ? text : null,
          manualEvaluationHints: /manual|teacher|evaluator/i.test(text) ? [text] : [],
          confidence: 0.6
        });
      }
    }

    const questions = input.assessment?.questions ?? [];
    const allAnswers = [...answersByQuestion.values()].flat();
    const duplicateAnswerNumbers = new Set([...answersByQuestion.entries()].filter(([, answers]) => answers.length > 1).map(([questionNumber]) => questionNumber));
    const solutionByQuestion = new Map<string, NdieNormalizedSolution>();
    for (const solution of solutions) {
      for (const questionNumber of solution.questionNumbers) solutionByQuestion.set(questionNumber, solution);
    }

    const evaluations: NdieNormalizedEvaluation[] = questions.map((question) => {
      const answers = answersByQuestion.get(question.questionNumber) ?? [];
      const answer = answers[0] ?? null;
      const solution = solutionByQuestion.get(question.questionNumber) ?? null;
      const rubric = rubrics.find((candidate) => candidate.questionId === question.questionId) ?? null;
      const markingRule = defaultMarkingRule(question, `${question.text} ${solution?.text ?? ""}`);
      const diagnostics = blankDiagnostics();
      diagnostics.missingAnswer = !answer;
      diagnostics.duplicateAnswer = duplicateAnswerNumbers.has(question.questionNumber);
      diagnostics.missingExplanation = !solution;
      diagnostics.lowConfidence = Math.min(answer?.confidence ?? 0.4, solution?.confidence ?? 0.56) < 0.65;
      if (diagnostics.missingAnswer) diagnostics.issues.push(`Missing answer for question ${question.questionNumber}.`);
      if (diagnostics.duplicateAnswer) diagnostics.issues.push(`Duplicate answer candidates for question ${question.questionNumber}.`);
      if (diagnostics.missingExplanation) diagnostics.issues.push(`Missing solution or explanation for question ${question.questionNumber}.`);
      if (diagnostics.lowConfidence) diagnostics.issues.push(`Low evaluation confidence for question ${question.questionNumber}.`);

      const evaluationRelationships: NdieEvaluationRelationship[] = [
        { relationshipType: "QUESTION", sourceId: `evaluation-${input.importJobId}-${question.questionNumber}`, targetId: question.questionId, confidence: 1, reason: "Evaluation created from assessment question." },
        ...(answer ? [{ relationshipType: "ANSWER_KEY" as const, sourceId: `evaluation-${input.importJobId}-${question.questionNumber}`, targetId: answer.answerId, confidence: answer.confidence, reason: "Answer key candidate mapped by question number." }] : []),
        ...(solution ? [{ relationshipType: "SOLUTION" as const, sourceId: `evaluation-${input.importJobId}-${question.questionNumber}`, targetId: solution.solutionId, confidence: solution.confidence, reason: "Solution candidate mapped by question number." }] : []),
        ...(rubric ? [{ relationshipType: "RUBRIC" as const, sourceId: `evaluation-${input.importJobId}-${question.questionNumber}`, targetId: rubric.rubricId, confidence: rubric.confidence, reason: "Rubric candidate mapped by question number." }] : [])
      ];
      relationships.push(...evaluationRelationships);

      const evaluation: NdieNormalizedEvaluation = {
        schemaVersion: "ndie-evaluation-v1",
        evaluationId: `evaluation-${input.importJobId}-${question.questionNumber}`,
        questionId: question.questionId,
        questionNumber: question.questionNumber,
        answerId: answer?.answerId ?? null,
        solutionId: solution?.solutionId ?? null,
        rubricId: rubric?.rubricId ?? null,
        markingRule,
        relationships: evaluationRelationships,
        confidence: Number(((answer?.confidence ?? 0.4) * 0.55 + (solution?.confidence ?? 0.56) * 0.25 + (rubric?.confidence ?? 0.5) * 0.1 + 0.1).toFixed(4)),
        diagnostics,
        version: 1,
        pipelineVersion: env.NDIE_PIPELINE_VERSION,
        checksum: ""
      };
      evaluation.checksum = checksum(evaluation);
      return evaluation;
    });

    const orphanSolutions = solutions.filter((solution) => !solution.questionNumbers.some((questionNumber) => questions.some((question) => question.questionNumber === questionNumber)));
    const documentDiagnostics = blankDiagnostics();
    documentDiagnostics.missingAnswer = evaluations.some((evaluation) => evaluation.diagnostics.missingAnswer);
    documentDiagnostics.duplicateAnswer = duplicateAnswerNumbers.size > 0;
    documentDiagnostics.missingExplanation = evaluations.some((evaluation) => evaluation.diagnostics.missingExplanation);
    documentDiagnostics.orphanSolutions = orphanSolutions.length > 0;
    documentDiagnostics.lowConfidence = evaluations.some((evaluation) => evaluation.diagnostics.lowConfidence);
    if (documentDiagnostics.missingAnswer) documentDiagnostics.issues.push("One or more questions have no mapped answer.");
    if (documentDiagnostics.duplicateAnswer) documentDiagnostics.issues.push("Duplicate answer candidates detected.");
    if (documentDiagnostics.missingExplanation) documentDiagnostics.issues.push("One or more questions have no mapped explanation.");
    if (documentDiagnostics.orphanSolutions) documentDiagnostics.issues.push("One or more solutions could not be linked to assessment questions.");
    if (!input.assessment) {
      documentDiagnostics.questionMismatch = true;
      documentDiagnostics.issues.push("Assessment JSON was not available; evaluation mapping is limited.");
    }

    const confidenceValues = evaluations.map((evaluation) => evaluation.confidence).filter((value): value is number => typeof value === "number");
    const averageConfidence = confidenceValues.length ? Number((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length).toFixed(4)) : null;
    const evaluationDocument: NdieEvaluationDocument = {
      schemaVersion: "ndie-evaluation-document-v1",
      providerId: this.id,
      providerVersion: this.version,
      pipelineVersion: env.NDIE_PIPELINE_VERSION,
      importJobId: input.importJobId,
      answers: allAnswers,
      solutions,
      rubrics,
      evaluations,
      relationships,
      diagnostics: documentDiagnostics,
      metrics: {
        questions: questions.length,
        answers: allAnswers.length,
        solutions: solutions.length,
        rubrics: rubrics.length,
        answerCoverage: questions.length ? Number((evaluations.filter((evaluation) => evaluation.answerId).length / questions.length).toFixed(4)) : 0,
        solutionCoverage: questions.length ? Number((evaluations.filter((evaluation) => evaluation.solutionId).length / questions.length).toFixed(4)) : 0,
        rubricCoverage: questions.length ? Number((evaluations.filter((evaluation) => evaluation.rubricId).length / questions.length).toFixed(4)) : 0,
        averageConfidence,
        reviewRequired: evaluations.filter((evaluation) => evaluation.diagnostics.issues.length > 0).length,
        missingAnswers: evaluations.filter((evaluation) => evaluation.diagnostics.missingAnswer).length,
        duplicateAnswers: duplicateAnswerNumbers.size,
        conflicts: evaluations.filter((evaluation) => evaluation.diagnostics.answerMismatch || evaluation.diagnostics.conflictingMarking).length
      },
      rawProviderOutput: {
        sourceKind: input.sourceKind,
        sourceLooksLikeKey,
        elementCount: input.elements.length,
        formulaElementCount: input.formulaElements?.length ?? 0,
        visualElementCount: input.visualElements?.length ?? 0
      },
      checksum: "",
      durationMs: Date.now() - startedAt,
      createdAt: new Date().toISOString()
    };
    evaluationDocument.checksum = checksum(evaluationDocument);

    return {
      evaluation: evaluationDocument,
      answers: allAnswers.map((answer) => ({
        questionNumber: answer.questionNumber,
        answerJson: {
          schemaVersion: "ndie-answer-v1",
          type: answer.correctOptions.length > 1 ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE",
          correctOption: answer.correctOptions[0] ?? null,
          correctOptions: answer.correctOptions,
          source: answer.answerKind,
          answerId: answer.answerId,
          rawAnswer: answer.rawAnswer,
          evaluationSchemaVersion: "ndie-evaluation-v1"
        },
        confidence: answer.confidence ?? 0.5
      })),
      solutions: solutions.flatMap((solution) => solution.questionNumbers.map((questionNumber) => ({
        questionNumber,
        solutionJson: {
          schemaVersion: "ndie-solution-v1",
          solutionId: solution.solutionId,
          type: solution.solutionKind,
          text: solution.text,
          formulaLinks: solution.formulaLinks,
          visualLinks: solution.visualLinks,
          evaluationSchemaVersion: "ndie-evaluation-v1"
        },
        confidence: solution.confidence ?? 0.5
      }))),
      confidence: averageConfidence,
      raw: evaluationDocument.rawProviderOutput
    };
  }
}
