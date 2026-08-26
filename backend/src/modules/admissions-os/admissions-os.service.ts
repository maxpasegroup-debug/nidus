import { Role, type LeadStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type AdmissionsActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
};

type AdmissionPipelineStep = {
  key: string;
  label: string;
  existingSource: string;
  actionRoute: string;
};

const admissionsRoles = new Set<Role>([
  Role.ADMIN,
  Role.DIRECTOR,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER,
  Role.MARKETING_COORDINATOR
]);

const leadOwnerRoles = new Set<Role>([Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR]);

const pipeline: AdmissionPipelineStep[] = [
  { key: "LEAD", label: "Lead", existingSource: "Lead", actionRoute: "/api/crm/leads" },
  { key: "FIRST_CONTACT", label: "First Contact", existingSource: "Lead.status = CONTACTED", actionRoute: "/api/crm/leads/:id" },
  { key: "FOLLOW_UP", label: "Follow-up", existingSource: "FollowUp", actionRoute: "/api/crm/followup" },
  { key: "COUNSELLING", label: "Counselling", existingSource: "CounsellingBooking", actionRoute: "/api/crm/counselling" },
  { key: "APPLICATION", label: "Application", existingSource: "Admission", actionRoute: "/api/crm/admission" },
  { key: "DOCUMENT_VERIFICATION", label: "Document Verification", existingSource: "Document + Admission approval notes", actionRoute: "/api/documents" },
  { key: "ADMISSION_APPROVAL", label: "Admission Approval", existingSource: "Admission.approvalStatus", actionRoute: "/api/crm/admissions/:id/approval" },
  { key: "FEE_COLLECTION", label: "Fee Collection", existingSource: "FeePlan, FeeInstallment, Payment", actionRoute: "/api/payments/manual" },
  { key: "BATCH_ALLOCATION", label: "Batch Allocation", existingSource: "BatchStudent", actionRoute: "/api/academy/admissions/approve" },
  { key: "STUDENT_ACTIVATION", label: "Student Activation", existingSource: "User.role = STUDENT", actionRoute: "/api/users" },
  { key: "PARENT_INVITATION", label: "Parent Invitation", existingSource: "ParentStudentInvitation + ParentStudentLink", actionRoute: "/api/parent-link" },
  { key: "WELCOME_KIT", label: "Welcome Kit", existingSource: "Notifications, Messages, Documents", actionRoute: "/api/messages" },
  { key: "ACADEMIC_PLANNER_ASSIGNMENT", label: "Academic Planner Assignment", existingSource: "Batch + AcademicCalendarItem", actionRoute: "/api/academic-os/batches/:batchId" }
];

function requireAdmissions(actor: AdmissionsActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!admissionsRoles.has(actor.role) && template !== "ADMISSION_CELL") {
    throw Object.assign(new Error("Admissions OS access required"), { statusCode: 403 });
  }
  if (actor.role !== Role.ADMIN && !actor.instituteId) {
    throw Object.assign(new Error("Institution scope is required for Admissions OS"), { statusCode: 403 });
  }
}

function isLeadOwnerScoped(actor: AdmissionsActor) {
  return leadOwnerRoles.has(actor.role);
}

function dayWindow(value = new Date()) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function monthWindow(value = new Date()) {
  const start = new Date(value);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function health(score: number) {
  if (score >= 75) return "GREEN";
  if (score >= 50) return "ORANGE";
  return "RED";
}

function money(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function leadWhere(actor: AdmissionsActor) {
  if (isLeadOwnerScoped(actor)) return { assignedTo: actor.id };
  return actor.instituteId
    ? { assignedTo: { not: null }, assignee: { instituteId: actor.instituteId } }
    : { id: "__missing_institute__" };
}

function activeLeadWhere(actor: AdmissionsActor) {
  return { ...leadWhere(actor), status: { in: ["NEW", "CONTACTED", "COUNSELLING"] as LeadStatus[] } };
}

function stageFromLead(lead: { status: LeadStatus; followUps?: unknown[]; counsellingBookings?: unknown[]; admissions?: Array<{ approvalStatus: string; paymentStatus: string; onboardingStatus: string }> }) {
  if (lead.status === "LOST") return "LOST";
  if (lead.status === "ENROLLED") return "STUDENT_ACTIVATION";
  const admission = lead.admissions?.[0];
  if (admission?.onboardingStatus && admission.onboardingStatus !== "PENDING") return "STUDENT_ACTIVATION";
  if (admission?.paymentStatus && admission.paymentStatus !== "PENDING") return "FEE_COLLECTION";
  if (admission?.approvalStatus === "APPROVED") return "ADMISSION_APPROVAL";
  if (admission) return "APPLICATION";
  if (lead.counsellingBookings?.length) return "COUNSELLING";
  if (lead.followUps?.length) return "FOLLOW_UP";
  if (lead.status === "CONTACTED") return "FIRST_CONTACT";
  return "LEAD";
}

async function auditView(actor: AdmissionsActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "admissions-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "ADMISSION",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Admissions OS operating view was used.",
    actor,
    entityType: "AdmissionsOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

export const admissionsOsService = {
  journey() {
    return {
      name: "NIDUS Admissions Operating System",
      principle: "Admissions should move as a guided journey from enquiry to batch allocation, student activation, parent invitation and academic planner access.",
      pipeline
    };
  },

  async dashboard(actor: AdmissionsActor) {
    requireAdmissions(actor);
    const { start, end } = dayWindow();
    const month = monthWindow();
    const ownerWhere = leadWhere(actor);
    const activeWhere = activeLeadWhere(actor);
    const admissionWhere = isLeadOwnerScoped(actor)
      ? { lead: ownerWhere }
      : { instituteId: actor.instituteId ?? "__missing_institute__" };

    const [
      leadsToday,
      activeLeads,
      contactMade,
      followUpsDue,
      counsellingToday,
      admissionsToday,
      pendingApprovals,
      approvalsToday,
      feePlans,
      paymentsToday,
      admissionsMonth,
      activeAdmissions,
      batchAllocations,
      parentInvitations,
      parentLinks,
      recentLeads
    ] = await Promise.all([
      prisma.lead.count({ where: { ...ownerWhere, createdAt: { gte: start, lt: end } } }),
      prisma.lead.count({ where: activeWhere }),
      prisma.lead.count({ where: { ...ownerWhere, status: { in: ["CONTACTED", "COUNSELLING", "ENROLLED"] } } }),
      prisma.followUp.count({
        where: {
          followUpDate: { lt: end },
          status: { not: "COMPLETED" },
          lead: ownerWhere
        }
      }),
      prisma.counsellingBooking.count({ where: { bookingDate: { gte: start, lt: end }, lead: ownerWhere } }),
      prisma.admission.count({ where: { ...admissionWhere, createdAt: { gte: start, lt: end } } }),
      prisma.admission.count({ where: { ...admissionWhere, approvalStatus: "PENDING" } }),
      prisma.admission.count({ where: { ...admissionWhere, approvedAt: { gte: start, lt: end }, approvalStatus: "APPROVED" } }),
      prisma.feePlan.aggregate({
        where: { status: "ACTIVE", createdAt: { gte: month.start, lt: month.end } },
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
        _count: { _all: true }
      }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: start, lt: end }, paymentStatus: { in: ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"] } },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.admission.count({ where: { ...admissionWhere, createdAt: { gte: month.start, lt: month.end } } }),
      prisma.admission.findMany({
        where: { ...admissionWhere, approvalStatus: "APPROVED" },
        select: { id: true, studentId: true, batch: true, onboardingStatus: true, paymentStatus: true, student: { select: { id: true, name: true, email: true, role: true, isDisabled: true } }, lead: { select: { fullName: true, assignedTo: true } } },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      prisma.batchStudent.findMany({ where: { status: "ACTIVE", batch: { instituteId: actor.instituteId ?? "__missing_institute__" } }, select: { studentId: true, batchId: true, batch: { select: { id: true, name: true, programSlug: true } } }, take: 500 }),
      prisma.parentStudentInvitation.count({ where: { createdAt: { gte: month.start, lt: month.end }, student: { instituteId: actor.instituteId ?? "__missing_institute__" } } }),
      prisma.parentStudentLink.count({ where: { status: "ACTIVE", student: { instituteId: actor.instituteId ?? "__missing_institute__" } } }),
      prisma.lead.findMany({
        where: activeWhere,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          followUps: { orderBy: { followUpDate: "asc" }, take: 2 },
          counsellingBookings: { orderBy: { bookingDate: "asc" }, take: 1 },
          admissions: { orderBy: { createdAt: "desc" }, take: 1 }
        },
        orderBy: { createdAt: "desc" },
        take: 12
      })
    ]);

    const allocatedStudentIds = new Set(batchAllocations.map((item) => item.studentId));
    const approvedUnallocated = activeAdmissions.filter((admission) => !allocatedStudentIds.has(admission.studentId));
    const activeStudents = activeAdmissions.filter((admission) => admission.student.role === Role.STUDENT && !admission.student.isDisabled);
    const conversionPercentage = pct(admissionsMonth, activeLeads + admissionsMonth);
    const followUpLoadScore = followUpsDue ? Math.max(0, 100 - Math.min(followUpsDue, 50) * 2) : 100;
    const approvalScore = pendingApprovals ? Math.max(0, 100 - Math.min(pendingApprovals, 25) * 3) : 100;
    const allocationScore = pct(activeAdmissions.length - approvedUnallocated.length, activeAdmissions.length);
    const operatingScore = Math.round((conversionPercentage + followUpLoadScore + approvalScore + allocationScore) / 4);

    const alerts = [
      followUpsDue ? `${followUpsDue} follow-up(s) are due or overdue.` : "",
      pendingApprovals ? `${pendingApprovals} admission approval(s) need Director/Admin review.` : "",
      approvedUnallocated.length ? `${approvedUnallocated.length} approved student(s) still need batch allocation.` : "",
      activeAdmissions.length && activeStudents.length < activeAdmissions.length ? `${activeAdmissions.length - activeStudents.length} approved admission(s) need student activation check.` : "",
      feePlans._sum.dueAmount ? `${money(feePlans._sum.dueAmount)} fee due amount is active this month.` : ""
    ].filter(Boolean).slice(0, 8);

    const stageCounts = pipeline.reduce<Record<string, number>>((acc, step) => ({ ...acc, [step.key]: 0 }), {});
    for (const lead of recentLeads) {
      const stage = stageFromLead(lead);
      stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
    }

    const result = {
      name: "NIDUS Admissions Operating System",
      generatedAt: new Date().toISOString(),
      health: health(operatingScore),
      operatingScore,
      today: {
        leads: leadsToday,
        followUpsDue,
        counselling: counsellingToday,
        admissions: admissionsToday,
        approvals: approvalsToday,
        collections: paymentsToday._sum.amount ?? 0,
        collectionCount: paymentsToday._count._all
      },
      month: {
        admissions: admissionsMonth,
        feePlans: feePlans._count._all,
        feeBooked: feePlans._sum.totalAmount ?? 0,
        feeCollected: feePlans._sum.paidAmount ?? 0,
        feeDue: feePlans._sum.dueAmount ?? 0,
        conversionPercentage
      },
      pipeline: {
        steps: pipeline,
        stageCounts,
        activeLeads,
        contactMade,
        pendingApprovals,
        approvedUnallocated: approvedUnallocated.length,
        activeStudents: activeStudents.length,
        parentInvitations,
        parentLinks
      },
      queues: {
        followUpsDue,
        counsellingToday,
        pendingApprovals,
        approvedUnallocated: approvedUnallocated.map((admission) => ({
          admissionId: admission.id,
          studentId: admission.studentId,
          studentName: admission.student.name || admission.student.email,
          plannedBatch: admission.batch
        })).slice(0, 10)
      },
      alerts,
      roleWorkflow: this.roleWorkflow(actor.role),
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        mobile: lead.mobile,
        targetExam: lead.targetExam,
        status: lead.status,
        assignedTo: lead.assignee?.name || lead.assignee?.email || null,
        stage: stageFromLead(lead),
        nextFollowUp: lead.followUps[0]?.followUpDate?.toISOString() ?? null,
        counsellingAt: lead.counsellingBookings[0]?.bookingDate?.toISOString() ?? null,
        admissionId: lead.admissions[0]?.id ?? null,
        createdAt: lead.createdAt.toISOString()
      }))
    };

    await auditView(actor, "ADMISSIONS_OS_VIEWED", { operatingScore, followUpsDue, pendingApprovals });
    return result;
  },

  async leadJourney(actor: AdmissionsActor, leadId: string) {
    requireAdmissions(actor);
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...leadWhere(actor) },
      include: {
        assignee: { select: { id: true, name: true, email: true, role: true } },
        followUps: { orderBy: { followUpDate: "asc" } },
        counsellingBookings: { orderBy: { bookingDate: "asc" } },
        admissions: {
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { id: true, name: true, email: true, mobile: true, role: true, isDisabled: true } },
            course: { select: { id: true, title: true, slug: true } },
            feePlans: { include: { installments: true } }
          }
        }
      }
    });
    if (!lead) throw Object.assign(new Error("Lead not found"), { statusCode: 404 });
    if (!lead) throw Object.assign(new Error("Lead access denied"), { statusCode: 403 });

    const admission = lead.admissions[0];
    const batchLinks = admission
      ? await prisma.batchStudent.findMany({ where: { studentId: admission.studentId, batch: { instituteId: actor.instituteId ?? "__missing_institute__" } }, include: { batch: { select: { id: true, name: true, programSlug: true } } } })
      : [];
    const parentInvitations = admission ? await prisma.parentStudentInvitation.count({ where: { studentId: admission.studentId, student: { instituteId: actor.instituteId ?? "__missing_institute__" } } }) : 0;
    const parentLinks = admission ? await prisma.parentStudentLink.count({ where: { studentId: admission.studentId, status: "ACTIVE", student: { instituteId: actor.instituteId ?? "__missing_institute__" } } }) : 0;
    const documents = admission ? await prisma.document.count({ where: { uploadedBy: admission.studentId } }) : 0;

    const completed = new Set<string>();
    completed.add("LEAD");
    if (["CONTACTED", "COUNSELLING", "ENROLLED"].includes(lead.status)) completed.add("FIRST_CONTACT");
    if (lead.followUps.length) completed.add("FOLLOW_UP");
    if (lead.counsellingBookings.length) completed.add("COUNSELLING");
    if (admission) completed.add("APPLICATION");
    if (documents) completed.add("DOCUMENT_VERIFICATION");
    if (admission?.approvalStatus === "APPROVED") completed.add("ADMISSION_APPROVAL");
    if (admission?.feePlans.some((plan) => plan.paidAmount > 0) || admission?.paymentStatus !== "PENDING") completed.add("FEE_COLLECTION");
    if (batchLinks.length) completed.add("BATCH_ALLOCATION");
    if (admission?.student.role === Role.STUDENT && !admission.student.isDisabled) completed.add("STUDENT_ACTIVATION");
    if (parentInvitations || parentLinks) completed.add("PARENT_INVITATION");
    if (batchLinks.length) completed.add("ACADEMIC_PLANNER_ASSIGNMENT");

    const journey = pipeline.map((step) => ({
      ...step,
      status: completed.has(step.key) ? "DONE" : "PENDING"
    }));

    const nextStep = journey.find((step) => step.status === "PENDING") ?? null;
    const feeSummary = admission?.feePlans.reduce((summary, plan) => ({
      total: summary.total + plan.totalAmount,
      paid: summary.paid + plan.paidAmount,
      due: summary.due + plan.dueAmount,
      installments: summary.installments + plan.installments.length,
      pendingInstallments: summary.pendingInstallments + plan.installments.filter((item) => item.paidStatus !== "PAID").length
    }), { total: 0, paid: 0, due: 0, installments: 0, pendingInstallments: 0 }) ?? { total: 0, paid: 0, due: 0, installments: 0, pendingInstallments: 0 };

    const result = {
      lead: {
        id: lead.id,
        fullName: lead.fullName,
        mobile: lead.mobile,
        email: lead.email,
        targetExam: lead.targetExam,
        source: lead.source,
        status: lead.status,
        assignedTo: lead.assignee?.name || lead.assignee?.email || null,
        createdAt: lead.createdAt.toISOString()
      },
      journey,
      nextStep,
      followUps: lead.followUps.map((item) => ({ ...item, followUpDate: item.followUpDate.toISOString() })),
      counselling: lead.counsellingBookings.map((item) => ({ ...item, bookingDate: item.bookingDate.toISOString() })),
      admission: admission ? {
        id: admission.id,
        studentId: admission.studentId,
        studentName: admission.student.name || admission.student.email,
        course: admission.course.title,
        approvalStatus: admission.approvalStatus,
        paymentStatus: admission.paymentStatus,
        onboardingStatus: admission.onboardingStatus,
        batch: admission.batch,
        totalFee: admission.totalFee,
        paidAmount: admission.paidAmount,
        dueAmount: admission.dueAmount,
        studentActive: admission.student.role === Role.STUDENT && !admission.student.isDisabled
      } : null,
      feeSummary,
      batchAllocation: batchLinks.map((item) => ({ batchId: item.batchId, batchName: item.batch.name, programSlug: item.batch.programSlug, status: item.status })),
      parent: { invitations: parentInvitations, activeLinks: parentLinks },
      documents: { uploaded: documents }
    };

    await auditView(actor, "ADMISSIONS_OS_LEAD_VIEWED", { leadId, nextStep: nextStep?.key });
    return result;
  },

  roleWorkflow(role: Role) {
    if (role === Role.BUSINESS_DEVELOPMENT_EXECUTIVE || role === Role.TELECALLER || role === Role.MARKETING_COORDINATOR) {
      return [
        "Call today's assigned leads",
        "Update lead status",
        "Schedule follow-up",
        "Book counselling",
        "Add counselling notes",
        "Move ready leads to application"
      ];
    }
    if (role === Role.ADMINISTRATIVE_OFFICER) {
      return [
        "Check applications",
        "Verify admission details",
        "Check fee readiness",
        "Prepare batch allocation",
        "Coordinate parent invitation",
        "Confirm welcome handover"
      ];
    }
    return [
      "Review admission health",
      "Check pending approvals",
      "Check conversion",
      "Check fee collection",
      "Check batch allocation",
      "Ask NIDUS AI Director for admission risks"
    ];
  }
};
