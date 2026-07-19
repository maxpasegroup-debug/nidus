import { prisma } from "../../config/prisma.js";
import { Role, type CounsellingMode, type LeadStatus } from "../../generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { DEFAULT_ACCOUNT_PIN } from "../auth/auth.v2.service.js";
import { crmNotificationService } from "./crm-notification.service.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

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

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeGuestEmail(input: { email?: string; mobile: string }) {
  const email = input.email?.trim().toLowerCase();
  if (email) return email;
  const digits = input.mobile.replace(/\D/g, "");
  return `guest.${digits}@nidusacademy.in`;
}

function leadNoteEntry(title: string, lines: string[]) {
  const body = lines.filter(Boolean).join("\n");
  return `[${new Date().toISOString()}] ${title}${body ? `\n${body}` : ""}`;
}

type BulkLeadInput = {
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  source: string;
  notes?: string;
  assignedTo?: string;
};

async function activeLeadExecutives() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR] },
      isDisabled: false,
    },
    select: { id: true, name: true, email: true, mobile: true, role: true, roleMetadata: true },
    orderBy: { createdAt: "asc" },
  });
  return users.filter((user) => metadataObject(user.roleMetadata).status !== "ARCHIVED");
}

async function leadLoads(executiveIds: string[]) {
  if (!executiveIds.length) return new Map<string, number>();
  const rows = await prisma.lead.groupBy({
    by: ["assignedTo"],
    where: { assignedTo: { in: executiveIds }, status: { in: ["NEW", "CONTACTED", "COUNSELLING"] } },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.assignedTo || "", row._count._all]));
}

async function nextRoundRobinAssignee(index: number, manualAssignee: string | undefined, executives: Awaited<ReturnType<typeof activeLeadExecutives>>, loads: Map<string, number>) {
  if (manualAssignee && executives.some((executive) => executive.id === manualAssignee)) return manualAssignee;
  if (!executives.length) return undefined;
  const ordered = [...executives].sort((a, b) => (loads.get(a.id) ?? 0) - (loads.get(b.id) ?? 0) || a.name.localeCompare(b.name));
  const assignee = ordered[index % ordered.length];
  if (!assignee) return undefined;
  loads.set(assignee.id, (loads.get(assignee.id) ?? 0) + 1);
  return assignee.id;
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
  async createLead(requester: Requester, input: { fullName: string; mobile: string; email?: string; targetExam: string; source: string; status?: LeadStatus; assignedTo?: string; notes?: string }) {
    const lead = await prisma.lead.create({
      data: {
        ...input,
        email: normalizeLeadEmail(input),
        status: input.status ?? "NEW",
        assignedTo: isLeadOwnerScoped(requester) ? requester.id : input.assignedTo
      },
      include: leadInclude
    });
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "LEAD_CREATED",
      title: "Lead created",
      description: `${lead.fullName} enquiry created for ${lead.targetExam}.`,
      actor: requester,
      entityType: "Lead",
      entityId: lead.id,
      severity: "INFO",
      source: "WEB",
      metadata: { status: lead.status, assignedTo: lead.assignedTo, source: lead.source }
    });
    return lead;
  },
  async createBulkLeads(requester: Requester, input: { leads: BulkLeadInput[]; source?: string; notes?: string; allocationMode?: "ROUND_ROBIN" | "UNASSIGNED" }) {
    if (requester.role !== Role.ADMIN && requester.role !== Role.DIRECTOR) {
      throw Object.assign(new Error("Bulk lead import requires director or admin access"), { statusCode: 403 });
    }

    const cleaned = input.leads
      .map((lead) => ({
        fullName: lead.fullName.trim(),
        mobile: lead.mobile.trim(),
        email: lead.email?.trim().toLowerCase() || "",
        targetExam: lead.targetExam.trim(),
        source: (lead.source || input.source || "Director Import").trim(),
        notes: lead.notes?.trim() || input.notes?.trim() || "",
        assignedTo: lead.assignedTo?.trim() || undefined,
      }))
      .filter((lead) => lead.fullName && lead.mobile && lead.targetExam);

    const seen = new Set<string>();
    const unique = cleaned.filter((lead) => {
      const key = `${lead.mobile}|${lead.email}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const executives = input.allocationMode === "UNASSIGNED" ? [] : await activeLeadExecutives();
    const loads = await leadLoads(executives.map((executive) => executive.id));
    const results: Array<{ mobile: string; email?: string; status: "CREATED" | "SKIPPED"; reason?: string; lead?: unknown; assignedTo?: string | null }> = [];
    let createdIndex = 0;
    for (const lead of unique) {
      const email = normalizeLeadEmail({ email: lead.email, mobile: lead.mobile });
      const existing = await prisma.lead.findFirst({ where: { OR: [{ mobile: lead.mobile }, { email }] } });
      if (existing) {
        results.push({ mobile: lead.mobile, email, status: "SKIPPED", reason: "Duplicate mobile or email already exists" });
        continue;
      }
      const assignedTo = await nextRoundRobinAssignee(createdIndex, lead.assignedTo, executives, loads);

      const created = await prisma.lead.create({
        data: {
          fullName: lead.fullName,
          mobile: lead.mobile,
          email,
          targetExam: lead.targetExam,
          source: lead.source,
          status: "NEW",
          assignedTo,
          notes: leadNoteEntry("Director bulk import", [
            "APPLICATION_STATUS: IMPORTED",
            "AO_QUEUE: NO",
            `Imported By: ${requester.id}`,
            assignedTo ? `Assigned To: ${assignedTo}` : "Assigned To: Unassigned",
            lead.notes ? `Notes: ${lead.notes}` : "",
          ]),
        },
        include: leadInclude,
      });
      createdIndex += 1;
      results.push({ mobile: lead.mobile, email, status: "CREATED", lead: created, assignedTo });
      emitDomainEvent({
        category: "ADMISSION",
        eventName: "LEAD_CREATED",
        title: "Bulk lead created",
        description: `${created.fullName} imported for ${created.targetExam}.`,
        actor: requester,
        entityType: "Lead",
        entityId: created.id,
        severity: "INFO",
        source: "WEB",
        metadata: { bulk: true, assignedTo, source: created.source }
      });
    }

    return {
      created: results.filter((item) => item.status === "CREATED").length,
      skipped: results.filter((item) => item.status === "SKIPPED").length + (cleaned.length - unique.length),
      invalid: input.leads.length - cleaned.length,
      allocationMode: input.allocationMode === "UNASSIGNED" ? "UNASSIGNED" : "ROUND_ROBIN",
      assigneeCount: executives.length,
      results,
    };
  },
  async createGuestApplicant(requester: Requester, input: { fullName: string; mobile: string; email?: string; targetExam: string; source: string; parentName?: string; notes?: string }) {
    const mobile = input.mobile.trim();
    const email = normalizeGuestEmail({ email: input.email, mobile });
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile }] } });
    const now = new Date();
    const shouldUseDefaultPassword = !existingUser || existingUser.role === Role.GUEST;
    const baseMetadata = {
      ...(!existingUser || existingUser.role === Role.GUEST ? { dashboardTemplate: "GUEST_APPLICANT" } : {}),
      ...(shouldUseDefaultPassword ? { defaultPassword: true, defaultPin: true } : {}),
      admissionStage: "ENQUIRY_CREATED",
      createdFrom: "BDE_QUICK_GUEST",
      interestedProgram: input.targetExam,
      parentName: input.parentName || undefined,
      createdByBdeId: requester.id,
    };
    const defaultPasswordHash = shouldUseDefaultPassword ? await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12) : null;

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: input.fullName,
            email: existingUser.email,
            mobile: existingUser.mobile,
            isDisabled: false,
            lockedUntil: null,
            loginFailureCount: 0,
            ...(existingUser.role === Role.GUEST && defaultPasswordHash ? { password: defaultPasswordHash } : {}),
            roleMetadata: { ...metadataObject(existingUser.roleMetadata), ...baseMetadata, reusedForNewEnquiryAt: now.toISOString() },
            roleOnboardingStatus: existingUser.role === Role.STUDENT ? existingUser.roleOnboardingStatus : "PENDING",
            lastRoleActivityAt: now,
          },
          select: userSelect,
        })
      : await prisma.user.create({
          data: {
            name: input.fullName,
            email,
            mobile,
            password: defaultPasswordHash ?? await bcrypt.hash(DEFAULT_ACCOUNT_PIN, 12),
            role: Role.GUEST,
            emailVerified: Boolean(input.email),
            mobileVerified: false,
            isDisabled: false,
            roleOnboardingStatus: "PENDING",
            lastRoleActivityAt: now,
            roleMetadata: baseMetadata,
          },
          select: userSelect,
        });

    await prisma.roleActivity.create({
      data: {
        userId: user.id,
        role: user.role,
        activity: existingUser ? "BDE_REUSED_GUEST_APPLICANT" : "BDE_CREATED_GUEST_APPLICANT",
      },
    }).catch(() => undefined);

    const notes = leadNoteEntry("Guest login created by BDE", [
      "APPLICATION_STATUS: ENQUIRY_CREATED",
      "AO_QUEUE: NO",
      `Guest User ID: ${user.id}`,
      `Login Identity: ${user.mobile || user.email}`,
      input.parentName ? `Parent: ${input.parentName}` : "",
      input.notes ? `Notes: ${input.notes}` : "",
      "Temporary PIN issued through launch policy. Plaintext is not stored in metadata.",
    ]);
    const existingLead = await prisma.lead.findFirst({
      where: { OR: [{ email: user.email }, { mobile: user.mobile ?? mobile }] },
      orderBy: { createdAt: "desc" },
    });

    const lead = existingLead
      ? await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            fullName: input.fullName,
            mobile: user.mobile ?? mobile,
            email: user.email,
            targetExam: input.targetExam,
            source: input.source,
            status: existingLead.status === "LOST" ? "NEW" : existingLead.status,
            assignedTo: isLeadOwnerScoped(requester) ? requester.id : existingLead.assignedTo,
            notes: `${existingLead.notes ? `${existingLead.notes}\n\n` : ""}${notes}`,
          },
          include: leadInclude,
        })
      : await prisma.lead.create({
          data: {
            fullName: input.fullName,
            mobile: user.mobile ?? mobile,
            email: user.email,
            targetExam: input.targetExam,
            source: input.source,
            status: "NEW",
            assignedTo: isLeadOwnerScoped(requester) ? requester.id : undefined,
            notes,
          },
          include: leadInclude,
        });

    emitDomainEvent({
      category: "ADMISSION",
      eventName: "LEAD_CREATED",
      title: existingLead ? "Guest applicant lead updated" : "Guest applicant lead created",
      description: `${lead.fullName} guest applicant is ready for admission follow-up.`,
      actor: requester,
      entityType: "Lead",
      entityId: lead.id,
      severity: "INFO",
      source: "WEB",
      metadata: { userId: user.id, reusedExistingUser: Boolean(existingUser), leadStatus: lead.status }
    });

    return {
      user,
      lead,
      reusedExistingUser: Boolean(existingUser),
      temporaryPasswordIssued: !existingUser,
      loginIdentity: user.mobile || user.email,
      mustChangePassword: shouldUseDefaultPassword,
    };
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
      const lead = await prisma.lead.update({
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
      emitDomainEvent({
        category: "ADMISSION",
        eventName: "LEAD_UPDATED",
        title: "Public lead updated",
        description: `${lead.fullName} submitted a public enquiry again.`,
        entityType: "Lead",
        entityId: lead.id,
        severity: "INFO",
        source: "WEB",
        metadata: { source: lead.source, targetExam: lead.targetExam }
      });
      return lead;
    }

    const lead = await prisma.lead.create({
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "LEAD_CREATED",
      title: "Public lead created",
      description: `${lead.fullName} submitted a public enquiry for ${lead.targetExam}.`,
      entityType: "Lead",
      entityId: lead.id,
      severity: "INFO",
      source: "WEB",
      metadata: { source: lead.source, targetExam: lead.targetExam }
    });
    return lead;
  },
  async updateLead(requester: Requester, id: string, input: Partial<{ fullName: string; mobile: string; email: string; targetExam: string; source: string; status: LeadStatus; assignedTo: string | null; notes: string }>) {
    await assertLeadAccess(requester, id);
    if (isLeadOwnerScoped(requester)) delete input.assignedTo;
    const lead = await prisma.lead.update({ where: { id }, data: input, include: leadInclude });
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "LEAD_UPDATED",
      title: "Lead updated",
      description: `${lead.fullName} lead updated.`,
      actor: requester,
      entityType: "Lead",
      entityId: lead.id,
      severity: lead.status === "LOST" ? "WARNING" : "INFO",
      source: "WEB",
      metadata: { status: lead.status, assignedTo: lead.assignedTo }
    });
    return lead;
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "LEAD_UPDATED",
      title: "Lead archived",
      description: "Lead archived by admission team.",
      actor: requester,
      entityType: "Lead",
      entityId: id,
      severity: "WARNING",
      source: "WEB",
      metadata: { status: "LOST" }
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "FOLLOW_UP_CREATED",
      title: "Follow-up created",
      description: `Follow-up scheduled for ${followUp.lead.fullName}.`,
      actor: requester,
      entityType: "FollowUp",
      entityId: followUp.id,
      severity: "INFO",
      source: "WEB",
      metadata: { leadId: followUp.leadId, followUpDate: followUp.followUpDate, status: followUp.status }
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "ADMISSION_CREATED",
      title: "Admission created",
      description: `Admission created for ${admission.student.name}.`,
      actor: requester,
      entityType: "Admission",
      entityId: admission.id,
      severity: "INFO",
      source: "WEB",
      metadata: { courseId: admission.courseId, batch: admission.batch, totalFee }
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
    const reviewed = await prisma.admission.update({
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "ADMISSION_REVIEWED",
      title: input.approved ? "Admission approved" : "Admission rejected",
      description: `${reviewed.student.name} admission ${input.approved ? "approved" : "rejected"}.`,
      actor: requester,
      entityType: "Admission",
      entityId: reviewed.id,
      severity: input.approved ? "SUCCESS" : "WARNING",
      source: "WEB",
      metadata: { status: reviewed.status, approvalStatus: reviewed.approvalStatus, batch: reviewed.batch }
    });
    return reviewed;
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
    emitDomainEvent({
      category: "ADMISSION",
      eventName: "COUNSELLING_BOOKED",
      title: "Counselling booked",
      description: `Counselling booked for ${booking.lead.fullName}.`,
      actor: requester,
      entityType: "CounsellingBooking",
      entityId: booking.id,
      severity: "INFO",
      source: "WEB",
      metadata: { leadId: booking.leadId, bookingDate: booking.bookingDate, mode: booking.mode }
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
