import { apiClient } from "@/services/api";
import type { OLQReport, PsychometricAdminOverview, PsychometricAttempt, PsychometricReportHistory, PsychometricResult, PsychometricTest } from "@/types/psychometric";

export async function getPsychometricTests() {
  const response = await apiClient.get<{ tests: PsychometricTest[] }>("/psychometric/tests");
  return response.data.tests;
}

export async function getPsychometricTest(id: string) {
  const response = await apiClient.get<{ test: PsychometricTest }>(`/psychometric/tests/${id}`);
  return response.data.test;
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

export async function downloadPsychometricReportPdf(attemptId: string) {
  const response = await apiClient.get<Blob>(`/psychometric/results/${attemptId}/pdf`, { responseType: "blob" });
  return response.data;
}

export async function getOLQReport() {
  const response = await apiClient.get<OLQReport>("/psychometric/olq-report");
  return response.data;
}
