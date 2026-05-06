import { apiClient } from "@/services/api";
import type { Test, TestAttempt, TestResult } from "@/types/test";

export type TestFilters = {
  search?: string;
  examType?: string;
  topic?: string;
};

export type SubmitTestPayload = {
  attemptId: string;
  answers: Array<{ questionId: string; selectedAnswer: string }>;
  timeTaken: number;
};

export async function getTests(filters: TestFilters = {}) {
  const response = await apiClient.get<{ tests: Test[] }>("/tests", { params: filters });
  return response.data.tests;
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

export async function getResult(attemptId: string) {
  const response = await apiClient.get<TestResult>(`/tests/result/${attemptId}`);
  return response.data;
}

export async function getAttemptHistory() {
  const response = await apiClient.get<{ attempts: TestAttempt[] }>("/tests/attempts/history");
  return response.data.attempts;
}
