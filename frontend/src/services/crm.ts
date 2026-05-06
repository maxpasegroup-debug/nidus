import { apiClient } from "@/services/api";
import type { Admission, CounsellingBooking, FollowUp, Lead, LeadStatus, Referral } from "@/types/crm";

export async function getLeads(params?: { status?: LeadStatus; search?: string }) { return (await apiClient.get<{ leads: Lead[] }>("/crm/leads", { params })).data.leads; }
export async function createLead(payload: Omit<Lead, "id" | "createdAt" | "assignee" | "followUps">) { return (await apiClient.post<{ lead: Lead }>("/crm/leads", payload)).data.lead; }
export async function updateLead(payload: Partial<Omit<Lead, "createdAt" | "assignee" | "followUps">> & { id: string }) { const { id, ...data } = payload; return (await apiClient.put<{ lead: Lead }>(`/crm/leads/${id}`, data)).data.lead; }
export async function deleteLead(id: string) { return (await apiClient.delete<{ message: string }>(`/crm/leads/${id}`)).data; }
export async function getFollowups() { return (await apiClient.get<{ followUps: FollowUp[] }>("/crm/followups")).data.followUps; }
export async function createFollowup(payload: Pick<FollowUp, "leadId" | "followUpDate" | "remarks" | "status">) { return (await apiClient.post<{ followUp: FollowUp }>("/crm/followup", payload)).data.followUp; }
export async function getAdmissions() { return (await apiClient.get<{ admissions: Admission[] }>("/crm/admissions")).data.admissions; }
export async function createAdmission(payload: Pick<Admission, "studentId" | "courseId" | "admissionDate" | "paymentStatus" | "batch">) { return (await apiClient.post<{ admission: Admission }>("/crm/admission", payload)).data.admission; }
export async function getCounselling() { return (await apiClient.get<{ bookings: CounsellingBooking[] }>("/crm/counselling")).data.bookings; }
export async function createCounselling(payload: Pick<CounsellingBooking, "leadId" | "counsellorName" | "bookingDate" | "mode" | "status">) { return (await apiClient.post<{ booking: CounsellingBooking }>("/crm/counselling", payload)).data.booking; }
export async function getReferrals() { return (await apiClient.get<{ referrals: Referral[] }>("/crm/referrals")).data.referrals; }
export async function createReferral(payload: Pick<Referral, "referrerUserId" | "referredUserId" | "rewardStatus">) { return (await apiClient.post<{ referral: Referral }>("/crm/referrals", payload)).data.referral; }
