import { apiClient } from "@/services/api";
import type { PerformanceAnalytics, RevisionSchedule, StudyPlan } from "@/types/ai-planner";

export type GeneratePlanPayload = {
  targetExam: string;
  studyHoursPerDay: number;
  targetDate: string;
  strengths: string[];
  weaknesses: string[];
};

export async function generateStudyPlan(payload: GeneratePlanPayload) {
  const response = await apiClient.post<{ plan: StudyPlan }>("/ai-planner/generate", payload);
  return response.data.plan;
}

export async function getStudyPlan() {
  const response = await apiClient.get<{ plan: StudyPlan | null }>("/ai-planner/my-plan");
  return response.data.plan;
}

export async function getPerformanceAnalytics() {
  const response = await apiClient.get<{ analytics: PerformanceAnalytics }>("/analytics/performance");
  return response.data.analytics;
}

export async function getRecommendations() {
  const response = await apiClient.get<{ recommendations: string[]; weakTopicAnalysis: unknown[] }>("/analytics/recommendations");
  return response.data;
}

export async function createRevision(payload: { topic: string; revisionDate: string; priority: string }) {
  const response = await apiClient.post<{ revision: RevisionSchedule }>("/revision-schedule/create", payload);
  return response.data.revision;
}

export async function getRevisionSchedule() {
  const response = await apiClient.get<{ revisions: RevisionSchedule[] }>("/revision-schedule");
  return response.data.revisions;
}
