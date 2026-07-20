import type { TopRankMission, TopRankMissionCalendarEntry, TopRankMissionDashboard } from "@/types/toprank";
import { apiClient } from "./api";

export async function getTopRankMissionDashboard(): Promise<TopRankMissionDashboard> {
  const response = await apiClient.get<TopRankMissionDashboard>("/toprank/missions");
  return response.data;
}

export async function generateTopRankMissions(force = false): Promise<TopRankMissionDashboard> {
  const response = await apiClient.post<TopRankMissionDashboard>("/toprank/missions/generate", { force });
  return response.data;
}

export async function getTopRankMissionCalendar(): Promise<{ month: TopRankMissionCalendarEntry[]; today: TopRankMissionCalendarEntry[]; upcoming: TopRankMission[] }> {
  const response = await apiClient.get<{ month: TopRankMissionCalendarEntry[]; today: TopRankMissionCalendarEntry[]; upcoming: TopRankMission[] }>("/toprank/missions/calendar");
  return response.data;
}

export async function getTopRankMissionDetail(missionId: string): Promise<{ mission: TopRankMission }> {
  const response = await apiClient.get<{ mission: TopRankMission }>(`/toprank/missions/${missionId}`);
  return response.data;
}

export async function completeTopRankMission(missionId: string, notes = ""): Promise<TopRankMissionDashboard> {
  const response = await apiClient.post<TopRankMissionDashboard>(`/toprank/missions/${missionId}/complete`, { notes });
  return response.data;
}
