import { apiClient } from "@/services/api";
import type { DailyFitnessLog, FitnessProfile, PhysicalEligibility, PTAttendance, PTSchedule } from "@/types/fitness";

export async function getFitnessProfile() { return (await apiClient.get<{ profile: FitnessProfile | null }>("/fitness/profile")).data.profile; }
export async function upsertFitnessProfile(payload: Partial<FitnessProfile> & Pick<FitnessProfile, "height" | "weight" | "runningTime" | "pushups" | "pullups" | "situps">) { return (await apiClient.post<{ profile: FitnessProfile; suggestions: string }>("/fitness/profile", payload)).data; }
export async function getPTSchedules() { return (await apiClient.get<{ schedules: PTSchedule[] }>("/fitness/pt-schedules")).data.schedules; }
export async function createPTSchedule(payload: Omit<PTSchedule, "id" | "createdAt">) { return (await apiClient.post<{ schedule: PTSchedule }>("/fitness/pt-schedules", payload)).data.schedule; }
export async function markPTAttendance(payload: { studentId: string; ptScheduleId: string; attendanceStatus: string; remarks?: string }) { return (await apiClient.post<{ attendance: PTAttendance }>("/fitness/attendance", payload)).data.attendance; }
export async function getPTAttendance(studentId: string) { return (await apiClient.get<{ attendance: PTAttendance[] }>(`/fitness/attendance/${studentId}`)).data.attendance; }
export async function getEligibility() { return (await apiClient.get<{ eligibility: PhysicalEligibility[] }>("/fitness/eligibility")).data.eligibility; }
export async function checkEligibility(payload: { userId?: string; examType: string }) { return (await apiClient.post<{ eligibility: PhysicalEligibility }>("/fitness/eligibility/check", payload)).data.eligibility; }
export async function createFitnessLog(payload: Omit<DailyFitnessLog, "id" | "createdAt" | "userId"> & { userId?: string }) { return (await apiClient.post<{ log: DailyFitnessLog }>("/fitness/log", payload)).data.log; }
export async function getFitnessLogs() { return (await apiClient.get<{ logs: DailyFitnessLog[] }>("/fitness/logs")).data.logs; }
