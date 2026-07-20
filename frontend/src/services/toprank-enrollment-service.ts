import type { TopRankBatch, TopRankEnrollment, TopRankOnboardingStatus, TopRankStudentProfile } from "@/types/toprank";
import { apiClient } from "./api";

export async function getTopRankOnboardingStatus(): Promise<TopRankOnboardingStatus> {
  const response = await apiClient.get<TopRankOnboardingStatus>("/toprank/onboarding");
  return response.data;
}

export async function saveTopRankProfile(payload: TopRankStudentProfile): Promise<{ profile: TopRankStudentProfile }> {
  const response = await apiClient.post<{ profile: TopRankStudentProfile }>("/toprank/onboarding/profile", payload);
  return response.data;
}

export async function getTopRankBatches(): Promise<{ batches: TopRankBatch[] }> {
  const response = await apiClient.get<{ batches: TopRankBatch[] }>("/toprank/batches");
  return response.data;
}

export async function selectTopRankBatch(batchId: string): Promise<{ enrollment: TopRankEnrollment }> {
  const response = await apiClient.post<{ enrollment: TopRankEnrollment }>("/toprank/onboarding/batch", { batchId });
  return response.data;
}

export async function acceptTopRankAgreement(): Promise<{ agreement: { accepted: boolean; acceptedAt?: string | null } }> {
  const response = await apiClient.post<{ agreement: { accepted: boolean; acceptedAt?: string | null } }>("/toprank/onboarding/agreement", { accepted: true });
  return response.data;
}

export async function completeTopRankEnrollment(): Promise<{ enrollment: TopRankEnrollment }> {
  const response = await apiClient.post<{ enrollment: TopRankEnrollment }>("/toprank/onboarding/complete");
  return response.data;
}

export async function getTopRankStudents(query = "") {
  const response = await apiClient.get<{ students: unknown[] }>("/toprank/admin/students", { params: query ? { q: query } : undefined });
  return response.data;
}

export async function getTopRankMentorBatches() {
  const response = await apiClient.get<{ batches: unknown[] }>("/toprank/mentor/batches");
  return response.data;
}
