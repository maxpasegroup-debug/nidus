import { apiClient } from "@/services/api";
import type { Test, TestAttempt } from "@/types/test";

export type QuestionBankItem = {
  id: string;
  questionText: string;
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  category: string;
  subCategory: string;
  topic: string;
  subTopic?: string | null;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type QuestionBankPayload = {
  questionText: string;
  questionType?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  category?: string;
  subCategory: string;
  topic: string;
  subTopic?: string;
  difficulty?: string;
  marks?: number;
  negativeMarks?: number;
  status?: string;
};

export type ExamFromBankPayload = {
  title: string;
  description: string;
  examType: string;
  category?: string;
  subject?: string;
  topic?: string;
  batchId?: string;
  batchIds?: string[];
  duration: number;
  totalQuestions?: number;
  marks?: number;
  negativeMarks?: number;
  passingPercentage?: number;
  randomization?: boolean;
  questionSelection?: "MANUAL" | "RANDOM" | "HYBRID";
  questionIds?: string[];
  publishNow?: boolean;
  approvalAttestation?: "TEACHER_REVIEW_CONFIRMED";
  publishAt?: string;
};

export type ExaminationAnalytics = {
  totals: {
    exams: number;
    published: number;
    questions: number;
    questionBank: number;
    attempts: number;
    averageScore: number;
  };
  questionBankBreakdown: Array<{
    subCategory: string;
    topic: string;
    difficulty: string;
    status: string;
    _count: { _all: number };
  }>;
  examBreakdown: Array<{
    id: string;
    title: string;
    examType: string;
    status: string;
    questions: number;
    attempts: number;
  }>;
};

export type ExaminationResultAttempt = TestAttempt & {
  user: { id: string; name: string; email: string; role: string };
  test: Test & { batch?: { id: string; name: string } | null };
};

export async function getQuestionBank() {
  const response = await apiClient.get<{ questions: QuestionBankItem[] }>("/examination/question-bank");
  return response.data.questions;
}

export async function createQuestionBankItem(payload: QuestionBankPayload) {
  const response = await apiClient.post<{ question: QuestionBankItem }>("/examination/question-bank", payload);
  return response.data.question;
}

export async function updateQuestionBankItem(id: string, payload: Partial<QuestionBankPayload>) {
  const response = await apiClient.put<{ question: QuestionBankItem }>(`/examination/question-bank/${id}`, payload);
  return response.data.question;
}

export async function deleteQuestionBankItem(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/examination/question-bank/${id}`);
  return response.data;
}

export async function importQuestionBankCsv(csvText: string) {
  const response = await apiClient.post<{ imported: number }>("/examination/question-bank/import", { csvText });
  return response.data;
}

export async function createExamFromBank(payload: ExamFromBankPayload) {
  const response = await apiClient.post<{ exam: Test }>("/examination/exams/from-bank", {
    ...payload,
    approvalAttestation: payload.publishNow ? "TEACHER_REVIEW_CONFIRMED" : undefined
  });
  return response.data.exam;
}

export async function publishExam(id: string, publishAt?: string) {
  const details = await apiClient.get<{ test: Test }>(`/tests/${id}`);
  const questionIds = details.data.test.questions?.map((question) => question.id) ?? [];
  if (!questionIds.length) throw new Error("This exam has no questions to approve.");
  if (details.data.test.status !== "APPROVED") {
    await apiClient.post(`/tests/${id}/approve`, {
      attestation: "TEACHER_REVIEW_CONFIRMED",
      questionIds
    });
  }
  const response = await apiClient.post<{ exam: Test }>(`/examination/exams/${id}/publish`, { publishAt });
  return response.data.exam;
}

export async function closeExam(id: string) {
  const response = await apiClient.post<{ exam: Test }>(`/examination/exams/${id}/close`, {});
  return response.data.exam;
}

export async function deleteExam(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/examination/exams/${id}`);
  return response.data;
}

export async function getExaminationResults() {
  const response = await apiClient.get<{ attempts: ExaminationResultAttempt[] }>("/examination/results");
  return response.data.attempts;
}

export async function getExaminationAnalytics() {
  const response = await apiClient.get<{ analytics: ExaminationAnalytics }>("/examination/analytics");
  return response.data.analytics;
}
