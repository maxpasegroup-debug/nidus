import { apiClient } from "./api";

export type NdiePage = {
  id: string;
  pageNumber: number;
  imageUrl?: string | null;
  renderStatus: string;
  ocrStatus: string;
  layoutJson?: unknown;
};

export type NdieQuestionCandidate = {
  id: string;
  questionNumber?: string | null;
  questionType: string;
  candidateJson: {
    blocks?: Array<Record<string, unknown>>;
    metadata?: Record<string, unknown>;
  };
  sourceMap?: Record<string, unknown> | null;
  confidence?: number | null;
  status: string;
  reviewStatus: string;
};

export type NdieReviewWorkspace = {
  id: string;
  sourceKind: string;
  subject?: string | null;
  topic?: string | null;
  status: string;
  reviewStatus: string;
  manifest?: Record<string, unknown> | null;
  sourceDocuments: Array<{
    id: string;
    originalName: string;
    fileType: string;
    storageUrl: string;
    pageCount?: number | null;
  }>;
  pages: NdiePage[];
  elements: Array<{
    id: string;
    pageNumber: number;
    elementType: string;
    text?: string | null;
    confidence?: number | null;
  }>;
  questionCandidates: NdieQuestionCandidate[];
  answerKeyCandidates: Array<{ id: string; questionNumber?: string | null; answerJson: unknown; confidence?: number | null }>;
  solutionCandidates: Array<{ id: string; questionNumber?: string | null; solutionJson: unknown; confidence?: number | null }>;
  qualityScores: Array<{ overall: number; grade: string; aiConfidence?: number | null }>;
  providerRuns: Array<{ id: string; providerId: string; stage: string; status: string; confidence?: number | null }>;
};

export async function getNdieReviewWorkspace(importId: string) {
  const response = await apiClient.get<NdieReviewWorkspace>(`/ndie/imports/${importId}/review`);
  return response.data;
}

export async function validateNdieImport(importId: string) {
  const response = await apiClient.post(`/ndie/imports/${importId}/validate-ai`);
  return response.data;
}

export async function reviewNdieCandidate(candidateId: string, input: { decision: "APPROVED" | "REJECTED" | "NEEDS_EDIT"; notes?: string; candidateJson?: unknown }) {
  const response = await apiClient.patch(`/ndie/questions/${candidateId}/review`, input);
  return response.data;
}
