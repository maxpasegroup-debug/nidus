import { apiClient } from "@/services/api";
import type { OLQReport, PsychometricAdminOverview, PsychometricAttempt, PsychometricAttemptHistory, PsychometricQuestion, PsychometricReadiness, PsychometricReportHistory, PsychometricResult, PsychometricTest } from "@/types/psychometric";

export async function getPsychometricTests() {
  const response = await apiClient.get<{ tests: PsychometricTest[] }>("/psychometric/tests");
  return response.data.tests;
}

export async function getAdminPsychometricTests() {
  const response = await apiClient.get<{ tests: PsychometricTest[] }>("/psychometric/admin/tests");
  return response.data.tests;
}

export async function getPsychometricTest(id: string) {
  const response = await apiClient.get<{ test: PsychometricTest }>(`/psychometric/tests/${id}`);
  return response.data.test;
}

export async function updateAdminPsychometricTest(payload: {
  id: string;
  data: Partial<Pick<PsychometricTest, "title" | "description" | "duration" | "instructions" | "access" | "category" | "isActive">>;
}) {
  const response = await apiClient.patch<{ test: PsychometricTest }>(`/psychometric/admin/tests/${payload.id}`, payload.data);
  return response.data.test;
}

export async function updateAdminPsychometricQuestion(payload: {
  id: string;
  data: Partial<Pick<PsychometricQuestion, "questionText" | "questionType" | "options" | "order">>;
}) {
  const response = await apiClient.patch<{ question: PsychometricQuestion }>(`/psychometric/admin/questions/${payload.id}`, payload.data);
  return response.data.question;
}

export async function getPsychometricAttemptHistory(testId: string) {
  const response = await apiClient.get<PsychometricAttemptHistory>(`/psychometric/tests/${testId}/history`);
  return response.data;
}

export async function startPsychometricTest(testId: string) {
  const response = await apiClient.post<{ attempt: PsychometricAttempt }>("/psychometric/start", { testId });
  return response.data.attempt;
}

export async function submitPsychometric(payload: {
  attemptId: string;
  answers: Array<{ questionId: string; answerText?: string; selectedOption?: string }>;
}) {
  const response = await apiClient.post<{ attempt: PsychometricAttempt }>("/psychometric/submit", payload);
  return response.data.attempt;
}

export async function getPsychometricResults(attemptId: string) {
  const response = await apiClient.get<PsychometricResult>(`/psychometric/results/${attemptId}`);
  return response.data;
}

export async function getPsychometricReportHistory() {
  const response = await apiClient.get<PsychometricReportHistory>("/psychometric/reports");
  return response.data;
}

export async function getPsychometricAdminOverview() {
  const response = await apiClient.get<PsychometricAdminOverview>("/psychometric/admin/overview");
  return response.data;
}

export async function getPsychometricReadiness() {
  const response = await apiClient.get<PsychometricReadiness>("/psychometric/admin/readiness");
  return response.data;
}

export async function downloadPsychometricReportPdf(attemptId: string) {
  const response = await apiClient.get<Blob>(`/psychometric/results/${attemptId}/pdf`, { responseType: "blob" });
  return response.data;
}

export async function getOLQReport() {
  const response = await apiClient.get<OLQReport>("/psychometric/olq-report");
  return response.data;
}
