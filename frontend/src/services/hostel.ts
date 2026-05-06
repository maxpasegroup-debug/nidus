import { apiClient } from "@/services/api";
import type { DisciplineRecord, Hostel, HostelAllocation, HostelLeave, InOutEntry, MessMenu, ParadePerformance, Room } from "@/types/hostel";

export async function getHostels() { return (await apiClient.get<{ hostels: Hostel[] }>("/hostels")).data.hostels; }
export async function createHostel(payload: Pick<Hostel, "name" | "type" | "totalRooms" | "wardenName">) { return (await apiClient.post<{ hostel: Hostel }>("/hostels", payload)).data.hostel; }
export async function getRooms(hostelId?: string) { return (await apiClient.get<{ rooms: Room[] }>("/rooms", { params: { hostelId } })).data.rooms; }
export async function createRoom(payload: Pick<Room, "hostelId" | "roomNumber" | "floor" | "capacity"> & { status?: string }) { return (await apiClient.post<{ room: Room }>("/rooms", payload)).data.room; }
export async function allocateHostel(payload: { studentId: string; hostelId: string; roomId: string; status?: string }) { return (await apiClient.post<{ allocation: HostelAllocation }>("/hostel/allocate", payload)).data.allocation; }
export async function getStudentHostel(id: string) { return (await apiClient.get(`/hostel/student/${id}`)).data; }
export async function createInOut(payload: { studentId: string; type: "IN" | "OUT"; entryTime?: string; remarks?: string }) { return (await apiClient.post<{ entry: InOutEntry }>("/hostel/inout", payload)).data.entry; }
export async function getInOutHistory(studentId?: string) { return (await apiClient.get<{ entries: InOutEntry[] }>("/hostel/inout/history", { params: { studentId } })).data.entries; }
export async function createLeave(payload: { studentId: string; reason: string; fromDate: string; toDate: string }) { return (await apiClient.post<{ leave: HostelLeave }>("/hostel/leave", payload)).data.leave; }
export async function getLeaves() { return (await apiClient.get<{ leaves: HostelLeave[] }>("/hostel/leave")).data.leaves; }
export async function updateLeave(payload: { id: string; status: "APPROVED" | "REJECTED" | "PENDING" }) { return (await apiClient.put<{ leave: HostelLeave }>(`/hostel/leave/${payload.id}`, { status: payload.status })).data.leave; }
export async function getMessMenu() { return (await apiClient.get<{ menu: MessMenu[] }>("/mess/menu")).data.menu; }
export async function createMessMenu(payload: Omit<MessMenu, "id">) { return (await apiClient.post<{ menu: MessMenu }>("/mess/menu", payload)).data.menu; }
export async function createDiscipline(payload: Omit<DisciplineRecord, "id" | "createdAt" | "recordedBy" | "student">) { return (await apiClient.post<{ record: DisciplineRecord }>("/discipline", payload)).data.record; }
export async function getDisciplineByStudent(studentId: string) { return (await apiClient.get<{ records: DisciplineRecord[] }>(`/discipline/student/${studentId}`)).data.records; }
export async function createParadePerformance(payload: Omit<ParadePerformance, "id" | "createdAt" | "student">) { return (await apiClient.post<{ performance: ParadePerformance }>("/parade", payload)).data.performance; }
export async function getParadeByStudent(studentId: string) { return (await apiClient.get<{ performances: ParadePerformance[] }>(`/parade/student/${studentId}`)).data.performances; }
