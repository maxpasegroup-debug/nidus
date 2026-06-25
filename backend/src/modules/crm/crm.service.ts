import { prisma } from "../../config/prisma.js";
import { Role, type CounsellingMode, type LeadStatus } from "../../generated/prisma/client.js";
import { crmNotificationService } from "./crm-notification.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true } as const;
const leadInclude = { assignee: { select: userSelect }, followUps: { orderBy: { followUpDate: "asc" as const }, take: 3 } } as const;
type Requester = { id: string; role: Role; instituteId?: string | null; branchId?: string | null };

function canApprove(requester: Requester) {
  return requester.role === Role.ADMIN || requester.role === Role.DIRECTOR;
}

function assertCanApprove(requester: Requester) {
  if (!canApprove(requester)) throw new Error("Approval requires admin or director access");
}

function isLeadOwnerScoped(requester?: Requester) {
  return requester?.role === Role.BUSINESS_DEVELOPMENT_EXECUTIVE || requester?.role === Role.TELECALLER || requester?.role === Role.MARKETING_COORDINATOR;
}

async function assertLeadAccess(requester: Requester, leadId: string) {
  if (!isLeadOwnerScoped(requester)) return;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { assignedTo: true } });
  if (!lead || lead.assignedTo !== requester.id) throw new Error("Lead access denied");
}

function normalizeLeadEmail(input: { email?: string; mobile: string }) {
  const email = input.email?.trim().toLowerCase();
  return email || `${input.mobile.trim()}@lead.nidus.local`;
}

export const crmService = {
  leads(filters: { status?: LeadStatus; search?: string }, requester?: Requester) {
    return prisma.lead.findMany({
      where: {
        status: filters.status,
        assignedTo: isLeadOwnerScoped(requester) ? requester?.id : undefined,
        OR: filters.search ? [
          { fullName: { contains: filters.search, mode: "insensitive" } },
          { mobile: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { targetExam: { contains: filters.search, mode: "insensitive" } }
        ] : undefined
      },
      orderBy: { createdAt: "desc" },
      include: leadInclude
    });
  },
  createLead(requester: Requester, input: { fullName: string; mobile: string; email?: string; targetExam: string; source: string; status?: LeadStatus; assignedTo?: string; notes?: string }) {
    return prisma.lead.create({
      data: {
        ...input,
        email: normalizeLeadEmail(input),
        status: input.status ?? "NEW",
        assignedTo: isLeadOwnerScoped(requester) ? requester.id : input.assignedTo
      },
      include: leadInclude
    });
  },
  async createPublicLead(input: { fullName: string; mobile: string; email: string; targetExam: string; source: string; studentClass?: string; message?: string }) {
    const email = input.email.trim().toLowerCase();
    const mobile = input.mobile.trim();
    const notes = [
      "APPLICATION_STATUS: SUBMITTED",
      "AO_QUEUE: YES",
      input.studentClass ? `Student Class: ${input.studentClass}` : "",
      input.message ? `Message: ${input.message}` : "",
      "Public website enquiry. Follow up quickly."
    ].filter(Boolean).join("\n");
    const existing = await prisma.lead.findFirst({
      where: { OR: [{ email }, { mobile }] },
      orderBy: { createdAt: "desc" }
    });

    if (existing) {
      const previousNotes = existing.notes ? `${existing.notes}\n\n` : "";
      return prisma.lead.update({
        where: { id: existing.id },
        data: {
          fullName: input.fullName,
          mobile,
          email,
          targetExam: input.targetExam,
          source: input.source,
          status: existing.status === "LOST" ? "NEW" : existing.status,
          notes: `${previousNotes}[${new Date().toISOString()}] ${notes}`
        },
        include: leadInclude
      });
    }

    return prisma.lead.create({
      data: {
        fullName: input.fullName,
        mobile,
        email,
        targetExam: input.targetExam,
        source: input.source,
        status: "NEW",
        notes
      },
      include: leadInclude
    });
  },
  async updateLead(requester: Requester, id: string, input: Partial<{ fullName: string; mobile: string; email: string; targetExam: string; source: string; status: LeadStatus; assignedTo: string | null; notes: string }>) {
    await assertLeadAccess(requester, id);
    if (isLeadOwnerScoped(requester)) delete input.assignedTo;
    return prisma.lead.update({ where: { id }, data: input, include: leadInclude });
  },
  async deleteLead(requester: Requester, id: string) {
    await assertLeadAccess(requester, id);
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id }, select: { notes: true } });
    const previousNotes = lead.notes ? `${lead.notes}\n\n` : "";
    await prisma.lead.update({
      where: { id },
      data: {
        status: "LOST",
        notes: `${previousNotes}[${new Date().toISOString()}] Archived by ${requester.role}.`
      }
    });
    return { message: "Lead archived successfully" };
  },
  async createFollowUp(requester: Requester, input: { leadId: string; followUpDate: string; remarks: string; status: string }) {
    await assertLeadAccess(requester, input.leadId);
    const followUp = await prisma.followUp.create({
      data: { ...input, followUpDate: new Date(input.followUpDate), createdBy: requester.id },
      include: { lead: true, creator: { select: userSelect } }
    });
    await crmNotificationService.scheduleAutomatedNotification({
      recipient: followUp.lead.mobile,
      message: `Follow-up scheduled for ${followUp.lead.fullName}`,
      context: { followUpId: followUp.id, leadId: followUp.leadId }
    });
    return followUp;
  },
  followUps(requester?: Requester) {
    return prisma.followUp.findMany({
      where: isLeadOwnerScoped(requester) ? { lead: { assignedTo: requester?.id } } : undefined,
      orderBy: { followUpDate: "asc" },
      include: { lead: true, creator: { select: userSelect } }
    });
  },
  admissions(requester?: Requester) {
    return prisma.admission.findMany({
      where: requester?.role === Role.DIRECTOR ? { instituteId: requester.instituteId ?? undefined, branchId: requester.branchId ?? undefined } : undefined,
      orderBy: { admissionDate: "desc" },
      include: { student: { select: userSelect }, course: true, lead: true, approvals: true, feePlans: { include: { installments: true } } }
    });
  },
  async createAdmission(requester: Requester, input: { leadId?: string; studentId: string; courseId: string; instituteId?: string; branchId?: string; admissionDate: string; paymentStatus?: string; batch: string; admissionMode?: string; totalFee?: number; remarks?: string }) {
    const totalFee = input.totalFee ?? 0;
    const admission = await prisma.admission.create({
      data: {
        leadId: input.leadId,
        studentId: input.studentId,
        courseId: input.courseId,
        instituteId: input.instituteId ?? requester.instituteId ?? undefined,
        branchId: input.branchId ?? requester.branchId ?? undefined,
        admissionDate: new Date(input.admissionDate),
        paymentStatus: input.paymentStatus ?? "PENDING",
        batch: input.batch,
        admissionMode: input.admissionMode ?? "ONLINE",
        totalFee,
        dueAmount: totalFee,
        remarks: input.remarks,
        status: "PENDING_APPROVAL",
        approvalStatus: "PENDING"
      },
      include: { student: { select: userSelect }, course: true, lead: true }
    });
    await prisma.approvalRequest.create({
      data: {
        type: "ADMISSION_APPROVAL",
        requesterId: requester.id,
        admissionId: admission.id,
        targetType: "Admission",
        targetId: admission.id,
        amount: totalFee,
        reason: "Admission requires approval",
        metadata: { admissionMode: admission.admissionMode, batch: admission.batch }
      }
    });
    return admission;
  },
  async approveAdmission(requester: Requester, id: string, input: { approved: boolean; remarks?: string; batch?: string; instituteId?: string; branchId?: string }) {
    assertCanApprove(requester);
    const admission = await prisma.admission.findUniqueOrThrow({ where: { id } });
    if (requester.role === Role.DIRECTOR) {
      if (requester.instituteId && admission.instituteId && requester.instituteId !== admission.instituteId) throw new Error("Institute access denied");
      if (requester.branchId && admission.branchId && requester.branchId !== admission.branchId) throw new Error("Branch access denied");
    }
    const status = input.approved ? "APPROVED" : "REJECTED";
    await prisma.approvalRequest.updateMany({
      where: { admissionId: id, type: "ADMISSION_APPROVAL", status: "PENDING" },
      data: { status, reviewerId: requester.id, reviewedAt: new Date(), remarks: input.remarks }
    });
    return prisma.admission.update({
      where: { id },
      data: {
        status: input.approved ? "ENROLLED" : "REJECTED",
        approvalStatus: status,
        approvedBy: input.approved ? requester.id : admission.approvedBy,
        approvedAt: input.approved ? new Date() : admission.approvedAt,
        onboardingStatus: input.approved ? "IN_PROGRESS" : admission.onboardingStatus,
        batch: input.batch ?? admission.batch,
        instituteId: input.instituteId ?? admission.instituteId,
        branchId: input.branchId ?? admission.branchId,
        remarks: input.remarks ?? admission.remarks
      },
      include: { student: { select: userSelect }, course: true, approvals: true }
    });
  },
  approvals(requester: Requester) {
    return prisma.approvalRequest.findMany({
      where: requester.role === Role.DIRECTOR ? { status: "PENDING" } : undefined,
      orderBy: { requestedAt: "desc" },
      include: { requester: { select: userSelect }, reviewer: { select: userSelect }, admission: { include: { student: { select: userSelect }, course: true } } }
    });
  },
  async createScholarship(requester: Requester, input: { studentId: string; admissionId?: string; type: string; title: string; amount: number; reason?: string }) {
    const record = await prisma.scholarshipDiscount.create({
      data: { ...input, requestedBy: requester.id, status: "PENDING" },
      include: { student: { select: userSelect } }
    });
    await prisma.approvalRequest.create({
      data: {
        type: input.type === "FEE_WAIVER" ? "FEE_WAIVER_APPROVAL" : "DISCOUNT_APPROVAL",
        requesterId: requester.id,
        admissionId: input.admissionId,
        targetType: "ScholarshipDiscount",
        targetId: record.id,
        amount: input.amount,
        reason: input.reason
      }
    });
    return record;
  },
  async reviewScholarship(requester: Requester, id: string, input: { approved: boolean; remarks?: string }) {
    assertCanApprove(requester);
    const status = input.approved ? "APPROVED" : "REJECTED";
    await prisma.approvalRequest.updateMany({
      where: { targetType: "ScholarshipDiscount", targetId: id, status: "PENDING" },
      data: { status, reviewerId: requester.id, reviewedAt: new Date(), remarks: input.remarks }
    });
    return prisma.scholarshipDiscount.update({
      where: { id },
      data: { status, approvedBy: input.approved ? requester.id : undefined, approvedAt: input.approved ? new Date() : undefined },
      include: { student: { select: userSelect }, approver: { select: userSelect } }
    });
  },
  counselling(requester?: Requester) {
    return prisma.counsellingBooking.findMany({
      where: isLeadOwnerScoped(requester) ? { lead: { assignedTo: requester?.id } } : undefined,
      orderBy: { bookingDate: "asc" },
      include: { lead: true }
    });
  },
  async createCounselling(requester: Requester, input: { leadId: string; counsellorName: string; bookingDate: string; mode: CounsellingMode; status: string }) {
    await assertLeadAccess(requester, input.leadId);
    const booking = await prisma.counsellingBooking.create({
      data: { ...input, bookingDate: new Date(input.bookingDate) },
      include: { lead: true }
    });
    await crmNotificationService.sendWhatsAppReminder({
      recipient: booking.lead.mobile,
      message: `Counselling booked with ${booking.counsellorName}`,
      context: { bookingId: booking.id, mode: booking.mode }
    });
    return booking;
  },
  referrals() {
    return prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: { referrer: { select: userSelect }, referred: { select: userSelect } }
    });
  },
  async createReferral(input: { referrerUserId: string; referredUserId: string; rewardStatus: string }) {
    const referral = await prisma.referral.create({
      data: input,
      include: { referrer: { select: userSelect }, referred: { select: userSelect } }
    });
    await crmNotificationService.sendSmsFollowup({
      recipient: referral.referrer.mobile,
      message: `Referral reward status: ${referral.rewardStatus}`,
      context: { referralId: referral.id }
    });
    return referral;
  }
};
