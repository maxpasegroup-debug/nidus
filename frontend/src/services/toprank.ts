import { apiClient } from "@/services/api";

export type ToprankExamSlug = "nda-army" | "nda-navy" | "nda-air-force" | "nda-naval-academy";
export type ToprankAdminTarget = "admin" | "ops";

export type ToprankStatus = {
  connected: boolean;
  profileSaved: boolean;
  diagnosticCompleted: boolean;
  roadmapApproved: boolean;
  todaysMission: string | null;
  readinessScore: number | null;
  nextAction: string;
};

export const toprankExamOptions: Array<{ label: string; value: ToprankExamSlug }> = [
  { label: "NDA Army", value: "nda-army" },
  { label: "NDA Navy", value: "nda-navy" },
  { label: "NDA Air Force", value: "nda-air-force" },
  { label: "NDA Naval Academy", value: "nda-naval-academy" }
];

export async function createToprankSession(examSlug: ToprankExamSlug) {
  const response = await apiClient.post<{ launchUrl: string }>("/toprank/session", { examSlug });
  return response.data;
}

export async function createToprankAdminSession(target: ToprankAdminTarget) {
  const response = await apiClient.post<{ launchUrl: string }>("/toprank/admin-session", { target });
  return response.data;
}

export async function getToprankStatus() {
  const response = await apiClient.get<ToprankStatus>("/toprank/status");
  return response.data;
}
