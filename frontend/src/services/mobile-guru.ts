import { apiClient } from "./api";

export type GuruQuestAdmin = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  introduction: string;
  status: string;
  locked: boolean;
  certificateTitle?: string | null;
  sortOrder: number;
};

export type GuruProgressAdmin = {
  id: string;
  userId: string;
  questId: string;
  status: string;
  completionPercent: number;
  updatedAt: string;
};

export async function getGuruAdminSummary() {
  return (await apiClient.get<{ summary: { quests: number; progress: number; certificates: number } }>("/mobile/guru/admin/summary")).data.summary;
}

export async function getGuruAdminQuests() {
  return (await apiClient.get<{ quests: GuruQuestAdmin[] }>("/mobile/guru/admin/quests")).data.quests;
}

export async function getGuruAdminProgress() {
  return (await apiClient.get<{ progress: GuruProgressAdmin[] }>("/mobile/guru/admin/progress")).data.progress;
}

export async function createGuruQuest(payload: Partial<GuruQuestAdmin>) {
  return (await apiClient.post<{ quest: GuruQuestAdmin }>("/mobile/guru/admin/quests", payload)).data.quest;
}
