import { apiClient } from "./api";

export type NdiePage = {
  id: string;
  pageNumber: number;
  width?: number | null;
  height?: number | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  renderStatus: string;
  ocrStatus: string;
  layoutJson?: unknown;
};

export type NdieReviewDecision = "APPROVED" | "REJECTED" | "NEEDS_EDIT" | "SKIPPED";

export type NdieQuestionCandidate = {
  id: string;
  questionNumber?: string | null;
  questionType: string;
  candidateJson: {
    blocks?: Array<Record<string, unknown>>;
    metadata?: Record<string, unknown>;
    assessment?: Record<string, unknown>;
  };
  sourceMap?: Record<string, unknown> | null;
  confidence?: number | null;
  status: string;
  reviewStatus: string;
};

export type NdieQualityScore = {
  overall: number;
  grade: string;
  ocrConfidence?: number | null;
  formulaAccuracy?: number | null;
  layoutAccuracy?: number | null;
  tableAccuracy?: number | null;
  diagramPreservation?: number | null;
  optionCompleteness?: number | null;
  answerKeyConfidence?: number | null;
  aiConfidence?: number | null;
  teacherReviewCompletion?: number | null;
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
  answerKeyCandidates: Array<{ id: string; questionCandidateId?: string | null; questionNumber?: string | null; answerJson: unknown; confidence?: number | null }>;
  solutionCandidates: Array<{ id: string; questionNumber?: string | null; solutionJson: unknown; confidence?: number | null }>;
  qualityScores: NdieQualityScore[];
  providerRuns: Array<{ id: string; providerId: string; stage: string; status: string; confidence?: number | null }>;
  teacherSummary?: Record<string, unknown> | null;
  reviewDecisions?: Array<{ id: string; questionCandidateId?: string | null; decision: string; notes?: string | null; reviewedBy?: string | null; createdAt: string }>;
  revisions?: Array<{ id: string; questionCandidateId?: string | null; revision: number; changeType: string; changeReason?: string | null; changedBy?: string | null; createdAt: string }>;
  reviewInsights?: {
    counts: Record<string, number>;
    dashboard?: {
      overallConfidence?: number | null;
      riskLevel?: string;
      validationStatus?: string;
      publishReadiness?: Record<string, unknown>;
      recommendations?: string[];
      completion?: Record<string, unknown>;
    };
    heatmap: Array<{ candidateId: string; questionNumber?: string | null; confidence?: number | null; band: string; reviewStatus: string; issueCount?: number }>;
    reviewQueue: Array<{ candidateId: string; questionNumber?: string | null; confidence?: number | null; band: string; reviewStatus: string; pageNumber: number; issueCount?: number }>;
    questionIssues?: Record<string, string[]>;
    formulas?: Array<{ id: string; pageNumber: number; text?: string | null; confidence?: number | null; coordinates?: unknown; metadata?: unknown; status: string }>;
    visuals?: Array<{ id: string; pageNumber: number; type: string; text?: string | null; confidence?: number | null; coordinates?: unknown; metadata?: unknown; status: string }>;
    answers?: Array<{ id: string; questionNumber?: string | null; answerJson: unknown; confidence?: number | null; status: string }>;
    solutions?: Array<{ id: string; questionNumber?: string | null; solutionJson: unknown; confidence?: number | null; status: string }>;
    validation?: {
      confidence?: number | null;
      publishReadiness?: Record<string, unknown>;
      issues?: unknown[];
      warnings?: unknown[];
      recommendations?: string[];
      metrics?: Record<string, unknown>;
    };
    pageRisk: Array<{ pageNumber: number; lowConfidenceElements: number; visualElements: number }>;
    revisionSummary: Array<{ id: string; questionCandidateId?: string | null; revision: number; changeType: string; changedBy?: string | null; createdAt: string }>;
  };
};

export type NdiePublishInput = {
  title?: string;
  description?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  duration?: number;
  publishAt?: string;
  allowAutoApproved?: boolean;
};

export async function getNdieReviewWorkspace(importId: string) {
  const response = await apiClient.get<NdieReviewWorkspace>(`/ndie/imports/${importId}/review`);
  return response.data;
}

export async function validateNdieImport(importId: string) {
  const response = await apiClient.post(`/ndie/imports/${importId}/validate-ai`);
  return response.data;
}

export async function reviewNdieCandidate(candidateId: string, input: { decision: NdieReviewDecision; notes?: string; candidateJson?: unknown; answerJson?: unknown }) {
  const response = await apiClient.patch(`/ndie/questions/${candidateId}/review`, input);
  return response.data;
}

export async function bulkReviewNdieCandidates(importId: string, input: { candidateIds: string[]; decision: NdieReviewDecision; notes?: string }) {
  const response = await apiClient.patch(`/ndie/imports/${importId}/review/bulk`, input);
  return response.data;
}

export async function saveNdieReviewSession(importId: string, input: { selectedCandidateId?: string | null; selectedPageNumber?: number | null; filters?: Record<string, unknown>; scroll?: Record<string, unknown>; shortcuts?: Record<string, unknown> }) {
  const response = await apiClient.patch(`/ndie/imports/${importId}/review-session`, input);
  return response.data;
}

export async function publishNdieImport(importId: string, input: NdiePublishInput) {
  const response = await apiClient.post(`/ndie/imports/${importId}/publish`, input);
  return response.data;
}

export async function replayNdieImport(importId: string, input: { stages?: string[] } = {}) {
  const response = await apiClient.post(`/ndie/imports/${importId}/replay`, input);
  return response.data;
}

export async function getNdieReplayRuns(importId: string) {
  const response = await apiClient.get(`/ndie/imports/${importId}/replay-runs`);
  return response.data;
}

export async function generateNdieQualityReport(importId: string) {
  const response = await apiClient.post<NdieQualityScore>(`/ndie/imports/${importId}/quality-report`);
  return response.data;
}

export async function getNdieAnalytics() {
  const response = await apiClient.get("/ndie/analytics");
  return response.data;
}
