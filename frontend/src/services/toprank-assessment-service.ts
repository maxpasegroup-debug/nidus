import type { TopRankAssessmentStatus } from "@/types/toprank";
import { apiClient } from "./api";

export type TopRankAssessmentPayload = Record<string, string | number | boolean>;

export async function getTopRankAssessmentStatus(): Promise<TopRankAssessmentStatus> {
  const response = await apiClient.get<TopRankAssessmentStatus>("/toprank/assessment");
  return response.data;
}

export async function submitTopRankAssessment(payload: TopRankAssessmentPayload): Promise<TopRankAssessmentStatus> {
  const response = await apiClient.post<TopRankAssessmentStatus>("/toprank/assessment", payload);
  return response.data;
}

