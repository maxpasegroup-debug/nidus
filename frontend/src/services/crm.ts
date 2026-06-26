import { apiClient } from "@/services/api";
import type { Admission, ApprovalRequest, CounsellingBooking, FollowUp, GuestApplicantResult, Lead, LeadStatus, Referral, ScholarshipDiscount } from "@/types/crm";

export async function getLeads(params?: { status?: LeadStatus; search?: string }) { return (await apiClient.get<{ leads: Lead[] }>("/crm/leads", { params })).data.leads; }
export async function createLead(payload: Omit<Lead, "id" | "createdAt" | "assignee" | "followUps">) { return (await apiClient.post<{ lead: Lead }>("/crm/leads", payload)).data.lead; }
export async function createGuestApplicant(payload: { fullName: string; mobile: string; email?: string; targetExam: string; source: string; parentName?: string; notes?: string }) { return (await apiClient.post<GuestApplicantResult>("/crm/guest-applicants", payload)).data; }
export async function createPublicLead(payload: { fullName: string; mobile: string; email: string; targetExam: string; source: string; studentClass?: string; message?: string }) { return (await apiClient.post<{ lead: Lead }>("/crm/public-leads", payload)).data.lead; }
export async function updateLead(payload: Partial<Omit<Lead, "createdAt" | "assignee" | "followUps">> & { id: string }) { const { id, ...data } = payload; return (await apiClient.put<{ lead: Lead }>(`/crm/leads/${id}`, data)).data.lead; }
export async function deleteLead(id: string) { return (await apiClient.delete<{ message: string }>(`/crm/leads/${id}`)).data; }
export async function getFollowups() { return (await apiClient.get<{ followUps: FollowUp[] }>("/crm/followups")).data.followUps; }
export async function createFollowup(payload: Pick<FollowUp, "leadId" | "followUpDate" | "remarks" | "status">) { return (await apiClient.post<{ followUp: FollowUp }>("/crm/followup", payload)).data.followUp; }
export async function getAdmissions() { return (await apiClient.get<{ admissions: Admission[] }>("/crm/admissions")).data.admissions; }
export async function createAdmission(payload: Pick<Admission, "studentId" | "courseId" | "admissionDate" | "paymentStatus" | "batch"> & Partial<Pick<Admission, "leadId" | "instituteId" | "branchId" | "admissionMode" | "totalFee" | "remarks">>) { return (await apiClient.post<{ admission: Admission }>("/crm/admission", payload)).data.admission; }
export async function approveAdmission(payload: { id: string; approved: boolean; remarks?: string; batch?: string; instituteId?: string; branchId?: string }) { const { id, ...data } = payload; return (await apiClient.post<{ admission: Admission }>(`/crm/admissions/${id}/approval`, data)).data.admission; }
export async function getApprovals() { return (await apiClient.get<{ approvals: ApprovalRequest[] }>("/crm/approvals")).data.approvals; }
export async function createScholarship(payload: Pick<ScholarshipDiscount, "studentId" | "type" | "title" | "amount" | "reason"> & { admissionId?: string }) { return (await apiClient.post<{ scholarship: ScholarshipDiscount }>("/crm/scholarships", payload)).data.scholarship; }
export async function reviewScholarship(payload: { id: string; approved: boolean; remarks?: string }) { const { id, ...data } = payload; return (await apiClient.post<{ scholarship: ScholarshipDiscount }>(`/crm/scholarships/${id}/review`, data)).data.scholarship; }
export async function getCounselling() { return (await apiClient.get<{ bookings: CounsellingBooking[] }>("/crm/counselling")).data.bookings; }
export async function createCounselling(payload: Pick<CounsellingBooking, "leadId" | "counsellorName" | "bookingDate" | "mode" | "status">) { return (await apiClient.post<{ booking: CounsellingBooking }>("/crm/counselling", payload)).data.booking; }
export async function getReferrals() { return (await apiClient.get<{ referrals: Referral[] }>("/crm/referrals")).data.referrals; }
export async function createReferral(payload: Pick<Referral, "referrerUserId" | "referredUserId" | "rewardStatus">) { return (await apiClient.post<{ referral: Referral }>("/crm/referrals", payload)).data.referral; }
