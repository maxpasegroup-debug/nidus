import { calculateObjectiveScore, type ObjectiveAnswer, type ObjectiveQuestion } from "./exam-scoring.js";

type JsonObject = Record<string, unknown>;

export type EvaluatableQuestion = ObjectiveQuestion & {
  contentJson?: unknown;
  responseSpec?: unknown;
  evaluationSpec?: unknown;
};

export type StoredResponse = {
  questionId: string;
  selectedAnswer: string;
};

export type StudentResponseEnvelope = {
  schemaVersion: 1;
  responseType: string;
  value: unknown;
  metadata?: JsonObject;
};

export type EvaluatedAnswer = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  status: "EVALUATED" | "PENDING_EVALUATION";
};

function record(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function decodeResponse(value: unknown): StudentResponseEnvelope {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const input = value as JsonObject;
    return { schemaVersion: 1, responseType: String(input.responseType || input.type || "TEXT").toUpperCase(), value: input.value, metadata: record(input.metadata) };
  }

  const raw = String(value ?? "").trim();
  if (raw.startsWith("{")) {
    try {
      return decodeResponse(JSON.parse(raw));
    } catch {
      return { schemaVersion: 1, responseType: "TEXT", value: raw };
    }
  }

  return { schemaVersion: 1, responseType: "SINGLE_CHOICE", value: raw };
}

function encodeResponse(response: StudentResponseEnvelope) {
  if (response.responseType === "SINGLE_CHOICE" && typeof response.value === "string" && /^[A-D]$/.test(response.value)) {
    return response.value;
  }
  return JSON.stringify(response);
}

function contentAnswer(question: EvaluatableQuestion) {
  const content = record(question.contentJson);
  return record(content.answer);
}

function evaluationSpec(question: EvaluatableQuestion) {
  const direct = record(question.evaluationSpec);
  if (typeof direct.strategy === "string") return direct;
  const answer = contentAnswer(question);
  if (answer.type === "MULTIPLE_ANSWER" && Array.isArray(answer.correctOptions)) {
    return { strategy: "OPTION_SET", correctChoiceIds: answer.correctOptions };
  }
  if (answer.type === "NUMERICAL" && answer.value != null) {
    return { strategy: "NUMERIC_TOLERANCE", value: Number(answer.value), absoluteTolerance: 0 };
  }
  if (answer.type === "TEXT" && typeof answer.value === "string" && answer.value.trim()) {
    return { strategy: "TEXT_MATCH", acceptedValues: [answer.value], caseSensitive: false };
  }
  const correct = String(answer.correctOption || question.correctAnswer || "").trim().toUpperCase();
  if (/^[A-D]$/.test(correct)) return { strategy: "EXACT_OPTION", correctChoiceId: correct };
  return { strategy: "UNRESOLVED", reason: "No teacher-verified answer key is available." };
}

function isLegacyExactOption(question: EvaluatableQuestion, spec: JsonObject) {
  return spec.strategy === "EXACT_OPTION"
    && !question.evaluationSpec
    && !question.contentJson
    && /^[A-D]$/.test(String(question.correctAnswer || "").trim().toUpperCase());
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).sort();
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean).sort();
  return [];
}

function compareText(actual: unknown, expected: string[], caseSensitive: boolean) {
  const value = String(actual ?? "").trim();
  const comparable = caseSensitive ? value : value.toLowerCase();
  return expected.some((item) => (caseSensitive ? item.trim() : item.trim().toLowerCase()) === comparable);
}

export function normalizeStoredResponse(question: EvaluatableQuestion, input: unknown): StoredResponse {
  const response = decodeResponse(input);
  const spec = evaluationSpec(question);
  if (isLegacyExactOption(question, spec)) {
    const selected = String(response.value ?? "").trim().toUpperCase();
    if (!/^[A-D]$/.test(selected)) {
      throw Object.assign(new Error("Selected answer must be A, B, C or D for this single-choice question."), { statusCode: 400 });
    }
    return { questionId: question.id, selectedAnswer: selected };
  }
  if (spec.strategy === "EXACT_OPTION") {
    const selected = String(response.value ?? "").trim();
    if (!selected) throw Object.assign(new Error("A selected choice is required for this question."), { statusCode: 400 });
    return { questionId: question.id, selectedAnswer: encodeResponse({ ...response, responseType: "SINGLE_CHOICE", value: selected }) };
  }
  return { questionId: question.id, selectedAnswer: encodeResponse(response) };
}

export function evaluateExamResponses(questions: EvaluatableQuestion[], answers: StoredResponse[]) {
  const byQuestion = new Map(questions.map((question) => [question.id, question]));
  const evaluatedAnswers: EvaluatedAnswer[] = [];
  const objectiveQuestions: ObjectiveQuestion[] = [];
  const objectiveAnswers: ObjectiveAnswer[] = [];
  let score = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let pendingEvaluation = 0;

  for (const answer of answers) {
    const question = byQuestion.get(answer.questionId);
    if (!question) continue;
    const spec = evaluationSpec(question);
    const response = decodeResponse(answer.selectedAnswer);

    if (isLegacyExactOption(question, spec)) {
      objectiveQuestions.push(question);
      objectiveAnswers.push({ questionId: question.id, selectedAnswer: String(response.value ?? "").trim().toUpperCase() });
      continue;
    }

    let correct: boolean | null = null;
    if (spec.strategy === "EXACT_OPTION") {
      correct = String(response.value ?? "").trim() === String(spec.correctChoiceId ?? "").trim();
    } else if (spec.strategy === "OPTION_SET") {
      correct = normalizeStringArray(response.value).join("\u001f") === normalizeStringArray(spec.correctChoiceIds).join("\u001f");
    } else if (spec.strategy === "BOOLEAN") {
      correct = Boolean(response.value) === Boolean(spec.value);
    } else if (spec.strategy === "NUMERIC_TOLERANCE") {
      const actual = Number(response.value);
      const expected = Number(spec.value);
      const absolute = Number(spec.absoluteTolerance ?? 0);
      const relative = Math.abs(expected) * Number(spec.relativeTolerance ?? 0);
      correct = Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= Math.max(absolute, relative);
    } else if (spec.strategy === "TEXT_MATCH") {
      correct = compareText(response.value, normalizeStringArray(spec.acceptedValues), Boolean(spec.caseSensitive));
    } else {
      pendingEvaluation += 1;
      evaluatedAnswers.push({ questionId: question.id, selectedAnswer: answer.selectedAnswer, isCorrect: false, status: "PENDING_EVALUATION" });
      continue;
    }

    if (correct) {
      score += question.marks;
      totalCorrect += 1;
    } else {
      score -= question.negativeMarks;
      totalWrong += 1;
    }
    evaluatedAnswers.push({ questionId: question.id, selectedAnswer: answer.selectedAnswer, isCorrect: Boolean(correct), status: "EVALUATED" });
  }

  const objective = calculateObjectiveScore(objectiveQuestions, objectiveAnswers);
  score += objective.score;
  totalCorrect += objective.totalCorrect;
  totalWrong += objective.totalWrong;
  for (const answer of objectiveAnswers) {
    const question = byQuestion.get(answer.questionId)!;
    evaluatedAnswers.push({ questionId: answer.questionId, selectedAnswer: answer.selectedAnswer, isCorrect: question.correctAnswer === answer.selectedAnswer, status: "EVALUATED" });
  }

  return {
    score,
    totalCorrect,
    totalWrong,
    totalUnanswered: Math.max(0, questions.length - totalCorrect - totalWrong - pendingEvaluation),
    pendingEvaluation,
    evaluatedAnswers
  };
}
