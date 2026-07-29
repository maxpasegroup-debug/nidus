import { apiClient } from "@/services/api";
import type { Test, TestAttempt, TestResult } from "@/types/test";

export type TestFilters = {
  search?: string;
  examType?: string;
  topic?: string;
};

export type TestPayload = {
  title: string;
  description: string;
  examType: string;
  category: string;
  subject?: string;
  topic?: string;
  batchId?: string;
  teacherId?: string;
  publishAt?: string;
  status?: string;
  duration: number;
  totalMarks: number;
  isMockTest?: boolean;
  isLive?: boolean;
  questions?: Array<{
    questionText: string;
    questionImage?: string;
    visualReviewRequired?: boolean;
    visualReviewNotes?: string[];
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
  }>;
};

export type TestDraftRequest = {
  prompt: string;
  examType?: string;
  subject?: string;
  topic?: string;
  questionCount?: number;
  difficultyLevel?: string;
  batchId?: string;
};

export type SubmitTestPayload = {
  attemptId: string;
  answers: Array<{ questionId: string; selectedAnswer: string }>;
  timeTaken: number;
};

export type AutosavePayload = {
  attemptId: string;
  currentQuestionId?: string;
  sectionState?: unknown;
  answers: Array<{ questionId: string; selectedAnswer?: string; status?: string; confidence?: string; timeSpent?: number; markedForReview?: boolean }>;
};

export async function getTests(filters: TestFilters = {}) {
  const response = await apiClient.get<{ tests: Test[] }>("/tests", { params: filters });
  return response.data.tests;
}

export async function getAvailableTests() {
  const response = await apiClient.get<{ tests: Array<Test & { studentStatus?: string }> }>("/tests/available");
  return response.data.tests;
}

export async function createTest(payload: TestPayload) {
  const response = await apiClient.post<{ test: Test }>("/tests", payload);
  return response.data.test;
}

export async function generateTestDraft(payload: TestDraftRequest) {
  const response = await apiClient.post<{ draft: TestPayload }>("/tests/ai-draft", payload);
  return response.data.draft;
}

export async function publishGeneratedTest(payload: TestPayload) {
  const response = await apiClient.post<{ test: Test }>("/tests/publish-draft", payload);
  return response.data.test;
}

export async function getTestDetails(id: string) {
  const response = await apiClient.get<{ test: Test }>(`/tests/${id}`);
  return response.data.test;
}

export async function startTest(testId: string) {
  const response = await apiClient.post<{ attempt: TestAttempt }>("/tests/start", { testId });
  return response.data.attempt;
}

export async function submitTest(payload: SubmitTestPayload) {
  const response = await apiClient.post<{ result: TestAttempt }>("/tests/submit", payload);
  return response.data.result;
}

export async function resumeAttempt(attemptId: string) {
  const response = await apiClient.get<{ attempt: TestAttempt & { answerStates?: Array<Record<string, unknown>> } }>(`/tests/attempts/${attemptId}/resume`);
  return response.data.attempt;
}

export async function autosaveAttempt(payload: AutosavePayload) {
  const response = await apiClient.post<{ attempt: TestAttempt }>("/tests/autosave", payload);
  return response.data.attempt;
}

export async function logIntegrityEvent(payload: { attemptId: string; eventType: string; severity?: "LOW" | "MEDIUM" | "HIGH"; metadata?: unknown }) {
  const response = await apiClient.post("/tests/integrity-event", payload);
  return response.data;
}

export async function getReviewPlan(attemptId: string) {
  const response = await apiClient.get<{ plan: { skippedQuestionIds: string[]; reviewQuestionIds: string[]; lowConfidenceQuestionIds: string[]; aiReviewOrder: string[]; quickWinShell: string[] } }>(`/tests/attempts/${attemptId}/review-plan`);
  return response.data.plan;
}

export async function getResult(attemptId: string) {
  const response = await apiClient.get<TestResult>(`/tests/result/${attemptId}`);
  return response.data;
}

export async function getAttemptHistory() {
  const response = await apiClient.get<{ attempts: TestAttempt[] }>("/tests/attempts/history");
  return response.data.attempts;
}
