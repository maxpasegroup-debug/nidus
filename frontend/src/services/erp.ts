import { apiClient } from "@/services/api";
import type { Announcement, Attendance, Faculty, Payroll, Timetable } from "@/types/erp";

export async function getClassAttendance() { return (await apiClient.get<{ attendance: Attendance[] }>("/attendance/class")).data.attendance; }
export async function markAttendance(payload: { userId: string; date: string; status: string }) { return (await apiClient.post<{ attendance: Attendance }>("/attendance/mark", payload)).data.attendance; }
export async function getTimetable() { return (await apiClient.get<{ timetable: Timetable[] }>("/timetable")).data.timetable; }
export async function createTimetable(payload: Omit<Timetable, "id" | "createdAt">) { return (await apiClient.post<{ timetable: Timetable }>("/timetable", payload)).data.timetable; }
export async function getFaculty() { return (await apiClient.get<{ faculty: Faculty[] }>("/faculty")).data.faculty; }
export async function createFaculty(payload: { userId: string; department: string; designation: string; joiningDate: string; salary: number; status: string }) { return (await apiClient.post<{ faculty: Faculty }>("/faculty", payload)).data.faculty; }
export async function getPayroll() { return (await apiClient.get<{ payroll: Payroll[] }>("/payroll")).data.payroll; }
export async function createPayroll(payload: { facultyId: string; month: string; basicSalary: number; incentives: number; deductions: number; paidStatus: string }) { return (await apiClient.post<{ payroll: Payroll }>("/payroll", payload)).data.payroll; }
export async function getAnnouncements() { return (await apiClient.get<{ announcements: Announcement[] }>("/announcements")).data.announcements; }
export async function createAnnouncement(payload: { title: string; description: string; targetAudience: string }) { return (await apiClient.post<{ announcement: Announcement }>("/announcements", payload)).data.announcement; }
